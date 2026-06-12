import _ from 'lodash';

import { sanitizeActiveCalendarBuckets } from '../event-normalizer';
import { getCalendarEventRootPath } from '../profile';
import type { ActiveCalendarBuckets, CalendarBucketType, RawCalendarEvent } from '../types';
import {
  ensureMvuReady,
  getLatestMessageVariableTarget,
  hasMvuWriteApi,
  readMessageVariableData,
  warnMessageVariableUnavailable,
} from './message-variable';

const LEGACY_CALENDAR_SEGMENT = '\u65e5\u5386';
const LEGACY_VARIABLE_LIST_TITLE = `当前${LEGACY_CALENDAR_SEGMENT}内容展示`;

export interface LegacyCalendarBucketInspection {
  hasLegacyBuckets: boolean;
  hasCurrentBuckets: boolean;
  legacyCounts: Record<CalendarBucketType, number>;
  currentCounts: Record<CalendarBucketType, number>;
}

export interface LegacyCalendarMergeResult extends LegacyCalendarBucketInspection {
  migrated: boolean;
  removedLegacy: boolean;
  mergedIds: string[];
  renamedIds: Array<{ from: string; to: string; bucket: CalendarBucketType }>;
  skippedIds: string[];
}

export interface LegacyCalendarVariableTargetResult extends LegacyCalendarMergeResult {
  scope: 'chat' | 'message';
  label: string;
  target: VariableOption;
  error?: string;
}

export interface LegacyCalendarVariableScanResult {
  targets: LegacyCalendarVariableTargetResult[];
  legacyTargetCount: number;
  currentTargetCount: number;
}

export interface LegacyCalendarVariableMigrationResult {
  targets: LegacyCalendarVariableTargetResult[];
  migratedTargetCount: number;
  failedTargetCount: number;
}

function createEmptyBuckets(): ActiveCalendarBuckets {
  return { 临时: {}, 重复: {} };
}

function countBucketRecords(buckets: ActiveCalendarBuckets): Record<CalendarBucketType, number> {
  return {
    临时: Object.keys(buckets.临时).length,
    重复: Object.keys(buckets.重复).length,
  };
}

function hasBucketRecords(buckets: ActiveCalendarBuckets): boolean {
  return Object.values(countBucketRecords(buckets)).some(count => count > 0);
}

function readLegacyBuckets(data: Record<string, any>): ActiveCalendarBuckets {
  return sanitizeActiveCalendarBuckets(_.get(data, getLegacyCalendarEventRootPath(), {}));
}

function readCurrentBuckets(data: Record<string, any>): ActiveCalendarBuckets {
  return sanitizeActiveCalendarBuckets(_.get(data, getCalendarEventRootPath(), {}));
}

function cloneEventRecord(event: RawCalendarEvent): RawCalendarEvent {
  return _.cloneDeep(event);
}

function getUniqueLegacyId(bucket: Record<string, RawCalendarEvent>, id: string): string {
  let index = 1;
  let candidate = `${id}_legacy_${index}`;
  while (bucket[candidate]) {
    index += 1;
    candidate = `${id}_legacy_${index}`;
  }
  return candidate;
}

export function getLegacyCalendarEventRootPath(): string {
  return `stat_data.事件.${LEGACY_CALENDAR_SEGMENT}`;
}

export function getLegacyCalendarTempEventsPath(): string {
  return `${getLegacyCalendarEventRootPath()}.临时`;
}

export function getLegacyCalendarRepeatEventsPath(): string {
  return `${getLegacyCalendarEventRootPath()}.重复`;
}

export function getLegacyCalendarVariableListEntryName(prefix: string): string {
  return `${prefix}[${LEGACY_VARIABLE_LIST_TITLE}]`;
}

export function inspectLegacyCalendarBucketsInData(data: Record<string, any>): LegacyCalendarBucketInspection {
  const legacyBuckets = readLegacyBuckets(data);
  const currentBuckets = readCurrentBuckets(data);
  return {
    hasLegacyBuckets: hasBucketRecords(legacyBuckets),
    hasCurrentBuckets: hasBucketRecords(currentBuckets),
    legacyCounts: countBucketRecords(legacyBuckets),
    currentCounts: countBucketRecords(currentBuckets),
  };
}

