// eslint-disable-next-line import-x/no-nodejs-modules -- check inspects lifecycle ordering without executing the script entrypoint.
import { readFileSync } from 'node:fs';
// eslint-disable-next-line import-x/no-nodejs-modules -- check resolves the entrypoint relative to this file.
import { resolve } from 'node:path';

import {
  CalendarFloatLifecycleCancelledError,
  beginCalendarFloatLifecycle,
  invalidateCalendarFloatLifecycle,
  isCalendarFloatLifecycleCancelledError,
} from '../../src/calendar-float/lifecycle';

declare const require: NodeRequire;

// eslint-disable-next-line import-x/no-nodejs-modules -- check stubs webpack raw SVG imports under ts-node.
const Module = require('module') as {
  _load: (request: string, parent: NodeJS.Module | null, isMain: boolean) => unknown;
};
const originalLoad = Module._load;
Module._load = (request: string, parent: NodeJS.Module | null, isMain: boolean): unknown => {
  if (request.endsWith('.svg?raw')) {
    return '<svg></svg>';
  }
  return originalLoad(request, parent, isMain);
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
} {
  let resolvePromise!: (value: T) => void;
  const promise = new Promise<T>(resolve => {
    resolvePromise = resolve;
  });
  return { promise, resolve: resolvePromise };
}

async function assertCancelled(promise: Promise<void>, message: string): Promise<void> {
  try {
    await promise;
  } catch (error) {
    assert(error instanceof CalendarFloatLifecycleCancelledError, message);
    assert(isCalendarFloatLifecycleCancelledError(error), '命名 cancellation helper 应识别 lifecycle 取消');
    return;
  }
  throw new Error(`${message}：promise 不应成功完成`);
}

function installFakeWindow(): {
  fakeWindow: Record<string, unknown>;
  getCreateCount: () => number;
  getTimerCount: () => number;
} {
  let createCount = 0;
  let timerCount = 0;
  const fakeDocument = {
    getElementById() {
      return null;
    },
    createElement() {
      createCount += 1;
      throw new Error('stale widget 不得创建 DOM');
    },
  };
  const fakeWindow = {
    document: fakeDocument,
    parent: null as unknown,
    setTimeout() {
      timerCount += 1;
      throw new Error('stale widget 不得创建 timer');
    },
    clearTimeout() {},
  } as Record<string, unknown>;
  fakeWindow.parent = fakeWindow;
  (globalThis as Record<string, unknown>).window = fakeWindow;
  (globalThis as Record<string, unknown>).document = fakeDocument;
  return {
    fakeWindow,
    getCreateCount: () => createCount,
    getTimerCount: () => timerCount,
  };
}

function testGenerationTokenSemantics(): void {
  const first = beginCalendarFloatLifecycle();
  assert(first.isCurrent(), 'begin 后 token 应为 current');

  const second = beginCalendarFloatLifecycle();
  assert(!first.isCurrent(), '新 begin 应使旧 token stale');
  assert(second.isCurrent(), '新 token 应为 current');

  invalidateCalendarFloatLifecycle();
  assert(!second.isCurrent(), 'invalidate 应使当前 token stale');
  try {
    second.throwIfStale();
  } catch (error) {
    assert(error instanceof CalendarFloatLifecycleCancelledError, 'throwIfStale 应抛命名 cancellation error');
    return;
  }
  throw new Error('stale token 的 throwIfStale 不应静默返回');
}

async function testDelayedWidgetCannotReviveAfterInvalidation(): Promise<void> {
  const { fakeWindow, getCreateCount, getTimerCount } = installFakeWindow();
  const { bootstrapCalendarWidget } = await import('../../src/calendar-float/widget');
  const addonLoad = createDeferred<void>();
  const lifecycle = beginCalendarFloatLifecycle();

  const bootstrap = bootstrapCalendarWidget(lifecycle, {
    ensureProfileAddonsLoaded: () => addonLoad.promise,
  });
  invalidateCalendarFloatLifecycle();
  addonLoad.resolve();

  await assertCancelled(bootstrap, 'addon await 后 stale widget 应取消');
  assert(getCreateCount() === 0, 'stale widget 不得创建 DOM');
  assert(getTimerCount() === 0, 'stale widget 不得创建 retry timer');
  assert(!fakeWindow.CalendarFloatWidget, 'stale widget 不得发布 global API');
}

