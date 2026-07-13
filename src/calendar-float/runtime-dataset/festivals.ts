import { compareDatePoint, ensureRangeOrder, formatMonthDay, inferAnchorYear, parseMonthDayWithYear } from '../date';
import { resolveCalendarContentNode } from '../runtime-trigger-evaluator';
import type { CalendarRuntimeFestivalEntry, CalendarRuntimeFestivalStageEntry } from '../runtime-worldbook/types';
import type { CalendarRuntimeWorldbookSnapshot } from '../runtime-worldbook/snapshot';
import type { CalendarArchivePolicy, CalendarEventColorStyle, DatePoint, FestivalRecord, WorldbookStageRecord } from '../types';
import { buildRuntimeDatasetTriggerContext } from './context';
import { normalizeRuntimeMonthDayText } from './date-utils';

function readUiSummary(metadata: Record<string, unknown> | undefined): string {
  return String(metadata?.简介 ?? metadata?.summary ?? metadata?.uiSummary ?? '').trim();
}

export function readRuntimeFestivalLocationKeywords(festival: CalendarRuntimeFestivalEntry): string[] {
  const values = [
    ...(festival.地点关键词 ?? []),
    ...(Array.isArray(festival.元数据?.地点关键词) ? festival.元数据.地点关键词 : []),
  ];
  return values
    .map(item => String(item || '').trim())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index);
}

function resolveFestivalHashtagColor(args: {
  festivalName: string;
  groupId: string;
  groupName: string;
  locationKeywords: string[];
  tagColors: CalendarArchivePolicy['tagColors'];
}): CalendarEventColorStyle | undefined {
  const candidates = [args.festivalName, args.groupName, args.groupId, ...args.locationKeywords]
    .map(value => String(value || '').trim())
    .filter(Boolean);
  for (const candidate of candidates) {
    const color = args.tagColors[candidate];
    if (color) {
      return color;
    }
  }
  return undefined;
}

function isFestivalOccurrenceYear(year: number, recurrence?: CalendarRuntimeFestivalEntry['周期']): boolean {
  if (!recurrence) {
    return true;
  }
  const intervalYears = Math.floor(Number(recurrence.每隔年));
  const lastYear = Math.floor(Number(recurrence.上次年份));
  if (!Number.isFinite(intervalYears) || intervalYears <= 1 || !Number.isFinite(lastYear)) {
    return true;
  }
  return (year - lastYear) % intervalYears === 0;
}

function getNearestFestivalOccurrenceYear(year: number, recurrence?: CalendarRuntimeFestivalEntry['周期']): number {
  if (!recurrence || isFestivalOccurrenceYear(year, recurrence)) {
    return year;
  }
  const intervalYears = Math.floor(Number(recurrence.每隔年));
  const lastYear = Math.floor(Number(recurrence.上次年份));
  if (!Number.isFinite(intervalYears) || intervalYears <= 1 || !Number.isFinite(lastYear)) {
    return year;
  }
  const remainder = (((year - lastYear) % intervalYears) + intervalYears) % intervalYears;
  const previous = year - remainder;
  const next = previous + intervalYears;
  return Math.abs(year - previous) <= Math.abs(next - year) ? previous : next;
}

export function buildFestivalDateRange(festival: CalendarRuntimeFestivalEntry, now: DatePoint) {
  const startText = normalizeRuntimeMonthDayText(String(festival.开始 || ''));
  const endText = normalizeRuntimeMonthDayText(String(festival.结束 || festival.开始 || ''));
  if (!startText || !endText) {
    return null;
  }

  const startMonth = Number(startText.split('-')[0]);
  const occurrenceYear = getNearestFestivalOccurrenceYear(inferAnchorYear(now, startMonth), festival.周期);
  const start = parseMonthDayWithYear(startText, occurrenceYear);
  let end = parseMonthDayWithYear(endText, occurrenceYear);
  if (!start || !end) {
    return null;
  }
  if (compareDatePoint(end, start) < 0) {
    end = parseMonthDayWithYear(endText, occurrenceYear + 1);
    if (!end) {
      return null;
    }
  }

  return {
    startText,
    endText,
    range: ensureRangeOrder({ start, end }),
  };
}

