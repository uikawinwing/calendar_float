import _ from 'lodash';

import { CHAT_ARCHIVE_PATH, LEGACY_CHAT_ARCHIVE_KEY } from '../constants';
import { sanitizeBucketRecords, sanitizeRawEvent } from '../event-normalizer';
import type { ArchivedCalendarEvent, CalendarArchiveStore, CalendarBucketType } from '../types';
import { sanitizeArchivePolicy } from './archive-policy';
import { sanitizeSourceConfig } from './source-config';

function sanitizeArchiveStore(value: unknown): CalendarArchiveStore {
  const source = _.isPlainObject(value) ? (value as Record<string, unknown>) : {};
  const completedSource = _.isPlainObject(source.completed) ? (source.completed as Record<string, unknown>) : {};
  const completed = Object.fromEntries(
    Object.entries(completedSource).map(([id, event]) => {
      const raw = _.isPlainObject(event) ? (event as Record<string, unknown>) : {};
      const type: CalendarBucketType = raw.type === '重复' ? '重复' : '临时';
      const archived: ArchivedCalendarEvent = {
        id,
        type,
        archived_at: String(raw.archived_at ?? ''),
        completed_at: String(raw.completed_at ?? ''),
        tags: Array.isArray(raw.tags) ? raw.tags.map(tag => String(tag)).filter(Boolean) : [],
        preserved_for_player: true,
        archive_reason: ['completed', 'auto_cleanup', 'manual_delete', 'memory'].includes(
          String(raw.archive_reason ?? ''),
        )
          ? (String(raw.archive_reason) as ArchivedCalendarEvent['archive_reason'])
          : 'completed',
        ...sanitizeRawEvent(raw, type),
      };
      return [id, archived];
    }),
  ) as Record<string, ArchivedCalendarEvent>;
  const snapshotSource = _.isPlainObject(source.lastActiveSnapshot)
    ? (source.lastActiveSnapshot as Record<string, unknown>)
    : {};

  return {
    completed,
    dismissedFestivalReminderKeys: Array.isArray(source.dismissedFestivalReminderKeys)
      ? source.dismissedFestivalReminderKeys.map(value => String(value)).filter(Boolean)
      : [],
    dismissedUserReminderKeys: Array.isArray(source.dismissedUserReminderKeys)
      ? source.dismissedUserReminderKeys.map(value => String(value)).filter(Boolean)
      : [],
    sources: sanitizeSourceConfig(source.sources),
    policy: sanitizeArchivePolicy(source.policy),
    lastActiveSnapshot: {
      临时: sanitizeBucketRecords(snapshotSource.临时, '临时'),
      重复: sanitizeBucketRecords(snapshotSource.重复, '重复'),
    },
  };
}

export function readArchiveStore(): CalendarArchiveStore {
  const variables = getVariables({ type: 'chat' });
  return sanitizeArchiveStore(_.get(variables, CHAT_ARCHIVE_PATH, variables[LEGACY_CHAT_ARCHIVE_KEY]));
}

export function replaceArchiveStore(nextStore: CalendarArchiveStore): void {
  const variables = getVariables({ type: 'chat' });
  _.set(variables, CHAT_ARCHIVE_PATH, sanitizeArchiveStore(nextStore));
  replaceVariables(variables, { type: 'chat' });
}
