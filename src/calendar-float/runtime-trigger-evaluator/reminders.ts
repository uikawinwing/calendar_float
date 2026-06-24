import _ from 'lodash';
import {
  getRelativeDayDistance,
  isPointInsideRange,
} from '../date';
import { resolveCalendarRuntimeNodeText } from '../runtime-worldbook/resolver';
import type {
  CalendarRuntimeContentNode,
  CalendarRuntimeReminderState,
  CalendarRuntimeFestivalStageEntry,
  CalendarRuntimeFestivalEntry,
} from '../runtime-worldbook/types';
import { readCurrentWorldTime } from '../storage';
import type { DatePoint } from '../types';
import { evaluateCalendarRuntimeTrigger } from './conditions';
import { 解析节庆日期范围 } from './date-window';
import { 规范化文本 } from './text';
import type {
  CalendarRuntimeReminderResolveResult,
  CalendarRuntimeFestivalWindowResult,
  CalendarRuntimeTriggerContext,
} from './types';

export function buildCalendarFestivalWindow(
  festival: CalendarRuntimeFestivalEntry,
  now: DatePoint = readCurrentWorldTime().point ?? {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
  },
  reminderDays = 0,
): CalendarRuntimeFestivalWindowResult | null {
  const range = 解析节庆日期范围(festival, now);
  if (!range) {
    return null;
  }

  const 提前天数 = Math.max(0, Number(reminderDays || 0));
  const 距离开始天数 = getRelativeDayDistance(now, range.开始);
  const 是否进行中 = isPointInsideRange(now, { start: range.开始, end: range.结束 });
  const 是否即将开始 = 提前天数 > 0 && 距离开始天数 > 0 && 距离开始天数 <= 提前天数;

  return {
    开始: range.开始,
    结束: range.结束,
    距离开始天数,
    是否进行中,
    是否在提醒窗口: 是否进行中 || 是否即将开始,
  };
}

function 渲染提醒模板(template: string, festival: CalendarRuntimeFestivalEntry, window: CalendarRuntimeFestivalWindowResult): string {
  return template
    .replaceAll('${节庆名}', festival.名称)
    .replaceAll('${固定事件}', festival.名称)
    .replaceAll('${剩余天数}', String(Math.max(0, window.距离开始天数)))
    .replaceAll('${开始日期}', festival.开始)
    .replaceAll('${结束日期}', festival.结束 || festival.开始);
}

function buildDefaultReminderText(
  festival: CalendarRuntimeFestivalEntry,
  window: CalendarRuntimeFestivalWindowResult,
  node: CalendarRuntimeContentNode | null | undefined,
): { 状态: CalendarRuntimeReminderState; 正文: string } {
  const defaults = _.isPlainObject(node?.元数据?.提醒默认值)
    ? (node?.元数据?.提醒默认值 as { 缺省模板?: Partial<Record<CalendarRuntimeReminderState, string>> })
    : {};

  const 状态: CalendarRuntimeReminderState = window.是否进行中 ? '进行中' : '未开始';
  const custom = 规范化文本(node?.状态正文?.[状态]);
  if (custom) {
    return {
      状态,
      正文: 渲染提醒模板(custom, festival, window),
    };
  }

  const fallback = 规范化文本(defaults.缺省模板?.[状态]);
  if (fallback) {
    return {
      状态,
      正文: 渲染提醒模板(fallback, festival, window),
    };
  }

  return {
    状态,
    正文:
      状态 === '进行中'
        ? `【进行中】${festival.名称}（${festival.开始}${festival.结束 && festival.结束 !== festival.开始 ? ` ~ ${festival.结束}` : ''}）`
        : `【即将开始】${festival.名称}（还有 ${window.距离开始天数} 天，开始于 ${festival.开始}）`,
  };
}

export async function resolveCalendarFestivalReminder(
  festival: CalendarRuntimeFestivalEntry,
  context: CalendarRuntimeTriggerContext,
): Promise<CalendarRuntimeReminderResolveResult> {
  const now = context.当前日期 ?? readCurrentWorldTime().point ?? null;
  if (!now) {
    return {
      正文: '',
      状态: '未命中',
      来源条目名: null,
      文本库键: null,
      警告: ['当前没有可用世界时间，无法解析提醒'],
    };
  }

  const 日期条件 = festival.提醒?.触发?.日期条件 ?? { 开始: festival.开始, 结束: festival.结束 };
  const 提前天数 = Number(日期条件?.提前天数 ?? 0);
  const window = buildCalendarFestivalWindow(festival, now, 提前天数);
  if (!window || !window.是否在提醒窗口) {
    return {
      正文: '',
      状态: '未命中',
      来源条目名: null,
      文本库键: null,
      警告: [],
    };
  }

  const triggerResult = evaluateCalendarRuntimeTrigger(festival.提醒?.触发, { ...context, 当前日期: now });
  if (!triggerResult.命中) {
    return {
      正文: '',
      状态: '未命中',
      来源条目名: null,
      文本库键: null,
      警告: triggerResult.原因,
    };
  }

  const fallback = buildDefaultReminderText(festival, window, festival.提醒);
  if (festival.提醒?.输出?.模式 === 'silent_scan') {
    return {
      正文: fallback.正文,
      状态: fallback.状态,
      来源条目名: null,
      文本库键: null,
      警告: [],
    };
  }

  const resolved = await resolveCalendarRuntimeNodeText({ node: festival.提醒 });
  return {
    正文: resolved.正文 || fallback.正文,
    状态: fallback.状态,
    来源条目名: resolved.来源条目名,
    文本库键: resolved.文本库键,
    警告: resolved.正文 ? resolved.警告 : [...resolved.警告, '提醒正文缺失，已回退到模板文本'],
  };
}

export async function resolveCalendarFestivalStageReminder(
  festival: CalendarRuntimeFestivalEntry,
  stage: CalendarRuntimeFestivalStageEntry,
  context: CalendarRuntimeTriggerContext,
): Promise<CalendarRuntimeReminderResolveResult> {
  if (stage.启用 === false || !stage.提醒) {
    return {
      正文: '',
      状态: '未命中',
      来源条目名: null,
      文本库键: null,
      警告: [],
    };
  }

  return resolveCalendarFestivalReminder(
    {
      ...festival,
      id: `${festival.id}:${stage.id}`,
      名称: `${festival.名称}·${stage.名称}`,
      开始: stage.开始,
      结束: stage.结束 || stage.开始,
      周期: stage.周期 ?? festival.周期,
      提醒: stage.提醒,
    },
    context,
  );
}
