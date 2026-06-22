import {
  buildManagedWorldbookSearchChain,
  normalizeManagedWorldbookName,
  resolveManagedWorldbookTarget,
} from '../../../src/calendar-float/worldbook-manager/targeting';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function testNormalizeManagedWorldbookNameTrimsWhitespace(): void {
  assert(normalizeManagedWorldbookName('  月历球_角色世界书  ') === '月历球_角色世界书', '世界书名称应该裁切空白');
}

function testBuildSearchChainKeepsOrderAndDedupes(): void {
  const chain = buildManagedWorldbookSearchChain({
    primary: '主世界书',
    additional: ['附加一', '主世界书', '附加二'],
    chat: '聊天世界书',
    globals: ['全局一', '附加二'],
  });

  assert(chain.length === 5, '搜索链应该去重后保留 5 个目标');
  assert(chain[0]?.targetMode === 'character_primary', '应先检查主世界书');
  assert(chain[1]?.worldbookName === '附加一', '附加世界书顺序应该保留');
  assert(chain[3]?.targetMode === 'chat_bound', '聊天世界书应该在角色世界书之后');
  assert(chain[4]?.targetMode === 'global', '全局世界书应该最后检查');
}

function testResolveManagedTargetUsesStoredActiveTarget(): void {
  const target = resolveManagedWorldbookTarget({
    storedTarget: '聊天世界书',
    chain: [
      { worldbookName: '主世界书', targetMode: 'character_primary' },
      { worldbookName: '聊天世界书', targetMode: 'chat_bound' },
    ],
  });

  assert(target.worldbookName === '聊天世界书', '若 stored target 仍有效则应该优先使用');
  assert(target.targetMode === 'chat_bound', '应返回 stored target 的模式');
  assert(target.clearedStoredTarget === false, '有效 stored target 不应被清除');
}

function testResolveManagedTargetFallsBackToPrimaryWhenStoredTargetMissing(): void {
  const target = resolveManagedWorldbookTarget({
    storedTarget: '旧世界书',
    chain: [{ worldbookName: '主世界书', targetMode: 'character_primary' }],
  });

  assert(target.worldbookName === '主世界书', '失效 stored target 应回退到主世界书');
  assert(target.clearedStoredTarget === true, '失效 stored target 应标记为需要清除');
}

function main(): void {
  testNormalizeManagedWorldbookNameTrimsWhitespace();
  testBuildSearchChainKeepsOrderAndDedupes();
  testResolveManagedTargetUsesStoredActiveTarget();
  testResolveManagedTargetFallsBackToPrimaryWhenStoredTargetMissing();
  console.log('targeting.check.ts OK');
}

main();
