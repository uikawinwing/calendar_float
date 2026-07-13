import { klona } from 'klona';

import type {
  CalendarManagedWorldbookDiagnostics,
  CalendarWorldbookMoveCandidate,
  CalendarWorldbookMoveCandidatesResult,
  EnsureCalendarManagedWorldbookEntriesResult,
  InstallCalendarManagedEntriesToExternalWorldbookOptions,
} from '../../worldbook-manager';
import {
  buildExternalMoveFailureNotice,
  buildExternalMoveSuccessNotice,
  buildManagedWorldbookActionErrorNotice,
  buildManagedWorldbookReinstallSuccessNotice,
  buildManagedWorldbookUninstallSuccessNotice,
  validateExternalMoveRequest,
  type WidgetToastNotice,
} from './notices';

export type ManagedWorldbookDialogState =
  | { readonly mode: 'menu' }
  | { readonly mode: 'confirm-uninstall' }
  | { readonly mode: 'confirm-reinstall' }
  | {
      readonly mode: 'export-external';
      readonly moveCandidates: readonly CalendarWorldbookMoveCandidate[];
      readonly moveWarnings: readonly string[];
      readonly availableTargetNames: readonly string[];
    }
  | null;

export interface ManagedWorldbookFlowState {
  readonly busy: boolean;
  readonly diagnostics: Readonly<CalendarManagedWorldbookDiagnostics>;
  readonly dialog: ManagedWorldbookDialogState;
}

export type ManagedWorldbookFlowCommand =
  | { type: 'open' }
  | { type: 'refresh' }
  | { type: 'close' }
  | { type: 'request-uninstall' }
  | { type: 'request-reinstall' }
  | { type: 'request-external-move' }
  | { type: 'confirm-uninstall' }
  | { type: 'confirm-reinstall' }
  | {
      type: 'confirm-external-move';
      targetName: string;
      candidateIds: string[];
      removeFromSource: boolean;
    };

export interface ManagedWorldbookFlowAdapter {
  readDiagnostics(): CalendarManagedWorldbookDiagnostics;
  refreshDiagnostics(): Promise<void>;
  listMoveCandidates(): Promise<CalendarWorldbookMoveCandidatesResult>;
  listAvailableTargetNames(): string[];
  reinstall(): Promise<EnsureCalendarManagedWorldbookEntriesResult>;
  uninstall(): Promise<{ worldbookName: string; removedCount: number }>;
  moveToExternal(
    name: string,
    options: InstallCalendarManagedEntriesToExternalWorldbookOptions,
  ): Promise<EnsureCalendarManagedWorldbookEntriesResult>;
}

export interface ManagedWorldbookFlow {
  getSnapshot(): ManagedWorldbookFlowState;
  dispatch(command: ManagedWorldbookFlowCommand): Promise<WidgetToastNotice | null>;
  subscribe(listener: (snapshot: ManagedWorldbookFlowState) => void): () => void;
}

function cloneDiagnostics(diagnostics: Readonly<CalendarManagedWorldbookDiagnostics>): CalendarManagedWorldbookDiagnostics {
  return {
    ...diagnostics,
    runtimeContentWorldbookNames: [...diagnostics.runtimeContentWorldbookNames],
    sourceItems: diagnostics.sourceItems.map(item => ({ ...item })),
  };
}

function cloneCandidate(candidate: CalendarWorldbookMoveCandidate): CalendarWorldbookMoveCandidate {
  return klona(candidate);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error ?? '未知错误');
}

function cloneDialog(dialog: ManagedWorldbookDialogState): ManagedWorldbookDialogState {
  if (!dialog || dialog.mode !== 'export-external') {
    return dialog ? { ...dialog } : null;
  }
  return {
    mode: dialog.mode,
    moveCandidates: dialog.moveCandidates.map(cloneCandidate),
    moveWarnings: [...dialog.moveWarnings],
    availableTargetNames: [...dialog.availableTargetNames],
  };
}

