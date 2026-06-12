import type { CalendarArchiveStore, CalendarSourceConfig } from '../types';
import { sanitizeArchivePolicy } from './archive-policy';
import { readArchiveStore, replaceArchiveStore } from './archive-store';
import { sanitizeSourceConfig } from './source-config';

export function readCalendarSourceConfig(): CalendarSourceConfig {
  return readArchiveStore().sources;
}

export function replaceCalendarSourceConfig(nextConfig: CalendarSourceConfig): CalendarSourceConfig {
  const archive = readArchiveStore();
  archive.sources = sanitizeSourceConfig(nextConfig);
  replaceArchiveStore(archive);
  return archive.sources;
}

export function readCalendarArchivePolicy(): CalendarArchiveStore['policy'] {
  return readArchiveStore().policy;
}

export function replaceCalendarArchivePolicy(
  nextPolicy: Partial<CalendarArchiveStore['policy']>,
): CalendarArchiveStore['policy'] {
  const archive = readArchiveStore();
  archive.policy = sanitizeArchivePolicy({
    ...archive.policy,
    ...nextPolicy,
  });
  replaceArchiveStore(archive);
  return archive.policy;
}
