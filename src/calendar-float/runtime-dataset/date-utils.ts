import { compareDatePoint, normalizeMonthDayText, parseMonthDayWithYear, parseWorldDateText } from '../date';
import { getActiveCalendarDateParseOptions } from '../profile';
import type { CalendarMonthAliasRecord, DatePoint, DateRange } from '../types';

export function parseRuntimeEventTextToPoint(
  text: string,
  now: DatePoint,
  monthAliases: CalendarMonthAliasRecord[] = [],
): DatePoint | null {
  const normalized = String(text || '').trim();
  if (!normalized) {
    return null;
  }

  const worldDate = parseWorldDateText(normalized, {
    monthAliases,
    ...getActiveCalendarDateParseOptions(),
  });
  if (worldDate) {
    return worldDate;
  }

  const full = normalized.match(/(\d+)[/-](\d{1,2})[/-](\d{1,2})/);
  if (full) {
    return {
      year: Number(full[1]),
      month: Number(full[2]),
      day: Number(full[3]),
    };
  }

  const monthDay = normalized.match(/(\d{1,2})[-/月](\d{1,2})日?/);
  if (!monthDay) {
    return null;
  }
  return parseMonthDayWithYear(`${monthDay[1]}-${monthDay[2]}`, now.year);
}

export function buildRuntimeEventRange(args: {
  startText: string;
  endText: string;
  now: DatePoint;
  monthAliases?: CalendarMonthAliasRecord[];
}): DateRange | undefined {
  const start = parseRuntimeEventTextToPoint(args.startText, args.now, args.monthAliases);
  const end = parseRuntimeEventTextToPoint(args.endText || args.startText, args.now, args.monthAliases);
  return start && end ? { start, end: compareDatePoint(start, end) <= 0 ? end : start } : undefined;
}

export function normalizeRuntimeMonthDayText(value: string): string {
  return normalizeMonthDayText(value);
}
