/**
 * 负责：把 runtime worldbook 索引与正文解析结果，组装成 UI 直接使用的 CalendarDataset。
 * 不负责：实际触发 scan，也不负责 worldbook backend 基础设施安装。
 * 上游依赖：[`./runtime-worldbook`](src/calendar-float/runtime-worldbook/index.ts) 与 [`./runtime-trigger-evaluator`](src/calendar-float/runtime-trigger-evaluator/index.ts)。
 */
import {
  compareDatePoint,
  ensureRangeOrder,
  formatMonthDay,
  inferAnchorYear,
  normalizeMonthDayText,
  parseMonthDayWithYear,
  parseWorldDateText,
} from './date';
import {
  resolveCalendarBookAbstract,
  resolveCalendarContentNode,
  type CalendarRuntimeTriggerContext,
} from './runtime-trigger-evaluator';
import { readCalendarRuntimeIndex, resolveCalendarRuntimeWorldbookSources } from './runtime-worldbook';
import type { CalendarRuntimeBookEntry, CalendarRuntimeFestivalStageEntry, CalendarRuntimeFestivalEntry } from './runtime-worldbook/types';
import {
  buildSuggestionSet,
  collectEventTags,
  readActiveBuckets,
  readArchiveStore,
  readCurrentWorldLocation,
  readCurrentWorldTime,
  resolveCalendarEventColor,
} from './storage';
import type {
  ArchivedCalendarEvent,
  CalendarBookRecord,
  CalendarDataset,
  CalendarEventRecord,
  DatePoint,
  FestivalRecord,
  RawCalendarEvent,
  WorldbookStageRecord,
} from './types';

function buildRuntimeContext(now: DatePoint): CalendarRuntimeTriggerContext {
  return {
    当前日期: now,
    最近消息文本: [],
    变量表: {},
  };
}

function readUiSummary(metadata: Record<string, unknown> | undefined): string {
  return String(metadata?.简介 ?? metadata?.summary ?? metadata?.uiSummary ?? '').trim();
}

function buildBookTriggerText(bookTitle: string): string {
  const title = String(bookTitle || '').trim() || '未命名读物';
  return `[[打开《${title}》]]`;
}

function readFestivalLocationKeywords(festival: CalendarRuntimeFestivalEntry): string[] {
  const values = [
    ...(festival.地点关键词 ?? []),
    ...(Array.isArray(festival.元数据?.地点关键词) ? festival.元数据.地点关键词 : []),
  ];
  return values
    .map(item => String(item || '').trim())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index);
}

function parseEventTextToPoint(text: string, now: DatePoint): DatePoint | null {
  const normalized = String(text || '').trim();
  if (!normalized) {
    return null;
  }

  const worldDate = parseWorldDateText(normalized);
  if (worldDate) {
    return worldDate;
  }

  const full = normalized.match(/(\d+)[/-](\d{1,2})[/-](\d{1,2})/);
  if (full) {
    return {
      year: Number(full[1]),
      month: Number(full[2]),
      day: Number(full[3]),
    };
  }

  const monthDay = normalized.match(/(\d{1,2})[-/月](\d{1,2})日?/);
  if (!monthDay) {
    return null;
  }
  return parseMonthDayWithYear(`${monthDay[1]}-${monthDay[2]}`, now.year);
}

function mapActiveEvent(type: '临时' | '重复', id: string, raw: RawCalendarEvent, now: DatePoint): CalendarEventRecord {
  const start = parseEventTextToPoint(raw.时间 || '', now);
  const end = parseEventTextToPoint(raw.结束时间 || raw.时间 || '', now);
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
    range: start && end ? { start, end: compareDatePoint(start, end) <= 0 ? end : start } : undefined,
    relatedBookIds: [],
    metadata: {},
    color: resolveCalendarEventColor(id, {
      标题: String(raw.标题 || ''),
      内容: String(raw.内容 || ''),
      标签: raw.标签,
    }),
  };
}

function mapArchivedEvent(id: string, raw: ArchivedCalendarEvent, now: DatePoint): CalendarEventRecord {
  const start = parseEventTextToPoint(raw.时间 || '', now);
  const end = parseEventTextToPoint(raw.结束时间 || raw.时间 || '', now);
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
    range: start && end ? { start, end: compareDatePoint(start, end) <= 0 ? end : start } : undefined,
    relatedBookIds: [],
    metadata: {
      archived_at: raw.archived_at,
      completed_at: raw.completed_at,
    },
    color: resolveCalendarEventColor(id, raw),
  };
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

