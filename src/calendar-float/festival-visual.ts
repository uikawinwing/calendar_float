import { BUNDLED_FESTIVAL_ICON_BY_FILENAME, champagneGlassesIconSvg } from './festival-icons';
import type { CalendarFestivalMarkerPreset, CalendarFestivalMarkerPresetGroup } from './festival-visual-types';
import { getFestivalLocationKeywords } from './festival-location';
import { getActiveCalendarProfile } from './profile';
import type { CalendarProfileVisualSettings } from './profile/types';
import { buildFestivalMarkerPresetGroup } from './profile/festival-visual-presets';
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

// 仅缓存当前配置的 SVG 派生结果；索引重载会替换配置对象，不缓存世界书内容。
let visualSettings: CalendarProfileVisualSettings | undefined;
let markerGroup: CalendarFestivalMarkerPresetGroup;

function getActiveFestivalMarkerPresetGroup(): CalendarFestivalMarkerPresetGroup {
  const settings = getActiveCalendarProfile().visual;
  if (visualSettings !== settings) {
    markerGroup = buildFestivalMarkerPresetGroup(settings);
    visualSettings = settings;
  }
  return markerGroup;
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
          normalizedKeyword.includes(normalizedPresetKeyword) || normalizedPresetKeyword.includes(normalizedKeyword)
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
    findPresetByOrderedKeywords([normalizedTag], getActiveFestivalMarkerPresetGroup().tagPresets) ??
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
  const fallback =
    presetGroup.fallbackMarkers[hashText(keywords[0] || festival.id) % presetGroup.fallbackMarkers.length];
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