async function testDelayedHostCannotRegisterAfterInvalidation(): Promise<void> {
  const { fakeWindow } = installFakeWindow();
  const { bootstrapCalendarFloatHostAdapter } = await import('../../src/calendar-float/host-adapter');
  const hostLoad = createDeferred<Record<string, unknown>>();
  let registerCount = 0;
  const lifecycle = beginCalendarFloatLifecycle();
  const bootstrap = bootstrapCalendarFloatHostAdapter(lifecycle, {
    waitForHost: async () => hostLoad.promise,
    waitForWidgetApi: async () => null,
  });

  invalidateCalendarFloatLifecycle();
  hostLoad.resolve({
    registerModule() {
      registerCount += 1;
      return { ok: true };
    },
  });

  await assertCancelled(bootstrap, 'host await 后 stale adapter 应取消');
  assert(registerCount === 0, 'stale adapter 不得 registerModule');
  assert(!fakeWindow.__CalendarFloatHostAdapter__, 'stale adapter 不得发布 global');
}

async function testRegisteredHostIsTornDownWhileWaitingForWidget(): Promise<void> {
  const { fakeWindow } = installFakeWindow();
  const { bootstrapCalendarFloatHostAdapter, teardownCalendarFloatHostAdapter } = await import(
    '../../src/calendar-float/host-adapter'
  );
  const widgetLoad = createDeferred<null>();
  let registerCount = 0;
  let unregisterCount = 0;
  let externalHostEnabledCount = 0;
  fakeWindow.CalendarFloatWidget = {
    setExternalHostMode(enabled: boolean) {
      if (enabled) {
        externalHostEnabledCount += 1;
      }
    },
  };
  const host = {
    registerModule() {
      registerCount += 1;
      return { ok: true };
    },
    unregisterModule() {
      unregisterCount += 1;
      return { ok: true };
    },
  };
  const lifecycle = beginCalendarFloatLifecycle();
  const bootstrap = bootstrapCalendarFloatHostAdapter(lifecycle, {
    waitForHost: async () => host,
    waitForWidgetApi: async () => widgetLoad.promise,
  });

  await Promise.resolve();
  await Promise.resolve();
  assert(registerCount === 1, '等待 widget 前应已注册 host module');
  assert(fakeWindow.__CalendarFloatHostAdapter__, '等待 widget 时应发布 adapter global 供 teardown 使用');

  invalidateCalendarFloatLifecycle();
  teardownCalendarFloatHostAdapter({ unregister: true, silent: true });
  widgetLoad.resolve(null);

  await assertCancelled(bootstrap, '等待 widget 时 teardown 的 adapter 不得复活');
  assert(unregisterCount === 1, 'teardown 应注销已注册 host module 一次');
  assert(externalHostEnabledCount === 0, 'stale adapter 不得开启 external host mode');
  assert(!fakeWindow.__CalendarFloatHostAdapter__, 'teardown 后 adapter global 不得复活');
}

function testEntrypointGuardsProfileAwaitAndInvalidatesFirst(): void {
  const source = readFileSync(resolve(__dirname, '../../src/calendar-float/index.ts'), 'utf8');
  const beginIndex = source.indexOf('beginCalendarFloatLifecycle()');
  const profileIndex = source.indexOf('await initializeCalendarProfile()');
  const guardIndex = source.indexOf('lifecycle.throwIfStale()', profileIndex);
  const scannerIndex = source.indexOf('bootstrapCalendarRuntimeWorldbookScanner()', profileIndex);
  assert(beginIndex >= 0 && beginIndex < profileIndex, 'init 应在 profile await 前 begin lifecycle');
  assert(guardIndex > profileIndex && guardIndex < scannerIndex, 'init 应在 profile await 后、启动 scanner 前 guard');

  const cleanupIndex = source.indexOf('function cleanup()');
  const cleanupBody = source.slice(cleanupIndex, source.indexOf('\n}', cleanupIndex));
  const invalidateIndex = cleanupBody.indexOf('invalidateCalendarFloatLifecycle()');
  const teardownIndex = cleanupBody.indexOf('teardownCalendarMvuRemovalArchive()');
  assert(invalidateIndex >= 0 && invalidateIndex < teardownIndex, 'cleanup 必须先 invalidate 再 teardown');

  const initBody = source.slice(source.indexOf('async function init()'), cleanupIndex);
  assert(
    /catch \(error\)[\s\S]*isCalendarFloatLifecycleCancelledError\(error\)[\s\S]*return;[\s\S]*throw error;/.test(
      initBody,
    ),
    'init 应静默结束 cancellation，但继续抛出真实 profile 初始化错误',
  );
}

async function main(): Promise<void> {
  testGenerationTokenSemantics();
  await testDelayedWidgetCannotReviveAfterInvalidation();
  await testDelayedHostCannotRegisterAfterInvalidation();
  await testRegisteredHostIsTornDownWhileWaitingForWidget();
  testEntrypointGuardsProfileAwaitAndInvalidatesFirst();
  console.log('lifecycle.check.ts OK');
}

void main();
