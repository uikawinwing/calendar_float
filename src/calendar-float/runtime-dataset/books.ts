import { resolveCalendarBookAbstract, resolveCalendarContentNode } from '../runtime-trigger-evaluator';
import type { CalendarRuntimeBookEntry } from '../runtime-worldbook/types';
import type { CalendarBookRecord, DatePoint } from '../types';
import { buildRuntimeDatasetTriggerContext } from './context';

function buildBookTriggerText(bookTitle: string): string {
  const title = String(bookTitle || '').trim() || '未命名读物';
  return `[[打开《${title}》]]`;
}

export async function buildRuntimeBookRecord(book: CalendarRuntimeBookEntry, now: DatePoint): Promise<CalendarBookRecord> {
  const context = buildRuntimeDatasetTriggerContext(now);
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
