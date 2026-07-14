import {
  addDays,
  compareDatePoint,
  inferAnchorYear,
  isPointInsideRange,
  normalizeMonthDayText,
  parseMonthDayWithYear,
} from './date';
import type { DatePoint, DateRange } from './types';

export interface FestivalDateRangeInput {
  start: string;
  end: string;
  recurrence?: {
    intervalYears: number;
    lastYear: number;
  };
  now: DatePoint;
  prepareDays?: number;
}

export interface FestivalDateRangeResult {
  startText: string;
  endText: string;
  range: DateRange;
  reminderRange: DateRange;
  state: 'before' | 'active' | 'outside';
}

function getNearestOccurrenceYear(year: number, recurrence?: FestivalDateRangeInput['recurrence']): number {
  const intervalYears = Math.floor(Number(recurrence?.intervalYears));
  const lastYear = Math.floor(Number(recurrence?.lastYear));
  if (!Number.isFinite(intervalYears) || intervalYears <= 1 || !Number.isFinite(lastYear)) {
    return year;
  }

  const remainder = (((year - lastYear) % intervalYears) + intervalYears) % intervalYears;
  const previous = year - remainder;
  const next = previous + intervalYears;
  return Math.abs(year - previous) <= Math.abs(next - year) ? previous : next;
}

function normalizePrepareDays(value: number | undefined): number {
  const days = Number(value);
  return Number.isFinite(days) ? Math.floor(Math.max(0, days)) : 0;
}

export function resolveFestivalDateRange(input: FestivalDateRangeInput): FestivalDateRangeResult | null {
  const startText = normalizeMonthDayText(input.start);
  const endText = normalizeMonthDayText(input.end || input.start);
  if (!startText || !endText) {
    return null;
  }

  const startWithoutYear = parseMonthDayWithYear(startText, input.now.year);
  if (!startWithoutYear) {
    return null;
  }
  const occurrenceYear = getNearestOccurrenceYear(inferAnchorYear(input.now, startWithoutYear.month), input.recurrence);
  const start = parseMonthDayWithYear(startText, occurrenceYear);
  let end = parseMonthDayWithYear(endText, occurrenceYear);
  if (!start || !end) {
    return null;
  }
  if (compareDatePoint(end, start) < 0) {
    end = parseMonthDayWithYear(endText, occurrenceYear + 1);
    if (!end) {
      return null;
    }
  }

  const range = { start, end };
  const reminderRange = {
    start: addDays(start, -normalizePrepareDays(input.prepareDays)),
    end,
  };
  const state = isPointInsideRange(input.now, range)
    ? 'active'
    : isPointInsideRange(input.now, reminderRange) && compareDatePoint(input.now, start) < 0
      ? 'before'
      : 'outside';

  return { startText, endText, range, reminderRange, state };
}
