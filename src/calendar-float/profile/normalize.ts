import { FATE_POEM_CALENDAR_PROFILE } from './profiles';
import type {
  CalendarAddonId,
  CalendarMarkerAppearance,
  CalendarMarkerRule,
  CalendarProfile,
  CalendarProfileConfigInput,
  CalendarProfileDateSettings,
  CalendarProfilePaths,
  CalendarProfileResolveResult,
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
const VISUAL_KEYS = ['festivalMarkerPresetId', 'tagPresets', 'locationPresets', 'markerPresets', 'fallbackMarkers'];

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
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
    visual: {
      tagPresets: profile.visual.tagPresets.map(cloneMarkerRule),
      locationPresets: profile.visual.locationPresets.map(cloneMarkerRule),
      markerPresets: profile.visual.markerPresets.map(cloneMarkerRule),
      fallbackMarkers: profile.visual.fallbackMarkers.map(item => ({ ...item, color: { ...item.color } })),
    },
    addons: [...profile.addons],
  };
}

function cloneMarkerRule(rule: CalendarMarkerRule): CalendarMarkerRule {
  return { ...rule, color: { ...rule.color }, keywords: [...rule.keywords] };
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
  if (normalizeText(paths.eventRoot)) {
    if (paths.tempEvents === undefined) profile.paths.tempEvents = `${profile.paths.eventRoot}.临时`;
    if (paths.repeatEvents === undefined) profile.paths.repeatEvents = `${profile.paths.eventRoot}.重复`;
  }
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

function normalizeMarkerAppearance(value: unknown): CalendarMarkerAppearance | null {
  if (!isPlainRecord(value) || !isPlainRecord(value.color)) return null;
  const icon = normalizeText(value.icon);
  const { background, text, border } = value.color;
  const isColor = (color: unknown): color is string =>
    typeof color === 'string' && /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(color);
  if (!icon || /[/\\<>]/.test(icon) || !icon.endsWith('.svg') || !isColor(background) || !isColor(text)) return null;
  if (border !== undefined && !isColor(border)) return null;
  return { icon, color: { background, text, ...(border ? { border } : {}) } };
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
  if ('festivalMarkerPresetId' in visual && visual.festivalMarkerPresetId !== 'fate-poem') {
    warnings.push('仅支持《命定之诗》视觉规则；请在索引中配置具体规则');
  }
  (['tagPresets', 'locationPresets', 'markerPresets', 'fallbackMarkers'] as const).forEach(key => {
    if (!(key in visual)) return;
    const raw = visual[key];
    if (!Array.isArray(raw)) {
      warnings.push(`Profile visual.${key} 必须是数组`);
      return;
    }
    const appearances: CalendarMarkerAppearance[] = [];
    const rules: CalendarMarkerRule[] = [];
    raw.forEach((item, index) => {
      const appearance = normalizeMarkerAppearance(item);
      const keywords =
        isPlainRecord(item) && Array.isArray(item.keywords) ? item.keywords.map(normalizeText).filter(Boolean) : [];
      if (!appearance || (key !== 'fallbackMarkers' && !keywords.length)) {
        warnings.push(
          `Profile visual.${key}[${index}] 需要安全的 SVG 文件名、十六进制颜色${key === 'fallbackMarkers' ? '' : '和关键词'}`,
        );
        return;
      }
      appearances.push(appearance);
      rules.push({ ...appearance, keywords });
    });
    if (appearances.length !== raw.length || (key === 'fallbackMarkers' && !appearances.length)) {
      warnings.push(`Profile visual.${key} 无效，保留旧版默认规则`);
      return;
    }
    if (key === 'fallbackMarkers') profile.visual.fallbackMarkers = appearances;
    else profile.visual[key] = rules;
  });
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
  const identities = [configId, profileHint].filter(Boolean).map(identity => identity.toLowerCase());
  const unsupported = identities.find(identity => !['fate-poem', '命定之诗', 'generic'].includes(identity));
  const profile = cloneProfile(FATE_POEM_CALENDAR_PROFILE);
  if (unsupported) {
    return {
      profile,
      source: 'default',
      warnings: [`不支持的日历身份：${unsupported}；本脚本只服务《命定之诗》，已拒绝此索引配置`],
      compatible: false,
    };
  }
  if (identities.includes('generic'))
    warnings.push('旧版 generic 配置已按《命定之诗》读取，请将索引身份改为 fate-poem');
  if (!config) {
    return {
      profile,
      source: identities.length ? 'builtin' : 'default',
      warnings,
      compatible: true,
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
    compatible: true,
  };
}
