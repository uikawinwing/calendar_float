import { formatWorldTimeForPoint, getWorldTimePrefix, parseDateKeyPoint } from '../../../src/calendar-float/widget/date-actions';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function testParseDateKeyPointKeepsCurrentWidgetBehavior(): void {
  assert(
    JSON.stringify(parseDateKeyPoint('488-01-02')) === JSON.stringify({ year: 488, month: 1, day: 2 }),
    '应该解析 yyyy-mm-dd',
  );
  assert(
    JSON.stringify(parseDateKeyPoint('488/1/2 14:05')) === JSON.stringify({ year: 488, month: 1, day: 2 }),
    '应该忽略可选时间',
  );
  assert(parseDateKeyPoint('复兴纪元488年-1月-2日') === null, '这个 helper 不应该偷偷解析世界时间文本');
}

function testWorldTimePrefixExtraction(): void {
  assert(getWorldTimePrefix('复兴纪元488年-1月-1日-星期一-14:05') === '复兴纪元', '应该保留纪元前缀');
  assert(getWorldTimePrefix('488年-1月-1日') === '', '没有纪元时前缀为空');
}

function testFormatWorldTimePreservesPrefixWeekdayAndClock(): void {
  const formatted = formatWorldTimeForPoint(
    { year: 488, month: 1, day: 2 },
    {
      nowText: '复兴纪元488年-1月-1日-星期一-14:05',
      anchor: { dateKey: '488-01-01', weekday: 1 },
    },
  );
  assert(formatted === '复兴纪元488年-1月-2日-星期二-14:05', '应该沿用纪元、锚点星期和时刻');
}

function testFormatWorldTimeKeepsNumericFallback(): void {
  const formatted = formatWorldTimeForPoint({ year: 488, month: 1, day: 2 }, { nowText: '488-01-01-14:05' });
  assert(formatted === '488-01-02-14:05', '无 年 字时应该保留数字格式');
}

function main(): void {
  testParseDateKeyPointKeepsCurrentWidgetBehavior();
  testWorldTimePrefixExtraction();
  testFormatWorldTimePreservesPrefixWeekdayAndClock();
  testFormatWorldTimeKeepsNumericFallback();
  console.log('widget/date-actions.check.ts OK');
}

main();
