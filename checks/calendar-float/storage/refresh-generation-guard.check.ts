import _ from 'lodash';

import {
  ensureCalendarLatestMessageVariableStore,
  syncArchiveOnActiveRemoval,
} from '../../../src/calendar-float/storage';

interface Deferred {
  promise: Promise<void>;
  resolve: () => void;
}

function createDeferred(): Deferred {
  let resolve!: () => void;
  const promise = new Promise<void>(resolvePromise => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const variables = {
  chat: {} as Record<string, any>,
  message: {} as Record<string, any>,
};
let messageWrites = 0;
let chatWrites = 0;
let mvuReadyQueue: Deferred[] = [];
let mvuReadyWaits = 0;

(globalThis as any).Mvu = undefined;
(globalThis as any).getLastMessageId = () => 3;
(globalThis as any).waitGlobalInitialized = () => {
  mvuReadyWaits += 1;
  const deferred = mvuReadyQueue.shift();
  if (!deferred) {
    throw new Error('缺少 waitGlobalInitialized 测试 deferred');
  }
  return deferred.promise;
};
(globalThis as any).getVariables = (option: { type: 'chat' | 'message' }) => _.cloneDeep(variables[option.type]);
(globalThis as any).replaceVariables = (
  nextVariables: Record<string, any>,
  option: { type: 'chat' | 'message' },
) => {
  if (option.type === 'message') {
    messageWrites += 1;
  } else if (option.type === 'chat') {
    chatWrites += 1;
  }
  variables[option.type] = _.cloneDeep(nextVariables);
};

async function testExpiredEnsureDoesNotWriteMessageVariables(): Promise<void> {
  let current = true;
  const mvuReady = createDeferred();
  mvuReadyQueue = [mvuReady];
  mvuReadyWaits = 0;

  const ensurePromise = ensureCalendarLatestMessageVariableStore(() => current);
  current = false;
  mvuReady.resolve();
  await ensurePromise;

  assert(messageWrites === 0, '失效 generation 的 ensure 不得写入消息变量');
}

async function testExpiredArchiveSyncDoesNotWriteArchive(): Promise<void> {
  let current = true;
  const readReady = createDeferred();
  const writeReady = createDeferred();
  mvuReadyQueue = [readReady, writeReady];
  mvuReadyWaits = 0;
  _.set(variables.chat, 'calendar_float_store.archive.lastActiveSnapshot.临时.protected_event', {
    标题: '必须保留',
    标签: ['收藏'],
  });

  const syncPromise = syncArchiveOnActiveRemoval('', () => current);
  readReady.resolve();
  for (let index = 0; index < 10 && mvuReadyWaits < 2; index += 1) {
    await Promise.resolve();
  }
  assert(mvuReadyWaits === 2, '归档同步应该进入活动事件回写阶段');

  current = false;
  writeReady.resolve();
  await syncPromise;

  assert(messageWrites === 0, '失效 generation 的归档同步不得回写活动事件');
  assert(chatWrites === 0, '失效 generation 的归档同步不得写入归档');
}

async function main(): Promise<void> {
  await testExpiredEnsureDoesNotWriteMessageVariables();
  await testExpiredArchiveSyncDoesNotWriteArchive();
  console.log('refresh-generation-guard.check.ts OK');
}

void main();
