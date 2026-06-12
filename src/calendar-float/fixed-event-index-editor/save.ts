import { parseFixedEventIndexDraft } from './parse';
import { serializeFixedEventIndexDraft } from './serialize';
import { validateFixedEventIndexDraft } from './validate';
import type { FixedEventIndexDraft } from './draft-types';

export interface FixedEventIndexSaveSource {
  worldbookName: string;
  entryName: string;
  content: string;
}

export interface FixedEventIndexSaveArgs {
  source: FixedEventIndexSaveSource;
  draft: FixedEventIndexDraft;
}

export interface FixedEventIndexYamlSaveArgs {
  source: FixedEventIndexSaveSource;
  yaml: string;
}

export interface FixedEventIndexSaveResult {
  ok: boolean;
  message: string;
  yaml?: string;
}

function normalizeText(value: unknown): string {
  return String(value ?? '');
}

export async function saveFixedEventIndexDraftToWorldbook(
  args: FixedEventIndexSaveArgs,
): Promise<FixedEventIndexSaveResult> {
  const worldbookName = String(args.source.worldbookName || '').trim();
  const entryName = String(args.source.entryName || '').trim();
  if (!worldbookName || !entryName) {
    return {
      ok: false,
      message: '缺少固定事件索引来源，无法保存',
    };
  }

  const validation = validateFixedEventIndexDraft(args.draft);
  if (!validation.canSave) {
    return {
      ok: false,
      message: `固定事件索引未通过校验：${validation.blockingIssues.join('；')}`,
    };
  }

  const entries = await getWorldbook(worldbookName);
  const targetIndex = entries.findIndex(entry => entry.name === entryName);
  if (targetIndex < 0) {
    return {
      ok: false,
      message: `世界书「${worldbookName}」中找不到条目「${entryName}」，已取消保存`,
    };
  }

  const targetEntry = entries[targetIndex];
  if (normalizeText(targetEntry.content) !== normalizeText(args.source.content)) {
    return {
      ok: false,
      message: `条目「${entryName}」的内容已经改变，请重新读取后再保存`,
    };
  }

  const yaml = serializeFixedEventIndexDraft(args.draft);
  const nextEntries = entries.map((entry, index) => (index === targetIndex ? { ...entry, content: yaml } : entry));
  await replaceWorldbook(worldbookName, nextEntries, { render: 'debounced' });

  return {
    ok: true,
    message: `已保存到「${worldbookName}」/${entryName}`,
    yaml,
  };
}

export async function saveFixedEventIndexYamlToWorldbook(
  args: FixedEventIndexYamlSaveArgs,
): Promise<FixedEventIndexSaveResult> {
  try {
    const draft = parseFixedEventIndexDraft(args.yaml, {
      worldbookName: args.source.worldbookName,
      entryName: args.source.entryName,
    });
    return await saveFixedEventIndexDraftToWorldbook({
      source: args.source,
      draft,
    });
  } catch (error) {
    return {
      ok: false,
      message: `固定事件索引 YAML 解析失败：${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
