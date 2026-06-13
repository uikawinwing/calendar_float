import { INSTANCE_KEY } from './constants';
import { bootstrapCalendarFloatHostAdapter, teardownCalendarFloatHostAdapter } from './host-adapter';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function testHostRegistrationWaitsForWidgetApi(): Promise<void> {
  let externalHostEnabled = false;
  let registeredModuleClick: (() => void | Promise<void>) | null = null;
  const fakeWindow = {
    document: {},
    parent: null as unknown,
    setTimeout,
    console,
    __mdpoemFloatingHost__: {
      registerModule(module: { onClick: () => void | Promise<void> }) {
        registeredModuleClick = module.onClick;
        return { ok: true };
      },
      unregisterModule() {
        return { ok: true };
      },
    },
  } as Record<string, unknown>;
  fakeWindow.parent = fakeWindow;
  (globalThis as Record<string, unknown>).window = fakeWindow;

  setTimeout(() => {
    fakeWindow[INSTANCE_KEY] = {
      open() {},
      close() {},
      reload() {},
      destroy() {},
      setExternalHostMode(enabled: boolean) {
        externalHostEnabled = enabled;
      },
    };
  }, 5);

  await bootstrapCalendarFloatHostAdapter();

  assert(registeredModuleClick, '应该注册到 host ball');
  assert(externalHostEnabled, 'widget API 延迟出现后仍应该进入 external host mode');

  teardownCalendarFloatHostAdapter({ unregister: true, silent: true });
}

async function main(): Promise<void> {
  await testHostRegistrationWaitsForWidgetApi();
  console.log('host-adapter.check.ts OK');
}

void main();
