export type CalendarBucketType = '临时' | '重复';
export type RepeatRule = '无' | '每天' | '每周' | '每月' | '每年' | '仅工作日' | '仅节假日';
export type EventSourceKind = 'active' | 'archive' | 'festival';
export type FestivalSourceKind = 'fixed' | 'worldbook';
export type AgendaItemKind = 'user' | 'festival';
export type ReminderLevel = 'none' | 'soon' | 'today';
export type CalendarSourceKind =
  | 'character_primary'
  | 'character_additional'
  | 'global'
  | 'chat_bound'
  | 'extra'
  | 'dev';

export type CalendarNarrativeEventType = '日程' | '事件' | '回忆';
export type CalendarPostAction = '历史' | '自动清理' | '归档' | '转回忆';
export type CalendarImportance = '重要且紧急' | '重要不紧急' | '不重要但紧急' | '不重要不紧急';
export type CalendarVisibility = '玩家与LLM' | '仅玩家' | '仅LLM' | '完全不显示';

export interface CalendarEventColorStyle {
  background: string;
  text: string;
  border?: string;
}

export interface CalendarFestivalRecurrence {
  intervalYears: number;
  lastYear: number;
}

export interface RawCalendarEvent {
  标题: string;
  内容: string;
  时间: string;
  结束时间?: string;
  重复规则: RepeatRule;
  类型?: CalendarNarrativeEventType;
  完成后?: CalendarPostAction;
  重要度?: CalendarImportance;
  提前提醒天数?: number;
  可见性?: CalendarVisibility;
  标签?: string[];
}

export interface ActiveCalendarBuckets {
  临时: Record<string, RawCalendarEvent>;
  重复: Record<string, RawCalendarEvent>;
}

export interface ArchivedCalendarEvent extends RawCalendarEvent {
  id: string;
  type: CalendarBucketType;
  archived_at: string;
  completed_at?: string;
  tags: string[];
  preserved_for_player: true;
  archive_reason?: 'completed' | 'auto_cleanup' | 'manual_delete' | 'memory';
}

export interface CalendarSourceConfig {
  useChatBoundWorldbook: boolean;
  extraWorldbooks: string[];
  devWorldbooks: string[];
}

export interface CalendarArchivePolicy {
  archiveOnActiveRemoval: boolean;
  skipArchiveTags: string[];
  autoDeleteTags: string[];
  protectedTags: string[];
  customTags: string[];
  tagColors: Record<string, CalendarEventColorStyle>;
}

export interface ResolvedCalendarWorldbookSource {
  name: string;
  kind: CalendarSourceKind;
}

export interface CalendarArchiveStore {
  completed: Record<string, ArchivedCalendarEvent>;
  dismissedFestivalReminderKeys: string[];
  dismissedUserReminderKeys: string[];
  sources: CalendarSourceConfig;
  policy: CalendarArchivePolicy;
  lastActiveSnapshot: ActiveCalendarBuckets;
}

export interface DatePoint {
  year: number;
  month: number;
  day: number;
}

export interface DateRange {
  start: DatePoint;
  end: DatePoint;
}

export interface CalendarAnchor {
  dateKey: string;
  weekday: number;
}

export interface CalendarTagOption {
  value: string;
  label: string;
  source: 'preset' | 'history' | 'festival' | 'custom';
}

export interface CalendarSuggestionSet {
  idCandidates: string[];
  titleCandidates: string[];
  tagCandidates: CalendarTagOption[];
}

export interface CalendarEventRecord {
  source: EventSourceKind;
  sourceKind?: FestivalSourceKind;
  id: string;
  type: CalendarBucketType | '节庆';
  title: string;
  content: string;
  startText: string;
  endText: string;
  repeatRule: RepeatRule;
  tags: string[];
  allDay: boolean;
  raw?: RawCalendarEvent | ArchivedCalendarEvent;
  range?: DateRange;
  relatedBookIds: string[];
  metadata: Record<string, unknown>;
  color?: CalendarEventColorStyle;
}

export interface CalendarBookRecord {
  id: string;
  title: string;
  summary: string;
  content: string;
  triggerText: string;
  worldbookEntryName?: string;
}

