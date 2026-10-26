import { parse as parseYaml } from 'yaml';
import {
  applyFixedEventIndexRowOperationsToYaml,
  applyFixedEventIndexStructuredEditsToYaml,
  parseFixedEventIndexDraft,
  renameFixedEventIndexRowIdInYaml,
  serializeFixedEventIndexDraft,
} from '../../../src/calendar-float/fixed-event-index-editor';

const SOURCE = { entryName: '[fixed_event_index]', worldbookName: '测试世界书' };

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertThrows(run: () => unknown, message: string): void {
  let didThrow = false;
  try {
    run();
  } catch {
    didThrow = true;
  }
  assert(didThrow, message);
}

function testInvalidYamlBlocksSaveAndAllEdits(): void {
  const draft = parseFixedEventIndexDraft('固定事件: [', SOURCE);
  assert(!draft.canSave, '无效 YAML 必须阻止保存');
  assert(
    draft.saveBlockedReasons.some(reason => reason.startsWith('YAML 解析失败：')),
    '解析失败应显示原因',
  );

  assertThrows(
    () =>
      applyFixedEventIndexStructuredEditsToYaml({
        sourceYaml: '固定事件: [',
        sourceInfo: SOURCE,
        groups: [],
        events: [],
        materials: [],
      }),
    '结构化编辑不得把无效 YAML 转成空索引',
  );
  assertThrows(
    () =>
      renameFixedEventIndexRowIdInYaml({
        sourceYaml: '固定事件: [',
        sourceInfo: SOURCE,
        scope: 'event',
        oldId: 'event_1',
        newId: 'event_2',
      }),
    '重命名不得把无效 YAML 转成空索引',
  );
  assertThrows(
    () =>
      applyFixedEventIndexRowOperationsToYaml({
        sourceYaml: '固定事件: [',
        sourceInfo: SOURCE,
        addEvents: [{ id: 'event_1', name: '事件', start: '01-01' }],
      }),
    '行操作不得把无效 YAML 转成空索引',
  );
}

function testAdvancedLogicBlocksSaveAndEditsButSurvivesParse(): void {
  const sourceYaml = `
月份别名:
  - 月份: 2
    名称: 新芽
    自定义历法字段: keep-month-extension
固定事件:
  - id: event_1
    名称: 测试节庆
    开始: 05-14
    完整逻辑:
      条件: [角色.状态, 等于, 活跃]
    阶段:
      - id: stage_1
        名称: 庆典
        开始: 05-14
        提醒:
          logic_tree:
            条件: [玩家.地点, 包含, 城市]
    介绍:
      条目名: 测试正文
      logic_tree:
        条件: [角色.好感, 大于, 10]
    提醒:
      逻辑树:
        条件: [世界.时间, 存在]
`;
  const draft = parseFixedEventIndexDraft(sourceYaml, SOURCE);
  assert(!draft.canSave, '高级逻辑必须阻止保存');
  assert(
    draft.saveBlockedReasons.some(reason => reason.includes('阶段提醒') && reason.includes('不能安全保存')),
    '阶段提醒高级逻辑应阻止保存',
  );

  const output = parseYaml(serializeFixedEventIndexDraft(draft)) as any;
  assert(output.固定事件[0].完整逻辑.条件[0] === '角色.状态', '事件完整逻辑应保留');
  assert(output.固定事件[0].阶段[0].提醒.logic_tree.条件[0] === '玩家.地点', '阶段提醒逻辑树应保留');
  assert(output.固定事件[0].介绍.logic_tree.条件[0] === '角色.好感', '介绍逻辑树应保留');
  assert(output.固定事件[0].提醒.逻辑树.条件[0] === '世界.时间', '提醒逻辑树应保留');

  assertThrows(
    () =>
      applyFixedEventIndexStructuredEditsToYaml({
        sourceYaml,
        sourceInfo: SOURCE,
        groups: [],
        events: [],
        materials: [],
      }),
    '结构编辑不得覆盖含完整逻辑的源索引',
  );
  assertThrows(
    () =>
      renameFixedEventIndexRowIdInYaml({
        sourceYaml,
        sourceInfo: SOURCE,
        scope: 'event',
        oldId: 'event_1',
        newId: 'event_renamed',
      }),
    '重命名不得覆盖含完整逻辑的源索引',
  );
  assertThrows(
    () =>
      applyFixedEventIndexRowOperationsToYaml({
        sourceYaml,
        sourceInfo: SOURCE,
        addGroups: [{ id: 'group_new', name: '新分组' }],
      }),
    '行编辑不得覆盖含完整逻辑的源索引',
  );
}

function testMonthAliasExtensionsSurviveStructuredEditing(): void {
  const outputYaml = applyFixedEventIndexStructuredEditsToYaml({
    sourceYaml: `月份别名:\n  - 月份: 2\n    名称: 新芽\n    自定义历法字段: keep-month-extension\n`,
    sourceInfo: SOURCE,
    monthAliases: [{ month: '2', name: '萌芽', season: '春季' }],
    groups: [],
    events: [],
    materials: [],
  });
  const output = parseYaml(outputYaml) as any;
  assert(output.月份别名[0].名称 === '萌芽', '月份别名字段应按输入更新');
  assert(output.月份别名[0].自定义历法字段 === 'keep-month-extension', '月份别名扩展字段应保留');
}

function testMonthAliasExtensionsFollowMonthsWhenMonthsAreAddedOrReordered(): void {
  const outputYaml = applyFixedEventIndexStructuredEditsToYaml({
    sourceYaml: `月份别名:\n  - 月份: 6\n    名称: June\n    自定义历法字段: six-only\n`,
    sourceInfo: SOURCE,
    monthAliases: [
      { month: '1', name: 'January' },
      { month: '6', name: 'June' },
    ],
    groups: [],
    events: [],
    materials: [],
  });
  const output = parseYaml(outputYaml) as any;
  assert(output.月份别名[0].月份 === 1, '新增月份别名应保留输入顺序');
  assert(!output.月份别名[0].自定义历法字段, '新月份不得继承其他月份的扩展字段');
  assert(output.月份别名[1].月份 === 6, '原月份别名应允许重排');
  assert(output.月份别名[1].自定义历法字段 === 'six-only', '扩展字段必须跟随匹配的月份保留');
}

testInvalidYamlBlocksSaveAndAllEdits();
testAdvancedLogicBlocksSaveAndEditsButSurvivesParse();
testMonthAliasExtensionsSurviveStructuredEditing();
testMonthAliasExtensionsFollowMonthsWhenMonthsAreAddedOrReordered();
console.log('data-safety.check.ts OK');
