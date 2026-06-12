import { CALENDAR_WIDGET_BASE_STYLE } from './base';
import { CALENDAR_WIDGET_DARK_STYLE } from './dark';
import { CALENDAR_WIDGET_FINAL_OVERRIDE_STYLE } from './final-overrides';
import { CALENDAR_WIDGET_OVERRIDE_STYLE } from './overrides';
import { CALENDAR_WIDGET_RESPONSIVE_STYLE } from './responsive';

export function getCalendarWidgetStyle(): string {
  return [
    CALENDAR_WIDGET_BASE_STYLE,
    CALENDAR_WIDGET_DARK_STYLE,
    CALENDAR_WIDGET_OVERRIDE_STYLE,
    CALENDAR_WIDGET_RESPONSIVE_STYLE,
    CALENDAR_WIDGET_FINAL_OVERRIDE_STYLE,
  ].join('');
}
