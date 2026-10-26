import _ from 'lodash';

import { sanitizeRawEvent } from '../event-normalizer';
import { getCalendarRepeatEventsPath, getCalendarTempEventsPath } from '../profile';
import type {
  ArchivedCalendarEvent,
  CalendarArchiveStore,
  CalendarBucketType,
  CalendarEventColorStyle,
  RawCalendarEvent,
} from '../types';
import {
  cloneBucketsSnapshot,
  hasActiveEventId,
  hasCalendarBucketPath,
  readActiveBuckets,
  readBucketsFromMvuVariables,
  replaceActiveBuckets,
} from './active-buckets';
import {
  resolveCalendarEventColor as resolveCalendarEventColorForPolicy,
  resolveCalendarEventPolicyAction as resolveCalendarEventPolicyActionForPolicy,
} from './archive-policy';
import { readArchiveStore, replaceArchiveStore } from './archive-store';
import { getLatestMessageVariableTarget } from './message-variable';
import { collectEventTags } from './tags';

function resolveArchiveReason(raw: RawCalendarEvent): ArchivedCalendarEvent['archive_reason'] {
  return raw.完成后 === '自动清理'
    ? 'auto_cleanup'
    : raw.完成后 === '转回忆' || raw.类型 === '回忆'
      ? 'memory'
      : 'completed';
}

export function resolveCalendarEventPolicyAction(
  id: string,
  raw: RawCalendarEvent,
  policy: CalendarArchiveStore['policy'] = readArchiveStore().policy,
): 'archive' | 'delete' | 'protect' {
  return resolveCalendarEventPolicyActionForPolicy({ id, raw, policy });
}

export function resolveCalendarEventColor(
  id: string,
  raw: Pick<RawCalendarEvent, '标题' | '内容' | '标签'>,
  policy: CalendarArchiveStore['policy'] = readArchiveStore().policy,
): CalendarEventColorStyle | undefined {
  return resolveCalendarEventColorForPolicy({ id, raw, policy });
}

function shouldSkipArchiveByPolicy(args: {
  id: string;
  raw: RawCalendarEvent;
  policy: CalendarArchiveStore['policy'];
}): boolean {
  return resolveCalendarEventPolicyActionForPolicy(args) !== 'archive';
}

function writeArchivedEvent(args: {
  archive: CalendarArchiveStore;
  id: string;
  type: '临时' | '重复';
  raw: RawCalendarEvent;
  completedAt?: string;
  archiveReason?: ArchivedCalendarEvent['archive_reason'];
}): boolean {
  const normalizedRaw = sanitizeRawEvent(args.raw, args.type);
  if (shouldSkipArchiveByPolicy({ id: args.id, raw: normalizedRaw, policy: args.archive.policy })) {
    return false;
  }

  args.archive.completed[args.id] = {
    id: args.id,
    type: args.type,
    archived_at: new Date().toISOString(),
    completed_at: args.completedAt ?? '',
    tags: collectEventTags(args.id, normalizedRaw),
    preserved_for_player: true,
    archive_reason: args.archiveReason ?? resolveArchiveReason(normalizedRaw),
    ...normalizedRaw,
  };
  return true;
}

function syncRemovedActiveEvents(
  previous: Record<'临时' | '重复', Record<string, RawCalendarEvent>>,
  current: Record<'临时' | '重复', Record<string, RawCalendarEvent>>,
  archive: CalendarArchiveStore,
  completedAt?: string,
): { archived: number; skipped: number; deleted: number; restored: number } {
  const result = { archived: 0, skipped: 0, deleted: 0, restored: 0 };

  (['临时', '重复'] as const).forEach(bucketType => {
    const previousBucket = previous[bucketType] || {};
    const currentBucket = current[bucketType] || {};
    Object.entries(previousBucket).forEach(([id, raw]) => {
      if (hasActiveEventId(current, id) || archive.completed[id]) {
        return;
      }

      const policyAction = resolveCalendarEventPolicyAction(id, raw, archive.policy);
      if (policyAction === 'protect') {
        currentBucket[id] = raw;
        result.restored += 1;
        return;
      }
      if (policyAction === 'delete') {
        result.deleted += 1;
        return;
      }
      if (!archive.policy.archiveOnActiveRemoval) {
        result.skipped += 1;
        return;
      }
      if (writeArchivedEvent({ archive, id, type: bucketType, raw, completedAt })) {
        result.archived += 1;
        return;
      }
      result.skipped += 1;
    });
  });

  return result;
}

export async function archiveCompletedEvent(params: {
  id: string;
  type: '临时' | '重复';
  completedAt?: string;
}): Promise<'archived' | 'deleted' | 'protected' | 'missing'> {
  const buckets = await readActiveBuckets();
  const sourceBucket = params.type === '重复' ? buckets.重复 : buckets.临时;
  const raw = sourceBucket[params.id];
  if (!raw) {
    return 'missing';
  }

  const archive = readArchiveStore();
  const policyAction = resolveCalendarEventPolicyAction(params.id, raw, archive.policy);
  if (policyAction === 'protect') {
    return 'protected';
  }
  if (policyAction === 'archive') {
    writeArchivedEvent({
      archive,
      id: params.id,
      type: params.type,
      raw,
      completedAt: params.completedAt,
    });
  }

  delete sourceBucket[params.id];
  archive.lastActiveSnapshot = cloneBucketsSnapshot(buckets);
  replaceArchiveStore(archive);
  await replaceActiveBuckets(buckets);
  return policyAction === 'delete' ? 'deleted' : 'archived';
}

