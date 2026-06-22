import type { CalendarRuntimeTriggerContext } from '../runtime-trigger-evaluator';
import type { DatePoint } from '../types';

export function buildRuntimeDatasetTriggerContext(now: DatePoint): CalendarRuntimeTriggerContext {
  return {
    当前日期: now,
    最近消息文本: [],
    变量表: {},
  };
}