export function buildRuntimeStageRecord(
  festival: CalendarRuntimeFestivalEntry,
  stage: CalendarRuntimeFestivalStageEntry,
  now: DatePoint,
  index: number,
): WorldbookStageRecord | null {
  const dateRange = buildFestivalDateRange(
    {
      ...festival,
      开始: stage.开始,
      结束: stage.结束 || stage.开始,
      周期: stage.周期 ?? festival.周期,
    },
    now,
  );
  if (!dateRange) {
    return null;
  }

  return {
    phaseId: stage.id,
    dayIndex: index + 1,
    title: stage.名称,
    summary: stage.名称,
    startText: dateRange.startText,
    endText: dateRange.endText,
    range: dateRange.range,
  };
}

export async function buildRuntimeFestivalRecord(
  festival: CalendarRuntimeFestivalEntry,
  now: DatePoint,
  tagColors: CalendarArchivePolicy['tagColors'],
  snapshot?: CalendarRuntimeWorldbookSnapshot,
): Promise<FestivalRecord | null> {
  const dateRange = buildFestivalDateRange(festival, now);
  if (!dateRange) {
    return null;
  }

  const context = buildRuntimeDatasetTriggerContext(now);
  const intro = await resolveCalendarContentNode(festival.介绍, context, { ignoreTrigger: true, snapshot });
  const entryName = festival.介绍?.条目?.条目名 || festival.介绍?.文本库?.条目名;
  const uiSummary = readUiSummary(festival.介绍?.元数据);
  const introText = uiSummary || intro.正文 || festival.名称;
  const locationKeywords = readRuntimeFestivalLocationKeywords(festival);
  const groupId = String(festival.元数据?.分组 ?? '').trim();
  const groupName = String(festival.元数据?.分组名称 ?? '').trim();
  const groupIconSvgFilename = String(festival.元数据?.分组图标 ?? '').trim();
  const tagColor = resolveFestivalHashtagColor({
    festivalName: festival.名称,
    groupId,
    groupName,
    locationKeywords,
    tagColors,
  });
  const stages = (festival.阶段 ?? [])
    .filter(stage => stage.启用 !== false)
    .map((stage, index) => buildRuntimeStageRecord(festival, stage, now, index))
    .filter((stage): stage is WorldbookStageRecord => Boolean(stage));
  return {
    id: festival.id,
    title: festival.名称,
    summary: introText,
    content: introText,
    entryName,
    startText: dateRange.startText,
    endText: dateRange.endText,
    sourceKind: 'worldbook',
    recurrence: festival.周期 ? { intervalYears: festival.周期.每隔年, lastYear: festival.周期.上次年份 } : undefined,
    relatedBookIds: [...(festival.相关书籍 ?? [])],
    locationKeywords,
    stages,
    range: dateRange.range,
    metadata: {
      source: 'runtime_worldbook',
      monthDayRange: `${formatMonthDay(dateRange.range.start)}~${formatMonthDay(dateRange.range.end)}`,
      ...(festival.周期 ? { recurrence: festival.周期 } : {}),
      ...(locationKeywords.length > 0 ? { locationKeywords, 地点关键词: locationKeywords } : {}),
      ...(groupId ? { 分组: groupId, groupId } : {}),
      ...(groupName ? { 分组名称: groupName, groupName } : {}),
      ...(groupIconSvgFilename ? { 分组图标: groupIconSvgFilename, groupIconSvgFilename } : {}),
      ...(tagColor ? { tagColor, hashtagColor: tagColor } : {}),
      introWarnings: intro.警告,
      original: festival,
    },
  };
}
