import { formatCalendarMonthTitle } from '../../src/calendar-float/runtime-worldbook/month-alias';
import { parseWorldDateText } from '../../src/calendar-float/date';

function assertJsonEqual(name: string, actual: unknown, expected: unknown): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${name}: expected ${expectedJson}, got ${actualJson}`);
  }
}

assertJsonEqual('keeps numeric year-month-day parsing', parseWorldDateText('488年-6月5日'), {
  year: 488,
  month: 6,
  day: 5,
});

assertJsonEqual(
  'keeps month alias parsing',
  parseWorldDateText('488年苏醒月5日', { monthAliases: [{ month: 6, label: '苏醒' }] }),
  {
    year: 488,
    month: 6,
    day: 5,
  },
);

assertJsonEqual(
  'parses numeric era date',
  parseWorldDateText('复兴纪元488年6月5日', {
    eraName: '复兴纪元',
    eraNames: ['复兴纪元', '旧历'],
  }),
  {
    year: 488,
    month: 6,
    day: 5,
  },
);

assertJsonEqual(
  'parses Chinese numeral era date',
  parseWorldDateText('太初二年五月二十三日', {
    eraName: '太初',
    useChineseNumeralYear: true,
  }),
  {
    year: 2,
    month: 5,
    day: 23,
  },
);

assertJsonEqual(
  'parses positional Chinese numeral date without era prefix',
  parseWorldDateText('二零零六年五月二十三日', {
    eraName: '星历',
    useChineseNumeralYear: true,
  }),
  {
    year: 2006,
    month: 5,
    day: 23,
  },
);

assertJsonEqual(
  'does not parse Chinese numeral date unless enabled',
  parseWorldDateText('二零零六年五月二十三日', {
    eraName: '星历',
  }),
  null,
);

assertJsonEqual('formats month title with era label', formatCalendarMonthTitle(488, 6, '苏醒', '复兴纪元'), '复兴纪元488年·6月（苏醒）');

console.log('date-era.check.ts OK');
