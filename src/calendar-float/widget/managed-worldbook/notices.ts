export interface WidgetToastNotice {
  level: 'success' | 'info' | 'warning' | 'error';
  delivery: 'toast';
  blocking: false;
  title: string;
  message: string;
}

export type ExternalMoveValidationResult =
  | { ok: true; targetName: string; candidateIds?: string[] }
  | { ok: false; notice: WidgetToastNotice };

function normalizeText(value: unknown): string {
  return String(value || '').trim();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error ?? '未知错误');
}

export function validateExternalMoveRequest(args: {
  targetName: string;
  candidateIds: string[];
}): ExternalMoveValidationResult {
  const targetName = normalizeText(args.targetName);
  const candidateIds = args.candidateIds.map(normalizeText).filter(Boolean);
  if (!targetName) {
    return {
      ok: false,
      notice: {
        level: 'error',
        delivery: 'toast',
        blocking: false,
        title: '月历球提醒',
        message: '请选择或输入目标世界书名称',
      },
    };
  }
  if (candidateIds.length === 0) {
    return { ok: true, targetName };
  }
  return { ok: true, targetName, candidateIds };
}

export function buildExternalMoveSuccessNotice(args: {
  worldbookName: string;
  movedCount: number;
  removedSourceCount: number;
  removeFromSource: boolean;
}): WidgetToastNotice {
  const deletedText = args.removeFromSource ? `\n已从原来源删除 ${args.removedSourceCount} 个条目` : '';
  return {
    level: 'success',
    delivery: 'toast',
    blocking: false,
    title: '搬运完成',
    message: `已搬运 ${args.movedCount} 个条目到世界书\n世界书：${args.worldbookName}${deletedText}`,
  };
}

export function buildManagedWorldbookActionErrorNotice(title: string, error: unknown): WidgetToastNotice {
  return {
    level: 'error',
    delivery: 'toast',
    blocking: false,
    title,
    message: `${title}：${errorMessage(error)}`,
  };
}

export function buildExternalMoveFailureNotice(error: unknown): WidgetToastNotice {
  return buildManagedWorldbookActionErrorNotice('搬运世界书条目失败', error);
}

export function buildManagedWorldbookUninstallSuccessNotice(args: {
  worldbookName: string;
  removedCount: number;
}): WidgetToastNotice {
  return {
    level: 'success',
    delivery: 'toast',
    blocking: false,
    title: '基础规则已卸载',
    message: `已卸载 ${args.removedCount} 条基础规则\n世界书：${args.worldbookName}`,
  };
}

export function buildManagedWorldbookReinstallSuccessNotice(args: { worldbookName: string }): WidgetToastNotice {
  return {
    level: 'success',
    delivery: 'toast',
    blocking: false,
    title: '基础规则已重装',
    message: `已重装基础规则，两条规则已恢复默认内容\n世界书：${args.worldbookName}`,
  };
}
