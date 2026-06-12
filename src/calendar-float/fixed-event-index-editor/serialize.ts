import { stringify as stringifyYaml } from 'yaml';
import type {
  FixedEventBookDefaultsDraft,
  FixedEventContentRefDraft,
  FixedEventDraft,
  FixedEventGroupDraft,
  FixedEventIndexDraft,
  FixedEventMaterialDraft,
  FixedEventMonthAliasDraft,
  FixedEventReminderDefaultsDraft,
  FixedEventReminderDraft,
  FixedEventStageDraft,
} from './draft-types';

function addIfDefined(target: Record<string, unknown>, key: string, value: unknown): void {
  if (value === undefined || value === '') {
    return;
  }
  target[key] = value;
}

function serializeContentRef(ref: FixedEventContentRefDraft): Record<string, unknown> | undefined {
  if (!ref.enabled && !ref.entryName && ref.keywords.length === 0 && ref.userKeywords.length === 0) {
    return undefined;
  }
  const output: Record<string, unknown> = { ...ref.unknownFields };
  if (!ref.enabled) {
    output.启用 = false;
  }
  addIfDefined(output, '条目名', ref.entryName);
  addIfDefined(output, '世界书', ref.worldbookName);
  addIfDefined(output, '简介', ref.summaryText);
  if (ref.keywords.length > 0) {
    output.关键字 = ref.keywords;
  }
  if (ref.userKeywords.length > 0) {
    output.用户消息包含 = ref.userKeywords;
  }
  return output;
}

function serializeReminder(reminder: FixedEventReminderDraft): Record<string, unknown> | undefined {
  if (
    !reminder.enabled &&
    reminder.keywords.length === 0 &&
    reminder.userKeywords.length === 0 &&
    reminder.prepareDays === undefined &&
    reminder.inactiveText === undefined &&
    reminder.activeText === undefined
  ) {
    return undefined;
  }
  const output: Record<string, unknown> = { ...reminder.unknownFields };
  if (!reminder.enabled) {
    output.启用 = false;
  }
  addIfDefined(output, '开始前提醒天数', reminder.prepareDays);
  if (reminder.outputMode === 'injectprompt') {
    output.注入方式 = 'injectprompt';
    addIfDefined(output, '注入深度', reminder.injectDepth);
  }
  addIfDefined(output, '宏触发词', reminder.macroToken);
  if (reminder.inactiveText !== undefined || reminder.activeText !== undefined) {
    output.开启自定义提醒 = {
      未开始: reminder.inactiveText ?? false,
      进行中: reminder.activeText ?? false,
    };
  }
  if (reminder.keywords.length > 0) {
    output.关键字 = reminder.keywords;
  }
  if (reminder.userKeywords.length > 0) {
    output.用户消息包含 = reminder.userKeywords;
  }
  return output;
}

function serializeGroup(group: FixedEventGroupDraft): Record<string, unknown> {
  const output: Record<string, unknown> = { ...group.unknownFields };
  output.id = group.id;
  output.名称 = group.name;
  addIfDefined(output, '图标', group.iconSvgFilename);
  if (group.eventIds.length > 0) {
    output.事件 = group.eventIds;
  }
  return output;
}

function serializeMonthAlias(alias: FixedEventMonthAliasDraft): Record<string, unknown> {
  const output: Record<string, unknown> = { ...alias.unknownFields };
  output.月份 = alias.month;
  output.名称 = alias.name;
  addIfDefined(output, '季节', alias.season);
  return output;
}

function hasReminderDefaults(defaults: FixedEventReminderDefaultsDraft): boolean {
  return (
    Object.keys(defaults.unknownFields).length > 0 ||
    Object.keys(defaults.templateUnknownFields).length > 0 ||
    defaults.outputMode !== undefined ||
    defaults.injectDepth !== undefined ||
    defaults.disableRecursive !== undefined ||
    defaults.disableKeywords !== undefined ||
    defaults.macroTemplate !== undefined ||
    defaults.inactiveTemplate !== undefined ||
    defaults.activeTemplate !== undefined
  );
}

function serializeReminderDefaults(defaults: FixedEventReminderDefaultsDraft): Record<string, unknown> | undefined {
  if (!hasReminderDefaults(defaults)) {
    return undefined;
  }
  const output: Record<string, unknown> = { ...defaults.unknownFields };
  addIfDefined(output, '注入方式', defaults.outputMode);
  addIfDefined(output, '注入深度', defaults.injectDepth);
  if (defaults.disableRecursive !== undefined) {
    output.禁用递归 = defaults.disableRecursive;
  }
  if (defaults.disableKeywords !== undefined) {
    output.禁用触发词 = defaults.disableKeywords;
  }
  addIfDefined(output, '宏触发词模板', defaults.macroTemplate);
  if (
    Object.keys(defaults.templateUnknownFields).length > 0 ||
    defaults.inactiveTemplate !== undefined ||
    defaults.activeTemplate !== undefined
  ) {
    output.缺省模板 = {
      ...defaults.templateUnknownFields,
      ...(defaults.inactiveTemplate !== undefined ? { 未开始: defaults.inactiveTemplate } : {}),
      ...(defaults.activeTemplate !== undefined ? { 进行中: defaults.activeTemplate } : {}),
    };
  }
  return output;
}

