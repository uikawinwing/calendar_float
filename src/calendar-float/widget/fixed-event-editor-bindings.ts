import {
  collectMonthAliasStructuredEdits,
  type FixedEventBookDefaultsStructuredEdit,
  type FixedEventDefaultsStructuredEdit,
  type FixedEventGroupStructuredEdit,
  type FixedEventIndexEditorSelection,
  type FixedEventMaterialStructuredEdit,
  type FixedEventProfileStructuredEdit,
  type FixedEventReminderDefaultsStructuredEdit,
  type FixedEventStageStructuredEdit,
  type FixedEventStructuredEdit,
} from '../fixed-event-index-editor';
import type { FixedEventEditorSessionCommand, FixedEventEditorStructuredEdits } from './fixed-event-editor-session';
import type { FixedEventEditorRenameScope } from './fixed-event-editor-rename-policy';

const FIXED_EVENT_EDITOR_INPUT_SELECTOR =
  '[data-role="fixed-event-edit-row"] input, [data-role="fixed-event-edit-row"] textarea, [data-role="fixed-event-edit-row"] select, [data-role="fixed-event-stage-row"] input, [data-role="fixed-event-stage-row"] textarea, [data-role="fixed-event-stage-row"] select, [data-role="fixed-event-profile-row"] input, [data-role="fixed-event-profile-row"] textarea, [data-role="fixed-event-profile-row"] select, [data-role="fixed-event-defaults-row"] input, [data-role="fixed-event-defaults-row"] textarea, [data-role="fixed-event-defaults-row"] select, [data-role="fixed-event-reminder-defaults-row"] input, [data-role="fixed-event-reminder-defaults-row"] textarea, [data-role="fixed-event-reminder-defaults-row"] select, [data-role="fixed-event-book-defaults-row"] input, [data-role="fixed-event-book-defaults-row"] textarea, [data-role="fixed-event-book-defaults-row"] select, [data-role="fixed-event-month-alias-row"] input, [data-role="fixed-event-month-alias-row"] textarea, [data-role="fixed-event-month-alias-row"] select';

const FIXED_EVENT_STAGE_ROW_SELECTOR = '[data-role="fixed-event-stage-row"], [data-role="fixed-event-stage-list-row"]';

export type FixedEventEditorBindingIntent =
  | {
      type: 'commands';
      commands: FixedEventEditorSessionCommand[];
      render: 'none' | 'shell' | 'selection';
    }
  | {
      type: 'rename-request';
      edits: FixedEventEditorStructuredEdits;
      input: { scope: FixedEventEditorRenameScope; oldId: string };
    };

export interface FixedEventIndexEditorDialogEventHandlers {
  onIntent(intent: FixedEventEditorBindingIntent): void | Promise<void>;
}

function bindClick(
  layer: HTMLElement,
  selector: string,
  handler: (element: HTMLElement) => void | Promise<void>,
): void {
  const element = layer.querySelector<HTMLElement>(selector);
  if (element) {
    element.onclick = () => {
      void handler(element);
    };
  }
}

function bindClickAll(
  layer: HTMLElement,
  selector: string,
  handler: (element: HTMLElement) => void | Promise<void>,
): void {
  layer.querySelectorAll<HTMLElement>(selector).forEach(element => {
    element.onclick = () => {
      void handler(element);
    };
  });
}

function readFixedEventEditField(row: HTMLElement, field: string): string | undefined {
  const input = row.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    `[data-field="${field}"]`,
  );
  return input ? String(input.value ?? '').trim() : undefined;
}

function readRequiredFixedEventEditField(row: HTMLElement, field: string): string {
  return readFixedEventEditField(row, field) ?? '';
}

