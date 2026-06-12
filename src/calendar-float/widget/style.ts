import { STYLE_ID } from '../constants';
import { getCalendarWidgetStyle } from './style-parts';

export function ensureCalendarWidgetStyle(hostDocument: Document): void {
  if (!hostDocument || hostDocument.getElementById(STYLE_ID)) {
    return;
  }

  const style = hostDocument.createElement('style');
  style.id = STYLE_ID;
  style.setAttribute('script_id', getScriptId());
  style.textContent = getCalendarWidgetStyle();
  hostDocument.head.appendChild(style);
}
