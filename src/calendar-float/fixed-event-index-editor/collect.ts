import type { FixedEventMonthAliasStructuredEdit } from './edit';

export function collectMonthAliasStructuredEdits(
  monthAliases: ReadonlyArray<FixedEventMonthAliasStructuredEdit>,
): FixedEventMonthAliasStructuredEdit[] | undefined {
  if (monthAliases.length === 0) {
    return undefined;
  }
  return monthAliases.filter(alias => alias.name.trim() || String(alias.season ?? '').trim());
}
