import {
  buildManagedBackendMoveCandidates,
  cloneMoveCandidateEntry,
  mapRuntimeMoveCandidate,
  planSourceEntryRemovals,
} from '../../../src/calendar-float/worldbook-manager/transfer';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function createEntry(name: string, extra: Record<string, unknown> = {}): Partial<WorldbookEntry> {
  return {
    uid: 101,
    name,
    content: `${name} content`,
    extra,
  } as Partial<WorldbookEntry>;
}

function testBuildBackendMoveCandidatesUsesStableUtilityIds(): void {
  const candidates = buildManagedBackendMoveCandidates({
    targetName: '脚本内置',
    entries: [
      {
        name: '[mvu_update][DLC][扩展][月历球][月历变量更新规则]',
        extra: { entryKind: 'mvu_update_rule' },
      },
    ],
  });

  assert(candidates.length === 1, '应该生成后端托管条目搬运候选');
  assert(candidates[0]?.id === 'backend::mvu_update_rule', 'backend 候选 id 应由 entryKind 稳定生成');
  assert(candidates[0]?.sourceGroup === 'utility', 'backend 候选来源分组应该是 utility');
  assert(candidates[0]?.sourceWorldbookName === '脚本内置', 'backend 候选应该保留目标来源名');
  assert(candidates[0]?.selectedByDefault === true, 'backend 候选默认应被选中');
}

function testMapRuntimeMoveCandidateDerivesSourceGroupFromLabel(): void {
  const bookCandidate = mapRuntimeMoveCandidate({
    id: 'runtime_content::书::条目',
    label: '读物：古籍 / 第一章',
    kind: 'runtime_content',
    sourceWorldbookName: '读物世界书',
    entryName: '第一章',
    entry: createEntry('第一章'),
    selectedByDefault: true,
  });
  const eventCandidate = mapRuntimeMoveCandidate({
    id: 'runtime_content::节庆::丰收祭',
    label: '节庆：丰收祭',
    kind: 'runtime_content',
    sourceWorldbookName: '节庆世界书',
    entryName: '丰收祭',
    entry: createEntry('丰收祭'),
    selectedByDefault: false,
  });

  assert(bookCandidate.sourceGroup === 'book', 'label 包含读物时应该分到 book');
  assert(eventCandidate.sourceGroup === 'event', '普通 runtime 候选应该分到 event');
  assert(eventCandidate.selectedByDefault === false, 'runtime 候选默认选择状态应该保留');
}

function testCloneMoveCandidateDropsUidAndStampsExternalSource(): void {
  const cloned = cloneMoveCandidateEntry({
    id: 'runtime_content::节庆::丰收祭',
    label: '节庆：丰收祭',
    kind: 'runtime_content',
    sourceGroup: 'event',
    sourceWorldbookName: '节庆世界书',
    entryName: '丰收祭',
    entry: createEntry('旧名字', { keep: true }),
    selectedByDefault: true,
  });

  assert(!('uid' in cloned), '搬运 clone 不应该保留 uid');
  assert(cloned.name === '丰收祭', '搬运 clone 应该使用 candidate.entryName 作为 name');
  assert(cloned.extra?.keep === true, '搬运 clone 应该保留原 extra');
  assert(cloned.extra?.calendarFloatMovedFrom === '节庆世界书', '非 utility 来源应该记录原世界书');
}

function testPlanSourceEntryRemovalsSkipsUtilityAndTargetWorldbook(): void {
  const plan = planSourceEntryRemovals({
    removeFromSource: true,
    targetWorldbookName: '目标世界书',
    candidates: [
      {
        id: 'backend::mvu_update_rule',
        label: '基础规则',
        kind: 'backend_update_rules',
        sourceGroup: 'utility',
        sourceWorldbookName: '脚本内置',
        entryName: '基础规则',
        entry: createEntry('基础规则'),
        selectedByDefault: true,
      },
      {
        id: 'runtime_content::节庆::丰收祭',
        label: '节庆：丰收祭',
        kind: 'runtime_content',
        sourceGroup: 'event',
        sourceWorldbookName: '节庆世界书',
        entryName: '丰收祭',
        entry: createEntry('丰收祭'),
        selectedByDefault: true,
      },
      {
        id: 'runtime_content::目标::已在目标',
        label: '节庆：已在目标',
        kind: 'runtime_content',
        sourceGroup: 'event',
        sourceWorldbookName: '目标世界书',
        entryName: '已在目标',
        entry: createEntry('已在目标'),
        selectedByDefault: true,
      },
    ],
  });

  assert(plan.length === 1, '只应该计划删除非 utility 且不在目标世界书的来源条目');
  assert(plan[0]?.sourceWorldbookName === '节庆世界书', '删除计划应该按来源世界书分组');
  assert(plan[0]?.entryNames.length === 1 && plan[0]?.entryNames[0] === '丰收祭', '删除计划应该列出条目名');

  const disabledPlan = planSourceEntryRemovals({
    removeFromSource: false,
    targetWorldbookName: '目标世界书',
    candidates: plan.map(item => ({
      id: item.sourceWorldbookName,
      label: item.sourceWorldbookName,
      kind: 'runtime_content',
      sourceGroup: 'event',
      sourceWorldbookName: item.sourceWorldbookName,
      entryName: item.entryNames[0] ?? '',
      entry: createEntry(item.entryNames[0] ?? ''),
      selectedByDefault: true,
    })),
  });

  assert(disabledPlan.length === 0, 'removeFromSource=false 时不应该计划删除来源条目');
}

function main(): void {
  testBuildBackendMoveCandidatesUsesStableUtilityIds();
  testMapRuntimeMoveCandidateDerivesSourceGroupFromLabel();
  testCloneMoveCandidateDropsUidAndStampsExternalSource();
  testPlanSourceEntryRemovalsSkipsUtilityAndTargetWorldbook();
  console.log('transfer.check.ts OK');
}

main();
