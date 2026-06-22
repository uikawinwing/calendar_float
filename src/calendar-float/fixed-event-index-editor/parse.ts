import { parse as parseYaml } from 'yaml';
import { extractLegacyCommentGroupsFromYaml } from './comment-groups';
import {
  FIXED_EVENT_GROUP_KEYS,
  FIXED_EVENT_LIST_KEYS,
  TOP_LEVEL_MATERIAL_KEYS,
  type FixedEventBookDefaultsDraft,
  type FixedEventContentRefDraft,
  type FixedEventDraft,
  type FixedEventGroupDraft,
  type FixedEventIndexDraft,
  type FixedEventIndexSourceInfo,
  type FixedEventKeywordGroupDraft,
  type FixedEventMaterialDraft,
  type FixedEventMonthAliasDraft,
  type FixedEventProfileDraft,
  type FixedEventReminderDefaultsDraft,
  type FixedEventReminderDraft,
  type FixedEventStageDraft,
} from './draft-types';
import { validateFixedEventIndexDraft } from './validate';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readField(source: Record<string, unknown>, keys: readonly string[]): unknown {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      return source[key];
    }
  }
  return undefined;
}

function toText(value: unknown): string {
  return String(value ?? '').trim();
}

function toTextList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(item => toText(item)).filter(Boolean);
  }
  const text = toText(value);
  return text ? [text] : [];
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }
  const text = toText(value).toLowerCase();
  if (text === 'true' || text === '1' || text === '是' || text === '开启') {
    return true;
  }
  if (text === 'false' || text === '0' || text === '否' || text === '关闭') {
    return false;
  }
  return undefined;
}

function toVersion(value: unknown): number | string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    return value.trim() || undefined;
  }
  return undefined;
}

function readObject(source: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> | null {
  const value = readField(source, keys);
  return isRecord(value) ? value : null;
}

function pickUnknownFields(source: Record<string, unknown>, knownKeys: readonly string[]): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(source).filter(([key]) => !knownKeys.includes(key) && !/^次要关键字\d+$/.test(key)),
  );
}

function uniqueTexts(values: string[]): string[] {
  return [...new Set(values.map(value => value.trim()).filter(Boolean))];
}

function parseKeywordGroups(source: Record<string, unknown>): FixedEventKeywordGroupDraft[] {
  const groups: FixedEventKeywordGroupDraft[] = [];
  Object.entries(source).forEach(([key, value]) => {
    if (!/^次要关键字\d+$/.test(key) || !isRecord(value)) {
      return;
    }
    const logic = toText(readField(value, ['逻辑', 'logic']));
    const keywords = toTextList(readField(value, ['关键字', 'keywords']));
    if (keywords.length === 0) {
      return;
    }
    groups.push({
      logic: logic === '与全部' || logic === '非任意' ? logic : '与任意',
      keywords,
    });
  });
  return groups;
}

function parseProfile(root: Record<string, unknown>): FixedEventProfileDraft {
  const settings = readObject(root, ['Profile设置']) ?? {};
  const paths = readObject(settings, ['paths', '路径']) ?? {};
  const date = readObject(settings, ['date', '日期']) ?? {};
  return {
    id: toText(readField(root, ['Profile'])) || undefined,
    settings: {
      label: toText(readField(settings, ['label', '名称', '显示名称'])) || undefined,
      paths: {
        worldTime: toText(readField(paths, ['worldTime', 'mvu时间路径', 'mvuTimePath'])) || undefined,
        worldLocation: toText(readField(paths, ['worldLocation', 'mvu地点路径', 'mvuLocationPath'])) || undefined,
        unknownFields: pickUnknownFields(paths, [
          'worldTime',
          'mvu时间路径',
          'mvuTimePath',
          'worldLocation',
          'mvu地点路径',
          'mvuLocationPath',
        ]),
      },
      date: {
        eraName: toText(readField(date, ['eraName', '纪元名', '纪元'])) || undefined,
        useChineseNumeralYear: toBoolean(readField(date, ['useChineseNumeralYear', '中文数字年份'])),
        unknownFields: pickUnknownFields(date, [
          'eraName',
          '纪元名',
          '纪元',
          'useChineseNumeralYear',
          '中文数字年份',
        ]),
      },
      unknownFields: pickUnknownFields(settings, ['label', '名称', '显示名称', 'paths', '路径', 'date', '日期']),
    },
  };
}

