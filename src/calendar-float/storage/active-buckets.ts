import _ from 'lodash';

import {
  flattenCalendarBuckets,
  sanitizeActiveCalendarBuckets,
  sanitizeBucketRecords,
} from '../event-normalizer';
import { getCalendarEventRootPath } from '../profile';
import type { ActiveCalendarBuckets } from '../types';
import {
  ensureMvuReady,
  getLatestMessageVariableTarget,
  hasMvuWriteApi,
  readMessageVariableData,
  warnMessageVariableUnavailable,
} from './message-variable';

function ensureCalendarRoot(data: Record<string, any>): boolean {
  const rootPath = getCalendarEventRootPath();
  if (_.isPlainObject(_.get(data, rootPath))) {
    return false;
  }
  _.set(data, rootPath, {});
  return true;
}

export function cloneBucketsSnapshot(buckets: ActiveCalendarBuckets): ActiveCalendarBuckets {
  return {
    临时: sanitizeBucketRecords(buckets.临时, '临时'),
    重复: sanitizeBucketRecords(buckets.重复, '重复'),
  };
}

export function hasCalendarBucketPath(variables: Record<string, any>): boolean {
  return _.has(variables, getCalendarEventRootPath());
}

export function readBucketsFromMvuVariables(variables: Record<string, any>): ActiveCalendarBuckets {
  return sanitizeActiveCalendarBuckets(_.get(variables, getCalendarEventRootPath(), {}));
}

export function hasActiveEventId(buckets: ActiveCalendarBuckets, id: string): boolean {
  return Boolean(buckets.临时[id] || buckets.重复[id]);
}

export async function ensureCalendarLatestMessageVariableStore(isCurrent: () => boolean = () => true): Promise<boolean> {
  if (!isCurrent()) {
    return false;
  }
  const isMvuReady = await ensureMvuReady();
  if (!isCurrent()) {
    return false;
  }
  const target = getLatestMessageVariableTarget();
  if (!target) {
    return false;
  }

  const data = readMessageVariableData();
  const rootPath = getCalendarEventRootPath();
  const changed = ensureCalendarRoot(data);
  const root = _.get(data, rootPath, {});
  const legacyShape = _.isPlainObject(root) && (_.isPlainObject(_.get(root, '临时')) || _.isPlainObject(_.get(root, '重复')));
  if (legacyShape) {
    _.set(data, rootPath, flattenCalendarBuckets(sanitizeActiveCalendarBuckets(root)));
  }
  if (!changed && !legacyShape) {
    return false;
  }

  if (isMvuReady && hasMvuWriteApi()) {
    await Mvu.replaceMvuData(data as Mvu.MvuData, target);
  } else {
    replaceVariables(data, target);
  }
  return true;
}

export async function readActiveBuckets(): Promise<ActiveCalendarBuckets> {
  await ensureMvuReady();
  const data = readMessageVariableData();
  ensureCalendarRoot(data);
  return sanitizeActiveCalendarBuckets(_.get(data, getCalendarEventRootPath(), {}));
}

export async function replaceActiveBuckets(
  nextBuckets: ActiveCalendarBuckets,
  isCurrent: () => boolean = () => true,
): Promise<void> {
  if (!isCurrent()) {
    return;
  }
  const isMvuReady = await ensureMvuReady();
  if (!isCurrent()) {
    return;
  }
  const target = getLatestMessageVariableTarget();
  if (!target) {
    warnMessageVariableUnavailable('当前聊天没有可写入的消息楼层，暂时跳过月历事件写入');
    return;
  }
  const data = readMessageVariableData();
  ensureCalendarRoot(data);
  _.set(data, getCalendarEventRootPath(), flattenCalendarBuckets(nextBuckets));

  if (isMvuReady && hasMvuWriteApi()) {
    await Mvu.replaceMvuData(data as Mvu.MvuData, target);
    return;
  }

  replaceVariables(data, target);
}
