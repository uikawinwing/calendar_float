import { applyCalendarProfileConfig } from '../../../src/calendar-float/profile';
import { 解析当前日期 } from '../../../src/calendar-float/runtime-trigger-evaluator/date-window';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function testCurrentDatePathUsesActiveProfileDateParser(): void {
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

  const parsed = 解析当前日期(
    {
      当前日期: null,
      最近消息文本: [],
      最近用户消息文本: [],
      变量表: {
        worldTime: '星历二年五月二十三日-星期三-09:00',
      },
    },
    'worldTime',
  );

  assert(parsed !== null, '日期窗口应该解析 profile 纪元中文日期');
  assert(parsed.year === 2, '日期窗口应该从 profile 纪元中文年份解析 year');
  assert(parsed.month === 5, '日期窗口应该从 profile 纪元中文月份解析 month');
  assert(parsed.day === 23, '日期窗口应该从 profile 纪元中文日期解析 day');
}

function main(): void {
  testCurrentDatePathUsesActiveProfileDateParser();
  console.log('runtime-trigger-evaluator/date-window-profile.check.ts OK');
}

main();
