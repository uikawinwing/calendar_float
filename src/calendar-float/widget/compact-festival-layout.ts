import {
  MONTH_EVENT_ROW_LIMIT,
  buildFestivalMonthChipEventsForRange,
} from '../calendar-view-model';
import { addDays, compareDatePoint } from '../date';
import type { CalendarDataset, CalendarEventRecord, DatePoint, DateRange, MonthDayCell } from '../types';

function getVisibleRangeDayLength(range: DateRange): number {
  let length = 1;
  let cursor = range.start;
  while (compareDatePoint(cursor, range.end) < 0) {
    length += 1;
    cursor = addDays(cursor, 1);
  }
  return length;
}

function compareCompactFestivalBars(left: CalendarEventRecord, right: CalendarEventRecord): number {
  if (left.range && right.range) {
    const lengthOrder = getVisibleRangeDayLength(right.range) - getVisibleRangeDayLength(left.range);
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

function rangesOverlap(left: DateRange, right: DateRange): boolean {
  return compareDatePoint(left.start, right.end) <= 0 && compareDatePoint(left.end, right.start) >= 0;
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

function addCompactFestivalBars(cells: MonthDayCell[], events: CalendarEventRecord[]): void {
  if (!cells.length || !events.length) {
    return;
  }

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
    week.forEach((cell, cellIndex) => {
      cell.chips.forEach(chip => {
        if (chip.row >= 0 && chip.row < MONTH_EVENT_ROW_LIMIT) {
          rowOccupancy[chip.row][cellIndex] = true;
        }
      });
    });

    events
      .filter(event => event.range && rangesOverlap(event.range, weekRange))
      .sort(compareCompactFestivalBars)
      .forEach(event => {
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
          cell.chips.push({
            id: event.id,
            title: event.title,
            label: typeof event.metadata.monthChipLabel === 'string' ? event.metadata.monthChipLabel : undefined,
            row,
            startOffset: 0,
            endOffset: 0,
            isStart: compareDatePoint({ year: cell.year, month: cell.month, day: cell.day }, event.range.start) === 0,
            isEnd: compareDatePoint({ year: cell.year, month: cell.month, day: cell.day }, event.range.end) === 0,
            source: event.source,
            colorToken: 'festival',
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

export function addCompactFestivalChips(
  cells: MonthDayCell[],
  markerDataset: CalendarDataset,
  barDataset: CalendarDataset,
): void {
  if (!cells.length) {
    return;
  }
  const barFestivalIds = new Set(barDataset.festivals.map(festival => festival.id));
  const compactFestivals = markerDataset.festivals.filter(festival => !barFestivalIds.has(festival.id));
  if (!compactFestivals.length) {
    return;
  }

  const range: DateRange = {
    start: { year: cells[0].year, month: cells[0].month, day: cells[0].day },
    end: {
      year: cells[cells.length - 1].year,
      month: cells[cells.length - 1].month,
      day: cells[cells.length - 1].day,
    },
  };
  const compactEvents = buildFestivalMonthChipEventsForRange(compactFestivals, range);
  addCompactFestivalBars(cells, compactEvents);
}
