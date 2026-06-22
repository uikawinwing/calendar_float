import { parseAgendaSort, parseCalendarBucketType, parseSidebarTab } from '../../../../src/calendar-float/widget/event-binding/parsers';

function assertEqual(name: string, actual: unknown, expected: unknown): void {
  if (actual !== expected) {
    throw new Error(`${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

assertEqual('parses archive sidebar tab', parseSidebarTab('archive'), 'archive');
assertEqual('parses form sidebar tab', parseSidebarTab('form'), 'form');
assertEqual('falls back sidebar tab to detail', parseSidebarTab('bad'), 'detail');

assertEqual('parses date descending agenda sort', parseAgendaSort('date-desc'), 'date-desc');
assertEqual('parses festival-first agenda sort', parseAgendaSort('festival-first'), 'festival-first');
assertEqual('falls back agenda sort to date ascending', parseAgendaSort('bad'), 'date-asc');

assertEqual('parses repeat bucket type', parseCalendarBucketType('重复'), '重复');
assertEqual('falls back bucket type to temporary', parseCalendarBucketType('bad'), '临时');

console.log('widget/event-binding/parsers.check.ts OK');
