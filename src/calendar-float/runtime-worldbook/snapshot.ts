/**
 * 负责：持有一次 runtime worldbook 操作内的来源、条目、索引与文本库解析快照。
 * 不负责：跨操作缓存，也不作为 runtime-worldbook public facade 导出。
 * 上游：[`readCalendarRuntimeWorldbookEntries()`](src/calendar-float/runtime-worldbook/loader.ts:1)。
 */
import { readCalendarSourceConfig } from '../storage';
import type { CalendarSourceConfig, ResolvedCalendarWorldbookSource } from '../types';
import {
  buildCalendarRuntimeIndexResultFromEntries,
  readCalendarRuntimeTextLibraryFromEntries,
  readCalendarRuntimeWorldbookEntries,
} from './loader';
import type {
  CalendarTextLibraryReference,
  CalendarWorldbookIndexReadResult,
  CalendarWorldbookSourceEntry,
  CalendarWorldbookTextLibraryReadResult,
} from './types';

export interface CalendarRuntimeWorldbookSnapshot {
  sources: ResolvedCalendarWorldbookSource[];
  entries: CalendarWorldbookSourceEntry[];
  indexResult: CalendarWorldbookIndexReadResult;
  warnings: string[];
  readTextLibrary(reference: CalendarTextLibraryReference): CalendarWorldbookTextLibraryReadResult;
}

export async function loadCalendarRuntimeWorldbookSnapshot(
  sourceConfig: CalendarSourceConfig = readCalendarSourceConfig(),
): Promise<CalendarRuntimeWorldbookSnapshot> {
  const loaded = await readCalendarRuntimeWorldbookEntries(sourceConfig);
  const indexResult = buildCalendarRuntimeIndexResultFromEntries(loaded);
  const textLibraryCache = new Map<string, CalendarWorldbookTextLibraryReadResult>();

  return {
    sources: loaded.来源,
    entries: loaded.条目,
    indexResult,
    warnings: [...loaded.警告],
    readTextLibrary(reference) {
      const key = JSON.stringify([reference.世界书?.trim() ?? '', reference.条目名.trim()]);
      const cached = textLibraryCache.get(key);
      if (cached) {
        return cached;
      }
      const result = readCalendarRuntimeTextLibraryFromEntries(loaded.条目, reference, loaded.警告);
      textLibraryCache.set(key, result);
      return result;
    },
  };
}
