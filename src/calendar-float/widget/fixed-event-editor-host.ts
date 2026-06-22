import type { FixedEventIndexEditorPreviewModel, FixedEventMonthAliasDraft } from '../fixed-event-index-editor';
import type { CalendarMonthAliasRecord } from '../types';

export function createFixedEventIndexEditorLoadingModel(): FixedEventIndexEditorPreviewModel {
  return {
    loading: true,
    source: null,
    draft: null,
    yamlPreview: '',
    validation: null,
    errorMessage: '',
    saving: false,
  };
}

export function buildFixedEventMonthAliasesFromRuntime(
  monthAliases: CalendarMonthAliasRecord[],
): FixedEventMonthAliasDraft[] {
  const byMonth = new Map<number, FixedEventMonthAliasDraft>();
  for (const alias of monthAliases) {
    const month = Number(alias.month);
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      continue;
    }
    byMonth.set(month, {
      month,
      name: String(alias.label ?? '').trim(),
      season: String(alias.season ?? '').trim() || undefined,
      unknownFields: {},
    });
  }

  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    return byMonth.get(month) ?? { month, name: '', unknownFields: {} };
  });
}
