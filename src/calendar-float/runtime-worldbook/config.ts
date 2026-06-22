import { GENERIC_CALENDAR_PROFILE, getProfileWorldLocationPath, getProfileWorldTimePath } from '../profile';
import { readCalendarRuntimePathSettings } from '../storage/runtime-path-settings';
import type { CalendarRuntimeDefaults } from './types';

export const DEFAULT_MVU_TIME_PATH = GENERIC_CALENDAR_PROFILE.paths.worldTime;
export const DEFAULT_MVU_LOCATION_PATH = GENERIC_CALENDAR_PROFILE.paths.worldLocation;

let currentRuntimeDefaults: Required<Pick<CalendarRuntimeDefaults, 'mvu时间路径' | 'mvu地点路径'>> &
  Pick<CalendarRuntimeDefaults, '书籍全文默认关键词模板'> = {
  mvu时间路径: DEFAULT_MVU_TIME_PATH,
  mvu地点路径: DEFAULT_MVU_LOCATION_PATH,
};

export function applyCalendarRuntimeDefaults(defaults?: CalendarRuntimeDefaults | null): void {
  const pathSettings = readCalendarRuntimePathSettings();
  const profileWorldTimePath = getProfileWorldTimePath();
  const profileWorldLocationPath = getProfileWorldLocationPath();
  const profileOverridesDefaultTimePath = profileWorldTimePath && profileWorldTimePath !== DEFAULT_MVU_TIME_PATH;
  const profileOverridesDefaultLocationPath =
    profileWorldLocationPath && profileWorldLocationPath !== DEFAULT_MVU_LOCATION_PATH;
  currentRuntimeDefaults = {
    mvu时间路径:
      pathSettings.mvuTimePath ||
      (profileOverridesDefaultTimePath ? profileWorldTimePath : '') ||
      defaults?.mvu时间路径 ||
      DEFAULT_MVU_TIME_PATH,
    mvu地点路径:
      pathSettings.mvuLocationPath ||
      (profileOverridesDefaultLocationPath ? profileWorldLocationPath : '') ||
      defaults?.mvu地点路径 ||
      DEFAULT_MVU_LOCATION_PATH,
    ...(defaults?.书籍全文默认关键词模板 ? { 书籍全文默认关键词模板: defaults.书籍全文默认关键词模板 } : {}),
  };
}

export function getCalendarRuntimeDefaults(): CalendarRuntimeDefaults {
  return { ...currentRuntimeDefaults };
}

export function getCalendarWorldTimePath(): string {
  return readCalendarRuntimePathSettings().mvuTimePath || currentRuntimeDefaults.mvu时间路径;
}

export function getCalendarWorldLocationPath(): string {
  return readCalendarRuntimePathSettings().mvuLocationPath || currentRuntimeDefaults.mvu地点路径;
}
