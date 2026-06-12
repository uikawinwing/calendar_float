import _ from 'lodash';

import type { CalendarSourceConfig } from '../types';

export function createEmptySourceConfig(): CalendarSourceConfig {
  return {
    useChatBoundWorldbook: true,
    extraWorldbooks: [],
    devWorldbooks: [],
  };
}

function sanitizeWorldbookNameList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map(item => String(item ?? '').trim())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index)
    .sort((left, right) => left.localeCompare(right, 'zh-CN'));
}

export function sanitizeSourceConfig(value: unknown): CalendarSourceConfig {
  const defaults = createEmptySourceConfig();
  const source = _.isPlainObject(value) ? (value as Record<string, unknown>) : {};
  const extraWorldbooks = sanitizeWorldbookNameList(source.extraWorldbooks);
  const devWorldbooks = sanitizeWorldbookNameList(source.devWorldbooks);
  return {
    useChatBoundWorldbook: source.useChatBoundWorldbook !== false,
    extraWorldbooks,
    devWorldbooks: devWorldbooks.length ? devWorldbooks : defaults.devWorldbooks,
  };
}

export function getChatBoundCalendarWorldbookName(): string {
  const binding = getCharWorldbookNames('current');
  const primary = String(binding.primary || '').trim();
  if (primary) {
    return primary;
  }
  return String(getChatWorldbookName('current') || '').trim();
}

export function getAvailableCalendarWorldbooks(): string[] {
  return [...getWorldbookNames(), ...getGlobalWorldbookNames()]
    .map(name => String(name || '').trim())
    .filter(Boolean)
    .filter((name, index, array) => array.indexOf(name) === index)
    .sort((left, right) => left.localeCompare(right, 'zh-CN'));
}
