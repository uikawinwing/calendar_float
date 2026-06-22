import { 规范化名称 } from './normalizers';
import { findCalendarRuntimeEntryByReference, resolveCalendarRuntimeContentWorldbookNames } from './references';
import type {
  CalendarRuntimeContentNode,
  CalendarRuntimeIndex,
  CalendarWorldbookReference,
  CalendarWorldbookSourceEntry,
} from './types';
import type { ResolvedCalendarWorldbookSource } from '../types';

export interface CalendarRuntimeWorldbookSummary {
  来源世界书: string[];
  索引世界书: string | null;
  正文世界书: string[];
  警告: string[];
}

export interface CalendarRuntimeWorldbookMoveCandidate {
  id: string;
  label: string;
  kind: 'runtime_index' | 'runtime_content';
  sourceWorldbookName: string;
  entryName: string;
  entry: WorldbookEntry;
  selectedByDefault: boolean;
}

function 构建运行时搬运候选ID(
  kind: CalendarRuntimeWorldbookMoveCandidate['kind'],
  worldbookName: string,
  entryName: string,
): string {
  return `${kind}::${worldbookName}::${entryName}`;
}

function 添加运行时搬运候选(
  target: Map<string, CalendarRuntimeWorldbookMoveCandidate>,
  args: Omit<CalendarRuntimeWorldbookMoveCandidate, 'id' | 'selectedByDefault'> & { selectedByDefault?: boolean },
): void {
  const entryName = 规范化名称(args.entryName || args.entry.name);
  const worldbookName = 规范化名称(args.sourceWorldbookName);
  if (!entryName || !worldbookName) {
    return;
  }
  const id = 构建运行时搬运候选ID(args.kind, worldbookName, entryName);
  if (target.has(id)) {
    return;
  }
  target.set(id, {
    ...args,
    id,
    sourceWorldbookName: worldbookName,
    entryName,
    selectedByDefault: args.selectedByDefault !== false,
  });
}

function 添加内容节点搬运候选(
  target: Map<string, CalendarRuntimeWorldbookMoveCandidate>,
  entries: CalendarWorldbookSourceEntry[],
  node: CalendarRuntimeContentNode | null | undefined,
  labelPrefix: string,
): void {
  if (!node || node.启用 === false) {
    return;
  }
  const refs = [node.条目, node.文本库].filter(Boolean) as CalendarWorldbookReference[];
  refs.forEach(ref => {
    const matched = findCalendarRuntimeEntryByReference(entries, ref);
    if (!matched) {
      return;
    }
    添加运行时搬运候选(target, {
      label: `${labelPrefix} / ${node.名称 || ref.条目名}`,
      kind: 'runtime_content',
      sourceWorldbookName: matched.世界书名,
      entryName: matched.条目.name,
      entry: matched.条目,
    });
  });
}

export function buildCalendarRuntimeWorldbookMoveCandidates(args: {
  entries: CalendarWorldbookSourceEntry[];
  indexEntry: CalendarWorldbookSourceEntry | null;
  index: CalendarRuntimeIndex | null;
}): CalendarRuntimeWorldbookMoveCandidate[] {
  const candidates = new Map<string, CalendarRuntimeWorldbookMoveCandidate>();
  if (!args.indexEntry) {
    return [];
  }

  添加运行时搬运候选(candidates, {
    label: `运行时索引：${args.indexEntry.条目.name}`,
    kind: 'runtime_index',
    sourceWorldbookName: args.indexEntry.世界书名,
    entryName: args.indexEntry.条目.name,
    entry: args.indexEntry.条目,
  });

  if (!args.index) {
    return [...candidates.values()];
  }

  for (const festival of args.index.节庆 ?? []) {
    if (festival.启用 === false) {
      continue;
    }
    添加内容节点搬运候选(candidates, args.entries, festival.介绍, `节庆：${festival.名称}`);
    添加内容节点搬运候选(candidates, args.entries, festival.提醒, `节庆提醒：${festival.名称}`);
    for (const textNode of festival.文本 ?? []) {
      添加内容节点搬运候选(candidates, args.entries, textNode, `节庆文本：${festival.名称}`);
    }
  }
  for (const book of args.index.书籍 ?? []) {
    if (book.启用 === false) {
      continue;
    }
    添加内容节点搬运候选(candidates, args.entries, book.摘要, `读物摘要：${book.名称}`);
    添加内容节点搬运候选(candidates, args.entries, book.全文, `读物全文：${book.名称}`);
  }

  return [...candidates.values()];
}

export function inspectCalendarRuntimeWorldbookSummaryFromRuntime(args: {
  sources: ResolvedCalendarWorldbookSource[];
  entries: CalendarWorldbookSourceEntry[];
  warnings: string[];
  indexEntry: CalendarWorldbookSourceEntry | null;
  index: CalendarRuntimeIndex | null;
}): CalendarRuntimeWorldbookSummary {
  if (!args.indexEntry) {
    return {
      来源世界书: args.sources.map(item => item.name),
      索引世界书: null,
      正文世界书: [],
      警告: args.warnings,
    };
  }

  return {
    来源世界书: args.sources.map(item => item.name),
    索引世界书: args.indexEntry.世界书名,
    正文世界书: resolveCalendarRuntimeContentWorldbookNames(args.entries, args.index, args.indexEntry.世界书名),
    警告: args.warnings,
  };
}
