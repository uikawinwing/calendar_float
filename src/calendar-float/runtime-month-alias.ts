import { readCalendarRuntimeIndex } from './runtime-worldbook';
import { CalendarMonthAliasRecord } from './types';

function normalizeMonth(month: number): number {
  return Number(month);
}

export function normalizeCalendarMonthAliasList(value: unknown): CalendarMonthAliasRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map(item => {
      const source = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
      return {
        month: Number(source.month ?? source.月份),
        label: String(source.label ?? source.名称 ?? '').trim(),
        season: String(source.season ?? source.季节 ?? '').trim() || undefined,
      };
    })
    .filter(item => Number.isFinite(item.month) && item.month >= 1 && item.month <= 12 && item.label);
}

export async function getCalendarMonthAliasListFromRuntime(): Promise<CalendarMonthAliasRecord[]> {
  const indexResult = await readCalendarRuntimeIndex();
  return normalizeCalendarMonthAliasList(indexResult.索引?.月份别名);
}

export async function getCalendarMonthAliasLabelFromRuntime(month: number): Promise<string> {
  const normalizedMonth = normalizeMonth(month);
  if (!Number.isFinite(normalizedMonth)) {
    return '';
  }
  const list = await getCalendarMonthAliasListFromRuntime();
  return String(list.find(item => item.month === normalizedMonth)?.label || '').trim();
}

export function formatCalendarMonthTitle(year: number, month: number, alias?: string): string {
  const normalizedYear = Number(year);
  const normalizedMonth = normalizeMonth(month);
  const aliasText = String(alias || '').trim();
  const monthText = Number.isFinite(normalizedMonth) ? `${normalizedMonth}月` : '月份未知';
  return aliasText ? `${normalizedYear}年·${monthText}(${aliasText})` : `${normalizedYear}年·${monthText}`;
}