export interface CalendarMonthAliasRecord {
  month: number;
  label: string;
  season?: string;
}

export interface WorldbookStageRecord {
  phaseId: string;
  dayIndex: number;
  title: string;
  summary: string;
  startText: string;
  endText: string;
  range?: DateRange;
}

export interface FestivalRecord {
  id: string;
  title: string;
  summary: string;
  content: string;
  entryName?: string;
  startText: string;
  endText: string;
  sourceKind: FestivalSourceKind;
  range?: DateRange;
  recurrence?: CalendarFestivalRecurrence;
  relatedBookIds: string[];
  locationKeywords: string[];
  stages: WorldbookStageRecord[];
  metadata: Record<string, unknown>;
}

export interface DayCellEventChip {
  id: string;
  title: string;
  label?: string;
  row: number;
  startOffset: number;
  endOffset: number;
  isStart: boolean;
  isEnd: boolean;
  source: EventSourceKind;
  colorToken: 'user' | 'festival' | 'archived';
  color?: CalendarEventColorStyle;
  displayKind?: 'bar' | 'stage-bubble';
}

export interface DayCellFestivalMarker {
  id: string;
  title: string;
  iconSvg: string;
  color: CalendarEventColorStyle;
  iconColor?: string;
}

export interface MonthDayCell {
  key: string;
  year: number;
  month: number;
  day: number;
  weekday: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  reminderLevel: ReminderLevel;
  chips: DayCellEventChip[];
  markers: DayCellFestivalMarker[];
  overflowCount: number;
}

export interface DailyAgendaItem {
  id: string;
  dateKey: string;
  title: string;
  summary: string;
  kind: AgendaItemKind;
  source: EventSourceKind;
  sourceKind?: FestivalSourceKind;
  type: CalendarBucketType | '节庆';
  startText: string;
  endText: string;
  periodLabel?: string;
  sortStartKey?: string;
  sortEndKey?: string;
  isPeriod?: boolean;
  stageTitle?: string;
  festivalIconSvg?: string;
  festivalIconColor?: string;
  festivalLocationLabel?: string;
  tags: string[];
  relatedBookIds: string[];
  reminderLevel: ReminderLevel;
  metadata: Record<string, unknown>;
  color?: CalendarEventColorStyle;
}

export interface DailyAgendaGroup {
  dateKey: string;
  label: string;
  items: DailyAgendaItem[];
}

export interface ReminderState {
  hasUpcoming: boolean;
  maxLevel: ReminderLevel;
  reasons: string[];
}

export interface CalendarDataset {
  nowText: string;
  nowDate?: DatePoint;
  calendarAnchor?: CalendarAnchor;
  currentLocationText: string;
  activeEvents: CalendarEventRecord[];
  archivedEvents: CalendarEventRecord[];
  festivals: FestivalRecord[];
  books: Record<string, CalendarBookRecord>;
  suggestions: CalendarSuggestionSet;
  monthAliases: CalendarMonthAliasRecord[];
  sourceConfig: CalendarSourceConfig;
  worldbookSources: ResolvedCalendarWorldbookSource[];
  sourceWarnings: string[];
}

export interface SelectedDayDetail {
  dateKey: string;
  monthCell?: MonthDayCell;
  agenda: DailyAgendaGroup | null;
}

export interface WidgetRefs {
  iframe: HTMLIFrameElement | null;
  root: HTMLElement | null;
  ball: HTMLButtonElement | null;
  panel: HTMLElement | null;
  monthGrid: HTMLElement | null;
  agendaList: HTMLElement | null;
  detailPanel: HTMLElement | null;
  formPanel: HTMLElement | null;
  sourcePanel: HTMLElement | null;
}

export interface WidgetState {
  open: boolean;
  destroyed: boolean;
  currentMonth: DatePoint;
  selectedDateKey: string;
  reminder: ReminderState;
  dataset: CalendarDataset | null;
  filterKeyword: string;
  showArchived: boolean;
  formMode: 'create' | 'edit';
  editingEventId: string | null;
}
