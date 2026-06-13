import { parseDocument } from 'yaml';
import { normalizeCalendarRuntimeIndexDocument } from './loader';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function testTopLevelMaterialLinksBackToFestival(): void {
  const yamlText = `
固定事件:
  - id: huanmo_mask_festival
    名称: 幻沫假面祭
    开始: 05-14
    结束: 05-20
补充资料:
  - id: 幻沫与潮汐之恋：索伦蒂斯的起源
    书名: 幻沫与潮汐之恋：索伦蒂斯的起源
    关联事件:
      - huanmo_mask_festival
    全文:
      条目名: "[节庆_幻沫假面祭_文本_幻沫与潮汐之恋：索伦蒂斯的起源]"
`;
  const warnings: string[] = [];
  const parsed = parseDocument(yamlText).toJS();
  const normalized = normalizeCalendarRuntimeIndexDocument(parsed, warnings);
  assert(normalized, '索引应该能被成功归一化');

  const festival = normalized?.节庆?.find(item => item.id === 'huanmo_mask_festival');
  assert(festival, '应该存在幻沫假面祭');
  assert(
    festival?.相关书籍?.includes('幻沫与潮汐之恋：索伦蒂斯的起源'),
    '顶层补充资料的关联事件应该反向补进节庆相关书籍',
  );

  const book = normalized?.书籍?.find(item => item.id === '幻沫与潮汐之恋：索伦蒂斯的起源');
  assert(book, '顶层补充资料应该被保留在书籍列表');
}

function main(): void {
  testTopLevelMaterialLinksBackToFestival();
  console.log('loader.check.ts OK');
}

main();
