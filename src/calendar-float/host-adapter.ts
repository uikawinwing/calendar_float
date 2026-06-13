import { INSTANCE_KEY, SCRIPT_NAME } from './constants';

const HOST_GLOBAL_KEY = '__mdpoemFloatingHost__';
const ADAPTER_INSTANCE_KEY = '__CalendarFloatHostAdapter__';
const MODULE_KEY = 'calendar-float';
const MODULE_NAME = '月历';

interface FloatingHostModule {
  key: string;
  name: string;
  onClick: () => void | Promise<void>;
}

interface FloatingHostRegisterResult {
  ok?: boolean;
  reason?: string;
}

interface FloatingHostApi {
  registerModule?: (module: FloatingHostModule) => FloatingHostRegisterResult;
  unregisterModule?: (key: string) => FloatingHostRegisterResult;
}

interface CalendarFloatWidgetApi {
  open: () => void;
  close: () => void;
  reload: () => Promise<void> | void;
  destroy: (reason?: string) => void;
  setExternalHostMode?: (enabled: boolean) => void;
}

interface CalendarFloatHostAdapterInstance {
  destroy: (options?: { unregister?: boolean; silent?: boolean }) => void;
}

type HostWindow = Window &
  typeof globalThis & {
    [HOST_GLOBAL_KEY]?: FloatingHostApi;
    [ADAPTER_INSTANCE_KEY]?: CalendarFloatHostAdapterInstance;
    [INSTANCE_KEY]?: CalendarFloatWidgetApi;
  };

function getHostWindow(): HostWindow {
  try {
    return window.parent && window.parent !== window && window.parent.document
      ? (window.parent as HostWindow)
      : (window as HostWindow);
  } catch (_) {
    return window as HostWindow;
  }
}

function showAdapterLog(level: 'info' | 'warn', message: string, error?: unknown): void {
  const logger = level === 'warn' ? console.warn : console.info;
  if (error) {
    logger(`[${SCRIPT_NAME}] ${message}`, error);
    return;
  }
  logger(`[${SCRIPT_NAME}] ${message}`);
}

async function waitForHost(hostWindow: HostWindow, retries = 12, interval = 80): Promise<FloatingHostApi | null> {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    const host = hostWindow[HOST_GLOBAL_KEY];
    if (host && typeof host.registerModule === 'function') {
      return host;
    }
    await new Promise(resolve => hostWindow.setTimeout(resolve, interval));
  }
  const host = hostWindow[HOST_GLOBAL_KEY];
  return host && typeof host.registerModule === 'function' ? host : null;
}

async function waitForWidgetApi(hostWindow: HostWindow, retries = 25, interval = 80): Promise<CalendarFloatWidgetApi | null> {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    const widget = hostWindow[INSTANCE_KEY];
    if (widget && typeof widget.setExternalHostMode === 'function') {
      return widget;
    }
    await new Promise(resolve => hostWindow.setTimeout(resolve, interval));
  }
  const widget = hostWindow[INSTANCE_KEY];
  return widget && typeof widget.setExternalHostMode === 'function' ? widget : null;
}

export async function bootstrapCalendarFloatHostAdapter(): Promise<void> {
  const hostWindow = getHostWindow();
  hostWindow[ADAPTER_INSTANCE_KEY]?.destroy({ unregister: true, silent: true });

  const host = await waitForHost(hostWindow);
  if (!host || typeof host.registerModule !== 'function') {
    return;
  }

  let destroyed = false;
  let registeredToHost = false;

  const setExternalHostMode = (enabled: boolean): void => {
    try {
      hostWindow[INSTANCE_KEY]?.setExternalHostMode?.(enabled);
    } catch (error) {
      showAdapterLog('warn', '切换 host 模块模式失败', error);
    }
  };

  const destroy = (options: { unregister?: boolean; silent?: boolean } = {}): void => {
    if (destroyed) {
      return;
    }
    destroyed = true;

    setExternalHostMode(false);

    if (options.unregister && registeredToHost && typeof host.unregisterModule === 'function') {
      try {
        host.unregisterModule(MODULE_KEY);
      } catch (error) {
        if (!options.silent) {
          showAdapterLog('warn', '从悬浮球 host 注销月历模块失败', error);
        }
      }
    }

    if (hostWindow[ADAPTER_INSTANCE_KEY]?.destroy === destroy) {
      delete hostWindow[ADAPTER_INSTANCE_KEY];
    }
  };

  const result = host.registerModule({
    key: MODULE_KEY,
    name: MODULE_NAME,
    onClick: () => {
      hostWindow[INSTANCE_KEY]?.open();
    },
  });

  if (!result?.ok) {
    showAdapterLog('warn', `注册到悬浮球 host 失败：${result?.reason || '未知原因'}`);
    return;
  }

  registeredToHost = true;
  hostWindow[ADAPTER_INSTANCE_KEY] = { destroy };
  await waitForWidgetApi(hostWindow);
  if (destroyed) {
    return;
  }
  setExternalHostMode(true);
  showAdapterLog('info', '已注册到悬浮球 host，原生月历按钮进入隐藏备用模式');
}

export function teardownCalendarFloatHostAdapter(options: { unregister?: boolean; silent?: boolean } = {}): void {
  const hostWindow = getHostWindow();
  hostWindow[ADAPTER_INSTANCE_KEY]?.destroy({ unregister: true, silent: true, ...options });
}
