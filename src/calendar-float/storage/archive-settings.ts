import type { CalendarArchiveStore, CalendarSourceConfig } from '../types';
import {
  readCalendarSettings,
  replaceCalendarSourceConfig as replaceSourceConfig,
  replaceCalendarTagSettings,
} from './calendar-settings';

export function readCalendarSourceConfig(): CalendarSourceConfig {
  return readCalendarSettings().sources;
}

export function replaceCalendarSourceConfig(nextConfig: CalendarSourceConfig): CalendarSourceConfig {
  return replaceSourceConfig(nextConfig);
}

/** @deprecated Archive policy is no longer a product feature. */
export function readCalendarArchivePolicy(): CalendarArchiveStore['policy'] {
  const settings = readCalendarSettings();
  return {
    archiveOnActiveRemoval: false,
    skipArchiveTags: [],
    autoDeleteTags: [],
    protectedTags: [],
    customTags: settings.customTags,
    tagColors: settings.tagColors,
  };
}

/**
 * @deprecated Archive behavior is ignored. This only preserves tag/color settings
 * until the legacy widget settings UI is removed.
 */
export function replaceCalendarArchivePolicy(
  nextPolicy: Partial<CalendarArchiveStore['policy']>,
): CalendarArchiveStore['policy'] {
  const settings = replaceCalendarTagSettings({
    customTags: nextPolicy.customTags,
    tagColors: nextPolicy.tagColors,
  });
  return {
    archiveOnActiveRemoval: false,
    skipArchiveTags: [],
    autoDeleteTags: [],
    protectedTags: [],
    customTags: settings.customTags,
    tagColors: settings.tagColors,
  };
}