function parseContentRef(source: unknown): FixedEventContentRefDraft {
  const item = isRecord(source) ? source : {};
  return {
    enabled: readField(item, ['启用', 'enabled']) === false ? false : true,
    entryName: toText(readField(item, ['条目名', '世界书条目名称', 'entryname', 'entryName'])),
    worldbookName: toText(readField(item, ['世界书', 'worldbook', 'worldbookName'])) || undefined,
    summaryText: toText(readField(item, ['简介', '摘要', 'summary', 'uiSummary', 'ui_summary'])) || undefined,
    keywords: toTextList(readField(item, ['关键字', '消息关键词', 'keywords'])),
    userKeywords: toTextList(readField(item, ['用户消息包含', 'user_keywords', 'userKeywords'])),
    hasUnsupportedAdvancedLogic: readField(item, ['完整逻辑', 'logic_tree', 'logicTree']) !== undefined,
    unknownFields: pickUnknownFields(item, [
      '启用',
      'enabled',
      '条目名',
      '世界书条目名称',
      'entryname',
      'entryName',
      '世界书',
      'worldbook',
      'worldbookName',
      '简介',
      '摘要',
      'summary',
      'uiSummary',
      'ui_summary',
      '关键字',
      '消息关键词',
      'keywords',
      '用户消息包含',
      'user_keywords',
      'userKeywords',
      '完整逻辑',
      'logic_tree',
      'logicTree',
    ]),
  };
}

function parseReminder(source: unknown): FixedEventReminderDraft {
  const item = isRecord(source) ? source : {};
  const custom = readObject(item, ['开启自定义提醒', '自定义提醒', '自定义正文']) ?? item;
  const inactiveRaw = readField(custom, ['未开始']);
  const activeRaw = readField(custom, ['进行中']);
  const outputMode = toText(readField(item, ['注入方式', 'mode', 'output_mode', 'outputMode']));
  return {
    enabled: readField(item, ['启用', 'enabled']) === false ? false : true,
    prepareDays: toNumber(readField(item, ['开始前提醒天数', '提前天数', 'start_prepare', 'prepare_days'])),
    inactiveText: inactiveRaw === false ? false : toText(inactiveRaw) || undefined,
    activeText: activeRaw === false ? false : toText(activeRaw) || undefined,
    outputMode: outputMode === 'injectprompt' ? 'injectprompt' : 'silent_scan',
    injectDepth: toNumber(readField(item, ['注入深度', 'depth', 'injectDepth'])),
    macroToken: toText(readField(item, ['宏触发词', 'macro', 'macro_token', 'macroToken'])) || undefined,
    keywords: toTextList(readField(item, ['关键字', '消息关键词', 'keywords'])),
    userKeywords: toTextList(readField(item, ['用户消息包含', 'user_keywords', 'userKeywords'])),
    hasUnsupportedAdvancedLogic: readField(item, ['完整逻辑', 'logic_tree', 'logicTree']) !== undefined,
    unknownFields: pickUnknownFields(item, [
      '启用',
      'enabled',
      '开始前提醒天数',
      '提前天数',
      'start_prepare',
      'prepare_days',
      '开启自定义提醒',
      '自定义提醒',
      '自定义正文',
      '未开始',
      '进行中',
      '注入方式',
      'mode',
      'output_mode',
      'outputMode',
      '注入深度',
      'depth',
      'injectDepth',
      '宏触发词',
      'macro',
      'macro_token',
      'macroToken',
      '关键字',
      '消息关键词',
      'keywords',
      '用户消息包含',
      'user_keywords',
      'userKeywords',
      '完整逻辑',
      'logic_tree',
      'logicTree',
    ]),
  };
}

