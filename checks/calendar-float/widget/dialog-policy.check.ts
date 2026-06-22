import {
  buildDirtyEditorCloseDecision,
  buildDirtyEditorReloadDecision,
  buildNoticeDecision,
  type WidgetDecision,
} from '../../../src/calendar-float/widget/dialog-policy';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertConfirm(decision: WidgetDecision, expectedMessagePart: string): void {
  assert(decision.kind === 'confirm', '应该返回确认决策');
  assert(decision.blocking === false, '确认应该走自定义 UI，不应该是 native blocking');
  assert(decision.message.includes(expectedMessagePart), `确认文案应该包含 ${expectedMessagePart}`);
}

function testDirtyEditorCloseRequiresCustomConfirm(): void {
  assertConfirm(buildDirtyEditorCloseDecision(), '离开后这些编辑会丢失');
}

function testDirtyEditorReloadRequiresCustomConfirm(): void {
  assertConfirm(buildDirtyEditorReloadDecision(), '重新读取会丢失当前编辑');
}

function testNoticeDecisionIsNonBlocking(): void {
  const decision = buildNoticeDecision('error', '保存失败', '缺少标题');
  assert(decision.kind === 'notice', '普通错误应该返回 notice');
  assert(decision.level === 'error', '应该保留错误等级');
  assert(decision.delivery === 'toast', '普通错误应该走 toast');
  assert(decision.blocking === false, '普通错误不应该阻塞窗口');
  assert(decision.message === '缺少标题', '应该保留原始错误信息');
}

function main(): void {
  testDirtyEditorCloseRequiresCustomConfirm();
  testDirtyEditorReloadRequiresCustomConfirm();
  testNoticeDecisionIsNonBlocking();
  console.log('widget/dialog-policy.check.ts OK');
}

main();
