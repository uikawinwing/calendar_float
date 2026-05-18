import type { WidgetRefs } from './types';

type SidebarTab = 'detail' | 'form' | 'archive';
type AgendaSortMode = 'date-asc' | 'date-desc' | 'title-asc' | 'festival-first' | 'event-first';
type CalendarBucketType = '临时' | '重复';

export interface BindCalendarWidgetEventsOptions {
  refs: WidgetRefs;
  hostDocument: Document;
  hostWindow: Window & typeof globalThis;
  onToggleBall: () => void;
  onBallDragStart: (clientX: number, clientY: number) => void;
  onBallDragMove: (clientX: number, clientY: number) => void;
  onBallDragEnd: () => void;
  onClosePanel: () => void;
  onReload: () => void | Promise<void>;
  onTogglePanelFullscreen: () => void;
  onToggleTheme: () => void;
  onToggleFestivalScope: () => void;
  onOpenTagColorPanel: () => void;
  onCloseTagColorPanel: () => void;
  onManagedWorldbookClick: () => void | Promise<void>;
  onSwitchTab: (tab: SidebarTab) => void;
  onOpenCreateForm: () => void;
  onOpenMobileAgenda: () => void;
  onCloseMobileSide: () => void;
  onCancelForm: () => void;
  onFillNowTime: () => void | Promise<void>;
  onSaveForm: () => void | Promise<void>;
  onTagSearchInput: (keyword: string) => void;
  onToggleFormTag: (tag: string) => void;
  onRemoveFormTag: (tag: string) => void;
  onAddCustomTag: () => void;
  onTagColorSearchInput: (keyword: string) => void;
  onAddColorTag: () => void;
  onSelectTagColor: (tag: string) => void;
  onApplyTagColorPalette: (color: { background: string; text: string; border?: string }) => void;
  onSaveTagColorHex: () => void;
  onResetTagColor: () => void;
  onPolicyTagSearchInput: (field: string, keyword: string) => void;
  onTogglePolicyTag: (field: string, tag: string) => void;
  onRemovePolicyTag: (field: string, tag: string) => void;
  onAddPolicyTag: (field: string) => void;
  onTogglePolicyTagList: (field: string) => void;
  onPickDay: (dateKey: string) => void;
  onMonthPrev: () => void;
  onMonthNext: () => void;
  onMonthToday: () => void;
  onOpenBook: (bookId: string) => void;
  onOpenBookPage: (pageIndex: number) => void;
  onBookPrevPage: () => void;
  onBookNextPage: () => void;
  onCloseBookReader: () => void;
  onEditEvent: (eventId: string) => void;
  onCompleteEvent: (eventId: string, eventType: CalendarBucketType) => void | Promise<void>;
  onDeleteEvent: (eventId: string) => void | Promise<void>;
  onRestoreEvent: (eventId: string) => void | Promise<void>;
  onPurgeEvent: (eventId: string) => void | Promise<void>;
  onSaveArchivePolicy: () => void | Promise<void>;
  onPurgeAutoDeleteArchive: () => void | Promise<void>;
  onAgendaFilterInput: (keyword: string) => void;
  onAgendaToggleArchived: (checked: boolean) => void;
  onAgendaSortChange: (sort: AgendaSortMode) => void;
  onOpenAgendaItemDate: (dateKey: string) => void;
  onPanelDragStart: (event: MouseEvent) => void;
  onPanelDragMove: (event: MouseEvent) => void;
  onPanelDragEnd: () => void;
  onWindowResize: () => void;
}

function parseSidebarTab(value: string): SidebarTab {
  if (value === 'archive') {
    return 'archive';
  }
  return value === 'form' ? 'form' : 'detail';
}

function parseAgendaSort(value: string): AgendaSortMode {
  return value === 'date-desc' || value === 'title-asc' || value === 'festival-first' || value === 'event-first'
    ? value
    : 'date-asc';
}

function parseCalendarBucketType(value: string): CalendarBucketType {
  return value === '重复' ? '重复' : '临时';
}

