import { GENERIC_CALENDAR_PROFILE, getProfileWorldLocationPath, getProfileWorldTimePath } from './profile';
import type { 日历运行时默认设置 } from './runtime-worldbook/types';

export const DEFAULT_MVU_TIME_PATH = GENERIC_CALENDAR_PROFILE.paths.worldTime;
export const DEFAULT_MVU_LOCATION_PATH = GENERIC_CALENDAR_PROFILE.paths.worldLocation;

let currentRuntimeDefaults: Required<Pick<日历运行时默认设置, 'mvu时间路径' | 'mvu地点路径'>> &
  Pick<日历运行时默认设置, '书籍全文默认关键词模板'> = {
  mvu时间路径: DEFAULT_MVU_TIME_PATH,
  mvu地点路径: DEFAULT_MVU_LOCATION_PATH,
};

export function applyCalendarRuntimeDefaults(defaults?: 日历运行时默认设置 | null): void {
  currentRuntimeDefaults = {
    mvu时间路径: defaults?.mvu时间路径 || getProfileWorldTimePath(),
    mvu地点路径: defaults?.mvu地点路径 || getProfileWorldLocationPath(),
    ...(defaults?.书籍全文默认关键词模板 ? { 书籍全文默认关键词模板: defaults.书籍全文默认关键词模板 } : {}),
  };
}

export function getCalendarRuntimeDefaults(): 日历运行时默认设置 {
  return { ...currentRuntimeDefaults };
}

export function getCalendarWorldTimePath(): string {
  return currentRuntimeDefaults.mvu时间路径;
}

export function getCalendarWorldLocationPath(): string {
  return currentRuntimeDefaults.mvu地点路径;
}
