import type { DatePoint } from '../types';

export interface 日历运行时触发上下文 {
  当前日期?: DatePoint | null;
  最近消息文本?: string[];
  最近用户消息文本?: string[];
  变量表?: Record<string, unknown>;
}

export interface 日历运行时触发结果 {
  命中: boolean;
  原因: string[];
}

export interface 日历运行时节庆窗口结果 {
  开始: DatePoint;
  结束: DatePoint;
  距离开始天数: number;
  是否进行中: boolean;
  是否在提醒窗口: boolean;
}

export interface 日历运行时提醒解析结果 {
  正文: string;
  状态: '未命中' | '未开始' | '进行中';
  来源条目名: string | null;
  文本库键: string | null;
  警告: string[];
}

export interface 日历运行时书籍摘要解析结果 {
  正文: string;
  可提供给LLM: boolean;
  来源条目名: string | null;
  文本库键: string | null;
  警告: string[];
}