export function mergeLegacyCalendarBucketsInData(data: Record<string, any>): LegacyCalendarMergeResult {
  const legacyBuckets = readLegacyBuckets(data);
  const currentBuckets = readCurrentBuckets(data);
  const inspection = inspectLegacyCalendarBucketsInData(data);

  if (!inspection.hasLegacyBuckets) {
    return {
      ...inspection,
      migrated: false,
      removedLegacy: false,
      mergedIds: [],
      renamedIds: [],
      skippedIds: [],
    };
  }

  const mergedBuckets: ActiveCalendarBuckets = {
    临时: { ...currentBuckets.临时 },
    重复: { ...currentBuckets.重复 },
  };
  const mergedIds: string[] = [];
  const renamedIds: LegacyCalendarMergeResult['renamedIds'] = [];
  const skippedIds: string[] = [];

  (['临时', '重复'] as CalendarBucketType[]).forEach(bucketType => {
    Object.entries(legacyBuckets[bucketType]).forEach(([id, event]) => {
      const currentEvent = mergedBuckets[bucketType][id];
      if (currentEvent && _.isEqual(currentEvent, event)) {
        skippedIds.push(`${bucketType}:${id}`);
        return;
      }
      if (currentEvent) {
        const renamedId = getUniqueLegacyId(mergedBuckets[bucketType], id);
        mergedBuckets[bucketType][renamedId] = cloneEventRecord(event);
        renamedIds.push({ from: id, to: renamedId, bucket: bucketType });
        mergedIds.push(`${bucketType}:${renamedId}`);
        return;
      }
      mergedBuckets[bucketType][id] = cloneEventRecord(event);
      mergedIds.push(`${bucketType}:${id}`);
    });
  });

  _.set(data, getCalendarEventRootPath(), mergedBuckets);
  _.unset(data, getLegacyCalendarEventRootPath());

  return {
    ...inspection,
    migrated: true,
    removedLegacy: true,
    currentCounts: countBucketRecords(mergedBuckets),
    mergedIds,
    renamedIds,
    skippedIds,
  };
}

function readChatVariableData(): Record<string, any> {
  try {
    return getVariables({ type: 'chat' });
  } catch (error) {
    warnMessageVariableUnavailable('读取聊天变量失败，暂时跳过旧月历变量扫描', error);
    return {};
  }
}

function readVariableTargets(): Array<{
  scope: 'chat' | 'message';
  label: string;
  target: VariableOption;
  data: Record<string, any>;
}> {
  const targets: Array<{
    scope: 'chat' | 'message';
    label: string;
    target: VariableOption;
    data: Record<string, any>;
  }> = [{ scope: 'chat', label: '当前聊天变量', target: { type: 'chat' }, data: readChatVariableData() }];
  const latestTarget = getLatestMessageVariableTarget();
  if (latestTarget) {
    targets.push({ scope: 'message', label: '最新消息变量', target: latestTarget, data: readMessageVariableData() });
  }
  return targets;
}

function buildTargetResult(
  target: { scope: 'chat' | 'message'; label: string; target: VariableOption },
  result: LegacyCalendarMergeResult,
): LegacyCalendarVariableTargetResult {
  return {
    ...result,
    scope: target.scope,
    label: target.label,
    target: target.target,
  };
}

export function scanLegacyCalendarVariableTargets(): LegacyCalendarVariableScanResult {
  const targets = readVariableTargets().map(item =>
    buildTargetResult(item, {
      ...inspectLegacyCalendarBucketsInData(item.data),
      migrated: false,
      removedLegacy: false,
      mergedIds: [],
      renamedIds: [],
      skippedIds: [],
    }),
  );
  return {
    targets,
    legacyTargetCount: targets.filter(target => target.hasLegacyBuckets).length,
    currentTargetCount: targets.filter(target => target.hasCurrentBuckets).length,
  };
}

async function replaceVariableTargetData(target: VariableOption, data: Record<string, any>): Promise<void> {
  if (target.type === 'message') {
    const isMvuReady = await ensureMvuReady();
    if (isMvuReady && hasMvuWriteApi()) {
      await Mvu.replaceMvuData(data as Mvu.MvuData, target);
      return;
    }
  }
  replaceVariables(data, target);
}

export async function migrateLegacyCalendarVariableTargets(): Promise<LegacyCalendarVariableMigrationResult> {
  const outputs: LegacyCalendarVariableTargetResult[] = [];
  for (const item of readVariableTargets()) {
    const clonedData = _.cloneDeep(item.data);
    const mergeResult = mergeLegacyCalendarBucketsInData(clonedData);
    const targetResult = buildTargetResult(item, mergeResult);
    if (mergeResult.migrated) {
      try {
        await replaceVariableTargetData(item.target, clonedData);
      } catch (error) {
        targetResult.migrated = false;
        targetResult.removedLegacy = false;
        targetResult.error = error instanceof Error ? error.message : String(error ?? '');
      }
    }
    outputs.push(targetResult);
  }
  return {
    targets: outputs,
    migratedTargetCount: outputs.filter(target => target.migrated).length,
    failedTargetCount: outputs.filter(target => Boolean(target.error)).length,
  };
}

export function createEmptyCalendarBucketsForMigration(): ActiveCalendarBuckets {
  return createEmptyBuckets();
}
