import { parseFixedEventIndexDraft } from './parse';
import { serializeFixedEventIndexDraft } from './serialize';
import type {
  FixedEventBookDefaultsDraft,
  FixedEventDraft,
  FixedEventGroupDraft,
  FixedEventIndexSourceInfo,
  FixedEventMaterialDraft,
  FixedEventMonthAliasDraft,
  FixedEventReminderDefaultsDraft,
  FixedEventStageDraft,
} from './draft-types';

export interface FixedEventDefaultsStructuredEdit {
  mvuTimePath?: string;
  mvuLocationPath?: string;
  fullBookTriggerTemplate?: string;
}

export interface FixedEventMonthAliasStructuredEdit {
  month: string;
  name: string;
  season?: string;
}

export interface FixedEventReminderDefaultsStructuredEdit {
  outputMode?: string;
  injectDepth?: string;
  disableRecursive?: string;
  disableKeywords?: string;
  macroTemplate?: string;
  inactiveTemplate?: string;
  activeTemplate?: string;
}

export interface FixedEventBookDefaultsStructuredEdit {
  summaryOutputMode?: string;
  summaryInjectDepth?: string;
}

export interface FixedEventGroupStructuredEdit {
  id: string;
  name: string;
  iconSvgFilename?: string;
  eventIdsText: string;
}

export interface FixedEventStructuredEdit {
  id: string;
  name?: string;
  groupId?: string;
  start?: string;
  end?: string;
  locationKeywordsText?: string;
  introEntryName?: string;
  introSummaryText?: string;
  recurrenceIntervalYears?: string;
  recurrenceLastYear?: string;
  relatedMaterialIdsText?: string;
  reminderEnabled?: string;
  reminderPrepareDays?: string;
  reminderOutputMode?: string;
  reminderInjectDepth?: string;
  reminderMacroToken?: string;
  reminderInactiveText?: string;
  reminderActiveText?: string;
}

export interface FixedEventStageStructuredEdit {
  eventId: string;
  id: string;
  nextId?: string;
  name: string;
  start: string;
  end: string;
  reminderEnabled?: string;
  reminderPrepareDays?: string;
  reminderOutputMode?: string;
  reminderInjectDepth?: string;
  reminderMacroToken?: string;
  reminderInactiveText?: string;
  reminderActiveText?: string;
}

export interface FixedEventMaterialStructuredEdit {
  id: string;
  title: string;
  eventIdsText: string;
  summaryText?: string;
  fullTextWorldbookName?: string;
  fullTextEntryName?: string;
}

export interface FixedEventIndexStructuredEditInput {
  sourceYaml: string;
  sourceInfo: FixedEventIndexSourceInfo;
  defaults?: FixedEventDefaultsStructuredEdit;
  reminderDefaults?: FixedEventReminderDefaultsStructuredEdit;
  bookDefaults?: FixedEventBookDefaultsStructuredEdit;
  monthAliases?: FixedEventMonthAliasStructuredEdit[];
  groups: FixedEventGroupStructuredEdit[];
  events: FixedEventStructuredEdit[];
  stages?: FixedEventStageStructuredEdit[];
  materials: FixedEventMaterialStructuredEdit[];
}

export interface FixedEventGroupRowAddition {
  id: string;
  name: string;
  iconSvgFilename?: string;
  eventIds?: string[];
}

export interface FixedEventRowAddition {
  id: string;
  name: string;
  groupId?: string;
  start: string;
  end?: string;
}

export interface FixedEventMaterialRowAddition {
  id: string;
  title: string;
  eventIds?: string[];
  summaryText?: string;
  fullTextWorldbookName?: string;
  fullTextEntryName?: string;
}

export interface FixedEventStageRowAddition {
  eventId: string;
  id: string;
  name: string;
  start: string;
  end?: string;
  reminderPrepareDays?: number;
}

export interface FixedEventStageRowDeletion {
  eventId: string;
  id: string;
}

export interface FixedEventStageRowMove {
  eventId: string;
  id: string;
  direction: 'up' | 'down';
}

export interface FixedEventIndexRowOperationInput {
  sourceYaml: string;
  sourceInfo: FixedEventIndexSourceInfo;
  addGroups?: FixedEventGroupRowAddition[];
  addEvents?: FixedEventRowAddition[];
  addMaterials?: FixedEventMaterialRowAddition[];
  addStages?: FixedEventStageRowAddition[];
  deleteGroupIds?: string[];
  deleteEventIds?: string[];
  deleteMaterialIds?: string[];
  deleteStages?: FixedEventStageRowDeletion[];
  moveStages?: FixedEventStageRowMove[];
}

