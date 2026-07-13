import { createManagedWorldbookFlow } from '../../../../src/calendar-float/widget/managed-worldbook/flow';
import type { CalendarManagedWorldbookDiagnostics } from '../../../../src/calendar-float/worldbook-manager';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function createDiagnostics(worldbookName = '命定之诗'): CalendarManagedWorldbookDiagnostics {
  return {
    worldbookName,
    version: 'v-test',
    connectivity: 'ready',
    existsInRegistry: true,
    foundByScript: true,
    createdDuringEnsure: false,
    updatedDuringEnsure: false,
    lastEnsureSucceeded: true,
    lastImportTriggered: false,
    entryCount: 2,
    hasMetaEntry: false,
    hasUpdateRulesEntry: true,
    hasVariableListEntry: true,
    runtimeIndexWorldbookName: '索引世界书',
    runtimeContentWorldbookNames: ['正文世界书'],
    managedEntryCount: 2,
    expectedManagedEntryCount: 2,
    allManagedEntriesPresent: true,
    managementEnabled: true,
    lastError: '',
    lastEnsureAt: '',
    lastImportAt: '',
    sourceItems: [
      {
        group: 'event',
        label: '事件',
        sourceWorldbookName: '正文世界书',
        entryName: '[event]',
        found: true,
      },
    ],
  };
}

function deferred<T>(): {
  promise: Promise<T>;
  resolve(value: T): void;
  reject(reason: unknown): void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });
  return { promise, resolve, reject };
}

const candidate = {
  id: 'event::one',
  label: '事件一',
  kind: 'runtime_content' as const,
  sourceGroup: 'event' as const,
  sourceWorldbookName: '正文世界书',
  entryName: '[event_one]',
  entry: { name: '[event_one]', extra: { nested: '保留' } },
  selectedByDefault: true,
};

function testInitialSnapshotIsClosedAndDeeplyIsolated(): void {
  const diagnostics = createDiagnostics();
  const flow = createManagedWorldbookFlow({
    readDiagnostics: () => diagnostics,
    refreshDiagnostics: async () => undefined,
    listMoveCandidates: async () => ({ candidates: [], warnings: [] }),
    listAvailableTargetNames: () => [],
    reinstall: async () => ({ name: '命定之诗', created: false, updated: true }),
    uninstall: async () => ({ worldbookName: '命定之诗', removedCount: 2 }),
    moveToExternal: async () => ({ name: '外部世界书', created: true, updated: true }),
  });

  const first = flow.getSnapshot();
  assert(first.busy === false, '初始状态不应该 busy');
  assert(first.dialog === null, '初始 dialog 应该关闭');
  assert(first.diagnostics.worldbookName === '命定之诗', '初始 diagnostics 应来自 adapter');

  first.diagnostics.runtimeContentWorldbookNames.push('污染');
  first.diagnostics.sourceItems[0].label = '污染';
  const second = flow.getSnapshot();
  assert(second.diagnostics.runtimeContentWorldbookNames.length === 1, '旧 snapshot 不应该污染内部数组');
  assert(second.diagnostics.sourceItems[0]?.label === '事件', '旧 snapshot 不应该污染内部对象');
}