function parseMaterial(source: Record<string, unknown>, parentEventId?: string): FixedEventMaterialDraft | null {
  const title = toText(readField(source, ['书名', '标题', '名称', 'name', 'title', 'bookname']));
  const id = toText(readField(source, ['id', '资料id', '书籍id', 'material_id', 'book_id', 'bookId'])) || title;
  if (!id && !title) {
    return null;
  }
  const fullText = readObject(source, ['全文', 'fullText']) ?? source;
  const eventIds = toTextList(readField(source, ['关联事件', 'eventIds', 'event_ids']));
  if (parentEventId) {
    eventIds.push(parentEventId);
  }
  return {
    id,
    title: title || id,
    enabled: readField(source, ['启用', 'enabled']) === false ? false : true,
    eventIds: uniqueTexts(eventIds),
    summaryText: toText(readField(source, ['摘要', '摘要内容', 'summary'])) || undefined,
    fullTextEntryName:
      toText(readField(fullText, ['条目名', '世界书条目名称', 'entryname', 'entryName'])) || undefined,
    fullTextWorldbookName: toText(readField(fullText, ['世界书', 'worldbook', 'worldbookName'])) || undefined,
    messageKeywords: toTextList(readField(source, ['关键字', '消息关键词', 'keywords'])),
    userKeywords: toTextList(readField(source, ['用户消息包含', 'user_keywords', 'userKeywords'])),
    secondaryKeywordGroups: parseKeywordGroups(source),
    hasUnsupportedAdvancedLogic: readField(source, ['完整逻辑', 'logic_tree', 'logicTree']) !== undefined,
    unknownFields: pickUnknownFields(source, [
      'id',
      '资料id',
      '书籍id',
      'material_id',
      'book_id',
      'bookId',
      '书名',
      '标题',
      '名称',
      'name',
      'title',
      'bookname',
      '启用',
      'enabled',
      '关联事件',
      'eventIds',
      'event_ids',
      '摘要',
      '摘要内容',
      'summary',
      '全文',
      'fullText',
      '条目名',
      '世界书条目名称',
      'entryname',
      'entryName',
      '世界书',
      'worldbook',
      'worldbookName',
      '关键字',
      '消息关键词',
      'keywords',
      '用户消息包含',
      'user_keywords',
      'userKeywords',
      '完整逻辑',
      'logic_tree',
      'logicTree',
    ]),
  };
}

function hasDifferentValue(left: unknown, right: unknown): boolean {
  const leftText = JSON.stringify(left ?? null);
  const rightText = JSON.stringify(right ?? null);
  return leftText !== rightText;
}

function mergeMaterial(
  materials: FixedEventMaterialDraft[],
  incoming: FixedEventMaterialDraft,
  warnings: string[],
  sourceLabel: string,
): void {
  const existing = materials.find(material => material.id === incoming.id);
  if (!existing) {
    materials.push(incoming);
    return;
  }

  const conflictFields: string[] = [];
  if (incoming.title && existing.title && incoming.title !== existing.title) {
    conflictFields.push('标题');
  }
  if (incoming.summaryText && existing.summaryText && incoming.summaryText !== existing.summaryText) {
    conflictFields.push('摘要');
  }
  if (
    incoming.fullTextEntryName &&
    existing.fullTextEntryName &&
    incoming.fullTextEntryName !== existing.fullTextEntryName
  ) {
    conflictFields.push('全文条目名');
  }
  if (hasDifferentValue(incoming.messageKeywords, existing.messageKeywords) && incoming.messageKeywords.length > 0) {
    conflictFields.push('关键字');
  }
  if (conflictFields.length > 0) {
    warnings.push(`补充资料「${incoming.id}」从${sourceLabel}合并时存在字段冲突：${conflictFields.join('、')}`);
  }

  existing.eventIds = uniqueTexts([...existing.eventIds, ...incoming.eventIds]);
  existing.hasUnsupportedAdvancedLogic = existing.hasUnsupportedAdvancedLogic || incoming.hasUnsupportedAdvancedLogic;
}

function parseGroup(source: Record<string, unknown>): FixedEventGroupDraft | null {
  const name = toText(readField(source, ['名称', 'name', '标题', 'title']));
  const id = toText(readField(source, ['id', '分组id', 'groupId', 'group_id'])) || name;
  if (!id && !name) {
    return null;
  }
  return {
    id,
    name: name || id,
    iconSvgFilename: toText(readField(source, ['图标', 'icon', 'iconSvgFilename', 'icon_svg_filename'])) || undefined,
    eventIds: toTextList(readField(source, ['事件', '固定事件', 'eventIds', 'event_ids', 'events'])),
    unknownFields: pickUnknownFields(source, [
      'id',
      '分组id',
      'groupId',
      'group_id',
      '名称',
      'name',
      '标题',
      'title',
      '图标',
      'icon',
      'iconSvgFilename',
      'icon_svg_filename',
      '事件',
      '固定事件',
      'eventIds',
      'event_ids',
      'events',
    ]),
  };
}

