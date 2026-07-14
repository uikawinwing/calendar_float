// eslint-disable-next-line import-x/no-nodejs-modules -- this focused source/DOM adapter check runs under ts-node.
import { readFileSync } from 'node:fs';
// eslint-disable-next-line import-x/no-nodejs-modules -- this focused source/DOM adapter check runs under ts-node.
import { resolve } from 'node:path';

import type { WidgetAction } from '../../../src/calendar-float/widget/actions';

declare const require: NodeRequire;

const ACTION_TYPES = [
  'panel/toggle',
  'panel/close',
  'panel/reload',
  'panel/toggle-fullscreen',
  'theme/toggle',
  'festival/toggle-scope',
  'calendar/pick-day',
  'calendar/month-prev',
  'calendar/month-next',
  'calendar/month-today',
  'sidebar/switch',
  'agenda/filter',
  'agenda/toggle-archived',
  'agenda/sort',
  'agenda/open-date',
  'book/open',
  'book/open-page',
  'book/prev-page',
  'book/next-page',
  'book/quick-input',
  'book/close',
  'form/open-create',
  'form/cancel',
  'form/fill-now',
  'form/save',
  'event/edit',
  'event/complete',
  'event/delete',
  'event/restore',
  'event/purge',
  'archive/save-policy',
  'archive/purge-auto-delete',
  'tag/search',
  'tag/toggle-form',
  'tag/remove-form',
  'tag/add-custom',
  'tag-color/open',
  'tag-color/close',
  'tag-color/search',
  'tag-color/add',
  'tag-color/select',
  'tag-color/apply-palette',
  'tag-color/save-hex',
  'tag-color/reset',
  'policy-tag/search',
  'policy-tag/toggle',
  'policy-tag/remove',
  'policy-tag/add',
  'policy-tag/toggle-list',
  'managed-worldbook/open',
  'fixed-event-editor/open',
  'mobile/open-agenda',
  'mobile/close-side',
  'layout/panel-drag-start',
  'layout/panel-drag-move',
  'layout/panel-drag-end',
  'layout/ball-drag-start',
  'layout/ball-drag-move',
  'layout/ball-drag-end',
  'layout/window-resize',
] as const;

