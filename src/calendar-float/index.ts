import { SCRIPT_NAME } from './constants';
import { bootstrapCalendarFloatHostAdapter, teardownCalendarFloatHostAdapter } from './host-adapter';
import {
  beginCalendarFloatLifecycle,
  completeCalendarFloatLifecycleInitialization,
  invalidateCalendarFloatLifecycle,
  isCalendarFloatLifecycleCancelledError,
} from './lifecycle';
import { initializeCalendarProfile } from './profile';
import {
  type CalendarRuntimeContextChange,
  type CalendarRuntimeContextIdentity,
  type CalendarRuntimeContextWatcher,
  watchCalendarRuntimeContext,
} from './runtime-context';
import {
  bootstrapCalendarRuntimeWorldbookScanner,
  teardownCalendarRuntimeWorldbookScanner,
} from './runtime-worldbook/scanner';
import { ensureCalendarLatestMessageVariableStore } from './storage';
import { bootstrapCalendarWidget } from './widget';
import {
  buildMissingManagedWorldbookRulesDiagnostic,
  createManagedWorldbookDiagnosticsState,
  shouldNotifyMissingRulesOnce,
} from './worldbook-manager/diagnostics';
import {
  CALENDAR_UPDATE_RULES_ENTRY_NAME,
  CALENDAR_VARIABLE_LIST_ENTRY_DISPLAY_NAME,
  getCalendarManagedWorldbookDiagnostics,
  getCalendarManagedWorldbookTargetName,
  installCalendarManagedEntriesToExternalWorldbook,
  installCalendarManagedWorldbookEntries,
  refreshCalendarManagedWorldbookDiagnostics,
  uninstallCalendarManagedWorldbookEntries,
} from './worldbook-manager';

let contextWatcher: CalendarRuntimeContextWatcher | null = null;
let managedWorldbookDiagnosticsState = createManagedWorldbookDiagnosticsState();
let managedWorldbookDiagnosticsRefreshQueue: Promise<void> = Promise.resolve();

async function refreshManagedWorldbookDiagnosticsAndNotifyMissingRules(
  isCurrent: () => boolean = () => true,
): Promise<void> {
  await refreshCalendarManagedWorldbookDiagnostics();
  if (!isCurrent()) {
    return;
  }

  const diagnostics = getCalendarManagedWorldbookDiagnostics();
  if (diagnostics.allManagedEntriesPresent) {
    return;
  }

  const missingRules = [
    diagnostics.hasUpdateRulesEntry ? '' : CALENDAR_UPDATE_RULES_ENTRY_NAME,
    diagnostics.hasVariableListEntry ? '' : CALENDAR_VARIABLE_LIST_ENTRY_DISPLAY_NAME,
  ].filter(Boolean);
  const diagnostic = buildMissingManagedWorldbookRulesDiagnostic({
    worldbookName: diagnostics.worldbookName || getCalendarManagedWorldbookTargetName(),
    missingRules,
  });
  if (!isCurrent()) {
    return;
  }
  if (!shouldNotifyMissingRulesOnce(managedWorldbookDiagnosticsState, diagnostic.key || diagnostic.message)) {
    return;
  }
  toastr.error(diagnostic.message, diagnostic.title);
}

function queueManagedWorldbookDiagnosticsRefresh(isCurrent: () => boolean): void {
  managedWorldbookDiagnosticsRefreshQueue = managedWorldbookDiagnosticsRefreshQueue
    .catch(() => undefined)
    .then(async () => {
      if (!isCurrent()) {
        return;
      }
      try {
        await refreshManagedWorldbookDiagnosticsAndNotifyMissingRules(isCurrent);
      } catch (error) {
        if (!isCurrent()) {
          return;
        }
        console.warn(`[${SCRIPT_NAME}] 初始化托管世界书诊断失败`, error);
      }
    });
}

function teardownCalendarRuntime(reason: string): void {
  invalidateCalendarFloatLifecycle();
  teardownCalendarFloatHostAdapter({ unregister: true, silent: true });
  teardownCalendarRuntimeWorldbookScanner();
  window.CalendarFloatWidget?.destroy(reason);
}