function parseMonthAlias(source: Record<string, unknown>): FixedEventMonthAliasDraft | null {
  const month = toNumber(readField(source, ['月份', 'month']));
  const name = toText(readField(source, ['名称', 'name', 'label']));
  if (month === undefined && !name) {
    return null;
  }
  return {
    month: month ?? 0,
    name,
    season: toText(readField(source, ['季节', 'season'])) || undefined,
    unknownFields: pickUnknownFields(source, ['月份', 'month', '名称', 'name', 'label', '季节', 'season']),
  };
}

function parseMonthAliases(source: Record<string, unknown>): FixedEventMonthAliasDraft[] {
  const rawAliases = readField(source, ['月份别名', 'monthAliases', 'month_aliases']);
  if (!Array.isArray(rawAliases)) {
    return [];
  }
  return rawAliases
    .map(item => (isRecord(item) ? parseMonthAlias(item) : null))
    .filter((alias): alias is FixedEventMonthAliasDraft => alias !== null);
}

function parseReminderDefaults(source: Record<string, unknown>): FixedEventReminderDefaultsDraft {
  const rawDefaults = readObject(source, ['提醒默认值', 'reminderDefaults', 'reminder_defaults']) ?? {};
  const rawTemplates = readObject(rawDefaults, ['缺省模板', 'template']) ?? {};
  const outputMode = toText(readField(rawDefaults, ['注入方式', 'mode', 'output_mode']));
  return {
    outputMode: outputMode === 'injectprompt' ? 'injectprompt' : outputMode === 'silent_scan' ? 'silent_scan' : undefined,
    injectDepth: toNumber(readField(rawDefaults, ['注入深度', 'depth'])),
    disableRecursive: toBoolean(readField(rawDefaults, ['禁用递归', 'disable_recursive'])),
    disableKeywords: toBoolean(readField(rawDefaults, ['禁用触发词', 'disable_keywords'])),
    macroTemplate: toText(readField(rawDefaults, ['宏触发词模板', 'macro_template', 'macroTemplate', '提醒宏模板'])) || undefined,
    inactiveTemplate: toText(readField(rawTemplates, ['未开始', 'upcoming'])) || undefined,
    activeTemplate: toText(readField(rawTemplates, ['进行中', 'active'])) || undefined,
    unknownFields: pickUnknownFields(rawDefaults, [
      '注入方式',
      'mode',
      'output_mode',
      '注入深度',
      'depth',
      '禁用递归',
      'disable_recursive',
      '禁用触发词',
      'disable_keywords',
      '宏触发词模板',
      'macro_template',
      'macroTemplate',
      '提醒宏模板',
      '缺省模板',
      'template',
    ]),
    templateUnknownFields: pickUnknownFields(rawTemplates, ['未开始', 'upcoming', '进行中', 'active']),
  };
}

function parseBookDefaults(source: Record<string, unknown>): FixedEventBookDefaultsDraft {
  const rawDefaults = readObject(source, ['书籍默认值', 'bookDefaults', 'book_defaults']) ?? {};
  return {
    summaryOutputMode: toText(readField(rawDefaults, ['摘要注入方式', 'abstract_mode'])) || undefined,
    summaryInjectDepth: toNumber(readField(rawDefaults, ['摘要注入深度', 'abstract_depth'])),
    unknownFields: pickUnknownFields(rawDefaults, [
      '摘要注入方式',
      'abstract_mode',
      '摘要注入深度',
      'abstract_depth',
    ]),
  };
}

function parseStage(source: Record<string, unknown>, index: number): FixedEventStageDraft | null {
  const id = toText(readField(source, ['id', '阶段id', 'phase_id', 'phaseId'])) || `stage_${index + 1}`;
  const name = toText(readField(source, ['名称', '阶段名', 'name', 'title'])) || `阶段 ${index + 1}`;
  const start = toText(readField(source, ['开始', 'start']));
  const end = toText(readField(source, ['结束', 'end'])) || start;
  if (!id && !name && !start) {
    return null;
  }

  return {
    id,
    name,
    enabled: readField(source, ['启用', 'enabled']) === false ? false : true,
    start,
    end,
    reminder: parseReminder(readField(source, ['提醒', 'reminder']) ?? source),
    unknownFields: pickUnknownFields(source, [
      'id',
      '阶段id',
      'phase_id',
      'phaseId',
      '名称',
      '阶段名',
      'name',
      'title',
      '启用',
      'enabled',
      '开始',
      'start',
      '结束',
      'end',
      '提醒',
      'reminder',
    ]),
  };
}

