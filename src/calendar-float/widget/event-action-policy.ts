import { buildNoticeDecision, type WidgetConfirmDecision, type WidgetNoticeDecision } from './dialog-policy';

export function buildActiveDeleteDecision(args: { title: string }): WidgetConfirmDecision {
  return {
    kind: 'confirm',
    title: '移除事件',
    message: `确认移除事件「${args.title}」吗？\n普通事件会进入归档区；黑名单标签会直接清理。`,
    confirmLabel: '移除',
    cancelLabel: '取消',
    blocking: false,
  };
}

export function buildArchivePurgeDecision(args: { eventId: string }): WidgetConfirmDecision {
  return {
    kind: 'confirm',
    title: '彻底删除归档事件',
    message: `确认彻底删除归档事件「${args.eventId}」吗？`,
    confirmLabel: '彻底删除',
    cancelLabel: '取消',
    blocking: false,
  };
}

export function buildArchiveCleanupDecision(): WidgetConfirmDecision {
  return {
    kind: 'confirm',
    title: '清理归档事件',
    message: '确认清理所有命中黑名单标签的归档事件吗？收藏标签仍会被保留。',
    confirmLabel: '清理',
    cancelLabel: '取消',
    blocking: false,
  };
}

export function buildFavoriteProtectedNotice(action: 'delete' | 'purge' | 'complete'): WidgetNoticeDecision {
  const actionText = action === 'complete' ? '完成后移出' : action === 'purge' ? '彻底删除' : '删除';
  return buildNoticeDecision('warning', '收藏保护', `这个事件带有收藏标签，规则已阻止${actionText}。`);
}

export function buildInvalidColorNotice(): WidgetNoticeDecision {
  return buildNoticeDecision('error', '颜色格式无效', '请输入有效的 hex 颜色，例如 #dcecff。');
}

export function buildFormSaveFailureNotice(message: string): WidgetNoticeDecision {
  return buildNoticeDecision('error', '保存事件失败', message);
}

export function buildQuickInputMissingNotice(text: string): WidgetNoticeDecision {
  return buildNoticeDecision('error', '找不到酒馆输入框', `没有找到酒馆输入框，可手动输入：${text}`);
}

export function buildArchiveCleanupResultNotice(args: {
  purged: number;
  protectedCount: number;
}): WidgetNoticeDecision {
  return buildNoticeDecision(
    'success',
    '归档清理完成',
    `已清理 ${args.purged} 条归档事件。收藏保护跳过 ${args.protectedCount} 条。`,
  );
}
