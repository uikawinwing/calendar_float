import {
  alarmClockIconSvg,
  arrowsToCircleIconSvg,
  bookIconSvg,
  calendarIconSvg,
  champagneGlassesIconSvg,
  chessIconSvg,
  compassIconSvg,
  crownIconSvg,
  fortIconSvg,
  heartIconSvg,
  BUNDLED_FESTIVAL_ICON_BY_FILENAME,
  suitcaseIconSvg,
} from './festival-icons';
import type { CalendarFestivalMarkerPreset, CalendarFestivalMarkerPresetGroup } from './festival-visual-types';
import { getFestivalLocationKeywords } from './festival-location';
import { getActiveCalendarProfile } from './profile';
import { getCalendarProfileFestivalMarkerPresetGroup } from './profile/festival-visual-presets';
import type { CalendarEventColorStyle, DayCellFestivalMarker, FestivalRecord } from './types';

type FestivalVisualSource = Pick<
  FestivalRecord,
  'id' | 'title' | 'summary' | 'content' | 'locationKeywords' | 'metadata'
>;

function hashText(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function readMetadataColor(value: unknown): CalendarEventColorStyle | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  const background = String(record.background ?? '').trim();
  const text = String(record.text ?? '').trim();
  const border = String(record.border ?? '').trim();
  return background && text ? { background, text, ...(border ? { border } : {}) } : undefined;
}

const HASHTAG_MARKER_PRESETS: CalendarFestivalMarkerPreset[] = [
  {
    iconSvg: compassIconSvg,
    color: { background: '#dcecff', text: '#305d97', border: '#a8c7ed' },
    keywords: ['主线'],
  },
  {
    iconSvg: arrowsToCircleIconSvg,
    color: { background: '#e9e2ff', text: '#5c4a98', border: '#c8bbf4' },
    keywords: ['支线'],
  },
  {
    iconSvg: champagneGlassesIconSvg,
    color: { background: '#ffe6a6', text: '#895710', border: '#e8bf59' },
    keywords: ['节庆'],
  },
  {
    iconSvg: bookIconSvg,
    color: { background: '#dff4e8', text: '#2f7048', border: '#a9d9b9' },
    keywords: ['课程'],
  },
  {
    iconSvg: suitcaseIconSvg,
    color: { background: '#dff2f3', text: '#2d6f73', border: '#a7d4d7' },
    keywords: ['旅行'],
  },
  {
    iconSvg: alarmClockIconSvg,
    color: { background: '#f1e6d8', text: '#73583c', border: '#d3bea6' },
    keywords: ['限时'],
  },
  {
    iconSvg: heartIconSvg,
    color: { background: '#ffe1eb', text: '#9a3d61', border: '#efadc2' },
    keywords: ['约会'],
  },
  {
    iconSvg: chessIconSvg,
    color: { background: '#ffe3cf', text: '#9a4b20', border: '#efb186' },
    keywords: ['比赛'],
  },
  {
    iconSvg: calendarIconSvg,
    color: { background: '#fff0c9', text: '#7a5916', border: '#e8bf59' },
    keywords: ['纪念'],
  },
];

const GENERIC_FALLBACK_FESTIVAL_MARKERS: Array<DayCellFestivalMarker['color'] & { iconSvg: string }> = [
  { iconSvg: fortIconSvg, background: '#ffcdd4', text: '#9f2834', border: '#fb7185' },
  { iconSvg: champagneGlassesIconSvg, background: '#fff0c9', text: '#8a5a00', border: '#f2c55c' },
  { iconSvg: crownIconSvg, background: '#fff0b8', text: '#895710', border: '#facc15' },
];

const GENERIC_FESTIVAL_MARKER_PRESET_GROUP: CalendarFestivalMarkerPresetGroup = {
  markerPresets: [],
  locationPresets: [],
  fallbackMarkers: GENERIC_FALLBACK_FESTIVAL_MARKERS,
};

function getActiveFestivalMarkerPresetGroup(): CalendarFestivalMarkerPresetGroup {
  const presetId = getActiveCalendarProfile().visual?.festivalMarkerPresetId;
  return getCalendarProfileFestivalMarkerPresetGroup(presetId) ?? GENERIC_FESTIVAL_MARKER_PRESET_GROUP;
}

function findPresetByOrderedKeywords(
  keywords: string[],
  presets: readonly CalendarFestivalMarkerPreset[],
): CalendarFestivalMarkerPreset | undefined {
  for (const keyword of keywords) {
    const normalizedKeyword = keyword.toLowerCase();
    const preset = presets.find(item =>
      item.keywords.some(presetKeyword => {
        const normalizedPresetKeyword = presetKeyword.toLowerCase();
        return (
          normalizedKeyword.includes(normalizedPresetKeyword) ||
          normalizedPresetKeyword.includes(normalizedKeyword)
        );
      }),
    );
    if (preset) {
      return preset;
    }
  }
  return undefined;
}

function getExplicitBundledIconSvg(festival: Pick<FestivalRecord, 'metadata'>): string | undefined {
  const filename = String(festival.metadata.groupIconSvgFilename ?? festival.metadata.分组图标 ?? '').trim();
  return filename ? BUNDLED_FESTIVAL_ICON_BY_FILENAME.get(filename) : undefined;
}

export function buildFestivalTagPreviewMarker(
  tag: string,
  color: CalendarEventColorStyle,
): Pick<DayCellFestivalMarker, 'iconSvg' | 'iconColor' | 'color'> {
  const normalizedTag = String(tag || '').trim();
  const profilePresets = getActiveFestivalMarkerPresetGroup().markerPresets;
  const preset =
    findPresetByOrderedKeywords([normalizedTag], HASHTAG_MARKER_PRESETS) ??
    findPresetByOrderedKeywords([normalizedTag], profilePresets);
  return {
    iconSvg: preset?.iconSvg ?? champagneGlassesIconSvg,
    iconColor: color.text,
    color,
  };
}

export function buildFestivalMarker(festival: FestivalVisualSource): DayCellFestivalMarker {
  const keywords = getFestivalLocationKeywords(festival);
  const searchableText = [festival.title, festival.summary, festival.content, ...keywords].join('|').toLowerCase();
  const presetGroup = getActiveFestivalMarkerPresetGroup();
  const locationPreset = findPresetByOrderedKeywords(keywords, presetGroup.locationPresets);
  const textPreset = presetGroup.markerPresets.find(item =>
    item.keywords.some(keyword => searchableText.includes(keyword.toLowerCase())),
  );
  const preset = locationPreset ?? textPreset;
  const fallback = presetGroup.fallbackMarkers[hashText(keywords[0] || festival.id) % presetGroup.fallbackMarkers.length];
  const explicitIconSvg = getExplicitBundledIconSvg(festival);
  const customColor = readMetadataColor(festival.metadata.tagColor ?? festival.metadata.hashtagColor);
  const markerColor = customColor ?? preset?.color ?? fallback;
  return {
    id: festival.id,
    title: festival.title,
    iconSvg: explicitIconSvg ?? preset?.iconSvg ?? fallback.iconSvg,
    iconColor: markerColor.text,
    color: markerColor,
  };
}