async function testOpenAndRefreshPublishMenuDiagnostics(): Promise<void> {
  let diagnostics = createDiagnostics('初始');
  let refreshCalls = 0;
  const snapshots: string[] = [];
  const flow = createManagedWorldbookFlow({
    readDiagnostics: () => diagnostics,
    refreshDiagnostics: async () => {
      refreshCalls += 1;
      diagnostics = createDiagnostics(`刷新-${refreshCalls}`);
    },
    listMoveCandidates: async () => ({ candidates: [], warnings: [] }),
    listAvailableTargetNames: () => [],
    reinstall: async () => ({ name: '命定之诗', created: false, updated: true }),
    uninstall: async () => ({ worldbookName: '命定之诗', removedCount: 2 }),
    moveToExternal: async () => ({ name: '外部世界书', created: true, updated: true }),
  });
  flow.subscribe(snapshot => snapshots.push(`${snapshot.dialog?.mode ?? 'closed'}:${snapshot.diagnostics.worldbookName}`));

  const openNotice = await flow.dispatch({ type: 'open' });
  assert(openNotice === null, 'open 不应该返回 toast');
  assert(refreshCalls === 1, 'open 应刷新一次 diagnostics');
  assert(flow.getSnapshot().dialog?.mode === 'menu', 'open 完成后应打开 menu');
  assert(flow.getSnapshot().diagnostics.worldbookName === '刷新-1', 'open 应读取刷新后的 diagnostics');

  await flow.dispatch({ type: 'refresh' });
  assert(refreshCalls === 2, 'refresh 应再次刷新 diagnostics');
  assert(flow.getSnapshot().dialog?.mode === 'menu', 'refresh 不应该改变当前 mode');
  assert(flow.getSnapshot().diagnostics.worldbookName === '刷新-2', 'refresh 应发布最新 diagnostics');
  assert(snapshots.some(item => item === 'menu:刷新-1'), 'subscriber 应看到 open 的最终 snapshot');
}

async function testOpenStillShowsMenuWhenRefreshFails(): Promise<void> {
  const flow = createManagedWorldbookFlow({
    readDiagnostics: () => createDiagnostics('失败后快照'),
    refreshDiagnostics: async () => {
      throw new Error('刷新失败');
    },
    listMoveCandidates: async () => ({ candidates: [], warnings: [] }),
    listAvailableTargetNames: () => [],
    reinstall: async () => ({ name: '命定之诗', created: false, updated: true }),
    uninstall: async () => ({ worldbookName: '命定之诗', removedCount: 2 }),
    moveToExternal: async () => ({ name: '外部世界书', created: true, updated: true }),
  });

  await flow.dispatch({ type: 'open' });
  assert(flow.getSnapshot().dialog?.mode === 'menu', 'refresh 失败仍应以当前 diagnostics 打开 menu');
  assert(flow.getSnapshot().diagnostics.worldbookName === '失败后快照', '失败后仍应读取当前 diagnostics');
}

async function testConfirmationTransitionsAreModeScoped(): Promise<void> {
  const flow = createManagedWorldbookFlow({
    readDiagnostics: () => createDiagnostics(),
    refreshDiagnostics: async () => undefined,
    listMoveCandidates: async () => ({ candidates: [], warnings: [] }),
    listAvailableTargetNames: () => [],
    reinstall: async () => ({ name: '命定之诗', created: false, updated: true }),
    uninstall: async () => ({ worldbookName: '命定之诗', removedCount: 2 }),
    moveToExternal: async () => ({ name: '外部世界书', created: true, updated: true }),
  });

  await flow.dispatch({ type: 'request-uninstall' });
  assert(flow.getSnapshot().dialog === null, 'closed 下 request 不应猜测用户意图');
  await flow.dispatch({ type: 'open' });
  await flow.dispatch({ type: 'request-uninstall' });
  assert(flow.getSnapshot().dialog?.mode === 'confirm-uninstall', 'menu 应进入卸载确认');
  await flow.dispatch({ type: 'request-reinstall' });
  assert(flow.getSnapshot().dialog?.mode === 'confirm-uninstall', '错误 mode 的 request 应 no-op');
  await flow.dispatch({ type: 'close' });
  assert(flow.getSnapshot().dialog === null, 'close 应同步关闭确认');

  await flow.dispatch({ type: 'open' });
  await flow.dispatch({ type: 'request-reinstall' });
  assert(flow.getSnapshot().dialog?.mode === 'confirm-reinstall', 'menu 应进入重装确认');
}

