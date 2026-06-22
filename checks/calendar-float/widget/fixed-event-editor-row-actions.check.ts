import type { FixedEventIndexDraft } from '../../../src/calendar-float/fixed-event-index-editor';
import {
  buildFixedEventEditorRowAction,
  type FixedEventEditorRowIdentity,
} from '../../../src/calendar-float/widget/fixed-event-editor-row-actions';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function createDraft(): FixedEventIndexDraft {
  return {
    entryName: '[fixed_event_index]',
    worldbookName: '命定之诗',
    canSave: true,
    saveBlockedReasons: [],
    warnings: [],
    profile: { settings: { paths: { unknownFields: {} }, date: { unknownFields: {} }, unknownFields: {} } },
    metadata: {},
    defaults: { unknownFields: {} },
    reminderDefaults: { unknownFields: {}, templateUnknownFields: {} },
    bookDefaults: { unknownFields: {} },
    monthAliases: [],
    groups: [{ id: 'group_1', name: '旧分组', eventIds: ['event_1'], unknownFields: {} }],
    events: [
      {
        id: 'event_1',
        name: '旧事件',
        enabled: true,
        groupId: 'group_1',
        start: '01-02',
        end: '01-04',
        locationKeywords: [],
        stages: [
          {
            id: 'stage_new_1',
            name: '旧阶段',
            enabled: true,
            start: '01-02',
            end: '01-03',
            reminder: {
              enabled: false,
              outputMode: 'silent_scan',
              keywords: [],
              userKeywords: [],
              hasUnsupportedAdvancedLogic: false,
              unknownFields: {},
            },
            unknownFields: {},
          },
        ],
        intro: {
          enabled: false,
          entryName: '',
          keywords: [],
          userKeywords: [],
          hasUnsupportedAdvancedLogic: false,
          unknownFields: {},
        },
        reminder: {
          enabled: false,
          outputMode: 'silent_scan',
          keywords: [],
          userKeywords: [],
          hasUnsupportedAdvancedLogic: false,
          unknownFields: {},
        },
        relatedMaterialIds: [],
        triggerGroups: { messageKeywords: [], userKeywords: [], secondaryKeywordGroups: [] },
        hasUnsupportedAdvancedLogic: false,
        unknownFields: {},
      },
    ],
    materials: [{ id: 'material_1', title: '旧资料', enabled: true, eventIds: [], messageKeywords: [], userKeywords: [], secondaryKeywordGroups: [], hasUnsupportedAdvancedLogic: false, unknownFields: {} }],
    unknownTopLevelFields: {},
  };
}

function testAddEventUsesDefaultGroupAndSelectsNewEvent(): void {
  const result = buildFixedEventEditorRowAction({ draft: createDraft(), operation: 'add-event', row: {} });
  assert(result.operationInput.addEvents?.[0]?.id === 'event_new_1', '新增事件 id 应该使用 event_new_1');
  assert(result.operationInput.addEvents?.[0]?.groupId === 'group_1', '新增事件应该使用当前默认分组');
  assert(result.operationInput.addEvents?.[0]?.start === '01-01', '新增事件 start 应该保持现有默认值');
  assert(result.message === '已新增一行到 YAML，尚未保存到世界书', '新增消息应该保持不变');
  assert(result.nextSelection?.scope === 'event' && result.nextSelection.id === 'event_new_1', '新增事件后应该选中新事件');
  assert(result.nextSelection?.detailTab === 'basic', '新增事件后应该打开 basic tab');
}

function testAddStageUsesTargetEventDatesAndNextStageId(): void {
  const row: FixedEventEditorRowIdentity = { eventId: 'event_1' };
  const result = buildFixedEventEditorRowAction({ draft: createDraft(), operation: 'add-stage', row });
  const stage = result.operationInput.addStages?.[0];
  assert(stage?.eventId === 'event_1', '新增阶段应该挂到目标事件');
  assert(stage?.id === 'stage_new_2', '新增阶段应该避开已有 stage_new_1');
  assert(stage?.start === '01-02' && stage?.end === '01-04', '新增阶段应该沿用事件日期');
  assert(result.nextSelection?.scope === 'stage' && result.nextSelection.id === 'stage_new_2', '新增阶段后应该选中新阶段');
}

function testRemoveAndMoveRowsBuildExpectedCommands(): void {
  const draft = createDraft();
  const removeEvent = buildFixedEventEditorRowAction({
    draft,
    operation: 'remove-row',
    row: { scope: 'event', id: 'event_1' },
  });
  assert(removeEvent.operationInput.deleteEventIds?.[0] === 'event_1', '删除事件应该输出 deleteEventIds');
  assert(removeEvent.message === '已从 YAML 移除这一行，尚未保存到世界书', '删除消息应该保持不变');
  assert(removeEvent.nextSelection?.scope === 'overview', '删除事件后应该回到 overview');

  const moveStage = buildFixedEventEditorRowAction({
    draft,
    operation: 'move-stage-down',
    row: { eventId: 'event_1', id: 'stage_new_1' },
  });
  assert(moveStage.operationInput.moveStages?.[0]?.direction === 'down', '移动阶段应该输出方向');
  assert(moveStage.message === '已调整阶段顺序，尚未保存到世界书', '移动消息应该保持不变');
  assert(moveStage.nextSelection === null, '移动阶段不应该强制切 selection');
}

function main(): void {
  testAddEventUsesDefaultGroupAndSelectsNewEvent();
  testAddStageUsesTargetEventDatesAndNextStageId();
  testRemoveAndMoveRowsBuildExpectedCommands();
  console.log('widget/fixed-event-editor-row-actions.check.ts OK');
}

main();