function buildFestivalRange(festival: CalendarRuntimeFestivalEntry, now: DatePoint) {
  const startText = normalizeMonthDayText(String(festival.开始 || ''));
  const endText = normalizeMonthDayText(String(festival.结束 || festival.开始 || ''));
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

function buildRuntimeStageRecord(
  festival: CalendarRuntimeFestivalEntry,
  stage: CalendarRuntimeFestivalStageEntry,
  now: DatePoint,
  index: number,
): WorldbookStageRecord | null {
  const dateRange = buildFestivalRange(
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

async function buildRuntimeFestivalRecord(
  festival: CalendarRuntimeFestivalEntry,
  now: DatePoint,
): Promise<FestivalRecord | null> {
  const dateRange = buildFestivalRange(festival, now);
  if (!dateRange) {
    return null;
  }

  const context = buildRuntimeContext(now);
  const intro = await resolveCalendarContentNode(festival.介绍, context, { ignoreTrigger: true });
  const entryName = festival.介绍?.条目?.条目名 || festival.介绍?.文本库?.条目名;
  const uiSummary = readUiSummary(festival.介绍?.元数据);
  const introText = uiSummary || intro.正文 || festival.名称;
  const locationKeywords = readFestivalLocationKeywords(festival);
  const groupId = String(festival.元数据?.分组 ?? '').trim();
  const groupName = String(festival.元数据?.分组名称 ?? '').trim();
  const groupIconSvgFilename = String(festival.元数据?.分组图标 ?? '').trim();
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
      introWarnings: intro.警告,
      original: festival,
    },
  };
}

async function buildRuntimeBookRecord(book: CalendarRuntimeBookEntry, now: DatePoint): Promise<CalendarBookRecord> {
  const context = buildRuntimeContext(now);
  const abstract = await resolveCalendarBookAbstract(book, context);
  const fulltext = await resolveCalendarContentNode(book.全文, context, { ignoreTrigger: true });
  return {
    id: book.id,
    title: book.名称,
    summary: abstract.正文 || '',
    content: fulltext.正文 || '',
    triggerText: buildBookTriggerText(book.名称),
    worldbookEntryName: book.全文?.条目?.条目名 || book.全文?.文本库?.条目名,
  };
}

export async function loadCalendarDatasetFromRuntimeWorldbook(): Promise<CalendarDataset> {
  const activeBuckets = await readActiveBuckets();
  const archive = readArchiveStore();
  const runtimeIndex = await readCalendarRuntimeIndex();
  const worldTime = readCurrentWorldTime();
  const currentLocationText = readCurrentWorldLocation();
  const now = worldTime.point ?? {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
  };

  const runtimeSources = resolveCalendarRuntimeWorldbookSources(archive.sources);
  const runtimeFestivals = await Promise.all(
    (runtimeIndex.索引?.节庆 ?? []).map(item => buildRuntimeFestivalRecord(item, now)),
  );
  const runtimeBooks = await Promise.all(
    (runtimeIndex.索引?.书籍 ?? []).map(item => buildRuntimeBookRecord(item, now)),
  );

  const activeEvents = [
    ...Object.entries(activeBuckets.临时).map(([id, raw]) => mapActiveEvent('临时', id, raw, now)),
    ...Object.entries(activeBuckets.重复).map(([id, raw]) => mapActiveEvent('重复', id, raw, now)),
  ];
  const archivedEvents = Object.entries(archive.completed).map(([id, raw]) => mapArchivedEvent(id, raw, now));

  return {
    nowText: worldTime.text,
    nowDate: worldTime.point ?? undefined,
    calendarAnchor: worldTime.anchor ?? undefined,
    currentLocationText,
    activeEvents,
    archivedEvents,
    festivals: runtimeFestivals.filter((value): value is FestivalRecord => Boolean(value)),
    books: Object.fromEntries(runtimeBooks.map(book => [book.id, book])),
    suggestions: buildSuggestionSet({ activeBuckets, archive }),
    monthAliases:
      runtimeIndex.索引?.月份别名?.map(item => ({
        month: Number(item.月份),
        label: String(item.名称 || '').trim(),
        season: String(item.季节 || '').trim() || undefined,
      })) ?? [],
    sourceConfig: archive.sources,
    worldbookSources: runtimeSources,
    sourceWarnings: runtimeIndex.警告,
  };
}
