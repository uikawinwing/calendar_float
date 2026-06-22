import { buildSelectedDayDetail, fallbackDateLabel } from '../../../src/calendar-float/widget/day-detail';
import type { DailyAgendaGroup, MonthDayCell } from '../../../src/calendar-float/types';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function testBuildSelectedDayDetailFindsMatchingCellAndAgenda(): void {
  const cells = [
    { key: '1000-01-01', year: 1000, month: 1, day: 1, inMonth: true, isToday: false, events: [], chips: [] },
    { key: '1000-01-02', year: 1000, month: 1, day: 2, inMonth: true, isToday: true, events: [], chips: [] },
  ] as MonthDayCell[];
  const agendaGroups = [
    { dateKey: '1000-01-02', label: '1月2日', items: [] },
  ] as DailyAgendaGroup[];

  const detail = buildSelectedDayDetail({ dateKey: '1000-01-02', cells, agendaGroups });

  assert(detail.dateKey === '1000-01-02', '应该保留 dateKey');
  assert(detail.monthCell === cells[1], '应该找到匹配 cell');
  assert(detail.agenda === agendaGroups[0], '应该找到匹配 agenda group');
}

function testFallbackDateLabelFormatsDateKeyAndKeepsUnknownText(): void {
  assert(fallbackDateLabel('1000-01-02') === '1月2日 周四', '应该沿用 formatDateLabel 格式化 YYYY-MM-DD date key');
  assert(fallbackDateLabel('bad-date') === 'bad-date', '无法解析时应该返回原文本');
}

function main(): void {
  testBuildSelectedDayDetailFindsMatchingCellAndAgenda();
  testFallbackDateLabelFormatsDateKeyAndKeepsUnknownText();
  console.log('widget/day-detail.check.ts OK');
}

main();
