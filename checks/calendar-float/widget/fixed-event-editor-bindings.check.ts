import {
  bindFixedEventIndexEditorDialogEvents,
  type FixedEventEditorBindingIntent,
} from '../../../src/calendar-float/widget/fixed-event-editor-bindings';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

interface FakeElement {
  dataset: Record<string, string>;
  value: string;
  onclick?: () => void;
  oninput?: () => void;
  onchange?: () => void;
  querySelector: (selector: string) => FakeElement | null;
  closest: (selector: string) => FakeElement | null;
  classList: { toggle: (name: string, force?: boolean) => void };
}

function createElement(
  args: Partial<Omit<FakeElement, 'querySelector' | 'closest' | 'classList'>> & {
    fields?: Record<string, FakeElement>;
    closest?: (selector: string) => FakeElement | null;
    toggles?: string[];
  } = {},
): FakeElement {
  const fields = args.fields ?? {};
  const toggles = args.toggles ?? [];
  return {
    dataset: args.dataset ?? {},
    value: args.value ?? '',
    querySelector: selector => fields[selector] ?? null,
    closest: args.closest ?? (() => null),
    classList: {
      toggle: (name, force) => toggles.push(`${name}:${String(force)}`),
    },
  };
}

function field(value: string): FakeElement {
  return createElement({ value });
}

function createRow(dataset: Record<string, string>, values: Record<string, string>): FakeElement {
  const fields = Object.fromEntries(
    Object.entries(values).map(([name, value]) => [`[data-field="${name}"]`, field(value)]),
  );
  return createElement({ dataset, fields });
}

function createLayer(args: {
  all?: Record<string, FakeElement[]>;
  one?: Record<string, FakeElement | null>;
}): HTMLElement {
  return {
    querySelectorAll: (selector: string) => args.all?.[selector] ?? [],
    querySelector: (selector: string) => args.one?.[selector] ?? null,
  } as unknown as HTMLElement;
}

function createIntentRecorder() {
  const intents: FixedEventEditorBindingIntent[] = [];
  return {
    intents,
    onIntent: (intent: FixedEventEditorBindingIntent) => {
      intents.push(intent);
    },
  };
}

const EMPTY_EDIT_ROWS = {
  '[data-role="fixed-event-month-alias-row"]': [],
  '[data-role="fixed-event-edit-row"][data-scope="group"]': [],
  '[data-role="fixed-event-edit-row"][data-scope="event"]': [],
  '[data-role="fixed-event-stage-row"]': [],
  '[data-role="fixed-event-edit-row"][data-scope="material"]': [],
};

