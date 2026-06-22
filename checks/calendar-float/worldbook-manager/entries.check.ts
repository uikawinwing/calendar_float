import {
  buildManagedWorldbookEntries,
  hasExpectedManagedEntries,
  isManagedWorldbookEntry,
  mergeManagedEntry,
  readVariableListEntry,
} from '../../../src/calendar-float/worldbook-manager/entries';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function createEntry(name: string, overrides: Partial<WorldbookEntry> = {}): WorldbookEntry {
  return {
    uid: 1,
    name,
    enabled: true,
    strategy: { type: 'constant', keys: [], keys_secondary: { logic: 'and_any', keys: [] }, scan_depth: 'same_as_global' },
    position: { type: 'at_depth', role: 'system', depth: 1, order: 999 },
    content: 'old',
    probability: 100,
    recursion: { prevent_incoming: true, prevent_outgoing: true, delay_until: null },
    effect: { sticky: null, cooldown: null, delay: null },
    ...overrides,
  };
}

function testBuildManagedWorldbookEntriesCreatesTwoExpectedEntries(): void {
  const entries = buildManagedWorldbookEntries();
  assert(entries.length === 2, '应该生成两个托管基础条目');
  assert(entries[0]?.name === '[mvu_update][月历球][月历变量更新规则]', '第一个条目应该使用通用更新规则短名');
  assert(entries[1]?.name === '[月历球][当前月历内容展示]', '第二个条目应该使用通用变量展示短名');
}

function testIsManagedWorldbookEntryRecognizesMarkerAndPrefix(): void {
  assert(isManagedWorldbookEntry(createEntry('[月历球][当前月历内容展示]')), '通用短名应该识别为托管条目');
  assert(isManagedWorldbookEntry(createEntry('[DLC][扩展][月历球][当前月历内容展示]')), '命定之诗旧前缀命名应该识别为托管条目');
  assert(
    isManagedWorldbookEntry(createEntry('[DLC][扩展][月历球][月历变量更新规则][mvu_update]')),
    '命定之诗旧更新规则命名应该识别为托管条目',
  );
  assert(
    isManagedWorldbookEntry(createEntry('任意名字', { extra: { managedBy: 'calendar_float_character_worldbook' } })),
    'managedBy marker 应该识别为托管条目',
  );
}

function testExpectedEntriesAcceptGenericShortNames(): void {
  const entries = [
    createEntry('[mvu_update][月历球][月历变量更新规则]'),
    createEntry('[月历球][当前月历内容展示]'),
  ];
  assert(hasExpectedManagedEntries(entries), '通用短名应该满足基础规则完整性检查');
  assert(readVariableListEntry(entries)?.name === '[月历球][当前月历内容展示]', '变量展示读取应该优先匹配通用短名');
}

function testExpectedEntriesAcceptProfileDecoratedNames(): void {
  const entries = [
    createEntry('[DLC][扩展][月历球][月历变量更新规则][mvu_update]'),
    createEntry('[DLC][扩展][月历球]][当前月历内容展示](△一串-有月历及节庆提醒功能的球，简称月球)'),
  ];
  assert(hasExpectedManagedEntries(entries), '命定之诗装饰命名应该满足基础规则完整性检查');
  assert(
    readVariableListEntry(entries)?.name?.includes('当前月历内容展示'),
    '变量展示读取应该匹配带 profile 前缀和说明后缀的命名',
  );
}

function testMergeManagedEntryPreservesNestedWorldbookShape(): void {
  const merged = mergeManagedEntry(
    createEntry('foo', {
      strategy: {
        type: 'selective',
        keys: ['a'],
        keys_secondary: { logic: 'and_all', keys: ['b'] },
        scan_depth: 3,
      },
      extra: { old: true },
    }),
    {
      content: 'new',
      extra: { version: 'v4.1.0' },
      strategy: { type: 'constant', keys: [], keys_secondary: { logic: 'and_any', keys: [] }, scan_depth: 'same_as_global' },
    },
  );

  assert(merged.content === 'new', 'seed 内容应该覆盖旧内容');
  assert(merged.extra?.old === true, '旧 extra 字段应该保留');
  assert(merged.extra?.version === 'v4.1.0', 'seed extra 字段应该合并进去');
  assert(merged.strategy?.keys_secondary.logic === 'and_any', '嵌套 strategy 应该按 seed 覆盖');
}

function main(): void {
  testBuildManagedWorldbookEntriesCreatesTwoExpectedEntries();
  testIsManagedWorldbookEntryRecognizesMarkerAndPrefix();
  testExpectedEntriesAcceptGenericShortNames();
  testExpectedEntriesAcceptProfileDecoratedNames();
  testMergeManagedEntryPreservesNestedWorldbookShape();
  console.log('entries.check.ts OK');
}

main();
