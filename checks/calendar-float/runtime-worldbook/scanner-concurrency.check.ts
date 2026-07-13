import {
  requestCalendarRuntimeWorldbookScan,
  teardownCalendarRuntimeWorldbookScanner,
} from '../../../src/calendar-float/runtime-worldbook/scanner';
import { resolveCalendarRuntimeNodeText } from '../../../src/calendar-float/runtime-worldbook/resolver';
import { loadCalendarRuntimeWorldbookSnapshot } from '../../../src/calendar-float/runtime-worldbook/snapshot';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(accept => {
    resolve = accept;
  });
  return { promise, resolve };
}

async function waitFor(predicate: () => boolean, message: string): Promise<void> {
  for (let index = 0; index < 100; index += 1) {
    if (predicate()) {
      return;
    }
    await Promise.resolve();
  }
  throw new Error(message);
}

interface ScannerHostState {
  worldbookCalls: number;
  activeScans: number;
  maxActiveScans: number;
  variableWrites: number;
  promptInjections: number;
  infoLogs: number;
}

function installScannerHost(firstRead: Promise<WorldbookEntry[]>): {
  state: ScannerHostState;
  restore: () => void;
} {
  const host = globalThis as any;
  const previous = {
    getVariables: host.getVariables,
    getCharWorldbookNames: host.getCharWorldbookNames,
    getGlobalWorldbookNames: host.getGlobalWorldbookNames,
    getWorldbook: host.getWorldbook,
    updateVariablesWith: host.updateVariablesWith,
    injectPrompts: host.injectPrompts,
    uninjectPrompts: host.uninjectPrompts,
    toastr: host.toastr,
    getChatMessages: host.getChatMessages,
    getLastMessageId: host.getLastMessageId,
    consoleInfo: console.info,
  };
  const state: ScannerHostState = {
    worldbookCalls: 0,
    activeScans: 0,
    maxActiveScans: 0,
    variableWrites: 0,
    promptInjections: 0,
    infoLogs: 0,
  };

  host.getVariables = () => ({});
  host.getCharWorldbookNames = () => ({ primary: '队列世界书', additional: [] });
  host.getGlobalWorldbookNames = () => [];
  host.getWorldbook = async () => {
    state.worldbookCalls += 1;
    state.activeScans += 1;
    state.maxActiveScans = Math.max(state.maxActiveScans, state.activeScans);
    try {
      if (state.worldbookCalls === 1) {
        return await firstRead;
      }
      return [];
    } finally {
      state.activeScans -= 1;
    }
  };
  host.updateVariablesWith = () => {
    state.variableWrites += 1;
  };
  host.injectPrompts = () => {
    state.promptInjections += 1;
    return { uninject: () => undefined };
  };
  host.uninjectPrompts = () => undefined;
  host.toastr = { info: () => undefined, warning: () => undefined };
  host.getChatMessages = () => [];
  host.getLastMessageId = () => -1;
  console.info = () => {
    state.infoLogs += 1;
  };

  return {
    state,
    restore: () => {
      teardownCalendarRuntimeWorldbookScanner();
      host.getVariables = previous.getVariables;
      host.getCharWorldbookNames = previous.getCharWorldbookNames;
      host.getGlobalWorldbookNames = previous.getGlobalWorldbookNames;
      host.getWorldbook = previous.getWorldbook;
      host.updateVariablesWith = previous.updateVariablesWith;
      host.injectPrompts = previous.injectPrompts;
      host.uninjectPrompts = previous.uninjectPrompts;
      host.toastr = previous.toastr;
      host.getChatMessages = previous.getChatMessages;
      host.getLastMessageId = previous.getLastMessageId;
      console.info = previous.consoleInfo;
    },
  };
}

async function testSuccessfulReadIsInfoDiagnosticAndNotScannerWarning(): Promise<void> {
  const host = installScannerHost(
    Promise.resolve([
      {
        name: '[fixed_event_index]',
        content: '固定事件: []\n补充资料: []',
      } as WorldbookEntry,
    ]),
  );
  try {
    await requestCalendarRuntimeWorldbookScan();
    assert(host.state.worldbookCalls === 1, '成功读取测试应该执行一次 scan');
    assert(host.state.infoLogs === 0, '成功 source read 不应进入 scanner warning log');
  } finally {
    host.restore();
  }
}

