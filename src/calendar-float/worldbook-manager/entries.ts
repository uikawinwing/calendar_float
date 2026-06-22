import { getLegacyCalendarVariableListEntryName } from '../storage/legacy-calendar-path';
import {
  buildCalendarUpdateRulesEntryContent,
  buildCalendarVariableListEntryContent,
} from './content';
import { normalizeManagedWorldbookName } from './targeting';

export const MANAGED_WORLDBOOK_MARKER = 'calendar_float_character_worldbook';
export const MANAGED_ENTRY_PREFIX = '[月历球]';
export const PROFILE_FATE_POEM_ENTRY_PREFIX = '[DLC][扩展][月历球]';
export const LEGACY_META_ENTRY_NAME = `${PROFILE_FATE_POEM_ENTRY_PREFIX}[meta]manifest`;
export const UPDATE_RULES_ENTRY_NAME = `[mvu_update]${MANAGED_ENTRY_PREFIX}[月历变量更新规则]`;
export const PROFILE_FATE_POEM_UPDATE_RULES_ENTRY_NAME = `${PROFILE_FATE_POEM_ENTRY_PREFIX}[月历变量更新规则][mvu_update]`;
export const LEGACY_PROFILE_FATE_POEM_UPDATE_RULES_ENTRY_NAME = `[mvu_update]${PROFILE_FATE_POEM_ENTRY_PREFIX}[月历变量更新规则]`;
export const LEGACY_VARIABLE_LIST_ENTRY_NAME = getLegacyCalendarVariableListEntryName(PROFILE_FATE_POEM_ENTRY_PREFIX);
export const VARIABLE_LIST_ENTRY_NAME = `${MANAGED_ENTRY_PREFIX}[当前月历内容展示]`;
export const PROFILE_FATE_POEM_VARIABLE_LIST_ENTRY_NAME = `${PROFILE_FATE_POEM_ENTRY_PREFIX}[当前月历内容展示]`;
export const VARIABLE_LIST_ENTRY_DISPLAY_NAME = '当前月历内容展示';
export const CALENDAR_MANAGED_WORLDBOOK_VERSION = 'v4.1.0';

export const EXPECTED_MANAGED_ENTRY_NAMES = new Set([UPDATE_RULES_ENTRY_NAME, VARIABLE_LIST_ENTRY_NAME]);
export const EXPECTED_MANAGED_ENTRY_COUNT = EXPECTED_MANAGED_ENTRY_NAMES.size;

export type ManagedWorldbookEntrySeed = Partial<WorldbookEntry>;
export type PositionSlot = 'after_character_definition' | 'd1' | 'd2';

function normalizeEntryName(name: unknown): string {
  return normalizeManagedWorldbookName(name);
}

function isUpdateRulesEntryName(name: unknown): boolean {
  const entryName = normalizeEntryName(name);
  return (
    entryName === UPDATE_RULES_ENTRY_NAME ||
    entryName === PROFILE_FATE_POEM_UPDATE_RULES_ENTRY_NAME ||
    entryName === LEGACY_PROFILE_FATE_POEM_UPDATE_RULES_ENTRY_NAME ||
    (entryName.includes('[mvu_update]') && entryName.includes('[月历球]') && entryName.includes('[月历变量更新规则]')) ||
    (entryName.includes('[月历球]') && entryName.includes('[月历变量更新规则]') && entryName.includes('[mvu_update]'))
  );
}

function isVariableListEntryName(name: unknown): boolean {
  const entryName = normalizeEntryName(name);
  return (
    entryName === VARIABLE_LIST_ENTRY_NAME ||
    entryName === PROFILE_FATE_POEM_VARIABLE_LIST_ENTRY_NAME ||
    entryName === LEGACY_VARIABLE_LIST_ENTRY_NAME ||
    (entryName.includes('[月历球]') && entryName.includes('[当前月历内容展示]'))
  );
}

