import type { CalendarRuntimeWorldbookMoveCandidate } from '../runtime-worldbook';
import { normalizeManagedWorldbookName } from './targeting';
import { VARIABLE_LIST_ENTRY_DISPLAY_NAME, mergeManagedEntry, type ManagedWorldbookEntrySeed } from './entries';
import type { ManagedWorldbookSourceGroup } from './diagnostics';

export type CalendarWorldbookMoveCandidateKind =
  | 'backend_meta'
  | 'backend_update_rules'
  | 'backend_variable_display'
  | 'runtime_index'
  | 'runtime_content';

export type CalendarWorldbookSourceGroup = ManagedWorldbookSourceGroup;

export interface CalendarWorldbookMoveCandidate {
  id: string;
  label: string;
  kind: CalendarWorldbookMoveCandidateKind;
  sourceGroup: CalendarWorldbookSourceGroup;
  sourceWorldbookName: string;
  entryName: string;
  entry: Partial<WorldbookEntry>;
  selectedByDefault: boolean;
}

export interface SourceEntryRemovalPlan {
  sourceWorldbookName: string;
  entryNames: string[];
}

function normalizeEntryName(name: unknown): string {
  return normalizeManagedWorldbookName(name);
}

function buildBackendMoveCandidateId(entryKind: string): string {
  return `backend::${entryKind}`;
}

export function buildManagedBackendMoveCandidates(args: {
  targetName: string;
  entries: ManagedWorldbookEntrySeed[];
}): CalendarWorldbookMoveCandidate[] {
  return args.entries.map(entry => {
    const entryKind = String(entry.extra?.entryKind || 'backend');
    const label =
      entryKind === 'mvu_update_rule' ? '基础规则：月历变量更新规则' : `变量展示：${VARIABLE_LIST_ENTRY_DISPLAY_NAME}`;
    const kind: CalendarWorldbookMoveCandidateKind =
      entryKind === 'mvu_update_rule' ? 'backend_update_rules' : 'backend_variable_display';
    return {
      id: buildBackendMoveCandidateId(entryKind),
      label,
      kind,
      sourceGroup: 'utility',
      sourceWorldbookName: args.targetName,
      entryName: normalizeEntryName(entry.name),
      entry,
      selectedByDefault: true,
    };
  });
}

export function mapRuntimeMoveCandidate(candidate: CalendarRuntimeWorldbookMoveCandidate): CalendarWorldbookMoveCandidate {
  return {
    id: candidate.id,
    label: candidate.label,
    kind: candidate.kind,
    sourceGroup: candidate.label.includes('读物') ? 'book' : 'event',
    sourceWorldbookName: candidate.sourceWorldbookName,
    entryName: candidate.entryName,
    entry: candidate.entry,
    selectedByDefault: candidate.selectedByDefault,
  };
}

export function cloneMoveCandidateEntry(candidate: CalendarWorldbookMoveCandidate): ManagedWorldbookEntrySeed {
  const { uid: _uid, ...entry } = candidate.entry as WorldbookEntry;
  return {
    ...entry,
    name: candidate.entryName || entry.name,
    extra: {
      ...(entry.extra ?? {}),
      calendarFloatMovedFrom: candidate.sourceGroup === 'utility' ? undefined : candidate.sourceWorldbookName,
    },
  };
}

export function mergeTransferredEntry(
  existing: WorldbookEntry | undefined,
  seed: ManagedWorldbookEntrySeed,
): ManagedWorldbookEntrySeed {
  if (!existing) {
    return seed;
  }
  return mergeManagedEntry(existing, seed);
}

export function planSourceEntryRemovals(args: {
  removeFromSource: boolean;
  targetWorldbookName: string;
  candidates: CalendarWorldbookMoveCandidate[];
}): SourceEntryRemovalPlan[] {
  if (!args.removeFromSource) {
    return [];
  }

  const deletionsByWorldbook = new Map<string, Set<string>>();
  args.candidates
    .filter(candidate => candidate.sourceGroup !== 'utility')
    .filter(candidate => normalizeEntryName(candidate.sourceWorldbookName))
    .filter(candidate => normalizeEntryName(candidate.sourceWorldbookName) !== normalizeEntryName(args.targetWorldbookName))
    .forEach(candidate => {
      const sourceWorldbookName = normalizeEntryName(candidate.sourceWorldbookName);
      const entryName = normalizeEntryName(candidate.entryName);
      if (!sourceWorldbookName || !entryName) {
        return;
      }
      const names = deletionsByWorldbook.get(sourceWorldbookName) ?? new Set<string>();
      names.add(entryName);
      deletionsByWorldbook.set(sourceWorldbookName, names);
    });

  return Array.from(deletionsByWorldbook, ([sourceWorldbookName, entryNames]) => ({
    sourceWorldbookName,
    entryNames: Array.from(entryNames),
  }));
}
