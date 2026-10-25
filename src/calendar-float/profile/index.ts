import type { ParseWorldDateAnchorOptions } from '../date';
import { FATE_POEM_CALENDAR_PROFILE } from './profiles';
import { resolveCalendarProfileConfig } from './normalize';
import type {
  CalendarAddonId,
  CalendarProfile,
  CalendarProfileConfigInput,
  CalendarProfileResolveResult,
} from './types';

let activeProfile: CalendarProfile = resolveCalendarProfileConfig({}).profile;

export async function initializeCalendarProfile(): Promise<CalendarProfile> {
  activeProfile = resolveCalendarProfileConfig({}).profile;
  return activeProfile;
}

export function applyCalendarProfileConfig(args: {
  profileHint?: unknown;
  config?: CalendarProfileConfigInput | null;
}): CalendarProfileResolveResult {
  const result = resolveCalendarProfileConfig(args);
  activeProfile = result.profile;
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
