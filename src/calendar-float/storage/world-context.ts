import _ from 'lodash';

import { formatDateKey, parseWorldDateAnchor } from '../date';
import { getActiveCalendarDateParseOptions } from '../profile';
import { getCalendarWorldLocationPath, getCalendarWorldTimePath } from '../runtime-worldbook/config';
import type { CalendarMonthAliasRecord, DatePoint } from '../types';
import { readMessageVariableData } from './message-variable';

export function readCurrentWorldTime(path = getCalendarWorldTimePath(), monthAliases?: CalendarMonthAliasRecord[]): {
  text: string;
  point: DatePoint | null;
  anchor: { dateKey: string; weekday: number } | null;
} {
  const messageData = readMessageVariableData();
  const text = String(_.get(messageData, path, '') || '');
  const parsed = parseWorldDateAnchor(text, {
    monthAliases,
    ...getActiveCalendarDateParseOptions(),
  });
  return {
    text,
    point: parsed?.point ?? null,
    anchor:
      parsed && typeof parsed.weekday === 'number'
        ? {
            dateKey: formatDateKey(parsed.point),
            weekday: parsed.weekday,
          }
        : null,
  };
}

function formatWorldLocationValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(formatWorldLocationValue).filter(Boolean).join(' / ');
  }
  if (_.isPlainObject(value)) {
    return Object.values(value as Record<string, unknown>)
      .map(formatWorldLocationValue)
      .filter(Boolean)
      .join(' / ');
  }
  return String(value ?? '').trim();
}

export function readCurrentWorldLocation(path = getCalendarWorldLocationPath()): string {
  const messageData = readMessageVariableData();
  return formatWorldLocationValue(_.get(messageData, path, ''));
}
