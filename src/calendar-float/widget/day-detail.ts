import { formatDateLabel } from '../date';
import type { DailyAgendaGroup, MonthDayCell, SelectedDayDetail } from '../types';

export function buildSelectedDayDetail(args: {
  dateKey: string;
  cells: MonthDayCell[];
  agendaGroups: DailyAgendaGroup[];
}): SelectedDayDetail {
  return {
    dateKey: args.dateKey,
    monthCell: args.cells.find(cell => cell.key === args.dateKey),
    agenda: args.agendaGroups.find(group => group.dateKey === args.dateKey) ?? null,
  };
}

export function fallbackDateLabel(dateKey: string): string {
  const match = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return dateKey;
  }
  return formatDateLabel({
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  });
}
