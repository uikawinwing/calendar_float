// eslint-disable-next-line import-x/no-nodejs-modules -- focused source-boundary check runs under Node/ts-node.
import { readFileSync } from 'node:fs';
// eslint-disable-next-line import-x/no-nodejs-modules -- focused source-boundary check runs under Node/ts-node.
import { resolve } from 'node:path';
import {
  buildFixedEventMonthAliasesFromRuntime,
  createFixedEventIndexEditorLoadingModel,
  hydrateFixedEventIndexMonthAliasesFromRuntime,
} from '../../../src/calendar-float/widget/fixed-event-editor-host';
import { parseFixedEventIndexDraft } from '../../../src/calendar-float/fixed-event-index-editor';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function readFunctionBody(source: string, name: string): string {
  const start = source.indexOf(`function ${name}`);
  assert(start >= 0, `找不到函数 ${name}`);
  const nextFunction = source.indexOf('\nfunction ', start + 1);
  return source.slice(start, nextFunction >= 0 ? nextFunction : source.length);
}

function testLoadingModelIsExplicitAndNotDirty(): void {
  const model = createFixedEventIndexEditorLoadingModel();
  assert(model.loading === true, 'loading model 应该标记 loading');
  assert(model.source === null, 'loading model 不应该假装已有 source');
  assert(model.draft === null, 'loading model 不应该假装已有 draft');
  assert(model.yamlPreview === '', 'loading model YAML preview 应该为空');
  assert(model.validation === null, 'loading model validation 应该为空');
  assert(model.saving === false, 'loading model 不应该处于保存中');
}

function testRuntimeMonthAliasBackfillKeepsOneToTwelveShape(): void {
  const aliases = buildFixedEventMonthAliasesFromRuntime([
    { month: 1, label: '苏醒', season: '初春' },
    { month: 13, label: '坏数据' },
    { month: 2, label: '' },
  ]);
  assert(aliases.length === 12, '应该总是输出 1-12 月');
  assert(aliases[0].month === 1 && aliases[0].name === '苏醒', '应该保留有效运行时别名');
  assert(aliases[0].season === '初春', '应该保留 season');
  assert(aliases[1].month === 2 && aliases[1].name === '', '空 label 应该变成空草稿');
  assert(aliases[11].month === 12, '应该补齐到 12 月');
}

function testRuntimeMonthAliasHydrationStaysInPureLoadPolicy(): void {
  const source = { worldbookName: '测试', entryName: '[fixed_event_index]' };
  const draft = parseFixedEventIndexDraft('固定事件: []\n', source);
  const model = hydrateFixedEventIndexMonthAliasesFromRuntime(
    {
      loading: false,
      source: { ...source, content: '固定事件: []\n', sourceWorldbooks: ['测试'], candidates: [], warnings: [] },
      draft,
      yamlPreview: '固定事件: []\n',
      validation: null,
      errorMessage: '',
      saving: false,
    },
    [{ month: 1, label: '苏醒' }],
  );
  assert(model.draft?.monthAliases.length === 12, 'load policy 必须回填 1-12 月');
  assert(model.draft?.monthAliases[0]?.name === '苏醒', 'load policy 必须使用 runtime alias');
  assert(model.saveState === 'warning', '回填必须提示尚未保存');
}

function testWidgetHostUsesOneSessionOwner(): void {
  const source = readFileSync(resolve(__dirname, '../../../src/calendar-float/widget/index.ts'), 'utf8');
  const forbiddenOwners = [
    'fixedEventIndexEditorOpen',
    'fixedEventIndexEditorModel',
    'fixedEventIndexEditorSelection',
    'fixedEventIndexEditorDirty',
  ];
  const ownerHits = forbiddenOwners.filter(name => source.includes(name));
  assert(ownerHits.length === 0, `widget host 不得镜像 session state: ${ownerHits.join(', ')}`);
  const forbiddenOrchestration = [
    'readCurrentFixedEventIndexYamlWithStructuredEdits',
    'syncFixedEventIndexStructuredEditorToYamlPreview',
    'applyFixedEventIndexYamlToEditorModel',
    'applyFixedEventIndexRowOperation',
    'renameFixedEventIndexRowIdAfterInput',
  ];
  const orchestrationHits = forbiddenOrchestration.filter(name => source.includes(name));
  assert(
    orchestrationHits.length === 0,
    `widget host 不得继续拥有 editor state machine: ${orchestrationHits.join(', ')}`,
  );
  assert(source.includes('createFixedEventEditorSession('), 'widget host 必须创建唯一 editor session');
  assert(source.includes('fixedEventEditorSession.subscribe('), 'widget host 必须通过 subscribe 观察 async 中间状态');
  assert(source.includes('onIntent: handleFixedEventEditorBindingIntent'), 'bindings 必须只输出 typed intent');
}

function testConfirmCancelHasSettlementCallback(): void {
  const source = readFileSync(resolve(__dirname, '../../../src/calendar-float/widget/index.ts'), 'utf8');
  assert(/interface PendingWidgetConfirm[\s\S]*?onCancel\??:/.test(source), 'pending confirm 必须支持 onCancel');
  assert(readFunctionBody(source, 'closeWidgetConfirmDialog').includes('pending?.onCancel?.()'), 'cancel/backdrop 必须调用 onCancel settle Promise');
  assert(readFunctionBody(source, 'destroyFixedEventEditorSession').includes('pending?.onCancel?.()'), 'widget teardown 必须 settle 尚未完成的 confirm');
}

function main(): void {
  testLoadingModelIsExplicitAndNotDirty();
  testRuntimeMonthAliasBackfillKeepsOneToTwelveShape();
  testRuntimeMonthAliasHydrationStaysInPureLoadPolicy();
  testWidgetHostUsesOneSessionOwner();
  testConfirmCancelHasSettlementCallback();
  console.log('widget/fixed-event-editor-host.check.ts OK');
}

main();