function getTouchClientPoint(event: JQuery.TouchEventBase): { clientX: number; clientY: number } | null {
  const originalEvent = event.originalEvent;
  const touch = originalEvent?.touches[0] ?? originalEvent?.changedTouches[0];
  return touch ? { clientX: touch.clientX, clientY: touch.clientY } : null;
}

function triggerSpringFeedback(element: HTMLElement): void {
  element.classList.remove('is-pressing', 'is-springing');
  void element.offsetWidth;
  element.classList.add('is-springing');
  window.setTimeout(() => {
    element.classList.remove('is-springing');
  }, 520);
}

export function bindCalendarWidgetEvents(options: BindCalendarWidgetEventsOptions): void {
  const { refs, hostWindow } = options;
  if (!refs.root || !refs.ball) {
    return;
  }

  const rootDocument = refs.root.ownerDocument;
  const ballDocument = refs.ball.ownerDocument;

  $(refs.ball).off('.calendar-float');
  $(refs.root).off('.calendar-float');
  $(rootDocument).off('.calendar-float-panel-drag');
  $(ballDocument).off('.calendar-float-ball-drag');
  $(rootDocument).off('.calendar-float-tools-menu');
  $(hostWindow).off('.calendar-float-window');

  $(refs.ball).on('mousedown.calendar-float', event => {
    options.onBallDragStart(event.clientX, event.clientY);
    event.preventDefault();
  });

  $(refs.ball).on('touchstart.calendar-float', event => {
    const point = getTouchClientPoint(event);
    if (!point) {
      return;
    }
    options.onBallDragStart(point.clientX, point.clientY);
    event.stopPropagation();
  });

  $(refs.ball).on('click.calendar-float', () => {
    options.onToggleBall();
  });

  $(refs.root).on(
    'mousedown.calendar-float touchstart.calendar-float',
    '.th-month-nav-btn, .th-window-actions .th-btn',
    event => {
      (event.currentTarget as HTMLElement).classList.add('is-pressing');
    },
  );

  $(rootDocument).on('mouseup.calendar-float-button touchend.calendar-float-button touchcancel.calendar-float-button', () => {
    refs.root?.querySelectorAll<HTMLElement>('.is-pressing').forEach(button => {
      triggerSpringFeedback(button);
    });
  });

  $(refs.root).on('click.calendar-float', '.th-month-nav-btn, .th-window-actions .th-btn', event => {
    const button = event.currentTarget as HTMLElement;
    if (!button.classList.contains('is-springing')) {
      triggerSpringFeedback(button);
    }
  });

  $(refs.root).on('click.calendar-float', '[data-action="close"]', () => {
    options.onClosePanel();
  });

  $(refs.root).on('click.calendar-float', '[data-action="reload"]', () => {
    void options.onReload();
  });

  $(refs.root).on('click.calendar-float', '[data-action="toggle-panel-fullscreen"]', () => {
    options.onTogglePanelFullscreen();
  });

  $(refs.root).on('click.calendar-float', '[data-action="toggle-theme"]', () => {
    options.onToggleTheme();
  });

  $(refs.root).on('click.calendar-float', '[data-action="toggle-festival-scope"]', () => {
    options.onToggleFestivalScope();
  });

  $(refs.root).on('click.calendar-float', '[data-action="open-tag-color-panel"]', () => {
    options.onOpenTagColorPanel();
  });

  $(refs.root).on('click.calendar-float', '[data-action="close-tag-color-panel"]', () => {
    options.onCloseTagColorPanel();
  });

  $(refs.root).on('click.calendar-float', '[data-action="managed-worldbook-connectivity"]', event => {
    (event.currentTarget as HTMLElement).closest<HTMLDetailsElement>('.th-tools-menu')?.removeAttribute('open');
    void options.onManagedWorldbookClick();
  });

  $(refs.root).on('click.calendar-float', '.th-tool-menu-item', event => {
    const currentAction = String((event.currentTarget as HTMLElement).getAttribute('data-action') || '');
    if (currentAction === 'managed-worldbook-connectivity') {
      return;
    }
    (event.currentTarget as HTMLElement).closest<HTMLDetailsElement>('.th-tools-menu')?.removeAttribute('open');
  });

  $(refs.root).on('click.calendar-float', '[data-action="switch-tab"]', event => {
    const tab = parseSidebarTab(String((event.currentTarget as HTMLElement).getAttribute('data-tab') || 'detail'));
    options.onSwitchTab(tab);
  });

  $(refs.root).on('click.calendar-float', '[data-action="open-create-form"]', () => {
    options.onOpenCreateForm();
  });

  $(refs.root).on('click.calendar-float', '[data-action="open-mobile-agenda"]', () => {
    options.onOpenMobileAgenda();
  });

  $(refs.root).on('click.calendar-float', '[data-action="focus-agenda-filter"]', () => {
    const input = refs.root?.querySelector<HTMLInputElement>('[data-action="agenda-filter-input"]');
    input?.focus();
  });

  $(refs.root).on('click.calendar-float', '[data-action="close-mobile-side"]', () => {
    options.onCloseMobileSide();
  });

  $(refs.root).on('click.calendar-float', '[data-action="cancel-form"]', () => {
    options.onCancelForm();
  });

  $(refs.root).on('click.calendar-float', '[data-action="fill-now-time"]', () => {
    void options.onFillNowTime();
  });

  $(refs.root).on('click.calendar-float', '[data-action="save-form"]', () => {
    void options.onSaveForm();
  });

  $(refs.root).on('input.calendar-float', '[data-action="tag-search-input"]', event => {
    options.onTagSearchInput(String((event.currentTarget as HTMLInputElement).value || ''));
  });

  $(refs.root).on('click.calendar-float', '[data-action="toggle-form-tag"]', event => {
    const tag = String((event.currentTarget as HTMLElement).getAttribute('data-tag-value') || '').trim();
    if (tag) {
      options.onToggleFormTag(tag);
    }
  });

  $(refs.root).on('click.calendar-float', '[data-action="remove-form-tag"]', event => {
    const tag = String((event.currentTarget as HTMLElement).getAttribute('data-tag-value') || '').trim();
    if (tag) {
      options.onRemoveFormTag(tag);
    }
  });

  $(refs.root).on('click.calendar-float', '[data-action="add-custom-tag"]', () => {
    options.onAddCustomTag();
  });

  $(refs.root).on('input.calendar-float', '[data-action="tag-color-search-input"]', event => {
    options.onTagColorSearchInput(String((event.currentTarget as HTMLInputElement).value || ''));
  });

  $(refs.root).on('click.calendar-float', '[data-action="add-color-tag"]', () => {
    options.onAddColorTag();
  });

  $(refs.root).on('click.calendar-float', '[data-action="select-tag-color"]', event => {
    const tag = String((event.currentTarget as HTMLElement).getAttribute('data-tag-value') || '').trim();
    if (tag) {
      options.onSelectTagColor(tag);
    }
  });

  $(refs.root).on('click.calendar-float', '[data-action="apply-tag-color-palette"]', event => {
    const button = event.currentTarget as HTMLElement;
    const background = String(button.getAttribute('data-background') || '').trim();
    const text = String(button.getAttribute('data-text') || '').trim();
    const border = String(button.getAttribute('data-border') || '').trim();
    if (background && text) {
      options.onApplyTagColorPalette({ background, text, ...(border ? { border } : {}) });
    }
  });

  $(refs.root).on('click.calendar-float', '[data-action="save-tag-color-hex"]', () => {
    options.onSaveTagColorHex();
  });

  $(refs.root).on('click.calendar-float', '[data-action="reset-tag-color"]', () => {
    options.onResetTagColor();
  });

  $(refs.root).on('input.calendar-float', '[data-action="policy-tag-search-input"]', event => {
    const input = event.currentTarget as HTMLInputElement;
    const field = String(input.getAttribute('data-policy-tag-field') || '').trim();
    if (field) {
      options.onPolicyTagSearchInput(field, String(input.value || ''));
    }
  });

  $(refs.root).on('click.calendar-float', '[data-action="toggle-policy-tag"]', event => {
    const button = event.currentTarget as HTMLElement;
    const field = String(button.getAttribute('data-policy-tag-field') || '').trim();
    const tag = String(button.getAttribute('data-tag-value') || '').trim();
    if (field && tag) {
      options.onTogglePolicyTag(field, tag);
    }
  });

  $(refs.root).on('click.calendar-float', '[data-action="remove-policy-tag"]', event => {
    const button = event.currentTarget as HTMLElement;
    const field = String(button.getAttribute('data-policy-tag-field') || '').trim();
    const tag = String(button.getAttribute('data-tag-value') || '').trim();
    if (field && tag) {
      options.onRemovePolicyTag(field, tag);
    }
  });

  $(refs.root).on('click.calendar-float', '[data-action="add-policy-tag"]', event => {
    const field = String((event.currentTarget as HTMLElement).getAttribute('data-policy-tag-field') || '').trim();
    if (field) {
      options.onAddPolicyTag(field);
    }
  });

  $(refs.root).on('click.calendar-float', '[data-action="toggle-policy-tag-list"]', event => {
    const field = String((event.currentTarget as HTMLElement).getAttribute('data-policy-tag-field') || '').trim();
    if (field) {
      options.onTogglePolicyTagList(field);
    }
  });

  $(refs.root).on('click.calendar-float', '[data-action="pick-day"]', event => {
    const dateKey = String((event.currentTarget as HTMLElement).getAttribute('data-date-key') || '');
    if (!dateKey) {
      return;
    }
    options.onPickDay(dateKey);
  });

  $(refs.root).on('click.calendar-float', '[data-action="month-prev"]', () => {
    options.onMonthPrev();
  });

  $(refs.root).on('click.calendar-float', '[data-action="month-next"]', () => {
    options.onMonthNext();
  });

  $(refs.root).on('click.calendar-float', '[data-action="month-today"]', () => {
    options.onMonthToday();
  });

  $(refs.root).on('click.calendar-float', '[data-action="open-book"]', event => {
    event.preventDefault();
    event.stopPropagation();
    const bookId = String((event.currentTarget as HTMLElement).getAttribute('data-book-id') || '');
    if (!bookId) {
      return;
    }
    options.onOpenBook(bookId);
  });

  $(refs.root).on('click.calendar-float', '[data-action="open-book-page"]', event => {
    const pageIndex = Number((event.currentTarget as HTMLElement).getAttribute('data-page-index') || '0');
    options.onOpenBookPage(Number.isFinite(pageIndex) ? pageIndex : 0);
  });

  $(refs.root).on('click.calendar-float', '[data-action="book-prev-page"]', () => {
    options.onBookPrevPage();
  });

  $(refs.root).on('click.calendar-float', '[data-action="book-next-page"]', () => {
    options.onBookNextPage();
  });

  $(refs.root).on('click.calendar-float', '[data-action="close-book-reader"]', () => {
    options.onCloseBookReader();
  });

  $(refs.root).on('click.calendar-float', '[data-action="edit-event"]', event => {
    const eventId = String((event.currentTarget as HTMLElement).getAttribute('data-event-id') || '');
    if (!eventId) {
      return;
    }
    options.onEditEvent(eventId);
  });

  $(refs.root).on('click.calendar-float', '[data-action="complete-event"]', event => {
    const eventId = String((event.currentTarget as HTMLElement).getAttribute('data-event-id') || '');
    if (!eventId) {
      return;
    }
    const eventType = parseCalendarBucketType(
      String((event.currentTarget as HTMLElement).getAttribute('data-event-type') || '临时'),
    );
    void options.onCompleteEvent(eventId, eventType);
  });

  $(refs.root).on('click.calendar-float', '[data-action="delete-event"]', event => {
    const eventId = String((event.currentTarget as HTMLElement).getAttribute('data-event-id') || '');
    if (!eventId) {
      return;
    }
    void options.onDeleteEvent(eventId);
  });

  $(refs.root).on('click.calendar-float', '[data-action="restore-event"]', event => {
    const eventId = String((event.currentTarget as HTMLElement).getAttribute('data-event-id') || '');
    if (!eventId) {
      return;
    }
    void options.onRestoreEvent(eventId);
  });

  $(refs.root).on('click.calendar-float', '[data-action="purge-event"]', event => {
    const eventId = String((event.currentTarget as HTMLElement).getAttribute('data-event-id') || '');
    if (!eventId) {
      return;
    }
    void options.onPurgeEvent(eventId);
  });

  $(refs.root).on('click.calendar-float', '[data-action="save-archive-policy"]', () => {
    void options.onSaveArchivePolicy();
  });

  $(refs.root).on('click.calendar-float', '[data-action="purge-auto-delete-archive"]', () => {
    void options.onPurgeAutoDeleteArchive();
  });

  $(refs.root).on('input.calendar-float', '[data-action="agenda-filter-input"]', event => {
    options.onAgendaFilterInput(String((event.currentTarget as HTMLInputElement).value || ''));
  });

  $(refs.root).on('change.calendar-float', '[data-action="agenda-toggle-archived"]', event => {
    options.onAgendaToggleArchived(Boolean((event.currentTarget as HTMLInputElement).checked));
  });

  $(refs.root).on('change.calendar-float', '[data-action="agenda-sort-select"]', event => {
    options.onAgendaSortChange(parseAgendaSort(String((event.currentTarget as HTMLSelectElement).value || 'date-asc')));
  });

  $(refs.root).on('click.calendar-float', '[data-action="open-agenda-item-date"]', event => {
    const target = event.target as HTMLElement | null;
    if (
      target?.closest(
        '[data-action="edit-event"], [data-action="complete-event"], [data-action="delete-event"], [data-action="restore-event"], [data-action="purge-event"], [data-action="open-book"], [data-action="open-book-page"], [data-action="book-prev-page"], [data-action="book-next-page"], [data-action="close-book-reader"]',
      )
    ) {
      return;
    }
    const dateKey = String((event.currentTarget as HTMLElement).getAttribute('data-date-key') || '');
    if (!dateKey) {
      return;
    }
    options.onOpenAgendaItemDate(dateKey);
  });

  $(refs.root).on('mousedown.calendar-float', '[data-drag-handle="panel"]', event => {
    options.onPanelDragStart(event as unknown as MouseEvent);
  });

  $(rootDocument).on('mousemove.calendar-float-panel-drag', event => {
    options.onPanelDragMove(event as unknown as MouseEvent);
  });

  $(rootDocument).on('mouseup.calendar-float-panel-drag', () => {
    options.onPanelDragEnd();
  });

  $(ballDocument).on('mousemove.calendar-float-ball-drag', event => {
    options.onBallDragMove(event.clientX, event.clientY);
  });

  $(ballDocument).on('mouseup.calendar-float-ball-drag', () => {
    options.onBallDragEnd();
  });

  $(ballDocument).on('touchmove.calendar-float-ball-drag', event => {
    const point = getTouchClientPoint(event);
    if (!point) {
      return;
    }
    options.onBallDragMove(point.clientX, point.clientY);
  });

  $(ballDocument).on('touchend.calendar-float-ball-drag touchcancel.calendar-float-ball-drag', () => {
    options.onBallDragEnd();
  });

  $(rootDocument).on('mousedown.calendar-float-tools-menu touchstart.calendar-float-tools-menu', event => {
    const target = event.target as unknown as HTMLElement | null;
    if (!target || target.closest(`#${refs.root?.id || ''} .th-tools-menu`)) {
      return;
    }
    refs.root?.querySelectorAll<HTMLDetailsElement>('.th-tools-menu[open]').forEach(menu => {
      menu.removeAttribute('open');
    });
  });

  $(hostWindow).on('resize.calendar-float-window', () => {
    refs.root?.querySelectorAll<HTMLDetailsElement>('.th-tools-menu[open]').forEach(menu => {
      menu.removeAttribute('open');
    });
    options.onWindowResize();
  });
}
