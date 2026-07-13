// eslint-disable-next-line import-x/no-nodejs-modules -- focused source-boundary check runs under Node/ts-node.
import { readFileSync } from 'node:fs';
// eslint-disable-next-line import-x/no-nodejs-modules -- focused source-boundary check runs under Node/ts-node.
import { resolve } from 'node:path';
import {
  parseFixedEventIndexDraft,
  serializeFixedEventIndexDraft,
  validateFixedEventIndexDraft,
  type FixedEventIndexEditorPreviewModel,
  type FixedEventIndexSaveResult,
  type FixedEventIndexTemplateCreateResult,
  type FixedEventIndexYamlSaveArgs,
} from '../../../src/calendar-float/fixed-event-index-editor';
import {
  createFixedEventEditorSession,
  type FixedEventEditorSessionAdapters,
  type FixedEventEditorSessionState,
} from '../../../src/calendar-float/widget/fixed-event-editor-session';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

const SOURCE_YAML = `版本: 1
固定事件分组:
  - id: group_1
    名称: 旧分组
    事件: [event_1]
固定事件:
  - id: event_1
    名称: 旧事件
    分组: group_1
    开始: 01-02
    结束: 01-04
    阶段:
      - id: stage_1
        名称: 旧阶段
        开始: 01-02
        结束: 01-03
补充资料:
  - id: material_1
    书名: 旧资料
    关联事件: [event_1]
`;

function createPreview(yaml = SOURCE_YAML): FixedEventIndexEditorPreviewModel {
  const source = {
    worldbookName: '命定之诗',
    entryName: '[fixed_event_index]',
    content: yaml,
    sourceWorldbooks: ['命定之诗'],
    candidates: [{ worldbookName: '命定之诗', entryName: '[fixed_event_index]' }],
    warnings: [],
  };
  const draft = parseFixedEventIndexDraft(yaml, source);
  return {
    loading: false,
    source,
    draft,
    yamlPreview: serializeFixedEventIndexDraft(draft),
    validation: validateFixedEventIndexDraft(draft),
    errorMessage: '',
    saving: false,
  };
}

function createMissingPreview(): FixedEventIndexEditorPreviewModel {
  return {
    loading: false,
    source: null,
    draft: null,
    yamlPreview: '',
    validation: null,
    errorMessage: '',
    saving: false,
  };
}

function createFakeAdapters() {
  const loadQueue: Array<ReturnType<typeof deferred<FixedEventIndexEditorPreviewModel>>> = [];
  const saveQueue: Array<ReturnType<typeof deferred<FixedEventIndexSaveResult>>> = [];
  const templateQueue: Array<ReturnType<typeof deferred<FixedEventIndexTemplateCreateResult>>> = [];
  const saveCalls: FixedEventIndexYamlSaveArgs[] = [];
  const confirmations: Array<'close' | 'reload'> = [];
  const confirmResults: boolean[] = [];
  const adapters: FixedEventEditorSessionAdapters = {
    load: () => {
      const pending = deferred<FixedEventIndexEditorPreviewModel>();
      loadQueue.push(pending);
      return pending.promise;
    },
    save: args => {
      saveCalls.push(args);
      const pending = deferred<FixedEventIndexSaveResult>();
      saveQueue.push(pending);
      return pending.promise;
    },
    createTemplate: () => {
      const pending = deferred<FixedEventIndexTemplateCreateResult>();
      templateQueue.push(pending);
      return pending.promise;
    },
    confirmDiscard: async reason => {
      confirmations.push(reason);
      return confirmResults.shift() ?? true;
    },
  };
  return { adapters, loadQueue, saveQueue, templateQueue, saveCalls, confirmations, confirmResults };
}

