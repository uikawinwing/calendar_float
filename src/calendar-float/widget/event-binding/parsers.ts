import { AGENDA_SORT_MODES, type AgendaSortMode, type CalendarBucketType, type SidebarTab } from './types';

export function parseSidebarTab(value: string): SidebarTab {
  if (value === 'archive') {
    return 'archive';
  }
  return value === 'form' ? 'form' : 'detail';
}

export function parseAgendaSort(value: string): AgendaSortMode {
  return AGENDA_SORT_MODES.includes(value as AgendaSortMode) ? (value as AgendaSortMode) : 'date-asc';
}

export function parseCalendarBucketType(value: string): CalendarBucketType {
  return value === '重复' ? '重复' : '临时';
}
