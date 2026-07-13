// eslint-disable-next-line import-x/no-nodejs-modules -- check inspects lifecycle ordering without executing the script entrypoint.
import { readFileSync } from 'node:fs';
// eslint-disable-next-line import-x/no-nodejs-modules -- check resolves the entrypoint relative to this file.
import { resolve } from 'node:path';

import {
  CalendarFloatLifecycleCancelledError,
  beginCalendarFloatLifecycle,
  completeCalendarFloatLifecycleInitialization,
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

async function testProfileAwaitGateCancelsSilentlyButKeepsRealErrors(): Promise<void> {
  const profileLoad = createDeferred<void>();
  const lifecycle = beginCalendarFloatLifecycle();
  const completion = completeCalendarFloatLifecycleInitialization(lifecycle, () => profileLoad.promise);
  invalidateCalendarFloatLifecycle();
  profileLoad.resolve();
  assert((await completion) === false, 'profile await 期间 stale 应静默返回 false');

  const profileError = new Error('真实 profile 初始化错误');
  const currentLifecycle = beginCalendarFloatLifecycle();
  try {
    await completeCalendarFloatLifecycleInitialization(currentLifecycle, async () => {
      throw profileError;
    });
  } catch (error) {
    assert(error === profileError, '真实 profile 初始化错误必须原样抛出');
    return;
  }
  throw new Error('真实 profile 初始化错误不应被静默吞掉');
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

async function testSynchronousInvalidationDuringRegistrationRollsBackHostModule(): Promise<void> {
  const { fakeWindow } = installFakeWindow();
  const { bootstrapCalendarFloatHostAdapter } = await import('../../src/calendar-float/host-adapter');
  let registerCount = 0;
  let unregisterCount = 0;
  let waitForWidgetCount = 0;
  const lifecycle = beginCalendarFloatLifecycle();
  const bootstrap = bootstrapCalendarFloatHostAdapter(lifecycle, {
    waitForHost: async () => ({
      registerModule() {
        registerCount += 1;
        invalidateCalendarFloatLifecycle();
        return { ok: true };
      },
      unregisterModule() {
        unregisterCount += 1;
        return { ok: true };
      },
    }),
    waitForWidgetApi: async () => {
      waitForWidgetCount += 1;
      return null;
    },
  });

  await assertCancelled(bootstrap, 'registerModule 同步失效后应保持 cancellation 语义');
  assert(registerCount === 1, '应该只尝试注册一次');
  assert(unregisterCount === 1, '已成功注册但 stale 时应立即注销一次');
  assert(waitForWidgetCount === 0, 'stale 注册不得继续等待 widget');
  assert(!fakeWindow.__CalendarFloatHostAdapter__, 'stale 注册不得发布 adapter global');
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
  const profileGateIndex = source.indexOf('await completeCalendarFloatLifecycleInitialization(');
  const scannerIndex = source.indexOf('bootstrapCalendarRuntimeWorldbookScanner()', profileGateIndex);
  assert(beginIndex >= 0 && beginIndex < profileGateIndex, 'init 应在 profile await gate 前 begin lifecycle');
  assert(profileGateIndex < scannerIndex, 'init 应在 profile await gate 完成后才启动 scanner');

  const cleanupIndex = source.indexOf('function cleanup()');
  const cleanupBody = source.slice(cleanupIndex, source.indexOf('\n}', cleanupIndex));
  const invalidateIndex = cleanupBody.indexOf('invalidateCalendarFloatLifecycle()');
  const teardownIndex = cleanupBody.indexOf('teardownCalendarMvuRemovalArchive()');
  assert(invalidateIndex >= 0 && invalidateIndex < teardownIndex, 'cleanup 必须先 invalidate 再 teardown');
}

async function main(): Promise<void> {
  testGenerationTokenSemantics();
  await testProfileAwaitGateCancelsSilentlyButKeepsRealErrors();
  await testDelayedWidgetCannotReviveAfterInvalidation();
  await testDelayedHostCannotRegisterAfterInvalidation();
  await testSynchronousInvalidationDuringRegistrationRollsBackHostModule();
  await testRegisteredHostIsTornDownWhileWaitingForWidget();
  testEntrypointGuardsProfileAwaitAndInvalidatesFirst();
  console.log('lifecycle.check.ts OK');
}

void main();
