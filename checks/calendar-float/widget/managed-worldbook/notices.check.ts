import {
  buildExternalMoveFailureNotice,
  buildExternalMoveSuccessNotice,
  buildManagedWorldbookReinstallSuccessNotice,
  buildManagedWorldbookActionErrorNotice,
  buildManagedWorldbookUninstallSuccessNotice,
  validateExternalMoveRequest,
} from '../../../../src/calendar-float/widget/managed-worldbook/notices';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function testExternalMoveValidationRejectsMissingTargetWithoutBlocking(): void {
  const result = validateExternalMoveRequest({ targetName: '', candidateIds: ['a'] });

  assert(result.ok === false, '缺目标世界书时应该验证失败');
  assert(result.notice.level === 'error', '缺目标世界书应该是 error');
  assert(result.notice.delivery === 'toast', '缺目标世界书应该只走 toast');
  assert(result.notice.blocking === false, '缺目标世界书不应该阻塞窗口');
  assert(result.notice.message.includes('请选择或输入目标世界书名称'), '错误文案应该可读');
}

function testExternalMoveValidationAllowsInfrastructureOnlyMove(): void {
  const result = validateExternalMoveRequest({ targetName: '目标世界书', candidateIds: [] });

  assert(result.ok === true, '没有候选条目时应该允许只搬基础规则');
  assert(result.targetName === '目标世界书', '应该保留目标世界书名称');
  assert(!('candidateIds' in result), '只搬基础规则时不应该传空 candidateIds 给 manager');
}

function testExternalMoveSuccessNoticeSummarizesMoveAndDeletion(): void {
  const notice = buildExternalMoveSuccessNotice({
    worldbookName: '目标世界书',
    movedCount: 3,
    removedSourceCount: 2,
    removeFromSource: true,
  });

  assert(notice.level === 'success', '搬运成功应该是 success');
  assert(notice.delivery === 'toast', '搬运成功不应该用 alert');
  assert(notice.blocking === false, '搬运成功不应该阻塞窗口');
  assert(notice.message.includes('已搬运 3 个条目'), '成功提示应该包含搬运数量');
  assert(notice.message.includes('已从原来源删除 2 个条目'), '成功提示应该包含删除来源数量');
}

function testActionErrorNoticeKeepsOriginalErrorMessage(): void {
  const notice = buildManagedWorldbookActionErrorNotice('重装基础规则失败', new Error('当前角色主世界书未绑定'));

  assert(notice.level === 'error', '失败提示应该是 error');
  assert(notice.delivery === 'toast', '失败提示不应该用 alert');
  assert(notice.blocking === false, '失败提示不应该阻塞窗口');
  assert(notice.message.includes('当前角色主世界书未绑定'), '失败提示应该保留原始错误信息');
}

function testExternalMoveFailureNoticeKeepsDialogContext(): void {
  const notice = buildExternalMoveFailureNotice(new Error('没有选择任何要搬运的世界书条目'));

  assert(notice.level === 'error', '搬运失败应该是 error');
  assert(notice.title.includes('搬运'), '搬运失败标题应该说明上下文');
  assert(notice.message.includes('没有选择任何要搬运的世界书条目'), '搬运失败应该保留错误信息');
}

function testUninstallSuccessNoticeDoesNotBlock(): void {
  const notice = buildManagedWorldbookUninstallSuccessNotice({ worldbookName: '命定之诗', removedCount: 2 });

  assert(notice.level === 'success', '卸载成功应该是 success');
  assert(notice.delivery === 'toast', '卸载成功不应该用 alert');
  assert(notice.blocking === false, '卸载成功不应该阻塞窗口');
  assert(notice.message.includes('已卸载 2 条基础规则'), '卸载提示应该包含数量');
}

function testReinstallSuccessNoticeDoesNotBlock(): void {
  const notice = buildManagedWorldbookReinstallSuccessNotice({ worldbookName: '命定之诗' });

  assert(notice.level === 'success', '重装成功应该是 success');
  assert(notice.delivery === 'toast', '重装成功不应该用 alert');
  assert(notice.blocking === false, '重装成功不应该阻塞窗口');
  assert(notice.message.includes('两条规则已恢复默认内容'), '重装提示应该说明规则恢复');
}

function main(): void {
  testExternalMoveValidationRejectsMissingTargetWithoutBlocking();
  testExternalMoveValidationAllowsInfrastructureOnlyMove();
  testExternalMoveSuccessNoticeSummarizesMoveAndDeletion();
  testActionErrorNoticeKeepsOriginalErrorMessage();
  testExternalMoveFailureNoticeKeepsDialogContext();
  testUninstallSuccessNoticeDoesNotBlock();
  testReinstallSuccessNoticeDoesNotBlock();
  console.log('notices.check.ts OK');
}

main();
