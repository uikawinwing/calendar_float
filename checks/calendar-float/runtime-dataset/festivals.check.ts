import { buildFestivalDateRange, buildRuntimeStageRecord, readRuntimeFestivalLocationKeywords } from '../../../src/calendar-float/runtime-dataset/festivals';
import type { CalendarRuntimeFestivalEntry, CalendarRuntimeFestivalStageEntry } from '../../../src/calendar-float/runtime-worldbook/types';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function createFestival(args: Partial<CalendarRuntimeFestivalEntry> = {}): CalendarRuntimeFestivalEntry {
  return {
    id: 'festival_1',
    名称: '跨年祭',
    开始: '12-31',
    结束: '01-02',
    启用: true,
    地点关键词: ['王都', '王都'],
    元数据: { 地点关键词: ['港口'] },
    ...args,
  };
}

function testBuildFestivalDateRangeHandlesCrossYearRange(): void {
  const range = buildFestivalDateRange(createFestival(), { year: 1000, month: 12, day: 20 });

  assert(range !== null, '跨年节庆应该生成日期范围');
  assert(range?.startText === '12-31', '应该保留 normalized start text');
  assert(range?.endText === '01-02', '应该保留 normalized end text');
  assert(range?.range.start.year === 1000 && range.range.end.year === 1001, '结束日期早于开始日期时应该跨到下一年');
}

function testReadRuntimeFestivalLocationKeywordsDedupesMetadataKeywords(): void {
  const keywords = readRuntimeFestivalLocationKeywords(createFestival());

  assert(keywords.join('|') === '王都|港口', '地点关键词应该合并并去重');
}

function testBuildRuntimeStageRecordUsesStageRangeAndFestivalRecurrence(): void {
  const festival = createFestival({ 周期: { 每隔年: 2, 上次年份: 1000 } });
  const stage: CalendarRuntimeFestivalStageEntry = {
    id: 'stage_1',
    名称: '前夜',
    开始: '12-30',
    结束: '12-31',
    启用: true,
  };
  const record = buildRuntimeStageRecord(festival, stage, { year: 1001, month: 6, day: 1 }, 0);

  assert(record?.phaseId === 'stage_1', 'stage record 应该保留 phase id');
  assert(record?.dayIndex === 1, 'stage record 应该使用 index + 1');
  assert(record?.range.start.year === 1000, 'stage 应该沿用节庆 recurrence 最近年份');
}

function main(): void {
  testBuildFestivalDateRangeHandlesCrossYearRange();
  testReadRuntimeFestivalLocationKeywordsDedupesMetadataKeywords();
  testBuildRuntimeStageRecordUsesStageRangeAndFestivalRecurrence();
  console.log('runtime-dataset/festivals.check.ts OK');
}

main();
