declare const require: NodeRequire;

// eslint-disable-next-line import-x/no-nodejs-modules -- check replaces the runtime evaluator with deterministic stubs.
const Module = require('module') as {
  _load: (request: string, parent: NodeJS.Module | null, isMain: boolean) => unknown;
};
const originalLoad = Module._load;
Module._load = (request, parent, isMain) => {
  if (
    request === '../runtime-trigger-evaluator' &&
    parent?.filename.replaceAll('\\', '/').endsWith('/runtime-dataset/books.ts')
  ) {
    return {
      resolveCalendarBookAbstract: async () => ({ 正文: '' }),
      resolveCalendarContentNode: async () => ({ 正文: '' }),
    };
  }
  return originalLoad(request, parent, isMain);
};

const { normalizeCalendarRuntimeIndexDocument } =
  require('../../../src/calendar-float/runtime-worldbook/index-normalizer') as typeof import('../../../src/calendar-float/runtime-worldbook/index-normalizer');
const { buildRuntimeBookRecord } =
  require('../../../src/calendar-float/runtime-dataset/books') as typeof import('../../../src/calendar-float/runtime-dataset/books');

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main(): Promise<void> {
  const index = normalizeCalendarRuntimeIndexDocument({
    默认设置: { 书籍全文默认关键词模板: '[[查看${bookname}·${entryname}]]' },
    补充资料: [{ id: 'book_1', 名称: '星河册', 全文: { 条目名: '星河正文' } }],
  });
  assert(index?.书籍.length === 1, '应规范化索引中的书籍');
  const record = await buildRuntimeBookRecord(index.书籍[0], { year: 488, month: 6, day: 1 }, {} as never);
  assert(record.triggerText === '[[查看星河册·星河正文]]', 'UI 应复用世界书索引配置生成的全文触发词');

  const explicitIndex = normalizeCalendarRuntimeIndexDocument({
    默认设置: { 书籍全文默认关键词模板: '[[查看${bookname}]]' },
    补充资料: [{ id: 'book_2', 名称: '月影册', 全文: { 条目名: '月影正文', 关键字: ['玩家自定义触发词'] } }],
  });
  assert(explicitIndex?.书籍.length === 1, '应规范化有自定义触发词的书籍');
  const explicitRecord = await buildRuntimeBookRecord(
    explicitIndex.书籍[0],
    { year: 488, month: 6, day: 1 },
    {} as never,
  );
  assert(explicitRecord.triggerText === '玩家自定义触发词', 'UI 应优先复用世界书条目中的显式全文触发词');
  console.log('book-trigger.check.ts OK');
}

void main();
