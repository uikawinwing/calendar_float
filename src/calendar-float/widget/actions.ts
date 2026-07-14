import type { AgendaSortMode, CalendarBucketType, SidebarTab } from './event-binding/types';

export type WidgetAction =
  | { type: 'panel/toggle' }
  | { type: 'panel/close' }
  | { type: 'panel/reload' }
  | { type: 'panel/toggle-fullscreen' }
  | { type: 'theme/toggle' }
  | { type: 'festival/toggle-scope' }
  | { type: 'calendar/pick-day'; dateKey: string }
  | { type: 'calendar/month-prev' }
  | { type: 'calendar/month-next' }
  | { type: 'calendar/month-today' }
  | { type: 'sidebar/switch'; tab: SidebarTab }
  | { type: 'agenda/filter'; keyword: string }
  | { type: 'agenda/toggle-archived'; checked: boolean }
  | { type: 'agenda/sort'; mode: AgendaSortMode }
  | { type: 'agenda/open-date'; dateKey: string }
  | { type: 'book/open'; bookId: string }
  | { type: 'book/open-page'; pageIndex: number }
  | { type: 'book/prev-page' }
  | { type: 'book/next-page' }
  | { type: 'book/quick-input'; triggerText: string }
  | { type: 'book/close' }
  | { type: 'form/open-create' }
  | { type: 'form/cancel' }
  | { type: 'form/fill-now' }
  | { type: 'form/save' }
  | { type: 'event/edit'; eventId: string }
  | { type: 'event/complete'; eventId: string; eventType: CalendarBucketType }
  | { type: 'event/delete'; eventId: string }
  | { type: 'event/restore'; eventId: string }
  | { type: 'event/purge'; eventId: string }
  | { type: 'archive/save-policy' }
  | { type: 'archive/purge-auto-delete' }
  | { type: 'tag/search'; keyword: string }
  | { type: 'tag/toggle-form'; tag: string }
  | { type: 'tag/remove-form'; tag: string }
  | { type: 'tag/add-custom' }
  | { type: 'tag-color/open' }
  | { type: 'tag-color/close' }
  | { type: 'tag-color/search'; keyword: string }
  | { type: 'tag-color/add' }
  | { type: 'tag-color/select'; tag: string }
  | { type: 'tag-color/apply-palette'; color: { background: string; text: string; border?: string } }
  | { type: 'tag-color/save-hex' }
  | { type: 'tag-color/reset' }
  | { type: 'policy-tag/search'; field: string; keyword: string }
  | { type: 'policy-tag/toggle'; field: string; tag: string }
  | { type: 'policy-tag/remove'; field: string; tag: string }
  | { type: 'policy-tag/add'; field: string }
  | { type: 'policy-tag/toggle-list'; field: string }
  | { type: 'managed-worldbook/open' }
  | { type: 'fixed-event-editor/open' }
  | { type: 'mobile/open-agenda' }
  | { type: 'mobile/close-side' }
  | { type: 'layout/panel-drag-start'; event: MouseEvent }
  | { type: 'layout/panel-drag-move'; event: MouseEvent }
  | { type: 'layout/panel-drag-end' }
  | { type: 'layout/ball-drag-start'; clientX: number; clientY: number }
  | { type: 'layout/ball-drag-move'; clientX: number; clientY: number }
  | { type: 'layout/ball-drag-end' }
  | { type: 'layout/window-resize' };

export type WidgetActionDispatch = (action: WidgetAction) => void | Promise<void>;