function parseStages(source: Record<string, unknown>): FixedEventStageDraft[] {
  const rawStages = readField(source, ['阶段', '阶段列表', 'stages', 'phases']);
  if (!Array.isArray(rawStages)) {
    return [];
  }
  return rawStages
    .map((rawStage, index) => (isRecord(rawStage) ? parseStage(rawStage, index) : null))
    .filter((stage): stage is FixedEventStageDraft => stage !== null);
}

function parseEvent(source: Record<string, unknown>, materials: FixedEventMaterialDraft[], warnings: string[]): FixedEventDraft | null {
  const id = toText(readField(source, ['id']));
  const name = toText(readField(source, ['名称', 'name', '标题', 'title']));
  const start = toText(readField(source, ['开始', 'start']));
  const end = toText(readField(source, ['结束', 'end'])) || start;
  if (!id && !name && !start) {
    return null;
  }

  const nestedMaterials = readField(source, ['补充资料', '书籍', 'material', 'materials', 'book', 'books']);
  if (Array.isArray(nestedMaterials)) {
    nestedMaterials.forEach(rawMaterial => {
      if (!isRecord(rawMaterial)) {
        return;
      }
      const parsed = parseMaterial(rawMaterial, id);
      if (parsed) {
        mergeMaterial(materials, parsed, warnings, `固定事件「${name || id}」内嵌资料`);
      }
    });
  }

  const recurrenceSource = readObject(source, ['周期', '举办周期', 'recurrence']) ?? source;
  const intervalYears = toNumber(
    readField(recurrenceSource, ['每隔年', '每X年', '间隔年数', 'intervalYears', 'interval_years']),
  );
  const lastYear = toNumber(readField(recurrenceSource, ['上次年份', '上次举办年份', 'lastYear', 'last_year']));

  return {
    id,
    name,
    enabled: readField(source, ['启用', 'enabled']) === false ? false : true,
    groupId: toText(readField(source, ['分组', 'group', 'groupId', 'group_id'])) || undefined,
    start,
    end,
    recurrence: intervalYears !== undefined && lastYear !== undefined ? { intervalYears, lastYear } : undefined,
    locationKeywords: toTextList(readField(source, ['地点关键词', '地点', 'location_keywords', 'locationKeywords', 'locations'])),
    stages: parseStages(source),
    intro: parseContentRef(readField(source, ['介绍', 'event', 'intro'])),
    reminder: parseReminder(readField(source, ['提醒', 'reminder'])),
    relatedMaterialIds: toTextList(readField(source, ['相关资料', '相关书籍', 'relatedMaterials', 'relatedBooks'])),
    triggerGroups: {
      messageKeywords: toTextList(readField(source, ['关键字', '消息关键词', 'keywords'])),
      userKeywords: toTextList(readField(source, ['用户消息包含', 'user_keywords', 'userKeywords'])),
      secondaryKeywordGroups: parseKeywordGroups(source),
    },
    hasUnsupportedAdvancedLogic: readField(source, ['完整逻辑', 'logic_tree', 'logicTree']) !== undefined,
    unknownFields: pickUnknownFields(source, [
      'id',
      '名称',
      'name',
      '标题',
      'title',
      '启用',
      'enabled',
      '分组',
      'group',
      'groupId',
      'group_id',
      '开始',
      'start',
      '结束',
      'end',
      '周期',
      '举办周期',
      'recurrence',
      '每隔年',
      '每X年',
      '间隔年数',
      'intervalYears',
      'interval_years',
      '上次年份',
      '上次举办年份',
      'lastYear',
      'last_year',
      '地点关键词',
      '地点',
      'location_keywords',
      'locationKeywords',
      'locations',
      '阶段',
      '阶段列表',
      'stages',
      'phases',
      '介绍',
      'event',
      'intro',
      '提醒',
      'reminder',
      '补充资料',
      '书籍',
      'material',
      'materials',
      'book',
      'books',
      '相关资料',
      '相关书籍',
      'relatedMaterials',
      'relatedBooks',
      '关键字',
      '消息关键词',
      'keywords',
      '用户消息包含',
      'user_keywords',
      'userKeywords',
      '完整逻辑',
      'logic_tree',
      'logicTree',
    ]),
  };
}