function serializeBookDefaults(defaults: FixedEventBookDefaultsDraft): Record<string, unknown> | undefined {
  if (
    Object.keys(defaults.unknownFields).length === 0 &&
    defaults.summaryOutputMode === undefined &&
    defaults.summaryInjectDepth === undefined
  ) {
    return undefined;
  }
  const output: Record<string, unknown> = { ...defaults.unknownFields };
  addIfDefined(output, '摘要注入方式', defaults.summaryOutputMode);
  addIfDefined(output, '摘要注入深度', defaults.summaryInjectDepth);
  return output;
}

function serializeStage(stage: FixedEventStageDraft): Record<string, unknown> {
  const output: Record<string, unknown> = { ...stage.unknownFields };
  output.id = stage.id;
  output.名称 = stage.name;
  if (!stage.enabled) {
    output.启用 = false;
  }
  output.开始 = stage.start;
  output.结束 = stage.end || stage.start;
  const reminder = serializeReminder(stage.reminder);
  if (reminder) {
    output.提醒 = reminder;
  }
  return output;
}

function serializeEvent(event: FixedEventDraft): Record<string, unknown> {
  const output: Record<string, unknown> = { ...event.unknownFields };
  output.id = event.id;
  output.名称 = event.name;
  if (!event.enabled) {
    output.启用 = false;
  }
  addIfDefined(output, '分组', event.groupId);
  output.开始 = event.start;
  output.结束 = event.end || event.start;
  if (event.recurrence) {
    output.周期 = {
      每隔年: event.recurrence.intervalYears,
      上次年份: event.recurrence.lastYear,
    };
  }
  if (event.locationKeywords.length > 0) {
    output.地点关键词 = event.locationKeywords;
  }
  const stages = event.stages ?? [];
  if (stages.length > 0) {
    output.阶段 = stages.map(serializeStage);
  }
  const intro = serializeContentRef(event.intro);
  if (intro) {
    output.介绍 = intro;
  }
  const reminder = serializeReminder(event.reminder);
  if (reminder) {
    output.提醒 = reminder;
  }
  if (event.relatedMaterialIds.length > 0) {
    output.相关资料 = event.relatedMaterialIds;
  }
  if (event.triggerGroups.messageKeywords.length > 0) {
    output.关键字 = event.triggerGroups.messageKeywords;
  }
  if (event.triggerGroups.userKeywords.length > 0) {
    output.用户消息包含 = event.triggerGroups.userKeywords;
  }
  event.triggerGroups.secondaryKeywordGroups.forEach((group, index) => {
    output[`次要关键字${index + 1}`] = {
      逻辑: group.logic,
      关键字: group.keywords,
    };
  });
  return output;
}

function serializeMaterial(material: FixedEventMaterialDraft): Record<string, unknown> {
  const output: Record<string, unknown> = { ...material.unknownFields };
  output.id = material.id;
  output.书名 = material.title;
  if (!material.enabled) {
    output.启用 = false;
  }
  output.关联事件 = material.eventIds;
  addIfDefined(output, '摘要', material.summaryText);
  if (material.fullTextEntryName || material.fullTextWorldbookName) {
    output.全文 = {
      ...(material.fullTextWorldbookName ? { 世界书: material.fullTextWorldbookName } : {}),
      ...(material.fullTextEntryName ? { 条目名: material.fullTextEntryName } : {}),
    };
  }
  if (material.messageKeywords.length > 0) {
    output.关键字 = material.messageKeywords;
  }
  if (material.userKeywords.length > 0) {
    output.用户消息包含 = material.userKeywords;
  }
  material.secondaryKeywordGroups.forEach((group, index) => {
    output[`次要关键字${index + 1}`] = {
      逻辑: group.logic,
      关键字: group.keywords,
    };
  });
  return output;
}

export function serializeFixedEventIndexDraft(draft: FixedEventIndexDraft): string {
  const output: Record<string, unknown> = { ...draft.unknownTopLevelFields };
  output.版本 = draft.metadata.version ?? 1;
  addIfDefined(output, '说明', draft.metadata.description);
  output.默认设置 = {
    ...draft.defaults.unknownFields,
    ...(draft.defaults.mvuTimePath ? { mvu时间路径: draft.defaults.mvuTimePath } : {}),
    ...(draft.defaults.mvuLocationPath ? { mvu地点路径: draft.defaults.mvuLocationPath } : {}),
    ...(draft.defaults.fullBookTriggerTemplate ? { 书籍全文默认关键词模板: draft.defaults.fullBookTriggerTemplate } : {}),
  };
  const reminderDefaults = serializeReminderDefaults(draft.reminderDefaults);
  if (reminderDefaults) {
    output.提醒默认值 = reminderDefaults;
  }
  const bookDefaults = serializeBookDefaults(draft.bookDefaults);
  if (bookDefaults) {
    output.书籍默认值 = bookDefaults;
  }
  if (draft.monthAliases.length > 0) {
    output.月份别名 = draft.monthAliases.map(serializeMonthAlias);
  }
  output.固定事件分组 = draft.groups.map(serializeGroup);
  output.固定事件 = draft.events.map(serializeEvent);
  output.补充资料 = draft.materials.map(serializeMaterial);
  return stringifyYaml(output, { lineWidth: 0 }).trimEnd() + '\n';
}
