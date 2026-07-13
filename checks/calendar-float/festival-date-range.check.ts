import { buildFestivalDateRange } from '../../src/calendar-float/runtime-dataset/festivals';
import { 构建日期窗口, 解析节庆日期范围 } from '../../src/calendar-float/runtime-trigger-evaluator/date-window';
import { buildCalendarFestivalWindow } from '../../src/calendar-float/runtime-trigger-evaluator/reminders';
import { resolveFestivalDateRange } from '../../src/calendar-float/festival-date-range';
import type { CalendarRuntimeFestivalEntry } from '../../src/calendar-float/runtime-worldbook/types';
import type { DatePoint } from '../../src/calendar-float/types';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function createFestival(start: string, end = start): CalendarRuntimeFestivalEntry {
  return {
    id: 'festival-date-range',
    名称: '日期范围测试节庆',
    开始: start,
    结束: end,
  };
}

function assertPoint(point: DatePoint, expected: DatePoint, message: string): void {
  assert(
    point.year === expected.year && point.month === expected.month && point.day === expected.day,
    `${message}: expected ${expected.year}-${expected.month}-${expected.day}, got ${point.year}-${point.month}-${point.day}`,
  );
}

function assertRange(
  actual: { start: DatePoint; end: DatePoint },
  expected: { start: DatePoint; end: DatePoint },
  message: string,
): void {
  assertPoint(actual.start, expected.start, `${message} start`);
  assertPoint(actual.end, expected.end, `${message} end`);
}

function testAlternateMonthDayFormatsShareTheSameOccurrenceYear(): void {
  const now = { year: 1000, month: 12, day: 1 };
  for (const start of ['05-14', '05/14', '5月14日']) {
    const festival = createFestival(start);
    const dataset = buildFestivalDateRange(festival, now);
    const evaluator = 解析节庆日期范围(festival, now);
    const reminder = buildCalendarFestivalWindow(festival, now);
    const dateWindow = 构建日期窗口({ 开始: start, 结束: start }, { 当前日期: now });

    assert(dataset !== null, `${start}: dataset 应该解析节庆日期`);
    assert(evaluator !== null, `${start}: evaluator 应该解析节庆日期`);
    assert(reminder !== null, `${start}: reminder 应该解析节庆日期`);
    assert(dateWindow !== null, `${start}: date-window 应该解析节庆日期`);
    const shared = resolveFestivalDateRange({ start, end: start, now });
    assert(shared !== null, `${start}: shared resolver 应该解析节庆日期`);
    assert(dataset.startText === '05-14' && dataset.endText === '05-14', `${start}: dataset 应该规范化月日文本`);
    assertPoint(dataset.range.start, { year: 1001, month: 5, day: 14 }, `${start}: dataset occurrence`);
    assert(dataset.startText === shared.startText && dataset.endText === shared.endText, `${start}: dataset 文本必须映射 shared result`);
    assertRange(dataset.range, shared.range, `${start}: dataset range 必须映射 shared result`);
    assertPoint(evaluator.开始, shared.range.start, `${start}: evaluator start 必须映射 shared result`);
    assertPoint(evaluator.结束, shared.range.end, `${start}: evaluator end 必须映射 shared result`);
    assertPoint(dateWindow.开始, shared.range.start, `${start}: date-window start 必须映射 shared result`);
    assertPoint(dateWindow.结束, shared.range.end, `${start}: date-window end 必须映射 shared result`);
    assertPoint(reminder.开始, dataset.range.start, `${start}: evaluator 必须和 dataset 使用同一 occurrence`);
    assertPoint(reminder.结束, dataset.range.end, `${start}: evaluator 结束日期必须和 dataset 一致`);
  }
}

