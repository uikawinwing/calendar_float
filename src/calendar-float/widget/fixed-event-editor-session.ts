import {
  applyFixedEventIndexRowOperationsToYaml,
  applyFixedEventIndexStructuredEditsToYaml,
  getDefaultFixedEventIndexEditorSelection,
  parseFixedEventIndexDraft,
  renameFixedEventIndexRowIdInYaml,
  validateFixedEventIndexDraft,
  type FixedEventIndexEditorPreviewModel,
  type FixedEventIndexEditorSelection,
  type FixedEventIndexRenameIdInput,
  type FixedEventIndexRowOperationInput,
  type FixedEventIndexSaveResult,
  type FixedEventIndexStructuredEditInput,
  type FixedEventIndexTemplateCreateResult,
  type FixedEventIndexYamlSaveArgs,
} from '../fixed-event-index-editor';
import { klona } from 'klona';
import { createFixedEventIndexEditorLoadingModel } from './fixed-event-editor-host';
import {
  buildFixedEventEditorRowAction,
  type FixedEventEditorRowIdentity,
  type FixedEventEditorRowOperation,
} from './fixed-event-editor-row-actions';

export type FixedEventEditorStructuredEdits = Omit<FixedEventIndexStructuredEditInput, 'sourceYaml' | 'sourceInfo'>;
export type FixedEventEditorRenameInput = Omit<FixedEventIndexRenameIdInput, 'sourceYaml' | 'sourceInfo'>;
export type FixedEventEditorRowOperationInput = Omit<FixedEventIndexRowOperationInput, 'sourceYaml' | 'sourceInfo'>;

export interface FixedEventEditorSessionState {
  readonly open: boolean;
  readonly model: FixedEventIndexEditorPreviewModel | null;
  readonly selection: FixedEventIndexEditorSelection | null;
  readonly dirty: boolean;
}

export type FixedEventEditorSessionCommand =
  | { type: 'open' }
  | { type: 'reload' }
  | { type: 'close-request' }
  | { type: 'create-template' }
  | { type: 'select'; selection: FixedEventIndexEditorSelection }
  | { type: 'replace-yaml'; yaml: string }
  | { type: 'apply-structured'; edits: FixedEventEditorStructuredEdits; showMessage?: boolean }
  | { type: 'row-operation'; operation: FixedEventEditorRowOperation; row: FixedEventEditorRowIdentity }
  | { type: 'rename'; input: FixedEventEditorRenameInput }
  | { type: 'save' };

export interface FixedEventEditorSessionAdapters {
  load(): Promise<FixedEventIndexEditorPreviewModel>;
  save(args: FixedEventIndexYamlSaveArgs): Promise<FixedEventIndexSaveResult>;
  createTemplate(): Promise<FixedEventIndexTemplateCreateResult>;
  confirmDiscard(reason: 'close' | 'reload'): Promise<boolean>;
}

export interface FixedEventEditorSession {
  getSnapshot(): Readonly<FixedEventEditorSessionState>;
  dispatch(command: FixedEventEditorSessionCommand): Promise<Readonly<FixedEventEditorSessionState>>;
  subscribe(listener: (snapshot: Readonly<FixedEventEditorSessionState>) => void): () => void;
}

function cloneSelection(selection: FixedEventIndexEditorSelection | null): FixedEventIndexEditorSelection | null {
  return selection ? { ...selection } : null;
}

function cloneModel(model: FixedEventIndexEditorPreviewModel | null): FixedEventIndexEditorPreviewModel | null {
  return model ? klona(model) : null;
}

function snapshotState(state: FixedEventEditorSessionState): Readonly<FixedEventEditorSessionState> {
  return Object.freeze({
    open: state.open,
    model: cloneModel(state.model),
    selection: cloneSelection(state.selection),
    dirty: state.dirty,
  });
}

function createLoadFailureModel(error: unknown): FixedEventIndexEditorPreviewModel {
  return {
    loading: false,
    source: null,
    draft: null,
    yamlPreview: '',
    validation: null,
    errorMessage: `读取固定事件索引失败：${error instanceof Error ? error.message : String(error)}`,
    saving: false,
  };
}

function getSourceInfo(model: FixedEventIndexEditorPreviewModel) {
  const source = model.source;
  return source
    ? {
        entryName: source.entryName,
        worldbookName: source.worldbookName,
      }
    : null;
}

function getRenameScopeLabel(scope: FixedEventEditorRenameInput['scope']): string {
  if (scope === 'group') {
    return '分组';
  }
  return scope === 'event' ? '固定事件' : '补充资料';
}

