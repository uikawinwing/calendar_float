import { loadCalendarRuntimeWorldbookSnapshot } from '../../../src/calendar-float/runtime-worldbook/snapshot';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function testSnapshotReadsEachWorldbookOnceAndCachesTextLibraries(): Promise<void> {
  const host = globalThis as any;
  const previousGetCharWorldbookNames = host.getCharWorldbookNames;
  const previousGetGlobalWorldbookNames = host.getGlobalWorldbookNames;
  const previousGetWorldbook = host.getWorldbook;
  const previousToastr = host.toastr;
  const callCounts = new Map<string, number>();

  host.getCharWorldbookNames = () => ({ primary: '索引世界书', additional: [] });
  host.getGlobalWorldbookNames = () => [];
  host.getWorldbook = async (name: string) => {
    callCounts.set(name, (callCounts.get(name) ?? 0) + 1);
    if (name === '索引世界书') {
      return [
        {
          name: '[fixed_event_index]',
          content: '固定事件: []\n补充资料: []',
        },
      ];
    }
    if (name === '文本库世界书') {
      return [
        {
          name: '[测试_文本库]',
          content: '问候: 你好\n告别: 再见',
        },
      ];
    }
    throw new Error(`不应该读取未知世界书：${name}`);
  };
  host.toastr = { warning: () => undefined };

  try {
    const snapshot = await loadCalendarRuntimeWorldbookSnapshot({
      useChatBoundWorldbook: false,
      extraWorldbooks: ['文本库世界书'],
      devWorldbooks: [],
    });
    const reference = { 世界书: '文本库世界书', 条目名: '[测试_文本库]' };
    const first = snapshot.readTextLibrary(reference);
    const second = snapshot.readTextLibrary(reference);

    assert(callCounts.get('索引世界书') === 1, 'snapshot 内索引世界书应该只读取一次');
    assert(callCounts.get('文本库世界书') === 1, 'snapshot 内文本库世界书应该只读取一次');
    assert(first.文本库.问候 === '你好' && first.文本库.告别 === '再见', '文本库 YAML 应该被正确解析');
    assert(first === second, '同一 snapshot 内重复读取相同文本库应该返回缓存结果');
  } finally {
    host.getCharWorldbookNames = previousGetCharWorldbookNames;
    host.getGlobalWorldbookNames = previousGetGlobalWorldbookNames;
    host.getWorldbook = previousGetWorldbook;
    host.toastr = previousToastr;
  }
}

async function main(): Promise<void> {
  await testSnapshotReadsEachWorldbookOnceAndCachesTextLibraries();
  console.log('snapshot.check.ts OK');
}

void main();
