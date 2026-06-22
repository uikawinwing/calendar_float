/**
 * 负责：把 runtime worldbook 索引与正文解析结果，组装成 UI 直接使用的 CalendarDataset。
 * 不负责：实际触发 scan，也不负责 worldbook backend 基础设施安装。
 */
import { readCalendarRuntimeIndex, resolveCalendarRuntimeWorldbookSources } from '../runtime-worldbook';
import { normalizeCalendarMonthAliasList } from '../runtime-worldbook/month-alias';
import {
  buildSuggestionSet,
  readActiveBuckets,
  readArchiveStore,
  readCurrentWorldLocation,
  readCurrentWorldTime,
} from '../storage';
import type { CalendarDataset, FestivalRecord } from '../types';
import { mapActiveCalendarEvent, mapArchivedCalendarEvent } from './active-events';
import { buildRuntimeBookRecord } from './books';
import { buildRuntimeFestivalRecord } from './festivals';

export async function loadCalendarDatasetFromRuntimeWorldbook(): Promise<CalendarDataset> {
  const activeBuckets = await readActiveBuckets();
  const archive = readArchiveStore();
  const runtimeIndex = await readCalendarRuntimeIndex();
  const monthAliases = normalizeCalendarMonthAliasList(runtimeIndex.索引?.月份别名);
  const worldTime = readCurrentWorldTime(undefined, monthAliases);
  const currentLocationText = readCurrentWorldLocation();
  const now = worldTime.point ?? {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
  };

  const runtimeSources = resolveCalendarRuntimeWorldbookSources(archive.sources);
  const runtimeFestivals = await Promise.all(
    (runtimeIndex.索引?.节庆 ?? []).map(item => buildRuntimeFestivalRecord(item, now, archive.policy.tagColors)),
  );
  const runtimeBooks = await Promise.all((runtimeIndex.索引?.书籍 ?? []).map(item => buildRuntimeBookRecord(item, now)));

  const activeEvents = [
    ...Object.entries(activeBuckets.临时).map(([id, raw]) => mapActiveCalendarEvent('临时', id, raw, now, monthAliases)),
    ...Object.entries(activeBuckets.重复).map(([id, raw]) => mapActiveCalendarEvent('重复', id, raw, now, monthAliases)),
  ];
  const archivedEvents = Object.entries(archive.completed).map(([id, raw]) =>
    mapArchivedCalendarEvent(id, raw, now, monthAliases),
  );

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
    monthAliases,
    sourceConfig: archive.sources,
    worldbookSources: runtimeSources,
    sourceWarnings: runtimeIndex.警告,
  };
}
