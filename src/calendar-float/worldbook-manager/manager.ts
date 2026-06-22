/**
 * 负责：安装、重装、卸载、检查脚本自带的 worldbook backend 基础设施条目。
 * 不负责：节庆正文来源、书籍正文来源、trigger 逻辑判定。
 * 上游：[`./index.ts`](src/calendar-float/index.ts) 与 [`./widget/index.ts`](src/calendar-float/widget/index.ts) 会调用这里的能力。
 */
import { SCRIPT_NAME } from '../constants';
import {
  inspectCalendarRuntimeWorldbookSummary,
  listCalendarRuntimeWorldbookMoveCandidates,
} from '../runtime-worldbook';
import {
  CALENDAR_MANAGED_WORLDBOOK_VERSION,
  MANAGED_ENTRY_PREFIX,
  UPDATE_RULES_ENTRY_NAME,
  VARIABLE_LIST_ENTRY_DISPLAY_NAME,
  VARIABLE_LIST_ENTRY_NAME,
  buildManagedWorldbookEntries,
  hasExpectedManagedEntries,
  isManagedWorldbookEntry,
  readManagedEntry,
  readVariableListEntry,
  type ManagedWorldbookEntrySeed,
} from './entries';
import {
  applyManagedRuntimeSummary,
  applyManagedSourceCandidates,
  clearManagedWorldbookDiagnosticsError,
  createDefaultManagedWorldbookDiagnostics,
  deriveManagedEntryDiagnostics,
  setManagedWorldbookDiagnosticsError,
  type CalendarManagedWorldbookDiagnostics,
} from './diagnostics';
import {
  buildManagedWorldbookSearchChain,
  dedupeManagedWorldbookNames,
  normalizeManagedWorldbookName,
  resolveManagedWorldbookTarget,
  type ManagedWorldbookTargetCandidate,
  type ManagedWorldbookTargetMode,
} from './targeting';
import {
  buildManagedBackendMoveCandidates,
  cloneMoveCandidateEntry,
  mapRuntimeMoveCandidate,
  mergeTransferredEntry,
  planSourceEntryRemovals,
  type CalendarWorldbookMoveCandidate,
} from './transfer';

const MANAGED_WORLDBOOK_STORAGE_KEY = `${SCRIPT_NAME}:managed-worldbook-enabled`;
const MANAGED_WORLDBOOK_TARGET_STORAGE_KEY = `${SCRIPT_NAME}:managed-worldbook-target`;

export const CALENDAR_MANAGED_ENTRY_PREFIX = MANAGED_ENTRY_PREFIX;
export const CALENDAR_UPDATE_RULES_ENTRY_NAME = UPDATE_RULES_ENTRY_NAME;
export const CALENDAR_VARIABLE_LIST_ENTRY_NAME = VARIABLE_LIST_ENTRY_NAME;
export const CALENDAR_VARIABLE_LIST_ENTRY_DISPLAY_NAME = VARIABLE_LIST_ENTRY_DISPLAY_NAME;

export type {
  CalendarManagedWorldbookConnectivityState,
  CalendarManagedWorldbookDiagnostics,
  CalendarManagedWorldbookSourceItem,
} from './diagnostics';
export type { CalendarWorldbookMoveCandidate, CalendarWorldbookMoveCandidateKind, CalendarWorldbookSourceGroup } from './transfer';

export interface EnsureCalendarManagedWorldbookEntriesResult {
  name: string;
  created: boolean;
  updated: boolean;
  movedCount?: number;
  removedSourceCount?: number;
  targetMode?: ManagedWorldbookTargetMode;
}

export interface CalendarWorldbookMoveCandidatesResult {
  candidates: CalendarWorldbookMoveCandidate[];
  warnings: string[];
}

export interface InstallCalendarManagedEntriesToExternalWorldbookOptions {
  candidateIds?: string[];
  removeFromSource?: boolean;
}

let diagnostics: CalendarManagedWorldbookDiagnostics = createDefaultManagedWorldbookDiagnostics();

