import type { WidgetRefs } from '../types';
import type { WidgetActionDispatch } from './actions';
import {
  parseAgendaSort,
  parseCalendarBucketType,
  parseSidebarTab,
} from './event-binding/parsers';

export interface BindCalendarWidgetEventsOptions {
  refs: WidgetRefs;
  hostWindow: Window & typeof globalThis;
  dispatch: WidgetActionDispatch;
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

function syncRepeatWeekdayValue(formPanel: HTMLElement | null): void {
  const hidden = formPanel?.querySelector<HTMLInputElement>('[data-form-field="repeat_weekdays"]');
  if (!hidden) {
    return;
  }
  const values = Array.from(formPanel?.querySelectorAll<HTMLInputElement>('[data-action="toggle-repeat-weekday"]') ?? [])
    .filter(input => input.checked)
    .map(input => String(input.value || '').trim())
    .filter(Boolean);
  hidden.value = values.join(',');
  formPanel?.querySelectorAll<HTMLElement>('.th-repeat-weekday').forEach(label => {
    const input = label.querySelector<HTMLInputElement>('input');
    label.classList.toggle('is-active', Boolean(input?.checked));
  });
}

function syncRepeatFormControls(formPanel: HTMLElement | null): void {
  const typeSelect = formPanel?.querySelector<HTMLSelectElement>('[data-form-field="type"]');
  const repeatSelect = formPanel?.querySelector<HTMLSelectElement>('[data-form-field="rule"]');
  const isRepeat = parseCalendarBucketType(String(typeSelect?.value || '临时')) === '重复';
  const repeatRule = isRepeat ? String(repeatSelect?.value || '每月') : '无';

  formPanel?.querySelectorAll<HTMLElement>('[data-role="absolute-time-field"]').forEach(field => {
    field.hidden = isRepeat;
  });

  const repeatField = formPanel?.querySelector<HTMLElement>('[data-role="repeat-rule-field"]');
  if (repeatField) {
    repeatField.hidden = !isRepeat;
  }
  if (repeatSelect) {
    repeatSelect.value = isRepeat && repeatSelect.value ? repeatSelect.value : '每月';
  }

  const repeatDetail = formPanel?.querySelector<HTMLElement>('[data-role="repeat-detail-field"]');
  if (repeatDetail) {
    repeatDetail.hidden = !isRepeat || repeatRule === '每天' || repeatRule === '仅工作日';
  }
  formPanel?.querySelectorAll<HTMLElement>('[data-repeat-detail]').forEach(group => {
    group.hidden = !isRepeat || group.getAttribute('data-repeat-detail') !== repeatRule;
  });

  const monthMode = String(formPanel?.querySelector<HTMLSelectElement>('[data-form-field="repeat_month_mode"]')?.value || 'day');
  formPanel?.querySelectorAll<HTMLElement>('[data-repeat-mode^="month-"]').forEach(group => {
    group.hidden = group.getAttribute('data-repeat-mode') !== `month-${monthMode}`;
  });

  const yearMode = String(formPanel?.querySelector<HTMLSelectElement>('[data-form-field="repeat_year_mode"]')?.value || 'day');
  formPanel?.querySelectorAll<HTMLElement>('[data-repeat-mode^="year-"]').forEach(group => {
    group.hidden = group.getAttribute('data-repeat-mode') !== `year-${yearMode}`;
  });

  syncRepeatWeekdayValue(formPanel);
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
    void options.dispatch({ type: 'layout/ball-drag-start', clientX: event.clientX, clientY: event.clientY });
    event.preventDefault();
  });

  $(refs.ball).on('touchstart.calendar-float', event => {
    const point = getTouchClientPoint(event);
    if (!point) {
      return;
    }
    void options.dispatch({ type: 'layout/ball-drag-start', clientX: point.clientX, clientY: point.clientY });
    event.stopPropagation();
  });

  $(refs.ball).on('click.calendar-float', () => {
    void options.dispatch({ type: 'panel/toggle' });
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
    void options.dispatch({ type: 'panel/close' });
  });

  $(refs.root).on('click.calendar-float', '[data-action="reload"]', () => {
    void options.dispatch({ type: 'panel/reload' });
  });

  $(refs.root).on('click.calendar-float', '[data-action="toggle-panel-fullscreen"]', () => {
    void options.dispatch({ type: 'panel/toggle-fullscreen' });
  });

  $(refs.root).on('click.calendar-float', '[data-action="toggle-theme"]', () => {
    void options.dispatch({ type: 'theme/toggle' });
  });

  $(refs.root).on('click.calendar-float', '[data-action="toggle-festival-scope"]', () => {
    void options.dispatch({ type: 'festival/toggle-scope' });
  });

  $(refs.root).on('click.calendar-float', '[data-action="open-tag-color-panel"]', () => {
    void options.dispatch({ type: 'tag-color/open' });
  });

  $(refs.root).on('click.calendar-float', '[data-action="close-tag-color-panel"]', () => {
    void options.dispatch({ type: 'tag-color/close' });
  });

  $(refs.root).on('click.calendar-float', '[data-action="open-mvu-settings"]', event => {
    (event.currentTarget as HTMLElement).closest<HTMLDetailsElement>('.th-tools-menu')?.removeAttribute('open');
    void options.dispatch({ type: 'managed-worldbook/open' });
  });

  $(refs.root).on('click.calendar-float', '[data-action="open-fixed-event-index-editor"]', event => {
    (event.currentTarget as HTMLElement).closest<HTMLDetailsElement>('.th-tools-menu')?.removeAttribute('open');
    void options.dispatch({ type: 'fixed-event-editor/open' });
  });

  $(refs.root).on('click.calendar-float', '.th-tool-menu-item', event => {
    const currentAction = String((event.currentTarget as HTMLElement).getAttribute('data-action') || '');
    if (currentAction === 'open-mvu-settings') {
      return;
    }
    (event.currentTarget as HTMLElement).closest<HTMLDetailsElement>('.th-tools-menu')?.removeAttribute('open');
  });

  $(refs.root).on('click.calendar-float', '[data-action="switch-tab"]', event => {
    const tab = parseSidebarTab(String((event.currentTarget as HTMLElement).getAttribute('data-tab') || 'detail'));
    void options.dispatch({ type: 'sidebar/switch', tab });
  });

  $(refs.root).on('click.calendar-float', '[data-action="open-create-form"]', () => {
    void options.dispatch({ type: 'form/open-create' });
  });

  $(refs.root).on('click.calendar-float', '[data-action="open-mobile-agenda"]', () => {
    void options.dispatch({ type: 'mobile/open-agenda' });
  });

  $(refs.root).on('click.calendar-float', '[data-action="focus-agenda-filter"]', () => {
    const input = refs.root?.querySelector<HTMLInputElement>('[data-action="agenda-filter-input"]');
    input?.focus();
  });

  $(refs.root).on('click.calendar-float', '[data-action="close-mobile-side"]', () => {
    void options.dispatch({ type: 'mobile/close-side' });
  });

  $(refs.root).on('click.calendar-float', '[data-action="cancel-form"]', () => {
    void options.dispatch({ type: 'form/cancel' });
  });

  $(refs.root).on('click.calendar-float', '[data-action="fill-now-time"]', () => {
    void options.dispatch({ type: 'form/fill-now' });
  });

  $(refs.root).on('click.calendar-float', '[data-action="save-form"]', () => {
    void options.dispatch({ type: 'form/save' });
  });

  $(refs.root).on('change.calendar-float', '[data-form-field="type"]', event => {
    const type = parseCalendarBucketType(String((event.currentTarget as HTMLSelectElement).value || '临时'));
    const repeatSelect = refs.formPanel?.querySelector<HTMLSelectElement>('[data-form-field="rule"]');
    if (type === '重复') {
      if (repeatSelect) {
        repeatSelect.value = repeatSelect.value || '每月';
      }
      repeatSelect?.closest<HTMLDetailsElement>('details')?.setAttribute('open', '');
    }
    syncRepeatFormControls(refs.formPanel);
  });

  $(refs.root).on(
    'change.calendar-float',
    '[data-form-field="rule"], [data-form-field="repeat_month_mode"], [data-form-field="repeat_year_mode"]',
    () => {
      syncRepeatFormControls(refs.formPanel);
    },
  );

  $(refs.root).on('change.calendar-float', '[data-action="toggle-repeat-weekday"]', () => {
    syncRepeatWeekdayValue(refs.formPanel);
  });

  $(refs.root).on('input.calendar-float', '[data-action="tag-search-input"]', event => {
    void options.dispatch({
      type: 'tag/search',
      keyword: String((event.currentTarget as HTMLInputElement).value || ''),
    });
  });

  $(refs.root).on('click.calendar-float', '[data-action="toggle-form-tag"]', event => {
    const tag = String((event.currentTarget as HTMLElement).getAttribute('data-tag-value') || '').trim();
    if (tag) {
      void options.dispatch({ type: 'tag/toggle-form', tag });
    }
  });

  $(refs.root).on('click.calendar-float', '[data-action="remove-form-tag"]', event => {
    const tag = String((event.currentTarget as HTMLElement).getAttribute('data-tag-value') || '').trim();
    if (tag) {
      void options.dispatch({ type: 'tag/remove-form', tag });
    }
  });

  $(refs.root).on('click.calendar-float', '[data-action="add-custom-tag"]', () => {
    void options.dispatch({ type: 'tag/add-custom' });
  });

  $(refs.root).on('input.calendar-float', '[data-action="tag-color-search-input"]', event => {
    void options.dispatch({
      type: 'tag-color/search',
      keyword: String((event.currentTarget as HTMLInputElement).value || ''),
    });
  });

  $(refs.root).on('click.calendar-float', '[data-action="add-color-tag"]', () => {
    void options.dispatch({ type: 'tag-color/add' });
  });

  $(refs.root).on('click.calendar-float', '[data-action="select-tag-color"]', event => {
    const tag = String((event.currentTarget as HTMLElement).getAttribute('data-tag-value') || '').trim();
    if (tag) {
      void options.dispatch({ type: 'tag-color/select', tag });
    }
  });

  $(refs.root).on('click.calendar-float', '[data-action="apply-tag-color-palette"]', event => {
    const button = event.currentTarget as HTMLElement;
    const background = String(button.getAttribute('data-background') || '').trim();
    const text = String(button.getAttribute('data-text') || '').trim();
    const border = String(button.getAttribute('data-border') || '').trim();
    if (background && text) {
      void options.dispatch({
        type: 'tag-color/apply-palette',
        color: { background, text, ...(border ? { border } : {}) },
      });
    }
  });

  $(refs.root).on('click.calendar-float', '[data-action="save-tag-color-hex"]', () => {
    void options.dispatch({ type: 'tag-color/save-hex' });
  });

  $(refs.root).on('click.calendar-float', '[data-action="reset-tag-color"]', () => {
    void options.dispatch({ type: 'tag-color/reset' });
  });

  $(refs.root).on('input.calendar-float', '[data-action="policy-tag-search-input"]', event => {
    const input = event.currentTarget as HTMLInputElement;
    const field = String(input.getAttribute('data-policy-tag-field') || '').trim();
    if (field) {
      void options.dispatch({ type: 'policy-tag/search', field, keyword: String(input.value || '') });
    }
  });

  $(refs.root).on('click.calendar-float', '[data-action="toggle-policy-tag"]', event => {
    const button = event.currentTarget as HTMLElement;
    const field = String(button.getAttribute('data-policy-tag-field') || '').trim();
    const tag = String(button.getAttribute('data-tag-value') || '').trim();
    if (field && tag) {
      void options.dispatch({ type: 'policy-tag/toggle', field, tag });
    }
  });

  $(refs.root).on('click.calendar-float', '[data-action="remove-policy-tag"]', event => {
    const button = event.currentTarget as HTMLElement;
    const field = String(button.getAttribute('data-policy-tag-field') || '').trim();
    const tag = String(button.getAttribute('data-tag-value') || '').trim();
    if (field && tag) {
      void options.dispatch({ type: 'policy-tag/remove', field, tag });
    }
  });

  $(refs.root).on('click.calendar-float', '[data-action="add-policy-tag"]', event => {
    const field = String((event.currentTarget as HTMLElement).getAttribute('data-policy-tag-field') || '').trim();
    if (field) {
      void options.dispatch({ type: 'policy-tag/add', field });
    }
  });

  $(refs.root).on('click.calendar-float', '[data-action="toggle-policy-tag-list"]', event => {
    const field = String((event.currentTarget as HTMLElement).getAttribute('data-policy-tag-field') || '').trim();
    if (field) {
      void options.dispatch({ type: 'policy-tag/toggle-list', field });
    }
  });

  $(refs.root).on('click.calendar-float', '[data-action="pick-day"]', event => {
    const dateKey = String((event.currentTarget as HTMLElement).getAttribute('data-date-key') || '');
    if (!dateKey) {
      return;
    }
    void options.dispatch({ type: 'calendar/pick-day', dateKey });
  });

  $(refs.root).on('click.calendar-float', '[data-action="month-prev"]', () => {
    void options.dispatch({ type: 'calendar/month-prev' });
  });

  $(refs.root).on('click.calendar-float', '[data-action="month-next"]', () => {
    void options.dispatch({ type: 'calendar/month-next' });
  });

  $(refs.root).on('click.calendar-float', '[data-action="month-today"]', () => {
    void options.dispatch({ type: 'calendar/month-today' });
  });

  $(refs.root).on('click.calendar-float', '[data-action="open-book"]', event => {
    event.preventDefault();
    event.stopPropagation();
    const bookId = String((event.currentTarget as HTMLElement).getAttribute('data-book-id') || '');
    if (!bookId) {
      return;
    }
    void options.dispatch({ type: 'book/open', bookId });
  });

  $(refs.root).on('click.calendar-float', '[data-action="open-book-page"]', event => {
    const pageIndex = Number((event.currentTarget as HTMLElement).getAttribute('data-page-index') || '0');
    void options.dispatch({ type: 'book/open-page', pageIndex: Number.isFinite(pageIndex) ? pageIndex : 0 });
  });

  $(refs.root).on('click.calendar-float', '[data-action="book-prev-page"]', () => {
    void options.dispatch({ type: 'book/prev-page' });
  });

  $(refs.root).on('click.calendar-float', '[data-action="book-next-page"]', () => {
    void options.dispatch({ type: 'book/next-page' });
  });

  $(refs.root).on('click.calendar-float', '[data-action="quick-input-book-trigger"]', event => {
    const triggerText = String((event.currentTarget as HTMLElement).getAttribute('data-trigger-text') || '').trim();
    if (!triggerText) {
      return;
    }
    void options.dispatch({ type: 'book/quick-input', triggerText });
  });

  $(refs.root).on('click.calendar-float', '[data-action="close-book-reader"]', () => {
    void options.dispatch({ type: 'book/close' });
  });

  $(refs.root).on('click.calendar-float', '[data-action="edit-event"]', event => {
    const eventId = String((event.currentTarget as HTMLElement).getAttribute('data-event-id') || '');
    if (!eventId) {
      return;
    }
    void options.dispatch({ type: 'event/edit', eventId });
  });

  $(refs.root).on('click.calendar-float', '[data-action="complete-event"]', event => {
    const eventId = String((event.currentTarget as HTMLElement).getAttribute('data-event-id') || '');
    if (!eventId) {
      return;
    }
    const eventType = parseCalendarBucketType(
      String((event.currentTarget as HTMLElement).getAttribute('data-event-type') || '临时'),
    );
    void options.dispatch({ type: 'event/complete', eventId, eventType });
  });

  $(refs.root).on('click.calendar-float', '[data-action="delete-event"]', event => {
    const eventId = String((event.currentTarget as HTMLElement).getAttribute('data-event-id') || '');
    if (!eventId) {
      return;
    }
    void options.dispatch({ type: 'event/delete', eventId });
  });

  $(refs.root).on('click.calendar-float', '[data-action="restore-event"]', event => {
    const eventId = String((event.currentTarget as HTMLElement).getAttribute('data-event-id') || '');
    if (!eventId) {
      return;
    }
    void options.dispatch({ type: 'event/restore', eventId });
  });

  $(refs.root).on('click.calendar-float', '[data-action="purge-event"]', event => {
    const eventId = String((event.currentTarget as HTMLElement).getAttribute('data-event-id') || '');
    if (!eventId) {
      return;
    }
    void options.dispatch({ type: 'event/purge', eventId });
  });

  $(refs.root).on('click.calendar-float', '[data-action="save-archive-policy"]', () => {
    void options.dispatch({ type: 'archive/save-policy' });
  });

  $(refs.root).on('click.calendar-float', '[data-action="purge-auto-delete-archive"]', () => {
    void options.dispatch({ type: 'archive/purge-auto-delete' });
  });

  $(refs.root).on('input.calendar-float', '[data-action="agenda-filter-input"]', event => {
    void options.dispatch({
      type: 'agenda/filter',
      keyword: String((event.currentTarget as HTMLInputElement).value || ''),
    });
  });

  $(refs.root).on('change.calendar-float', '[data-action="agenda-toggle-archived"]', event => {
    void options.dispatch({
      type: 'agenda/toggle-archived',
      checked: Boolean((event.currentTarget as HTMLInputElement).checked),
    });
  });

  $(refs.root).on('change.calendar-float', '[data-action="agenda-sort-select"]', event => {
    void options.dispatch({
      type: 'agenda/sort',
      mode: parseAgendaSort(String((event.currentTarget as HTMLSelectElement).value || 'date-asc')),
    });
  });

  $(refs.root).on('click.calendar-float', '[data-action="open-agenda-item-date"]', event => {
    const target = event.target as HTMLElement | null;
    if (
      target?.closest(
        '[data-action="edit-event"], [data-action="complete-event"], [data-action="delete-event"], [data-action="restore-event"], [data-action="purge-event"], [data-action="open-book"], [data-action="open-book-page"], [data-action="book-prev-page"], [data-action="book-next-page"], [data-action="quick-input-book-trigger"], [data-action="close-book-reader"]',
      )
    ) {
      return;
    }
    const dateKey = String((event.currentTarget as HTMLElement).getAttribute('data-date-key') || '');
    if (!dateKey) {
      return;
    }
    void options.dispatch({ type: 'agenda/open-date', dateKey });
  });

  $(refs.root).on('mousedown.calendar-float', '[data-drag-handle="panel"]', event => {
    void options.dispatch({ type: 'layout/panel-drag-start', event: event as unknown as MouseEvent });
  });

  $(rootDocument).on('mousemove.calendar-float-panel-drag', event => {
    void options.dispatch({ type: 'layout/panel-drag-move', event: event as unknown as MouseEvent });
  });

  $(rootDocument).on('mouseup.calendar-float-panel-drag', () => {
    void options.dispatch({ type: 'layout/panel-drag-end' });
  });

  $(ballDocument).on('mousemove.calendar-float-ball-drag', event => {
    void options.dispatch({ type: 'layout/ball-drag-move', clientX: event.clientX, clientY: event.clientY });
  });

  $(ballDocument).on('mouseup.calendar-float-ball-drag', () => {
    void options.dispatch({ type: 'layout/ball-drag-end' });
  });

  $(ballDocument).on('touchmove.calendar-float-ball-drag', event => {
    const point = getTouchClientPoint(event);
    if (!point) {
      return;
    }
    void options.dispatch({ type: 'layout/ball-drag-move', clientX: point.clientX, clientY: point.clientY });
  });

  $(ballDocument).on('touchend.calendar-float-ball-drag touchcancel.calendar-float-ball-drag', () => {
    void options.dispatch({ type: 'layout/ball-drag-end' });
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
    void options.dispatch({ type: 'layout/window-resize' });
  });
}
