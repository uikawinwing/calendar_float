declare const require: NodeRequire;

const worldbookName = '已有月历规则但暂时不可读';
let createAttempts = 0;
(globalThis as any).getWorldbookNames = () => [worldbookName];
(globalThis as any).getWorldbook = async () => {
  throw new Error('模拟世界书读取失败');
};
(globalThis as any).createWorldbook = async () => {
  createAttempts += 1;
  return false;
};

const { installCalendarManagedEntriesToExternalWorldbook } =
  require('../../../src/calendar-float/worldbook-manager/manager') as typeof import('../../../src/calendar-float/worldbook-manager/manager');

async function main(): Promise<void> {
  let failed = false;
  try {
    await installCalendarManagedEntriesToExternalWorldbook(worldbookName);
  } catch (error) {
    failed = error instanceof Error && error.message === '模拟世界书读取失败';
  }

  if (!failed) {
    throw new Error('已有世界书读取失败时应保留原始错误并终止安装');
  }
  if (createAttempts !== 0) {
    throw new Error('已有世界书读取失败时不得尝试创建空世界书');
  }

  const writableWorldbookName = '空白测试世界书';
  let exists = false;
  let entries: any[] = [];
  (globalThis as any).getWorldbookNames = () => (exists ? [writableWorldbookName] : []);
  (globalThis as any).getWorldbook = async () => {
    if (!exists) {
      throw new Error('模拟世界书不存在');
    }
    return entries;
  };
  (globalThis as any).createWorldbook = async () => {
    createAttempts += 1;
    exists = true;
    entries = [];
    return true;
  };
  (globalThis as any).updateWorldbookWith = async (_name: string, updater: (current: any[]) => any[]) => {
    entries = updater(entries);
    return entries;
  };
  const installed = await installCalendarManagedEntriesToExternalWorldbook(writableWorldbookName);
  if (!installed.created || entries.length !== 2 || createAttempts !== 1) {
    throw new Error('真实安装更新路径应创建缺失世界书并写入两条托管规则');
  }
  console.log('read-failure-safety.check.ts OK');
}

void main();
