import type { DailyAgendaGroup, DailyAgendaItem } from '../../../src/calendar-float/types';

declare const require: NodeRequire;

// eslint-disable-next-line import-x/no-nodejs-modules -- check stubs webpack raw SVG imports under ts-node.
const Module = require('module') as {
  _load: (request: string, parent: NodeJS.Module | null, isMain: boolean) => unknown;
};
const originalLoad = Module._load;
Module._load = (request: string, parent: NodeJS.Module | null, isMain: boolean): unknown => {
  if (request.endsWith('.svg?raw')) {
    return '<svg></svg>';
  }
  return originalLoad(request, parent, isMain);
};

const { renderAgendaPanel, renderAgendaResults } = require('../../../src/calendar-float/widget/render') as typeof import('../../../src/calendar-float/widget/render');

function expectIncludes(html: string, needle: string, message: string): void {
  if (!html.includes(needle)) {
    throw new Error(`${message}; missing ${JSON.stringify(needle)} in ${html}`);
  }
}

function expectExcludes(html: string, needle: string, message: string): void {
  if (html.includes(needle)) {
    throw new Error(`${message}; unexpected ${JSON.stringify(needle)} in ${html}`);
  }
}

function expectCount(html: string, needle: string, expected: number, message: string): void {
  const actual = html.split(needle).length - 1;
  if (actual !== expected) {
    throw new Error(`${message}; expected ${expected}, got ${actual}`);
  }
}

function createItem(overrides: Partial<DailyAgendaItem> = {}): DailyAgendaItem {
  return {
    id: 'active-event',
    dateKey: '488-06-08',
    title: '晨星集会',
    summary: '测试日程摘要',
    kind: 'event',
    source: 'temporary',
    type: '临时',
    startText: '复兴纪元488年6月8日',
    endText: '复兴纪元488年6月8日',
    tags: ['测试'],
    relatedBookIds: [],
    reminderLevel: 'none',
    metadata: {},
    ...overrides,
  };
}

function createGroups(...items: DailyAgendaItem[]): DailyAgendaGroup[] {
  return [{ dateKey: '488-06-08', label: '复兴纪元488年6月8日', items }];
}

const activeItem = createItem();
const options = {
  groups: createGroups(activeItem),
  filterKeyword: '',
  showArchived: false,
  agendaSort: 'date-asc' as const,
  editingEventId: activeItem.id,
};
const panelHtml = renderAgendaPanel(options);
const resultsHtml = renderAgendaResults(options);

expectCount(panelHtml, 'data-action="agenda-filter-input"', 1, 'panel should keep exactly one persistent filter input');
expectCount(panelHtml, 'data-role="agenda-results"', 1, 'panel should keep exactly one persistent results container');
expectIncludes(panelHtml, 'data-action="agenda-toggle-archived"', 'panel should keep archive toggle');
expectIncludes(panelHtml, 'data-action="agenda-sort-select"', 'panel should keep sort select');
expectIncludes(resultsHtml, '晨星集会', 'results should render agenda title');
expectIncludes(resultsHtml, 'th-agenda-item', 'results should render agenda row');
expectIncludes(resultsHtml, 'is-editing', 'results should preserve editing class');
expectIncludes(resultsHtml, '当前编辑', 'results should preserve editing marker');
expectExcludes(resultsHtml, 'agenda-filter-input', 'results must not render filter input');
expectExcludes(resultsHtml, 'th-agenda-toolbar', 'results must not render toolbar');
expectExcludes(resultsHtml, 'month-grid', 'results must not render month grid');
expectExcludes(resultsHtml, 'data-role="agenda-results"', 'results must not nest its own results container');

const emptyHtml = renderAgendaResults({ ...options, filterKeyword: '不存在的关键字', editingEventId: null });
expectIncludes(emptyHtml, '当前筛选条件下没有匹配事件。', 'results should preserve empty state');

const archivedItem = createItem({
  id: 'archived-event',
  title: '隐藏归档事件',
  source: 'archive',
  metadata: {},
});
const hiddenArchiveHtml = renderAgendaResults({
  ...options,
  groups: createGroups(archivedItem),
  editingEventId: null,
});
expectExcludes(hiddenArchiveHtml, archivedItem.title, 'results should preserve archive visibility policy');

console.log('widget/agenda-render.check.ts OK');
