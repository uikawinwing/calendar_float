import { SCRIPT_NAME } from '../constants';
import type { ParseWorldDateAnchorOptions } from '../date';
import { resolveCalendarProfileConfig } from './normalize';
import { FATE_POEM_CALENDAR_PROFILE } from './profiles';
import type {
  CalendarAddonId,
  CalendarProfile,
  CalendarProfileConfigInput,
  CalendarProfileResolveResult,
} from './types';

// calendar_float is the Fate Poem calendar. Index settings may customize paths,
// dates and developer tools, but must never switch to another world's profile.
let activeProfile: CalendarProfile = FATE_POEM_CALENDAR_PROFILE;

export async function initializeCalendarProfile(): Promise<CalendarProfile> {
  activeProfile = resolveCalendarProfileConfig({}).profile;
  console.info(`[${SCRIPT_NAME}] 已载入命定之诗月历配置`);
  return activeProfile;
}

export function applyCalendarProfileConfig(args: {
  profileHint?: unknown;
  config?: CalendarProfileConfigInput | null;
}): CalendarProfileResolveResult {
  const result = resolveCalendarProfileConfig(args);
  activeProfile = result.profile;
  if (result.warnings.length) {
    console.warn(`[${SCRIPT_NAME}] 固定事件索引配置警告`, result.warnings);
  }
  return result;
}

export function getActiveCalendarProfile(): CalendarProfile {
  return activeProfile;
}

export function getActiveCalendarDateParseOptions(): ParseWorldDateAnchorOptions {
  return {
    eraName: activeProfile.date.eraName,
    eraNames: activeProfile.date.eraNames,
    useChineseNumeralYear: activeProfile.date.useChineseNumeralYear,
  };
}

export function isCalendarAddonEnabled(addonId: CalendarAddonId): boolean {
  return activeProfile.addons.includes(addonId);
}

export function getCalendarEventRootPath(): string {
  return activeProfile.paths.eventRoot;
}

export function getCalendarTempEventsPath(): string {
  return activeProfile.paths.tempEvents;
}

export function getCalendarRepeatEventsPath(): string {
  return activeProfile.paths.repeatEvents;
}

export function getProfileWorldTimePath(): string {
  return activeProfile.paths.worldTime;
}

export function getProfileWorldLocationPath(): string {
  return activeProfile.paths.worldLocation;
}

export { FATE_POEM_CALENDAR_PROFILE };
export type {
  CalendarAddonId,
  CalendarProfile,
  CalendarProfileConfigInput,
  CalendarProfileId,
  CalendarProfileResolveResult,
} from './types';
