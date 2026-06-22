const LEGACY_CALENDAR_SEGMENT = '\u65e5\u5386';
const LEGACY_VARIABLE_LIST_TITLE = `当前${LEGACY_CALENDAR_SEGMENT}内容展示`;

export function getLegacyCalendarVariableListEntryName(prefix: string): string {
  return `${prefix}[${LEGACY_VARIABLE_LIST_TITLE}]`;
}
