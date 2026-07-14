/**
 * 负责：从角色 worldbook / 额外 worldbook 中读取 runtime 索引、文本库与条目来源。
 * 不负责：触发逻辑判定，也不负责 UI dataset 组装。
 * 下游：[`resolveCalendarRuntimeNodeText()`](src/calendar-float/runtime-worldbook/resolver.ts:1)、[`readCalendarRuntimeIndex()`](src/calendar-float/runtime-worldbook/loader.ts:1)、[`scanCalendarRuntimeWorldbook()`](src/calendar-float/runtime-worldbook/scanner.ts:1)。
 */
import { applyCalendarProfileConfig } from '../profile';
import { applyCalendarRuntimeDefaults } from './config';
import { DEFAULT_RUNTIME_INDEX_ENTRY_NAME_CANDIDATES, isRuntimeEntryNameEqual } from './entry-matching';
import { normalizeCalendarRuntimeIndexDocument, 提取文本库映射 } from './index-normalizer';
import {
  buildCalendarRuntimeWorldbookMoveCandidates,
  inspectCalendarRuntimeWorldbookSummaryFromRuntime,
  type CalendarRuntimeWorldbookMoveCandidate,
  type CalendarRuntimeWorldbookSummary,
} from './move-candidates';
import { 规范化名称 } from './normalizers';
import { findCalendarRuntimeEntryByReference } from './references';
import { resolveCalendarRuntimeWorldbookSources } from './source';
import { 解析Yaml文本 } from './yaml';
import {
  type CalendarWorldbookTextLibraryReadResult,
  type CalendarWorldbookSourceEntry,
  type CalendarWorldbookIndexReadResult,
  type CalendarTextLibraryReference,
  type CalendarRuntimeDiagnostic,
} from './types';
import { readCalendarSourceConfig } from '../storage';
import type { CalendarSourceConfig, ResolvedCalendarWorldbookSource } from '../types';

export { resolveCalendarRuntimeWorldbookSources } from './source';
export { normalizeCalendarRuntimeIndexDocument } from './index-normalizer';
export { findCalendarRuntimeEntryByReference, resolveCalendarRuntimeContentWorldbookNames } from './references';
export {
  type CalendarRuntimeWorldbookMoveCandidate,
  type CalendarRuntimeWorldbookSummary,
} from './move-candidates';

export interface CalendarRuntimeWorldbookEntriesResult {
  来源: ResolvedCalendarWorldbookSource[];
  条目: CalendarWorldbookSourceEntry[];
  警告: string[];
  诊断?: CalendarRuntimeDiagnostic[];
}

export async function readCalendarRuntimeWorldbookEntries(
  sourceConfig: CalendarSourceConfig = readCalendarSourceConfig(),
): Promise<CalendarRuntimeWorldbookEntriesResult> {
  const 来源 = resolveCalendarRuntimeWorldbookSources(sourceConfig);
  const warnings: string[] = [];
  const diagnostics: CalendarRuntimeDiagnostic[] = [];
  const entries: CalendarWorldbookSourceEntry[] = [];

  if (来源.length === 0) {
    const message = 'runtime worldbook 来源为空：当前 sourceConfig 没有可读取的 worldbook';
    warnings.push(message);
    diagnostics.push({ level: 'warning', code: 'runtime_worldbook_sources_empty', message });
  }

  for (const source of 来源) {
    try {
      const worldbookEntries = await getWorldbook(source.name);
      const entryNames = worldbookEntries.map(entry => 规范化名称(entry.name)).filter(Boolean);
      const message = `runtime worldbook 已读取「${source.name}」(${source.kind})：${worldbookEntries.length} 条；条目名：${
          entryNames.length > 0 ? entryNames.join('、') : '（空）'
        }`;
      diagnostics.push({ level: 'info', code: 'runtime_worldbook_source_read', message, worldbookName: source.name });
      for (const entry of worldbookEntries) {
        entries.push({ 世界书名: source.name, 条目: entry });
      }
    } catch (error) {
      const message = `读取 worldbook「${source.name}」失败：${error instanceof Error ? error.message : String(error)}`;
      warnings.push(message);
      diagnostics.push({ level: 'error', code: 'runtime_worldbook_source_read_failed', message, worldbookName: source.name });
    }
  }

  return { 来源, 条目: entries, 警告: warnings, 诊断: diagnostics };
}

