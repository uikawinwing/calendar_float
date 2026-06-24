export type CalendarProfileId = string;

export type CalendarAddonId = 'dlc_ellia';

export interface CalendarProfilePaths {
  eventRoot: string;
  tempEvents: string;
  repeatEvents: string;
  worldTime: string;
  worldLocation: string;
}

export interface CalendarProfileDateSettings {
  eraName?: string;
  eraNames: string[];
  useChineseNumeralYear?: boolean;
}

export interface CalendarProfileWorldbookSettings {
  variableDisplayTitle: string;
  updateRuleTimeExamples: string[];
  forbiddenRepeatTimeExamples: string[];
}

export interface CalendarProfileVisualSettings {
  festivalMarkerPresetId?: string;
}

export interface CalendarProfileDetectionRule {
  characterNames: string[];
  worldbookKeywords: string[];
}

export interface CalendarProfile {
  id: CalendarProfileId;
  label: string;
  developerMode: boolean;
  paths: CalendarProfilePaths;
  date: CalendarProfileDateSettings;
  worldbook: CalendarProfileWorldbookSettings;
  visual?: CalendarProfileVisualSettings;
  addons: CalendarAddonId[];
  detection: CalendarProfileDetectionRule;
}

export interface CalendarProfileConfigInput {
  id?: unknown;
  label?: unknown;
  developerMode?: unknown;
  paths?: Partial<Record<keyof CalendarProfilePaths, unknown>>;
  date?: Partial<Record<keyof CalendarProfileDateSettings, unknown>>;
  worldbook?: Partial<Record<keyof CalendarProfileWorldbookSettings, unknown>>;
  visual?: Partial<Record<keyof CalendarProfileVisualSettings, unknown>>;
  addons?: unknown;
}

export interface CalendarProfileResolveResult {
  profile: CalendarProfile;
  source: 'default' | 'builtin' | 'runtime_index';
  warnings: string[];
}

export interface CalendarProfileDetectionResult {
  candidate: CalendarProfile;
  reason: 'runtime_index_profile' | 'default';
  matchedText: string;
}
