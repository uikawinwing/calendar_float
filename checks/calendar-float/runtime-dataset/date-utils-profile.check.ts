import { applyCalendarProfileConfig } from '../../../src/calendar-float/profile';
import { parseRuntimeEventTextToPoint } from '../../../src/calendar-float/runtime-dataset/date-utils';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function testRuntimeEventDateUsesActiveProfileDateParser(): void {
  applyCalendarProfileConfig({
    profileHint: 'generic',
    config: {
      id: 'custom-era',
      label: 'Custom Era',
      date: {
        eraName: '星历',
        eraNames: ['星历', '王庭历'],
        useChineseNumeralYear: true,
      },
    },
  });

  const parsed = parseRuntimeEventTextToPoint('王庭历二年五月二十三日', { year: 2, month: 5, day: 1 });

  assert(parsed !== null, 'runtime event 应该解析 profile 纪元中文日期');
  assert(parsed.year === 2, 'runtime event 应该从 profile 纪元中文年份解析 year');
  assert(parsed.month === 5, 'runtime event 应该从 profile 纪元中文月份解析 month');
  assert(parsed.day === 23, 'runtime event 应该从 profile 纪元中文日期解析 day');
}

function main(): void {
  testRuntimeEventDateUsesActiveProfileDateParser();
  console.log('runtime-dataset/date-utils-profile.check.ts OK');
}

main();
