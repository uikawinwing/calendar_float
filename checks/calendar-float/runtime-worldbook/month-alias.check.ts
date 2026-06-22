import { formatCalendarMonthTitle, normalizeCalendarMonthAliasList } from '../../../src/calendar-float/runtime-worldbook/month-alias';

function assertJsonEqual(name: string, actual: unknown, expected: unknown): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${name}: expected ${expectedJson}, got ${actualJson}`);
  }
}

assertJsonEqual(
  'normalizes Chinese and English month alias fields',
  normalizeCalendarMonthAliasList([
    { 月份: '1', 名称: '初春', 季节: '春' },
    { month: 2, label: '仲春', season: '春' },
  ]),
  [
    { month: 1, label: '初春', season: '春' },
    { month: 2, label: '仲春', season: '春' },
  ],
);

assertJsonEqual(
  'drops invalid month alias records',
  normalizeCalendarMonthAliasList([
    { 月份: 0, 名称: '坏' },
    { 月份: 13, 名称: '坏' },
    { 月份: 3, 名称: '  ' },
    null,
    'bad',
    { 月份: 4, 名称: '暮春' },
  ]),
  [{ month: 4, label: '暮春' }],
);

assertJsonEqual('formats month title with alias', formatCalendarMonthTitle(2040, 5, '花月'), '2040年·5月（花月）');
assertJsonEqual('formats month title with era label', formatCalendarMonthTitle(2040, 5, '花月', '星历'), '星历2040年·5月（花月）');
assertJsonEqual('formats month title without alias', formatCalendarMonthTitle(2040, 5), '2040年·5月');
assertJsonEqual('formats unknown month title', formatCalendarMonthTitle(2040, Number.NaN), '2040年·月份未知');

console.log('runtime-worldbook/month-alias.check.ts OK');