function nowIso(): string {
  return new Date().toISOString();
}

function resetDiagnosticsError(): void {
  diagnostics = clearManagedWorldbookDiagnosticsError(diagnostics);
}

function setDiagnosticsError(error: unknown): void {
  diagnostics = setManagedWorldbookDiagnosticsError(diagnostics, error);
}

function emitManagedWorldbookDebugLog(message: string, extra?: Record<string, unknown>): void {
  if (extra) {
    console.info(`[${SCRIPT_NAME}] ${message}`, extra);
    return;
  }
  console.info(`[${SCRIPT_NAME}] ${message}`);
}

function emitManagedWorldbookWarnLog(message: string, extra?: Record<string, unknown>): void {
  if (extra) {
    console.warn(`[${SCRIPT_NAME}] ${message}`, extra);
    return;
  }
  console.warn(`[${SCRIPT_NAME}] ${message}`);
}

function normalizeEntryName(name: unknown): string {
  return normalizeManagedWorldbookName(name);
}

function normalizeWorldbookNameList(names: string[]): string[] {
  return dedupeManagedWorldbookNames(names);
}

function readAvailableWorldbookNames(): string[] {
  return normalizeWorldbookNameList([...getWorldbookNames(), ...getGlobalWorldbookNames()]).sort((left, right) =>
    left.localeCompare(right, 'zh-CN'),
  );
}

function readCurrentCharacterWorldbookBinding(): CharWorldbooks {
  const binding = getCharWorldbookNames('current');
  return {
    primary: binding.primary ? String(binding.primary).trim() : null,
    additional: binding.additional
      .map(name => String(name || '').trim())
      .filter(Boolean)
      .filter((name, index, list) => list.indexOf(name) === index),
  };
}

function readCurrentCharacterPrimaryWorldbookName(): string {
  return String(readCurrentCharacterWorldbookBinding().primary || '').trim();
}

function readCurrentChatWorldbookName(): string {
  if (typeof (globalThis as { getChatWorldbookName?: unknown }).getChatWorldbookName !== 'function') {
    return '';
  }
  try {
    return normalizeEntryName(getChatWorldbookName('current'));
  } catch (error) {
    emitManagedWorldbookWarnLog('读取当前聊天世界书失败，已跳过聊天世界书检查', {
      error: error instanceof Error ? error.message : String(error),
    });
    return '';
  }
}