function testCrossYearRecurrenceAndBoundaryCompatibility(): void {
  const crossYear = resolveFestivalDateRange({
    start: '12-30',
    end: '01-03',
    now: { year: 1001, month: 1, day: 1 },
  });
  assert(crossYear !== null, '跨年节庆应该解析');
  assertRange(crossYear.range, {
    start: { year: 1000, month: 12, day: 30 },
    end: { year: 1001, month: 1, day: 3 },
  }, '跨年 range');
  assert(crossYear.state === 'active', '跨年节庆中间日期应该 active');

  const afterCrossYear = resolveFestivalDateRange({
    start: '12-30',
    end: '01-03',
    now: { year: 1001, month: 1, day: 4 },
  });
  assert(afterCrossYear?.state === 'outside', '跨年节庆结束次日应该 outside');

  const recurrenceHit = resolveFestivalDateRange({
    start: '05-14',
    end: '05-14',
    recurrence: { intervalYears: 2, lastYear: 1000 },
    now: { year: 1002, month: 5, day: 1 },
  });
  assert(recurrenceHit?.range.start.year === 1002, 'recurrence 命中年应该保持 anchor year');

  const recurrenceTie = resolveFestivalDateRange({
    start: '05-14',
    end: '05-14',
    recurrence: { intervalYears: 2, lastYear: 1000 },
    now: { year: 1001, month: 5, day: 1 },
  });
  assert(recurrenceTie?.range.start.year === 1000, 'recurrence 等距时应该保持 previous year');

  for (const recurrence of [
    { intervalYears: 1, lastYear: 1000 },
    { intervalYears: Number.NaN, lastYear: 1000 },
    { intervalYears: 2, lastYear: Number.NaN },
  ]) {
    const annualFallback = resolveFestivalDateRange({
      start: '05-14',
      end: '05-14',
      recurrence,
      now: { year: 1001, month: 5, day: 1 },
    });
    assert(annualFallback?.range.start.year === 1001, '无效 recurrence 应该保持 annual 兼容行为');
  }

  const sixMonthBoundary = resolveFestivalDateRange({
    start: '06-14',
    end: '06-14',
    now: { year: 1000, month: 12, day: 1 },
  });
  assert(sixMonthBoundary?.range.start.year === 1000, '相差六个月时应该保持当前年份');
}

function testReminderWindowBoundariesAndNormalization(): void {
  const before = resolveFestivalDateRange({
    start: '05-14',
    end: '05-14',
    now: { year: 1000, month: 5, day: 12 },
    prepareDays: 2,
  });
  assert(before?.state === 'before', '提醒窗口起点应该是 before');
  assertPoint(before.reminderRange.start, { year: 1000, month: 5, day: 12 }, '提醒窗口起点');

  const tooEarly = resolveFestivalDateRange({
    start: '05-14',
    end: '05-14',
    now: { year: 1000, month: 5, day: 11 },
    prepareDays: 2,
  });
  assert(tooEarly?.state === 'outside', '提醒窗口前一天应该 outside');

  const active = resolveFestivalDateRange({
    start: '05-14',
    end: '05-14',
    now: { year: 1000, month: 5, day: 14 },
    prepareDays: 2,
  });
  assert(active?.state === 'active', '节庆开始当天应该 active');

  const acrossYear = resolveFestivalDateRange({
    start: '01-02',
    end: '01-02',
    now: { year: 999, month: 12, day: 31 },
    prepareDays: 3,
  });
  assert(acrossYear?.state === 'before', '跨年提醒窗口应该是 before');
  assertPoint(acrossYear.reminderRange.start, { year: 999, month: 12, day: 30 }, '跨年提醒窗口起点');

  for (const prepareDays of [undefined, 0, -1, Number.NaN]) {
    const resolved = resolveFestivalDateRange({
      start: '05-14',
      end: '05-14',
      now: { year: 1000, month: 5, day: 13 },
      prepareDays,
    });
    assert(resolved?.state === 'outside', `prepare=${String(prepareDays)} 应该等价于零天提醒`);
  }
  const fractional = resolveFestivalDateRange({
    start: '05-14',
    end: '05-14',
    now: { year: 1000, month: 5, day: 12 },
    prepareDays: 2.9,
  });
  assert(fractional?.state === 'before', '小数提前天数应该向下取整');

  const reminder = buildCalendarFestivalWindow(createFestival('05/14'), { year: 1000, month: 5, day: 12 }, 2);
  assert(reminder?.是否进行中 === false && reminder?.是否在提醒窗口 === true, 'reminder facade 应该映射 shared before state');
}

function testParseFailureAndLooseMonthDayCompatibility(): void {
  for (const start of ['', '  ', '2026-05-14', 'not-a-date']) {
    assert(
      resolveFestivalDateRange({ start, end: start, now: { year: 1000, month: 5, day: 1 } }) === null,
      `${JSON.stringify(start)} 应该解析失败`,
    );
  }

  const loose = resolveFestivalDateRange({
    start: '13-40',
    end: '13-40',
    now: { year: 1000, month: 5, day: 1 },
  });
  assert(loose !== null, '现有宽松 month-day parser 行为必须保持');

  const fallback = resolveFestivalDateRange({
    start: ' 5月14日 ',
    end: '',
    now: { year: 1000, month: 5, day: 14 },
  });
  assert(fallback?.startText === '05-14' && fallback.endText === '05-14', '空结束日期应该回退并规范化开始日期');
  assert(fallback.state === 'active', '同日节庆当天应该 active');
}

function main(): void {
  testAlternateMonthDayFormatsShareTheSameOccurrenceYear();
  testCrossYearRecurrenceAndBoundaryCompatibility();
  testReminderWindowBoundariesAndNormalization();
  testParseFailureAndLooseMonthDayCompatibility();
  console.log('festival-date-range.check.ts OK');
}

main();
