import type {
  CalendarArchiveStore,
  CalendarBucketType,
  CalendarEventColorStyle,
  RawCalendarEvent,
} from '../types';
import { readActiveBuckets, replaceActiveBuckets } from './active-buckets';
import { resolveCalendarEventColor as resolveEventColor } from './calendar-settings';

/**
 * @deprecated Calendar no longer archives completed items. Legacy callers now mean
 * “remove this active calendar item”.
 */
export async function archiveCompletedEvent(params: {
  id: string;
  type: '临时' | '重复';
  completedAt?: string;
}): Promise<'archived' | 'deleted' | 'protected' | 'missing'> {
  const buckets = await readActiveBuckets();
  const sourceBucket = params.type === '重复' ? buckets.重复 : buckets.临时;
  if (!sourceBucket[params.id]) {
    return 'missing';
  }
  delete sourceBucket[params.id];
  await replaceActiveBuckets(buckets);
  return 'deleted';
}

/** @deprecated Calendar no longer applies archive/protect policies. */
export function resolveCalendarEventPolicyAction(
  _id: string,
  _raw: RawCalendarEvent,
  _policy?: CalendarArchiveStore['policy'],
): 'archive' | 'delete' | 'protect' {
  return 'delete';
}

export function resolveCalendarEventColor(
  id: string,
  raw: Pick<RawCalendarEvent, '标题' | '内容' | '标签'>,
  _policy?: CalendarArchiveStore['policy'],
): CalendarEventColorStyle | undefined {
  return resolveEventColor(id, raw);
}

/** @deprecated Calendar no longer archives removed items. */
export async function removeActiveEventWithPolicy(params: {
  id: string;
  completedAt?: string;
}): Promise<'archived' | 'deleted' | 'protected' | 'missing'> {
  const buckets = await readActiveBuckets();
  const type: CalendarBucketType | null = buckets.重复[params.id] ? '重复' : buckets.临时[params.id] ? '临时' : null;
  if (!type) {
    return 'missing';
  }
  delete (type === '重复' ? buckets.重复 : buckets.临时)[params.id];
  await replaceActiveBuckets(buckets);
  return 'deleted';
}

/** @deprecated No-op. There is no archive snapshot to synchronize. */
export async function syncArchiveOnActiveRemoval(
  _completedAt?: string,
  _isCurrent: () => boolean = () => true,
): Promise<{ archived: number; skipped: number; deleted: number; restored: number }> {
  return { archived: 0, skipped: 0, deleted: 0, restored: 0 };
}

/** @deprecated No-op. MVU removals are no longer intercepted for history. */
export function syncArchiveFromMvuVariableDiff(_params: {
  newVariables: Record<string, any>;
  oldVariables: Record<string, any>;
  completedAt?: string;
}): { archived: number; skipped: number; deleted: number; restored: number } {
  return { archived: 0, skipped: 0, deleted: 0, restored: 0 };
}

/** @deprecated No archive exists to restore from. */
export async function restoreArchivedEvent(_id: string): Promise<void> {}

/** @deprecated No archive exists to purge. */
export function purgeArchivedEventWithPolicy(_id: string): 'deleted' | 'protected' | 'missing' {
  return 'missing';
}

/** @deprecated No archive exists to clean. */
export function purgeAutoDeleteArchivedEvents(): { deleted: number; protected: number } {
  return { deleted: 0, protected: 0 };
}