async function testOpenPublishesImmutableLoadingAndReadySnapshots(): Promise<void> {
  const fake = createFakeAdapters();
  const session = createFixedEventEditorSession(fake.adapters);
  const published: Readonly<FixedEventEditorSessionState>[] = [];
  const unsubscribe = session.subscribe(snapshot => published.push(snapshot));
  const initial = session.getSnapshot();

  assert(
    initial.open === false && initial.model === null && initial.selection === null && !initial.dirty,
    '初始状态必须 closed',
  );
  const opening = session.dispatch({ type: 'open' });
  const loading = session.getSnapshot();
  assert(loading.open && loading.model?.loading === true, 'open 必须同步发布 loading');
  assert(loading.model?.saving === false && loading.selection === null && !loading.dirty, 'loading 状态必须 clean');
  assert(initial.open === false && initial.model === null, '旧 snapshot 不能被 loading mutate');
  assert(fake.loadQueue.length === 1, 'open 应该调用一次 load');
  const loadingYamlEdit = await session.dispatch({ type: 'replace-yaml', yaml: 'loading edit' });
  const loadingSelectionEdit = await session.dispatch({
    type: 'select',
    selection: { section: 'yaml', scope: 'yaml' },
  });
  const loadingTransforms = await Promise.all([
    session.dispatch({
      type: 'apply-structured',
      edits: { groups: [], events: [], stages: [], materials: [] },
    }),
    session.dispatch({ type: 'row-operation', operation: 'add-event', row: {} }),
    session.dispatch({ type: 'rename', input: { scope: 'event', oldId: 'event_1', newId: 'event_2' } }),
  ]);
  assert(!loadingYamlEdit.dirty && loadingYamlEdit.model?.yamlPreview === '', 'loading 期间必须拒绝 YAML 修改');
  assert(loadingSelectionEdit.selection === null, 'loading 期间必须拒绝 selection 修改');
  assert(
    loadingTransforms.every(snapshot => snapshot.model?.loading === true && !snapshot.dirty),
    'loading 期间 structured/row/rename transform 必须保持 clean loading',
  );

  fake.loadQueue[0].resolve(createPreview());
  const ready = await opening;
  assert(
    ready.open && ready.model?.loading === false && ready.model.draft?.events[0]?.id === 'event_1',
    'load 完成后必须 ready',
  );
  assert(ready.selection?.scope === 'overview' && ready.selection.section === 'events', 'ready 必须选择默认页面');
  assert(!ready.dirty, '初次 load 不得 dirty');
  assert(loading.model?.loading === true && loading.selection === null, '旧 loading snapshot 不能被 ready mutate');
  assert(
    published.some(snapshot => snapshot.model?.loading === true),
    'subscribe 必须观察 loading 中间状态',
  );
  assert(
    published.some(snapshot => snapshot.model?.loading === false),
    'subscribe 必须观察 ready 状态',
  );
  assert(ready.model?.draft?.events[0], 'ready snapshot 必须包含固定事件');
  ready.model.draft.events[0].name = '外部污染';
  const afterExternalMutation = session.getSnapshot();
  assert(
    afterExternalMutation.model?.draft?.events[0]?.name === '旧事件',
    'snapshot 深层 mutation 不得污染 session draft',
  );
  unsubscribe();
}

async function openReady(fake: ReturnType<typeof createFakeAdapters>) {
  const session = createFixedEventEditorSession(fake.adapters);
  const opening = session.dispatch({ type: 'open' });
  fake.loadQueue[0].resolve(createPreview());
  await opening;
  return session;
}

async function testLoadErrorBecomesRecoverableEditorState(): Promise<void> {
  const fake = createFakeAdapters();
  const session = createFixedEventEditorSession(fake.adapters);
  const opening = session.dispatch({ type: 'open' });
  fake.loadQueue[0].reject(new Error('reader exploded'));
  const failed = await opening;
  assert(failed.open && failed.model?.loading === false, 'load throw 后 editor 应保持打开且退出 loading');
  assert(failed.model?.errorMessage.includes('reader exploded'), 'load throw 必须保留原始错误');
  assert(failed.selection?.scope === 'yaml' && !failed.dirty, 'load error 应是 clean 可恢复状态');
}

async function testDirtyCloseAndReloadConfirmationsSettle(): Promise<void> {
  const fake = createFakeAdapters();
  const session = await openReady(fake);
  await session.dispatch({ type: 'replace-yaml', yaml: `${session.getSnapshot().model?.yamlPreview}\n# local` });
  const dirty = session.getSnapshot();
  assert(dirty.dirty, 'replace-yaml 必须标 dirty');

  fake.confirmResults.push(false);
  const cancelledClose = await session.dispatch({ type: 'close-request' });
  assert(cancelledClose.open && cancelledClose.dirty, '取消关闭必须保持业务状态');
  assert(fake.confirmations.at(-1) === 'close', 'dirty close 必须确认 close');

  fake.confirmResults.push(false);
  const cancelledReload = await session.dispatch({ type: 'reload' });
  assert(cancelledReload.open && cancelledReload.dirty, '取消 reload 必须保持业务状态');
  assert(fake.confirmations.at(-1) === 'reload', 'dirty reload 必须确认 reload');
  assert(fake.loadQueue.length === 1, '取消 reload 不得 load');

  fake.confirmResults.push(true);
  const reloading = session.dispatch({ type: 'reload' });
  await Promise.resolve();
  await Promise.resolve();
  assert(
    session.getSnapshot().model?.loading === true && !session.getSnapshot().dirty,
    '接受 reload 必须立即进入 clean loading',
  );
  fake.loadQueue[1].resolve(createPreview());
  await reloading;

  await session.dispatch({ type: 'replace-yaml', yaml: `${session.getSnapshot().model?.yamlPreview}\n# close` });
  fake.confirmResults.push(true);
  const closed = await session.dispatch({ type: 'close-request' });
  assert(
    !closed.open && closed.model === null && closed.selection === null && !closed.dirty,
    '接受 close 必须原子 closed',
  );
}