async function testCandidateLoadPublishesBusyAndExportState(): Promise<void> {
  const pending = deferred<{ candidates: [typeof candidate]; warnings: string[] }>();
  let listCalls = 0;
  const flow = createManagedWorldbookFlow({
    readDiagnostics: () => createDiagnostics(),
    refreshDiagnostics: async () => undefined,
    listMoveCandidates: async () => {
      listCalls += 1;
      return pending.promise;
    },
    listAvailableTargetNames: () => ['已有一', '已有二'],
    reinstall: async () => ({ name: '命定之诗', created: false, updated: true }),
    uninstall: async () => ({ worldbookName: '命定之诗', removedCount: 2 }),
    moveToExternal: async () => ({ name: '外部世界书', created: true, updated: true }),
  });
  await flow.dispatch({ type: 'open' });
  const loading = flow.dispatch({ type: 'request-external-move' });
  assert(flow.getSnapshot().busy === true, '候选读取期间应发布 busy');
  const duplicate = await flow.dispatch({ type: 'request-external-move' });
  assert(duplicate === null && listCalls === 1, 'busy 时重复请求不应 double-call');
  pending.resolve({ candidates: [candidate], warnings: ['候选警告'] });
  await loading;

  const snapshot = flow.getSnapshot();
  assert(snapshot.busy === false, '候选读取完成应清 busy');
  assert(snapshot.dialog?.mode === 'export-external', '读取完成应进入 export mode');
  assert(snapshot.dialog.moveCandidates[0]?.id === candidate.id, 'export state 应保存候选');
  assert(snapshot.dialog.moveWarnings[0] === '候选警告', 'export state 应保存 warnings');
  assert(snapshot.dialog.availableTargetNames.join('|') === '已有一|已有二', 'export state 应保存目标列表');

  snapshot.dialog.moveCandidates[0]!.entry.extra!.nested = '污染';
  const isolated = flow.getSnapshot();
  assert(
    isolated.dialog?.mode === 'export-external' && isolated.dialog.moveCandidates[0]?.entry.extra?.nested === '保留',
    '候选 entry.extra 也必须隔离',
  );
}

async function testCandidateLoadFailureStillOpensExportFallback(): Promise<void> {
  const flow = createManagedWorldbookFlow({
    readDiagnostics: () => createDiagnostics(),
    refreshDiagnostics: async () => undefined,
    listMoveCandidates: async () => {
      throw new Error('读取候选失败');
    },
    listAvailableTargetNames: () => ['已有'],
    reinstall: async () => ({ name: '命定之诗', created: false, updated: true }),
    uninstall: async () => ({ worldbookName: '命定之诗', removedCount: 2 }),
    moveToExternal: async () => ({ name: '外部世界书', created: true, updated: true }),
  });
  await flow.dispatch({ type: 'open' });
  await flow.dispatch({ type: 'request-external-move' });
  const dialog = flow.getSnapshot().dialog;
  assert(dialog?.mode === 'export-external', '候选读取失败仍应进入 export fallback');
  assert(dialog.moveCandidates.length === 0, '失败 fallback 候选应为空');
  assert(dialog.moveWarnings[0] === '读取候选失败', '失败 fallback 应保留原始错误');
}

async function testTargetListFailureStillSettlesCandidateOperation(): Promise<void> {
  const flow = createManagedWorldbookFlow({
    readDiagnostics: () => createDiagnostics(),
    refreshDiagnostics: async () => undefined,
    listMoveCandidates: async () => ({ candidates: [candidate], warnings: [] }),
    listAvailableTargetNames: () => {
      throw new Error('读取目标失败');
    },
    reinstall: async () => ({ name: '命定之诗', created: false, updated: true }),
    uninstall: async () => ({ worldbookName: '命定之诗', removedCount: 2 }),
    moveToExternal: async () => ({ name: '外部世界书', created: true, updated: true }),
  });
  await flow.dispatch({ type: 'open' });
  await flow.dispatch({ type: 'request-external-move' });
  const snapshot = flow.getSnapshot();
  assert(snapshot.busy === false, '目标列表失败也必须 settle busy');
  assert(snapshot.dialog?.mode === 'export-external', '目标列表失败仍应进入 export fallback');
  assert(snapshot.dialog.moveWarnings[0] === '读取目标失败', '目标列表失败应进入 warnings');
}