export function isManagedWorldbookEntry(entry: Pick<WorldbookEntry, 'name' | 'extra'>): boolean {
  const entryName = normalizeEntryName(entry.name);
  return (
    String(entry.extra?.managedBy ?? '') === MANAGED_WORLDBOOK_MARKER ||
    entryName === LEGACY_META_ENTRY_NAME ||
    isUpdateRulesEntryName(entryName) ||
    isVariableListEntryName(entryName) ||
    entryName.startsWith(MANAGED_ENTRY_PREFIX) ||
    entryName.startsWith(`[mvu_update]${MANAGED_ENTRY_PREFIX}`) ||
    entryName.startsWith(PROFILE_FATE_POEM_ENTRY_PREFIX) ||
    entryName.startsWith(`[mvu_update]${PROFILE_FATE_POEM_ENTRY_PREFIX}`)
  );
}

export function readManagedEntry(entries: WorldbookEntry[], entryName: string): WorldbookEntry | undefined {
  const normalizedEntryName = normalizeEntryName(entryName);
  return entries.find(entry => normalizeEntryName(entry.name) === normalizedEntryName);
}

export function readVariableListEntry(entries: WorldbookEntry[]): WorldbookEntry | undefined {
  return entries.find(entry => isVariableListEntryName(entry.name));
}

export function hasExpectedManagedEntries(entries: WorldbookEntry[]): boolean {
  const updateRulesEntry = entries.find(entry => isUpdateRulesEntryName(entry.name));
  return Boolean(updateRulesEntry) && Boolean(readVariableListEntry(entries));
}

export function resolvePosition(slot: PositionSlot, order: number): WorldbookEntry['position'] {
  if (slot === 'after_character_definition') {
    return {
      type: 'after_character_definition',
      role: 'system',
      depth: 0,
      order,
    };
  }

  return {
    type: 'at_depth',
    role: 'system',
    depth: slot === 'd2' ? 2 : 1,
    order,
  };
}

export function buildManagedEntryBase(args: {
  name: string;
  content: string;
  order: number;
  slot: PositionSlot;
  enabled?: boolean;
  entryKind: string;
}): ManagedWorldbookEntrySeed {
  return {
    name: args.name,
    enabled: args.enabled !== false,
    strategy: {
      type: 'constant',
      keys: [],
      keys_secondary: {
        logic: 'and_any',
        keys: [],
      },
      scan_depth: 'same_as_global',
    },
    position: resolvePosition(args.slot, args.order),
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
    content: String(args.content || '').trim(),
    extra: {
      managedBy: MANAGED_WORLDBOOK_MARKER,
      version: CALENDAR_MANAGED_WORLDBOOK_VERSION,
      entryPrefix: MANAGED_ENTRY_PREFIX,
      entryKind: args.entryKind,
      slot: args.slot,
    },
  };
}

export function buildManagedWorldbookEntries(): ManagedWorldbookEntrySeed[] {
  return [
    buildManagedEntryBase({
      name: UPDATE_RULES_ENTRY_NAME,
      content: buildCalendarUpdateRulesEntryContent(),
      order: 99998,
      slot: 'd2',
      entryKind: 'mvu_update_rule',
    }),
    buildManagedEntryBase({
      name: VARIABLE_LIST_ENTRY_NAME,
      content: buildCalendarVariableListEntryContent(),
      order: 99999,
      slot: 'd1',
      entryKind: 'variable_list',
    }),
  ];
}

export function mergeManagedEntry(
  existing: WorldbookEntry | undefined,
  seed: ManagedWorldbookEntrySeed,
): ManagedWorldbookEntrySeed {
  if (!existing) {
    return seed;
  }

  return {
    ...existing,
    ...seed,
    strategy: {
      ...(existing.strategy ?? {}),
      ...(seed.strategy ?? {}),
      keys_secondary: {
        ...(existing.strategy?.keys_secondary ?? {}),
        ...((seed.strategy as WorldbookEntry['strategy'] | undefined)?.keys_secondary ?? {}),
      },
    },
    position: {
      ...(existing.position ?? {}),
      ...(seed.position ?? {}),
    },
    recursion: {
      ...(existing.recursion ?? {}),
      ...(seed.recursion ?? {}),
    },
    effect: {
      ...(existing.effect ?? {}),
      ...(seed.effect ?? {}),
    },
    extra: {
      ...(existing.extra ?? {}),
      ...(seed.extra ?? {}),
    },
  };
}
