import {
  buildActiveDeleteDecision,
  buildArchivePurgeDecision,
  buildArchiveCleanupDecision,
  buildArchiveCleanupResultNotice,
  buildFavoriteProtectedNotice,
  buildFormSaveFailureNotice,
  buildInvalidColorNotice,
  buildQuickInputMissingNotice,
} from '../../../src/calendar-float/widget/event-action-policy';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function testActiveDeleteDecisionRequiresCustomConfirm(): void {
  const decision = buildActiveDeleteDecision({ title: '创生之日' });
  assert(decision.kind === 'confirm', '删除 active event 应该确认');
  assert(decision.blocking === false, '确认不应该用 native blocking dialog');
  assert(decision.message.includes('创生之日'), '确认文案应该包含事件标题');
  assert(decision.message.includes('普通事件会进入归档区'), '确认文案应该保留归档说明');
}

function testArchivePurgeDecisionRequiresCustomConfirm(): void {
  const decision = buildArchivePurgeDecision({ eventId: 'archived-1' });
  assert(decision.kind === 'confirm', '彻底删除归档事件应该确认');
  assert(decision.message.includes('archived-1'), '确认文案应该包含归档事件 id');
}

function testArchiveCleanupDecisionRequiresCustomConfirm(): void {
  const decision = buildArchiveCleanupDecision();
  assert(decision.kind === 'confirm', '黑名单归档清理应该确认');
  assert(decision.blocking === false, '黑名单归档清理不应该用 native confirm');
  assert(decision.message.includes('收藏标签仍会被保留'), '确认文案应该保留收藏保护说明');
}

function testProtectedNoticeIsToast(): void {
  const notice = buildFavoriteProtectedNotice('delete');
  assert(notice.kind === 'notice', '收藏保护应该是 notice');
  assert(notice.delivery === 'toast', '收藏保护不应该 alert');
  assert(notice.level === 'warning', '收藏保护应该是 warning');
}

function testInvalidColorNoticeIsToast(): void {
  const notice = buildInvalidColorNotice();
  assert(notice.kind === 'notice', '颜色错误应该是 notice');
  assert(notice.level === 'error', '颜色错误应该是 error');
  assert(notice.message.includes('#dcecff'), '颜色错误应该包含示例');
}

function testFormSaveFailureNoticeKeepsMessage(): void {
  const notice = buildFormSaveFailureNotice('重复事件时间无效');
  assert(notice.kind === 'notice', '表单保存失败应该是 notice');
  assert(notice.message === '重复事件时间无效', '应该保留服务返回的错误');
}

function testQuickInputMissingNoticeKeepsManualText(): void {
  const notice = buildQuickInputMissingNotice('测试文本');
  assert(notice.kind === 'notice', '快捷输入失败应该是 notice');
  assert(notice.level === 'error', '快捷输入失败应该是 error');
  assert(notice.message.includes('测试文本'), '应该保留可手动输入的文本');
}

function testArchiveCleanupResultNoticeReportsCounts(): void {
  const notice = buildArchiveCleanupResultNotice({ purged: 2, protectedCount: 1 });
  assert(notice.kind === 'notice', '清理结果应该是 notice');
  assert(notice.level === 'success', '清理结果应该是 success');
  assert(notice.message.includes('2'), '清理结果应该包含删除数');
  assert(notice.message.includes('1'), '清理结果应该包含收藏保护数');
}

function main(): void {
  testActiveDeleteDecisionRequiresCustomConfirm();
  testArchivePurgeDecisionRequiresCustomConfirm();
  testArchiveCleanupDecisionRequiresCustomConfirm();
  testProtectedNoticeIsToast();
  testInvalidColorNoticeIsToast();
  testFormSaveFailureNoticeKeepsMessage();
  testQuickInputMissingNoticeKeepsManualText();
  testArchiveCleanupResultNoticeReportsCounts();
  console.log('widget/event-action-policy.check.ts OK');
}

main();
