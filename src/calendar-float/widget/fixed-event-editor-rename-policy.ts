import type { WidgetDecision } from './dialog-policy';

export type FixedEventEditorRenameScope = 'group' | 'event' | 'material';

export interface WidgetInputDecision {
  kind: 'input';
  title: string;
  message: string;
  initialValue: string;
  confirmLabel: string;
  cancelLabel: string;
  blocking: false;
}

export function getFixedEventEditorRenameScopeLabel(scope: FixedEventEditorRenameScope): string {
  if (scope === 'group') {
    return '分组';
  }
  return scope === 'event' ? '固定事件' : '补充资料';
}

export function buildFixedEventEditorRenameDecision(args: {
  scope: FixedEventEditorRenameScope;
  oldId: string;
}): WidgetInputDecision {
  const label = getFixedEventEditorRenameScopeLabel(args.scope);
  return {
    kind: 'input',
    title: `重命名${label} id`,
    message: `请输入新的 ${label} id。相关引用会同步更新，保存前不会写入世界书。`,
    initialValue: args.oldId,
    confirmLabel: '重命名',
    cancelLabel: '取消',
    blocking: false,
  };
}

export type FixedEventEditorRenameDecision = WidgetDecision | WidgetInputDecision;
