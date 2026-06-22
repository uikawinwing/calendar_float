import {
  CALENDAR_VARIABLE_LIST_ENTRY_DISPLAY_NAME,
  type CalendarManagedWorldbookDiagnostics,
} from '../../worldbook-manager';

export type ManagedWorldbookDialogMode =
  | 'menu'
  | 'confirm-uninstall'
  | 'confirm-reinstall'
  | 'export-external';

export interface ConnectivityButtonCopy {
  text: string;
  title: string;
}

export interface PickerNameModel {
  name: string;
  hidden: boolean;
  selected: boolean;
}

export function buildManagedWorldbookSummaryLines(diagnostics: CalendarManagedWorldbookDiagnostics): string[] {
  const canUseDiagnosticWorldbook = Boolean(diagnostics.worldbookName && diagnostics.existsInRegistry);
  const formatLocation = (entryLabel: string, found: boolean): string =>
    found && canUseDiagnosticWorldbook ? `${diagnostics.worldbookName}；条目：${entryLabel}` : '未找到';
  const reinstallTarget = canUseDiagnosticWorldbook ? diagnostics.worldbookName : '当前角色绑定世界书';
  return [
    `基础规则：${diagnostics.hasUpdateRulesEntry ? '已找到' : '未找到'}｜位置：${formatLocation('月历变量更新规则', diagnostics.hasUpdateRulesEntry)}`,
    `变量展示：${diagnostics.hasVariableListEntry ? '已找到' : '未找到'}｜位置：${formatLocation(CALENDAR_VARIABLE_LIST_ENTRY_DISPLAY_NAME, diagnostics.hasVariableListEntry)}`,
    `重装位置：${reinstallTarget}`,
  ];
}

export function getConnectivityButtonCopy(
  diagnostics: CalendarManagedWorldbookDiagnostics,
  args: { busy: boolean },
): ConnectivityButtonCopy {
  const installedText = `${diagnostics.managedEntryCount}/${diagnostics.expectedManagedEntryCount}`;
  const stateText =
    diagnostics.connectivity === 'checking'
      ? '正在检查 MVU 设定'
      : diagnostics.connectivity === 'error'
        ? `MVU 设定检查失败；当前 ${installedText}`
        : `检查 MVU 设定；当前 ${installedText}`;
  return {
    text: args.busy ? '检查中…' : 'MVU设定',
    title: stateText,
  };
}

export function filterWorldbookPickerNames(names: string[], keyword: string): PickerNameModel[] {
  const normalizedKeyword = String(keyword || '').trim().toLowerCase();
  return names
    .map(name => String(name || '').trim())
    .filter(Boolean)
    .map(name => {
      const lowerName = name.toLowerCase();
      return {
        name,
        hidden: Boolean(normalizedKeyword && !lowerName.includes(normalizedKeyword)),
        selected: Boolean(normalizedKeyword && lowerName.includes(normalizedKeyword)),
      };
    })
    .filter(model => !model.hidden);
}
