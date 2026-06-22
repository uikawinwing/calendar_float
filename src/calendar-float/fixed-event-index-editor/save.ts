import { parseFixedEventIndexDraft } from './parse';
import { serializeFixedEventIndexDraft } from './serialize';
import { validateFixedEventIndexDraft } from './validate';
import { DEFAULT_MVU_LOCATION_PATH, DEFAULT_MVU_TIME_PATH } from '../runtime-worldbook/config';
import { ensureCalendarCharacterPrimaryWorldbook } from '../worldbook-manager';
import type { FixedEventIndexDraft } from './draft-types';

const DEFAULT_FIXED_EVENT_INDEX_ENTRY_NAME = '[fixed_event_index]';

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

export interface FixedEventIndexTemplateCreateResult {
  ok: boolean;
  created: boolean;
  worldbookName: string;
  entryName: string;
  message: string;
  yaml?: string;
}

function normalizeText(value: unknown): string {
  return String(value ?? '');
}

function createEmptyFixedEventIndexDraft(source: { worldbookName: string; entryName: string }): FixedEventIndexDraft {
  return {
    entryName: source.entryName,
    worldbookName: source.worldbookName,
    canSave: true,
    saveBlockedReasons: [],
    warnings: [],
    profile: {
      id: 'generic',
      settings: {
        label: '通用月历',
        paths: {
          worldTime: DEFAULT_MVU_TIME_PATH,
          worldLocation: DEFAULT_MVU_LOCATION_PATH,
          unknownFields: {},
        },
        date: {
          unknownFields: {},
        },
        unknownFields: {},
      },
    },
    metadata: {
      version: 1,
      description: '固定事件索引',
    },
    defaults: {
      mvuTimePath: DEFAULT_MVU_TIME_PATH,
      mvuLocationPath: DEFAULT_MVU_LOCATION_PATH,
      fullBookTriggerTemplate: '[[打开《${bookname}》]]',
      unknownFields: {},
    },
    reminderDefaults: {
      outputMode: 'silent_scan',
      injectDepth: 0,
      disableRecursive: true,
      disableKeywords: true,
      macroTemplate: '[[_${id}_reminder_]]',
      inactiveTemplate: '${节庆名} 将在 ${剩余天数} 天后开始。',
      activeTemplate: '${节庆名} 正在举行。',
      unknownFields: {},
      templateUnknownFields: {},
    },
    bookDefaults: {
      summaryOutputMode: 'injectprompt',
      summaryInjectDepth: 4,
      unknownFields: {},
    },
    monthAliases: [],
    groups: [],
    events: [],
    materials: [],
    unknownTopLevelFields: {},
  };
}

export async function createEmptyFixedEventIndexTemplateInCharacterWorldbook(): Promise<FixedEventIndexTemplateCreateResult> {
  const target = await ensureCalendarCharacterPrimaryWorldbook();
  const entryName = DEFAULT_FIXED_EVENT_INDEX_ENTRY_NAME;
  const existing = target.entries.find(entry => String(entry.name ?? '').trim() === entryName);
  if (existing) {
    return {
      ok: true,
      created: false,
      worldbookName: target.worldbookName,
      entryName,
      message: `当前角色世界书已经有「${entryName}」，已直接读取`,
      yaml: normalizeText(existing.content),
    };
  }

  const yaml = serializeFixedEventIndexDraft(
    createEmptyFixedEventIndexDraft({
      worldbookName: target.worldbookName,
      entryName,
    }),
  );
  await updateWorldbookWith(target.worldbookName, entries => [
    ...entries,
    {
      name: entryName,
      enabled: false,
      content: yaml,
      strategy: {
        type: 'constant',
        keys: [],
        keys_secondary: { logic: 'and_any', keys: [] },
        scan_depth: 'same_as_global',
      },
      position: {
        type: 'at_depth',
        role: 'system',
        depth: 4,
        order: 99997,
      },
      probability: 100,
      recursion: {
        prevent_incoming: true,
        prevent_outgoing: true,
        delay_until: null,
      },
      effect: {
        sticky: null,
        cooldown: null,
        delay: null,
      },
      extra: {
        managedBy: 'calendar_float_fixed_event_index',
        entryKind: 'fixed_event_index',
      },
    },
  ]);

  return {
    ok: true,
    created: true,
    worldbookName: target.worldbookName,
    entryName,
    message: `已在「${target.worldbookName}」创建空固定事件索引`,
    yaml,
  };
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
