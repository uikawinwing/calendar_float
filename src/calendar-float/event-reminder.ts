import {
  addDays,
  compareDatePoint,
  extractClockTimeText,
  getDaysInMonth,
  getRelativeDayDistance,
  getWeekdayFromAnchor,
  parseMonthDayWithYear,
  parseWorldDateText,
} from './date';
import { sanitizeReminderLeadDays } from './event-normalizer';
import { getActiveCalendarDateParseOptions } from './profile';
import { readActiveBuckets, readCurrentWorldTime } from './storage';
import type { CalendarAnchor, CalendarMonthAliasRecord, DatePoint, RawCalendarEvent } from './types';

export interface CalendarTimedReminder {
  id: string;
  title: string;
  timeText: string;
  daysUntil: number;
  status: 'upcoming' | 'due';
}

export interface CalendarTimedReminderResult {
  reminders: CalendarTimedReminder[];
  warnings: string[];
}

function clampDay(year: number, month: number, day: number): DatePoint {
  return { year, month, day: Math.min(Math.max(day, 1), getDaysInMonth(year, month)) };
}

function parseMonthDay(value: string): { month: number; day: number } | null {
  const text = String(value || '').trim();
  const match = text.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*[日号]?/) ?? text.match(/(\d{1,2})[-/](\d{1,2})/);
  if (!match) {
    return null;
  }
  const month = Number(match[1]);
  const day = Number(match[2]);
  return month >= 1 && month <= 12 && day >= 1 && day <= 31 ? { month, day } : null;
}

function parseMonthlyDay(value: string): number | null {
  const match = String(value || '').match(/每月\s*(\d{1,2})\s*[日号]?/) ?? String(value || '').match(/^(\d{1,2})$/);
  if (!match) {
    return null;
  }
  const day = Number(match[1]);
  return day >= 1 && day <= 31 ? day : null;
}

const WEEKDAY_MAP: Record<string, number> = { 日: 0, 天: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6 };

function parseWeeklyDays(value: string): number[] {
  const text = String(value || '').replace(/星期/g, '周').replace(/礼拜/g, '周');
  const values = new Set<number>();
  for (const [, day] of text.matchAll(/([日天一二三四五六])/g)) {
    const weekday = WEEKDAY_MAP[day];
    if (weekday !== undefined) {
      values.add(weekday);
    }
  }
  return [...values];
}

function parseOneShotDate(
  value: string,
  now: DatePoint,
  monthAliases: CalendarMonthAliasRecord[] = [],
): DatePoint | null {
  const text = String(value || '').trim();
  const worldDate = parseWorldDateText(text, {
    monthAliases,
    ...getActiveCalendarDateParseOptions(),
  });
  if (worldDate) {
    return worldDate;
  }
  const monthDay = parseMonthDay(text);
  return monthDay ? parseMonthDayWithYear(`${monthDay.month}-${monthDay.day}`, now.year) : null;
}

function nextWeeklyOccurrence(now: DatePoint, weekdays: number[], anchor?: CalendarAnchor): DatePoint | null {
  if (weekdays.length === 0) {
    return null;
  }
  for (let offset = 0; offset <= 7; offset += 1) {
    const point = addDays(now, offset);
    if (weekdays.includes(getWeekdayFromAnchor(point, anchor))) {
      return point;
    }
  }
  return null;
}

function nextWorkdayOccurrence(now: DatePoint, anchor?: CalendarAnchor): DatePoint {
  for (let offset = 0; offset <= 7; offset += 1) {
    const point = addDays(now, offset);
    const weekday = getWeekdayFromAnchor(point, anchor);
    if (weekday >= 1 && weekday <= 5) {
      return point;
    }
  }
  return now;
}

function nextMonthlyOccurrence(now: DatePoint, day: number): DatePoint {
  const current = clampDay(now.year, now.month, day);
  if (compareDatePoint(current, now) >= 0) {
    return current;
  }
  const nextMonth = now.month === 12 ? { year: now.year + 1, month: 1 } : { year: now.year, month: now.month + 1 };
  return clampDay(nextMonth.year, nextMonth.month, day);
}

function nextYearlyOccurrence(now: DatePoint, month: number, day: number): DatePoint {
  const current = clampDay(now.year, month, day);
  return compareDatePoint(current, now) >= 0 ? current : clampDay(now.year + 1, month, day);
}

