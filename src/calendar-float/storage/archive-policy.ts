import _ from 'lodash';

import { sanitizeTagList } from '../event-normalizer';
import type { CalendarArchiveStore, CalendarEventColorStyle, RawCalendarEvent } from '../types';
import { collectEventTags } from './tags';

export function createEmptyArchivePolicy(): CalendarArchiveStore['policy'] {
  return {
    archiveOnActiveRemoval: true,
    skipArchiveTags: [],
    autoDeleteTags: [],
    protectedTags: ['收藏', '星标', 'favorite', 'favourite', 'starred'],
    customTags: [],
    tagColors: {
      主线: { background: '#dcecff', text: '#305d97', border: 'rgba(95, 148, 216, 0.22)' },
      支线: { background: '#e9e2ff', text: '#5c4a98', border: 'rgba(119, 98, 190, 0.22)' },
      课程: { background: '#dff4e8', text: '#2f7048', border: 'rgba(77, 158, 103, 0.22)' },
      约会: { background: '#ffe1eb', text: '#9a3d61', border: 'rgba(194, 91, 129, 0.22)' },
      节庆: { background: '#ffe6a6', text: '#895710', border: 'rgba(201, 145, 40, 0.24)' },
      旅行: { background: '#dff2f3', text: '#2d6f73', border: 'rgba(75, 155, 160, 0.22)' },
      比赛: { background: '#ffe3cf', text: '#9a4b20', border: 'rgba(207, 111, 54, 0.22)' },
      限时: { background: '#f1e6d8', text: '#73583c', border: 'rgba(139, 105, 67, 0.2)' },
      纪念: { background: '#fff0c9', text: '#7a5916', border: 'rgba(191, 143, 68, 0.24)' },
    },
  };
}

function sanitizeColorValue(value: unknown): string {
  const text = String(value ?? '').trim();
  return /^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/.test(text) ? text : '';
}

function sanitizeTagColorMap(
  value: unknown,
  defaults: Record<string, CalendarEventColorStyle>,
): Record<string, CalendarEventColorStyle> {
  const source = _.isPlainObject(value) ? (value as Record<string, unknown>) : {};
  const output: Record<string, CalendarEventColorStyle> = { ...defaults };
  Object.entries(source).forEach(([tag, color]) => {
    if (!_.isPlainObject(color)) {
      return;
    }
    const raw = color as Record<string, unknown>;
    const background = sanitizeColorValue(raw.background);
    const text = sanitizeColorValue(raw.text);
    const border = sanitizeColorValue(raw.border);
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

export function sanitizeArchivePolicy(value: unknown): CalendarArchiveStore['policy'] {
  const defaults = createEmptyArchivePolicy();
  const source = _.isPlainObject(value) ? (value as Record<string, unknown>) : {};
  const skipArchiveTags = sanitizeTagList(source.skipArchiveTags);
  const protectedTags = sanitizeTagList(source.protectedTags);
  return {
    archiveOnActiveRemoval: source.archiveOnActiveRemoval !== false,
    skipArchiveTags,
    autoDeleteTags: sanitizeTagList(source.autoDeleteTags),
    protectedTags: protectedTags.length
      ? protectedTags
      : skipArchiveTags.length
        ? skipArchiveTags
        : defaults.protectedTags,
    customTags: sanitizeTagList(source.customTags),
    tagColors: sanitizeTagColorMap(source.tagColors, defaults.tagColors),
  };
}

function hasAnyPolicyTag(id: string, raw: RawCalendarEvent, tags: string[]): boolean {
  if (!tags.length) {
    return false;
  }
  const eventTags = collectEventTags(id, raw);
  return eventTags.some(tag => tags.includes(tag));
}

export function resolveCalendarEventPolicyAction(args: {
  id: string;
  raw: RawCalendarEvent;
  policy: CalendarArchiveStore['policy'];
}): 'archive' | 'delete' | 'protect' {
  if (hasAnyPolicyTag(args.id, args.raw, [...args.policy.protectedTags, ...args.policy.skipArchiveTags])) {
    return 'protect';
  }
  if (hasAnyPolicyTag(args.id, args.raw, args.policy.autoDeleteTags)) {
    return 'delete';
  }
  return 'archive';
}

export function resolveCalendarEventColor(args: {
  id: string;
  raw: Pick<RawCalendarEvent, '标题' | '内容' | '标签'>;
  policy: CalendarArchiveStore['policy'];
}): CalendarEventColorStyle | undefined {
  const tags = collectEventTags(args.id, args.raw);
  for (const tag of tags) {
    const color = args.policy.tagColors[tag];
    if (color) {
      return color;
    }
  }
  return undefined;
}
