/**
 * 负责：把 runtime worldbook 索引与正文解析结果，组装成 UI 直接使用的 CalendarDataset。
 * 不负责：实际触发 scan，也不负责 worldbook backend 基础设施安装。
 */
import {
  loadCalendarRuntimeWorldbookSnapshot,
  type CalendarRuntimeWorldbookSnapshot,
} from '../runtime-worldbook/snapshot';
import { normalizeCalendarMonthAliasList } from '../runtime-worldbook/month-alias';
import { isCalendarEventVisibleToPlayer } from '../event-visibility';
import {
  buildSuggestionSet,
  readActiveBuckets,
  readCalendarSettings,
  readCurrentWorldLocation,
  readCurrentWorldTime,
} from '../storage';
import type { CalendarDataset, FestivalRecord } from '../types';
import { mapActiveCalendarEvent } from './active-events';
import { buildRuntimeBookRecord } from './books';
import { buildRuntimeFestivalRecord } from './festivals';

export async function loadCalendarDatasetFromRuntimeWorldbook(
  snapshot?: CalendarRuntimeWorldbookSnapshot,
): Promise<CalendarDataset> {
  const settings = readCalendarSettings();
  const runtimeSnapshot = snapshot ?? (await loadCalendarRuntimeWorldbookSnapshot(settings.sources));
  const activeBuckets = await readActiveBuckets();
  const runtimeIndex = runtimeSnapshot.indexResult;
  const monthAliases = normalizeCalendarMonthAliasList(runtimeIndex.索引?.月份别名);
  const worldTime = readCurrentWorldTime(undefined, monthAliases);
  const currentLocationText = readCurrentWorldLocation();
  if (!worldTime.point) {
    throw new Error(`当前世界时间无法解析：${worldTime.text || '（空）'}。月历停止构建，避免误用现实日期。`);
  }
  const now = worldTime.point;

  const runtimeSources = runtimeSnapshot.sources;
  const runtimeFestivals = await Promise.all(
    (runtimeIndex.索引?.节庆 ?? []).map(item =>
      buildRuntimeFestivalRecord(item, now, settings.tagColors, runtimeSnapshot),
    ),
  );
  const runtimeBooks = await Promise.all(
    (runtimeIndex.索引?.书籍 ?? []).map(item => buildRuntimeBookRecord(item, now, runtimeSnapshot)),
  );

  const activeEvents = [
    ...Object.entries(activeBuckets.临时)
      .filter(([, raw]) => isCalendarEventVisibleToPlayer(raw))
      .map(([id, raw]) => mapActiveCalendarEvent('临时', id, raw, now, monthAliases)),
    ...Object.entries(activeBuckets.重复)
      .filter(([, raw]) => isCalendarEventVisibleToPlayer(raw))
      .map(([id, raw]) => mapActiveCalendarEvent('重复', id, raw, now, monthAliases)),
  ];

  return {
    nowText: worldTime.text,
    nowDate: worldTime.point,
    calendarAnchor: worldTime.anchor ?? undefined,
    currentLocationText,
    activeEvents,
    archivedEvents: [],
    festivals: runtimeFestivals.filter((value): value is FestivalRecord => Boolean(value)),
    books: Object.fromEntries(runtimeBooks.map(book => [book.id, book])),
    suggestions: buildSuggestionSet({ activeBuckets, settings }),
    monthAliases,
    sourceConfig: settings.sources,
    worldbookSources: runtimeSources,
    sourceWarnings: [...runtimeIndex.警告],
  };
}
