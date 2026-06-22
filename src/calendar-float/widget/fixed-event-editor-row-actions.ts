import type {
  FixedEventDraft,
  FixedEventIndexDraft,
  FixedEventIndexEditorSelection,
  FixedEventIndexRowOperationInput,
} from '../fixed-event-index-editor';

export type FixedEventEditorRowOperation =
  | 'add-group'
  | 'add-event'
  | 'add-material'
  | 'add-stage'
  | 'remove-row'
  | 'remove-stage'
  | 'move-stage-up'
  | 'move-stage-down';

export interface FixedEventEditorRowIdentity {
  scope?: string;
  id?: string;
  eventId?: string;
}

export interface FixedEventEditorRowActionResult {
  operationInput: Omit<FixedEventIndexRowOperationInput, 'sourceYaml' | 'sourceInfo'>;
  message: string;
  nextSelection: FixedEventIndexEditorSelection | null;
}

function nextFixedEventIndexId(prefix: string, usedIds: string[]): string {
  const used = new Set(usedIds);
  let index = 1;
  while (used.has(`${prefix}_${index}`)) {
    index += 1;
  }
  return `${prefix}_${index}`;
}

function pickDefaultFixedEventGroupId(events: FixedEventDraft[]): string | undefined {
  return events.find(event => event.groupId)?.groupId;
}

function nextFixedEventStageId(event: FixedEventDraft | undefined): string {
  return nextFixedEventIndexId('stage_new', event?.stages?.map(stage => stage.id) ?? []);
}

function getSelectedFixedEventIndexGroupAfterDelete(rowId: string): FixedEventIndexEditorSelection {
  return { section: 'events', scope: 'overview', id: rowId || undefined };
}

function getSelectedFixedEventIndexAfterRowOperation(
  operation: FixedEventEditorRowOperation,
  row: FixedEventEditorRowIdentity,
  nextIds: { groupId: string; eventId: string; materialId: string; stageId: string },
): FixedEventIndexEditorSelection | null {
  const rowScope = String(row.scope ?? '');
  const rowId = String(row.id ?? '').trim();
  const stageEventId = String(row.eventId ?? '').trim();

  if (operation === 'add-group') {
    return { section: 'events', scope: 'group', id: nextIds.groupId };
  }
  if (operation === 'add-event') {
    return { section: 'events', scope: 'event', id: nextIds.eventId, detailTab: 'basic' };
  }
  if (operation === 'add-material') {
    return { section: 'materials', scope: 'material', id: nextIds.materialId };
  }
  if (operation === 'add-stage') {
    return { section: 'events', scope: 'stage', eventId: stageEventId, id: nextIds.stageId };
  }
  if (operation === 'remove-stage') {
    return { section: 'events', scope: 'event', id: stageEventId, detailTab: 'stages' };
  }
  if (operation === 'remove-row' && rowScope === 'group') {
    return getSelectedFixedEventIndexGroupAfterDelete(rowId);
  }
  if (operation === 'remove-row' && rowScope === 'event') {
    return { section: 'events', scope: 'overview' };
  }
  if (operation === 'remove-row' && rowScope === 'material') {
    return { section: 'materials', scope: 'overview' };
  }
  return null;
}

function getFixedEventEditorRowOperationMessage(operation: FixedEventEditorRowOperation): string {
  if (operation === 'remove-row' || operation === 'remove-stage') {
    return '已从 YAML 移除这一行，尚未保存到世界书';
  }
  if (operation === 'move-stage-up' || operation === 'move-stage-down') {
    return '已调整阶段顺序，尚未保存到世界书';
  }
  return '已新增一行到 YAML，尚未保存到世界书';
}

export function buildFixedEventEditorRowAction(args: {
  draft: FixedEventIndexDraft;
  operation: FixedEventEditorRowOperation;
  row: FixedEventEditorRowIdentity;
}): FixedEventEditorRowActionResult {
  const { draft, operation } = args;
  const row = {
    scope: String(args.row.scope ?? ''),
    id: String(args.row.id ?? '').trim(),
    eventId: String(args.row.eventId ?? '').trim(),
  };
  const nextIds = {
    groupId: nextFixedEventIndexId(
      'group_new',
      draft.groups.map(group => group.id),
    ),
    eventId: nextFixedEventIndexId(
      'event_new',
      draft.events.map(event => event.id),
    ),
    materialId: nextFixedEventIndexId(
      'material_new',
      draft.materials.map(material => material.id),
    ),
    stageId: nextFixedEventStageId(draft.events.find(event => event.id === row.eventId)),
  };
  const stageEvent = draft.events.find(event => event.id === row.eventId);

  return {
    operationInput: {
      addGroups: operation === 'add-group' ? [{ id: nextIds.groupId, name: '新分组', eventIds: [] }] : undefined,
      addEvents:
        operation === 'add-event'
          ? [
              {
                id: nextIds.eventId,
                name: '新固定事件',
                groupId: pickDefaultFixedEventGroupId(draft.events) ?? draft.groups[0]?.id,
                start: '01-01',
                end: '01-01',
              },
            ]
          : undefined,
      addMaterials: operation === 'add-material' ? [{ id: nextIds.materialId, title: '新补充资料', eventIds: [] }] : undefined,
      addStages:
        operation === 'add-stage' && stageEvent
          ? [
              {
                eventId: stageEvent.id,
                id: nextIds.stageId,
                name: '新阶段',
                start: stageEvent.start,
                end: stageEvent.end,
              },
            ]
          : undefined,
      deleteGroupIds: operation === 'remove-row' && row.scope === 'group' && row.id ? [row.id] : undefined,
      deleteEventIds: operation === 'remove-row' && row.scope === 'event' && row.id ? [row.id] : undefined,
      deleteMaterialIds: operation === 'remove-row' && row.scope === 'material' && row.id ? [row.id] : undefined,
      deleteStages: operation === 'remove-stage' && row.eventId && row.id ? [{ eventId: row.eventId, id: row.id }] : undefined,
      moveStages:
        (operation === 'move-stage-up' || operation === 'move-stage-down') && row.eventId && row.id
          ? [
              {
                eventId: row.eventId,
                id: row.id,
                direction: operation === 'move-stage-up' ? 'up' : 'down',
              },
            ]
          : undefined,
    },
    message: getFixedEventEditorRowOperationMessage(operation),
    nextSelection: getSelectedFixedEventIndexAfterRowOperation(operation, row, nextIds),
  };
}
