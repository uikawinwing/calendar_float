import type { CalendarAnchor, DatePoint, DateRange } from './types';

const WEEKDAY_ALIAS_MAP: Record<string, number> = {
  星期日: 0,
  星期天: 0,
  星期一: 1,
  星期二: 2,
  星期三: 3,
  星期四: 4,
  星期五: 5,
  星期六: 6,
};

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function parseDateKey(input: string): DatePoint | null {
  const match = String(input || '').match(/^(\d+)-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

export function formatDateKey(point: DatePoint): string {
  return `${point.year}-${pad2(point.month)}-${pad2(point.day)}`;
}

export function formatMonthDay(point: Pick<DatePoint, 'month' | 'day'>): string {
  return `${pad2(point.month)}-${pad2(point.day)}`;
}

export function cloneDatePoint(point: DatePoint): DatePoint {
  return { year: point.year, month: point.month, day: point.day };
}

export function toNativeDate(point: DatePoint): Date {
  return new Date(point.year, point.month - 1, point.day, 12, 0, 0, 0);
}

export function fromNativeDate(date: Date): DatePoint {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

export function isLeapYear(year: number): boolean {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

export function getDaysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function toOrdinalDay(point: DatePoint): number {
  let total = 0;
  for (let year = 1; year < point.year; year += 1) {
    total += isLeapYear(year) ? 366 : 365;
  }
  for (let month = 1; month < point.month; month += 1) {
    total += getDaysInMonth(point.year, month);
  }
  total += point.day - 1;
  return total;
}

export function ordinalToDate(ordinal: number): DatePoint {
  let remaining = Math.floor(ordinal);
  let year = 1;
  let month = 1;

  while (remaining >= (isLeapYear(year) ? 366 : 365)) {
    remaining -= isLeapYear(year) ? 366 : 365;
    year += 1;
  }

  while (remaining >= getDaysInMonth(year, month)) {
    remaining -= getDaysInMonth(year, month);
    month += 1;
  }

  return { year, month, day: remaining + 1 };
}

export function addDays(point: DatePoint, delta: number): DatePoint {
  return ordinalToDate(toOrdinalDay(point) + delta);
}

export function compareDatePoint(left: DatePoint, right: DatePoint): number {
  if (left.year !== right.year) {
    return left.year - right.year;
  }
  if (left.month !== right.month) {
    return left.month - right.month;
  }
  return left.day - right.day;
}

export function isSameDatePoint(left: DatePoint, right: DatePoint): boolean {
  return compareDatePoint(left, right) === 0;
}

export function getStartOfMonth(point: DatePoint): DatePoint {
  return { year: point.year, month: point.month, day: 1 };
}

export function getEndOfMonth(point: DatePoint): DatePoint {
  return { year: point.year, month: point.month, day: getDaysInMonth(point.year, point.month) };
}

export function getWeekdayFromAnchor(point: DatePoint, anchor?: CalendarAnchor | null): number {
  if (anchor) {
    const anchorPoint = parseDateKey(anchor.dateKey);
    if (anchorPoint) {
      const offset = toOrdinalDay(point) - toOrdinalDay(anchorPoint);
      const weekday = (anchor.weekday + offset) % 7;
      return weekday < 0 ? weekday + 7 : weekday;
    }
  }
  return toNativeDate(point).getDay();
}

export function getMonthGridStartWithAnchor(
  point: DatePoint,
  anchor?: CalendarAnchor | null,
  weekStartsOn = 0,
): DatePoint {
  const start = getStartOfMonth(point);
  const weekday = getWeekdayFromAnchor(start, anchor);
  const delta = (weekday - weekStartsOn + 7) % 7;
  return addDays(start, -delta);
}

export function getMonthGridEndWithAnchor(
  point: DatePoint,
  anchor?: CalendarAnchor | null,
  weekStartsOn = 0,
): DatePoint {
  const end = getEndOfMonth(point);
  const weekday = getWeekdayFromAnchor(end, anchor);
  const offset = (weekStartsOn + 6 - weekday + 7) % 7;
  return addDays(end, offset);
}

export function getMonthGridStart(point: DatePoint, weekStartsOn = 0): DatePoint {
  return getMonthGridStartWithAnchor(point, null, weekStartsOn);
}

export function getMonthGridEnd(point: DatePoint, weekStartsOn = 0): DatePoint {
  return getMonthGridEndWithAnchor(point, null, weekStartsOn);
}

export function enumerateDateRange(range: DateRange): DatePoint[] {
  const values: DatePoint[] = [];
  let cursor = cloneDatePoint(range.start);
  while (compareDatePoint(cursor, range.end) <= 0) {
    values.push(cloneDatePoint(cursor));
    cursor = addDays(cursor, 1);
  }
  return values;
}

export function isPointInsideRange(point: DatePoint, range: DateRange): boolean {
  return compareDatePoint(point, range.start) >= 0 && compareDatePoint(point, range.end) <= 0;
}

export function normalizeMonthDayText(input: string): string {
  const match = String(input || '')
    .trim()
    .match(/^(\d{1,2})[-/月](\d{1,2})日?$/);
  if (!match) {
    return '';
  }
  return `${pad2(Number(match[1]))}-${pad2(Number(match[2]))}`;
}

export function extractClockTimeText(input: string): string {
  const match = String(input || '').match(/(?:^|[^\d])([01]?\d|2[0-3]):([0-5]\d)(?!\d)/);
  if (!match) {
    return '';
  }
  return `${pad2(Number(match[1]))}:${match[2]}`;
}

export function parseMonthDayWithYear(input: string, year: number): DatePoint | null {
  const normalized = normalizeMonthDayText(input);
  if (!normalized) {
    return null;
  }
  const [monthText, dayText] = normalized.split('-');
  const month = Number(monthText);
  const day = Number(dayText);
  if (!Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  return { year, month, day };
}

export function ensureRangeOrder(range: DateRange): DateRange {
  if (compareDatePoint(range.start, range.end) <= 0) {
    return range;
  }
  return { start: range.end, end: range.start };
}

export function getRelativeDayDistance(from: DatePoint, to: DatePoint): number {
  return toOrdinalDay(to) - toOrdinalDay(from);
}

export function formatDateLabel(point: DatePoint, anchor?: CalendarAnchor | null): string {
  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][getWeekdayFromAnchor(point, anchor)];
  return `${point.month}月${point.day}日 ${weekday}`;
}

export function parseWorldDateAnchor(input: string): { point: DatePoint; weekday: number | null } | null {
  const text = String(input || '').trim();
  if (!text) {
    return null;
  }

  const fantasy = text.match(
    /(?:复兴纪元)?\s*(\d+)\s*年[-/ ]?(\d{1,2})\s*月[-/ ]?(\d{1,2})\s*日(?:[-/ ]?(星期[日天一二三四五六]))?/,
  );
  if (fantasy) {
    const weekdayText = fantasy[4] || '';
    return {
      point: {
        year: Number(fantasy[1]),
        month: Number(fantasy[2]),
        day: Number(fantasy[3]),
      },
      weekday: Object.prototype.hasOwnProperty.call(WEEKDAY_ALIAS_MAP, weekdayText)
        ? WEEKDAY_ALIAS_MAP[weekdayText]
        : null,
    };
  }

  const full = text.match(/(\d+)[/-](\d{1,2})[/-](\d{1,2})(?:[-/ ]?(星期[日天一二三四五六]))?/);
  if (full) {
    const weekdayText = full[4] || '';
    return {
      point: {
        year: Number(full[1]),
        month: Number(full[2]),
        day: Number(full[3]),
      },
      weekday: Object.prototype.hasOwnProperty.call(WEEKDAY_ALIAS_MAP, weekdayText)
        ? WEEKDAY_ALIAS_MAP[weekdayText]
        : null,
    };
  }

  return null;
}

export function parseWorldDateText(input: string): DatePoint | null {
  return parseWorldDateAnchor(input)?.point ?? null;
}

export function inferAnchorYear(now: DatePoint, month: number): number {
  if (month + 6 < now.month) {
    return now.year + 1;
  }
  if (month - 6 > now.month) {
    return now.year - 1;
  }
  return now.year;
}
