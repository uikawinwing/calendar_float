export type CalendarProfileId = 'fate-poem';

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
  tagPresets: CalendarMarkerRule[];
  locationPresets: CalendarMarkerRule[];
  markerPresets: CalendarMarkerRule[];
  fallbackMarkers: CalendarMarkerAppearance[];
}

export interface CalendarMarkerAppearance {
  icon: string;
  color: { background: string; text: string; border?: string };
}

export interface CalendarMarkerRule extends CalendarMarkerAppearance {
  keywords: string[];
}

export interface CalendarProfile {
  id: CalendarProfileId;
  label: string;
  developerMode: boolean;
  paths: CalendarProfilePaths;
  date: CalendarProfileDateSettings;
  worldbook: CalendarProfileWorldbookSettings;
  visual: CalendarProfileVisualSettings;
  addons: CalendarAddonId[];
}

export interface CalendarProfileConfigInput {
  id?: unknown;
  label?: unknown;
  developerMode?: unknown;
  paths?: Partial<Record<keyof CalendarProfilePaths, unknown>>;
  date?: Partial<Record<keyof CalendarProfileDateSettings, unknown>>;
  worldbook?: Partial<Record<keyof CalendarProfileWorldbookSettings, unknown>>;
  visual?: Partial<Record<keyof CalendarProfileVisualSettings | 'festivalMarkerPresetId', unknown>>;
  addons?: unknown;
}

export interface CalendarProfileResolveResult {
  profile: CalendarProfile;
  source: 'default' | 'builtin' | 'runtime_index';
  warnings: string[];
  compatible: boolean;
}