async function testExternalMoveValidationAndInfrastructureOnlyOptions(): Promise<void> {
  const pendingMove = deferred<{ name: string; created: boolean; updated: boolean; movedCount: number }>();
  let diagnostics = createDiagnostics();
  const moveCalls: Array<{ name: string; options: { candidateIds?: string[]; removeFromSource?: boolean } }> = [];
  const flow = createManagedWorldbookFlow({
    readDiagnostics: () => diagnostics,
    refreshDiagnostics: async () => undefined,
    listMoveCandidates: async () => ({ candidates: [], warnings: [] }),
    listAvailableTargetNames: () => [],
    reinstall: async () => ({ name: '命定之诗', created: false, updated: true }),
    uninstall: async () => ({ worldbookName: '命定之诗', removedCount: 2 }),
    moveToExternal: async (name, options) => {
      moveCalls.push({ name, options });
      return pendingMove.promise;
    },
  });
  await flow.dispatch({ type: 'open' });
  await flow.dispatch({ type: 'request-external-move' });

  const invalidNotice = await flow.dispatch({
    type: 'confirm-external-move',
    targetName: '   ',
    candidateIds: [],
    removeFromSource: false,
  });
  assert(invalidNotice?.level === 'error', '空目标应返回 validation notice');
  assert(flow.getSnapshot().dialog?.mode === 'export-external', '空目标不应关闭 export dialog');
  assert(moveCalls.length === 0, '空目标不应调用 adapter');

  const moving = flow.dispatch({
    type: 'confirm-external-move',
    targetName: '  外部世界书  ',
    candidateIds: [],
    removeFromSource: true,
  });
  assert(flow.getSnapshot().busy === true, 'move 期间应 busy');
  assert(flow.getSnapshot().dialog === null, '有效 move 应在 effect 前关闭 dialog');
  assert(moveCalls.length === 1, '有效 move 应精确调用一次 adapter');
  assert(moveCalls[0]?.name === '外部世界书', '目标名应 normalize');
  assert(!('candidateIds' in moveCalls[0]!.options), '空 ids 必须省略 candidateIds property');
  assert(moveCalls[0]?.options.removeFromSource === true, 'removeFromSource 应原样传递');

  diagnostics = createDiagnostics('搬运后');
  pendingMove.resolve({ name: '外部世界书', created: true, updated: true, movedCount: 0 });
  const successNotice = await moving;
  assert(successNotice?.level === 'success', 'move success 应返回 success notice');
  assert(successNotice.message.includes('外部世界书'), 'success notice 应使用 pure helper 包含目标名');
  assert(flow.getSnapshot().busy === false, 'move settle 应清 busy');
  assert(flow.getSnapshot().diagnostics.worldbookName === '搬运后', 'move settle 应刷新 diagnostics snapshot');
}

async function testExternalMoveFailureReturnsRawErrorNotice(): Promise<void> {
  const flow = createManagedWorldbookFlow({
    readDiagnostics: () => createDiagnostics('失败后'),
    refreshDiagnostics: async () => undefined,
    listMoveCandidates: async () => ({ candidates: [candidate], warnings: [] }),
    listAvailableTargetNames: () => [],
    reinstall: async () => ({ name: '命定之诗', created: false, updated: true }),
    uninstall: async () => ({ worldbookName: '命定之诗', removedCount: 2 }),
    moveToExternal: async () => {
      throw new Error('写入外部世界书失败');
    },
  });
  await flow.dispatch({ type: 'open' });
  await flow.dispatch({ type: 'request-external-move' });
  const notice = await flow.dispatch({
    type: 'confirm-external-move',
    targetName: '外部世界书',
    candidateIds: [candidate.id],
    removeFromSource: false,
  });
  assert(notice?.level === 'error', 'move failure 应返回 error notice');
  assert(notice.message.includes('写入外部世界书失败'), 'move failure 应保留原始错误');
  assert(flow.getSnapshot().dialog === null && flow.getSnapshot().busy === false, '失败后 dialog 保持关闭并清 busy');
}