async function testSourceDiagnosticsPreserveErrorsAcrossOrdinaryAndTextLibraryResolution(): Promise<void> {
  const host = globalThis as any;
  const previous = {
    getCharWorldbookNames: host.getCharWorldbookNames,
    getGlobalWorldbookNames: host.getGlobalWorldbookNames,
    getWorldbook: host.getWorldbook,
    toastr: host.toastr,
  };
  host.getCharWorldbookNames = () => ({ primary: '索引世界书', additional: [] });
  host.getGlobalWorldbookNames = () => [];
  host.getWorldbook = async (name: string) => {
    if (name === '索引世界书') {
      return [
        {
          name: '[fixed_event_index]',
          content: '固定事件: []\n补充资料: []',
        },
      ];
    }
    if (name === '损坏世界书') {
      throw new Error('原始读取错误');
    }
    return [];
  };
  host.toastr = { info: () => undefined, warning: () => undefined };

  try {
    const snapshot = await loadCalendarRuntimeWorldbookSnapshot({
      useChatBoundWorldbook: false,
      extraWorldbooks: ['损坏世界书'],
      devWorldbooks: [],
    });
    const diagnostics = snapshot.diagnostics;
    assert(Array.isArray(diagnostics), 'snapshot 应提供 diagnostics');
    const successDiagnostic = diagnostics.find(item => item.worldbookName === '索引世界书');
    assert(successDiagnostic?.level === 'info', '成功 source read 应记录为 info diagnostic');
    assert(!snapshot.warnings.some(item => item.includes('已读取「索引世界书」')), '成功 source read 不应进入 public warnings');

    const expectedError = '读取 worldbook「损坏世界书」失败：原始读取错误';
    const ordinary = await resolveCalendarRuntimeNodeText({
      node: {
        id: 'ordinary-error',
        名称: '普通条目错误',
        条目: { 世界书: '损坏世界书', 条目名: '[缺失正文]' },
      },
      snapshot,
    });
    const textLibrary = snapshot.readTextLibrary({
      世界书: '损坏世界书',
      条目名: '[缺失文本库]',
      键: '正文',
    });

    assert(ordinary.警告.includes(expectedError), '普通条目解析应保留原 worldbook 名与 error message');
    assert(textLibrary.警告.includes(expectedError), '文本库解析应保留原 worldbook 名与 error message');
    assert(
      diagnostics.some(
        item => item.level === 'error' && item.worldbookName === '损坏世界书' && item.message === expectedError,
      ),
      'source read error 应保留结构化 worldbook 与原始 message',
    );
    console.log(`diagnostics OK: info=${successDiagnostic?.message}, error=${expectedError}`);
  } finally {
    host.getCharWorldbookNames = previous.getCharWorldbookNames;
    host.getGlobalWorldbookNames = previous.getGlobalWorldbookNames;
    host.getWorldbook = previous.getWorldbook;
    host.toastr = previous.toastr;
  }
}

async function testConcurrentRequestsCollapseIntoOneQueuedFreshRerun(): Promise<void> {
  const firstRead = deferred<WorldbookEntry[]>();
  const host = installScannerHost(firstRead.promise);
  try {
    const first = requestCalendarRuntimeWorldbookScan();
    await waitFor(() => host.state.worldbookCalls === 1, '第一次 request 应该启动 scan');
    const second = requestCalendarRuntimeWorldbookScan();
    const third = requestCalendarRuntimeWorldbookScan();

    assert(host.state.worldbookCalls === 1, 'in-flight 期间不应并发启动第二个 scan');
    firstRead.resolve([]);
    await Promise.all([first, second, third]);

    assert(host.state.maxActiveScans === 1, `最大并发 scan 应为 1，实际 ${host.state.maxActiveScans}`);
    assert(host.state.worldbookCalls === 2, `并发请求应合并为恰好一次 queued rerun，实际 ${host.state.worldbookCalls}`);
    assert(host.state.variableWrites === 2, `两次实际 scan 都应发布一次结果，实际 ${host.state.variableWrites}`);
    console.log(
      `single-flight OK: maxActive=${host.state.maxActiveScans}, scans=${host.state.worldbookCalls}, writes=${host.state.variableWrites}`,
    );
  } finally {
    host.restore();
  }
}

async function testTeardownInvalidatesInFlightScanBeforeSideEffects(): Promise<void> {
  const firstRead = deferred<WorldbookEntry[]>();
  const host = installScannerHost(firstRead.promise);
  try {
    const request = requestCalendarRuntimeWorldbookScan();
    await waitFor(() => host.state.worldbookCalls === 1, 'teardown 测试应该启动 scan');
    teardownCalendarRuntimeWorldbookScanner();
    const effectsAfterTeardown = {
      variableWrites: host.state.variableWrites,
      promptInjections: host.state.promptInjections,
      infoLogs: host.state.infoLogs,
    };

    firstRead.resolve([]);
    await request;

    assert(host.state.worldbookCalls === 1, 'teardown 应清除 queued rerun');
    assert(host.state.variableWrites === effectsAfterTeardown.variableWrites, '失效 scan 不得写 chat variables');
    assert(host.state.promptInjections === effectsAfterTeardown.promptInjections, '失效 scan 不得注入 prompts');
    assert(host.state.infoLogs === effectsAfterTeardown.infoLogs, '失效 scan 不得写 scanner warning log');
    console.log(
      `teardown invalidation OK: writes=${host.state.variableWrites}, injections=${host.state.promptInjections}, logs=${host.state.infoLogs}`,
    );
  } finally {
    host.restore();
  }
}

async function main(): Promise<void> {
  await testConcurrentRequestsCollapseIntoOneQueuedFreshRerun();
  await testTeardownInvalidatesInFlightScanBeforeSideEffects();
  await testSuccessfulReadIsInfoDiagnosticAndNotScannerWarning();
  await testSourceDiagnosticsPreserveErrorsAcrossOrdinaryAndTextLibraryResolution();
  console.log('scanner-concurrency.check.ts OK');
}

void main();
