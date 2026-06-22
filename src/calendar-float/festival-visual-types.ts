import type { CalendarEventColorStyle, DayCellFestivalMarker } from './types';

export interface CalendarFestivalMarkerPreset {
  iconSvg: string;
  color: CalendarEventColorStyle;
  keywords: string[];
}

export interface CalendarFestivalMarkerPresetGroup {
  markerPresets: CalendarFestivalMarkerPreset[];
  locationPresets: CalendarFestivalMarkerPreset[];
  fallbackMarkers: Array<DayCellFestivalMarker['color'] & { iconSvg: string }>;
}