async function testMaintenanceEffectsUseConfirmationAndReturnNotices(): Promise<void> {
  const pendingUninstall = deferred<{ worldbookName: string; removedCount: number }>();
  let diagnostics = createDiagnostics();
  let uninstallCalls = 0;
  let reinstallCalls = 0;
  const flow = createManagedWorldbookFlow({
    readDiagnostics: () => diagnostics,
    refreshDiagnostics: async () => undefined,
    listMoveCandidates: async () => ({ candidates: [], warnings: [] }),
    listAvailableTargetNames: () => [],
    reinstall: async () => {
      reinstallCalls += 1;
      throw new Error('重装原始错误');
    },
    uninstall: async () => {
      uninstallCalls += 1;
      return pendingUninstall.promise;
    },
    moveToExternal: async () => ({ name: '外部世界书', created: true, updated: true }),
  });

  await flow.dispatch({ type: 'confirm-uninstall' });
  assert(uninstallCalls === 0, '未进入确认 mode 不应执行卸载');
  await flow.dispatch({ type: 'open' });
  await flow.dispatch({ type: 'request-uninstall' });
  const uninstalling = flow.dispatch({ type: 'confirm-uninstall' });
  assert(flow.getSnapshot().busy === true && flow.getSnapshot().dialog === null, '卸载应先关 dialog 再发布 busy');
  assert(uninstallCalls === 1, '卸载 adapter 应精确调用一次');
  const secondEffect = await flow.dispatch({ type: 'confirm-reinstall' });
  assert(secondEffect === null && reinstallCalls === 0, 'busy 期间不应启动第二个 write');
  diagnostics = createDiagnostics('卸载后');
  pendingUninstall.resolve({ worldbookName: '命定之诗', removedCount: 2 });
  const uninstallNotice = await uninstalling;
  assert(uninstallNotice?.level === 'success', '卸载成功应返回 success notice');
  assert(uninstallNotice.message.includes('已卸载 2 条基础规则'), '卸载 notice 应复用 pure helper');
  assert(flow.getSnapshot().diagnostics.worldbookName === '卸载后', '卸载 settle 应刷新 diagnostics');

  await flow.dispatch({ type: 'open' });
  await flow.dispatch({ type: 'request-reinstall' });
  const reinstallNotice = await flow.dispatch({ type: 'confirm-reinstall' });
  assert(reinstallCalls === 1, '重装 adapter 应精确调用一次');
  assert(reinstallNotice?.level === 'error', '重装失败应返回 error notice');
  assert(reinstallNotice.message.includes('重装原始错误'), '重装失败应保留原始错误');
  assert(flow.getSnapshot().dialog === null && flow.getSnapshot().busy === false, '重装失败后应关闭 dialog 并清 busy');
}

async function testStaleAsyncResultsCannotResurrectPresentation(): Promise<void> {
  const firstRefresh = deferred<void>();
  const secondRefresh = deferred<void>();
  const refreshQueue = [firstRefresh, secondRefresh];
  let diagnostics = createDiagnostics('初始');
  const flow = createManagedWorldbookFlow({
    readDiagnostics: () => diagnostics,
    refreshDiagnostics: async () => refreshQueue.shift()!.promise,
    listMoveCandidates: async () => ({ candidates: [], warnings: [] }),
    listAvailableTargetNames: () => [],
    reinstall: async () => ({ name: '命定之诗', created: false, updated: true }),
    uninstall: async () => ({ worldbookName: '命定之诗', removedCount: 2 }),
    moveToExternal: async () => ({ name: '外部世界书', created: true, updated: true }),
  });

  const oldOpen = flow.dispatch({ type: 'open' });
  const close = flow.dispatch({ type: 'close' });
  assert(flow.getSnapshot().dialog === null, 'close 必须同步 invalidate presentation');
  const newOpen = flow.dispatch({ type: 'open' });
  diagnostics = createDiagnostics('新一轮');
  secondRefresh.resolve();
  await newOpen;
  assert(flow.getSnapshot().dialog?.mode === 'menu', '新一轮 open 应正常打开 menu');
  assert(flow.getSnapshot().diagnostics.worldbookName === '新一轮', '新一轮应提交 diagnostics');
  diagnostics = createDiagnostics('旧结果');
  firstRefresh.resolve();
  await oldOpen;
  await close;
  assert(flow.getSnapshot().dialog?.mode === 'menu', '旧 open 迟到不能关闭或覆盖新一轮 menu');
  assert(flow.getSnapshot().diagnostics.worldbookName === '新一轮', '旧 open 迟到不能覆盖新 diagnostics');
}