function resolveNextOccurrence(
  event: RawCalendarEvent,
  now: DatePoint,
  anchor?: CalendarAnchor,
  monthAliases: CalendarMonthAliasRecord[] = [],
): DatePoint | null {
  if (event.重复规则 === '每天') {
    return now;
  }
  if (event.重复规则 === '仅工作日') {
    return nextWorkdayOccurrence(now, anchor);
  }
  if (event.重复规则 === '每周') {
    return nextWeeklyOccurrence(now, parseWeeklyDays(event.时间), anchor);
  }
  if (event.重复规则 === '每月') {
    const day = parseMonthlyDay(event.时间);
    return day ? nextMonthlyOccurrence(now, day) : null;
  }
  if (event.重复规则 === '每年') {
    const monthDay = parseMonthDay(event.时间);
    return monthDay ? nextYearlyOccurrence(now, monthDay.month, monthDay.day) : null;
  }
  return parseOneShotDate(event.时间, now, monthAliases);
}

function parseClockMinutes(value: string): number | null {
  const clock = extractClockTimeText(value);
  if (!clock) {
    return null;
  }
  const [hour, minute] = clock.split(':').map(Number);
  return Number.isInteger(hour) && Number.isInteger(minute) ? hour * 60 + minute : null;
}

function resolveReminderStatus(args: {
  event: RawCalendarEvent;
  nowText: string;
  daysUntil: number;
}): 'upcoming' | 'due' {
  if (args.daysUntil > 0) {
    return 'upcoming';
  }
  const eventClock = parseClockMinutes(args.event.时间);
  const nowClock = parseClockMinutes(args.nowText);
  if (eventClock !== null && nowClock !== null && eventClock > nowClock) {
    return 'upcoming';
  }
  return 'due';
}

export async function evaluateCalendarTimedReminders(
  monthAliases: CalendarMonthAliasRecord[] = [],
): Promise<CalendarTimedReminderResult> {
  const buckets = await readActiveBuckets();
  const worldTime = readCurrentWorldTime(undefined, monthAliases);
  if (!worldTime.point) {
    return {
      reminders: [],
      warnings: [`当前世界时间无法解析：${worldTime.text || '（空）'}，动态月历提醒已跳过`],
    };
  }

  const reminders: CalendarTimedReminder[] = [];
  const warnings: string[] = [];
  const events = { ...buckets.临时, ...buckets.重复 };

  for (const [id, event] of Object.entries(events)) {
    if (event.提醒 === false) {
      continue;
    }
    const occurrence = resolveNextOccurrence(event, worldTime.point, worldTime.anchor ?? undefined, monthAliases);
    if (!occurrence) {
      warnings.push(`月历事项 ${id} 的时间无法解析，已跳过提醒`);
      continue;
    }
    const daysUntil = getRelativeDayDistance(worldTime.point, occurrence);
    if (event.重复规则 === '无' && daysUntil < 0) {
      continue;
    }
    const leadDays = sanitizeReminderLeadDays(event.提前提醒天数);
    if (daysUntil > leadDays) {
      continue;
    }

    reminders.push({
      id,
      title: String(event.标题 || '').trim() || id,
      timeText: String(event.时间 || '').trim(),
      daysUntil,
      status: resolveReminderStatus({ event, nowText: worldTime.text, daysUntil }),
    });
  }

  reminders.sort((left, right) => left.daysUntil - right.daysUntil || left.title.localeCompare(right.title, 'zh-CN'));
  return { reminders, warnings };
}

export function buildCalendarTimedReminderPrompt(reminders: CalendarTimedReminder[]): string {
  if (reminders.length === 0) {
    return '';
  }
  const lines = reminders.map(item => {
    const when = item.status === 'due' ? '预定时间已到' : item.daysUntil === 0 ? '今日稍后' : `${item.daysUntil}天后`;
    return `- ${when}：${item.title}${item.timeText ? `（${item.timeText}）` : ''}`;
  });
  return [
    '<calendar_reminder>',
    '以下仅为世界时间提醒，不代表对应任务、事件或剧情结果已经发生：',
    ...lines,
    '请结合当前剧情与相关系统状态判断是否需要处理；不要仅因本提醒自行判定任务完成/失败或强制推进剧情。',
    '</calendar_reminder>',
  ].join('\n');
}