export function collectFixedEventEditorStructuredEdits(layer: HTMLElement): FixedEventEditorStructuredEdits {
  const profileRow = layer.querySelector<HTMLElement>('[data-role="fixed-event-profile-row"]');
  const defaultsRow = layer.querySelector<HTMLElement>('[data-role="fixed-event-defaults-row"]');
  const reminderDefaultsRow = layer.querySelector<HTMLElement>('[data-role="fixed-event-reminder-defaults-row"]');
  const bookDefaultsRow = layer.querySelector<HTMLElement>('[data-role="fixed-event-book-defaults-row"]');
  const monthAliasRows = [...layer.querySelectorAll<HTMLElement>('[data-role="fixed-event-month-alias-row"]')];
  const groupRows = [...layer.querySelectorAll<HTMLElement>('[data-role="fixed-event-edit-row"][data-scope="group"]')];
  const eventRows = [...layer.querySelectorAll<HTMLElement>('[data-role="fixed-event-edit-row"][data-scope="event"]')];
  const stageRows = [...layer.querySelectorAll<HTMLElement>('[data-role="fixed-event-stage-row"]')];
  const materialRows = [
    ...layer.querySelectorAll<HTMLElement>('[data-role="fixed-event-edit-row"][data-scope="material"]'),
  ];

  const profile: FixedEventProfileStructuredEdit | undefined = profileRow
    ? {
        id: readFixedEventEditField(profileRow, 'id'),
        label: readFixedEventEditField(profileRow, 'label'),
        worldTimePath: readFixedEventEditField(profileRow, 'worldTimePath'),
        worldLocationPath: readFixedEventEditField(profileRow, 'worldLocationPath'),
        eraName: readFixedEventEditField(profileRow, 'eraName'),
        useChineseNumeralYear: readFixedEventEditField(profileRow, 'useChineseNumeralYear'),
      }
    : undefined;
  const defaults: FixedEventDefaultsStructuredEdit | undefined = defaultsRow
    ? {
        mvuTimePath: readFixedEventEditField(defaultsRow, 'mvuTimePath'),
        mvuLocationPath: readFixedEventEditField(defaultsRow, 'mvuLocationPath'),
        fullBookTriggerTemplate: readFixedEventEditField(defaultsRow, 'fullBookTriggerTemplate'),
      }
    : undefined;
  const reminderDefaults: FixedEventReminderDefaultsStructuredEdit | undefined = reminderDefaultsRow
    ? {
        outputMode: readFixedEventEditField(reminderDefaultsRow, 'outputMode'),
        injectDepth: readFixedEventEditField(reminderDefaultsRow, 'injectDepth'),
        disableRecursive: readFixedEventEditField(reminderDefaultsRow, 'disableRecursive'),
        disableKeywords: readFixedEventEditField(reminderDefaultsRow, 'disableKeywords'),
        macroTemplate: readFixedEventEditField(reminderDefaultsRow, 'macroTemplate'),
        inactiveTemplate: readFixedEventEditField(reminderDefaultsRow, 'inactiveTemplate'),
        activeTemplate: readFixedEventEditField(reminderDefaultsRow, 'activeTemplate'),
      }
    : undefined;
  const bookDefaults: FixedEventBookDefaultsStructuredEdit | undefined = bookDefaultsRow
    ? {
        summaryOutputMode: readFixedEventEditField(bookDefaultsRow, 'summaryOutputMode'),
        summaryInjectDepth: readFixedEventEditField(bookDefaultsRow, 'summaryInjectDepth'),
      }
    : undefined;
  const monthAliases = collectMonthAliasStructuredEdits(
    monthAliasRows.map(row => ({
      month: readRequiredFixedEventEditField(row, 'month'),
      name: readRequiredFixedEventEditField(row, 'name'),
      season: readFixedEventEditField(row, 'season'),
    })),
  );
  const groups: FixedEventGroupStructuredEdit[] = groupRows.map(row => ({
    id: String(row.dataset.id ?? '').trim(),
    name: readRequiredFixedEventEditField(row, 'name'),
    iconSvgFilename: readFixedEventEditField(row, 'iconSvgFilename'),
    eventIdsText: readRequiredFixedEventEditField(row, 'eventIdsText'),
  }));
  const events: FixedEventStructuredEdit[] = eventRows.map(row => ({
    id: String(row.dataset.id ?? '').trim(),
    name: readFixedEventEditField(row, 'name'),
    groupId: readFixedEventEditField(row, 'groupId'),
    start: readFixedEventEditField(row, 'start'),
    end: readFixedEventEditField(row, 'end'),
    recurrenceIntervalYears: readFixedEventEditField(row, 'recurrenceIntervalYears'),
    recurrenceLastYear: readFixedEventEditField(row, 'recurrenceLastYear'),
    locationKeywordsText: readFixedEventEditField(row, 'locationKeywordsText'),
    introEntryName: readFixedEventEditField(row, 'introEntryName'),
    introSummaryText: readFixedEventEditField(row, 'introSummaryText'),
    relatedMaterialIdsText: readFixedEventEditField(row, 'relatedMaterialIdsText'),
    reminderEnabled: readFixedEventEditField(row, 'reminderEnabled'),
    reminderPrepareDays: readFixedEventEditField(row, 'reminderPrepareDays'),
    reminderOutputMode: readFixedEventEditField(row, 'reminderOutputMode'),
    reminderInjectDepth: readFixedEventEditField(row, 'reminderInjectDepth'),
    reminderMacroToken: readFixedEventEditField(row, 'reminderMacroToken'),
    reminderInactiveText: readFixedEventEditField(row, 'reminderInactiveText'),
    reminderActiveText: readFixedEventEditField(row, 'reminderActiveText'),
  }));
  const stages: FixedEventStageStructuredEdit[] = stageRows.map(row => ({
    eventId: String(row.dataset.eventId ?? '').trim(),
    id: String(row.dataset.id ?? '').trim(),
    nextId: readFixedEventEditField(row, 'stageId'),
    name: readRequiredFixedEventEditField(row, 'name'),
    start: readRequiredFixedEventEditField(row, 'start'),
    end: readRequiredFixedEventEditField(row, 'end'),
    reminderEnabled: readFixedEventEditField(row, 'reminderEnabled'),
    reminderPrepareDays: readFixedEventEditField(row, 'reminderPrepareDays'),
    reminderOutputMode: readFixedEventEditField(row, 'reminderOutputMode'),
    reminderInjectDepth: readFixedEventEditField(row, 'reminderInjectDepth'),
    reminderMacroToken: readFixedEventEditField(row, 'reminderMacroToken'),
    reminderInactiveText: readFixedEventEditField(row, 'reminderInactiveText'),
    reminderActiveText: readFixedEventEditField(row, 'reminderActiveText'),
  }));
  const materials: FixedEventMaterialStructuredEdit[] = materialRows.map(row => ({
    id: String(row.dataset.id ?? '').trim(),
    title: readRequiredFixedEventEditField(row, 'title'),
    eventIdsText: readRequiredFixedEventEditField(row, 'eventIdsText'),
    summaryText: readFixedEventEditField(row, 'summaryText'),
    fullTextWorldbookName: readFixedEventEditField(row, 'fullTextWorldbookName'),
    fullTextEntryName: readFixedEventEditField(row, 'fullTextEntryName'),
  }));

  return { profile, defaults, reminderDefaults, bookDefaults, monthAliases, groups, events, stages, materials };
}

