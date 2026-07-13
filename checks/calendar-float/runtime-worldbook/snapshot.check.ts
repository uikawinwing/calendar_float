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
        {
          name: '[无效_文本库]',
          content: '坏掉: [',
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
    const whitespaceEquivalent = snapshot.readTextLibrary({ 世界书: ' 文本库世界书 ', 条目名: ' [测试_文本库] ' });

    assert(callCounts.get('索引世界书') === 1, 'snapshot 内索引世界书应该只读取一次');
    assert(callCounts.get('文本库世界书') === 1, 'snapshot 内文本库世界书应该只读取一次');
    assert(first.文本库.问候 === '你好' && first.文本库.告别 === '再见', '文本库 YAML 应该被正确解析');
    assert(first === second, '同一 snapshot 内重复读取相同文本库应该返回缓存结果');
    assert(first === whitespaceEquivalent, 'matcher 视为等价的空白 reference 应该命中同一缓存结果');

    const snapshotWarningsBefore = [...snapshot.warnings];
    const indexWarningsBefore = [...snapshot.indexResult.警告];
    const firstWarningsBefore = [...first.警告];
    const invalid = snapshot.readTextLibrary({ 世界书: '文本库世界书', 条目名: '[无效_文本库]' });

    assert(invalid.警告.some(item => item.includes('YAML 解析失败')), '无效文本库结果应该保留 YAML 解析警告');
    assert(JSON.stringify(snapshot.warnings) === JSON.stringify(snapshotWarningsBefore), '后续解析失败不应修改 snapshot warnings');
    assert(JSON.stringify(snapshot.indexResult.警告) === JSON.stringify(indexWarningsBefore), '后续解析失败不应修改既有 index warnings');
    assert(JSON.stringify(first.警告) === JSON.stringify(firstWarningsBefore), '后续解析失败不应修改已缓存的有效文本库 warnings');

    const mutationSentinel = '外部 warnings mutation';
    snapshot.indexResult.警告.push(mutationSentinel);
    assert(!snapshot.warnings.includes(mutationSentinel), '修改 index warnings 不应修改 snapshot warnings');
    assert(!first.警告.includes(mutationSentinel), '修改 index warnings 不应修改已缓存的有效文本库 warnings');
    assert(!invalid.警告.includes(mutationSentinel), '修改 index warnings 不应修改其他缓存结果 warnings');

    const cacheMutationSentinel = '缓存结果 warnings mutation';
    first.警告.push(cacheMutationSentinel);
    assert(!snapshot.warnings.includes(cacheMutationSentinel), '修改缓存结果 warnings 不应修改 snapshot warnings');
    assert(!snapshot.indexResult.警告.includes(cacheMutationSentinel), '修改缓存结果 warnings 不应修改 index warnings');
    assert(!invalid.警告.includes(cacheMutationSentinel), '修改一个缓存结果 warnings 不应修改其他缓存结果 warnings');
  } finally {
    host.getCharWorldbookNames = previousGetCharWorldbookNames;
    host.getGlobalWorldbookNames = previousGetGlobalWorldbookNames;
    host.getWorldbook = previousGetWorldbook;
    host.toastr = previousToastr;
  }
}

async function testSnapshotTextLibraryCacheKeysDoNotCollideOnSeparators(): Promise<void> {
  const host = globalThis as any;
  const previousGetCharWorldbookNames = host.getCharWorldbookNames;
  const previousGetGlobalWorldbookNames = host.getGlobalWorldbookNames;
  const previousGetWorldbook = host.getWorldbook;
  const previousToastr = host.toastr;

  host.getCharWorldbookNames = () => ({ primary: '索引世界书', additional: [] });
  host.getGlobalWorldbookNames = () => [];
  host.getWorldbook = async (name: string) => {
    if (name === '索引世界书') {
      return [{ name: '[fixed_event_index]', content: '固定事件: []\n补充资料: []' }];
    }
    if (name === 'a::b') {
      return [{ name: 'c', content: '值: 第一份' }];
    }
    if (name === 'a') {
      return [{ name: 'b::c', content: '值: 第二份' }];
    }
    throw new Error(`不应该读取未知世界书：${name}`);
  };
  host.toastr = { warning: () => undefined };

  try {
    const snapshot = await loadCalendarRuntimeWorldbookSnapshot({
      useChatBoundWorldbook: false,
      extraWorldbooks: ['a::b', 'a'],
      devWorldbooks: [],
    });
    const first = snapshot.readTextLibrary({ 世界书: 'a::b', 条目名: 'c' });
    const second = snapshot.readTextLibrary({ 世界书: 'a', 条目名: 'b::c' });

    assert(first.文本库.值 === '第一份', '第一组 separator reference 应该读取第一份文本库');
    assert(second.文本库.值 === '第二份', '不同 reference tuple 不应该碰撞到第一份缓存');
  } finally {
    host.getCharWorldbookNames = previousGetCharWorldbookNames;
    host.getGlobalWorldbookNames = previousGetGlobalWorldbookNames;
    host.getWorldbook = previousGetWorldbook;
    host.toastr = previousToastr;
  }
}

async function main(): Promise<void> {
  await testSnapshotReadsEachWorldbookOnceAndCachesTextLibraries();
  await testSnapshotTextLibraryCacheKeysDoNotCollideOnSeparators();
  console.log('snapshot.check.ts OK');
}

void main();