export function createManagedWorldbookFlow(adapter: ManagedWorldbookFlowAdapter): ManagedWorldbookFlow {
  let state: ManagedWorldbookFlowState = {
    busy: false,
    diagnostics: cloneDiagnostics(adapter.readDiagnostics()),
    dialog: null,
  };
  const listeners = new Set<(snapshot: ManagedWorldbookFlowState) => void>();
  let presentationEpoch = 0;
  let presentationOperationId = 0;
  let activeOperationSequence = 0;
  let activeOperationId: number | null = null;

  const getSnapshot = (): ManagedWorldbookFlowState => ({
    busy: state.busy,
    diagnostics: cloneDiagnostics(state.diagnostics),
    dialog: cloneDialog(state.dialog),
  });

  const publish = (): void => {
    listeners.forEach(listener => listener(getSnapshot()));
  };

  const readLatestDiagnostics = (): CalendarManagedWorldbookDiagnostics => {
    try {
      return cloneDiagnostics(adapter.readDiagnostics());
    } catch {
      return cloneDiagnostics(state.diagnostics);
    }
  };

  const dispatch = async (command: ManagedWorldbookFlowCommand): Promise<WidgetToastNotice | null> => {
    if (command.type === 'close') {
      presentationEpoch += 1;
      presentationOperationId += 1;
      state = { ...state, dialog: null };
      publish();
      return null;
    }

    if (command.type === 'open' || command.type === 'refresh') {
      if (state.busy) {
        return null;
      }
      const opensDialog = command.type === 'open';
      const epoch = opensDialog ? ++presentationEpoch : presentationEpoch;
      const operationId = ++presentationOperationId;
      try {
        await adapter.refreshDiagnostics();
      } catch {
        // Refresh is best effort. The current diagnostics still need to be shown.
      }
      const isCurrentPresentation = epoch === presentationEpoch;
      const ownsDiagnostics = isCurrentPresentation && operationId === presentationOperationId;
      const presentsOpen = opensDialog && isCurrentPresentation;
      if (!ownsDiagnostics && !presentsOpen) {
        return null;
      }
      state = {
        ...state,
        ...(ownsDiagnostics ? { diagnostics: readLatestDiagnostics() } : {}),
        ...(presentsOpen ? { dialog: { mode: 'menu' as const } } : {}),
      };
      publish();
      return null;
    }

    if (command.type === 'request-uninstall' || command.type === 'request-reinstall') {
      if (state.busy || state.dialog?.mode !== 'menu') {
        return null;
      }
      state = {
        ...state,
        dialog: { mode: command.type === 'request-uninstall' ? 'confirm-uninstall' : 'confirm-reinstall' },
      };
      publish();
      return null;
    }

    if (command.type === 'request-external-move') {
      if (state.busy || state.dialog?.mode !== 'menu') {
        return null;
      }
      const epoch = presentationEpoch;
      const operationId = ++activeOperationSequence;
      activeOperationId = operationId;
      state = { ...state, busy: true };
      publish();

      let moveCandidates: CalendarWorldbookMoveCandidate[] = [];
      let moveWarnings: string[] = [];
      let availableTargetNames: string[] = [];
      try {
        const result = await adapter.listMoveCandidates();
        moveCandidates = result.candidates.map(cloneCandidate);
        moveWarnings = [...result.warnings];
      } catch (error) {
        moveWarnings = [errorMessage(error)];
      }
      try {
        availableTargetNames = [...adapter.listAvailableTargetNames()];
      } catch (error) {
        moveWarnings = [...moveWarnings, errorMessage(error)];
      }

      if (activeOperationId === operationId) {
        activeOperationId = null;
        state = {
          ...state,
          busy: false,
          ...(presentationEpoch === epoch
            ? {
                dialog: {
                  mode: 'export-external' as const,
                  moveCandidates,
                  moveWarnings,
                  availableTargetNames,
                },
              }
            : {}),
        };
        publish();
      }
      return null;
    }

    if (command.type === 'confirm-external-move') {
      if (state.busy || state.dialog?.mode !== 'export-external') {
        return null;
      }
      const validation = validateExternalMoveRequest({
        targetName: command.targetName,
        candidateIds: command.candidateIds,
      });
      if (!validation.ok) {
        return validation.notice;
      }
      const candidateIds = 'candidateIds' in validation ? validation.candidateIds : undefined;

      const epoch = ++presentationEpoch;
      presentationOperationId += 1;
      const operationId = ++activeOperationSequence;
      activeOperationId = operationId;
      state = { ...state, busy: true, dialog: null };
      publish();

      let notice: WidgetToastNotice;
      try {
        const result = await adapter.moveToExternal(validation.targetName, {
          ...(candidateIds ? { candidateIds } : {}),
          removeFromSource: command.removeFromSource,
        });
        notice = buildExternalMoveSuccessNotice({
          worldbookName: result.name,
          movedCount: result.movedCount ?? candidateIds?.length ?? 0,
          removedSourceCount: result.removedSourceCount ?? 0,
          removeFromSource: command.removeFromSource,
        });
      } catch (error) {
        notice = buildExternalMoveFailureNotice(error);
      }

      if (activeOperationId !== operationId) {
        return null;
      }
      activeOperationId = null;
      const isCurrentPresentation = presentationEpoch === epoch;
      state = {
        ...state,
        busy: false,
        ...(isCurrentPresentation ? { diagnostics: readLatestDiagnostics() } : {}),
      };
      publish();
      return isCurrentPresentation ? notice : null;
    }

    if (command.type === 'confirm-uninstall' || command.type === 'confirm-reinstall') {
      const expectedMode = command.type === 'confirm-uninstall' ? 'confirm-uninstall' : 'confirm-reinstall';
      if (state.busy || state.dialog?.mode !== expectedMode) {
        return null;
      }

      const epoch = ++presentationEpoch;
      presentationOperationId += 1;
      const operationId = ++activeOperationSequence;
      activeOperationId = operationId;
      state = { ...state, busy: true, dialog: null };
      publish();

      let notice: WidgetToastNotice;
      try {
        if (command.type === 'confirm-uninstall') {
          const result = await adapter.uninstall();
          notice = buildManagedWorldbookUninstallSuccessNotice({
            worldbookName: result.worldbookName,
            removedCount: result.removedCount,
          });
        } else {
          const result = await adapter.reinstall();
          notice = buildManagedWorldbookReinstallSuccessNotice({ worldbookName: result.name });
        }
      } catch (error) {
        notice = buildManagedWorldbookActionErrorNotice(
          command.type === 'confirm-uninstall' ? '卸载基础规则失败' : '重装基础规则失败',
          error,
        );
      }

      if (activeOperationId !== operationId) {
        return null;
      }
      activeOperationId = null;
      const isCurrentPresentation = presentationEpoch === epoch;
      state = {
        ...state,
        busy: false,
        ...(isCurrentPresentation ? { diagnostics: readLatestDiagnostics() } : {}),
      };
      publish();
      return isCurrentPresentation ? notice : null;
    }
    return null;
  };

  return {
    getSnapshot,
    dispatch,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
