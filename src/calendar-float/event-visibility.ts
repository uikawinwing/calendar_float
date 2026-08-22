import type { RawCalendarEvent } from './types';

type DisplaySource = Pick<RawCalendarEvent, '显示' | '可见性'>;

/**
 * Player UI visibility for dynamic calendar items.
 * New data uses `显示`; legacy `可见性` is an in-memory/read-only compatibility bridge.
 */
export function isCalendarEventVisibleToPlayer(event: DisplaySource): boolean {
  if (typeof event.显示 === 'boolean') {
    return event.显示;
  }
  return event.可见性 !== '仅LLM' && event.可见性 !== '完全不显示';
}