async function testStructuredRowRenameAndFailurePreserveState(): Promise<void> {
  const fake = createFakeAdapters();
  const session = await openReady(fake);
  const before = session.getSnapshot();
  const sourceYaml = before.model?.yamlPreview ?? '';

  await session.dispatch({
    type: 'apply-structured',
    edits: {
      groups: [{ id: 'group_1', name: '新分组名', eventIdsText: 'event_1' }],
      events: [{ id: 'event_1', name: '新事件名' }],
      stages: [],
      materials: [{ id: 'material_1', title: '新资料名', eventIdsText: 'event_1' }],
    },
    showMessage: true,
  });
  const structured = session.getSnapshot();
  assert(structured.model?.draft?.events[0]?.name === '新事件名', 'structured edit 必须更新 draft');
  assert(structured.model?.saveState === 'warning' && structured.dirty, 'structured edit 必须进入 warning dirty');
  assert(!('sourceYaml' in { groups: [], events: [], materials: [] }), '调用 intent 不应该要求 sourceYaml');

  await session.dispatch({ type: 'row-operation', operation: 'add-event', row: {} });
  const added = session.getSnapshot();
  assert(
    added.model?.draft?.events.some(event => event.id === 'event_new_1'),
    'row operation 必须由 session 生成并新增 row',
  );
  assert(
    added.selection?.scope === 'event' && added.selection.id === 'event_new_1',
    '新增 row 必须应用 next selection',
  );

  await session.dispatch({ type: 'row-operation', operation: 'add-stage', row: { eventId: 'event_1' } });
  await session.dispatch({
    type: 'select',
    selection: { section: 'events', scope: 'stage', eventId: 'event_1', id: 'stage_new_1' },
  });
  await session.dispatch({
    type: 'row-operation',
    operation: 'move-stage-up',
    row: { eventId: 'event_1', id: 'stage_new_1' },
  });
  const moved = session.getSnapshot();
  assert(moved.model?.draft?.events[0]?.stages[0]?.id === 'stage_new_1', 'move row 必须改变阶段顺序');
  assert(moved.selection?.id === 'stage_new_1', 'move row 必须保留当前 selection');

  await session.dispatch({
    type: 'row-operation',
    operation: 'remove-row',
    row: { scope: 'event', id: 'event_new_1' },
  });
  const removed = session.getSnapshot();
  assert(!removed.model?.draft?.events.some(event => event.id === 'event_new_1'), 'remove row 必须删除目标');
  assert(removed.selection?.scope === 'overview', 'remove event 必须应用安全 selection');

  await session.dispatch({
    type: 'select',
    selection: { section: 'events', scope: 'event', id: 'event_1', detailTab: 'basic' },
  });
  await session.dispatch({ type: 'rename', input: { scope: 'event', oldId: 'event_1', newId: 'event_new_name' } });
  const renamed = session.getSnapshot();
  assert(
    renamed.model?.draft?.events.some(event => event.id === 'event_new_name'),
    'rename 必须更新 id',
  );
  assert(renamed.model?.draft?.groups[0]?.eventIds.includes('event_new_name'), 'rename 必须同步引用');
  assert(renamed.selection?.id === 'event_new_name', 'rename 当前 selection 必须同步 id');

  const beforeFailure = session.getSnapshot();
  await session.dispatch({ type: 'rename', input: { scope: 'event', oldId: 'event_new_name', newId: '   ' } });
  const failed = session.getSnapshot();
  assert(failed.model?.yamlPreview === beforeFailure.model?.yamlPreview, 'transform 失败不得丢旧 YAML');
  assert(
    JSON.stringify(failed.model?.draft) === JSON.stringify(beforeFailure.model?.draft),
    'transform 失败不得丢旧 draft',
  );
  assert(
    JSON.stringify(failed.selection) === JSON.stringify(beforeFailure.selection),
    'transform 失败不得丢 selection',
  );
  assert(failed.model?.saveState === 'danger', 'transform 失败必须给 danger feedback');
  assert(sourceYaml !== failed.model?.yamlPreview, '成功 transform 应该确实改变 YAML');
}

