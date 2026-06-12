/**
 * 负责：月历视图需要的纯计算逻辑，例如格子构建、agenda 构建、提醒状态计算。
 * 不负责：worldbook 索引读取、正文解析、silent trigger scan。
 * 下游：[`../widget/index.ts`](src/calendar-float/widget/index.ts) 通过 [`./index.ts`](src/calendar-float/calendar-view-model/index.ts) 使用这里的能力。
 */
import {
  addDays,
  compareDatePoint,
  extractClockTimeText,
  formatDateKey,
  formatDateLabel,
  formatMonthDay,
  getDaysInMonth,
  getEndOfMonth,
  getMonthGridEndWithAnchor,
  getMonthGridStartWithAnchor,
  getRelativeDayDistance,
  getWeekdayFromAnchor,
  isPointInsideRange,
  isSameDatePoint,
  normalizeMonthDayText,
  parseMonthDayWithYear,
} from '../date';
import { getFestivalLocationKeywords } from '../festival-location';
import { buildFestivalMarker } from '../festival-visual';
import type {
  AgendaItemKind,
  CalendarDataset,
  CalendarEventRecord,
  DailyAgendaGroup,
  DailyAgendaItem,
  DatePoint,
  DateRange,
  FestivalRecord,
  MonthDayCell,
  ReminderLevel,
  ReminderState,
  WorldbookStageRecord,
} from '../types';

export const MONTH_EVENT_ROW_LIMIT = 3;

function nextDay(point: DatePoint): DatePoint {
  return addDays(point, 1);
}

function normalizeFestivalEvent(festival: FestivalRecord): CalendarEventRecord {
  const marker = buildFestivalMarker(festival);
  const locationKeywords = getFestivalLocationKeywords(festival);
  return {
    source: 'festival',
    sourceKind: festival.sourceKind,
    id: festival.id,
    type: '节庆',
    title: festival.title,
    content: festival.content || festival.summary,
    startText: festival.startText,
    endText: festival.endText,
    repeatRule: '每年',
    tags: ['节庆'],
    allDay: true,
    range: festival.range,
    relatedBookIds: festival.relatedBookIds,
    metadata: {
      ...festival.metadata,
      locationKeywords,
      stages: festival.stages,
      entryName: festival.entryName,
      festivalIconSvg: marker.iconSvg,
      festivalIconColor: marker.iconColor,
      festivalLocationLabel: locationKeywords[0] || '',
    },
    color: marker.color,
  };
}

function normalizeFestivalStageMonthEvent(festival: FestivalRecord, stage: WorldbookStageRecord): CalendarEventRecord {
  const marker = buildFestivalMarker(festival);
  const locationKeywords = getFestivalLocationKeywords(festival);
  return {
    source: 'festival',
    sourceKind: festival.sourceKind,
    id: `${festival.id}:${stage.phaseId}`,
    type: '节庆',
    title: `${festival.title} · ${stage.title}`,
    content: stage.summary || festival.content || festival.summary,
    startText: stage.startText,
    endText: stage.endText,
    repeatRule: '每年',
    tags: ['节庆', '阶段'],
    allDay: true,
    range: stage.range,
    relatedBookIds: festival.relatedBookIds,
    metadata: {
      ...festival.metadata,
      locationKeywords,
      stages: festival.stages,
      entryName: festival.entryName,
      festivalId: festival.id,
      festivalTitle: festival.title,
      stageId: stage.phaseId,
      stageTitle: stage.title,
      monthChipKind: 'stage-bubble',
      monthChipLabel: stage.title,
      festivalIconSvg: marker.iconSvg,
      festivalIconColor: marker.iconColor,
      festivalLocationLabel: locationKeywords[0] || '',
    },
    color: marker.color,
  };
}

function rangesOverlap(left: DateRange, right: DateRange): boolean {
  return compareDatePoint(left.start, right.end) <= 0 && compareDatePoint(left.end, right.start) >= 0;
}