function testTopLevelActionsEmitTypedCommands(): void {
  const groupRow = createRow(
    { scope: 'group', id: 'group_1' },
    { name: '新分组名', iconSvgFilename: '', eventIdsText: 'event_1' },
  );
  const close = createElement();
  const reload = createElement();
  const save = createElement();
  const createTemplate = createElement();
  const apply = createElement();
  const folder = createElement({ dataset: { expanded: 'true' } });
  const pane = createElement({
    dataset: { section: 'events', scope: 'group', id: 'group_1' },
    closest: selector => (selector === '[data-role="fixed-event-group-folder"]' ? folder : null),
  });
  const layer = createLayer({
    all: {
      ...EMPTY_EDIT_ROWS,
      '[data-role="fixed-event-edit-row"][data-scope="group"]': [groupRow],
      '[data-action="close-fixed-event-index-editor"]': [close],
      '[data-action="select-fixed-event-index-pane"]': [pane],
    },
    one: {
      '[data-action="reload-fixed-event-index-editor"]': reload,
      '[data-action="save-fixed-event-index-editor"]': save,
      '[data-action="create-empty-fixed-event-index-template"]': createTemplate,
      '[data-action="apply-fixed-event-index-structured-edit"]': apply,
    },
  });
  const recorder = createIntentRecorder();

  bindFixedEventIndexEditorDialogEvents(layer, recorder);
  close.onclick?.();
  reload.onclick?.();
  save.onclick?.();
  createTemplate.onclick?.();
  apply.onclick?.();
  pane.onclick?.();

  assert(recorder.intents[0].type === 'commands', 'close 应输出 command intent');
  assert(recorder.intents[0].commands[0]?.type === 'close-request', 'close 应映射 close-request');
  assert(
    recorder.intents[1].type === 'commands' && recorder.intents[1].commands[0]?.type === 'reload',
    'reload 应映射 reload',
  );
  assert(recorder.intents[2].type === 'commands', 'save 应输出 commands');
  assert(
    recorder.intents[2].commands.map(command => command.type).join('|') === 'apply-structured|save',
    'save 前必须先同步当前可见 structured edits',
  );
  const saveEdits = recorder.intents[2].commands[0];
  assert(
    saveEdits.type === 'apply-structured' && saveEdits.edits.groups[0]?.name === '新分组名',
    'save intent 必须携带 DOM-free edits',
  );
  assert(!('sourceYaml' in saveEdits.edits) && !('sourceInfo' in saveEdits.edits), 'edits 不得泄漏 session source');
  assert(saveEdits.edits.monthAliases === undefined, '未渲染月份别名页面时不得用空数组清空现有别名');
  assert(
    recorder.intents[3].type === 'commands' && recorder.intents[3].commands[0]?.type === 'create-template',
    'template 必须可达',
  );
  assert(
    recorder.intents[4].type === 'commands' &&
      recorder.intents[4].commands[0]?.type === 'apply-structured' &&
      recorder.intents[4].commands[0].showMessage === true,
    '显式 apply 必须请求 feedback',
  );
  assert(
    recorder.intents[5].type === 'commands' && recorder.intents[5].render === 'selection',
    'pane 切换必须由 host 处理 scroll/render',
  );
  assert(
    recorder.intents[5].commands.map(command => command.type).join('|') === 'apply-structured|select',
    'pane 切换前必须先同步当前字段',
  );
  const select = recorder.intents[5].commands[1];
  assert(select.type === 'select' && select.selection.scope === 'overview', '已展开 group 再点击必须折叠回 overview');
}

function testInputsEmitEditsAndOwnRecurrenceDomBehavior(): void {
  const regularInput = createElement({ dataset: { field: 'name' } });
  const recurrenceInput = createElement({ dataset: { field: 'recurrenceIntervalYears' }, value: '' });
  const lastYear = field('488');
  const toggles: string[] = [];
  const recurrenceWrapper = createElement({
    toggles,
    fields: { '[data-field="recurrenceLastYear"]': lastYear },
  });
  const coreFields = createElement({
    fields: { '[data-role="fixed-event-recurrence-last-year-field"]': recurrenceWrapper },
  });
  recurrenceInput.closest = selector => (selector === '[data-role="fixed-event-core-fields"]' ? coreFields : null);
  const eventRow = createRow(
    { scope: 'event', id: 'event_1' },
    {
      name: 'typing',
      groupId: 'group_1',
      start: '01-01',
      end: '01-02',
      recurrenceIntervalYears: '',
      recurrenceLastYear: '488',
    },
  );
  const yaml = createElement({ value: 'next yaml' });
  const inputSelector =
    '[data-role="fixed-event-edit-row"] input, [data-role="fixed-event-edit-row"] textarea, [data-role="fixed-event-edit-row"] select, [data-role="fixed-event-stage-row"] input, [data-role="fixed-event-stage-row"] textarea, [data-role="fixed-event-stage-row"] select, [data-role="fixed-event-profile-row"] input, [data-role="fixed-event-profile-row"] textarea, [data-role="fixed-event-profile-row"] select, [data-role="fixed-event-defaults-row"] input, [data-role="fixed-event-defaults-row"] textarea, [data-role="fixed-event-defaults-row"] select, [data-role="fixed-event-reminder-defaults-row"] input, [data-role="fixed-event-reminder-defaults-row"] textarea, [data-role="fixed-event-reminder-defaults-row"] select, [data-role="fixed-event-book-defaults-row"] input, [data-role="fixed-event-book-defaults-row"] textarea, [data-role="fixed-event-book-defaults-row"] select, [data-role="fixed-event-month-alias-row"] input, [data-role="fixed-event-month-alias-row"] textarea, [data-role="fixed-event-month-alias-row"] select';
  const layer = createLayer({
    all: {
      ...EMPTY_EDIT_ROWS,
      [inputSelector]: [regularInput, recurrenceInput],
      '[data-role="fixed-event-edit-row"][data-scope="event"]': [eventRow],
    },
    one: { '[data-role="fixed-event-index-yaml"]': yaml },
  });
  const recorder = createIntentRecorder();

  bindFixedEventIndexEditorDialogEvents(layer, recorder);
  regularInput.oninput?.();
  recurrenceInput.onchange?.();
  yaml.oninput?.();

  assert(
    recorder.intents[0].type === 'commands' && recorder.intents[0].render === 'none',
    '普通输入不得要求 host rerender',
  );
  assert(recorder.intents[0].commands[0]?.type === 'apply-structured', '普通输入必须输出 structured intent');
  assert(toggles.includes('is-hidden:true') && lastYear.value === '', 'recurrence DOM 显隐和清值必须留在 bindings');
  assert(
    recorder.intents[2].type === 'commands' && recorder.intents[2].commands[0]?.type === 'replace-yaml',
    'raw YAML 必须输出 replace-yaml',
  );
  assert(recorder.intents[2].commands[0].yaml === 'next yaml', 'raw YAML intent 必须保留文本');
}

