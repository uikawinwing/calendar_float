import { SCRIPT_NAME } from '../constants';
import { FATE_POEM_CALENDAR_PROFILE, GENERIC_CALENDAR_PROFILE } from './profiles';
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

function readCurrentCharacterNameSafe(): string {
  try {
    return String(getCurrentCharacterName?.() || '').trim();
  } catch (error) {
    console.warn(`[${SCRIPT_NAME}] 读取当前角色名失败，使用通用月历 profile`, error);
    return '';
  }
}

function readCurrentWorldbookNamesSafe(): string[] {
  try {
    const binding = getCharWorldbookNames('current');
    const chatWorldbookName = getChatWorldbookName('current');
    return [binding.primary, ...binding.additional, chatWorldbookName]
      .map(name => String(name || '').trim())
      .filter(Boolean);
  } catch (error) {
    console.warn(`[${SCRIPT_NAME}] 读取当前世界书绑定失败，跳过 profile 世界书识别`, error);
    return [];
  }
}

function resolveDetectedProfile(): CalendarProfileDetectionResult {
  const characterName = readCurrentCharacterNameSafe();
  const characterMatch = includesAnyKeyword(characterName, FATE_POEM_CALENDAR_PROFILE.detection.characterNames);
  if (characterMatch) {
    return {
      candidate: FATE_POEM_CALENDAR_PROFILE,
      reason: 'character_name',
      matchedText: characterName,
    };
  }

  const worldbookMatch = readCurrentWorldbookNamesSafe().find(name =>
    includesAnyKeyword(name, FATE_POEM_CALENDAR_PROFILE.detection.worldbookKeywords),
  );
  if (worldbookMatch) {
    return {
      candidate: FATE_POEM_CALENDAR_PROFILE,
      reason: 'worldbook_name',
      matchedText: worldbookMatch,
    };
  }

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

  toastr.info(`月历 Profile 已载入：${activeProfile.label}\n已在本次聊天初始化 / 脚本载入时生效。`);
  console.info(`[${SCRIPT_NAME}] 月历 profile 已载入: ${activeProfile.id}`, {
    reason: detection.reason,
    matchedText: detection.matchedText,
  });
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