function isFestivalOccurrenceYear(festival: FestivalRecord, year: number): boolean {
  const recurrence = festival.recurrence;
  if (!recurrence) {
    return true;
  }
  const intervalYears = Math.floor(Number(recurrence.intervalYears));
  const lastYear = Math.floor(Number(recurrence.lastYear));
  if (!Number.isFinite(intervalYears) || intervalYears <= 1 || !Number.isFinite(lastYear)) {
    return true;
  }
  return (year - lastYear) % intervalYears === 0;
}

function resolveFestivalMonthDayOccurrenceRange(
  festival: FestivalRecord,
  startYear: number,
  rawStartText: string,
  rawEndText: string,
): DateRange | null {
  const startText = normalizeMonthDayText(rawStartText);
  const endText = normalizeMonthDayText(rawEndText || rawStartText);
  if (!startText || !endText) {
    return null;
  }

  if (!isFestivalOccurrenceYear(festival, startYear)) {
    return null;
  }

  const start = parseMonthDayWithYear(startText, startYear);
  if (!start) {
    return null;
  }

  let end = parseMonthDayWithYear(endText, startYear);
  if (!end) {
    return null;
  }

  if (compareDatePoint(end, start) < 0) {
    end = parseMonthDayWithYear(endText, startYear + 1);
    if (!end) {
      return null;
    }
  }

  return { start, end };
}

function resolveFestivalOccurrenceRange(festival: FestivalRecord, startYear: number): DateRange | null {
  if (!normalizeMonthDayText(festival.startText) || !normalizeMonthDayText(festival.endText || festival.startText)) {
    return festival.range ?? null;
  }
  return resolveFestivalMonthDayOccurrenceRange(festival, startYear, festival.startText, festival.endText);
}

export function buildFestivalEventsForRange(
  festivals: FestivalRecord[],
  targetRange: DateRange,
): CalendarEventRecord[] {
  return festivals.flatMap(festival => {
    const baseEvent = normalizeFestivalEvent(festival);
    const candidateStartYears = new Set<number>([
      targetRange.start.year - 1,
      targetRange.start.year,
      targetRange.end.year,
      targetRange.end.year + 1,
    ]);
    const ranges = [...candidateStartYears]
      .map(year => resolveFestivalOccurrenceRange(festival, year))
      .filter((range): range is DateRange => Boolean(range))
      .filter(range => rangesOverlap(range, targetRange))
      .sort((left, right) => compareDatePoint(left.start, right.start));

    if (ranges.length === 0 && festival.range && rangesOverlap(festival.range, targetRange)) {
      return [baseEvent];
    }

    return ranges.map(range => ({
      ...baseEvent,
      range,
      metadata: {
        ...baseEvent.metadata,
        occurrenceStartYear: range.start.year,
      },
    }));
  });
}

function buildFestivalStageMonthEventsForRange(
  festival: FestivalRecord,
  targetRange: DateRange,
): CalendarEventRecord[] {
  if (festival.stages.length === 0) {
    return [];
  }

  const candidateStartYears = new Set<number>([
    targetRange.start.year - 1,
    targetRange.start.year,
    targetRange.end.year,
    targetRange.end.year + 1,
  ]);

  return festival.stages.flatMap(stage => {
    const baseEvent = normalizeFestivalStageMonthEvent(festival, stage);
    const ranges = [...candidateStartYears]
      .map(year => resolveFestivalMonthDayOccurrenceRange(festival, year, stage.startText, stage.endText))
      .filter((range): range is DateRange => Boolean(range))
      .filter(range => rangesOverlap(range, targetRange))
      .sort((left, right) => compareDatePoint(left.start, right.start));

    if (ranges.length === 0 && stage.range && rangesOverlap(stage.range, targetRange)) {
      return [baseEvent];
    }

    return ranges.map(range => ({
      ...baseEvent,
      range,
      metadata: {
        ...baseEvent.metadata,
        occurrenceStartYear: range.start.year,
      },
    }));
  });
}

export function buildFestivalMonthChipEventsForRange(
  festivals: FestivalRecord[],
  targetRange: DateRange,
): CalendarEventRecord[] {
  return festivals.flatMap(festival => {
    if (festival.stages.length > 0) {
      return buildFestivalStageMonthEventsForRange(festival, targetRange);
    }
    return buildFestivalEventsForRange([festival], targetRange);
  });
}

