import { BUNDLED_FESTIVAL_ICON_BY_FILENAME, calendarIconSvg } from '../festival-icons';
import type { CalendarFestivalMarkerPreset, CalendarFestivalMarkerPresetGroup } from '../festival-visual-types';
import type { CalendarMarkerRule, CalendarProfileVisualSettings } from './types';

export function buildFestivalMarkerPresetGroup(
  settings: CalendarProfileVisualSettings,
): CalendarFestivalMarkerPresetGroup {
  const resolveIcon = (filename: string): string => {
    const icon = BUNDLED_FESTIVAL_ICON_BY_FILENAME.get(filename);
    if (!icon) console.warn(`[月历] 未打包的节庆图标：${filename}，使用日历图标`);
    return icon ?? calendarIconSvg;
  };
  const resolveRule = (rule: CalendarMarkerRule): CalendarFestivalMarkerPreset => ({
    iconSvg: resolveIcon(rule.icon),
    color: rule.color,
    keywords: rule.keywords,
  });
  const locationPresets = settings.locationPresets.map(resolveRule);
  return {
    tagPresets: settings.tagPresets.map(resolveRule),
    locationPresets,
    markerPresets: [...locationPresets, ...settings.markerPresets.map(resolveRule)],
    fallbackMarkers: settings.fallbackMarkers.map(item => ({ iconSvg: resolveIcon(item.icon), ...item.color })),
  };
}
