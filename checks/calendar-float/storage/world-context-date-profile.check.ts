import _ from 'lodash';

import { applyCalendarProfileConfig, initializeCalendarProfile } from '../../../src/calendar-float/profile';
import { readCurrentWorldTime } from '../../../src/calendar-float/storage/world-context';

function assertJsonEqual(name: string, actual: unknown, expected: unknown): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${name}: expected ${expectedJson}, got ${actualJson}`);
  }
}

async function main(): Promise<void> {
  await initializeCalendarProfile();
  applyCalendarProfileConfig({
    profileHint: 'generic',
    config: {
      id: 'custom-era',
      paths: {
        worldTime: 'stat_data.世界.时辰',
      },
      date: {
        eraName: '星历',
        eraNames: ['星历', '王庭历'],
        useChineseNumeralYear: true,
      },
    },
  });

  const variables: Record<string, unknown> = {};
  _.set(variables, 'stat_data.世界.时辰', '星历二年五月二十三日-星期三-09:00');

  (globalThis as unknown as { getLastMessageId: typeof getLastMessageId }).getLastMessageId = () => 1;
  (globalThis as unknown as { getVariables: typeof getVariables }).getVariables = () => variables;

  const result = readCurrentWorldTime('stat_data.世界.时辰');
  assertJsonEqual('world time parser uses active profile date settings', result.point, {
    year: 2,
    month: 5,
    day: 23,
  });
  assertJsonEqual('world time parser keeps weekday anchor', result.anchor, {
    dateKey: '2-05-23',
    weekday: 3,
  });
}

main()
  .then(() => {
    console.log('storage/world-context-date-profile.check.ts OK');
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