async function testSaveSuccessFailureThrowAndDoubleClick(): Promise<void> {
  const fake = createFakeAdapters();
  const session = await openReady(fake);
  await session.dispatch({ type: 'replace-yaml', yaml: `${session.getSnapshot().model?.yamlPreview}\n# dirty` });

  const saving = session.dispatch({ type: 'save' });
  assert(session.getSnapshot().model?.saving === true, 'save 必须同步发布 saving');
  const duplicate = await session.dispatch({ type: 'save' });
  assert(fake.saveCalls.length === 1 && duplicate.model?.saving === true, 'double save 必须忽略第二次调用');
  assert(fake.saveCalls[0].yaml.endsWith('# dirty'), 'save 必须传 session 当前 YAML');
  assert(fake.saveCalls[0].source.content === SOURCE_YAML, 'save 必须保留最初 source 用于冲突检查');
  const normalizedSavedYaml = SOURCE_YAML.replace('名称: 旧事件', '名称: 保存端规范化事件');
  fake.saveQueue[0].resolve({ ok: true, message: 'saved', yaml: normalizedSavedYaml });
  const saved = await saving;
  assert(saved.model?.saving === false && saved.model.saveState === 'success', 'save success 必须退出 saving');
  assert(
    saved.model?.yamlPreview === normalizedSavedYaml && saved.model.source?.content === normalizedSavedYaml,
    'save success 必须更新 source/YAML',
  );
  assert(saved.model?.draft?.events[0]?.name === '保存端规范化事件', 'save success 必须用服务端 YAML 重建 draft');
  assert(saved.model?.validation?.canSave === true, 'save success 必须重建 validation');
  assert(!saved.dirty, 'save success 必须 clean');

  await session.dispatch({ type: 'replace-yaml', yaml: 'bad yaml local' });
  const failedSave = session.dispatch({ type: 'save' });
  fake.saveQueue[1].resolve({ ok: false, message: 'conflict' });
  const failed = await failedSave;
  assert(failed.model?.saving === false && failed.model.saveState === 'danger', 'save false 必须 danger');
  assert(failed.dirty && failed.model.yamlPreview === 'bad yaml local', 'save false 必须保留 dirty/YAML');

  const thrownSave = session.dispatch({ type: 'save' });
  fake.saveQueue[2].reject(new Error('write exploded'));
  const thrown = await thrownSave;
  assert(thrown.model?.saveMessage?.includes('write exploded'), 'save throw 必须显示原始错误');
  assert(thrown.dirty && thrown.model?.saving === false, 'save throw 必须保留 dirty 并退出 saving');
}

async function testEpochRejectsStaleLoadsAndSaves(): Promise<void> {
  const fake = createFakeAdapters();
  const session = createFixedEventEditorSession(fake.adapters);
  const loadA = session.dispatch({ type: 'open' });
  await session.dispatch({ type: 'close-request' });
  const loadB = session.dispatch({ type: 'open' });
  fake.loadQueue[0].resolve(createPreview(SOURCE_YAML.replace('旧事件', 'stale-A')));
  await loadA;
  assert(session.getSnapshot().model?.loading === true, 'close/reopen 后旧 load 不得覆盖新 loading');
  fake.loadQueue[1].resolve(createPreview(SOURCE_YAML.replace('旧事件', 'fresh-B')));
  await loadB;
  assert(session.getSnapshot().model?.draft?.events[0]?.name === 'fresh-B', 'close/reopen 必须只提交新 load');

  const reloadA = session.dispatch({ type: 'reload' });
  const reloadB = session.dispatch({ type: 'reload' });
  fake.loadQueue[3].resolve(createPreview(SOURCE_YAML.replace('旧事件', 'reload-B')));
  await reloadB;
  fake.loadQueue[2].resolve(createPreview(SOURCE_YAML.replace('旧事件', 'reload-A-stale')));
  await reloadA;
  assert(session.getSnapshot().model?.draft?.events[0]?.name === 'reload-B', 'reload A/B 乱序不得让 A 覆盖 B');

  await session.dispatch({ type: 'replace-yaml', yaml: `${session.getSnapshot().model?.yamlPreview}\n# save` });
  const staleSave = session.dispatch({ type: 'save' });
  fake.confirmResults.push(true);
  await session.dispatch({ type: 'close-request' });
  const reopen = session.dispatch({ type: 'open' });
  fake.loadQueue[4].resolve(createPreview(SOURCE_YAML.replace('旧事件', 'after-save-close')));
  await reopen;
  fake.saveQueue[0].resolve({ ok: true, message: 'stale saved', yaml: 'stale saved yaml' });
  await staleSave;
  assert(
    session.getSnapshot().model?.draft?.events[0]?.name === 'after-save-close',
    'close/reopen 后旧 save 不得覆盖新 session',
  );
}

