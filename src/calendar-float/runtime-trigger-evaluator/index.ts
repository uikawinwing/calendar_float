/**
 * 负责：维持 runtime trigger evaluator 的公开导出入口。
 * 内容节点解析由 content.ts 负责，并从这里维持公开转出。
 * 触发条件命中判断由 conditions.ts 负责，并从这里维持公开转出。
 * 节庆提醒解析由 reminders.ts 负责，并从这里维持公开转出。
 * 不负责：worldbook 原始读取，也不负责最终注入执行。
 */
export type {
  日历运行时书籍摘要解析结果,
  日历运行时提醒解析结果,
  日历运行时节庆窗口结果,
  日历运行时触发上下文,
  日历运行时触发结果,
} from './types';

export { evaluateCalendarRuntimeTrigger } from './conditions';
export { resolveCalendarBookAbstract, resolveCalendarContentNode } from './content';
export {
  buildCalendarFestivalWindow,
  resolveCalendarFestivalReminder,
  resolveCalendarFestivalStageReminder,
} from './reminders';
