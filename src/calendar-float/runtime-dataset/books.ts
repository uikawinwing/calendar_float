import { resolveCalendarBookAbstract, resolveCalendarContentNode } from '../runtime-trigger-evaluator';
import type { CalendarRuntimeBookEntry } from '../runtime-worldbook/types';
import type { CalendarRuntimeWorldbookSnapshot } from '../runtime-worldbook/snapshot';
import type { CalendarBookRecord, DatePoint } from '../types';
import { buildRuntimeDatasetTriggerContext } from './context';

function buildBookTriggerText(book: CalendarRuntimeBookEntry): string {
  return String(book.全文?.元数据?.快速触发词 ?? '').trim() || book.全文?.条目?.条目名?.trim() || book.名称;
}

export async function buildRuntimeBookRecord(
  book: CalendarRuntimeBookEntry,
  now: DatePoint,
  snapshot?: CalendarRuntimeWorldbookSnapshot,
): Promise<CalendarBookRecord> {
  const context = buildRuntimeDatasetTriggerContext(now);
  const abstract = await resolveCalendarBookAbstract(book, context, snapshot);
  const fulltext = await resolveCalendarContentNode(book.全文, context, { ignoreTrigger: true, snapshot });
  return {
    id: book.id,
    title: book.名称,
    summary: abstract.正文 || '',
    content: fulltext.正文 || '',
    triggerText: buildBookTriggerText(book),
    worldbookEntryName: book.全文?.条目?.条目名 || book.全文?.文本库?.条目名,
  };
}
