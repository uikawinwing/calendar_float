import type { FestivalRecord } from './types';

export function getFestivalLocationKeywords(festival: Pick<FestivalRecord, 'locationKeywords' | 'metadata'>): string[] {
  if (festival.locationKeywords.length) {
    return festival.locationKeywords;
  }
  const metadataKeywords = festival.metadata.locationKeywords ?? festival.metadata.地点关键词;
  if (!Array.isArray(metadataKeywords)) {
    return [];
  }
  return metadataKeywords.map(item => String(item || '').trim()).filter(Boolean);
}
