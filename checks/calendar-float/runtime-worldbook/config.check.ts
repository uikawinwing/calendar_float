import _ from 'lodash';

import { CHAT_RUNTIME_PATH_SETTINGS_PATH } from '../../../src/calendar-float/constants';
import {
  applyCalendarRuntimeDefaults,
  getCalendarRuntimeDefaults,
  getCalendarWorldLocationPath,
  getCalendarWorldTimePath,
} from '../../../src/calendar-float/runtime-worldbook/config';
import { applyCalendarProfileConfig, initializeCalendarProfile } from '../../../src/calendar-float/profile';

function setChatVariables(value: Record<string, unknown>): void {
  (globalThis as unknown as { getVariables: typeof getVariables }).getVariables = () => value;
}

function assertEqual(name: string, actual: unknown, expected: unknown): void {
  if (actual !== expected) {
    throw new Error(`${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

async function main(): Promise<void> {
await initializeCalendarProfile();

setChatVariables({});
applyCalendarRuntimeDefaults({
  mvu时间路径: 'stat_data.runtime.time',
  mvu地点路径: 'stat_data.runtime.location',
  书籍全文默认关键词模板: '[[打开《{{名称}}》]]',
});

assertEqual('uses runtime default time path without chat override', getCalendarWorldTimePath(), 'stat_data.runtime.time');
assertEqual(
  'uses runtime default location path without chat override',
  getCalendarWorldLocationPath(),
  'stat_data.runtime.location',
);
assertEqual(
  'preserves runtime book trigger template default',
  getCalendarRuntimeDefaults().书籍全文默认关键词模板,
  '[[打开《{{名称}}》]]',
);

applyCalendarProfileConfig({
  profileHint: 'generic',
  config: {
    id: 'profile-path-test',
    paths: {
      worldTime: 'stat_data.profile.time',
      worldLocation: 'stat_data.profile.location',
    },
  },
});
setChatVariables({});
applyCalendarRuntimeDefaults({
  mvu时间路径: 'stat_data.legacy.time',
  mvu地点路径: 'stat_data.legacy.location',
});

assertEqual('profile time path overrides legacy runtime default path', getCalendarWorldTimePath(), 'stat_data.profile.time');
assertEqual(
  'profile location path overrides legacy runtime default path',
  getCalendarWorldLocationPath(),
  'stat_data.profile.location',
);

const chatVariables: Record<string, unknown> = {};
_.set(chatVariables, CHAT_RUNTIME_PATH_SETTINGS_PATH, {
  mvuTimePath: 'stat_data.chat.time',
  mvuLocationPath: 'stat_data.chat.location',
});
setChatVariables(chatVariables);

applyCalendarRuntimeDefaults({
  mvu时间路径: 'stat_data.runtime.time',
  mvu地点路径: 'stat_data.runtime.location',
});

assertEqual('chat path setting overrides runtime default time path', getCalendarWorldTimePath(), 'stat_data.chat.time');
assertEqual(
  'chat path setting overrides runtime default location path',
  getCalendarWorldLocationPath(),
  'stat_data.chat.location',
);
assertEqual(
  'applied defaults also store chat override time path',
  getCalendarRuntimeDefaults().mvu时间路径,
  'stat_data.chat.time',
);

console.log('runtime-worldbook/config.check.ts OK');
}

void main();