export function readFixedEventEditorSelection(element: HTMLElement): FixedEventIndexEditorSelection {
  const section = String(element.dataset.section || 'events') as FixedEventIndexEditorSelection['section'];
  const scope = String(element.dataset.scope || 'overview') as FixedEventIndexEditorSelection['scope'];
  const folder = element.closest<HTMLElement>('[data-role="fixed-event-group-folder"]');
  if (scope === 'group' && folder?.dataset.expanded === 'true') {
    return { section: 'events', scope: 'overview' };
  }
  const id = String(element.dataset.id || '').trim() || undefined;
  const eventId = String(element.dataset.eventId || '').trim() || undefined;
  const detailTab = String(element.dataset.detailTab || '').trim() as FixedEventIndexEditorSelection['detailTab'];
  return { section, scope, id, eventId, detailTab: detailTab || undefined };
}

function syncFixedEventEditorRecurrenceInput(input: HTMLInputElement): void {
  const wrapper = input
    .closest<HTMLElement>('[data-role="fixed-event-core-fields"]')
    ?.querySelector<HTMLElement>('[data-role="fixed-event-recurrence-last-year-field"]');
  const lastYearInput = wrapper?.querySelector<HTMLInputElement>('[data-field="recurrenceLastYear"]');
  const hasPeriod = input.value.trim().length > 0;
  wrapper?.classList.toggle('is-hidden', !hasPeriod);
  if (!hasPeriod && lastYearInput) {
    lastYearInput.value = '';
  }
}

export function syncFixedEventEditorRecurrenceFields(layer: HTMLElement): void {
  layer
    .querySelectorAll<HTMLInputElement>('[data-field="recurrenceIntervalYears"]')
    .forEach(syncFixedEventEditorRecurrenceInput);
}

function readRowIdentity(row?: HTMLElement) {
  return {
    scope: String(row?.dataset.scope ?? ''),
    id: String(row?.dataset.id ?? '').trim(),
    eventId: String(row?.dataset.eventId ?? '').trim(),
  };
}

function emitCommands(
  handlers: FixedEventIndexEditorDialogEventHandlers,
  commands: FixedEventEditorSessionCommand[],
  render: 'none' | 'shell' | 'selection' = 'none',
): void {
  void handlers.onIntent({ type: 'commands', commands, render });
}

function applyStructuredCommand(layer: HTMLElement, showMessage = false): FixedEventEditorSessionCommand {
  return {
    type: 'apply-structured',
    edits: collectFixedEventEditorStructuredEdits(layer),
    showMessage,
  };
}