export function parseFixedEventIndexDraft(content: string, source: FixedEventIndexSourceInfo): FixedEventIndexDraft {
  const warnings: string[] = [];
  let raw: unknown;
  try {
    raw = parseYaml(String(content || '').trim() || '{}');
  } catch (error) {
    warnings.push(`YAML 解析失败：${error instanceof Error ? error.message : String(error)}`);
    raw = {};
  }

  const root = isRecord(raw) ? raw : {};
  if (!isRecord(raw)) {
    warnings.push('索引 YAML 顶层不是对象');
  }

  const groups: FixedEventGroupDraft[] = [];
  const groupList = readField(root, FIXED_EVENT_GROUP_KEYS);
  if (Array.isArray(groupList)) {
    groupList.forEach(item => {
      if (!isRecord(item)) {
        return;
      }
      const parsed = parseGroup(item);
      if (parsed) {
        groups.push(parsed);
      }
    });
  }

  const materials: FixedEventMaterialDraft[] = [];
  const topLevelMaterials = readField(root, TOP_LEVEL_MATERIAL_KEYS);
  if (Array.isArray(topLevelMaterials)) {
    topLevelMaterials.forEach(item => {
      if (!isRecord(item)) {
        return;
      }
      const parsed = parseMaterial(item);
      if (parsed) {
        mergeMaterial(materials, parsed, warnings, '顶层资料');
      }
    });
  }

  let events: FixedEventDraft[] = [];
  const eventList = readField(root, FIXED_EVENT_LIST_KEYS);
  if (Array.isArray(eventList)) {
    eventList.forEach(item => {
      if (!isRecord(item)) {
        return;
      }
      const parsed = parseEvent(item, materials, warnings);
      if (parsed) {
        events.push(parsed);
      }
    });
  }

  if (groups.length === 0) {
    const legacyCommentGroups = extractLegacyCommentGroupsFromYaml(
      content,
      events.map(event => event.id),
    );
    groups.push(...legacyCommentGroups.groups);
    events = events.map(event => ({
      ...event,
      groupId: event.groupId ?? legacyCommentGroups.eventGroupIds[event.id],
    }));
  }

  const defaultSettings = readObject(root, ['默认设置', 'defaults']) ?? {};
  const draft: FixedEventIndexDraft = {
    entryName: source.entryName,
    worldbookName: source.worldbookName,
    canSave: false,
    saveBlockedReasons: [],
    warnings,
    profile: parseProfile(root),
    metadata: {
      version: toVersion(readField(root, ['版本', 'version'])),
      description: toText(readField(root, ['说明', 'description'])) || undefined,
    },
    defaults: {
      mvuTimePath: toText(readField(defaultSettings, ['mvu时间路径', 'mvu_time_path', 'mvuTimePath'])) || undefined,
      mvuLocationPath:
        toText(readField(defaultSettings, ['mvu地点路径', 'mvu_location_path', 'mvuLocationPath'])) || undefined,
      fullBookTriggerTemplate:
        toText(readField(defaultSettings, ['书籍全文默认关键词模板', 'full_book_trigger_template'])) || undefined,
      unknownFields: pickUnknownFields(defaultSettings, [
        'mvu时间路径',
        'mvu_time_path',
        'mvuTimePath',
        'mvu地点路径',
        'mvu_location_path',
        'mvuLocationPath',
        '书籍全文默认关键词模板',
        'full_book_trigger_template',
      ]),
    },
    reminderDefaults: parseReminderDefaults(root),
    bookDefaults: parseBookDefaults(root),
    monthAliases: parseMonthAliases(root),
    groups,
    events,
    materials,
    unknownTopLevelFields: pickUnknownFields(root, [
      '版本',
      'version',
      '说明',
      'description',
      'Profile',
      'Profile设置',
      '默认设置',
      'defaults',
      '提醒默认值',
      'reminderDefaults',
      'reminder_defaults',
      '书籍默认值',
      'bookDefaults',
      'book_defaults',
      '月份别名',
      'monthAliases',
      'month_aliases',
      ...FIXED_EVENT_GROUP_KEYS,
      ...FIXED_EVENT_LIST_KEYS,
      ...TOP_LEVEL_MATERIAL_KEYS,
    ]),
  };

  const validation = validateFixedEventIndexDraft(draft);
  draft.canSave = validation.canSave;
  draft.saveBlockedReasons = validation.blockingIssues;
  draft.warnings = validation.warnings;
  return draft;
}
