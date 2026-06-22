export type ManagedWorldbookTargetMode =
  | 'character_primary'
  | 'character_additional'
  | 'chat_bound'
  | 'global'
  | 'stored_external';

export interface ManagedWorldbookBindingSnapshot {
  primary: string | null;
  additional: string[];
}

export interface ManagedWorldbookTargetCandidate {
  worldbookName: string;
  targetMode: ManagedWorldbookTargetMode;
}

export function normalizeManagedWorldbookName(name: unknown): string {
  return String(name || '').trim();
}

export function dedupeManagedWorldbookNames(names: string[]): string[] {
  return names
    .map(normalizeManagedWorldbookName)
    .filter(Boolean)
    .filter((name, index, list) => list.indexOf(name) === index);
}

export function buildManagedWorldbookSearchChain(args: {
  primary: string | null;
  additional: string[];
  chat: string;
  globals: string[];
}): ManagedWorldbookTargetCandidate[] {
  const seen = new Set<string>();
  return [
    { worldbookName: normalizeManagedWorldbookName(args.primary), targetMode: 'character_primary' as const },
    ...args.additional.map(worldbookName => ({
      worldbookName: normalizeManagedWorldbookName(worldbookName),
      targetMode: 'character_additional' as const,
    })),
    { worldbookName: normalizeManagedWorldbookName(args.chat), targetMode: 'chat_bound' as const },
    ...args.globals.map(worldbookName => ({
      worldbookName: normalizeManagedWorldbookName(worldbookName),
      targetMode: 'global' as const,
    })),
  ].filter(item => {
    if (!item.worldbookName || seen.has(item.worldbookName)) {
      return false;
    }
    seen.add(item.worldbookName);
    return true;
  });
}

export function resolveManagedWorldbookTarget(args: {
  storedTarget: string;
  chain: ManagedWorldbookTargetCandidate[];
}): ManagedWorldbookTargetCandidate & { clearedStoredTarget: boolean } {
  const storedTarget = normalizeManagedWorldbookName(args.storedTarget);
  if (storedTarget) {
    const activeTarget = args.chain.find(item => item.worldbookName === storedTarget);
    if (activeTarget) {
      return { ...activeTarget, clearedStoredTarget: false };
    }
  }

  return {
    worldbookName: args.chain.find(item => item.targetMode === 'character_primary')?.worldbookName ?? '',
    targetMode: 'character_primary',
    clearedStoredTarget: Boolean(storedTarget),
  };
}
