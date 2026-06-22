import type { FixedEventEditorRowOperation } from './fixed-event-editor-row-actions';

const FIXED_EVENT_EDITOR_INPUT_SELECTOR =
  '[data-role="fixed-event-edit-row"] input, [data-role="fixed-event-edit-row"] textarea, [data-role="fixed-event-edit-row"] select, [data-role="fixed-event-stage-row"] input, [data-role="fixed-event-stage-row"] textarea, [data-role="fixed-event-stage-row"] select, [data-role="fixed-event-profile-row"] input, [data-role="fixed-event-profile-row"] textarea, [data-role="fixed-event-profile-row"] select, [data-role="fixed-event-defaults-row"] input, [data-role="fixed-event-defaults-row"] textarea, [data-role="fixed-event-defaults-row"] select, [data-role="fixed-event-reminder-defaults-row"] input, [data-role="fixed-event-reminder-defaults-row"] textarea, [data-role="fixed-event-reminder-defaults-row"] select, [data-role="fixed-event-book-defaults-row"] input, [data-role="fixed-event-book-defaults-row"] textarea, [data-role="fixed-event-book-defaults-row"] select, [data-role="fixed-event-month-alias-row"] input, [data-role="fixed-event-month-alias-row"] textarea, [data-role="fixed-event-month-alias-row"] select';

const FIXED_EVENT_STAGE_ROW_SELECTOR = '[data-role="fixed-event-stage-row"], [data-role="fixed-event-stage-list-row"]';

export interface FixedEventIndexEditorDialogEventHandlers {
  close: () => void;
  reload: () => void | Promise<void>;
  save: () => void | Promise<void>;
  createTemplate: () => void | Promise<void>;
  applyStructuredEdit: () => void;
  selectPane: (button: HTMLElement) => void;
  syncStructuredEditor: (markDirty: boolean) => void;
  syncRecurrenceFields: (layer: HTMLElement) => void;
  updateYamlPreview: (value: string) => void;
  applyRowOperation: (operation: FixedEventEditorRowOperation, row?: HTMLElement) => void;
  renameRowId: (row?: HTMLElement) => void;
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

function bindFixedEventIndexEditorStructuredInputs(
  layer: HTMLElement,
  handlers: FixedEventIndexEditorDialogEventHandlers,
): void {
  const syncInput = (input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
    if (input.dataset.field === 'recurrenceIntervalYears') {
      handlers.syncRecurrenceFields(layer);
    }
    handlers.syncStructuredEditor(false);
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
  bindClickAll(layer, '[data-action="close-fixed-event-index-editor"]', handlers.close);
  bindClick(layer, '[data-action="reload-fixed-event-index-editor"]', handlers.reload);
  bindClick(layer, '[data-action="save-fixed-event-index-editor"]', handlers.save);
  bindClick(layer, '[data-action="create-empty-fixed-event-index-template"]', handlers.createTemplate);
  bindClick(layer, '[data-action="apply-fixed-event-index-structured-edit"]', handlers.applyStructuredEdit);
  bindClickAll(layer, '[data-action="select-fixed-event-index-pane"]', handlers.selectPane);
  bindFixedEventIndexEditorStructuredInputs(layer, handlers);

  const yamlInput = layer.querySelector<HTMLTextAreaElement>('[data-role="fixed-event-index-yaml"]');
  if (yamlInput) {
    yamlInput.oninput = () => {
      handlers.updateYamlPreview(yamlInput.value);
    };
  }

  bindClick(layer, '[data-action="add-fixed-event-index-group"]', () => handlers.applyRowOperation('add-group'));
  bindClick(layer, '[data-action="add-fixed-event-index-event"]', () => handlers.applyRowOperation('add-event'));
  bindClick(layer, '[data-action="add-fixed-event-index-material"]', () => handlers.applyRowOperation('add-material'));
  bindClickAll(layer, '[data-action="remove-fixed-event-index-row"]', button => {
    handlers.applyRowOperation('remove-row', button.closest<HTMLElement>('[data-role="fixed-event-edit-row"]') ?? undefined);
  });
  bindClickAll(layer, '[data-action="add-fixed-event-index-stage"]', button => {
    handlers.applyRowOperation('add-stage', button);
  });
  bindClickAll(layer, '[data-action="remove-fixed-event-index-stage"]', button => {
    handlers.applyRowOperation('remove-stage', button.closest<HTMLElement>(FIXED_EVENT_STAGE_ROW_SELECTOR) ?? undefined);
  });
  bindClickAll(layer, '[data-action="move-fixed-event-index-stage-up"]', button => {
    handlers.applyRowOperation('move-stage-up', button.closest<HTMLElement>(FIXED_EVENT_STAGE_ROW_SELECTOR) ?? undefined);
  });
  bindClickAll(layer, '[data-action="move-fixed-event-index-stage-down"]', button => {
    handlers.applyRowOperation('move-stage-down', button.closest<HTMLElement>(FIXED_EVENT_STAGE_ROW_SELECTOR) ?? undefined);
  });
  bindClickAll(layer, '[data-action="rename-fixed-event-index-row-id"]', button => {
    handlers.renameRowId(button.closest<HTMLElement>('[data-role="fixed-event-edit-row"]') ?? undefined);
  });
}
