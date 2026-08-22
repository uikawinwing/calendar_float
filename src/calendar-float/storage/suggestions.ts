import { PRESET_TAG_OPTIONS } from '../constants';
import { isCalendarEventVisibleToPlayer } from '../event-visibility';
import type {
  ActiveCalendarBuckets,
  CalendarSourceSettings,
  CalendarSuggestionSet,
  CalendarTagOption,
  RawCalendarEvent,
} from '../types';
import { collectEventTags } from './tags';

export function buildSuggestionSet(args: {
  activeBuckets: ActiveCalendarBuckets;
  settings: CalendarSourceSettings;
}): CalendarSuggestionSet {
  const titlePool = new Set<string>();
  const tagMap = new Map<string, CalendarTagOption>();
  const idPool = new Set<string>();

  PRESET_TAG_OPTIONS.forEach(option => tagMap.set(option.value, option));
  args.settings.customTags.forEach(tag => {
    if (!tagMap.has(tag)) {
      tagMap.set(tag, { value: tag, label: tag, source: 'custom' });
    }
  });

  const collect = (id: string, event: RawCalendarEvent): void => {
    if (!isCalendarEventVisibleToPlayer(event)) {
      return;
    }
    if (id) {
      idPool.add(id);
    }
    if (event.标题) {
      titlePool.add(event.标题);
    }
    collectEventTags(id, event).forEach(tag => {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, { value: tag, label: tag, source: 'history' });
      }
    });
  };

  Object.entries(args.activeBuckets.临时).forEach(([id, event]) => collect(id, event));
  Object.entries(args.activeBuckets.重复).forEach(([id, event]) => collect(id, event));

  return {
    idCandidates: Array.from(idPool).sort((left, right) => left.localeCompare(right, 'zh-CN')),
    titleCandidates: Array.from(titlePool).sort((left, right) => left.localeCompare(right, 'zh-CN')),
    tagCandidates: Array.from(tagMap.values()).sort((left, right) => left.label.localeCompare(right.label, 'zh-CN')),
  };
}
