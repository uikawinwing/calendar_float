import { CALENDAR_MANAGED_WORLDBOOK_VERSION, EXPECTED_MANAGED_ENTRY_COUNT } from './entries';

export type CalendarManagedWorldbookConnectivityState =
  | 'unknown'
  | 'checking'
  | 'ready'
  | 'missing'
  | 'recreated'
  | 'disabled'
  | 'error';

export type ManagedWorldbookSourceGroup = 'event' | 'book' | 'utility';

export interface CalendarManagedWorldbookSourceItem {
  group: ManagedWorldbookSourceGroup;
  label: string;
  sourceWorldbookName: string;
  entryName: string;
  found: boolean;
}

export interface CalendarManagedWorldbookDiagnostics {
  worldbookName: string;
  version: string;
  connectivity: CalendarManagedWorldbookConnectivityState;
  existsInRegistry: boolean;
  foundByScript: boolean;
  createdDuringEnsure: boolean;
  updatedDuringEnsure: boolean;
  lastEnsureSucceeded: boolean;
  lastImportTriggered: boolean;
  entryCount: number;
  hasMetaEntry: boolean;
  hasUpdateRulesEntry: boolean;
  hasVariableListEntry: boolean;
  runtimeIndexWorldbookName: string;
  runtimeContentWorldbookNames: string[];
  managedEntryCount: number;
  expectedManagedEntryCount: number;
  allManagedEntriesPresent: boolean;
  managementEnabled: boolean;
  lastError: string;
  lastEnsureAt: string;
  lastImportAt: string;
  sourceItems: CalendarManagedWorldbookSourceItem[];
}

export interface ManagedWorldbookDiagnosticsState {
  notifiedMissingRuleKeys: Set<string>;
}

export interface ManagedWorldbookToastDiagnostic {
  level: 'error' | 'info' | 'warning';
  delivery: 'toast';
  blocking: false;
  title: string;
  message: string;
  key?: string;
}

export interface ManagedRuntimeWorldbookSummarySnapshot {
  索引世界书?: string | null;
  正文世界书?: string[];
}

export interface ManagedWorldbookSourceCandidateSnapshot {
  sourceGroup: ManagedWorldbookSourceGroup;
  label: string;
  sourceWorldbookName: string;
  entryName: string;
}

export function createDefaultManagedWorldbookDiagnostics(): CalendarManagedWorldbookDiagnostics {
  return {
    worldbookName: '',
    version: CALENDAR_MANAGED_WORLDBOOK_VERSION,
    connectivity: 'unknown',
    existsInRegistry: false,
    foundByScript: false,
    createdDuringEnsure: false,
    updatedDuringEnsure: false,
    lastEnsureSucceeded: false,
    lastImportTriggered: false,
    entryCount: 0,
    hasMetaEntry: false,
    hasUpdateRulesEntry: false,
    hasVariableListEntry: false,
    runtimeIndexWorldbookName: '',
    runtimeContentWorldbookNames: [],
    managedEntryCount: 0,
    expectedManagedEntryCount: EXPECTED_MANAGED_ENTRY_COUNT,
    allManagedEntriesPresent: false,
    managementEnabled: true,
    lastError: '',
    lastEnsureAt: '',
    lastImportAt: '',
    sourceItems: [],
  };
}

export function clearManagedWorldbookDiagnosticsError(
  diagnostics: CalendarManagedWorldbookDiagnostics,
): CalendarManagedWorldbookDiagnostics {
  return { ...diagnostics, lastError: '' };
}

export function setManagedWorldbookDiagnosticsError(
  diagnostics: CalendarManagedWorldbookDiagnostics,
  error: unknown,
): CalendarManagedWorldbookDiagnostics {
  return {
    ...diagnostics,
    lastError: error instanceof Error ? error.message : String(error ?? ''),
  };
}

export function deriveManagedEntryDiagnostics(args: {
  diagnostics: CalendarManagedWorldbookDiagnostics;
  worldbookName: string;
  entries: WorldbookEntry[];
  hasUpdateRulesEntry: boolean;
  hasVariableListEntry: boolean;
}): CalendarManagedWorldbookDiagnostics {
  const managedEntryCount = Number(args.hasUpdateRulesEntry) + Number(args.hasVariableListEntry);
  return {
    ...args.diagnostics,
    worldbookName: args.worldbookName,
    entryCount: args.entries.length,
    hasMetaEntry: false,
    hasUpdateRulesEntry: args.hasUpdateRulesEntry,
    hasVariableListEntry: args.hasVariableListEntry,
    managedEntryCount,
    allManagedEntriesPresent: managedEntryCount === EXPECTED_MANAGED_ENTRY_COUNT,
  };
}

export function applyManagedRuntimeSummary(
  diagnostics: CalendarManagedWorldbookDiagnostics,
  summary: ManagedRuntimeWorldbookSummarySnapshot,
): CalendarManagedWorldbookDiagnostics {
  return {
    ...diagnostics,
    runtimeIndexWorldbookName: summary.索引世界书 ?? '',
    runtimeContentWorldbookNames: summary.正文世界书 ?? [],
  };
}

export function applyManagedSourceCandidates(
  diagnostics: CalendarManagedWorldbookDiagnostics,
  candidates: ManagedWorldbookSourceCandidateSnapshot[],
): CalendarManagedWorldbookDiagnostics {
  return {
    ...diagnostics,
    sourceItems: candidates.map(candidate => ({
      group: candidate.sourceGroup,
      label: candidate.label,
      sourceWorldbookName: candidate.sourceWorldbookName,
      entryName: candidate.entryName,
      found: true,
    })),
  };
}

export function createManagedWorldbookDiagnosticsState(): ManagedWorldbookDiagnosticsState {
  return { notifiedMissingRuleKeys: new Set<string>() };
}

export function shouldNotifyMissingRulesOnce(state: ManagedWorldbookDiagnosticsState, key: string): boolean {
  const normalizedKey = String(key || '').trim();
  if (!normalizedKey || state.notifiedMissingRuleKeys.has(normalizedKey)) {
    return false;
  }
  state.notifiedMissingRuleKeys.add(normalizedKey);
  return true;
}

export function buildMissingManagedWorldbookRulesDiagnostic(args: {
  worldbookName: string;
  missingRules: string[];
}): ManagedWorldbookToastDiagnostic {
  const worldbookName = String(args.worldbookName || '').trim() || '当前世界书';
  const missingRules = args.missingRules.map(rule => String(rule || '').trim()).filter(Boolean);
  const ruleText = missingRules.length > 0 ? `\n缺失规则：${missingRules.join('、')}` : '';
  return {
    level: 'error',
    delivery: 'toast',
    blocking: false,
    title: '月历球提醒',
    key: `rules-missing:${worldbookName}:${missingRules.join('|')}`,
    message: `找不到日历 MVU 规则\n世界书：${worldbookName}${ruleText}\n请在月历球后端面板手动安装或检查当前世界书来源`,
  };
}

export function buildManagedWorldbookInstallFailureToast(
  error: unknown,
  args: { worldbookName?: string } = {},
): ManagedWorldbookToastDiagnostic {
  const worldbookText = String(args.worldbookName || '').trim();
  const message = error instanceof Error ? error.message : String(error ?? '未知错误');
  return {
    level: 'error',
    delivery: 'toast',
    blocking: false,
    title: '月历球提醒',
    message: `${worldbookText ? `世界书：${worldbookText}\n` : ''}${message}`,
  };
}
