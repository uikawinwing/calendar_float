export type WidgetNoticeLevel = 'success' | 'info' | 'warning' | 'error';

export interface WidgetNoticeDecision {
  kind: 'notice';
  level: WidgetNoticeLevel;
  title: string;
  message: string;
  delivery: 'toast';
  blocking: false;
}

export interface WidgetConfirmDecision {
  kind: 'confirm';
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  blocking: false;
}

export type WidgetDecision = WidgetNoticeDecision | WidgetConfirmDecision;

export function buildNoticeDecision(level: WidgetNoticeLevel, title: string, message: string): WidgetNoticeDecision {
  return {
    kind: 'notice',
    level,
    title,
    message,
    delivery: 'toast',
    blocking: false,
  };
}

export function buildDirtyEditorCloseDecision(): WidgetConfirmDecision {
  return {
    kind: 'confirm',
    title: '未保存的固定事件索引',
    message: '你还没有保存到世界书，离开后这些编辑会丢失。确定要离开吗？',
    confirmLabel: '离开',
    cancelLabel: '继续编辑',
    blocking: false,
  };
}

export function buildDirtyEditorReloadDecision(): WidgetConfirmDecision {
  return {
    kind: 'confirm',
    title: '重新读取固定事件索引',
    message: '你还没有保存到世界书，重新读取会丢失当前编辑。确定要重新读取吗？',
    confirmLabel: '重新读取',
    cancelLabel: '继续编辑',
    blocking: false,
  };
}
