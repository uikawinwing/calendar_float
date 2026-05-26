import { readActiveBuckets, readArchiveStore, replaceActiveBuckets, replaceArchiveStore } from './storage';
import type { CalendarBucketType, CalendarEventRecord, CalendarVisibility, RawCalendarEvent, RepeatRule } from './types';

export interface CalendarFormSaveInput {
  type: CalendarBucketType;
  id: string;
  title: string;
  tags: string[];
  content: string;
  start: string;
  end: string;
  rule: string;
  visibility: CalendarVisibility;
  editingRecord: Pick<CalendarEventRecord, 'id'> | null;
}

export type CalendarFormSaveResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
    };

function normalizeRepeatRule(rule: string, type: CalendarBucketType): RepeatRule {
  if (type !== '重复') {
    return '无';
  }
  const allowed: RepeatRule[] = ['无', '每天', '每周', '每月', '每年', '仅工作日'];
  return allowed.includes(rule as RepeatRule) ? (rule as RepeatRule) : '每天';
}

function buildRawCalendarEvent(input: CalendarFormSaveInput): RawCalendarEvent {
  const targetType = input.rule !== '无' ? '重复' : input.type;
  return {
    标题: input.title,
    内容: input.content,
    时间: input.start,
    结束时间: input.end,
    重复规则: normalizeRepeatRule(input.rule, targetType),
    可见性: input.visibility,
    标签: input.tags,
  };
}

export async function saveCalendarForm(input: CalendarFormSaveInput): Promise<CalendarFormSaveResult> {
  if (!input.id || !input.title || !input.content || !input.start) {
    return {
      ok: false,
      message: '类型 / 标题 / 内容 / 时间 不能为空',
    };
  }

  const buckets = await readActiveBuckets();
  const temp = { ...buckets.临时 };
  const repeat = { ...buckets.重复 };
  const archive = readArchiveStore();
  const conflictInActive = Boolean(temp[input.id] || repeat[input.id]);
  const conflictInArchive = Boolean(archive.completed[input.id]);
  const isSameEditingId = Boolean(input.editingRecord && input.editingRecord.id === input.id);

  if ((conflictInActive || conflictInArchive) && !isSameEditingId) {
    return {
      ok: false,
      message: 'ID 已存在',
    };
  }

  if (input.editingRecord) {
    delete temp[input.editingRecord.id];
    delete repeat[input.editingRecord.id];
    delete archive.completed[input.editingRecord.id];
  }

  const targetBucket = input.rule !== '无' || input.type === '重复' ? repeat : temp;
  targetBucket[input.id] = buildRawCalendarEvent(input);

  replaceArchiveStore(archive);
  await replaceActiveBuckets({ 临时: temp, 重复: repeat });

  return { ok: true };
}
