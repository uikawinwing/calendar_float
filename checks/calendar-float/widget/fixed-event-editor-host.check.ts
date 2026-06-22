import { buildFixedEventMonthAliasesFromRuntime, createFixedEventIndexEditorLoadingModel } from '../../../src/calendar-float/widget/fixed-event-editor-host';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
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

function main(): void {
  testLoadingModelIsExplicitAndNotDirty();
  testRuntimeMonthAliasBackfillKeepsOneToTwelveShape();
  console.log('widget/fixed-event-editor-host.check.ts OK');
}

main();
