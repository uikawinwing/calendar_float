import { bindFixedEventIndexEditorDialogEvents } from '../../../src/calendar-float/widget/fixed-event-editor-bindings';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

interface FakeElement {
  dataset: Record<string, string>;
  value?: string;
  onclick?: () => void;
  oninput?: () => void;
  onchange?: () => void;
  closest?: (selector: string) => FakeElement | null;
}

function createElement(args: Partial<FakeElement> = {}): FakeElement {
  return {
    dataset: {},
    ...args,
  };
}

function createLayer(args: { all?: Record<string, FakeElement[]>; one?: Record<string, FakeElement | null> }): HTMLElement {
  return {
    querySelectorAll: (selector: string) => args.all?.[selector] ?? [],
    querySelector: (selector: string) => args.one?.[selector] ?? null,
  } as unknown as HTMLElement;
}

function createHandlers() {
  const calls: string[] = [];
  const rows: Array<FakeElement | undefined> = [];
  return {
    calls,
    rows,
    handlers: {
      close: () => calls.push('close'),
      reload: () => calls.push('reload'),
      save: () => calls.push('save'),
      createTemplate: () => calls.push('create-template'),
      applyStructuredEdit: () => calls.push('apply-structured-edit'),
      selectPane: (button: HTMLElement) => calls.push(`select:${(button as unknown as FakeElement).dataset.pane}`),
      syncStructuredEditor: (markDirty: boolean) => calls.push(`sync:${markDirty}`),
      syncRecurrenceFields: () => calls.push('sync-recurrence'),
      updateYamlPreview: (value: string) => calls.push(`yaml:${value}`),
      applyRowOperation: (operation: string, row?: HTMLElement) => {
        calls.push(`row:${operation}`);
        rows.push(row as unknown as FakeElement | undefined);
      },
      renameRowId: (row?: HTMLElement) => {
        calls.push('rename');
        rows.push(row as unknown as FakeElement | undefined);
      },
    },
  };
}

function testBindsTopLevelEditorActions(): void {
  const close = createElement();
  const pane = createElement({ dataset: { pane: 'events' } });
  const reload = createElement();
  const save = createElement();
  const createTemplate = createElement();
  const applyStructuredEdit = createElement();
  const layer = createLayer({
    all: {
      '[data-action="close-fixed-event-index-editor"]': [close],
      '[data-action="select-fixed-event-index-pane"]': [pane],
    },
    one: {
      '[data-action="reload-fixed-event-index-editor"]': reload,
      '[data-action="save-fixed-event-index-editor"]': save,
      '[data-action="create-empty-fixed-event-index-template"]': createTemplate,
      '[data-action="apply-fixed-event-index-structured-edit"]': applyStructuredEdit,
    },
  });
  const { calls, handlers } = createHandlers();

  bindFixedEventIndexEditorDialogEvents(layer, handlers);
  close.onclick?.();
  pane.onclick?.();
  reload.onclick?.();
  save.onclick?.();
  createTemplate.onclick?.();
  applyStructuredEdit.onclick?.();

  assert(calls.join('|') === 'close|select:events|reload|save|create-template|apply-structured-edit', '顶层按钮应该分发到对应 handler');
}

function testBindsEditorInputsAndYamlPreview(): void {
  const regularInput = createElement({ dataset: { field: 'name' } });
  const recurrenceInput = createElement({ dataset: { field: 'recurrenceIntervalYears' } });
  const yamlInput = createElement({ value: 'next yaml' });
  const editSelector =
    '[data-role="fixed-event-edit-row"] input, [data-role="fixed-event-edit-row"] textarea, [data-role="fixed-event-edit-row"] select, [data-role="fixed-event-stage-row"] input, [data-role="fixed-event-stage-row"] textarea, [data-role="fixed-event-stage-row"] select, [data-role="fixed-event-profile-row"] input, [data-role="fixed-event-profile-row"] textarea, [data-role="fixed-event-profile-row"] select, [data-role="fixed-event-defaults-row"] input, [data-role="fixed-event-defaults-row"] textarea, [data-role="fixed-event-defaults-row"] select, [data-role="fixed-event-reminder-defaults-row"] input, [data-role="fixed-event-reminder-defaults-row"] textarea, [data-role="fixed-event-reminder-defaults-row"] select, [data-role="fixed-event-book-defaults-row"] input, [data-role="fixed-event-book-defaults-row"] textarea, [data-role="fixed-event-book-defaults-row"] select, [data-role="fixed-event-month-alias-row"] input, [data-role="fixed-event-month-alias-row"] textarea, [data-role="fixed-event-month-alias-row"] select';
  const layer = createLayer({
    all: {
      [editSelector]: [regularInput, recurrenceInput],
    },
    one: {
      '[data-role="fixed-event-index-yaml"]': yamlInput,
    },
  });
  const { calls, handlers } = createHandlers();

  bindFixedEventIndexEditorDialogEvents(layer, handlers);
  regularInput.oninput?.();
  recurrenceInput.onchange?.();
  yamlInput.oninput?.();

  assert(calls.join('|') === 'sync:false|sync-recurrence|sync:false|yaml:next yaml', '输入绑定应该保持同步和 YAML preview 行为');
}

function testBindsRowOperationsWithClosestRows(): void {
  const editRow = createElement({ dataset: { scope: 'event', id: 'event_1' } });
  const stageRow = createElement({ dataset: { eventId: 'event_1', id: 'stage_1' } });
  const addGroup = createElement();
  const removeRow = createElement({ closest: () => editRow });
  const addStage = createElement({ dataset: { eventId: 'event_1' } });
  const removeStage = createElement({ closest: () => stageRow });
  const moveStageDown = createElement({ closest: () => stageRow });
  const rename = createElement({ closest: () => editRow });
  const layer = createLayer({
    all: {
      '[data-action="remove-fixed-event-index-row"]': [removeRow],
      '[data-action="add-fixed-event-index-stage"]': [addStage],
      '[data-action="remove-fixed-event-index-stage"]': [removeStage],
      '[data-action="move-fixed-event-index-stage-down"]': [moveStageDown],
      '[data-action="rename-fixed-event-index-row-id"]': [rename],
    },
    one: {
      '[data-action="add-fixed-event-index-group"]': addGroup,
    },
  });
  const { calls, rows, handlers } = createHandlers();

  bindFixedEventIndexEditorDialogEvents(layer, handlers);
  addGroup.onclick?.();
  removeRow.onclick?.();
  addStage.onclick?.();
  removeStage.onclick?.();
  moveStageDown.onclick?.();
  rename.onclick?.();

  assert(
    calls.join('|') === 'row:add-group|row:remove-row|row:add-stage|row:remove-stage|row:move-stage-down|rename',
    '行操作按钮应该保持原来的 operation 分发',
  );
  assert(rows[0] === undefined, 'add-group 不应该传 row');
  assert(rows[1] === editRow, 'remove-row 应该传最近的 fixed-event-edit-row');
  assert(rows[2] === addStage, 'add-stage 应该传按钮本身');
  assert(rows[3] === stageRow, 'remove-stage 应该传最近的 stage row');
  assert(rows[4] === stageRow, 'move-stage-down 应该传最近的 stage row');
  assert(rows[5] === editRow, 'rename 应该传最近的 editable row');
}

function main(): void {
  testBindsTopLevelEditorActions();
  testBindsEditorInputsAndYamlPreview();
  testBindsRowOperationsWithClosestRows();
  console.log('widget/fixed-event-editor-bindings.check.ts OK');
}

main();
