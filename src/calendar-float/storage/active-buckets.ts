import _ from 'lodash';

import { sanitizeActiveCalendarBuckets, sanitizeBucketRecords } from '../event-normalizer';
import { getCalendarEventRootPath, getCalendarRepeatEventsPath, getCalendarTempEventsPath } from '../profile';
import type { ActiveCalendarBuckets } from '../types';
import {
  ensureMvuReady,
  getLatestMessageVariableTarget,
  hasMvuWriteApi,
  readMessageVariableData,
  warnMessageVariableUnavailable,
} from './message-variable';

function createEmptyBuckets(): ActiveCalendarBuckets {
  return { 临时: {}, 重复: {} };
}

function ensureActiveBucketShape(data: Record<string, any>): boolean {
  const rootPath = getCalendarEventRootPath();
  const tempPath = getCalendarTempEventsPath();
  const repeatPath = getCalendarRepeatEventsPath();
  let changed = false;
  if (!_.isPlainObject(_.get(data, rootPath))) {
    _.set(data, rootPath, createEmptyBuckets());
    changed = true;
  }
  if (!_.isPlainObject(_.get(data, tempPath))) {
    _.set(data, tempPath, {});
    changed = true;
  }
  if (!_.isPlainObject(_.get(data, repeatPath))) {
    _.set(data, repeatPath, {});
    changed = true;
  }
  return changed;
}

export function cloneBucketsSnapshot(buckets: ActiveCalendarBuckets): ActiveCalendarBuckets {
  return {
    临时: sanitizeBucketRecords(buckets.临时, '临时'),
    重复: sanitizeBucketRecords(buckets.重复, '重复'),
  };
}

export function hasCalendarBucketPath(variables: Record<string, any>): boolean {
  return (
    _.has(variables, getCalendarEventRootPath()) ||
    _.has(variables, getCalendarTempEventsPath()) ||
    _.has(variables, getCalendarRepeatEventsPath())
  );
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
  if (!ensureActiveBucketShape(data)) {
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
  ensureActiveBucketShape(data);

  const temp = sanitizeBucketRecords(_.get(data, getCalendarTempEventsPath(), {}), '临时');
  const repeat = sanitizeBucketRecords(_.get(data, getCalendarRepeatEventsPath(), {}), '重复');
  return {
    临时: temp,
    重复: repeat,
  };
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
  ensureActiveBucketShape(data);
  _.set(data, getCalendarTempEventsPath(), nextBuckets.临时);
  _.set(data, getCalendarRepeatEventsPath(), nextBuckets.重复);

  if (isMvuReady && hasMvuWriteApi()) {
    await Mvu.replaceMvuData(data as Mvu.MvuData, target);
    return;
  }

  replaceVariables(data, target);
}
