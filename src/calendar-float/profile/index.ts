import { SCRIPT_NAME } from '../constants';
import type { ParseWorldDateAnchorOptions } from '../date';
import { FATE_POEM_CALENDAR_PROFILE, GENERIC_CALENDAR_PROFILE } from './profiles';
import { resolveCalendarProfileConfig } from './normalize';
import type {
  CalendarAddonId,
  CalendarProfile,
  CalendarProfileConfigInput,
  CalendarProfileDetectionResult,
  CalendarProfileResolveResult,
} from './types';

let activeProfile: CalendarProfile = GENERIC_CALENDAR_PROFILE;
let lastDetection: CalendarProfileDetectionResult = {
  candidate: GENERIC_CALENDAR_PROFILE,
  reason: 'default',
  matchedText: '',
};

function resolveDetectedProfile(): CalendarProfileDetectionResult {
  return {
    candidate: GENERIC_CALENDAR_PROFILE,
    reason: 'default',
    matchedText: '',
  };
}

export async function initializeCalendarProfile(): Promise<CalendarProfile> {
  const detection = resolveDetectedProfile();
  lastDetection = detection;
  activeProfile = detection.candidate;

  console.info(`[${SCRIPT_NAME}] 月历 profile 已载入: ${activeProfile.id}`, {
    reason: detection.reason,
    matchedText: detection.matchedText,
  });
  return activeProfile;
}

export function applyCalendarProfileHint(value: unknown): CalendarProfile {
  const result = resolveCalendarProfileConfig({ profileHint: value });
  if (result.source === 'default') {
    return activeProfile;
  }
  const candidate = result.profile;
  const matchedText = String(value || '').trim();
  const changed = candidate.id !== activeProfile.id || lastDetection.matchedText !== matchedText;
  activeProfile = candidate;
  lastDetection = {
    candidate,
    reason: 'runtime_index_profile',
    matchedText,
  };
  if (changed && typeof toastr !== 'undefined') {
    toastr.info(`月历 Profile：${activeProfile.label}`);
  }
  if (changed) {
    console.info(`[${SCRIPT_NAME}] 月历 profile 已由 runtime index 指定: ${activeProfile.id}`, { matchedText });
  }
  return activeProfile;
}

export function applyCalendarProfileConfig(args: {
  profileHint?: unknown;
  config?: CalendarProfileConfigInput | null;
}): CalendarProfileResolveResult {
  const result = resolveCalendarProfileConfig(args);
  const matchedText = String(args.profileHint || result.profile.id || '').trim();
  const changed = result.profile.id !== activeProfile.id || lastDetection.matchedText !== matchedText;
  activeProfile = result.profile;
  lastDetection = {
    candidate: result.profile,
    reason: result.source === 'default' ? 'default' : 'runtime_index_profile',
    matchedText,
  };
  if (changed && result.source !== 'default' && typeof toastr !== 'undefined') {
    toastr.info(`月历 Profile：${activeProfile.label}`);
  }
  if (changed) {
    console.info(`[${SCRIPT_NAME}] 月历 profile 已由 runtime index 配置: ${activeProfile.id}`, {
      matchedText,
      source: result.source,
      warnings: result.warnings,
    });
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

export function getCalendarProfileDetection(): CalendarProfileDetectionResult {
  return lastDetection;
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

export { FATE_POEM_CALENDAR_PROFILE, GENERIC_CALENDAR_PROFILE };
export type {
  CalendarAddonId,
  CalendarProfile,
  CalendarProfileConfigInput,
  CalendarProfileId,
  CalendarProfileResolveResult,
} from './types';
