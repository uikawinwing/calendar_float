import _ from 'lodash';
import type { ActiveCalendarBuckets, CalendarBucketType, RawCalendarEvent } from './types';

export function sanitizeRule(value: unknown): RawCalendarEvent['重复规则'] {
  const rule = String(value ?? '无') as RawCalendarEvent['重复规则'];
  return ['无', '每天', '每周', '每月', '每年', '仅工作日'].includes(rule) ? rule : '无';
}

export function sanitizeReminderLeadDays(value: unknown): number {
  const days = Number(value);
  return Number.isFinite(days) ? Math.max(0, Math.floor(days)) : 0;
}

export function sanitizeTagList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map(item => String(item ?? '').trim())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index);
}

function readLegacyVisibility(source: Record<string, unknown>): string {
  const visibility = String(source.可见性 ?? '').trim();
  return ['玩家与LLM', '仅玩家', '仅LLM', '完全不显示'].includes(visibility) ? visibility : '';
}

function resolveDisplayFlag(source: Record<string, unknown>): boolean {
  if (typeof source.显示 === 'boolean') {
    return source.显示;
  }
  const legacyVisibility = readLegacyVisibility(source);
  return legacyVisibility !== '仅LLM' && legacyVisibility !== '完全不显示';
}

function resolveReminderFlag(source: Record<string, unknown>): boolean {
  if (typeof source.提醒 === 'boolean') {
    return source.提醒;
  }
  // Legacy `仅玩家` meant the LLM should not receive the item. Old hidden/LLM-only
  // records become the new `显示:false + 提醒:true` temporal-signal model.
  return readLegacyVisibility(source) !== '仅玩家';
}

function buildLegacyWidgetVisibility(display: boolean, remind: boolean): RawCalendarEvent['可见性'] {
  if (!display && remind) {
    return '仅LLM';
  }
  if (!display && !remind) {
    return '完全不显示';
  }
  return remind ? '玩家与LLM' : '仅玩家';
}

export function sanitizeRawEvent(value: unknown, bucketType?: CalendarBucketType): RawCalendarEvent {
  const source = _.isPlainObject(value) ? (value as Record<string, unknown>) : {};
  const 重复规则 = bucketType === '临时' ? '无' : sanitizeRule(source.重复规则 ?? source.重复规则分类);
  const 显示 = resolveDisplayFlag(source);
  const 提醒 = resolveReminderFlag(source);
  return {
    标题: String(source.标题 ?? '').trim(),
    内容: String(source.内容 ?? '').trim(),
    时间: String(source.时间 ?? '').trim(),
    结束时间: String(source.结束时间 ?? '').trim(),
    重复规则,
    提前提醒天数: sanitizeReminderLeadDays(source.提前提醒天数),
    显示,
    提醒,
    标签: sanitizeTagList(source.标签),

    // In-memory bridge only for the legacy widget host. `flattenCalendarBuckets()`
    // strips this before persistence so the new MVU contract stays clean.
    可见性: buildLegacyWidgetVisibility(显示, 提醒),
  };
}

export function sanitizeEventRecords(value: unknown): Record<string, RawCalendarEvent> {
  if (!_.isPlainObject(value)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([id, event]) => [id, sanitizeRawEvent(event)]),
  ) as Record<string, RawCalendarEvent>;
}

export function sanitizeBucketRecords(
  value: unknown,
  bucketType?: CalendarBucketType,
): Record<string, RawCalendarEvent> {
  if (!_.isPlainObject(value)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([id, event]) => [id, sanitizeRawEvent(event, bucketType)]),
  ) as Record<string, RawCalendarEvent>;
}

export function splitCalendarRecords(records: Record<string, RawCalendarEvent>): ActiveCalendarBuckets {
  const 临时: Record<string, RawCalendarEvent> = {};
  const 重复: Record<string, RawCalendarEvent> = {};
  Object.entries(records).forEach(([id, event]) => {
    (event.重复规则 === '无' ? 临时 : 重复)[id] = event;
  });
  return { 临时, 重复 };
}

function toPersistedCalendarEvent(event: RawCalendarEvent): RawCalendarEvent {
  return {
    标题: String(event.标题 || '').trim(),
    内容: String(event.内容 || '').trim(),
    时间: String(event.时间 || '').trim(),
    结束时间: String(event.结束时间 || '').trim(),
    重复规则: sanitizeRule(event.重复规则),
    提前提醒天数: sanitizeReminderLeadDays(event.提前提醒天数),
    显示: event.显示 !== false,
    提醒: event.提醒 !== false,
    标签: sanitizeTagList(event.标签),
  };
}

export function flattenCalendarBuckets(buckets: ActiveCalendarBuckets): Record<string, RawCalendarEvent> {
  return Object.fromEntries(
    Object.entries({ ...buckets.临时, ...buckets.重复 }).map(([id, event]) => [id, toPersistedCalendarEvent(event)]),
  );
}

export function sanitizeActiveCalendarBuckets(value: unknown): ActiveCalendarBuckets {
  const source = _.isPlainObject(value) ? (value as Record<string, unknown>) : {};
  if (_.isPlainObject(source.临时) || _.isPlainObject(source.重复)) {
    return {
      临时: sanitizeBucketRecords(source.临时, '临时'),
      重复: sanitizeBucketRecords(source.重复, '重复'),
    };
  }
  return splitCalendarRecords(sanitizeEventRecords(source));
}
