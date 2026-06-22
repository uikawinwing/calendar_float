export const DEFAULT_RUNTIME_INDEX_ENTRY_NAME_CANDIDATES = [
  '[fixed_event_index]',
  'fixed_event_index',
] as const;

export function normalizeRuntimeEntryName(value: unknown): string {
  return String(value ?? '').trim();
}

export function isRuntimeEntryNameEqual(actualValue: unknown, expectedValue: unknown): boolean {
  const actual = normalizeRuntimeEntryName(actualValue);
  const expected = normalizeRuntimeEntryName(expectedValue);
  return Boolean(actual && expected && actual === expected);
}

export function isRuntimeIndexEntryName(value: unknown): boolean {
  return DEFAULT_RUNTIME_INDEX_ENTRY_NAME_CANDIDATES.some(candidate => isRuntimeEntryNameEqual(value, candidate));
}
