import _ from 'lodash';

import {
  CHAT_ARCHIVE_PATH,
  CHAT_SETTINGS_PATH,
  LEGACY_CHAT_ARCHIVE_KEY,
} from '../constants';
import { sanitizeTagList } from '../event-normalizer';
import type {
  CalendarEventColorStyle,
  CalendarSourceConfig,
  CalendarSourceSettings,
  RawCalendarEvent,
} from '../types';
import { sanitizeSourceConfig } from './source-config';
import { collectEventTags } from './tags';

const DEFAULT_TAG_COLORS: Record<string, CalendarEventColorStyle> = {
  主线: { background: '#dcecff', text: '#305d97', border: 'rgba(95, 148, 216, 0.22)' },
  支线: { background: '#e9e2ff', text: '#5c4a98', border: 'rgba(119, 98, 190, 0.22)' },
  课程: { background: '#dff4e8', text: '#2f7048', border: 'rgba(77, 158, 103, 0.22)' },
  约会: { background: '#ffe1eb', text: '#9a3d61', border: 'rgba(194, 91, 129, 0.22)' },
  节庆: { background: '#ffe6a6', text: '#895710', border: 'rgba(201, 145, 40, 0.24)' },
  旅行: { background: '#dff2f3', text: '#2d6f73', border: 'rgba(75, 155, 160, 0.22)' },
  比赛: { background: '#ffe3cf', text: '#9a4b20', border: 'rgba(207, 111, 54, 0.22)' },
  限时: { background: '#f1e6d8', text: '#73583c', border: 'rgba(139, 105, 67, 0.2)' },
  纪念: { background: '#fff0c9', text: '#7a5916', border: 'rgba(191, 143, 68, 0.24)' },
};

function sanitizeColorValue(value: unknown): string {
  const text = String(value ?? '').trim();
  return /^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/.test(text) ? text : '';
}

function sanitizeTagColorMap(value: unknown): Record<string, CalendarEventColorStyle> {
  const source = _.isPlainObject(value) ? (value as Record<string, unknown>) : {};
  const output: Record<string, CalendarEventColorStyle> = { ...DEFAULT_TAG_COLORS };
  Object.entries(source).forEach(([tag, color]) => {
    if (!_.isPlainObject(color)) {
      return;
    }
    const raw = color as Record<string, unknown>;
    const background = sanitizeColorValue(raw.background);
    const text = sanitizeColorValue(raw.text);
    const border = String(raw.border ?? '').trim();
    const normalizedTag = String(tag || '').trim();
    if (!normalizedTag || !background || !text) {
      return;
    }
    output[normalizedTag] = {
      background,
      text,
      ...(border ? { border } : {}),
    };
  });
  return output;
}

function sanitizeStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map(item => String(item ?? '').trim()).filter(Boolean).filter((item, index, array) => array.indexOf(item) === index)
    : [];
}

function sanitizeCalendarSettings(value: unknown): CalendarSourceSettings {
  const source = _.isPlainObject(value) ? (value as Record<string, unknown>) : {};
  const legacyPolicy = _.isPlainObject(source.policy) ? (source.policy as Record<string, unknown>) : {};
  return {
    sources: sanitizeSourceConfig(source.sources),
    dismissedFestivalReminderKeys: sanitizeStringList(source.dismissedFestivalReminderKeys),
    dismissedUserReminderKeys: sanitizeStringList(source.dismissedUserReminderKeys),
    customTags: sanitizeTagList(source.customTags ?? legacyPolicy.customTags),
    tagColors: sanitizeTagColorMap(source.tagColors ?? legacyPolicy.tagColors),
  };
}

function readRawSettingsSource(): unknown {
  const variables = getVariables({ type: 'chat' });
  const current = _.get(variables, CHAT_SETTINGS_PATH);
  if (current !== undefined) {
    return current;
  }
  const legacyArchive = _.get(variables, CHAT_ARCHIVE_PATH);
  if (legacyArchive !== undefined) {
    return legacyArchive;
  }
  return variables[LEGACY_CHAT_ARCHIVE_KEY];
}

export function readCalendarSettings(): CalendarSourceSettings {
  return sanitizeCalendarSettings(readRawSettingsSource());
}

export function replaceCalendarSettings(nextSettings: CalendarSourceSettings): CalendarSourceSettings {
  const normalized = sanitizeCalendarSettings(nextSettings);
  const variables = getVariables({ type: 'chat' });
  _.set(variables, CHAT_SETTINGS_PATH, normalized);
  replaceVariables(variables, { type: 'chat' });
  return normalized;
}

export function readCalendarSourceConfig(): CalendarSourceConfig {
  return readCalendarSettings().sources;
}

export function replaceCalendarSourceConfig(nextConfig: CalendarSourceConfig): CalendarSourceConfig {
  const settings = readCalendarSettings();
  settings.sources = sanitizeSourceConfig(nextConfig);
  return replaceCalendarSettings(settings).sources;
}

export function replaceCalendarTagSettings(next: {
  customTags?: string[];
  tagColors?: Record<string, CalendarEventColorStyle>;
}): CalendarSourceSettings {
  const settings = readCalendarSettings();
  if (next.customTags) {
    settings.customTags = sanitizeTagList(next.customTags);
  }
  if (next.tagColors) {
    settings.tagColors = sanitizeTagColorMap(next.tagColors);
  }
  return replaceCalendarSettings(settings);
}

export function resolveCalendarEventColor(
  id: string,
  raw: Pick<RawCalendarEvent, '标题' | '内容' | '标签'>,
  settings: CalendarSourceSettings = readCalendarSettings(),
): CalendarEventColorStyle | undefined {
  const tags = collectEventTags(id, raw);
  for (const tag of tags) {
    const color = settings.tagColors[tag];
    if (color) {
      return color;
    }
  }
  return undefined;
}