function bindFixedEventIndexEditorStructuredInputs(
  layer: HTMLElement,
  handlers: FixedEventIndexEditorDialogEventHandlers,
): void {
  const syncInput = (input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
    if (input.dataset.field === 'recurrenceIntervalYears') {
      syncFixedEventEditorRecurrenceInput(input as HTMLInputElement);
    }
    emitCommands(handlers, [applyStructuredCommand(layer)]);
  };
  layer
    .querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(FIXED_EVENT_EDITOR_INPUT_SELECTOR)
    .forEach(input => {
      input.oninput = () => syncInput(input);
      input.onchange = () => syncInput(input);
    });
}

export function bindFixedEventIndexEditorDialogEvents(
  layer: HTMLElement,
  handlers: FixedEventIndexEditorDialogEventHandlers,
): void {
  bindClickAll(layer, '[data-action="close-fixed-event-index-editor"]', () => {
    emitCommands(handlers, [{ type: 'close-request' }]);
  });
  bindClick(layer, '[data-action="reload-fixed-event-index-editor"]', () => {
    emitCommands(handlers, [{ type: 'reload' }]);
  });
  bindClick(layer, '[data-action="save-fixed-event-index-editor"]', () => {
    emitCommands(handlers, [applyStructuredCommand(layer), { type: 'save' }]);
  });
  bindClick(layer, '[data-action="create-empty-fixed-event-index-template"]', () => {
    emitCommands(handlers, [{ type: 'create-template' }]);
  });
  bindClick(layer, '[data-action="apply-fixed-event-index-structured-edit"]', () => {
    emitCommands(handlers, [applyStructuredCommand(layer, true)], 'shell');
  });
  bindClickAll(layer, '[data-action="select-fixed-event-index-pane"]', button => {
    emitCommands(
      handlers,
      [applyStructuredCommand(layer), { type: 'select', selection: readFixedEventEditorSelection(button) }],
      'selection',
    );
  });
  bindFixedEventIndexEditorStructuredInputs(layer, handlers);

  const yamlInput = layer.querySelector<HTMLTextAreaElement>('[data-role="fixed-event-index-yaml"]');
  if (yamlInput) {
    yamlInput.oninput = () => {
      emitCommands(handlers, [{ type: 'replace-yaml', yaml: yamlInput.value }]);
    };
  }

  const bindRowOperation = (
    selector: string,
    operation: Extract<FixedEventEditorSessionCommand, { type: 'row-operation' }>['operation'],
    getRow: (button: HTMLElement) => HTMLElement | undefined,
  ) => {
    bindClickAll(layer, selector, button => {
      emitCommands(
        handlers,
        [applyStructuredCommand(layer), { type: 'row-operation', operation, row: readRowIdentity(getRow(button)) }],
        'shell',
      );
    });
  };

  bindRowOperation('[data-action="add-fixed-event-index-group"]', 'add-group', () => undefined);
  bindRowOperation('[data-action="add-fixed-event-index-event"]', 'add-event', () => undefined);
  bindRowOperation('[data-action="add-fixed-event-index-material"]', 'add-material', () => undefined);
  bindRowOperation(
    '[data-action="remove-fixed-event-index-row"]',
    'remove-row',
    button => button.closest<HTMLElement>('[data-role="fixed-event-edit-row"]') ?? undefined,
  );
  bindRowOperation('[data-action="add-fixed-event-index-stage"]', 'add-stage', button => button);
  bindRowOperation(
    '[data-action="remove-fixed-event-index-stage"]',
    'remove-stage',
    button => button.closest<HTMLElement>(FIXED_EVENT_STAGE_ROW_SELECTOR) ?? undefined,
  );
  bindRowOperation(
    '[data-action="move-fixed-event-index-stage-up"]',
    'move-stage-up',
    button => button.closest<HTMLElement>(FIXED_EVENT_STAGE_ROW_SELECTOR) ?? undefined,
  );
  bindRowOperation(
    '[data-action="move-fixed-event-index-stage-down"]',
    'move-stage-down',
    button => button.closest<HTMLElement>(FIXED_EVENT_STAGE_ROW_SELECTOR) ?? undefined,
  );

  bindClickAll(layer, '[data-action="rename-fixed-event-index-row-id"]', button => {
    const row = button.closest<HTMLElement>('[data-role="fixed-event-edit-row"]') ?? undefined;
    const scope = String(row?.dataset.scope ?? '') as FixedEventEditorRenameScope;
    const oldId = String(row?.dataset.id ?? '').trim();
    if (!oldId || (scope !== 'group' && scope !== 'event' && scope !== 'material')) {
      return;
    }
    void handlers.onIntent({
      type: 'rename-request',
      edits: collectFixedEventEditorStructuredEdits(layer),
      input: { scope, oldId },
    });
  });
}