async function testCreateTemplateSuccessFailureAndStaleResult(): Promise<void> {
  const fake = createFakeAdapters();
  const session = createFixedEventEditorSession(fake.adapters);
  const opening = session.dispatch({ type: 'open' });
  fake.loadQueue[0].resolve(createMissingPreview());
  await opening;

  const creating = session.dispatch({ type: 'create-template' });
  assert(session.getSnapshot().model?.saving === true, 'create-template 必须发布中间 feedback');
  fake.templateQueue[0].resolve({
    ok: true,
    created: true,
    worldbookName: '命定之诗',
    entryName: '[fixed_event_index]',
    message: 'created',
    yaml: SOURCE_YAML,
  });
  await Promise.resolve();
  assert(
    fake.loadQueue.length === 2 && session.getSnapshot().model?.loading === true,
    'template success 必须重新 load',
  );
  fake.loadQueue[1].resolve(createPreview());
  const created = await creating;
  assert(
    created.model?.draft?.events[0]?.id === 'event_1' && created.selection?.scope === 'overview',
    'template success 必须 ready/default selection',
  );
  assert(
    created.model?.saveMessage === 'created' && created.model.saveState === 'success' && !created.dirty,
    'template success 必须 clean success',
  );

  const failing = session.dispatch({ type: 'create-template' });
  fake.templateQueue[1].resolve({
    ok: false,
    created: false,
    worldbookName: '命定之诗',
    entryName: '[fixed_event_index]',
    message: 'template conflict',
  });
  const failed = await failing;
  assert(failed.open && failed.model?.draft?.events[0]?.id === 'event_1', 'template false 必须保持可恢复 model');
  assert(
    failed.model?.saving === false && failed.model.saveState === 'danger',
    'template false 必须 danger 并退出 saving',
  );

  const stale = session.dispatch({ type: 'create-template' });
  await session.dispatch({ type: 'close-request' });
  fake.templateQueue[2].resolve({
    ok: true,
    created: true,
    worldbookName: '命定之诗',
    entryName: '[fixed_event_index]',
    message: 'stale template',
  });
  await stale;
  assert(!session.getSnapshot().open && fake.loadQueue.length === 2, 'close 后 stale template 不得触发 reload/commit');
}

function testSessionSourceBoundary(): void {
  const source = readFileSync(
    resolve(__dirname, '../../../src/calendar-float/widget/fixed-event-editor-session.ts'),
    'utf8',
  );
  const forbidden = [
    'document.',
    'window.',
    'toastr',
    'renderShell',
    'querySelector',
    'getVariables',
    'replaceVariables',
  ];
  const hits = forbidden.filter(token => source.includes(token));
  assert(hits.length === 0, `session 不得接触 host/DOM/global effects: ${hits.join(', ')}`);
  assert(
    /Omit<[\s\S]*?FixedEventIndexStructuredEditInput[\s\S]*?'sourceYaml'\s*\|\s*'sourceInfo'[\s\S]*?>/.test(source),
    'structured intent 必须隐藏 source',
  );
  assert(
    /Omit<FixedEventIndexRenameIdInput,\s*'sourceYaml'\s*\|\s*'sourceInfo'>/.test(source),
    'rename intent 必须隐藏 source',
  );
  assert(source.includes("type: 'create-template'"), 'command union 必须包含 create-template');
}

async function main(): Promise<void> {
  await testOpenPublishesImmutableLoadingAndReadySnapshots();
  await testLoadErrorBecomesRecoverableEditorState();
  await testDirtyCloseAndReloadConfirmationsSettle();
  await testStructuredRowRenameAndFailurePreserveState();
  await testSaveSuccessFailureThrowAndDoubleClick();
  await testEpochRejectsStaleLoadsAndSaves();
  await testCreateTemplateSuccessFailureAndStaleResult();
  testSessionSourceBoundary();
  console.log('widget/fixed-event-editor-session.check.ts OK');
}

void main();
