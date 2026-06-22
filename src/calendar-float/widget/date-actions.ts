import { extractClockTimeText, getWeekdayFromAnchor } from '../date';
import type { CalendarAnchor, DatePoint } from '../types';

const WORLD_WEEKDAY_TEXT = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'] as const;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function parseDateKeyPoint(value: string): DatePoint | null {
  const match = String(value || '')
    .trim()
    .match(/^(\d+)[/-](\d{1,2})[/-](\d{1,2})(?:[-/ ]?(?:[01]?\d|2[0-3]):[0-5]\d)?$/);
  if (!match) {
    return null;
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

export function getWorldTimePrefix(nowText: string): string {
  const match = String(nowText || '').match(/^([^\d]+?)(?=\d+\s*年)/);
  return match ? match[1].trim() : '';
}

export function formatWorldTimeForPoint(
  point: DatePoint,
  args: { nowText: string; anchor?: CalendarAnchor },
): string {
  const prefix = getWorldTimePrefix(args.nowText);
  const weekday = WORLD_WEEKDAY_TEXT[getWeekdayFromAnchor(point, args.anchor)] ?? '';
  const clock = extractClockTimeText(args.nowText);
  if (String(args.nowText || '').includes('年')) {
    return `${prefix}${point.year}年-${point.month}月-${point.day}日-${weekday}${clock ? `-${clock}` : ''}`;
  }
  return `${point.year}-${pad2(point.month)}-${pad2(point.day)}${clock ? `-${clock}` : ''}`;
}
