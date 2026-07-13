/**
 * 负责：把索引里的“条目引用 / 文本库引用 / 内联正文”真正解析成正文。
 * 不负责：判断条目是否该触发；它只在上游已经决定要读取时执行解析。
 */
import {
  findCalendarRuntimeEntryByReference,
} from './loader';
import { loadCalendarRuntimeWorldbookSnapshot, type CalendarRuntimeWorldbookSnapshot } from './snapshot';
import type { CalendarWorldbookReference, CalendarWorldbookSourceEntry, CalendarTextLibraryReference, CalendarRuntimeContentNode } from './types';

export interface CalendarRuntimeContentResolveResult {
  正文: string;
  来源条目名: string | null;
  警告: string[];
}

export interface CalendarRuntimeNodeTextResolveResult extends CalendarRuntimeContentResolveResult {
  文本库键: string | null;
}

function 规范化名称(value: unknown): string {
  return String(value ?? '').trim();
}

function 提取正文(entrySource: CalendarWorldbookSourceEntry | null): string {
  return String(entrySource?.条目.content ?? '').trim();
}

export function resolveCalendarRuntimeEntryContentByReference(
  entries: CalendarWorldbookSourceEntry[],
  reference: CalendarWorldbookReference | null | undefined,
): CalendarRuntimeContentResolveResult {
  if (!reference) {
    return {
      正文: '',
      来源条目名: null,
      警告: [],
    };
  }

  const matched = findCalendarRuntimeEntryByReference(entries, reference);
  if (!matched) {
    return {
      正文: '',
      来源条目名: null,
      警告: [`未找到正文条目「${reference.条目名}」${reference.世界书 ? `（世界书：${reference.世界书}）` : ''}`],
    };
  }

  return {
    正文: 提取正文(matched),
    来源条目名: matched.条目.name,
    警告: 提取正文(matched) ? [] : [`正文条目「${matched.条目.name}」为空`],
  };
}

export async function resolveCalendarRuntimeTextByLibraryReference(
  reference: CalendarTextLibraryReference | null | undefined,
  snapshot?: CalendarRuntimeWorldbookSnapshot,
): Promise<CalendarRuntimeNodeTextResolveResult> {
  if (!reference) {
    return {
      正文: '',
      来源条目名: null,
      文本库键: null,
      警告: [],
    };
  }

  const 键 = 规范化名称(reference.键);
  const runtimeSnapshot = snapshot ?? (await loadCalendarRuntimeWorldbookSnapshot());
  const library = runtimeSnapshot.readTextLibrary(reference);
  if (!键) {
    return {
      正文: '',
      来源条目名: library.命中条目名,
      文本库键: null,
      警告: [...library.警告, `文本库引用「${reference.条目名}」缺少键`],
    };
  }

  const 正文 = String(library.文本库[键] ?? '').trim();
  return {
    正文,
    来源条目名: library.命中条目名,
    文本库键: 键,
    警告: 正文 ? [...library.警告] : [...library.警告, `文本库「${reference.条目名}」中缺少键「${键}」`],
  };
}

export async function resolveCalendarRuntimeNodeText(args: {
  node: CalendarRuntimeContentNode | null | undefined;
  snapshot?: CalendarRuntimeWorldbookSnapshot;
}): Promise<CalendarRuntimeNodeTextResolveResult> {
  const node = args.node;
  if (!node || node.启用 === false) {
    return {
      正文: '',
      来源条目名: null,
      文本库键: null,
      警告: [],
    };
  }

  const inlineText = 规范化名称(node.正文);
  if (inlineText) {
    return {
      正文: inlineText,
      来源条目名: null,
      文本库键: null,
      警告: [],
    };
  }

  if (node.文本库) {
    const snapshot = args.snapshot ?? (await loadCalendarRuntimeWorldbookSnapshot());
    return resolveCalendarRuntimeTextByLibraryReference(node.文本库, snapshot);
  }

  if (!node.条目) {
    return {
      正文: '',
      来源条目名: null,
      文本库键: null,
      警告: [`节点「${node.名称 || node.id}」未配置条目、文本库或内联正文`],
    };
  }

  const snapshot = args.snapshot ?? (await loadCalendarRuntimeWorldbookSnapshot());
  const result = resolveCalendarRuntimeEntryContentByReference(snapshot.entries, node.条目);
  return {
    正文: result.正文,
    来源条目名: result.来源条目名,
    文本库键: null,
    警告: result.警告,
  };
}
