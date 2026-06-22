import { isRuntimeEntryNameEqual } from './entry-matching';
import { 规范化名称 } from './normalizers';
import type {
  CalendarRuntimeContentNode,
  CalendarRuntimeIndex,
  CalendarWorldbookReference,
  CalendarWorldbookSourceEntry,
} from './types';

function 收集内容节点引用(node: CalendarRuntimeContentNode | null | undefined, target: CalendarWorldbookReference[]): void {
  if (!node || node.启用 === false) {
    return;
  }
  if (node.条目) {
    target.push(node.条目);
  }
  if (node.文本库) {
    target.push(node.文本库);
  }
}

function 收集索引正文引用(index: CalendarRuntimeIndex | null): CalendarWorldbookReference[] {
  const refs: CalendarWorldbookReference[] = [];
  if (!index) {
    return refs;
  }

  for (const festival of index.节庆 ?? []) {
    if (festival.启用 === false) {
      continue;
    }
    收集内容节点引用(festival.介绍, refs);
    收集内容节点引用(festival.提醒, refs);
    for (const textNode of festival.文本 ?? []) {
      收集内容节点引用(textNode, refs);
    }
  }
  for (const book of index.书籍 ?? []) {
    if (book.启用 === false) {
      continue;
    }
    收集内容节点引用(book.摘要, refs);
    收集内容节点引用(book.全文, refs);
  }

  return refs;
}

export function resolveCalendarRuntimeContentWorldbookNames(
  entries: CalendarWorldbookSourceEntry[],
  index: CalendarRuntimeIndex | null,
  fallbackWorldbookName: string | null,
): string[] {
  const refs = 收集索引正文引用(index);
  const names: string[] = [];
  const seen = new Set<string>();
  const add = (name: string | null | undefined): void => {
    const normalized = 规范化名称(name);
    if (!normalized || seen.has(normalized)) {
      return;
    }
    seen.add(normalized);
    names.push(normalized);
  };

  for (const ref of refs) {
    add(findCalendarRuntimeEntryByReference(entries, ref)?.世界书名);
  }
  if (names.length === 0 && ((index?.节庆?.length ?? 0) > 0 || (index?.书籍?.length ?? 0) > 0)) {
    add(fallbackWorldbookName);
  }
  return names;
}

export function findCalendarRuntimeEntryByReference(
  entries: CalendarWorldbookSourceEntry[],
  reference: CalendarWorldbookReference | null | undefined,
): CalendarWorldbookSourceEntry | null {
  if (!reference) {
    return null;
  }

  const targetName = 规范化名称(reference.条目名);
  const targetWorldbook = 规范化名称(reference.世界书);
  if (!targetName) {
    return null;
  }

  for (const entry of entries) {
    if (targetWorldbook && entry.世界书名 !== targetWorldbook) {
      continue;
    }
    if (isRuntimeEntryNameEqual(entry.条目.name, targetName)) {
      return entry;
    }
  }

  return null;
}