function getEventSourcePriority(event: CalendarEventRecord): number {
  if (event.source === 'festival') {
    return 0;
  }
  if (event.source === 'active') {
    return 1;
  }
  return 2;
}

function getRangeDayLength(range: DateRange): number {
  return Math.max(1, getRelativeDayDistance(range.start, range.end) + 1);
}

function clampRangeToBoundary(range: DateRange, boundary: DateRange): DateRange | null {
  if (!rangesOverlap(range, boundary)) {
    return null;
  }
  return {
    start: compareDatePoint(range.start, boundary.start) < 0 ? boundary.start : range.start,
    end: compareDatePoint(range.end, boundary.end) > 0 ? boundary.end : range.end,
  };
}

function clampDayToMonth(year: number, month: number, day: number): DatePoint {
  return {
    year,
    month,
    day: Math.min(Math.max(1, day), getDaysInMonth(year, month)),
  };
}

function addMonths(point: Pick<DatePoint, 'year' | 'month'>, delta: number): Pick<DatePoint, 'year' | 'month'> {
  const zeroBased = point.year * 12 + (point.month - 1) + delta;
  return {
    year: Math.floor(zeroBased / 12),
    month: (zeroBased % 12) + 1,
  };
}

function enumerateMonthsInRange(range: DateRange): Pick<DatePoint, 'year' | 'month'>[] {
  const values: Pick<DatePoint, 'year' | 'month'>[] = [];
  let cursor = addMonths(range.start, -1);
  const end = addMonths(range.end, 1);
  while (cursor.year < end.year || (cursor.year === end.year && cursor.month <= end.month)) {
    values.push(cursor);
    cursor = addMonths(cursor, 1);
  }
  return values;
}

function parseMonthlyDayText(value: string): number | null {
  const text = String(value || '').trim();
  const match =
    text.match(/每月\s*(\d{1,2})\s*[日号]?/) ??
    text.match(/(?:^|[^\d])(\d{1,2})\s*[日号](?!\d)/) ??
    text.match(/^(\d{1,2})$/);
  if (!match) {
    return null;
  }
  const day = Number(match[1]);
  return Number.isFinite(day) && day >= 1 && day <= 31 ? day : null;
}

const WEEKDAY_TEXT_MAP: Record<string, number> = {
  日: 0,
  天: 0,
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
};

function parseWeeklyDayTexts(value: string): number[] {
  const text = String(value || '').trim().toLowerCase();
  if (!text) {
    return [];
  }
  const values = new Set<number>();
  const normalized = text.replace(/星期/g, '周').replace(/礼拜/g, '周');
  if (/每周|每星期|周|星期|礼拜/.test(text)) {
    for (const [, day] of normalized.matchAll(/([日天一二三四五六])/g)) {
      const weekday = WEEKDAY_TEXT_MAP[day];
      if (weekday !== undefined) {
        values.add(weekday);
      }
    }
  }
  const englishMap: Array<[RegExp, number]> = [
    [/\b(mon|monday)\b/, 1],
    [/\b(tue|tues|tuesday)\b/, 2],
    [/\b(wed|wednesday)\b/, 3],
    [/\b(thu|thur|thurs|thursday)\b/, 4],
    [/\b(fri|friday)\b/, 5],
    [/\b(sat|saturday)\b/, 6],
    [/\b(sun|sunday)\b/, 0],
  ];
  englishMap.forEach(([pattern, weekday]) => {
    if (pattern.test(text)) {
      values.add(weekday);
    }
  });
  return [0, 1, 2, 3, 4, 5, 6].filter(weekday => values.has(weekday));
}

function parseWeeklyDayText(value: string): number | null {
  return parseWeeklyDayTexts(value)[0] ?? null;
}