function readEnabledGlobalWorldbookNames(): string[] {
  if (typeof (globalThis as { getGlobalWorldbookNames?: unknown }).getGlobalWorldbookNames !== 'function') {
    return [];
  }
  try {
    return normalizeWorldbookNameList(getGlobalWorldbookNames());
  } catch (error) {
    emitManagedWorldbookWarnLog('读取已启用全局世界书失败，已跳过全局世界书检查', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

function readManagedWorldbookSearchChain(): ManagedWorldbookTargetCandidate[] {
  const binding = readCurrentCharacterWorldbookBinding();
  return buildManagedWorldbookSearchChain({
    primary: binding.primary,
    additional: binding.additional,
    chat: readCurrentChatWorldbookName(),
    globals: readEnabledGlobalWorldbookNames(),
  });
}

export async function listCalendarWorldbookMoveCandidates(): Promise<CalendarWorldbookMoveCandidatesResult> {
  const backendCandidates = buildManagedBackendMoveCandidates({
    targetName: readManagedWorldbookTargetName().worldbookName || '脚本内置',
    entries: buildManagedWorldbookEntries(),
  });
  const runtimeResult = await listCalendarRuntimeWorldbookMoveCandidates();
  return {
    candidates: [...backendCandidates, ...runtimeResult.candidates.map(mapRuntimeMoveCandidate)],
    warnings: runtimeResult.warnings,
  };
}

export async function refreshCalendarManagedWorldbookSourceDiagnostics(): Promise<void> {
  try {
    const result = await listCalendarWorldbookMoveCandidates();
    diagnostics = applyManagedSourceCandidates(diagnostics, result.candidates);
  } catch (error) {
    diagnostics = applyManagedSourceCandidates(diagnostics, []);
    setDiagnosticsError(error);
  }
}

export function getCalendarManagedWorldbookTargetName(): string {
  return readManagedWorldbookTargetName().worldbookName;
}

function syncEntryDiagnostics(entries: WorldbookEntry[], worldbookName: string): void {
  diagnostics = deriveManagedEntryDiagnostics({
    diagnostics,
    worldbookName,
    entries,
    hasUpdateRulesEntry: Boolean(readManagedEntry(entries, UPDATE_RULES_ENTRY_NAME)),
    hasVariableListEntry: Boolean(readVariableListEntry(entries)),
  });
}

export async function refreshCalendarManagedWorldbookRuntimeDiagnostics(): Promise<void> {
  const summary = await inspectCalendarRuntimeWorldbookSummary();
  diagnostics = applyManagedRuntimeSummary(diagnostics, summary);
}

function isManagementEnabled(): boolean {
  try {
    return window.localStorage?.getItem(MANAGED_WORLDBOOK_STORAGE_KEY) !== '0';
  } catch (error) {
    console.warn(`[${SCRIPT_NAME}] 读取 worldbook 管理开关失败`, error);
    return true;
  }
}

function setManagementEnabled(enabled: boolean): void {
  diagnostics.managementEnabled = enabled;
  try {
    window.localStorage?.setItem(MANAGED_WORLDBOOK_STORAGE_KEY, enabled ? '1' : '0');
  } catch (error) {
    console.warn(`[${SCRIPT_NAME}] 写入 worldbook 管理开关失败`, error);
  }
}

function readStoredManagedWorldbookTargetName(): string {
  try {
    return normalizeEntryName(window.localStorage?.getItem(MANAGED_WORLDBOOK_TARGET_STORAGE_KEY));
  } catch (error) {
    console.warn(`[${SCRIPT_NAME}] 读取 worldbook 后端目标失败`, error);
    return '';
  }
}

function writeStoredManagedWorldbookTargetName(worldbookName: string): void {
  const normalized = normalizeEntryName(worldbookName);
  try {
    if (normalized) {
      window.localStorage?.setItem(MANAGED_WORLDBOOK_TARGET_STORAGE_KEY, normalized);
    } else {
      window.localStorage?.removeItem(MANAGED_WORLDBOOK_TARGET_STORAGE_KEY);
    }
  } catch (error) {
    console.warn(`[${SCRIPT_NAME}] 写入 worldbook 后端目标失败`, error);
  }
}

function readManagedWorldbookTargetName(): {
  worldbookName: string;
  targetMode: ManagedWorldbookTargetMode;
} {
  const target = resolveManagedWorldbookTarget({
    storedTarget: readStoredManagedWorldbookTargetName(),
    chain: readManagedWorldbookSearchChain(),
  });
  if (target.clearedStoredTarget) {
    writeStoredManagedWorldbookTargetName('');
  }
  return { worldbookName: target.worldbookName, targetMode: target.targetMode };
}

function isManagedCharacterWorldbookName(worldbookName: string): boolean {
  const normalized = normalizeEntryName(worldbookName);
  return normalized.includes('月历球世界书') || normalized === '月历球_角色世界书' || normalized.startsWith('月历球_角色世界书_');
}

async function findReadableManagedAdditionalWorldbook(binding: CharWorldbooks): Promise<{
  worldbookName: string;
  entries: WorldbookEntry[];
} | null> {
  for (const worldbookName of binding.additional.map(normalizeEntryName).filter(isManagedCharacterWorldbookName)) {
    try {
      return { worldbookName, entries: await getWorldbook(worldbookName) };
    } catch (error) {
      emitManagedWorldbookWarnLog('读取附加月历球世界书失败，已跳过该 worldbook', {
        worldbookName,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return null;
}

function createMissingCharacterWorldbookTargetError(): Error {
  return new Error('未能找到可写入的角色世界书。请先在角色卡绑定或导入世界书，再重装月历基础规则。');
}

export async function ensureCalendarCharacterPrimaryWorldbook(): Promise<{
  worldbookName: string;
  entries: WorldbookEntry[];
  created: boolean;
  targetMode: Extract<ManagedWorldbookTargetMode, 'character_primary' | 'character_additional'>;
}> {
  const binding = readCurrentCharacterWorldbookBinding();
  const primary = normalizeEntryName(binding.primary);
  if (primary) {
    try {
      const entries = await getWorldbook(primary);
      return { worldbookName: primary, entries, created: false, targetMode: 'character_primary' };
    } catch (error) {
      emitManagedWorldbookWarnLog('当前角色主世界书绑定无效，将检查已有附加月历球世界书', {
        worldbookName: primary,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const existingAdditional = await findReadableManagedAdditionalWorldbook(binding);
    if (existingAdditional) {
      return { ...existingAdditional, created: false, targetMode: 'character_additional' };
    }
    throw createMissingCharacterWorldbookTargetError();
  }

  const existingAdditional = await findReadableManagedAdditionalWorldbook(binding);
  if (existingAdditional) {
    return { ...existingAdditional, created: false, targetMode: 'character_additional' };
  }
  throw createMissingCharacterWorldbookTargetError();
}

async function readCharacterPrimaryWorldbookEntries(): Promise<{
  worldbookName: string;
  entries: WorldbookEntry[];
  targetMode: Extract<ManagedWorldbookTargetMode, 'character_primary'>;
}> {
  const binding = readCurrentCharacterWorldbookBinding();
  const primary = normalizeEntryName(binding.primary);
  if (!primary) {
    throw new Error('当前角色主世界书未绑定。请先在角色卡绑定或导入世界书，再安装月历 MVU 规则。');
  }

  try {
    return { worldbookName: primary, entries: await getWorldbook(primary), targetMode: 'character_primary' };
  } catch (error) {
    throw new Error(
      `当前角色主世界书无法读取：${primary}。请先在角色卡绑定或导入世界书，再安装月历 MVU 规则。`,
    );
  }
}

async function readWorldbookEntriesByName(
  worldbookName: string,
  options?: { createIfMissing?: boolean },
): Promise<{ worldbookName: string; entries: WorldbookEntry[]; existed: boolean }> {
  const normalizedWorldbookName = normalizeEntryName(worldbookName);
  if (!normalizedWorldbookName) {
    throw new Error('世界书名称不能为空');
  }

  try {
    const entries = await getWorldbook(normalizedWorldbookName);
    return {
      worldbookName: normalizedWorldbookName,
      entries,
      existed: true,
    };
  } catch (error) {
    if (!options?.createIfMissing) {
      throw error;
    }

    await createOrReplaceWorldbook(normalizedWorldbookName, []);
    const entries = await getWorldbook(normalizedWorldbookName);
    return {
      worldbookName: normalizedWorldbookName,
      entries,
      existed: false,
    };
  }
}

function assertManagedEntriesWritten(entries: WorldbookEntry[], desiredEntries: ManagedWorldbookEntrySeed[]): void {
  const missingNames: string[] = [];
  const emptyContentNames: string[] = [];

  desiredEntries.forEach(entry => {
    const entryName = normalizeEntryName(entry.name);
    const actual = readManagedEntry(entries, entryName);
    if (!actual) {
      missingNames.push(entryName);
      return;
    }
    if (!String(actual.content ?? '').trim()) {
      emptyContentNames.push(entryName);
    }
  });

  if (missingNames.length > 0 || emptyContentNames.length > 0) {
    throw new Error(
      [
        missingNames.length > 0 ? `缺失托管条目: ${missingNames.join(', ')}` : '',
        emptyContentNames.length > 0 ? `托管条目正文为空: ${emptyContentNames.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join('；'),
    );
  }
}

async function upsertManagedEntriesToTargetWorldbook(args: {
  worldbookName: string;
  entries: WorldbookEntry[];
  syncDiagnostics: boolean;
}): Promise<EnsureCalendarManagedWorldbookEntriesResult> {
  const { worldbookName, entries, syncDiagnostics } = args;
  const desiredEntries = buildManagedWorldbookEntries();
  const desiredEntryNames = new Set(desiredEntries.map(entry => normalizeEntryName(entry.name)));
  const existingExpectedMap = new Map(
    entries
      .filter(entry => desiredEntryNames.has(normalizeEntryName(entry.name)))
      .map(entry => [normalizeEntryName(entry.name), entry]),
  );
  const existingExpectedCount = entries.filter(entry => desiredEntryNames.has(normalizeEntryName(entry.name))).length;
  const missingEntries = desiredEntries.filter(entry => !existingExpectedMap.has(normalizeEntryName(entry.name)));
  const hasDuplicateManagedEntries = existingExpectedCount > existingExpectedMap.size;
  const outdatedEntries = desiredEntries.filter(entry => {
    const entryName = normalizeEntryName(entry.name);
    const existingEntry = existingExpectedMap.get(entryName);
    if (!existingEntry) {
      return true;
    }
    return (
      String(existingEntry.content ?? '').trim() !== String(entry.content ?? '').trim() ||
      String(existingEntry.extra?.version ?? '') !== CALENDAR_MANAGED_WORLDBOOK_VERSION
    );
  });

  await updateWorldbookWith(worldbookName, currentEntries => {
    const currentExpectedMap = new Map(
      currentEntries
        .filter(entry => desiredEntryNames.has(normalizeEntryName(entry.name)))
        .map(entry => [normalizeEntryName(entry.name), entry]),
    );
    const unmanagedEntries = currentEntries.filter(
      entry => !isManagedWorldbookEntry(entry) && !desiredEntryNames.has(normalizeEntryName(entry.name)),
    );
    const nextManagedEntries = desiredEntries
      .map(entry => {
        const entryName = normalizeEntryName(entry.name);
        const existingManagedEntry = currentExpectedMap.get(entryName);
        return mergeManagedEntry(existingManagedEntry, entry);
      })
      .filter((entry): entry is ManagedWorldbookEntrySeed => Boolean(entry));

    return [...unmanagedEntries, ...nextManagedEntries];
  });

  const refreshedEntries = await getWorldbook(worldbookName);
  assertManagedEntriesWritten(refreshedEntries, desiredEntries);
  const updated = outdatedEntries.length > 0 || hasDuplicateManagedEntries;

  if (syncDiagnostics) {
    syncEntryDiagnostics(refreshedEntries, worldbookName);
    diagnostics.existsInRegistry = readAvailableWorldbookNames().includes(worldbookName);
    diagnostics.foundByScript = true;
    diagnostics.createdDuringEnsure = missingEntries.length > 0;
    diagnostics.updatedDuringEnsure = updated;
    diagnostics.lastEnsureSucceeded = true;
    diagnostics.connectivity = diagnostics.allManagedEntriesPresent ? 'ready' : 'missing';
    resetDiagnosticsError();
  }

  return {
    name: worldbookName,
    created: missingEntries.length > 0,
    updated,
  };
}

async function findAvailableWorldbookWithExpectedEntries(): Promise<{
  worldbookName: string;
  entries: WorldbookEntry[];
  targetMode: ManagedWorldbookTargetMode;
} | null> {
  const activeTargets = readManagedWorldbookSearchChain();
  const storedTarget = readStoredManagedWorldbookTargetName();
  if (storedTarget && !activeTargets.some(target => target.worldbookName === storedTarget)) {
    writeStoredManagedWorldbookTargetName('');
  }

  for (const target of activeTargets) {
    try {
      const entries = await getWorldbook(target.worldbookName);
      const hasAllExpectedEntries = hasExpectedManagedEntries(entries);
      if (hasAllExpectedEntries) {
        return { ...target, entries };
      }
    } catch (error) {
      emitManagedWorldbookWarnLog('检查可用 worldbook 后端条目失败，已跳过该 worldbook', {
        worldbookName: target.worldbookName,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return null;
}

async function upsertManagedEntries(): Promise<EnsureCalendarManagedWorldbookEntriesResult> {
  diagnostics.managementEnabled = isManagementEnabled();
  const existing = await findAvailableWorldbookWithExpectedEntries();
  if (existing) {
    const result = await upsertManagedEntriesToTargetWorldbook({
      worldbookName: existing.worldbookName,
      entries: existing.entries,
      syncDiagnostics: true,
    });
    return {
      ...result,
      targetMode: existing.targetMode,
    };
  }

  setManagementEnabled(true);
  const { worldbookName, entries, targetMode } = await readCharacterPrimaryWorldbookEntries();
  const result = await upsertManagedEntriesToTargetWorldbook({
    worldbookName,
    entries,
    syncDiagnostics: true,
  });
  return { ...result, targetMode };
}

async function refreshDiagnosticsFromCharacterWorldbook(): Promise<void> {
  diagnostics.managementEnabled = isManagementEnabled();
  const existing = await findAvailableWorldbookWithExpectedEntries();
  diagnostics.worldbookName = existing?.worldbookName ?? readManagedWorldbookTargetName().worldbookName;
  diagnostics.existsInRegistry =
    Boolean(diagnostics.worldbookName) && readAvailableWorldbookNames().includes(diagnostics.worldbookName);

  if (!diagnostics.worldbookName || !diagnostics.existsInRegistry) {
    diagnostics.foundByScript = false;
    diagnostics.entryCount = 0;
    diagnostics.hasMetaEntry = false;
    diagnostics.hasUpdateRulesEntry = false;
    diagnostics.hasVariableListEntry = false;
    diagnostics.managedEntryCount = 0;
    diagnostics.allManagedEntriesPresent = false;
    diagnostics.connectivity = 'missing';
    return;
  }

  const entries = existing?.entries ?? (await getWorldbook(diagnostics.worldbookName));
  diagnostics.foundByScript = true;
  syncEntryDiagnostics(entries, diagnostics.worldbookName);
  diagnostics.connectivity =
    diagnostics.managementEnabled && diagnostics.allManagedEntriesPresent ? 'ready' : 'missing';
}

export function getCalendarManagedWorldbookDiagnostics(): CalendarManagedWorldbookDiagnostics {
  return { ...diagnostics };
}

export async function refreshCalendarManagedWorldbookDiagnostics(): Promise<void> {
  diagnostics.connectivity = 'checking';
  diagnostics.lastEnsureAt = nowIso();
  diagnostics.createdDuringEnsure = false;
  diagnostics.updatedDuringEnsure = false;
  diagnostics.lastEnsureSucceeded = false;
  resetDiagnosticsError();

  try {
    await refreshDiagnosticsFromCharacterWorldbook();
    await refreshCalendarManagedWorldbookSourceDiagnostics();
    diagnostics.lastEnsureSucceeded = true;
  } catch (error) {
    diagnostics.connectivity = 'error';
    diagnostics.lastEnsureSucceeded = false;
    setDiagnosticsError(error);
    emitManagedWorldbookWarnLog('刷新 worldbook runtime 基础设施诊断失败', {
      worldbookName: diagnostics.worldbookName,
      lastError: diagnostics.lastError,
    });
    throw error;
  }
}

export async function syncCalendarManagedCharacterEntries(): Promise<EnsureCalendarManagedWorldbookEntriesResult> {
  diagnostics.connectivity = 'checking';
  diagnostics.lastEnsureAt = nowIso();
  diagnostics.createdDuringEnsure = false;
  diagnostics.updatedDuringEnsure = false;
  diagnostics.lastEnsureSucceeded = false;
  diagnostics.foundByScript = false;
  resetDiagnosticsError();

  try {
    const result = await upsertManagedEntries();
    emitManagedWorldbookDebugLog('角色主 worldbook runtime 基础设施条目同步完成', {
      worldbookName: result.name,
      created: result.created,
      updated: result.updated,
      managementEnabled: diagnostics.managementEnabled,
      managedEntryCount: diagnostics.managedEntryCount,
      expectedManagedEntryCount: diagnostics.expectedManagedEntryCount,
    });
    return result;
  } catch (error) {
    diagnostics.connectivity = 'error';
    diagnostics.lastEnsureSucceeded = false;
    diagnostics.foundByScript = false;
    setDiagnosticsError(error);
    emitManagedWorldbookWarnLog('同步角色主 worldbook runtime 基础设施条目失败', {
      worldbookName: diagnostics.worldbookName,
      lastError: diagnostics.lastError,
    });
    throw error;
  }
}

export async function uninstallCalendarManagedWorldbookEntries(): Promise<{
  worldbookName: string;
  removedCount: number;
}> {
  const existing = await findAvailableWorldbookWithExpectedEntries();
  if (!existing) {
    throw new Error('当前角色世界书、聊天世界书和已启用全局世界书中都没有找到脚本基础规则');
  }
  const worldbookName = existing.worldbookName;

  const beforeEntries = existing.entries;
  const removedCount = beforeEntries.filter(entry => isManagedWorldbookEntry(entry)).length;
  await deleteWorldbookEntries(worldbookName, entry => isManagedWorldbookEntry(entry));
  setManagementEnabled(true);
  await refreshDiagnosticsFromCharacterWorldbook();
  diagnostics.lastEnsureSucceeded = true;
  diagnostics.updatedDuringEnsure = removedCount > 0;
  diagnostics.createdDuringEnsure = false;
  diagnostics.connectivity = 'missing';
  resetDiagnosticsError();
  emitManagedWorldbookDebugLog('已从当前后端目标 worldbook 卸载脚本 runtime 基础设施条目', {
    worldbookName,
    removedCount,
  });

  if (readStoredManagedWorldbookTargetName() === worldbookName) {
    writeStoredManagedWorldbookTargetName('');
  }

  return {
    worldbookName,
    removedCount,
  };
}

export async function installCalendarManagedWorldbookEntries(): Promise<EnsureCalendarManagedWorldbookEntriesResult> {
  diagnostics.lastImportTriggered = true;
  diagnostics.lastImportAt = nowIso();
  diagnostics.connectivity = 'checking';
  setManagementEnabled(true);
  emitManagedWorldbookDebugLog('收到手动导入角色主 worldbook runtime 基础设施条目请求', {
    worldbookName: readManagedWorldbookTargetName().worldbookName,
  });

  try {
    diagnostics.lastEnsureAt = nowIso();
    diagnostics.createdDuringEnsure = false;
    diagnostics.updatedDuringEnsure = false;
    diagnostics.lastEnsureSucceeded = false;
    resetDiagnosticsError();
    const result = await upsertManagedEntries();
    diagnostics.connectivity = 'recreated';
    diagnostics.createdDuringEnsure = result.created;
    diagnostics.updatedDuringEnsure = result.updated;
    diagnostics.lastEnsureSucceeded = true;
    await refreshCalendarManagedWorldbookSourceDiagnostics();
    return result;
  } catch (error) {
    diagnostics.connectivity = 'error';
    diagnostics.lastEnsureSucceeded = false;
    setDiagnosticsError(error);
    emitManagedWorldbookWarnLog('手动导入角色主 worldbook runtime 基础设施条目失败', {
      worldbookName: diagnostics.worldbookName,
      lastError: diagnostics.lastError,
    });
    throw error;
  }
}

export async function installCalendarManagedEntriesToExternalWorldbook(
  worldbookName: string,
  options: InstallCalendarManagedEntriesToExternalWorldbookOptions = {},
): Promise<EnsureCalendarManagedWorldbookEntriesResult> {
  const {
    worldbookName: targetWorldbookName,
    entries,
    existed,
  } = await readWorldbookEntriesByName(worldbookName, {
    createIfMissing: true,
  });

  if (!options.candidateIds) {
    const result = await upsertManagedEntriesToTargetWorldbook({
      worldbookName: targetWorldbookName,
      entries,
      syncDiagnostics: false,
    });
    emitManagedWorldbookDebugLog(
      existed ? '已更新外部 worldbook runtime 基础设施条目' : '已创建外部 worldbook 并写入 runtime 基础设施条目',
      {
        worldbookName: targetWorldbookName,
        created: result.created,
        updated: result.updated,
      },
    );
    return result;
  }

  writeStoredManagedWorldbookTargetName(targetWorldbookName);
  const selectedIds = new Set(options.candidateIds.map(id => normalizeEntryName(id)).filter(Boolean));
  const candidatesResult = await listCalendarWorldbookMoveCandidates();
  const selectedCandidates = candidatesResult.candidates.filter(candidate => selectedIds.has(candidate.id));
  if (selectedCandidates.length === 0) {
    throw new Error('没有选择任何要搬运的世界书条目');
  }

  await updateWorldbookWith(targetWorldbookName, currentEntries => {
    const nextEntries = [...currentEntries];
    const findIndexByName = (name: string): number =>
      nextEntries.findIndex(entry => normalizeEntryName(entry.name) === normalizeEntryName(name));

    selectedCandidates.forEach(candidate => {
      const seed = cloneMoveCandidateEntry(candidate);
      const existingIndex = findIndexByName(candidate.entryName);
      if (existingIndex >= 0) {
        nextEntries[existingIndex] = mergeTransferredEntry(nextEntries[existingIndex], seed) as WorldbookEntry;
        return;
      }
      nextEntries.push(seed as WorldbookEntry);
    });

    return nextEntries;
  });

  let removedSourceCount = 0;
  const sourceRemovalPlan = planSourceEntryRemovals({
    removeFromSource: Boolean(options.removeFromSource),
    targetWorldbookName,
    candidates: selectedCandidates,
  });
  for (const removal of sourceRemovalPlan) {
    const entryNames = new Set(removal.entryNames);
    const result = await deleteWorldbookEntries(removal.sourceWorldbookName, entry =>
      entryNames.has(normalizeEntryName(entry.name)),
    );
    removedSourceCount += result.deleted_entries.length;
  }

  const refreshedEntries = await getWorldbook(targetWorldbookName);
  const updated = selectedCandidates.some(candidate =>
    refreshedEntries.some(entry => normalizeEntryName(entry.name) === normalizeEntryName(candidate.entryName)),
  );

  emitManagedWorldbookDebugLog(existed ? '已搬运条目到外部 worldbook' : '已创建外部 worldbook 并搬运条目', {
    worldbookName: targetWorldbookName,
    movedCount: selectedCandidates.length,
    removedSourceCount,
  });

  return {
    name: targetWorldbookName,
    created: !existed,
    updated,
    movedCount: selectedCandidates.length,
    removedSourceCount,
    targetMode: 'stored_external',
  };
}

export async function ensureCalendarManagedWorldbookEntries(): Promise<EnsureCalendarManagedWorldbookEntriesResult> {
  diagnostics.connectivity = 'checking';
  diagnostics.lastEnsureAt = nowIso();
  diagnostics.createdDuringEnsure = false;
  diagnostics.updatedDuringEnsure = false;
  diagnostics.lastEnsureSucceeded = false;
  resetDiagnosticsError();

  try {
    const result = await syncCalendarManagedCharacterEntries();
    diagnostics.connectivity =
      diagnostics.managementEnabled && diagnostics.allManagedEntriesPresent ? 'ready' : 'missing';
    await refreshCalendarManagedWorldbookSourceDiagnostics();
    return result;
  } catch (error) {
    diagnostics.connectivity = 'error';
    diagnostics.lastEnsureSucceeded = false;
    diagnostics.foundByScript = false;
    setDiagnosticsError(error);
    emitManagedWorldbookWarnLog('角色主 worldbook runtime 基础设施检查失败', {
      worldbookName: diagnostics.worldbookName,
      lastError: diagnostics.lastError,
    });
    throw error;
  }
}
