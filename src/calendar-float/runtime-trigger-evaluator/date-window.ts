import _ from 'lodash';

import { compareDatePoint, parseMonthDayWithYear, parseWorldDateText } from '../date';
import type { CalendarRuntimeDateWindowCondition, CalendarRuntimeFestivalEntry } from '../runtime-worldbook/types';
import { readCurrentWorldTime } from '../storage';
import type { DatePoint } from '../types';
import { 规范化文本 } from './text';
import type { CalendarRuntimeTriggerContext } from './types';

function 推断年份(now: DatePoint, month: number): number {
  if (month + 6 < now.month) {
    return now.year + 1;
  }
  if (month - 6 > now.month) {
    return now.year - 1;
  }
  return now.year;
}

function 解析周期举办年份(year: number, intervalYears?: number, lastYear?: number): number {
  const interval = Math.floor(Number(intervalYears));
  const last = Math.floor(Number(lastYear));
  if (!Number.isFinite(interval) || interval <= 1 || !Number.isFinite(last)) {
    return year;
  }
  const remainder = (((year - last) % interval) + interval) % interval;
  const previous = year - remainder;
  const next = previous + interval;
  return Math.abs(year - previous) <= Math.abs(next - year) ? previous : next;
}

export function 解析节庆日期范围(
  festival: CalendarRuntimeFestivalEntry,
  now: DatePoint,
): { 开始: DatePoint; 结束: DatePoint } | null {
  const 开始文本 = 规范化文本(festival.开始);
  const 结束文本 = 规范化文本(festival.结束 || festival.开始);
  if (!开始文本 || !结束文本) {
    return null;
  }

  const 开始月份 = Number(开始文本.split('-')[0]);
  const 举办年份 = 解析周期举办年份(推断年份(now, 开始月份), festival.周期?.每隔年, festival.周期?.上次年份);
  const 开始 = parseMonthDayWithYear(开始文本, 举办年份);
  let 结束 = parseMonthDayWithYear(结束文本, 举办年份);
  if (!开始 || !结束) {
    return null;
  }
  if (compareDatePoint(结束, 开始) < 0) {
    结束 = parseMonthDayWithYear(结束文本, 举办年份 + 1);
    if (!结束) {
      return null;
    }
  }

  return compareDatePoint(开始, 结束) <= 0 ? { 开始, 结束 } : { 开始: 结束, 结束: 开始 };
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

  const worldDate = parseWorldDateText(text);
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

  const 开始文本 = 规范化文本(condition.开始);
  const 结束文本 = 规范化文本(condition.结束 || condition.开始);
  if (!开始文本 || !结束文本) {
    return null;
  }

  const 开始月份 = Number(开始文本.split('-')[0]);
  const 举办年份 = 解析周期举办年份(推断年份(当前日期, 开始月份), condition.每隔年, condition.上次年份);
  const 开始 = parseMonthDayWithYear(开始文本, 举办年份);
  let 结束 = parseMonthDayWithYear(结束文本, 举办年份);
  if (!开始 || !结束) {
    return null;
  }
  if (compareDatePoint(结束, 开始) < 0) {
    结束 = parseMonthDayWithYear(结束文本, 举办年份 + 1);
    if (!结束) {
      return null;
    }
  }

  return {
    当前日期,
    开始: compareDatePoint(开始, 结束) <= 0 ? 开始 : 结束,
    结束: compareDatePoint(开始, 结束) <= 0 ? 结束 : 开始,
    提前天数: Math.max(0, Number(condition.提前天数 ?? 0)),
    延后天数: Math.max(0, Number(condition.延后天数 ?? 0)),
  };
}