function parseYearlyMonthDayText(value: string): Pick<DatePoint, 'month' | 'day'> | null {
  const text = String(value || '').trim();
  const normalized = normalizeMonthDayText(text.replace(/^每年\s*/, ''));
  if (!normalized) {
    return null;
  }
  const [monthText, dayText] = normalized.split('-');
  const month = Number(monthText);
  const day = Number(dayText);
  if (!Number.isFinite(month) || month < 1 || month > 12 || !Number.isFinite(day) || day < 1 || day > 31) {
    return null;
  }
  return { month, day };
}

function getEventRangeDaySpan(event: CalendarEventRecord): number {
  if (!event.range) {
    return 0;
  }
  return Math.max(0, getRelativeDayDistance(event.range.start, event.range.end));
}

function eventWithOccurrenceRange(event: CalendarEventRecord, range: DateRange): CalendarEventRecord {
  return {
    ...event,
    range,
    metadata: {
      ...event.metadata,
      occurrenceStartKey: formatDateKey(range.start),
    },
  };
}

function buildDailyEventOccurrences(event: CalendarEventRecord, targetRange: DateRange): CalendarEventRecord[] {
  const span = getEventRangeDaySpan(event);
  const startBoundary = addDays(targetRange.start, -span);
  const occurrences: CalendarEventRecord[] = [];
  let cursor = startBoundary;
  while (compareDatePoint(cursor, targetRange.end) <= 0) {
    const range = { start: cursor, end: addDays(cursor, span) };
    if (rangesOverlap(range, targetRange)) {
      occurrences.push(eventWithOccurrenceRange(event, range));
    }
    cursor = addDays(cursor, 1);
  }
  return occurrences;
}

function buildWorkdayEventOccurrences(
  event: CalendarEventRecord,
  targetRange: DateRange,
  anchor?: CalendarDataset['calendarAnchor'],
): CalendarEventRecord[] {
  const span = getEventRangeDaySpan(event);
  const startBoundary = addDays(targetRange.start, -span);
  const occurrences: CalendarEventRecord[] = [];
  let cursor = startBoundary;
  while (compareDatePoint(cursor, targetRange.end) <= 0) {
    const weekday = getWeekdayFromAnchor(cursor, anchor);
    if (weekday >= 1 && weekday <= 5) {
      const range = { start: cursor, end: addDays(cursor, span) };
      if (rangesOverlap(range, targetRange)) {
        occurrences.push(eventWithOccurrenceRange(event, range));
      }
    }
    cursor = addDays(cursor, 1);
  }
  return occurrences;
}

function buildWeeklyEventOccurrences(
  event: CalendarEventRecord,
  targetRange: DateRange,
  anchor?: CalendarDataset['calendarAnchor'],
): CalendarEventRecord[] {
  const startWeekdays = parseWeeklyDayTexts(event.startText);
  if (startWeekdays.length > 1 && !event.endText) {
    const startBoundary = addDays(targetRange.start, -7);
    const occurrences: CalendarEventRecord[] = [];
    let cursor = startBoundary;
    while (compareDatePoint(cursor, targetRange.end) <= 0) {
      if (startWeekdays.includes(getWeekdayFromAnchor(cursor, anchor))) {
        const range = { start: cursor, end: cursor };
        if (rangesOverlap(range, targetRange)) {
          occurrences.push(eventWithOccurrenceRange(event, range));
        }
      }
      cursor = addDays(cursor, 1);
    }
    return occurrences;
  }
  const startWeekday = startWeekdays[0] ?? (event.range ? getWeekdayFromAnchor(event.range.start, anchor) : null);
  if (startWeekday === null) {
    return event.range && rangesOverlap(event.range, targetRange) ? [event] : [];
  }
  const endWeekday = parseWeeklyDayText(event.endText || event.startText) ?? startWeekday;
  const span = (endWeekday - startWeekday + 7) % 7;
  const startBoundary = addDays(targetRange.start, -7);
  const occurrences: CalendarEventRecord[] = [];
  let cursor = startBoundary;
  while (compareDatePoint(cursor, targetRange.end) <= 0) {
    if (getWeekdayFromAnchor(cursor, anchor) === startWeekday) {
      const range = { start: cursor, end: addDays(cursor, span) };
      if (rangesOverlap(range, targetRange)) {
        occurrences.push(eventWithOccurrenceRange(event, range));
      }
    }
    cursor = addDays(cursor, 1);
  }
  return occurrences;
}

