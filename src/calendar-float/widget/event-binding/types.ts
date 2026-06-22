export const SIDEBAR_TABS = ['detail', 'form', 'archive'] as const;
export type SidebarTab = (typeof SIDEBAR_TABS)[number];

export const AGENDA_SORT_MODES = ['date-asc', 'date-desc', 'title-asc', 'festival-first', 'event-first'] as const;
export type AgendaSortMode = (typeof AGENDA_SORT_MODES)[number];

export const CALENDAR_BUCKET_TYPES = ['临时', '重复'] as const;
export type CalendarBucketType = (typeof CALENDAR_BUCKET_TYPES)[number];

export const FESTIVAL_SCOPE_MODES = ['all', 'local', 'none'] as const;
export type FestivalScopeMode = (typeof FESTIVAL_SCOPE_MODES)[number];
