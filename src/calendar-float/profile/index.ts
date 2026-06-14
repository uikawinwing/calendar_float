import { SCRIPT_NAME } from '../constants';
import { CALENDAR_PROFILES, FATE_POEM_CALENDAR_PROFILE, GENERIC_CALENDAR_PROFILE } from './profiles';
import type { CalendarAddonId, CalendarProfile, CalendarProfileDetectionResult } from './types';

let activeProfile: CalendarProfile = GENERIC_CALENDAR_PROFILE;
let lastDetection: CalendarProfileDetectionResult = {
  candidate: GENERIC_CALENDAR_PROFILE,
  reason: 'default',
  matchedText: '',
};

function normalizeMatchText(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function includesAnyKeyword(value: unknown, keywords: string[]): string {
  const text = normalizeMatchText(value);
  if (!text) {
    return '';
  }
  return keywords.find(keyword => text.includes(normalizeMatchText(keyword))) ?? '';
}

function resolveDetectedProfile(): CalendarProfileDetectionResult {
  return {
    candidate: GENERIC_CALENDAR_PROFILE,
    reason: 'default',
    matchedText: '',
  };
}

function resolveProfileFromHint(value: unknown): CalendarProfile | null {
  const text = normalizeMatchText(value);
  if (!text) {
    return null;
  }
  return (
    CALENDAR_PROFILES.find(profile => {
      if (text === normalizeMatchText(profile.id) || text === normalizeMatchText(profile.label)) {
        return true;
      }
      return Boolean(includesAnyKeyword(text, [...profile.detection.characterNames, ...profile.detection.worldbookKeywords]));
    }) ?? null
  );
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
  const candidate = resolveProfileFromHint(value);
  if (!candidate) {
    return activeProfile;
  }
  const matchedText = String(value || '').trim();
  const changed = candidate.id !== activeProfile.id || lastDetection.matchedText !== matchedText;
  activeProfile = candidate;
  lastDetection = {
    candidate,
    reason: 'runtime_index_profile',
    matchedText,
  };
  if (changed && typeof toastr !== 'undefined') {
    toastr.info(`月历 Profile 已载入：${activeProfile.label}\n来源：固定事件索引 Profile`);
  }
  if (changed) {
    console.info(`[${SCRIPT_NAME}] 月历 profile 已由 runtime index 指定: ${activeProfile.id}`, { matchedText });
  }
  return activeProfile;
}

export function getActiveCalendarProfile(): CalendarProfile {
  return activeProfile;
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
export type { CalendarAddonId, CalendarProfile, CalendarProfileId } from './types';