async function testCloseDuringCandidateLoadOnlyCleansBusy(): Promise<void> {
  const pendingCandidates = deferred<{ candidates: [typeof candidate]; warnings: string[] }>();
  const flow = createManagedWorldbookFlow({
    readDiagnostics: () => createDiagnostics(),
    refreshDiagnostics: async () => undefined,
    listMoveCandidates: async () => pendingCandidates.promise,
    listAvailableTargetNames: () => ['迟到目标'],
    reinstall: async () => ({ name: '命定之诗', created: false, updated: true }),
    uninstall: async () => ({ worldbookName: '命定之诗', removedCount: 2 }),
    moveToExternal: async () => ({ name: '外部世界书', created: true, updated: true }),
  });
  await flow.dispatch({ type: 'open' });
  const loading = flow.dispatch({ type: 'request-external-move' });
  void flow.dispatch({ type: 'close' });
  assert(flow.getSnapshot().dialog === null && flow.getSnapshot().busy === true, 'close 应立即关 UI 但保留 active busy');
  pendingCandidates.resolve({ candidates: [candidate], warnings: [] });
  const notice = await loading;
  assert(notice === null, 'stale candidate settle 不应返回 notice');
  assert(flow.getSnapshot().dialog === null, '迟到 candidates 不得 resurrect export dialog');
  assert(flow.getSnapshot().busy === false, '迟到 candidates 只允许清理 busy');
}

async function testCloseDuringWriteSuppressesStaleNoticeAndDiagnostics(): Promise<void> {
  const pendingUninstall = deferred<{ worldbookName: string; removedCount: number }>();
  let diagnostics = createDiagnostics('写入前');
  let refreshCalls = 0;
  const flow = createManagedWorldbookFlow({
    readDiagnostics: () => diagnostics,
    refreshDiagnostics: async () => {
      refreshCalls += 1;
    },
    listMoveCandidates: async () => ({ candidates: [], warnings: [] }),
    listAvailableTargetNames: () => [],
    reinstall: async () => ({ name: '命定之诗', created: false, updated: true }),
    uninstall: async () => pendingUninstall.promise,
    moveToExternal: async () => ({ name: '外部世界书', created: true, updated: true }),
  });
  await flow.dispatch({ type: 'open' });
  await flow.dispatch({ type: 'request-uninstall' });
  const writing = flow.dispatch({ type: 'confirm-uninstall' });
  void flow.dispatch({ type: 'close' });
  const blockedOpen = await flow.dispatch({ type: 'open' });
  assert(blockedOpen === null && refreshCalls === 1, 'active write 期间 open 不应启动另一操作');
  diagnostics = createDiagnostics('迟到写入');
  pendingUninstall.resolve({ worldbookName: '命定之诗', removedCount: 2 });
  const notice = await writing;
  assert(notice === null, 'close 后 write settle 不应返回 stale notice');
  assert(flow.getSnapshot().busy === false && flow.getSnapshot().dialog === null, 'stale write settle 只应 cleanup');
  assert(flow.getSnapshot().diagnostics.worldbookName === '写入前', 'stale write 不应覆盖 diagnostics');
}

async function main(): Promise<void> {
  testInitialSnapshotIsClosedAndDeeplyIsolated();
  await testOpenAndRefreshPublishMenuDiagnostics();
  await testOpenStillShowsMenuWhenRefreshFails();
  await testConfirmationTransitionsAreModeScoped();
  await testCandidateLoadPublishesBusyAndExportState();
  await testCandidateLoadFailureStillOpensExportFallback();
  await testTargetListFailureStillSettlesCandidateOperation();
  await testExternalMoveValidationAndInfrastructureOnlyOptions();
  await testExternalMoveFailureReturnsRawErrorNotice();
  await testMaintenanceEffectsUseConfirmationAndReturnNotices();
  await testStaleAsyncResultsCannotResurrectPresentation();
  await testCloseDuringCandidateLoadOnlyCleansBusy();
  await testCloseDuringWriteSuppressesStaleNoticeAndDiagnostics();
  console.log('managed-worldbook/flow.check.ts OK');
}

void main();