function testRowsAndRenameEmitOnlyDomFreeIdentity(): void {
  const editRow = createRow({ scope: 'event', id: 'event_1' }, { name: 'row edit' });
  const stageRow = createRow(
    { eventId: 'event_1', id: 'stage_1' },
    { name: 'stage edit', start: '01-01', end: '01-02' },
  );
  const addGroup = createElement();
  const removeRow = createElement({ closest: () => editRow });
  const addStage = createElement({ dataset: { eventId: 'event_1' } });
  const moveStage = createElement({ closest: () => stageRow });
  const rename = createElement({ closest: () => editRow });
  const layer = createLayer({
    all: {
      ...EMPTY_EDIT_ROWS,
      '[data-role="fixed-event-edit-row"][data-scope="event"]': [editRow],
      '[data-role="fixed-event-stage-row"]': [stageRow],
      '[data-action="add-fixed-event-index-group"]': [addGroup],
      '[data-action="remove-fixed-event-index-row"]': [removeRow],
      '[data-action="add-fixed-event-index-stage"]': [addStage],
      '[data-action="move-fixed-event-index-stage-down"]': [moveStage],
      '[data-action="rename-fixed-event-index-row-id"]': [rename],
    },
  });
  const recorder = createIntentRecorder();

  bindFixedEventIndexEditorDialogEvents(layer, recorder);
  addGroup.onclick?.();
  removeRow.onclick?.();
  addStage.onclick?.();
  moveStage.onclick?.();
  rename.onclick?.();

  const rowIntents = recorder.intents.slice(0, 4);
  const expected = ['add-group', 'remove-row', 'add-stage', 'move-stage-down'];
  rowIntents.forEach((intent, index) => {
    assert(intent.type === 'commands' && intent.render === 'shell', 'row operation 必须要求 host render');
    assert(
      intent.commands.map(command => command.type).join('|') === 'apply-structured|row-operation',
      'row 前必须同步 fields',
    );
    const row = intent.commands[1];
    assert(row.type === 'row-operation' && row.operation === expected[index], 'row operation 名称必须保持');
    assert(!('querySelector' in row.row) && !('closest' in row.row), 'row intent 不得携带 HTMLElement');
  });
  const remove = rowIntents[1];
  assert(remove.type === 'commands' && remove.commands[1].type === 'row-operation', 'remove intent 必须存在');
  assert(
    remove.commands[1].row.scope === 'event' && remove.commands[1].row.id === 'event_1',
    'remove 必须提取 closest row identity',
  );

  const renameIntent = recorder.intents[4];
  assert(renameIntent.type === 'rename-request', 'rename 必须输出独立 DOM-free request');
  assert(
    renameIntent.input.scope === 'event' && renameIntent.input.oldId === 'event_1',
    'rename request 必须保留 identity',
  );
  assert(
    !('sourceYaml' in renameIntent.input) && !('sourceInfo' in renameIntent.input),
    'rename request 不得泄漏 source',
  );
  assert(renameIntent.edits.events[0]?.name === 'row edit', 'rename dialog 前必须携带当前可见 edits');
}

function main(): void {
  testTopLevelActionsEmitTypedCommands();
  testInputsEmitEditsAndOwnRecurrenceDomBehavior();
  testRowsAndRenameEmitOnlyDomFreeIdentity();
  console.log('widget/fixed-event-editor-bindings.check.ts OK');
}

main();
