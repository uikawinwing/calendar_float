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

function installScannerHost(firstRead: Promise<WorldbookEntry[]>, secondRead?: Promise<WorldbookEntry[]>): {
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
      if (state.worldbookCalls === 2 && secondRead) {
        return await secondRead;
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
        {
          name: '[正常正文]',
          content: '这是正常正文',
        },
        {
          name: '[正常文本库]',
          content: '正文: 这是正常文本库正文',
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
    const healthyEntry = await resolveCalendarRuntimeNodeText({
      node: {
        id: 'healthy-entry',
        名称: '正常正文',
        条目: { 世界书: '索引世界书', 条目名: '[正常正文]' },
      },
      snapshot,
    });
    const healthyTextLibrary = snapshot.readTextLibrary({
      世界书: '索引世界书',
      条目名: '[正常文本库]',
      键: '正文',
    });
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

    assert(healthyEntry.正文 === '这是正常正文', '正常正文应该成功解析');
    assert(!healthyEntry.警告.includes(expectedError), '无关世界书读取错误不得附加到成功正文');
    assert(healthyTextLibrary.文本库.正文 === '这是正常文本库正文', '正常文本库应该成功解析');
    assert(!healthyTextLibrary.警告.includes(expectedError), '无关世界书读取错误不得附加到成功文本库');
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

async function testQueuedRequestRerunsAfterCurrentScanRejects(): Promise<void> {
  const host = installScannerHost(Promise.resolve([]));
  const runtimeHost = globalThis as any;
  let sourceDiscoveryCalls = 0;
  try {
    runtimeHost.getCharWorldbookNames = () => {
      sourceDiscoveryCalls += 1;
      if (sourceDiscoveryCalls === 1) {
        throw new Error('第一次来源发现失败');
      }
      return { primary: '队列世界书', additional: [] };
    };
    const first = requestCalendarRuntimeWorldbookScan();
    const queued = requestCalendarRuntimeWorldbookScan();

    await Promise.all([first, queued]);

    assert(sourceDiscoveryCalls === 2, '首轮失败后仍应重新发现来源并执行 queued rerun');
    assert(host.state.worldbookCalls === 1, '失败 scan 不应读取世界书，queued rerun 应读取一次');
    assert(host.state.variableWrites === 1, '只有成功的 queued rerun 应发布结果');
  } finally {
    host.restore();
  }
}

async function testRequestInCurrentErrorSettlementGapStartsFreshScan(): Promise<void> {
  const host = installScannerHost(Promise.resolve([]));
  const runtimeHost = globalThis as any;
  let sourceDiscoveryCalls = 0;
  try {
    runtimeHost.getCharWorldbookNames = () => {
      sourceDiscoveryCalls += 1;
      if (sourceDiscoveryCalls === 1) {
        throw new Error('当前 scan 来源发现失败');
      }
      return { primary: '队列世界书', additional: [] };
    };

    const failedRequest = requestCalendarRuntimeWorldbookScan();
    const failedOutcome = failedRequest.catch(() => undefined);
    let recoveryRequest!: Promise<void>;
    await Promise.resolve().then(() =>
      Promise.resolve().then(() =>
        Promise.resolve().then(() => {
          recoveryRequest = requestCalendarRuntimeWorldbookScan();
        }),
      ),
    );
    await failedOutcome;

    assert(recoveryRequest !== failedRequest, 'settlement gap 中的新 scan 必须获得 fresh Promise');
    await recoveryRequest;
    assert(sourceDiscoveryCalls === 2, 'settlement gap 中的新 request 应重新执行来源发现');
    assert(host.state.variableWrites === 1, '只有 fresh scan 应发布一次结果');
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

async function testNewGenerationRequestDoesNotWaitForStaleHungScan(): Promise<void> {
  const firstRead = deferred<WorldbookEntry[]>();
  const secondRead = deferred<WorldbookEntry[]>();
  const host = installScannerHost(firstRead.promise, secondRead.promise);
  try {
    const staleRequest = requestCalendarRuntimeWorldbookScan();
    await waitFor(() => host.state.worldbookCalls === 1, '旧 generation 应该启动第一次 scan');

    teardownCalendarRuntimeWorldbookScanner();
    const freshRequest = requestCalendarRuntimeWorldbookScan();
    let freshSettled = false;
    void freshRequest.then(() => {
      freshSettled = true;
    });

    assert(freshRequest !== staleRequest, '新 generation request 必须返回覆盖 fresh scan 的新 Promise');
    await waitFor(() => host.state.worldbookCalls === 2, '新 generation 不应等待旧 generation 的死 Promise');

    assert(host.state.maxActiveScans === 2, '只有跨 generation 失效切换时才允许短暂并发');
    assert(!freshSettled, 'fresh request Promise 必须等待 fresh scan 完成');
    assert(host.state.variableWrites === 0, '旧 generation scan 不得发布副作用');

    secondRead.resolve([]);
    await freshRequest;

    assert(host.state.worldbookCalls === 2, '新 generation 只应执行一次 fresh scan，不得多余 rerun');
    assert(host.state.variableWrites === 1, '只有 fresh generation 应发布一次结果');
    assert(host.state.promptInjections === 0, '空结果不应注入 prompt');
    console.log(
      `generation handoff OK: independentPromise=${freshRequest !== staleRequest}, maxActive=${host.state.maxActiveScans}, scans=${host.state.worldbookCalls}, writes=${host.state.variableWrites}`,
    );
  } finally {
    host.restore();
  }
}

async function testStaleGenerationErrorIsSilentButCurrentErrorStillRejects(): Promise<void> {
  const host = installScannerHost(Promise.resolve([]));
  const runtimeHost = globalThis as any;
  try {
    let sourceErrorMessage = '旧 generation 读取失败';
    runtimeHost.getCharWorldbookNames = () => {
      throw new Error(sourceErrorMessage);
    };
    let staleWarningLogs = 0;
    const staleRequest = requestCalendarRuntimeWorldbookScan().catch(() => {
      staleWarningLogs += 1;
    });
    teardownCalendarRuntimeWorldbookScanner();
    await staleRequest;

    assert(staleWarningLogs === 0, '失效 generation 的 rejection 不得触发 scanner 外层 warning log');

    sourceErrorMessage = '当前 generation 读取失败';
    const currentRequest = requestCalendarRuntimeWorldbookScan();
    let currentError: unknown = null;
    try {
      await currentRequest;
    } catch (error) {
      currentError = error;
    }

    assert(currentError instanceof Error, '当前 generation 的真实错误仍须通过 request Promise 暴露');
    assert(currentError.message === '当前 generation 读取失败', '当前 generation 应保留原始错误消息');
    console.log(`generation errors OK: staleWarnings=${staleWarningLogs}, currentError=${currentError.message}`);
  } finally {
    host.restore();
  }
}

async function main(): Promise<void> {
  await testConcurrentRequestsCollapseIntoOneQueuedFreshRerun();
  await testQueuedRequestRerunsAfterCurrentScanRejects();
  await testRequestInCurrentErrorSettlementGapStartsFreshScan();
  await testTeardownInvalidatesInFlightScanBeforeSideEffects();
  await testNewGenerationRequestDoesNotWaitForStaleHungScan();
  await testStaleGenerationErrorIsSilentButCurrentErrorStillRejects();
  await testSuccessfulReadIsInfoDiagnosticAndNotScannerWarning();
  await testSourceDiagnosticsPreserveErrorsAcrossOrdinaryAndTextLibraryResolution();
  console.log('scanner-concurrency.check.ts OK');
}

void main();
