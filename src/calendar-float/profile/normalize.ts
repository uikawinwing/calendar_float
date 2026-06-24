import { CALENDAR_PROFILES, GENERIC_CALENDAR_PROFILE } from './profiles';
import type {
  CalendarAddonId,
  CalendarProfile,
  CalendarProfileConfigInput,
  CalendarProfileDateSettings,
  CalendarProfilePaths,
  CalendarProfileResolveResult,
  CalendarProfileVisualSettings,
  CalendarProfileWorldbookSettings,
} from './types';

const KNOWN_ADDONS: CalendarAddonId[] = ['dlc_ellia'];
const PATH_KEYS: Array<keyof CalendarProfilePaths> = [
  'eventRoot',
  'tempEvents',
  'repeatEvents',
  'worldTime',
  'worldLocation',
];
const DATE_KEYS: Array<keyof CalendarProfileDateSettings> = ['eraName', 'eraNames', 'useChineseNumeralYear'];
const WORLDBOOK_KEYS: Array<keyof CalendarProfileWorldbookSettings> = [
  'variableDisplayTitle',
  'updateRuleTimeExamples',
  'forbiddenRepeatTimeExamples',
];
const VISUAL_KEYS: Array<keyof CalendarProfileVisualSettings> = ['festivalMarkerPresetId'];

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeMatchText(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function cloneProfile(profile: CalendarProfile): CalendarProfile {
  return {
    ...profile,
    developerMode: profile.developerMode,
    paths: { ...profile.paths },
    date: { ...profile.date, eraNames: [...profile.date.eraNames] },
    worldbook: {
      ...profile.worldbook,
      updateRuleTimeExamples: [...profile.worldbook.updateRuleTimeExamples],
      forbiddenRepeatTimeExamples: [...profile.worldbook.forbiddenRepeatTimeExamples],
    },
    visual: { ...(profile.visual ?? {}) },
    addons: [...profile.addons],
    detection: {
      characterNames: [...profile.detection.characterNames],
      worldbookKeywords: [...profile.detection.worldbookKeywords],
    },
  };
}

function findBuiltinProfile(value: unknown): CalendarProfile | null {
  const text = normalizeMatchText(value);
  if (!text) {
    return null;
  }
  return (
    CALENDAR_PROFILES.find(profile => {
      if (text === normalizeMatchText(profile.id) || text === normalizeMatchText(profile.label)) {
        return true;
      }
      return [...profile.detection.characterNames, ...profile.detection.worldbookKeywords].some(keyword =>
        text.includes(normalizeMatchText(keyword)),
      );
    }) ?? null
  );
}

function warnUnknownKeys(
  warnings: string[],
  area: string,
  value: Record<string, unknown>,
  knownKeys: readonly string[],
): void {
  Object.keys(value).forEach(key => {
    if (!knownKeys.includes(key)) {
      warnings.push(`Profile ${area} 包含未知字段：${key}`);
    }
  });
}

function normalizeStringArray(value: unknown, warnings: string[], fieldName: string): string[] | null {
  if (!Array.isArray(value)) {
    warnings.push(`Profile ${fieldName} 必须是字符串数组`);
    return null;
  }
  const output: string[] = [];
  value.forEach(item => {
    const text = normalizeText(item);
    if (text) {
      output.push(text);
      return;
    }
    if (item !== undefined && item !== null && item !== '') {
      warnings.push(`Profile ${fieldName} 忽略非字符串值`);
    }
  });
  return output;
}

function applyPathOverrides(
  profile: CalendarProfile,
  paths: CalendarProfileConfigInput['paths'],
  warnings: string[],
): void {
  if (paths === undefined) {
    return;
  }
  if (!isPlainRecord(paths)) {
    warnings.push('Profile paths 必须是对象');
    return;
  }
  warnUnknownKeys(warnings, 'paths', paths, PATH_KEYS);
  PATH_KEYS.forEach(key => {
    if (!(key in paths)) {
      return;
    }
    const text = normalizeText(paths[key]);
    if (text) {
      profile.paths[key] = text;
      return;
    }
    warnings.push(`Profile paths.${key} 必须是非空字符串`);
  });
}

function applyDateOverrides(
  profile: CalendarProfile,
  date: CalendarProfileConfigInput['date'],
  warnings: string[],
): void {
  if (date === undefined) {
    return;
  }
  if (!isPlainRecord(date)) {
    warnings.push('Profile date 必须是对象');
    return;
  }
  warnUnknownKeys(warnings, 'date', date, DATE_KEYS);
  const eraName = normalizeText(date.eraName);
  if ('eraName' in date) {
    if (eraName) {
      profile.date.eraName = eraName;
    } else {
      warnings.push('Profile date.eraName 必须是非空字符串');
    }
  }
  if ('eraNames' in date) {
    const eraNames = normalizeStringArray(date.eraNames, warnings, 'date.eraNames');
    if (eraNames) {
      profile.date.eraNames = eraNames;
    }
  }
  if ('useChineseNumeralYear' in date) {
    if (typeof date.useChineseNumeralYear === 'boolean') {
      profile.date.useChineseNumeralYear = date.useChineseNumeralYear;
    } else {
      warnings.push('Profile date.useChineseNumeralYear 必须是布尔值');
    }
  }
}

function applyWorldbookOverrides(
  profile: CalendarProfile,
  worldbook: CalendarProfileConfigInput['worldbook'],
  warnings: string[],
): void {
  if (worldbook === undefined) {
    return;
  }
  if (!isPlainRecord(worldbook)) {
    warnings.push('Profile worldbook 必须是对象');
    return;
  }
  warnUnknownKeys(warnings, 'worldbook', worldbook, WORLDBOOK_KEYS);
  const variableDisplayTitle = normalizeText(worldbook.variableDisplayTitle);
  if ('variableDisplayTitle' in worldbook) {
    if (variableDisplayTitle) {
      profile.worldbook.variableDisplayTitle = variableDisplayTitle;
    } else {
      warnings.push('Profile worldbook.variableDisplayTitle 必须是非空字符串');
    }
  }
  if ('updateRuleTimeExamples' in worldbook) {
    const examples = normalizeStringArray(
      worldbook.updateRuleTimeExamples,
      warnings,
      'worldbook.updateRuleTimeExamples',
    );
    if (examples) {
      profile.worldbook.updateRuleTimeExamples = examples;
    }
  }
  if ('forbiddenRepeatTimeExamples' in worldbook) {
    const examples = normalizeStringArray(
      worldbook.forbiddenRepeatTimeExamples,
      warnings,
      'worldbook.forbiddenRepeatTimeExamples',
    );
    if (examples) {
      profile.worldbook.forbiddenRepeatTimeExamples = examples;
    }
  }
}

function applyVisualOverrides(
  profile: CalendarProfile,
  visual: CalendarProfileConfigInput['visual'],
  warnings: string[],
): void {
  if (visual === undefined) {
    return;
  }
  if (!isPlainRecord(visual)) {
    warnings.push('Profile visual 必须是对象');
    return;
  }
  warnUnknownKeys(warnings, 'visual', visual, VISUAL_KEYS);
  if ('festivalMarkerPresetId' in visual) {
    const presetId = normalizeText(visual.festivalMarkerPresetId);
    if (presetId) {
      profile.visual = { ...(profile.visual ?? {}), festivalMarkerPresetId: presetId };
    } else {
      warnings.push('Profile visual.festivalMarkerPresetId 必须是非空字符串');
    }
  }
}

function applyAddonOverrides(profile: CalendarProfile, addons: unknown, warnings: string[]): void {
  if (addons === undefined) {
    return;
  }
  if (!Array.isArray(addons)) {
    warnings.push('Profile addons 必须是字符串数组');
    return;
  }
  const known = new Set(KNOWN_ADDONS);
  const output: CalendarAddonId[] = [];
  addons.forEach(item => {
    const addon = normalizeText(item);
    if (known.has(addon as CalendarAddonId)) {
      output.push(addon as CalendarAddonId);
      return;
    }
    warnings.push(`Profile addons 忽略未知插件：${String(item)}`);
  });
  profile.addons = [...new Set(output)];
}

function applyDeveloperModeOverride(profile: CalendarProfile, developerMode: unknown, warnings: string[]): void {
  if (developerMode === undefined) {
    return;
  }
  if (typeof developerMode === 'boolean') {
    profile.developerMode = developerMode;
    return;
  }
  warnings.push('Profile developerMode 必须是布尔值');
}

export function resolveCalendarProfileConfig(args: {
  profileHint?: unknown;
  config?: CalendarProfileConfigInput | null;
}): CalendarProfileResolveResult {
  const warnings: string[] = [];
  const config = isPlainRecord(args.config) ? (args.config as CalendarProfileConfigInput) : null;
  const configId = normalizeText(config?.id);
  const profileHint = normalizeText(args.profileHint);
  const identity = configId || profileHint;
  const builtin = findBuiltinProfile(identity);

  if (!config && !builtin && identity) {
    return {
      profile: cloneProfile(GENERIC_CALENDAR_PROFILE),
      source: 'default',
      warnings: [`未知 Profile：${identity}，已回退到 generic`],
    };
  }

  const profile = cloneProfile(builtin ?? GENERIC_CALENDAR_PROFILE);
  if (!config) {
    return {
      profile,
      source: builtin ? 'builtin' : 'default',
      warnings,
    };
  }

  warnUnknownKeys(warnings, 'config', config as Record<string, unknown>, [
    'id',
    'label',
    'developerMode',
    'paths',
    'date',
    'worldbook',
    'visual',
    'addons',
  ]);

  if (identity && !builtin) {
    profile.id = identity;
  }

  const label = normalizeText(config.label);
  if ('label' in config) {
    if (label) {
      profile.label = label;
    } else {
      warnings.push('Profile label 必须是非空字符串');
    }
  }

  applyPathOverrides(profile, config.paths, warnings);
  applyDateOverrides(profile, config.date, warnings);
  applyWorldbookOverrides(profile, config.worldbook, warnings);
  applyVisualOverrides(profile, config.visual, warnings);
  applyAddonOverrides(profile, config.addons, warnings);
  applyDeveloperModeOverride(profile, config.developerMode, warnings);

  return {
    profile,
    source: 'runtime_index',
    warnings,
  };
}
