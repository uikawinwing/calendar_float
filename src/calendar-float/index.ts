import { SCRIPT_NAME } from './constants';
import { bootstrapCalendarFloatHostAdapter, teardownCalendarFloatHostAdapter } from './host-adapter';
import {
  beginCalendarFloatLifecycle,
  completeCalendarFloatLifecycleInitialization,
  invalidateCalendarFloatLifecycle,
  isCalendarFloatLifecycleCancelledError,
} from './lifecycle';
import { bootstrapCalendarMvuRemovalArchive, teardownCalendarMvuRemovalArchive } from './mvu-removal-archive';
import { initializeCalendarProfile } from './profile';
import {
  bootstrapCalendarRuntimeWorldbookScanner,
  teardownCalendarRuntimeWorldbookScanner,
} from './runtime-worldbook/scanner';
import {
  ensureCalendarLatestMessageVariableStore,
} from './storage';
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

let contextWatcherStop: (() => void) | null = null;
const managedWorldbookDiagnosticsState = createManagedWorldbookDiagnosticsState();

function readCalendarRuntimeContextKey(): string {
  let characterName = '';
  let chatId = '';
  try {
    characterName = String(getCurrentCharacterName?.() || '').trim();
  } catch (error) {
    console.warn(`[${SCRIPT_NAME}] 读取当前角色名失败，跳过运行上下文比对`, error);
  }
  try {
    chatId = String(SillyTavern?.getCurrentChatId?.() || '').trim();
  } catch (error) {
    console.warn(`[${SCRIPT_NAME}] 读取当前聊天 ID 失败，跳过运行上下文比对`, error);
  }
  return `${characterName}\n${chatId}`;
}

function bootstrapCalendarRuntimeContextWatcher(): void {
  let currentContextKey = readCalendarRuntimeContextKey();
  const stops = [
    eventOn(tavern_events.CHAT_CHANGED, () => {
      const nextContextKey = readCalendarRuntimeContextKey();
      if (nextContextKey && nextContextKey !== currentContextKey) {
        currentContextKey = nextContextKey;
        window.location.reload();
      }
    }).stop,
    eventOn(tavern_events.CHARACTER_PAGE_LOADED, () => {
      const nextContextKey = readCalendarRuntimeContextKey();
      if (nextContextKey && nextContextKey !== currentContextKey) {
        currentContextKey = nextContextKey;
        window.location.reload();
      }
    }).stop,
  ];
  contextWatcherStop = () => {
    stops.forEach(stop => stop());
    contextWatcherStop = null;
  };
}

async function refreshManagedWorldbookDiagnosticsAndNotifyMissingRules(): Promise<void> {
  await refreshCalendarManagedWorldbookDiagnostics();
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
  if (!shouldNotifyMissingRulesOnce(managedWorldbookDiagnosticsState, diagnostic.key || diagnostic.message)) {
    return;
  }
  toastr.error(diagnostic.message, diagnostic.title);
}

async function init(): Promise<void> {
  const lifecycle = beginCalendarFloatLifecycle();
  console.info(`[${SCRIPT_NAME}] 开始初始化`);
  if (!(await completeCalendarFloatLifecycleInitialization(lifecycle, initializeCalendarProfile))) {
    return;
  }
  void ensureCalendarLatestMessageVariableStore().catch(error => {
    console.warn(`[${SCRIPT_NAME}] 初始化最新消息变量失败`, error);
  });
  void refreshManagedWorldbookDiagnosticsAndNotifyMissingRules()
    .catch(error => {
      console.warn(`[${SCRIPT_NAME}] 初始化托管世界书诊断失败`, error);
    });
  bootstrapCalendarMvuRemovalArchive();
  bootstrapCalendarRuntimeWorldbookScanner();
  void bootstrapCalendarWidget(lifecycle).catch(error => {
    if (isCalendarFloatLifecycleCancelledError(error)) {
      return;
    }
    console.warn(`[${SCRIPT_NAME}] 初始化月历 widget 失败`, error);
  });
  void bootstrapCalendarFloatHostAdapter(lifecycle).catch(error => {
    if (isCalendarFloatLifecycleCancelledError(error)) {
      return;
    }
    console.warn(`[${SCRIPT_NAME}] 初始化月历 host adapter 失败`, error);
  });
  bootstrapCalendarRuntimeContextWatcher();

  Object.assign(globalThis, {
    CalendarFloatInstallManagedWorldbookEntries: async () => installCalendarManagedWorldbookEntries(),
    CalendarFloatInstallManagedEntriesToWorldbook: async (name: string) =>
      installCalendarManagedEntriesToExternalWorldbook(name),
    CalendarFloatUninstallManagedWorldbookEntries: async () => uninstallCalendarManagedWorldbookEntries(),
  });
}

function cleanup(): void {
  invalidateCalendarFloatLifecycle();
  console.info(`[${SCRIPT_NAME}] 开始卸载`);
  teardownCalendarMvuRemovalArchive();
  teardownCalendarFloatHostAdapter({ unregister: true, silent: true });
  teardownCalendarRuntimeWorldbookScanner();
  contextWatcherStop?.();
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
      close: () => void;
      reload: () => Promise<void> | void;
      setExternalHostMode?: (enabled: boolean) => void;
    };
  }
}
