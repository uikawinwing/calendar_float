import type { CalendarProfileConfigInput } from '../profile';

export type CalendarWorldbookContentType = '节庆介绍' | '节庆文本' | '节庆提醒' | '读物摘要' | '读物全文' | '其他';

export type CalendarRuntimeMessageMatchLogic = '全部满足' | '任一满足';
export type CalendarRuntimeCompareMode = '包含' | '等于' | '正则';
export type CalendarRuntimeConditionSource = '消息' | '用户消息' | 'mvu变量' | '变量';
export type CalendarRuntimeReminderState = '未开始' | '进行中';
export type CalendarRuntimeInjectionPosition = 'none' | 'in_chat';
export type CalendarRuntimeOutputMode = 'silent_scan' | 'injectprompt';

export interface CalendarRuntimeDiagnostic {
  level: 'info' | 'warning' | 'error';
  code: string;
  message: string;
  worldbookName?: string;
  entryName?: string;
}

export interface CalendarWorldbookReference {
  条目名: string;
  世界书?: string;
}

export interface CalendarTextLibraryReference extends CalendarWorldbookReference {
  键?: string;
}

export interface CalendarRuntimeVariableCondition {
  路径: string;
  包含任一?: string[];
  包含全部?: string[];
  不包含任一?: string[];
  等于?: string | number | boolean | null;
  正则?: string;
  为空时视为未命中?: boolean;
}

export interface CalendarRuntimeDateWindowCondition {
  路径?: string;
  开始?: string;
  结束?: string;
  提前天数?: number;
  延后天数?: number;
  仅进行中?: boolean;
  每隔年?: number;
  上次年份?: number;
}

export interface CalendarRuntimeAtomicCondition {
  来源?: CalendarRuntimeConditionSource;
  路径?: string;
  包含任一?: string[];
  包含全部?: string[];
  不包含任一?: string[];
  等于?: string | number | boolean | null;
  正则?: string;
  日期窗口?: CalendarRuntimeDateWindowCondition;
  为空时视为未命中?: boolean;
}

export interface CalendarRuntimeLogicCondition {
  条件?: CalendarRuntimeAtomicCondition;
  全部满足?: CalendarRuntimeLogicCondition[];
  任一满足?: CalendarRuntimeLogicCondition[];
  都不满足?: CalendarRuntimeLogicCondition[];
}

export interface CalendarRuntimeTriggerMap {
  启用?: boolean;
  默认逻辑?: CalendarRuntimeMessageMatchLogic;
  消息关键词?: string[];
  用户消息包含?: string[];
  变量条件?: CalendarRuntimeVariableCondition[];
  日期条件?: CalendarRuntimeDateWindowCondition | null;
  完整逻辑?: CalendarRuntimeLogicCondition | null;
}

export interface CalendarRuntimeOutputConfig {
  模式: CalendarRuntimeOutputMode;
  位置: CalendarRuntimeInjectionPosition;
  深度: number;
  角色: 'system' | 'assistant' | 'user';
  作为扫描文本?: boolean;
}

export interface CalendarRuntimeContentNode {
  id: string;
  名称: string;
  类型?: CalendarWorldbookContentType;
  启用?: boolean;
  条目?: CalendarWorldbookReference | null;
  文本库?: CalendarTextLibraryReference | null;
  内容ID?: string | null;
  正文?: string | null;
  状态正文?: Partial<Record<CalendarRuntimeReminderState, string | null>>;
  触发?: CalendarRuntimeTriggerMap | null;
  扫描触发词?: string[];
  输出?: CalendarRuntimeOutputConfig | null;
  元数据?: Record<string, unknown>;
}

export interface CalendarRuntimeFestivalRecurrence {
  每隔年: number;
  上次年份: number;
}

export interface CalendarRuntimeFestivalEntry {
  id: string;
  名称: string;
  开始: string;
  结束: string;
  周期?: CalendarRuntimeFestivalRecurrence;
  启用?: boolean;
  地点关键词?: string[];
  介绍?: CalendarRuntimeContentNode | null;
  文本?: CalendarRuntimeContentNode[];
  提醒?: CalendarRuntimeContentNode | null;
  阶段?: CalendarRuntimeFestivalStageEntry[];
  相关书籍?: string[];
  元数据?: Record<string, unknown>;
}

export interface CalendarRuntimeFestivalStageEntry {
  id: string;
  名称: string;
  开始: string;
  结束: string;
  周期?: CalendarRuntimeFestivalRecurrence;
  启用?: boolean;
  提醒?: CalendarRuntimeContentNode | null;
  元数据?: Record<string, unknown>;
}

export interface CalendarRuntimeBookEntry {
  id: string;
  名称: string;
  启用?: boolean;
  摘要?: CalendarRuntimeContentNode | null;
  全文?: CalendarRuntimeContentNode | null;
  元数据?: Record<string, unknown>;
}

export interface CalendarRuntimeReminderDefaults {
  注入方式?: CalendarRuntimeOutputMode;
  注入深度?: number;
  禁用递归?: boolean;
  禁用触发词?: boolean;
  宏触发词模板?: string;
  缺省模板?: Partial<Record<CalendarRuntimeReminderState, string>>;
}

export interface CalendarRuntimeBookDefaults {
  摘要注入方式?: 'injectprompt';
  摘要注入深度?: number;
}

export interface CalendarRuntimeDefaults {
  mvu时间路径?: string;
  mvu地点路径?: string;
  书籍全文默认关键词模板?: string;
}

export interface CalendarRuntimeIndex {
  Profile?: string;
  Profile设置?: CalendarProfileConfigInput;
  版本?: number;
  说明?: string;
  索引条目名?: string;
  默认值?: Record<string, unknown>;
  默认设置?: CalendarRuntimeDefaults;
  内容仓库?: Record<string, unknown>;
  条目命名约定?: Record<string, unknown>;
  提醒默认值?: CalendarRuntimeReminderDefaults;
  书籍默认值?: CalendarRuntimeBookDefaults;
  月份别名?: Array<{
    月份: number;
    名称: string;
    季节?: string;
  }>;
  节庆?: CalendarRuntimeFestivalEntry[];
  书籍?: CalendarRuntimeBookEntry[];
}

export interface CalendarRuntimeTextLibrary {
  [键: string]: string;
}

export interface CalendarWorldbookSourceEntry {
  世界书名: string;
  条目: WorldbookEntry;
}

export interface CalendarWorldbookIndexReadResult {
  索引: CalendarRuntimeIndex | null;
  来源世界书: string[];
  命中世界书名: string | null;
  命中条目名: string | null;
  警告: string[];
  诊断?: CalendarRuntimeDiagnostic[];
}

export interface CalendarWorldbookTextLibraryReadResult {
  文本库: CalendarRuntimeTextLibrary;
  来源: CalendarTextLibraryReference | null;
  命中条目名: string | null;
  警告: string[];
  诊断?: CalendarRuntimeDiagnostic[];
}
