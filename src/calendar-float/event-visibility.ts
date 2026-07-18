import type { RawCalendarEvent } from './types';

type VisibilitySource = Pick<RawCalendarEvent, '可见性'>;

export function isCalendarEventVisibleToPlayer(event: VisibilitySource): boolean {
  return event.可见性 !== '仅LLM' && event.可见性 !== '完全不显示';
}

export function isCalendarEventVisibleToLlm(event: VisibilitySource): boolean {
  return event.可见性 !== '仅玩家' && event.可见性 !== '完全不显示';
}