async function bootstrapCalendarRuntime(
  context: CalendarRuntimeContextIdentity,
  reason: 'initial' | CalendarRuntimeContextChange['reason'],
): Promise<void> {
  const lifecycle = beginCalendarFloatLifecycle();
  managedWorldbookDiagnosticsState = createManagedWorldbookDiagnosticsState();
  console.info(`[${SCRIPT_NAME}] 开始初始化 runtime`, {
    reason,
    generation: lifecycle.generation,
    characterName: context.characterName,
    chatId: context.chatId,
  });

  if (!(await completeCalendarFloatLifecycleInitialization(lifecycle, initializeCalendarProfile))) {
    return;
  }

  void ensureCalendarLatestMessageVariableStore(lifecycle.isCurrent).catch(error => {
    if (!lifecycle.isCurrent()) {
      return;
    }
    console.warn(`[${SCRIPT_NAME}] 初始化最新消息变量失败`, error);
  });
  queueManagedWorldbookDiagnosticsRefresh(lifecycle.isCurrent);

  bootstrapCalendarRuntimeWorldbookScanner();
  void bootstrapCalendarWidget(lifecycle).catch(error => {
    if (isCalendarFloatLifecycleCancelledError(error) || !lifecycle.isCurrent()) {
      return;
    }
    console.warn(`[${SCRIPT_NAME}] 初始化月历 widget 失败`, error);
  });
  void bootstrapCalendarFloatHostAdapter(lifecycle).catch(error => {
    if (isCalendarFloatLifecycleCancelledError(error) || !lifecycle.isCurrent()) {
      return;
    }
    console.warn(`[${SCRIPT_NAME}] 初始化月历 host adapter 失败`, error);
  });
}

async function switchCalendarRuntimeContext(change: CalendarRuntimeContextChange): Promise<void> {
  console.info(`[${SCRIPT_NAME}] 运行上下文已切换，软重启 runtime`, {
    reason: change.reason,
    from: change.previous.key,
    to: change.next.key,
  });
  teardownCalendarRuntime(`context:${change.reason}`);
  await bootstrapCalendarRuntime(change.next, change.reason);
}

function installCalendarGlobalApi(): void {
  Object.assign(globalThis, {
    CalendarFloatInstallManagedWorldbookEntries: async () => installCalendarManagedWorldbookEntries(),
    CalendarFloatInstallManagedEntriesToWorldbook: async (name: string) =>
      installCalendarManagedEntriesToExternalWorldbook(name),
    CalendarFloatUninstallManagedWorldbookEntries: async () => uninstallCalendarManagedWorldbookEntries(),
  });
}

async function init(): Promise<void> {
  console.info(`[${SCRIPT_NAME}] 开始初始化`);
  installCalendarGlobalApi();
  contextWatcher?.stop();
  contextWatcher = watchCalendarRuntimeContext(switchCalendarRuntimeContext);
  await bootstrapCalendarRuntime(contextWatcher.initial, 'initial');
}

function cleanup(): void {
  console.info(`[${SCRIPT_NAME}] 开始卸载`);
  contextWatcher?.stop();
  contextWatcher = null;
  invalidateCalendarFloatLifecycle();
  teardownCalendarFloatHostAdapter({ unregister: true, silent: true });
  teardownCalendarRuntimeWorldbookScanner();
  window.CalendarFloatWidget?.destroy('pagehide');
}

$(() => {
  errorCatched(init)();
});

$(window).on('pagehide', () => {
  cleanup();
});

declare global {
  var CalendarFloatInstallManagedWorldbookEntries:
    | (() => Promise<import('./worldbook-manager').EnsureCalendarManagedWorldbookEntriesResult>)
    | undefined;
  var CalendarFloatInstallManagedEntriesToWorldbook:
    | ((name: string) => Promise<import('./worldbook-manager').EnsureCalendarManagedWorldbookEntriesResult>)
    | undefined;
  var CalendarFloatUninstallManagedWorldbookEntries:
    | (() => Promise<{
        worldbookName: string;
        removedCount: number;
      }>)
    | undefined;

  interface Window {
    CalendarFloatWidget?: {
      destroy: (reason?: string) => void;
      open: () => void;
      openBook?: (bookId: string) => boolean;
      close: () => void;
      reload: () => Promise<void> | void;
      setExternalHostMode?: (enabled: boolean) => void;
    };
  }
}
