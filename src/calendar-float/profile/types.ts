export type CalendarProfileId = 'generic' | 'fate-poem';

export type CalendarAddonId = 'dlc_ellia';

export interface CalendarProfilePaths {
  eventRoot: string;
  tempEvents: string;
  repeatEvents: string;
  worldTime: string;
  worldLocation: string;
}

export interface CalendarProfileDateSettings {
  eraNames: string[];
}

export interface CalendarProfileWorldbookSettings {
  variableDisplayTitle: string;
  updateRuleTimeExamples: string[];
  forbiddenRepeatTimeExamples: string[];
}

export interface CalendarProfileDetectionRule {
  characterNames: string[];
  worldbookKeywords: string[];
}

export interface CalendarProfile {
  id: CalendarProfileId;
  label: string;
  paths: CalendarProfilePaths;
  date: CalendarProfileDateSettings;
  worldbook: CalendarProfileWorldbookSettings;
  addons: CalendarAddonId[];
  detection: CalendarProfileDetectionRule;
}

export interface CalendarProfileDetectionResult {
  candidate: CalendarProfile;
  reason: 'character_name' | 'worldbook_name' | 'default';
  matchedText: string;
}