export async function removeActiveEventWithPolicy(params: {
  id: string;
  completedAt?: string;
}): Promise<'archived' | 'deleted' | 'protected' | 'missing'> {
  const buckets = await readActiveBuckets();
  const type: CalendarBucketType | null = buckets.重复[params.id] ? '重复' : buckets.临时[params.id] ? '临时' : null;
  if (!type) {
    return 'missing';
  }
  const sourceBucket = type === '重复' ? buckets.重复 : buckets.临时;
  const raw = sourceBucket[params.id];
  const archive = readArchiveStore();
  const policyAction = resolveCalendarEventPolicyAction(params.id, raw, archive.policy);

  if (policyAction === 'protect') {
    return 'protected';
  }
  if (policyAction === 'archive') {
    writeArchivedEvent({
      archive,
      id: params.id,
      type,
      raw,
      completedAt: params.completedAt,
      archiveReason: 'manual_delete',
    });
  }

  delete sourceBucket[params.id];
  archive.lastActiveSnapshot = cloneBucketsSnapshot(buckets);
  replaceArchiveStore(archive);
  await replaceActiveBuckets(buckets);
  return policyAction === 'delete' ? 'deleted' : 'archived';
}

export async function syncArchiveOnActiveRemoval(
  completedAt?: string,
  isCurrent: () => boolean = () => true,
): Promise<{
  archived: number;
  skipped: number;
  deleted: number;
  restored: number;
}> {
  if (!isCurrent() || !getLatestMessageVariableTarget()) {
    return { archived: 0, skipped: 0, deleted: 0, restored: 0 };
  }

  const buckets = await readActiveBuckets();
  if (!isCurrent()) {
    return { archived: 0, skipped: 0, deleted: 0, restored: 0 };
  }
  const archive = readArchiveStore();
  const previous = archive.lastActiveSnapshot;
  const result = syncRemovedActiveEvents(previous, buckets, archive, completedAt);

  if (result.restored > 0) {
    await replaceActiveBuckets(buckets, isCurrent);
    if (!isCurrent()) {
      return { archived: 0, skipped: 0, deleted: 0, restored: 0 };
    }
  }

  if (!isCurrent()) {
    return { archived: 0, skipped: 0, deleted: 0, restored: 0 };
  }
  archive.lastActiveSnapshot = cloneBucketsSnapshot(buckets);
  replaceArchiveStore(archive);
  return result;
}

export function syncArchiveFromMvuVariableDiff(params: {
  newVariables: Record<string, any>;
  oldVariables: Record<string, any>;
  completedAt?: string;
}): {
  archived: number;
  skipped: number;
  deleted: number;
  restored: number;
} {
  if (!hasCalendarBucketPath(params.oldVariables) && !hasCalendarBucketPath(params.newVariables)) {
    return { archived: 0, skipped: 0, deleted: 0, restored: 0 };
  }

  const previous = readBucketsFromMvuVariables(params.oldVariables);
  const current = readBucketsFromMvuVariables(params.newVariables);
  const archive = readArchiveStore();
  const result = syncRemovedActiveEvents(previous, current, archive, params.completedAt);

  if (result.restored > 0) {
    _.set(params.newVariables, getCalendarTempEventsPath(), current.临时);
    _.set(params.newVariables, getCalendarRepeatEventsPath(), current.重复);
  }

  archive.lastActiveSnapshot = cloneBucketsSnapshot(current);
  replaceArchiveStore(archive);
  return result;
}

export async function restoreArchivedEvent(id: string): Promise<void> {
  const archive = readArchiveStore();
  const archived = archive.completed[id];
  if (!archived) {
    return;
  }

  const buckets = await readActiveBuckets();
  const targetBucket = archived.type === '重复' ? buckets.重复 : buckets.临时;
  targetBucket[id] = sanitizeRawEvent(archived, archived.type);
  delete archive.completed[id];

  archive.lastActiveSnapshot = cloneBucketsSnapshot(buckets);
  replaceArchiveStore(archive);
  await replaceActiveBuckets(buckets);
}

export function purgeArchivedEventWithPolicy(id: string): 'deleted' | 'protected' | 'missing' {
  const archive = readArchiveStore();
  const archived = archive.completed[id];
  if (!archived) {
    return 'missing';
  }
  if (resolveCalendarEventPolicyAction(id, archived, archive.policy) === 'protect') {
    return 'protected';
  }
  delete archive.completed[id];
  replaceArchiveStore(archive);
  return 'deleted';
}

export function purgeAutoDeleteArchivedEvents(): { deleted: number; protected: number } {
  const archive = readArchiveStore();
  let deleted = 0;
  let protectedCount = 0;
  Object.entries(archive.completed).forEach(([id, event]) => {
    const action = resolveCalendarEventPolicyAction(id, event, archive.policy);
    if (action === 'protect') {
      protectedCount += 1;
      return;
    }
    if (action === 'delete') {
      delete archive.completed[id];
      deleted += 1;
    }
  });
  replaceArchiveStore(archive);
  return { deleted, protected: protectedCount };
}
