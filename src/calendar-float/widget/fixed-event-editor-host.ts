import {
  serializeFixedEventIndexDraft,
  validateFixedEventIndexDraft,
  type FixedEventIndexEditorPreviewModel,
  type FixedEventMonthAliasDraft,
} from '../fixed-event-index-editor';
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

export function hydrateFixedEventIndexMonthAliasesFromRuntime(
  model: FixedEventIndexEditorPreviewModel,
  monthAliases: CalendarMonthAliasRecord[],
): FixedEventIndexEditorPreviewModel {
  const runtimeAliases = buildFixedEventMonthAliasesFromRuntime(monthAliases);
  if (!model.draft || model.draft.monthAliases.length > 0 || runtimeAliases.length === 0) {
    return model;
  }
  const draft = {
    ...model.draft,
    monthAliases: runtimeAliases,
    warnings: [...model.draft.warnings, '当前索引未写入月份别名，已自动回填 1-12 月；保存后会写回世界书。'],
  };
  return {
    ...model,
    draft,
    validation: validateFixedEventIndexDraft(draft),
    yamlPreview: serializeFixedEventIndexDraft(draft),
    saveMessage: model.saveMessage ?? '已自动回填月份别名，尚未保存到世界书',
    saveState: model.saveState ?? 'warning',
  };
}