function buildMonthlyEventOccurrences(event: CalendarEventRecord, targetRange: DateRange): CalendarEventRecord[] {
  const startDay = parseMonthlyDayText(event.startText);
  const endDay = parseMonthlyDayText(event.endText || event.startText);
  if (!startDay || !endDay) {
    return event.range && rangesOverlap(event.range, targetRange) ? [event] : [];
  }

  return enumerateMonthsInRange(targetRange)
    .map(({ year, month }) => {
      const start = clampDayToMonth(year, month, startDay);
      const endMonth = endDay >= startDay ? { year, month } : addMonths({ year, month }, 1);
      const end = clampDayToMonth(endMonth.year, endMonth.month, endDay);
      return { start, end };
    })
    .filter(range => rangesOverlap(range, targetRange))
    .map(range => eventWithOccurrenceRange(event, range));
}

function buildYearlyEventOccurrences(event: CalendarEventRecord, targetRange: DateRange): CalendarEventRecord[] {
  const startMonthDay =
    parseYearlyMonthDayText(event.startText) ??
    (event.range ? { month: event.range.start.month, day: event.range.start.day } : null);
  if (!startMonthDay) {
    return event.range && rangesOverlap(event.range, targetRange) ? [event] : [];
  }
  const endMonthDay =
    parseYearlyMonthDayText(event.endText || event.startText) ??
    (event.range ? { month: event.range.end.month, day: event.range.end.day } : startMonthDay);
  const startYears = new Set([targetRange.start.year - 1, targetRange.start.year, targetRange.end.year]);
  return [...startYears]
    .map(year => {
      const start = clampDayToMonth(year, startMonthDay.month, startMonthDay.day);
      const endYear =
        endMonthDay.month > startMonthDay.month ||
        (endMonthDay.month === startMonthDay.month && endMonthDay.day >= startMonthDay.day)
          ? year
          : year + 1;
      const end = clampDayToMonth(endYear, endMonthDay.month, endMonthDay.day);
      return { start, end };
    })
    .filter(range => rangesOverlap(range, targetRange))
    .map(range => eventWithOccurrenceRange(event, range));
}

function expandCalendarEventsForRange(
  events: CalendarEventRecord[],
  targetRange: DateRange,
  anchor?: CalendarDataset['calendarAnchor'],
): CalendarEventRecord[] {
  return events.flatMap(event => {
    if (event.repeatRule === '每天') {
      return buildDailyEventOccurrences(event, targetRange);
    }
    if (event.repeatRule === '每周') {
      return buildWeeklyEventOccurrences(event, targetRange, anchor);
    }
    if (event.repeatRule === '每月') {
      return buildMonthlyEventOccurrences(event, targetRange);
    }
    if (event.repeatRule === '每年') {
      return buildYearlyEventOccurrences(event, targetRange);
    }
    if (event.repeatRule === '仅工作日') {
      return buildWorkdayEventOccurrences(event, targetRange, anchor);
    }
    return event.range && rangesOverlap(event.range, targetRange) ? [event] : [];
  });
}

function incrementOverflowForBlockedSpan(
  week: MonthDayCell[],
  rowOccupancy: boolean[][],
  startIndex: number,
  endIndex: number,
): void {
  let incremented = false;
  for (let index = startIndex; index <= endIndex; index += 1) {
    if (rowOccupancy.every(row => row[index])) {
      week[index].overflowCount += 1;
      incremented = true;
    }
  }
  if (!incremented) {
    week[startIndex].overflowCount += 1;
  }
}

function compareMonthEvents(left: CalendarEventRecord, right: CalendarEventRecord): number {
  const sourcePriority = getEventSourcePriority(left) - getEventSourcePriority(right);
  if (sourcePriority !== 0) {
    return sourcePriority;
  }
  if (left.range && right.range) {
    const lengthOrder = getRangeDayLength(right.range) - getRangeDayLength(left.range);
    if (lengthOrder !== 0) {
      return lengthOrder;
    }
    const startOrder = compareDatePoint(left.range.start, right.range.start);
    if (startOrder !== 0) {
      return startOrder;
    }
  }
  return left.title.localeCompare(right.title, 'zh-CN') || left.id.localeCompare(right.id);
}

