import { getFestivalLocationKeywords } from '../festival-location';
import type { CalendarDataset, FestivalRecord } from '../types';

export function normalizeLocationMatchText(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

export function splitLocationTerms(value: string): string[] {
  return String(value || '')
    .split(/[，,、;；/|>\\\n\r\t -]+/)
    .map(item => item.trim())
    .filter(Boolean);
}

export function isLocationMatch(left: string, right: string): boolean {
  const normalizedLeft = normalizeLocationMatchText(left);
  const normalizedRight = normalizeLocationMatchText(right);
  if (!normalizedLeft || !normalizedRight) {
    return false;
  }
  return normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft);
}

export function buildLocalFestivalSearchTerms(dataset: Pick<CalendarDataset, 'currentLocationText'>): string[] {
  const terms = new Set<string>(
    [dataset.currentLocationText, ...splitLocationTerms(dataset.currentLocationText)]
      .map(item => item.trim())
      .filter(Boolean),
  );
  return Array.from(terms);
}

export function isFestivalVisibleInLocalScope(festival: FestivalRecord, localTerms: string[]): boolean {
  const keywords = getFestivalLocationKeywords(festival);
  if (!keywords.length || localTerms.length === 0) {
    return true;
  }
  return keywords.some(keyword => localTerms.some(term => isLocationMatch(term, keyword)));
}
