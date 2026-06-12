import type { DatePoint } from '../types';

export interface CalendarRuntimeTriggerContext {
  当前日期?: DatePoint | null;
  最近消息文本?: string[];
  最近用户消息文本?: string[];
  变量表?: Record<string, unknown>;
}

export interface CalendarRuntimeTriggerResult {
  命中: boolean;
  原因: string[];
}

export interface CalendarRuntimeFestivalWindowResult {
  开始: DatePoint;
  结束: DatePoint;
  距离开始天数: number;
  是否进行中: boolean;
  是否在提醒窗口: boolean;
}

export interface CalendarRuntimeReminderResolveResult {
  正文: string;
  状态: '未命中' | '未开始' | '进行中';
  来源条目名: string | null;
  文本库键: string | null;
  警告: string[];
}

export interface CalendarRuntimeBookSummaryResolveResult {
  正文: string;
  可提供给LLM: boolean;
  来源条目名: string | null;
  文本库键: string | null;
  警告: string[];
}