interface RecordedBinding {
  target: object;
  events: string;
  selector: string | null;
  handler: (event: Record<string, unknown>) => unknown;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertJsonEqual(name: string, actual: unknown, expected: unknown): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${name}: expected ${expectedJson}, got ${actualJson}`);
  }
}

function createElement(
  attributes: Record<string, string> = {},
  properties: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    classList: {
      add: () => undefined,
      contains: () => false,
      remove: () => undefined,
    },
    closest: () => null,
    getAttribute: (name: string) => attributes[name] ?? null,
    ...properties,
  };
}

function runDomToActionContract(): void {
  // Runtime require proves that the production action module exists; the type-only import above is erased.
  require('../../../src/calendar-float/widget/actions');

  const bindings: RecordedBinding[] = [];
  const fakeJquery = (target: object) => {
    const api = {
      off: () => api,
      on: (
        events: string,
        selectorOrHandler: string | ((event: Record<string, unknown>) => unknown),
        maybeHandler?: (event: Record<string, unknown>) => unknown,
      ) => {
        const selector = typeof selectorOrHandler === 'string' ? selectorOrHandler : null;
        const handler = typeof selectorOrHandler === 'function' ? selectorOrHandler : maybeHandler;
        assert(handler, `missing fake-jQuery handler for ${events}`);
        bindings.push({ target, events, selector, handler });
        return api;
      },
    };
    return api;
  };
  (globalThis as typeof globalThis & { $: typeof fakeJquery }).$ = fakeJquery;

  const rootDocument = {};
  const ballDocument = {};
  const hostWindow = {};
  const root = {
    id: 'calendar-root',
    ownerDocument: rootDocument,
    querySelectorAll: () => [],
  };
  const ball = { ownerDocument: ballDocument };
  const actions: WidgetAction[] = [];

  const { bindCalendarWidgetEvents } = require('../../../src/calendar-float/widget/events') as typeof import('../../../src/calendar-float/widget/events');
  bindCalendarWidgetEvents({
    refs: { root, ball } as never,
    hostWindow: hostWindow as Window & typeof globalThis,
    dispatch: action => {
      actions.push(action);
    },
  });

  function handler(target: object, eventName: string, selector: string | null): RecordedBinding['handler'] {
    const binding = bindings.find(
      item => item.target === target && item.events.split(/\s+/u).includes(eventName) && item.selector === selector,
    );
    assert(binding, `missing binding: ${eventName} ${selector ?? '<direct>'}`);
    return binding.handler;
  }

  function expectDispatch(
    name: string,
    target: object,
    eventName: string,
    selector: string | null,
    event: Record<string, unknown>,
    expected: WidgetAction,
  ): void {
    const before = actions.length;
    handler(target, eventName, selector)(event);
    assert(actions.length === before + 1, `${name}: expected exactly one dispatch`);
    assertJsonEqual(name, actions.at(-1), expected);
  }

  expectDispatch(
    'month next',
    root,
    'click.calendar-float',
    '[data-action="month-next"]',
    {},
    { type: 'calendar/month-next' },
  );
  expectDispatch(
    'sidebar parser',
    root,
    'click.calendar-float',
    '[data-action="switch-tab"]',
    { currentTarget: createElement({ 'data-tab': 'archive' }) },
    { type: 'sidebar/switch', tab: 'archive' },
  );
  expectDispatch(
    'agenda filter',
    root,
    'input.calendar-float',
    '[data-action="agenda-filter-input"]',
    { currentTarget: createElement({}, { value: 'needle' }) },
    { type: 'agenda/filter', keyword: 'needle' },
  );
  expectDispatch(
    'agenda sort',
    root,
    'change.calendar-float',
    '[data-action="agenda-sort-select"]',
    { currentTarget: createElement({}, { value: 'festival-first' }) },
    { type: 'agenda/sort', mode: 'festival-first' },
  );
  expectDispatch('form save', root, 'click.calendar-float', '[data-action="save-form"]', {}, { type: 'form/save' });
  expectDispatch(
    'event complete',
    root,
    'click.calendar-float',
    '[data-action="complete-event"]',
    { currentTarget: createElement({ 'data-event-id': 'evt-1', 'data-event-type': '重复' }) },
    { type: 'event/complete', eventId: 'evt-1', eventType: '重复' },
  );
  expectDispatch(
    'form tag',
    root,
    'click.calendar-float',
    '[data-action="toggle-form-tag"]',
    { currentTarget: createElement({ 'data-tag-value': '收藏' }) },
    { type: 'tag/toggle-form', tag: '收藏' },
  );
  expectDispatch(
    'policy tag search',
    root,
    'input.calendar-float',
    '[data-action="policy-tag-search-input"]',
    {
      currentTarget: createElement({ 'data-policy-tag-field': 'protected-tags' }, { value: '收' }),
    },
    { type: 'policy-tag/search', field: 'protected-tags', keyword: '收' },
  );
  expectDispatch(
    'tag color palette',
    root,
    'click.calendar-float',
    '[data-action="apply-tag-color-palette"]',
    {
      currentTarget: createElement({
        'data-background': '#111111',
        'data-text': '#ffffff',
        'data-border': '#222222',
      }),
    },
    {
      type: 'tag-color/apply-palette',
      color: { background: '#111111', text: '#ffffff', border: '#222222' },
    },
  );

  let prevented = false;
  let stopped = false;
  expectDispatch(
    'book open',
    root,
    'click.calendar-float',
    '[data-action="open-book"]',
    {
      currentTarget: createElement({ 'data-book-id': 'book-1' }),
      preventDefault: () => {
        prevented = true;
      },
      stopPropagation: () => {
        stopped = true;
      },
    },
    { type: 'book/open', bookId: 'book-1' },
  );
  assert(prevented && stopped, 'book open must keep DOM preventDefault/stopPropagation in events.ts');
  expectDispatch(
    'invalid book page fallback',
    root,
    'click.calendar-float',
    '[data-action="open-book-page"]',
    { currentTarget: createElement({ 'data-page-index': 'not-a-number' }) },
    { type: 'book/open-page', pageIndex: 0 },
  );
  expectDispatch(
    'managed dialog',
    root,
    'click.calendar-float',
    '[data-action="open-mvu-settings"]',
    { currentTarget: createElement() },
    { type: 'managed-worldbook/open' },
  );
  expectDispatch(
    'fixed event dialog',
    root,
    'click.calendar-float',
    '[data-action="open-fixed-event-index-editor"]',
    { currentTarget: createElement() },
    { type: 'fixed-event-editor/open' },
  );

  let dragPrevented = false;
  expectDispatch(
    'ball drag start',
    ball,
    'mousedown.calendar-float',
    null,
    {
      clientX: 12,
      clientY: 34,
      preventDefault: () => {
        dragPrevented = true;
      },
    },
    { type: 'layout/ball-drag-start', clientX: 12, clientY: 34 },
  );
  assert(dragPrevented, 'ball drag start must keep preventDefault in events.ts');

  const sameMouseEventObject = { clientX: 7, clientY: 8 };
  const beforePanelMove = actions.length;
  handler(rootDocument, 'mousemove.calendar-float-panel-drag', null)(sameMouseEventObject);
  assert(actions.length === beforePanelMove + 1, 'panel drag move should dispatch exactly once');
  const panelMove = actions.at(-1);
  assert(panelMove?.type === 'layout/panel-drag-move', 'panel drag move should emit its exact action type');
  assert(panelMove.event === sameMouseEventObject, 'panel drag move must preserve the original event object');

  expectDispatch(
    'window resize',
    hostWindow,
    'resize.calendar-float-window',
    null,
    {},
    { type: 'layout/window-resize' },
  );

  expectDispatch(
    'invalid sidebar fallback',
    root,
    'click.calendar-float',
    '[data-action="switch-tab"]',
    { currentTarget: createElement({ 'data-tab': 'bad' }) },
    { type: 'sidebar/switch', tab: 'detail' },
  );
  expectDispatch(
    'invalid agenda sort fallback',
    root,
    'change.calendar-float',
    '[data-action="agenda-sort-select"]',
    { currentTarget: createElement({}, { value: 'bad' }) },
    { type: 'agenda/sort', mode: 'date-asc' },
  );
  expectDispatch(
    'invalid event type fallback',
    root,
    'click.calendar-float',
    '[data-action="complete-event"]',
    { currentTarget: createElement({ 'data-event-id': 'evt-2', 'data-event-type': 'bad' }) },
    { type: 'event/complete', eventId: 'evt-2', eventType: '临时' },
  );

  function expectNoDispatch(
    name: string,
    selector: string,
    eventName: string,
    event: Record<string, unknown>,
  ): void {
    const before = actions.length;
    handler(root, eventName, selector)(event);
    assert(actions.length === before, `${name}: invalid/empty DOM input must not dispatch`);
  }

  expectNoDispatch(
    'empty event id',
    '[data-action="complete-event"]',
    'click.calendar-float',
    { currentTarget: createElement({ 'data-event-id': '' }) },
  );
  expectNoDispatch(
    'empty book id',
    '[data-action="open-book"]',
    'click.calendar-float',
    { currentTarget: createElement({ 'data-book-id': '' }), preventDefault: () => undefined, stopPropagation: () => undefined },
  );
  expectNoDispatch(
    'missing policy field',
    '[data-action="toggle-policy-tag"]',
    'click.calendar-float',
    { currentTarget: createElement({ 'data-tag-value': '收藏' }) },
  );
  expectNoDispatch(
    'missing policy tag',
    '[data-action="toggle-policy-tag"]',
    'click.calendar-float',
    { currentTarget: createElement({ 'data-policy-tag-field': 'protected-tags' }) },
  );
  expectNoDispatch(
    'palette missing background',
    '[data-action="apply-tag-color-palette"]',
    'click.calendar-float',
    { currentTarget: createElement({ 'data-text': '#ffffff' }) },
  );
}

function runSourceArchitectureContract(): void {
  const actionsPath = resolve(__dirname, '../../../src/calendar-float/widget/actions.ts');
  const eventsPath = resolve(__dirname, '../../../src/calendar-float/widget/events.ts');
  const indexPath = resolve(__dirname, '../../../src/calendar-float/widget/index.ts');
  const actionsSource = readFileSync(actionsPath, 'utf8');
  const eventsSource = readFileSync(eventsPath, 'utf8');
  const indexSource = readFileSync(indexPath, 'utf8');

  const declaredTypes = [...actionsSource.matchAll(/\btype:\s*'([^']+)'/gu)].map(match => match[1]);
  assertJsonEqual('action union must declare the exact 60 action types', declaredTypes, ACTION_TYPES);
  assert(new Set(declaredTypes).size === 60, 'action union must contain 60 unique type literals');

  const optionsBody = eventsSource.match(/export interface BindCalendarWidgetEventsOptions\s*\{([\s\S]*?)\n\}/u)?.[1];
  assert(optionsBody, 'BindCalendarWidgetEventsOptions must exist');
  assert(!/\bon[A-Z]/u.test(optionsBody), 'BindCalendarWidgetEventsOptions must not contain onX callbacks');
  assertJsonEqual(
    'event options must contain only refs, hostWindow, and dispatch',
    [...optionsBody.matchAll(/^\s*(\w+):/gmu)].map(match => match[1]),
    ['refs', 'hostWindow', 'dispatch'],
  );
  assert(!eventsSource.includes('options.on'), 'events.ts must dispatch actions instead of invoking options.onX');

  const bindEventsBody = indexSource.match(/function bindEvents\(\): void \{([\s\S]*?)\n\}\n\nfunction destroy/u)?.[1];
  assert(bindEventsBody, 'widget host bindEvents() must exist');
  assert(bindEventsBody.includes('dispatch: dispatchWidgetAction'), 'bindEvents() must pass dispatchWidgetAction');
  assert(!/\bon[A-Z][A-Za-z0-9_]*\s*:/u.test(bindEventsBody), 'bindEvents() must not contain callback properties');

  const caseTypes = [...indexSource.matchAll(/case\s+'([^']+)'\s*:/gu)]
    .map(match => match[1])
    .filter((type): type is (typeof ACTION_TYPES)[number] => ACTION_TYPES.includes(type as (typeof ACTION_TYPES)[number]));
  assertJsonEqual('host dispatcher must cover all 60 action cases', caseTypes, ACTION_TYPES);
  assert(
    indexSource.includes('const exhaustiveCheck: never = action'),
    'host dispatcher must contain the exhaustive never gate',
  );
}

runDomToActionContract();
runSourceArchitectureContract();
console.log('widget/actions.check.ts OK');
