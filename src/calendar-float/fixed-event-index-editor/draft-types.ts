import { ALL_SVG_FILENAMES } from './icon-filenames';

export type FixedEventKeywordGroupLogic = '与任意' | '与全部' | '非任意';

export interface FixedEventIndexSourceInfo {
  entryName: string;
  worldbookName: string;
}

export interface FixedEventIndexDraft {
  entryName: string;
  worldbookName: string;
  canSave: boolean;
  saveBlockedReasons: string[];
  warnings: string[];
  profile: FixedEventProfileDraft;
  metadata: FixedEventIndexMetadataDraft;
  defaults: FixedEventDefaultsDraft;
  reminderDefaults: FixedEventReminderDefaultsDraft;
  bookDefaults: FixedEventBookDefaultsDraft;
  monthAliases: FixedEventMonthAliasDraft[];
  groups: FixedEventGroupDraft[];
  events: FixedEventDraft[];
  materials: FixedEventMaterialDraft[];
  unknownTopLevelFields: Record<string, unknown>;
}

export interface FixedEventIndexMetadataDraft {
  version?: number | string;
  description?: string;
}

export interface FixedEventProfileDraft {
  id?: string;
  settings: FixedEventProfileSettingsDraft;
}

export interface FixedEventProfileSettingsDraft {
  label?: string;
  developerMode: boolean;
  paths: FixedEventProfilePathSettingsDraft;
  date: FixedEventProfileDateSettingsDraft;
  unknownFields: Record<string, unknown>;
}

export interface FixedEventProfilePathSettingsDraft {
  eventRoot?: string;
  tempEvents?: string;
  repeatEvents?: string;
  worldTime?: string;
  worldLocation?: string;
  unknownFields: Record<string, unknown>;
}

export interface FixedEventProfileDateSettingsDraft {
  eraName?: string;
  eraNames: string[];
  useChineseNumeralYear?: boolean;
  unknownFields: Record<string, unknown>;
}

export interface FixedEventDefaultsDraft {
  mvuTimePath?: string;
  mvuLocationPath?: string;
  fullBookTriggerTemplate?: string;
  unknownFields: Record<string, unknown>;
}

export interface FixedEventReminderDefaultsDraft {
  outputMode?: 'silent_scan' | 'injectprompt';
  injectDepth?: number;
  disableRecursive?: boolean;
  disableKeywords?: boolean;
  macroTemplate?: string;
  inactiveTemplate?: string;
  activeTemplate?: string;
  unknownFields: Record<string, unknown>;
  templateUnknownFields: Record<string, unknown>;
}

export interface FixedEventBookDefaultsDraft {
  summaryOutputMode?: string;
  summaryInjectDepth?: number;
  unknownFields: Record<string, unknown>;
}

export interface FixedEventMonthAliasDraft {
  month: number;
  name: string;
  season?: string;
  unknownFields: Record<string, unknown>;
}

export interface FixedEventGroupDraft {
  id: string;
  name: string;
  iconSvgFilename?: string;
  eventIds: string[];
  unknownFields: Record<string, unknown>;
}

export interface FixedEventDraft {
  id: string;
  name: string;
  enabled: boolean;
  groupId?: string;
  start: string;
  end: string;
  recurrence?: FixedEventRecurrenceDraft;
  locationKeywords: string[];
  stages: FixedEventStageDraft[];
  intro: FixedEventContentRefDraft;
  reminder: FixedEventReminderDraft;
  relatedMaterialIds: string[];
  triggerGroups: FixedEventTriggerGroupsDraft;
  hasUnsupportedAdvancedLogic: boolean;
  unknownFields: Record<string, unknown>;
}

export interface FixedEventStageDraft {
  id: string;
  name: string;
  enabled: boolean;
  start: string;
  end: string;
  reminder: FixedEventReminderDraft;
  unknownFields: Record<string, unknown>;
}

export interface FixedEventRecurrenceDraft {
  intervalYears: number;
  lastYear: number;
}

export interface FixedEventContentRefDraft {
  enabled: boolean;
  entryName: string;
  worldbookName?: string;
  summaryText?: string;
  keywords: string[];
  userKeywords: string[];
  hasUnsupportedAdvancedLogic: boolean;
  unknownFields: Record<string, unknown>;
}

export interface FixedEventReminderDraft {
  enabled: boolean;
  prepareDays?: number;
  inactiveText?: string | false;
  activeText?: string | false;
  outputMode: 'silent_scan' | 'injectprompt';
  injectDepth?: number;
  macroToken?: string;
  keywords: string[];
  userKeywords: string[];
  hasUnsupportedAdvancedLogic: boolean;
  unknownFields: Record<string, unknown>;
}

export interface FixedEventMaterialDraft {
  id: string;
  title: string;
  enabled: boolean;
  eventIds: string[];
  summaryText?: string;
  fullTextEntryName?: string;
  fullTextWorldbookName?: string;
  messageKeywords: string[];
  userKeywords: string[];
  secondaryKeywordGroups: FixedEventKeywordGroupDraft[];
  hasUnsupportedAdvancedLogic: boolean;
  unknownFields: Record<string, unknown>;
}

export interface FixedEventTriggerGroupsDraft {
  messageKeywords: string[];
  userKeywords: string[];
  secondaryKeywordGroups: FixedEventKeywordGroupDraft[];
}

export interface FixedEventKeywordGroupDraft {
  logic: FixedEventKeywordGroupLogic;
  keywords: string[];
}

export interface FixedEventIndexValidationResult {
  canSave: boolean;
  blockingIssues: string[];
  warnings: string[];
  rowIssues?: FixedEventIndexRowIssue[];
}

export interface FixedEventIndexRowIssue {
  scope: 'group' | 'event' | 'material';
  id: string;
  severity: 'danger' | 'warning';
  message: string;
}

export const FIXED_EVENT_GROUP_KEYS = ['固定事件分组'] as const;
export const FIXED_EVENT_LIST_KEYS = ['固定事件'] as const;
export const TOP_LEVEL_MATERIAL_KEYS = ['补充资料'] as const;

export const BUNDLED_ICON_FILENAMES = ALL_SVG_FILENAMES;

export type FixedEventBundledIconFilename = string;
