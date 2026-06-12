import { SCRIPT_NAME } from './constants';
import { bootstrapCalendarFloatHostAdapter, teardownCalendarFloatHostAdapter } from './host-adapter';
import { bootstrapCalendarMvuRemovalArchive, teardownCalendarMvuRemovalArchive } from './mvu-removal-archive';
import { initializeCalendarProfile } from './profile';
import {
  bootstrapCalendarRuntimeWorldbookScanner,
  teardownCalendarRuntimeWorldbookScanner,
} from './runtime-worldbook/scanner';
import {
  ensureCalendarLatestMessageVariableStore,
  migrateCalendarChatVariableStore,
  migrateCalendarLatestMessageVariableStore,
} from './storage';
import { bootstrapCalendarWidget } from './widget';
import {
  ensureCalendarManagedWorldbookEntries,
  getCalendarManagedWorldbookTargetName,
  installCalendarManagedEntriesToExternalWorldbook,
  installCalendarManagedWorldbookEntries,
  uninstallCalendarManagedWorldbookEntries,
} from './worldbook-manager';

function notifyManagedWorldbookEnsure(result: Awaited<ReturnType<typeof ensureCalendarManagedWorldbookEntries>>): void {
  if (!result.created && !result.updated) {
    return;
  }
  const target = getCalendarManagedWorldbookTargetName() || result.name;
  const targetModeText =
    result.targetMode === 'stored_external' ? '已使用你上次选择的外部世界书' : '首次自动写入当前角色主世界书';
  toastr.info(`月历球已写入后端基础条目：${target}\n${targetModeText}\n可在后端面板查看/搬运来源。`);
}

async function init(): Promise<void> {
  console.info(`[${SCRIPT_NAME}] 开始初始化`);
  await initializeCalendarProfile();
  migrateCalendarChatVariableStore();
  migrateCalendarLatestMessageVariableStore();
  void ensureCalendarLatestMessageVariableStore().catch(error => {
    console.warn(`[${SCRIPT_NAME}] 初始化最新消息变量失败`, error);
  });
  void ensureCalendarManagedWorldbookEntries()
    .then(notifyManagedWorldbookEnsure)
    .catch(error => {
      console.warn(`[${SCRIPT_NAME}] 初始化托管世界书条目失败`, error);
    });
  bootstrapCalendarMvuRemovalArchive();
  bootstrapCalendarRuntimeWorldbookScanner();
  void bootstrapCalendarWidget().catch(error => {
    console.warn(`[${SCRIPT_NAME}] 初始化月历 widget 失败`, error);
  });
  void bootstrapCalendarFloatHostAdapter();

  Object.assign(globalThis, {
    CalendarFloatInstallManagedWorldbookEntries: async () => installCalendarManagedWorldbookEntries(),
    CalendarFloatInstallManagedEntriesToWorldbook: async (name: string) =>
      installCalendarManagedEntriesToExternalWorldbook(name),
    CalendarFloatUninstallManagedWorldbookEntries: async () => uninstallCalendarManagedWorldbookEntries(),
  });
}

function cleanup(): void {
  console.info(`[${SCRIPT_NAME}] 开始卸载`);
  teardownCalendarMvuRemovalArchive();
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
      close: () => void;
      reload: () => Promise<void> | void;
      setExternalHostMode?: (enabled: boolean) => void;
    };
  }
}