function findWeekCellIndex(week: MonthDayCell[], point: DatePoint): number {
  return week.findIndex(cell => cell.year === point.year && cell.month === point.month && cell.day === point.day);
}

function assignMonthWeekChips(cells: MonthDayCell[], events: CalendarEventRecord[]): void {
  const cellsByKey = new Map(cells.map(cell => [cell.key, cell]));
  for (let weekStart = 0; weekStart < cells.length; weekStart += 7) {
    const week = cells.slice(weekStart, weekStart + 7);
    const first = week[0];
    const last = week[week.length - 1];
    if (!first || !last) {
      continue;
    }

    const weekRange: DateRange = {
      start: { year: first.year, month: first.month, day: first.day },
      end: { year: last.year, month: last.month, day: last.day },
    };
    const rowOccupancy = Array.from({ length: MONTH_EVENT_ROW_LIMIT }, () => Array(week.length).fill(false));
    const weekEvents = events
      .filter(event => event.range && rangesOverlap(event.range, weekRange))
      .sort(compareMonthEvents);

    weekEvents.forEach(event => {
      if (!event.range) {
        return;
      }
      const clamped = clampRangeToBoundary(event.range, weekRange);
      if (!clamped) {
        return;
      }

      const startIndex = findWeekCellIndex(week, clamped.start);
      const endIndex = findWeekCellIndex(week, clamped.end);
      if (startIndex < 0 || endIndex < startIndex) {
        return;
      }

      const row = rowOccupancy.findIndex(occupied => occupied.slice(startIndex, endIndex + 1).every(value => !value));
      if (row < 0) {
        incrementOverflowForBlockedSpan(week, rowOccupancy, startIndex, endIndex);
        return;
      }

      for (let index = startIndex; index <= endIndex; index += 1) {
        rowOccupancy[row][index] = true;
        const cell = week[index];
        const key = formatDateKey({ year: cell.year, month: cell.month, day: cell.day });
        cellsByKey.get(key)?.chips.push({
          id: event.id,
          title: event.title,
          label: typeof event.metadata.monthChipLabel === 'string' ? event.metadata.monthChipLabel : undefined,
          row,
          startOffset: 0,
          endOffset: 0,
          isStart: isSameDatePoint({ year: cell.year, month: cell.month, day: cell.day }, event.range.start),
          isEnd: isSameDatePoint({ year: cell.year, month: cell.month, day: cell.day }, event.range.end),
          source: event.source,
          colorToken: event.source === 'festival' ? 'festival' : event.source === 'archive' ? 'archived' : 'user',
          color: event.color,
          displayKind: event.metadata.monthChipKind === 'stage-bubble' ? 'stage-bubble' : 'bar',
        });
      }
    });
  }

  cells.forEach(cell => {
    cell.chips.sort((left, right) => left.row - right.row || left.title.localeCompare(right.title, 'zh-CN'));
  });
}

export function buildMonthCells(args: {
  month: DatePoint;
  selectedDateKey: string;
  dataset: CalendarDataset;
}): MonthDayCell[] {
  const monthStart = getMonthGridStartWithAnchor(args.month, args.dataset.calendarAnchor);
  const monthEnd = getMonthGridEndWithAnchor(args.month, args.dataset.calendarAnchor);
  const today = args.dataset.nowDate;
  const monthRange = { start: monthStart, end: monthEnd };
  const allEvents = [
    ...expandCalendarEventsForRange(
      [...args.dataset.activeEvents, ...args.dataset.archivedEvents],
      monthRange,
      args.dataset.calendarAnchor,
    ),
    ...buildFestivalMonthChipEventsForRange(args.dataset.festivals, { start: monthStart, end: monthEnd }),
  ];
  const cells: MonthDayCell[] = [];

  let cursor = monthStart;
  while (compareDatePoint(cursor, monthEnd) <= 0) {
    const key = formatDateKey(cursor);

    cells.push({
      key,
      year: cursor.year,
      month: cursor.month,
      day: cursor.day,
      weekday: getWeekdayFromAnchor(cursor, args.dataset.calendarAnchor),
      inCurrentMonth: cursor.month === args.month.month,
      isToday: today ? isSameDatePoint(cursor, today) : false,
      isSelected: key === args.selectedDateKey,
      reminderLevel: resolveDateReminderLevel(cursor, args.dataset),
      chips: [],
      markers: [],
      overflowCount: 0,
    });
    cursor = nextDay(cursor);
  }

  assignMonthWeekChips(cells, allEvents);
  return cells;
}

