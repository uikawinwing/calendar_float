import _ from 'lodash';

import {
  parseMonthDayWithYear,
  parseWorldDateText,
} from '../date';
import { resolveFestivalDateRange } from '../festival-date-range';
import { getActiveCalendarDateParseOptions } from '../profile';
import type { CalendarRuntimeDateWindowCondition, CalendarRuntimeFestivalEntry } from '../runtime-worldbook/types';
import { readCurrentWorldTime } from '../storage';
import type { DatePoint } from '../types';
import { 规范化文本 } from './text';
import type { CalendarRuntimeTriggerContext } from './types';

export function 解析节庆日期范围(
  festival: CalendarRuntimeFestivalEntry,
  now: DatePoint,
): { 开始: DatePoint; 结束: DatePoint } | null {
  const resolved = resolveFestivalDateRange({
    start: festival.开始,
    end: festival.结束,
    recurrence: festival.周期 ? { intervalYears: festival.周期.每隔年, lastYear: festival.周期.上次年份 } : undefined,
    now,
  });
  if (!resolved) {
    return null;
  }

  return { 开始: resolved.range.start, 结束: resolved.range.end };
}

function 尝试解析日期点(value: unknown, fallbackYear?: number): DatePoint | null {
  if (!value) {
    return null;
  }
  if (_.isPlainObject(value)) {
    const year = Number((value as Record<string, unknown>).year);
    const month = Number((value as Record<string, unknown>).month);
    const day = Number((value as Record<string, unknown>).day);
    if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
      return { year, month, day };
    }
  }

  const text = 规范化文本(value);
  if (!text) {
    return null;
  }

  const full = text.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (full) {
    return {
      year: Number(full[1]),
      month: Number(full[2]),
      day: Number(full[3]),
    };
  }

  const worldDate = parseWorldDateText(text, getActiveCalendarDateParseOptions());
  if (worldDate) {
    return worldDate;
  }

  const monthDay = text.match(/(\d{1,2})[-/月](\d{1,2})日?/);
  if (monthDay) {
    const year = fallbackYear ?? new Date().getFullYear();
    return parseMonthDayWithYear(`${monthDay[1]}-${monthDay[2]}`, year);
  }

  return null;
}

export function 解析当前日期(context: CalendarRuntimeTriggerContext, path?: string): DatePoint | null {
  const variables = _.isPlainObject(context.变量表) ? (context.变量表 as Record<string, unknown>) : {};
  if (path) {
    const fromVariable = 尝试解析日期点(_.get(variables, path), context.当前日期?.year);
    if (fromVariable) {
      return fromVariable;
    }
  }
  if (context.当前日期) {
    return context.当前日期;
  }
  return readCurrentWorldTime().point ?? null;
}

export function 构建日期窗口(
  condition: CalendarRuntimeDateWindowCondition,
  context: CalendarRuntimeTriggerContext,
): {
  当前日期: DatePoint;
  开始: DatePoint;
  结束: DatePoint;
  提前天数: number;
  延后天数: number;
} | null {
  const 当前日期 = 解析当前日期(context, condition.路径);
  if (!当前日期) {
    return null;
  }

  const resolved = resolveFestivalDateRange({
    start: String(condition.开始 || ''),
    end: String(condition.结束 || condition.开始 || ''),
    recurrence: { intervalYears: Number(condition.每隔年), lastYear: Number(condition.上次年份) },
    now: 当前日期,
    prepareDays: condition.提前天数,
  });
  if (!resolved) {
    return null;
  }

  return {
    当前日期,
    开始: resolved.range.start,
    结束: resolved.range.end,
    提前天数: Math.max(0, Number(condition.提前天数 ?? 0)),
    延后天数: Math.max(0, Number(condition.延后天数 ?? 0)),
  };
}