export function createFixedEventEditorSession(adapters: FixedEventEditorSessionAdapters): FixedEventEditorSession {
  let state: FixedEventEditorSessionState = {
    open: false,
    model: null,
    selection: null,
    dirty: false,
  };
  let operationEpoch = 0;
  let stateVersion = 0;
  const listeners = new Set<(snapshot: Readonly<FixedEventEditorSessionState>) => void>();

  const getSnapshot = () => snapshotState(state);

  const publish = (nextState: FixedEventEditorSessionState) => {
    state = {
      open: nextState.open,
      model: cloneModel(nextState.model),
      selection: cloneSelection(nextState.selection),
      dirty: nextState.dirty,
    };
    stateVersion += 1;
    const snapshot = getSnapshot();
    listeners.forEach(listener => listener(snapshot));
    return snapshot;
  };

  const isCurrentOperation = (epoch: number) => operationEpoch === epoch && state.open;

  const commitLoadedModel = (
    epoch: number,
    model: FixedEventIndexEditorPreviewModel,
    feedback?: { message: string; state: 'success' | 'danger' },
  ) => {
    if (!isCurrentOperation(epoch)) {
      return getSnapshot();
    }
    const readyModel: FixedEventIndexEditorPreviewModel = {
      ...model,
      loading: false,
      saving: false,
      ...(feedback ? { saveMessage: feedback.message, saveState: feedback.state } : {}),
    };
    return publish({
      open: true,
      model: readyModel,
      selection: getDefaultFixedEventIndexEditorSelection(readyModel.draft),
      dirty: false,
    });
  };

  const load = async (feedback?: { message: string; state: 'success' | 'danger' }) => {
    const epoch = ++operationEpoch;
    publish({
      open: true,
      model: createFixedEventIndexEditorLoadingModel(),
      selection: null,
      dirty: false,
    });
    try {
      const model = await adapters.load();
      return commitLoadedModel(epoch, model, feedback);
    } catch (error) {
      return commitLoadedModel(epoch, createLoadFailureModel(error), feedback);
    }
  };

  const confirmDiscard = async (reason: 'close' | 'reload') => {
    if (!state.dirty) {
      return true;
    }
    const version = stateVersion;
    const confirmed = await adapters.confirmDiscard(reason);
    return stateVersion === version && confirmed;
  };

  const close = () => {
    operationEpoch += 1;
    return publish({ open: false, model: null, selection: null, dirty: false });
  };

  const applyYamlTransform = (
    transform: (args: { sourceYaml: string; sourceInfo: NonNullable<ReturnType<typeof getSourceInfo>> }) => string,
    successMessage: string | undefined,
    failurePrefix: string,
    nextSelection?: FixedEventIndexEditorSelection | null,
  ) => {
    const model = state.model;
    const sourceInfo = model ? getSourceInfo(model) : null;
    if (!state.open || !model || !sourceInfo || model.saving) {
      return getSnapshot();
    }
    try {
      const nextYaml = transform({ sourceYaml: model.yamlPreview, sourceInfo });
      const draft = parseFixedEventIndexDraft(nextYaml, sourceInfo);
      return publish({
        open: true,
        model: {
          ...model,
          draft,
          validation: validateFixedEventIndexDraft(draft),
          yamlPreview: nextYaml,
          ...(successMessage ? { saveMessage: successMessage, saveState: 'warning' as const } : {}),
        },
        selection:
          nextSelection !== undefined
            ? nextSelection
            : (state.selection ?? getDefaultFixedEventIndexEditorSelection(draft)),
        dirty: true,
      });
    } catch (error) {
      return publish({
        ...state,
        model: {
          ...model,
          saveMessage: `${failurePrefix}：${error instanceof Error ? error.message : String(error)}`,
          saveState: 'danger',
        },
      });
    }
  };

  const save = async () => {
    const model = state.model;
    if (!state.open || !model?.source || model.saving) {
      return getSnapshot();
    }
    const epoch = ++operationEpoch;
    const savingModel: FixedEventIndexEditorPreviewModel = {
      ...model,
      saving: true,
      saveMessage: '正在保存固定事件索引…',
      saveState: 'warning',
    };
    publish({ ...state, model: savingModel });
    try {
      const result = await adapters.save({ source: { ...model.source }, yaml: model.yamlPreview });
      if (!isCurrentOperation(epoch) || !state.model?.saving) {
        return getSnapshot();
      }
      const savedYaml = result.ok ? (result.yaml ?? model.yamlPreview) : model.yamlPreview;
      let savedDraft = model.draft;
      let savedValidation = model.validation;
      if (result.ok) {
        savedDraft = parseFixedEventIndexDraft(savedYaml, model.source);
        savedValidation = validateFixedEventIndexDraft(savedDraft);
      }
      return publish({
        ...state,
        model: {
          ...model,
          source: result.ok ? { ...model.source, content: savedYaml } : model.source,
          draft: savedDraft,
          yamlPreview: savedYaml,
          validation: savedValidation,
          saving: false,
          saveMessage: result.message,
          saveState: result.ok ? 'success' : 'danger',
        },
        dirty: result.ok ? false : state.dirty,
      });
    } catch (error) {
      if (!isCurrentOperation(epoch) || !state.model?.saving) {
        return getSnapshot();
      }
      return publish({
        ...state,
        model: {
          ...model,
          saving: false,
          saveMessage: `保存固定事件索引失败：${error instanceof Error ? error.message : String(error)}`,
          saveState: 'danger',
        },
      });
    }
  };

  const createTemplate = async () => {
    const model = state.model;
    if (!state.open || model?.saving) {
      return getSnapshot();
    }
    const epoch = ++operationEpoch;
    const previousState = state;
    publish({
      ...state,
      model: {
        ...(model ?? createFixedEventIndexEditorLoadingModel()),
        loading: false,
        saving: true,
        saveMessage: '正在创建空固定事件索引…',
        saveState: 'warning',
      },
    });
    try {
      const result = await adapters.createTemplate();
      if (!isCurrentOperation(epoch)) {
        return getSnapshot();
      }
      if (!result.ok) {
        return publish({
          ...previousState,
          model: {
            ...(previousState.model ?? createFixedEventIndexEditorLoadingModel()),
            loading: false,
            saving: false,
            saveMessage: result.message,
            saveState: 'danger',
          },
        });
      }
      publish({
        open: true,
        model: createFixedEventIndexEditorLoadingModel(),
        selection: null,
        dirty: false,
      });
      try {
        const loaded = await adapters.load();
        return commitLoadedModel(epoch, loaded, { message: result.message, state: 'success' });
      } catch (error) {
        return commitLoadedModel(epoch, createLoadFailureModel(error), {
          message: `已创建模板，但重新读取失败：${error instanceof Error ? error.message : String(error)}`,
          state: 'danger',
        });
      }
    } catch (error) {
      if (!isCurrentOperation(epoch)) {
        return getSnapshot();
      }
      return publish({
        ...previousState,
        model: {
          ...(previousState.model ?? createFixedEventIndexEditorLoadingModel()),
          loading: false,
          saving: false,
          saveMessage: `创建固定事件索引失败：${error instanceof Error ? error.message : String(error)}`,
          saveState: 'danger',
        },
      });
    }
  };

  const dispatch = async (command: FixedEventEditorSessionCommand) => {
    switch (command.type) {
      case 'open':
        if (state.open && state.dirty && !(await confirmDiscard('reload'))) {
          return getSnapshot();
        }
        return load();
      case 'reload':
        if (!state.open || (state.dirty && !(await confirmDiscard('reload')))) {
          return getSnapshot();
        }
        return load();
      case 'close-request':
        if (!state.open || (state.dirty && !(await confirmDiscard('close')))) {
          return getSnapshot();
        }
        return close();
      case 'select':
        if (!state.open || state.model?.loading) {
          return getSnapshot();
        }
        return publish({ ...state, selection: command.selection });
      case 'replace-yaml':
        if (!state.open || !state.model || state.model.loading || state.model.saving) {
          return getSnapshot();
        }
        return publish({
          ...state,
          model: {
            ...state.model,
            yamlPreview: command.yaml,
            saveMessage: 'YAML 已修改，尚未保存到世界书',
            saveState: 'warning',
          },
          dirty: true,
        });
      case 'apply-structured':
        return applyYamlTransform(
          args => applyFixedEventIndexStructuredEditsToYaml({ ...args, ...command.edits }),
          command.showMessage ? '已同步到 YAML，尚未保存到世界书' : undefined,
          '同步到 YAML 失败',
        );
      case 'row-operation': {
        const draft = state.model?.draft;
        if (!draft) {
          return getSnapshot();
        }
        const action = buildFixedEventEditorRowAction({ draft, operation: command.operation, row: command.row });
        return applyYamlTransform(
          args => applyFixedEventIndexRowOperationsToYaml({ ...args, ...action.operationInput }),
          action.message,
          '更新结构化行失败',
          action.nextSelection ?? undefined,
        );
      }
      case 'rename': {
        const currentSelection = state.selection;
        const normalizedNextId = command.input.newId.trim();
        const nextSelection =
          currentSelection?.scope === command.input.scope && currentSelection.id === command.input.oldId
            ? { ...currentSelection, id: normalizedNextId }
            : currentSelection;
        return applyYamlTransform(
          args => renameFixedEventIndexRowIdInYaml({ ...args, ...command.input }),
          `已重命名 ${getRenameScopeLabel(command.input.scope)} id，相关引用已同步，尚未保存到世界书`,
          '重命名 id 失败',
          nextSelection,
        );
      }
      case 'save':
        return save();
      case 'create-template':
        return createTemplate();
      default: {
        const exhaustiveCheck: never = command;
        throw new Error(`Unhandled fixed-event editor command: ${JSON.stringify(exhaustiveCheck)}`);
      }
    }
  };

  return {
    getSnapshot,
    dispatch,
    subscribe(listener) {
      listeners.add(listener);
      listener(getSnapshot());
      return () => listeners.delete(listener);
    },
  };
}
