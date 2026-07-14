import { createDatasetRefreshQueue } from '../../../src/calendar-float/widget/dataset-refresh-queue';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function createDeferred(): { promise: Promise<void>; resolve: () => void; reject: (reason: unknown) => void } {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((next, fail) => {
    resolve = next;
    reject = fail;
  });
  return { promise, resolve, reject };
}

async function testInvalidationStartsNewGenerationWithoutWaitingForOldRefresh(): Promise<void> {
  const gates = [createDeferred(), createDeferred()];
  const committedRuns: number[] = [];
  let runCount = 0;
  const queue = createDatasetRefreshQueue(async context => {
    const runIndex = runCount;
    runCount += 1;
    await gates[runIndex].promise;
    if (context.isCurrent()) {
      committedRuns.push(runIndex);
    }
  });

  const staleRefresh = queue.request();
  queue.invalidate();
  const currentRefresh = queue.request();

  assert(runCount === 2, '新 generation 不应该等待旧 refresh 完成');
  gates[1].resolve();
  await currentRefresh;
  assert(committedRuns.join(',') === '1', '只有当前 generation 可以提交结果');

  gates[0].resolve();
  await staleRefresh;
  assert(committedRuns.join(',') === '1', '旧 generation 恢复后不得污染新实例');
}

async function testConcurrentRequestsCoalesceToOneQueuedRefresh(): Promise<void> {
  const gates = [createDeferred(), createDeferred()];
  let runCount = 0;
  const queue = createDatasetRefreshQueue(async () => {
    const runIndex = runCount;
    runCount += 1;
    await gates[runIndex].promise;
  });

  const first = queue.request();
  const second = queue.request();
  const third = queue.request();
  assert(runCount === 1, '同一 generation 同时只能运行一个 refresh');

  gates[0].resolve();
  await Promise.resolve();
  await Promise.resolve();
  assert(runCount === 2, '并发请求应该合并成一次补充 refresh');

  gates[1].resolve();
  await Promise.all([first, second, third]);
  assert(runCount === 2, '同一批并发请求不应触发第三次 refresh');
}

async function testQueuedRefreshRunsAfterCurrentFailure(): Promise<void> {
  const gates = [createDeferred(), createDeferred()];
  let runCount = 0;
  const queue = createDatasetRefreshQueue(async () => {
    const runIndex = runCount;
    runCount += 1;
    await gates[runIndex].promise;
  });

  const first = queue.request();
  const queued = queue.request();
  gates[0].reject(new Error('第一次 refresh 失败'));
  await Promise.resolve();
  await Promise.resolve();

  assert(runCount === 2, '当前 refresh 失败后仍应执行 queued refresh');
  gates[1].resolve();
  await Promise.all([first, queued]);
}

async function testRequestInRejectionSettlementGapStartsFreshRun(): Promise<void> {
  const gates = [createDeferred(), createDeferred()];
  let runCount = 0;
  const queue = createDatasetRefreshQueue(async () => {
    const runIndex = runCount;
    runCount += 1;
    await gates[runIndex].promise;
  });

  const failed = queue.request().catch(() => undefined);
  let recoveryOutcome!: Promise<'resolved' | 'rejected'>;
  gates[0].reject(new Error('当前 refresh 失败'));
  await Promise.resolve().then(() =>
    Promise.resolve().then(() => {
      recoveryOutcome = queue.request().then(
        () => 'resolved',
        () => 'rejected',
      );
    }),
  );
  await failed;

  assert(runCount === 2, 'reject 与 finally 之间到达的请求必须启动 fresh run');
  gates[1].resolve();
  assert((await recoveryOutcome) === 'resolved', 'settlement gap 中的新请求不得复用已失败 Promise');
}

async function main(): Promise<void> {
  await testInvalidationStartsNewGenerationWithoutWaitingForOldRefresh();
  await testConcurrentRequestsCoalesceToOneQueuedRefresh();
  await testQueuedRefreshRunsAfterCurrentFailure();
  await testRequestInRejectionSettlementGapStartsFreshRun();
  console.log('widget/dataset-refresh-queue.check.ts OK');
}

void main();
