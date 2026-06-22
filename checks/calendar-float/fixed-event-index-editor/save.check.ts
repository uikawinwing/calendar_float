import { parseFixedEventIndexDraft } from '../../../src/calendar-float/fixed-event-index-editor/parse';
import { createEmptyFixedEventIndexTemplateInCharacterWorldbook } from '../../../src/calendar-float/fixed-event-index-editor/save';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function testCreateEmptyTemplateIncludesProfileDefaults(): Promise<void> {
  let writtenEntries: WorldbookEntry[] = [];

  (globalThis as unknown as { getCharWorldbookNames: () => CharWorldbooks }).getCharWorldbookNames = () => ({
    primary: '角色世界书',
    additional: [],
  });
  (globalThis as unknown as { getWorldbook: (name: string) => Promise<WorldbookEntry[]> }).getWorldbook = async () => [];
  (
    globalThis as unknown as {
      updateWorldbookWith: (name: string, updater: (entries: WorldbookEntry[]) => WorldbookEntry[]) => Promise<void>;
    }
  ).updateWorldbookWith = async (_name, updater) => {
    writtenEntries = updater([]);
  };

  const result = await createEmptyFixedEventIndexTemplateInCharacterWorldbook();

  assert(result.ok, '创建空固定事件索引应该成功');
  assert(result.yaml, '创建结果应该返回 yaml');
  assert(writtenEntries.length === 1, '应该写入一个固定事件索引条目');

  const draft = parseFixedEventIndexDraft(result.yaml, {
    entryName: result.entryName,
    worldbookName: result.worldbookName,
  });

  assert(draft.profile !== undefined, '空模板应该包含 profile draft');
  assert(draft.profile.settings.date !== undefined, '空模板应该包含 profile date 设置');
}

async function main(): Promise<void> {
  await testCreateEmptyTemplateIncludesProfileDefaults();
  console.log('fixed-event-index-editor/save.check.ts OK');
}

void main();
