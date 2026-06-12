import { SCRIPT_NAME } from '../constants';
import { getChatBoundCalendarWorldbookName, readCalendarSourceConfig } from '../storage';
import type { CalendarSourceConfig, ResolvedCalendarWorldbookSource } from '../types';

let lastDuplicateWorldbookWarningSignature = '';

function 规范化来源名称(value: unknown): string {
  return String(value ?? '').trim();
}

function 规范化世界书名列表(names: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const rawName of names) {
    const name = 规范化来源名称(rawName);
    if (!name || seen.has(name)) {
      continue;
    }
    seen.add(name);
    output.push(name);
  }
  return output;
}

function 来源类型显示名(kind: ResolvedCalendarWorldbookSource['kind']): string {
  switch (kind) {
    case 'character_primary':
      return '角色主世界书';
    case 'character_additional':
      return '角色附加世界书';
    case 'global':
      return '全局世界书';
    case 'chat_bound':
      return '聊天绑定世界书';
    case 'extra':
      return '手动额外世界书';
    case 'dev':
      return '开发世界书';
    default:
      return '未知来源';
  }
}

function 提醒重复世界书绑定(sources: ResolvedCalendarWorldbookSource[]): void {
  const byName = new Map<string, ResolvedCalendarWorldbookSource[]>();
  for (const source of sources) {
    const name = 规范化来源名称(source.name);
    if (!name) {
      continue;
    }
    byName.set(name, [...(byName.get(name) ?? []), source]);
  }

  const duplicated = [...byName.entries()]
    .filter(([, items]) => items.length > 1)
    .map(([name, items]) => ({
      name,
      labels: items.map(item => 来源类型显示名(item.kind)),
    }));
  const signature = duplicated.map(item => `${item.name}:${item.labels.join(',')}`).join('|');
  if (!signature) {
    lastDuplicateWorldbookWarningSignature = '';
    return;
  }
  if (signature === lastDuplicateWorldbookWarningSignature) {
    return;
  }
  lastDuplicateWorldbookWarningSignature = signature;

  const message = `检测到重复绑定的世界书：${duplicated
    .map(item => `「${item.name}」（${item.labels.join('、')}）`)
    .join('、')}。请检查角色主世界书、角色附加世界书和全局世界书设置。`;
  console.warn(`[${SCRIPT_NAME}] ${message}`);
  toastr.warning(message);
}

export function resolveCalendarRuntimeWorldbookSources(
  sourceConfig: CalendarSourceConfig = readCalendarSourceConfig(),
): ResolvedCalendarWorldbookSource[] {
  const characterBinding = getCharWorldbookNames('current');
  const rawSources: ResolvedCalendarWorldbookSource[] = [];
  const output: ResolvedCalendarWorldbookSource[] = [];
  const seen = new Set<string>();

  const pushSource = (name: string, kind: ResolvedCalendarWorldbookSource['kind']): void => {
    const normalized = 规范化来源名称(name);
    if (!normalized) {
      return;
    }
    rawSources.push({ name: normalized, kind });
  };

  const primary = 规范化来源名称(characterBinding.primary);
  if (primary) {
    pushSource(primary, 'character_primary');
  } else if (sourceConfig.useChatBoundWorldbook) {
    pushSource(getChatBoundCalendarWorldbookName(), 'chat_bound');
  }
  for (const name of characterBinding.additional) {
    pushSource(name, 'character_additional');
  }
  for (const name of getGlobalWorldbookNames()) {
    pushSource(name, 'global');
  }
  for (const name of 规范化世界书名列表(sourceConfig.extraWorldbooks)) {
    pushSource(name, 'extra');
  }
  for (const name of 规范化世界书名列表(sourceConfig.devWorldbooks)) {
    pushSource(name, 'dev');
  }

  提醒重复世界书绑定(rawSources);
  for (const source of rawSources) {
    if (seen.has(source.name)) {
      continue;
    }
    seen.add(source.name);
    output.push(source);
  }

  return output;
}
