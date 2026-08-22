import type { CalendarArchiveStore } from '../types';
import { readCalendarSettings, replaceCalendarSettings } from './calendar-settings';

/**
 * @deprecated Transitional compatibility for legacy widget code.
 * Calendar Float no longer persists completed/history items.
 */
export function readArchiveStore(): CalendarArchiveStore {
  const settings = readCalendarSettings();
  return {
    completed: {},
    dismissedFestivalReminderKeys: settings.dismissedFestivalReminderKeys,
    dismissedUserReminderKeys: settings.dismissedUserReminderKeys,
    sources: settings.sources,
    policy: {
      archiveOnActiveRemoval: false,
      skipArchiveTags: [],
      autoDeleteTags: [],
      protectedTags: [],
      customTags: settings.customTags,
      tagColors: settings.tagColors,
    },
    lastActiveSnapshot: { 临时: {}, 重复: {} },
  };
}

/**
 * @deprecated Transitional compatibility for legacy widget code.
 * Archive/history fields are discarded; only still-valid calendar settings are kept.
 */
export function replaceArchiveStore(nextStore: CalendarArchiveStore): void {
  const current = readCalendarSettings();
  replaceCalendarSettings({
    ...current,
    sources: nextStore.sources,
    dismissedFestivalReminderKeys: nextStore.dismissedFestivalReminderKeys,
    dismissedUserReminderKeys: nextStore.dismissedUserReminderKeys,
    customTags: nextStore.policy.customTags,
    tagColors: nextStore.policy.tagColors,
  });
}
