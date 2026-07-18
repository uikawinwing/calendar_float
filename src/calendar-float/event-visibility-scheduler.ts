import { extractClockTimeText, getRelativeDayDistance, parseWorldDateText } from './date';
import { sanitizeReminderLeadDays } from './event-normalizer';
import { getActiveCalendarDateParseOptions } from './profile';
import { readActiveBuckets, readCurrentWorldTime, replaceActiveBuckets } from './storage';
import type { ActiveCalendarBuckets } from './types';

interface CalendarMoment {
  year: number;
  month: number;
  day: number;
  minuteOfDay: number;
}

export interface CalendarVisibilityPromotionResult {
  buckets: ActiveCalendarBuckets;
  promotedIds: string[];
  warnings: string[];
  changed: boolean;
}

function parseCalendarMoment(value: string): CalendarMoment | null {
  const date = parseWorldDateText(value, getActiveCalendarDateParseOptions());
  const clock = extractClockTimeText(value);
  if (!date || !clock) {
    return null;
  }
  const [hourText, minuteText] = clock.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  return { ...date, minuteOfDay: hour * 60 + minute };
}

export function promoteDueSealedEventsInBuckets(
  buckets: ActiveCalendarBuckets,
  nowText: string,
): CalendarVisibilityPromotionResult {
  const sealedEntries = Object.entries(buckets.临时).filter(([, event]) => event.可见性 === '完全不显示');
  if (sealedEntries.length === 0) {
    return { buckets, promotedIds: [], warnings: [], changed: false };
  }
  const now = parseCalendarMoment(nowText);
  if (!now) {
    return {
      buckets,
      promotedIds: [],
      warnings: ['当前世界时间无法解析，隐藏月历事件保持不变'],
      changed: false,
    };
  }

  const 临时 = { ...buckets.临时 };
  const promotedIds: string[] = [];
  const warnings: string[] = [];
  for (const [id, event] of sealedEntries) {
    const eventTime = parseCalendarMoment(event.时间);
    if (!eventTime) {
      warnings.push(`隐藏月历事件 ${id} 的时间无法解析，已保持完全不显示`);
      continue;
    }
    const minutesUntilEvent =
      getRelativeDayDistance(now, eventTime) * 24 * 60 + (eventTime.minuteOfDay - now.minuteOfDay);
    const reminderMinutes = sanitizeReminderLeadDays(event.提前提醒天数) * 24 * 60;
    if (minutesUntilEvent > reminderMinutes) {
      continue;
    }
    临时[id] = { ...event, 可见性: '仅LLM' };
    promotedIds.push(id);
  }

  const changed = promotedIds.length > 0;
  return {
    buckets: changed ? { 临时, 重复: buckets.重复 } : buckets,
    promotedIds,
    warnings,
    changed,
  };
}

export async function promoteDueSealedCalendarEvents(): Promise<CalendarVisibilityPromotionResult> {
  const buckets = await readActiveBuckets();
  const result = promoteDueSealedEventsInBuckets(buckets, readCurrentWorldTime().text);
  if (result.changed) {
    await replaceActiveBuckets(result.buckets);
  }
  return result;
}
