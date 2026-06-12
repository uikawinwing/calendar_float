import _ from 'lodash';

import { CHAT_RUNTIME_PATH_SETTINGS_PATH } from '../constants';

export interface CalendarRuntimePathSettings {
  mvuTimePath?: string;
  mvuLocationPath?: string;
}

function sanitizeCalendarRuntimePathSettings(value: unknown): CalendarRuntimePathSettings {
  const source = _.isPlainObject(value) ? (value as Record<string, unknown>) : {};
  const mvuTimePath = String(source.mvuTimePath ?? '').trim();
  const mvuLocationPath = String(source.mvuLocationPath ?? '').trim();
  return {
    ...(mvuTimePath ? { mvuTimePath } : {}),
    ...(mvuLocationPath ? { mvuLocationPath } : {}),
  };
}

export function readCalendarRuntimePathSettings(): CalendarRuntimePathSettings {
  try {
    if (typeof getVariables !== 'function') {
      return {};
    }
    return sanitizeCalendarRuntimePathSettings(_.get(getVariables({ type: 'chat' }), CHAT_RUNTIME_PATH_SETTINGS_PATH));
  } catch (error) {
    console.warn('[月历悬浮球] 读取 MVU 路径设置失败', error);
    return {};
  }
}

export function replaceCalendarRuntimePathSettings(nextSettings: CalendarRuntimePathSettings): CalendarRuntimePathSettings {
  const sanitized = sanitizeCalendarRuntimePathSettings(nextSettings);
  const variables = getVariables({ type: 'chat' });
  if (Object.keys(sanitized).length) {
    _.set(variables, CHAT_RUNTIME_PATH_SETTINGS_PATH, sanitized);
  } else {
    _.unset(variables, CHAT_RUNTIME_PATH_SETTINGS_PATH);
  }
  replaceVariables(variables, { type: 'chat' });
  return sanitized;
}

export function clearCalendarRuntimePathSettings(): void {
  replaceCalendarRuntimePathSettings({});
}