export type FixedEventIndexEditableRowScope = 'group' | 'event' | 'material';

export interface FixedEventIndexRenameIdInput {
  sourceYaml: string;
  sourceInfo: FixedEventIndexSourceInfo;
  scope: FixedEventIndexEditableRowScope;
  oldId: string;
  newId: string;
}

function splitListText(value: string): string[] {
  return [
    ...new Set(
      String(value || '')
        .split(/[\n,，、]+/)
        .map(item => item.trim())
        .filter(Boolean),
    ),
  ];
}

function normalizeOptionalText(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function normalizeOptionalNumberText(value: string | undefined): number | undefined {
  const text = normalizeOptionalText(value);
  if (!text) {
    return undefined;
  }
  const number = Number(text);
  return Number.isFinite(number) ? number : undefined;
}

function normalizeBooleanText(value: string | undefined, fallback: boolean): boolean {
  const text = String(value ?? '')
    .trim()
    .toLowerCase();
  if (text === 'false' || text === '0' || text === '否' || text === '关闭') {
    return false;
  }
  if (text === 'true' || text === '1' || text === '是' || text === '开启') {
    return true;
  }
  return fallback;
}

function hasReminderEdit(edit: FixedEventStructuredEdit): boolean {
  return (
    edit.reminderEnabled !== undefined ||
    edit.reminderPrepareDays !== undefined ||
    edit.reminderOutputMode !== undefined ||
    edit.reminderInjectDepth !== undefined ||
    edit.reminderMacroToken !== undefined ||
    edit.reminderInactiveText !== undefined ||
    edit.reminderActiveText !== undefined
  );
}

function hasStageReminderEdit(edit: FixedEventStageStructuredEdit): boolean {
  return (
    edit.reminderEnabled !== undefined ||
    edit.reminderPrepareDays !== undefined ||
    edit.reminderOutputMode !== undefined ||
    edit.reminderInjectDepth !== undefined ||
    edit.reminderMacroToken !== undefined ||
    edit.reminderInactiveText !== undefined ||
    edit.reminderActiveText !== undefined
  );
}

function hasIntroEdit(edit: FixedEventStructuredEdit): boolean {
  return edit.introEntryName !== undefined || edit.introSummaryText !== undefined;
}

function buildRecurrenceEdit(edit: FixedEventStructuredEdit, event: FixedEventDraft): FixedEventDraft['recurrence'] {
  const intervalYears =
    edit.recurrenceIntervalYears === undefined
      ? event.recurrence?.intervalYears
      : normalizeOptionalNumberText(edit.recurrenceIntervalYears);
  const lastYear =
    edit.recurrenceLastYear === undefined
      ? event.recurrence?.lastYear
      : normalizeOptionalNumberText(edit.recurrenceLastYear);
  if (intervalYears === undefined && lastYear === undefined) {
    return undefined;
  }
  if (intervalYears === undefined || lastYear === undefined) {
    return event.recurrence;
  }
  return {
    intervalYears,
    lastYear,
  };
}

function buildEventEndEdit(edit: FixedEventStructuredEdit, event: FixedEventDraft): string {
  if (edit.end === undefined) {
    return event.end;
  }
  const nextEnd = edit.end.trim();
  if (nextEnd) {
    return nextEnd;
  }
  return edit.start?.trim() || event.end;
}

function buildMonthAliasDraft(edit: FixedEventMonthAliasStructuredEdit): FixedEventMonthAliasDraft {
  return {
    month: normalizeOptionalNumberText(edit.month) ?? 0,
    name: edit.name.trim(),
    season: normalizeOptionalText(edit.season),
    unknownFields: {},
  };
}

function normalizeOutputMode(value: string | undefined): 'silent_scan' | 'injectprompt' | undefined {
  return value === 'silent_scan' || value === 'injectprompt' ? value : undefined;
}

function buildReminderDefaultsEdit(
  edit: FixedEventReminderDefaultsStructuredEdit,
  defaults: FixedEventReminderDefaultsDraft,
): FixedEventReminderDefaultsDraft {
  return {
    ...defaults,
    outputMode: normalizeOutputMode(edit.outputMode),
    injectDepth: normalizeOptionalNumberText(edit.injectDepth),
    disableRecursive: normalizeBooleanText(edit.disableRecursive, defaults.disableRecursive ?? true),
    disableKeywords: normalizeBooleanText(edit.disableKeywords, defaults.disableKeywords ?? true),
    macroTemplate: normalizeOptionalText(edit.macroTemplate),
    inactiveTemplate: normalizeOptionalText(edit.inactiveTemplate),
    activeTemplate: normalizeOptionalText(edit.activeTemplate),
  };
}

function buildBookDefaultsEdit(
  edit: FixedEventBookDefaultsStructuredEdit,
  defaults: FixedEventBookDefaultsDraft,
): FixedEventBookDefaultsDraft {
  return {
    ...defaults,
    summaryOutputMode: normalizeOptionalText(edit.summaryOutputMode),
    summaryInjectDepth: normalizeOptionalNumberText(edit.summaryInjectDepth),
  };
}

function replaceIdInList(values: string[], oldId: string, newId: string): string[] {
  return [...new Set(values.map(value => (value === oldId ? newId : value)).filter(Boolean))];
}

function removeIdsFromList(values: string[], ids: Set<string>): string[] {
  if (ids.size === 0) {
    return values;
  }
  return values.filter(value => !ids.has(value));
}

function assertCanRenameId(existingIds: string[], oldId: string, newId: string): void {
  if (!oldId) {
    throw new Error('旧 id 为空，无法重命名');
  }
  if (!newId) {
    throw new Error('新 id 为空，无法重命名');
  }
  if (oldId === newId) {
    throw new Error('新的 id 和旧 id 相同，不需要重命名');
  }
  if (!existingIds.includes(oldId)) {
    throw new Error(`找不到要重命名的 id：${oldId}`);
  }
  if (existingIds.includes(newId)) {
    throw new Error(`新的 id 已存在：${newId}`);
  }
}

function uniqueId(baseId: string, usedIds: Set<string>, fallbackId: string): string {
  const normalizedBaseId = normalizeOptionalText(baseId)?.replace(/\s+/g, '_') || fallbackId;
  if (!usedIds.has(normalizedBaseId)) {
    usedIds.add(normalizedBaseId);
    return normalizedBaseId;
  }

  let index = 1;
  while (usedIds.has(`${normalizedBaseId}_${index}`)) {
    index += 1;
  }
  const nextId = `${normalizedBaseId}_${index}`;
  usedIds.add(nextId);
  return nextId;
}

function createGroupDraft(addition: FixedEventGroupRowAddition, usedIds: Set<string>): FixedEventGroupDraft {
  const id = uniqueId(addition.id, usedIds, 'group_new');
  return {
    id,
    name: addition.name.trim() || '新分组',
    iconSvgFilename: normalizeOptionalText(addition.iconSvgFilename),
    eventIds: [...new Set(addition.eventIds?.map(item => item.trim()).filter(Boolean) ?? [])],
    unknownFields: {},
  };
}

function createEventDraft(addition: FixedEventRowAddition, usedIds: Set<string>): FixedEventDraft {
  const id = uniqueId(addition.id, usedIds, 'event_new');
  return {
    id,
    name: addition.name.trim() || '新固定事件',
    enabled: true,
    groupId: normalizeOptionalText(addition.groupId),
    start: addition.start.trim() || '01-01',
    end: addition.end?.trim() || addition.start.trim() || '01-01',
    locationKeywords: [],
    stages: [],
    intro: {
      enabled: true,
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
    triggerGroups: {
      messageKeywords: [],
      userKeywords: [],
      secondaryKeywordGroups: [],
    },
    hasUnsupportedAdvancedLogic: false,
    unknownFields: {},
  };
}

function createMaterialDraft(addition: FixedEventMaterialRowAddition, usedIds: Set<string>): FixedEventMaterialDraft {
  const id = uniqueId(addition.id, usedIds, 'material_new');
  return {
    id,
    title: addition.title.trim() || '新补充资料',
    enabled: true,
    eventIds: [...new Set(addition.eventIds?.map(item => item.trim()).filter(Boolean) ?? [])],
    summaryText: normalizeOptionalText(addition.summaryText),
    fullTextWorldbookName: normalizeOptionalText(addition.fullTextWorldbookName),
    fullTextEntryName: normalizeOptionalText(addition.fullTextEntryName),
    messageKeywords: [],
    userKeywords: [],
    secondaryKeywordGroups: [],
    hasUnsupportedAdvancedLogic: false,
    unknownFields: {},
  };
}

function createStageDraft(addition: FixedEventStageRowAddition, usedIds: Set<string>): FixedEventStageDraft {
  const id = uniqueId(addition.id, usedIds, 'stage_new');
  return {
    id,
    name: addition.name.trim() || '新阶段',
    enabled: true,
    start: addition.start.trim() || '01-01',
    end: addition.end?.trim() || addition.start.trim() || '01-01',
    reminder: {
      enabled: false,
      prepareDays: addition.reminderPrepareDays,
      outputMode: 'silent_scan',
      keywords: [],
      userKeywords: [],
      hasUnsupportedAdvancedLogic: false,
      unknownFields: {},
    },
    unknownFields: {},
  };
}

function moveStageInList(
  stages: FixedEventStageDraft[],
  stageId: string,
  direction: FixedEventStageRowMove['direction'],
): FixedEventStageDraft[] {
  const index = stages.findIndex(stage => stage.id === stageId);
  if (index < 0) {
    return stages;
  }
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= stages.length) {
    return stages;
  }
  const nextStages = [...stages];
  [nextStages[index], nextStages[targetIndex]] = [nextStages[targetIndex], nextStages[index]];
  return nextStages;
}

export function applyFixedEventIndexStructuredEditsToYaml(input: FixedEventIndexStructuredEditInput): string {
  const draft = parseFixedEventIndexDraft(input.sourceYaml, input.sourceInfo);

  if (input.defaults) {
    draft.defaults = {
      ...draft.defaults,
      mvuTimePath: normalizeOptionalText(input.defaults.mvuTimePath),
      mvuLocationPath: normalizeOptionalText(input.defaults.mvuLocationPath),
      fullBookTriggerTemplate: normalizeOptionalText(input.defaults.fullBookTriggerTemplate),
    };
  }

  if (input.reminderDefaults) {
    draft.reminderDefaults = buildReminderDefaultsEdit(input.reminderDefaults, draft.reminderDefaults);
  }

  if (input.bookDefaults) {
    draft.bookDefaults = buildBookDefaultsEdit(input.bookDefaults, draft.bookDefaults);
  }

  if (input.monthAliases) {
    draft.monthAliases = input.monthAliases.map(buildMonthAliasDraft);
  }

  const groupEdits = new Map(input.groups.map(group => [group.id, group]));
  draft.groups = draft.groups.map(group => {
    const edit = groupEdits.get(group.id);
    if (!edit) {
      return group;
    }
    return {
      ...group,
      name: edit.name.trim() || group.name,
      iconSvgFilename: normalizeOptionalText(edit.iconSvgFilename),
      eventIds: splitListText(edit.eventIdsText),
    };
  });

  const eventEdits = new Map(input.events.map(event => [event.id, event]));
  const stageEdits = new Map((input.stages ?? []).map(stage => [`${stage.eventId}::${stage.id}`, stage]));
  draft.events = draft.events.map(event => {
    const edit = eventEdits.get(event.id);
    const nextEvent = edit
      ? {
          ...event,
          name: edit.name === undefined ? event.name : edit.name.trim() || event.name,
          groupId: edit.groupId === undefined ? event.groupId : normalizeOptionalText(edit.groupId),
          start: edit.start === undefined ? event.start : edit.start.trim() || event.start,
          end: buildEventEndEdit(edit, event),
          recurrence: buildRecurrenceEdit(edit, event),
          locationKeywords:
            edit.locationKeywordsText === undefined ? event.locationKeywords : splitListText(edit.locationKeywordsText),
          intro: hasIntroEdit(edit)
            ? {
                ...event.intro,
                entryName:
                  edit.introEntryName === undefined ? event.intro.entryName : String(edit.introEntryName ?? '').trim(),
                summaryText:
                  edit.introSummaryText === undefined
                    ? event.intro.summaryText
                    : normalizeOptionalText(edit.introSummaryText),
              }
            : event.intro,
          relatedMaterialIds:
            edit.relatedMaterialIdsText === undefined
              ? event.relatedMaterialIds
              : splitListText(edit.relatedMaterialIdsText),
          reminder: hasReminderEdit(edit)
            ? {
                ...event.reminder,
                enabled: normalizeBooleanText(edit.reminderEnabled, event.reminder.enabled),
                prepareDays:
                  edit.reminderPrepareDays === undefined
                    ? event.reminder.prepareDays
                    : normalizeOptionalNumberText(edit.reminderPrepareDays),
                outputMode:
                  edit.reminderOutputMode === 'injectprompt' || edit.reminderOutputMode === 'silent_scan'
                    ? edit.reminderOutputMode
                    : event.reminder.outputMode,
                injectDepth:
                  edit.reminderInjectDepth === undefined
                    ? event.reminder.injectDepth
                    : normalizeOptionalNumberText(edit.reminderInjectDepth),
                macroToken:
                  edit.reminderMacroToken === undefined
                    ? event.reminder.macroToken
                    : normalizeOptionalText(edit.reminderMacroToken),
                inactiveText:
                  edit.reminderInactiveText === undefined
                    ? event.reminder.inactiveText
                    : normalizeOptionalText(edit.reminderInactiveText),
                activeText:
                  edit.reminderActiveText === undefined
                    ? event.reminder.activeText
                    : normalizeOptionalText(edit.reminderActiveText),
              }
            : event.reminder,
        }
      : event;

    return {
      ...nextEvent,
      stages: (nextEvent.stages ?? []).map(stage => {
        const stageEdit = stageEdits.get(`${event.id}::${stage.id}`);
        if (!stageEdit) {
          return stage;
        }
        return {
          ...stage,
          id: normalizeOptionalText(stageEdit.nextId) || stage.id,
          name: stageEdit.name.trim() || stage.name,
          start: stageEdit.start.trim() || stage.start,
          end: stageEdit.end.trim() || stageEdit.start.trim() || stage.end,
          reminder: hasStageReminderEdit(stageEdit)
            ? {
                ...stage.reminder,
                enabled: normalizeBooleanText(stageEdit.reminderEnabled, stage.reminder.enabled),
                prepareDays:
                  stageEdit.reminderPrepareDays === undefined
                    ? stage.reminder.prepareDays
                    : normalizeOptionalNumberText(stageEdit.reminderPrepareDays),
                outputMode:
                  stageEdit.reminderOutputMode === 'injectprompt' || stageEdit.reminderOutputMode === 'silent_scan'
                    ? stageEdit.reminderOutputMode
                    : stage.reminder.outputMode,
                injectDepth:
                  stageEdit.reminderInjectDepth === undefined
                    ? stage.reminder.injectDepth
                    : normalizeOptionalNumberText(stageEdit.reminderInjectDepth),
                macroToken:
                  stageEdit.reminderMacroToken === undefined
                    ? stage.reminder.macroToken
                    : normalizeOptionalText(stageEdit.reminderMacroToken),
                inactiveText:
                  stageEdit.reminderInactiveText === undefined
                    ? stage.reminder.inactiveText
                    : normalizeOptionalText(stageEdit.reminderInactiveText),
                activeText:
                  stageEdit.reminderActiveText === undefined
                    ? stage.reminder.activeText
                    : normalizeOptionalText(stageEdit.reminderActiveText),
              }
            : stage.reminder,
        };
      }),
    };
  });

  const materialEdits = new Map(input.materials.map(material => [material.id, material]));
  draft.materials = draft.materials.map(material => {
    const edit = materialEdits.get(material.id);
    if (!edit) {
      return material;
    }
    return {
      ...material,
      title: edit.title.trim() || material.title,
      eventIds: splitListText(edit.eventIdsText),
      summaryText: normalizeOptionalText(edit.summaryText),
      fullTextWorldbookName: normalizeOptionalText(edit.fullTextWorldbookName),
      fullTextEntryName: normalizeOptionalText(edit.fullTextEntryName),
    };
  });

  return serializeFixedEventIndexDraft(draft);
}

export function renameFixedEventIndexRowIdInYaml(input: FixedEventIndexRenameIdInput): string {
  const draft = parseFixedEventIndexDraft(input.sourceYaml, input.sourceInfo);
  const oldId = input.oldId.trim();
  const newId = input.newId.trim();

  if (input.scope === 'group') {
    assertCanRenameId(
      draft.groups.map(group => group.id),
      oldId,
      newId,
    );
    draft.groups = draft.groups.map(group => (group.id === oldId ? { ...group, id: newId } : group));
    draft.events = draft.events.map(event => (event.groupId === oldId ? { ...event, groupId: newId } : event));
    return serializeFixedEventIndexDraft(draft);
  }

  if (input.scope === 'event') {
    assertCanRenameId(
      draft.events.map(event => event.id),
      oldId,
      newId,
    );
    draft.events = draft.events.map(event => (event.id === oldId ? { ...event, id: newId } : event));
    draft.groups = draft.groups.map(group => ({
      ...group,
      eventIds: replaceIdInList(group.eventIds, oldId, newId),
    }));
    draft.materials = draft.materials.map(material => ({
      ...material,
      eventIds: replaceIdInList(material.eventIds, oldId, newId),
    }));
    return serializeFixedEventIndexDraft(draft);
  }

  assertCanRenameId(
    draft.materials.map(material => material.id),
    oldId,
    newId,
  );
  draft.materials = draft.materials.map(material => (material.id === oldId ? { ...material, id: newId } : material));
  draft.events = draft.events.map(event => ({
    ...event,
    relatedMaterialIds: replaceIdInList(event.relatedMaterialIds, oldId, newId),
  }));
  return serializeFixedEventIndexDraft(draft);
}

export function applyFixedEventIndexRowOperationsToYaml(input: FixedEventIndexRowOperationInput): string {
  const draft = parseFixedEventIndexDraft(input.sourceYaml, input.sourceInfo);

  const deleteGroupIds = new Set(input.deleteGroupIds ?? []);
  const deleteEventIds = new Set(input.deleteEventIds ?? []);
  const deleteMaterialIds = new Set(input.deleteMaterialIds ?? []);
  const deleteStagesByEventId = new Map<string, Set<string>>();
  (input.deleteStages ?? []).forEach(stage => {
    const eventId = stage.eventId.trim();
    const stageId = stage.id.trim();
    if (!eventId || !stageId) {
      return;
    }
    const stageIds = deleteStagesByEventId.get(eventId) ?? new Set<string>();
    stageIds.add(stageId);
    deleteStagesByEventId.set(eventId, stageIds);
  });
  const addStagesByEventId = new Map<string, FixedEventStageRowAddition[]>();
  (input.addStages ?? []).forEach(stage => {
    const eventId = stage.eventId.trim();
    if (!eventId) {
      return;
    }
    const additions = addStagesByEventId.get(eventId) ?? [];
    additions.push(stage);
    addStagesByEventId.set(eventId, additions);
  });
  const moveStagesByEventId = new Map<string, FixedEventStageRowMove[]>();
  (input.moveStages ?? []).forEach(stage => {
    const eventId = stage.eventId.trim();
    const stageId = stage.id.trim();
    if (!eventId || !stageId) {
      return;
    }
    const moves = moveStagesByEventId.get(eventId) ?? [];
    moves.push({ eventId, id: stageId, direction: stage.direction });
    moveStagesByEventId.set(eventId, moves);
  });

  draft.groups = draft.groups.filter(group => !deleteGroupIds.has(group.id));
  draft.events = draft.events.filter(event => !deleteEventIds.has(event.id));
  draft.materials = draft.materials.filter(material => !deleteMaterialIds.has(material.id));

  draft.groups = draft.groups.map(group => ({
    ...group,
    eventIds: removeIdsFromList(group.eventIds, deleteEventIds),
  }));
  draft.events = draft.events.map(event => ({
    ...event,
    groupId: event.groupId && deleteGroupIds.has(event.groupId) ? undefined : event.groupId,
    relatedMaterialIds: removeIdsFromList(event.relatedMaterialIds, deleteMaterialIds),
    stages: (moveStagesByEventId.get(event.id) ?? []).reduce(
      (stages, move) => moveStageInList(stages, move.id, move.direction),
      (event.stages ?? []).filter(stage => !deleteStagesByEventId.get(event.id)?.has(stage.id)),
    ),
  }));
  draft.materials = draft.materials.map(material => ({
    ...material,
    eventIds: removeIdsFromList(material.eventIds, deleteEventIds),
  }));

  const usedGroupIds = new Set(draft.groups.map(group => group.id).filter(Boolean));
  const usedEventIds = new Set(draft.events.map(event => event.id).filter(Boolean));
  const usedMaterialIds = new Set(draft.materials.map(material => material.id).filter(Boolean));

  draft.groups.push(...(input.addGroups ?? []).map(group => createGroupDraft(group, usedGroupIds)));
  draft.events.push(...(input.addEvents ?? []).map(event => createEventDraft(event, usedEventIds)));
  draft.materials.push(...(input.addMaterials ?? []).map(material => createMaterialDraft(material, usedMaterialIds)));
  draft.events = draft.events.map(event => {
    const stageAdditions = addStagesByEventId.get(event.id) ?? [];
    if (stageAdditions.length === 0) {
      return event;
    }
    const usedStageIds = new Set((event.stages ?? []).map(stage => stage.id).filter(Boolean));
    return {
      ...event,
      stages: [...(event.stages ?? []), ...stageAdditions.map(stage => createStageDraft(stage, usedStageIds))],
    };
  });

  return serializeFixedEventIndexDraft(draft);
}
