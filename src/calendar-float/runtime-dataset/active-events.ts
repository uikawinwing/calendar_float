import { collectEventTags, resolveCalendarEventColor } from '../storage';
import type {
  ArchivedCalendarEvent,
  CalendarEventRecord,
  CalendarMonthAliasRecord,
  DatePoint,
  RawCalendarEvent,
} from '../types';
import { buildRuntimeEventRange } from './date-utils';

export function mapActiveCalendarEvent(
  type: '临时' | '重复',
  id: string,
  raw: RawCalendarEvent,
  now: DatePoint,
  monthAliases: CalendarMonthAliasRecord[] = [],
): CalendarEventRecord {
  const tags = collectEventTags(id, { 标题: String(raw.标题 || ''), 内容: String(raw.内容 || ''), 标签: raw.标签 });
  return {
    source: 'active',
    id,
    type,
    title: String(raw.标题 || '').trim() || id,
    content: String(raw.内容 || '').trim(),
    startText: String(raw.时间 || '').trim(),
    endText: String(raw.结束时间 || '').trim(),
    repeatRule: raw.重复规则 || '无',
    tags,
    allDay: true,
    raw,
    range: buildRuntimeEventRange({
      startText: raw.时间 || '',
      endText: raw.结束时间 || raw.时间 || '',
      now,
      monthAliases,
    }),
    relatedBookIds: [],
    metadata: {},
    color: resolveCalendarEventColor(id, {
      标题: String(raw.标题 || ''),
      内容: String(raw.内容 || ''),
      标签: raw.标签,
    }),
  };
}

export function mapArchivedCalendarEvent(
  id: string,
  raw: ArchivedCalendarEvent,
  now: DatePoint,
  monthAliases: CalendarMonthAliasRecord[] = [],
): CalendarEventRecord {
  return {
    source: 'archive',
    id,
    type: raw.type || '临时',
    title: String(raw.标题 || '').trim() || id,
    content: String(raw.内容 || '').trim(),
    startText: String(raw.时间 || '').trim(),
    endText: String(raw.结束时间 || '').trim(),
    repeatRule: raw.重复规则 || '无',
    tags: raw.tags,
    allDay: true,
    raw,
    range: buildRuntimeEventRange({
      startText: raw.时间 || '',
      endText: raw.结束时间 || raw.时间 || '',
      now,
      monthAliases,
    }),
    relatedBookIds: [],
    metadata: {
      archived_at: raw.archived_at,
      completed_at: raw.completed_at,
    },
    color: resolveCalendarEventColor(id, raw),
  };
}