function listCalendarRuntimeIndexEntryMatches(entries: CalendarWorldbookSourceEntry[]): CalendarWorldbookSourceEntry[] {
  const matches: CalendarWorldbookSourceEntry[] = [];
  const seen = new Set<string>();
  for (const candidate of DEFAULT_RUNTIME_INDEX_ENTRY_NAME_CANDIDATES) {
    for (const entry of entries) {
      if (!isRuntimeEntryNameEqual(entry.条目.name, candidate)) {
        continue;
      }
      const key = `${entry.世界书名}::${规范化名称(entry.条目.name)}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      matches.push(entry);
    }
  }
  return matches;
}

function findCalendarRuntimeIndexEntry(entries: CalendarWorldbookSourceEntry[]): CalendarWorldbookSourceEntry | null {
  return listCalendarRuntimeIndexEntryMatches(entries)[0] ?? null;
}

function 追加多索引候选警告(matches: CalendarWorldbookSourceEntry[], warnings: string[]): void {
  const selected = matches[0];
  if (!selected || matches.length <= 1) {
    return;
  }
  const others = matches.slice(1);
  warnings.push(
    `检测到多个 runtime 索引候选，当前使用「${selected.世界书名}」/${selected.条目.name}；其他候选：${others
      .map(item => `「${item.世界书名}」/${item.条目.name}`)
      .join('、')}`,
  );
}

export interface CalendarRuntimeIndexSourceCandidate {
  worldbookName: string;
  entryName: string;
}

export interface CalendarRuntimeIndexSourceEntry {
  worldbookName: string;
  entryName: string;
  content: string;
  sourceWorldbooks: string[];
  candidates: CalendarRuntimeIndexSourceCandidate[];
  warnings: string[];
}

export async function readCalendarRuntimeIndexSourceEntry(): Promise<CalendarRuntimeIndexSourceEntry | null> {
  const { 来源, 条目, 警告 } = await readCalendarRuntimeWorldbookEntries();
  const indexEntryMatches = listCalendarRuntimeIndexEntryMatches(条目);
  const indexEntry = indexEntryMatches[0] ?? null;
  追加多索引候选警告(indexEntryMatches, 警告);

  if (!indexEntry) {
    return null;
  }

  return {
    worldbookName: indexEntry.世界书名,
    entryName: indexEntry.条目.name,
    content: indexEntry.条目.content,
    sourceWorldbooks: 来源.map(item => item.name),
    candidates: indexEntryMatches.map(item => ({
      worldbookName: item.世界书名,
      entryName: item.条目.name,
    })),
    warnings: 警告,
  };
}

export async function readCalendarRuntimeIndex(): Promise<CalendarWorldbookIndexReadResult> {
  const loaded = await readCalendarRuntimeWorldbookEntries();
  return buildCalendarRuntimeIndexResultFromEntries(loaded);
}

export function buildCalendarRuntimeIndexResultFromEntries(
  loaded: CalendarRuntimeWorldbookEntriesResult,
): CalendarWorldbookIndexReadResult {
  const { 来源, 条目 } = loaded;
  const 警告 = [...loaded.警告];
  const 诊断 = [...(loaded.诊断 ?? [])];
  const indexEntryMatches = listCalendarRuntimeIndexEntryMatches(条目);
  const indexEntry = indexEntryMatches[0] ?? null;
  if (!indexEntry) {
    const 已读取条目名 = 条目.map(item => `「${item.世界书名}」/${规范化名称(item.条目.name) || '（空名）'}`);
    const missingWarnings = [
      `未找到索引条目，已尝试：${DEFAULT_RUNTIME_INDEX_ENTRY_NAME_CANDIDATES.join('、')}`,
      `本次实际读取来源：${来源.length > 0 ? 来源.map(item => `「${item.name}」(${item.kind})`).join('、') : '（无）'}`,
      `本次实际读取条目：${已读取条目名.length > 0 ? 已读取条目名.join('、') : '（无）'}`,
    ];
    return {
      索引: null,
      来源世界书: 来源.map(item => item.name),
      命中世界书名: null,
      命中条目名: null,
      警告: [
        ...警告,
        ...missingWarnings,
      ],
      诊断: [
        ...诊断,
        ...missingWarnings.map(message => ({
          level: 'warning' as const,
          code: 'runtime_worldbook_index_not_found',
          message,
        })),
      ],
    };
  }
  const warningCountBeforeIndex = 警告.length;
  追加多索引候选警告(indexEntryMatches, 警告);

  const parsed = 解析Yaml文本<unknown>(indexEntry.条目.content, `索引条目「${indexEntry.条目.name}」`, 警告);
  const normalized = parsed ? normalizeCalendarRuntimeIndexDocument(parsed, 警告) : null;
  if (normalized?.Profile || normalized?.Profile设置) {
    const profileResult = applyCalendarProfileConfig({
      profileHint: normalized.Profile,
      config: normalized.Profile设置,
    });
    警告.push(...profileResult.warnings);
  }
  applyCalendarRuntimeDefaults(normalized?.默认设置);
  if (!normalized) {
    诊断.push(
      ...警告.slice(warningCountBeforeIndex).map(message => ({
        level: 'warning' as const,
        code: 'runtime_worldbook_index_warning',
        message,
        worldbookName: indexEntry.世界书名,
        entryName: indexEntry.条目.name,
      })),
    );
    return {
      索引: null,
      来源世界书: 来源.map(item => item.name),
      命中世界书名: indexEntry.世界书名,
      命中条目名: indexEntry.条目.name,
      警告,
      诊断,
    };
  }

  诊断.push(
    ...警告.slice(warningCountBeforeIndex).map(message => ({
      level: 'warning' as const,
      code: 'runtime_worldbook_index_warning',
      message,
      worldbookName: indexEntry.世界书名,
      entryName: indexEntry.条目.name,
    })),
  );

  return {
    索引: normalized,
    来源世界书: 来源.map(item => item.name),
    命中世界书名: indexEntry.世界书名,
    命中条目名: indexEntry.条目.name,
    警告,
    诊断,
  };
}

export async function listCalendarRuntimeWorldbookMoveCandidates(): Promise<{
  candidates: CalendarRuntimeWorldbookMoveCandidate[];
  warnings: string[];
}> {
  const { 条目, 警告 } = await readCalendarRuntimeWorldbookEntries();
  const indexEntry = findCalendarRuntimeIndexEntry(条目);
  if (!indexEntry) {
    return { candidates: [], warnings: 警告 };
  }

  const parsed = 解析Yaml文本<unknown>(indexEntry.条目.content, `索引条目「${indexEntry.条目.name}」`, 警告);
  const normalized = parsed ? normalizeCalendarRuntimeIndexDocument(parsed, 警告) : null;
  return {
    candidates: buildCalendarRuntimeWorldbookMoveCandidates({ entries: 条目, indexEntry, index: normalized }),
    warnings: 警告,
  };
}

export async function inspectCalendarRuntimeWorldbookSummary(): Promise<CalendarRuntimeWorldbookSummary> {
  const { 来源, 条目, 警告 } = await readCalendarRuntimeWorldbookEntries();
  const indexEntry = findCalendarRuntimeIndexEntry(条目);
  const parsed = indexEntry ? 解析Yaml文本<unknown>(indexEntry.条目.content, `索引条目「${indexEntry.条目.name}」`, 警告) : null;
  const normalized = parsed ? normalizeCalendarRuntimeIndexDocument(parsed, 警告) : null;
  return inspectCalendarRuntimeWorldbookSummaryFromRuntime({
    sources: 来源,
    entries: 条目,
    warnings: 警告,
    indexEntry,
    index: normalized,
  });
}

export async function readCalendarRuntimeTextLibrary(
  reference: CalendarTextLibraryReference | null | undefined,
): Promise<CalendarWorldbookTextLibraryReadResult> {
  if (!reference) {
    return {
      文本库: {},
      来源: null,
      命中条目名: null,
      警告: [],
      诊断: [],
    };
  }

  const { 条目, 警告, 诊断 } = await readCalendarRuntimeWorldbookEntries();
  return readCalendarRuntimeTextLibraryFromEntries(条目, reference, 警告, 诊断 ?? []);
}

export function readCalendarRuntimeTextLibraryFromEntries(
  entries: CalendarWorldbookSourceEntry[],
  reference: CalendarTextLibraryReference,
  warnings: string[],
  diagnostics: CalendarRuntimeDiagnostic[] = warnings.map(message => ({
    level: 'warning',
    code: 'runtime_worldbook_source_warning',
    message,
  })),
): CalendarWorldbookTextLibraryReadResult {
  const matchedEntry = findCalendarRuntimeEntryByReference(entries, reference);
  if (!matchedEntry) {
    const message = `未找到文本库条目「${reference.条目名}」${reference.世界书 ? `（世界书：${reference.世界书}）` : ''}`;
    return {
      文本库: {},
      来源: reference,
      命中条目名: null,
      警告: [
        ...warnings,
        message,
      ],
      诊断: [
        ...diagnostics,
        { level: 'warning', code: 'runtime_worldbook_text_library_not_found', message, worldbookName: reference.世界书 },
      ],
    };
  }

  const resultWarnings = [...warnings];
  const resultDiagnostics = [...diagnostics];
  const warningCountBeforeParse = resultWarnings.length;
  const parsed = 解析Yaml文本<unknown>(
    matchedEntry.条目.content,
    `文本库条目「${matchedEntry.条目.name}」`,
    resultWarnings,
  );
  resultDiagnostics.push(
    ...resultWarnings.slice(warningCountBeforeParse).map(message => ({
      level: 'warning' as const,
      code: 'runtime_worldbook_text_library_parse_warning',
      message,
      worldbookName: matchedEntry.世界书名,
      entryName: matchedEntry.条目.name,
    })),
  );

  return {
    文本库: parsed ? 提取文本库映射(parsed) : {},
    来源: reference,
    命中条目名: matchedEntry.条目.name,
    警告: resultWarnings,
    诊断: resultDiagnostics,
  };
}
