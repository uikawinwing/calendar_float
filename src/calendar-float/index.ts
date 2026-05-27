import { SCRIPT_NAME } from './constants';
import { bootstrapCalendarFloatHostAdapter, teardownCalendarFloatHostAdapter } from './host-adapter';
import { bootstrapCalendarMvuRemovalArchive, teardownCalendarMvuRemovalArchive } from './mvu-removal-archive';
import {
  bootstrapCalendarRuntimeWorldbookScanner,
  teardownCalendarRuntimeWorldbookScanner,
} from './runtime-worldbook-scanner';
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
} from './worldbook-backend-manager';

function notifyManagedWorldbookEnsure(result: Awaited<ReturnType<typeof ensureCalendarManagedWorldbookEntries>>): void {
  if (!result.created && !result.updated) {
    return;
  }
  const target = getCalendarManagedWorldbookTargetName() || result.name;
  const targetModeText =
    result.targetMode === 'stored_external' ? '已使用你上次选择的外部世界书' : '首次自动写入当前角色主世界书';
  toastr.info(`月历球已写入后端基础条目：${target}\n${targetModeText}\n可在后端面板查看/搬运来源。`);
}

function init(): void {
  console.info(`[${SCRIPT_NAME}] 开始初始化`);
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
  bootstrapCalendarWidget();
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
    | (() => Promise<import('./worldbook-backend-manager').EnsureCalendarManagedWorldbookEntriesResult>)
    | undefined;
  var CalendarFloatInstallManagedEntriesToWorldbook:
    | ((name: string) => Promise<import('./worldbook-backend-manager').EnsureCalendarManagedWorldbookEntriesResult>)
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