function getAgendaItemSortClock(item: Pick<DailyAgendaItem, 'startText' | 'endText'>): string {
  return extractClockTimeText(item.startText) || extractClockTimeText(item.endText);
}

function formatAgendaPeriodLabel(range?: DateRange): string {
  if (!range) {
    return '';
  }
  const start = formatMonthDay(range.start).replace('-', '/');
  const end = formatMonthDay(range.end).replace('-', '/');
  return start === end ? start : `${start}-${end}`;
}

function isPeriodRange(range?: DateRange): boolean {
  return Boolean(range && compareDatePoint(range.start, range.end) < 0);
}

function buildAgendaItem(args: {
  dataset: CalendarDataset;
  event: CalendarEventRecord;
  point: DatePoint;
  dateKey: string;
}): DailyAgendaItem {
  const { dataset, event, point, dateKey } = args;
  const kind: AgendaItemKind = event.source === 'festival' ? 'festival' : 'user';
  const matchedFestival =
    event.source === 'festival' ? dataset.festivals.find(festival => festival.id === event.id) : undefined;
  const marker = matchedFestival ? buildFestivalMarker(matchedFestival) : undefined;
  const locationKeywords = matchedFestival ? getFestivalLocationKeywords(matchedFestival) : [];
  return {
    id: event.id,
    dateKey,
    title: event.title,
    summary: matchedFestival?.summary || event.content,
    kind,
    source: event.source,
    sourceKind: event.sourceKind,
    type: event.type,
    startText: event.startText,
    endText: event.endText,
    periodLabel: formatAgendaPeriodLabel(event.range),
    sortStartKey: event.range ? formatDateKey(event.range.start) : dateKey,
    sortEndKey: event.range ? formatDateKey(event.range.end) : dateKey,
    isPeriod: isPeriodRange(event.range),
    stageTitle: resolveStageTitle(point, matchedFestival),
    festivalIconSvg: marker?.iconSvg || String(event.metadata.festivalIconSvg || '').trim() || undefined,
    festivalIconColor: marker?.iconColor || String(event.metadata.festivalIconColor || '').trim() || undefined,
    festivalLocationLabel:
      locationKeywords[0] || String(event.metadata.festivalLocationLabel || '').trim() || undefined,
    tags: event.tags,
    relatedBookIds: event.relatedBookIds,
    reminderLevel: resolveEventReminderLevel(point, event),
    metadata: event.metadata,
    color: event.color ?? marker?.color,
  };
}

function compareDailyAgendaItems(left: DailyAgendaItem, right: DailyAgendaItem): number {
  if (left.isPeriod !== right.isPeriod) {
    return left.isPeriod ? -1 : 1;
  }
  const startOrder = String(left.sortStartKey || left.dateKey).localeCompare(
    String(right.sortStartKey || right.dateKey),
  );
  if (startOrder !== 0) {
    return startOrder;
  }
  const leftClock = getAgendaItemSortClock(left);
  const rightClock = getAgendaItemSortClock(right);
  if (leftClock || rightClock) {
    if (!leftClock) {
      return 1;
    }
    if (!rightClock) {
      return -1;
    }
    return leftClock.localeCompare(rightClock) || left.title.localeCompare(right.title, 'zh-CN');
  }
  return left.title.localeCompare(right.title, 'zh-CN');
}

