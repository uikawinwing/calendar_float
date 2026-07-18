import _ from 'lodash';
import type { ActiveCalendarBuckets, CalendarBucketType, RawCalendarEvent } from './types';

export function sanitizeRule(value: unknown): RawCalendarEvent['重复规则'] {
  const rule = String(value ?? '无') as RawCalendarEvent['重复规则'];
  return ['无', '每天', '每周', '每月', '每年', '仅工作日', '仅节假日'].includes(rule) ? rule : '无';
}

export function sanitizeNarrativeType(value: unknown): NonNullable<RawCalendarEvent['类型']> {
  const type = String(value ?? '').trim() as NonNullable<RawCalendarEvent['类型']>;
  return ['日程', '事件', '回忆'].includes(type) ? type : '日程';
}

export function sanitizeImportance(value: unknown): NonNullable<RawCalendarEvent['重要度']> {
  const importance = String(value ?? '').trim();
  if (['重要且紧急', '重要不紧急', '不重要但紧急', '不重要不紧急'].includes(importance)) {
    return importance as NonNullable<RawCalendarEvent['重要度']>;
  }
  if (importance === '重要') {
    return '重要且紧急';
  }
  if (importance === '纪念') {
    return '重要不紧急';
  }
  return '不重要不紧急';
}

export function sanitizeVisibility(value: unknown): NonNullable<RawCalendarEvent['可见性']> {
  const visibility = String(value ?? '').trim() as NonNullable<RawCalendarEvent['可见性']>;
  return ['玩家与LLM', '仅玩家', '仅LLM', '完全不显示'].includes(visibility) ? visibility : '玩家与LLM';
}

export function sanitizeReminderLeadDays(value: unknown): number {
  const days = Number(value);
  return Number.isFinite(days) ? Math.max(0, Math.floor(days)) : 0;
}

export function inferDefaultPostAction(
  type: NonNullable<RawCalendarEvent['类型']>,
  importance: NonNullable<RawCalendarEvent['重要度']>,
): NonNullable<RawCalendarEvent['完成后']> {
  void type;
  void importance;
  return '归档';
}

export function sanitizePostAction(
  value: unknown,
  type: NonNullable<RawCalendarEvent['类型']>,
  importance: NonNullable<RawCalendarEvent['重要度']>,
): NonNullable<RawCalendarEvent['完成后']> {
  const action = String(value ?? '').trim();
  if (action === '不处理') {
    return '历史';
  }
  return ['历史', '自动清理', '归档', '转回忆'].includes(action)
    ? (action as NonNullable<RawCalendarEvent['完成后']>)
    : inferDefaultPostAction(type, importance);
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

export function sanitizeRawEvent(value: unknown, bucketType?: CalendarBucketType): RawCalendarEvent {
  const source = _.isPlainObject(value) ? (value as Record<string, unknown>) : {};
  const 类型 = sanitizeNarrativeType(source.类型);
  const 重要度 = sanitizeImportance(source.重要度);
  const 重复规则 = bucketType === '临时' ? '无' : sanitizeRule(source.重复规则 ?? source.重复规则分类);
  return {
    标题: String(source.标题 ?? '').trim(),
    内容: String(source.内容 ?? '').trim(),
    时间: String(source.时间 ?? '').trim(),
    结束时间: String(source.结束时间 ?? '').trim(),
    重复规则,
    类型,
    完成后: sanitizePostAction(source.完成后, 类型, 重要度),
    重要度,
    提前提醒天数: sanitizeReminderLeadDays(source.提前提醒天数),
    可见性: sanitizeVisibility(source.可见性),
    标签: sanitizeTagList(source.标签),
  };
}

export function sanitizeBucketRecords(
  value: unknown,
  bucketType?: CalendarBucketType,
): Record<string, RawCalendarEvent> {
  if (!_.isPlainObject(value)) {
    return {};
  }
  const source = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(source).map(([id, event]) => [id, sanitizeRawEvent(event, bucketType)]),
  ) as Record<string, RawCalendarEvent>;
}

export function sanitizeActiveCalendarBuckets(value: unknown): ActiveCalendarBuckets {
  const source = _.isPlainObject(value) ? (value as Record<string, unknown>) : {};
  return {
    临时: sanitizeBucketRecords(source.临时, '临时'),
    重复: sanitizeBucketRecords(source.重复, '重复'),
  };
}