export function buildDailyAgenda(dataset: CalendarDataset, startDateKey?: string, dayCount = 7): DailyAgendaGroup[] {
  const base = dataset.nowDate ?? {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
  };
  const start = startDateKey ? (parseDateKey(startDateKey) ?? base) : base;
  const end = addDays(start, Math.max(0, dayCount - 1));
  const targetRange = { start, end };
  const events = [
    ...expandCalendarEventsForRange([...dataset.activeEvents, ...dataset.archivedEvents], targetRange, dataset.calendarAnchor),
    ...buildFestivalEventsForRange(dataset.festivals, targetRange),
  ];

  return Array.from({ length: dayCount }, (_, index) => {
    const point = addDays(start, index);
    const dateKey = formatDateKey(point);
    const items: DailyAgendaItem[] = events
      .filter(event => event.range && isPointInsideRange(point, event.range))
      .map(event => buildAgendaItem({ dataset, event, point, dateKey }))
      .sort(compareDailyAgendaItems);

    return {
      dateKey,
      label: formatDateLabel(point, dataset.calendarAnchor),
      items,
    };
  });
}

export function buildMonthAgenda(dataset: CalendarDataset, month: DatePoint): DailyAgendaGroup[] {
  const start = { year: month.year, month: month.month, day: 1 };
  const end = getEndOfMonth(month);
  const monthRange = { start, end };
  const events = [
    ...expandCalendarEventsForRange([...dataset.activeEvents, ...dataset.archivedEvents], monthRange, dataset.calendarAnchor),
    ...buildFestivalEventsForRange(dataset.festivals, monthRange),
  ];
  const items = events
    .filter(event => event.range && rangesOverlap(event.range, monthRange))
    .map(event => {
      const clampedRange = event.range ? clampRangeToBoundary(event.range, monthRange) : null;
      const point = clampedRange?.start ?? start;
      return buildAgendaItem({
        dataset,
        event,
        point,
        dateKey: formatDateKey(point),
      });
    })
    .sort(compareDailyAgendaItems);

  return [
    {
      dateKey: formatDateKey(start),
      label: `${month.month}月事件`,
      items,
    },
  ];
}

export function buildReminderState(dataset: CalendarDataset): ReminderState {
  const now = dataset.nowDate;
  if (!now) {
    return { hasUpcoming: false, maxLevel: 'none', reasons: [] };
  }

  const reasons: string[] = [];
  let maxLevel: ReminderLevel = 'none';
  const reminderRange = { start: addDays(now, -31), end: addDays(now, 3) };
  const events = [
    ...expandCalendarEventsForRange(dataset.activeEvents, reminderRange, dataset.calendarAnchor),
    ...buildFestivalEventsForRange(dataset.festivals, reminderRange),
  ];
  events.forEach(event => {
    if (!event.range) {
      return;
    }
    const distance = getRelativeDayDistance(now, event.range.start);
    if (distance === 0) {
      reasons.push(`今天：${event.title}`);
      maxLevel = 'today';
      return;
    }
    if (distance > 0 && distance <= 3 && maxLevel !== 'today') {
      reasons.push(`${distance}天后：${event.title}`);
      maxLevel = 'soon';
    }
  });

  return {
    hasUpcoming: reasons.length > 0,
    maxLevel,
    reasons,
  };
}

function resolveDateReminderLevel(point: DatePoint, dataset: CalendarDataset): ReminderLevel {
  const now = dataset.nowDate;
  if (!now) {
    return 'none';
  }
  const distance = getRelativeDayDistance(now, point);
  if (distance === 0) {
    return 'today';
  }
  if (distance > 0 && distance <= 3) {
    return 'soon';
  }
  return 'none';
}

function resolveEventReminderLevel(point: DatePoint, event: CalendarEventRecord): ReminderLevel {
  if (!event.range) {
    return 'none';
  }
  if (isSameDatePoint(point, event.range.start)) {
    return 'today';
  }
  return 'none';
}

function resolveStageTitle(point: DatePoint, festival?: FestivalRecord): string | undefined {
  if (!festival) {
    return undefined;
  }
  const stage = festival.stages.find(candidate => candidate.range && isPointInsideRange(point, candidate.range));
  return stage?.title;
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
