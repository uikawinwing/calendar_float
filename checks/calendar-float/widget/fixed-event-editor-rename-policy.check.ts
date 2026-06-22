import {
  buildFixedEventEditorRenameDecision,
  getFixedEventEditorRenameScopeLabel,
} from '../../../src/calendar-float/widget/fixed-event-editor-rename-policy';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function testScopeLabelsAreUserFacing(): void {
  assert(getFixedEventEditorRenameScopeLabel('group') === '分组', 'group label 应该是分组');
  assert(getFixedEventEditorRenameScopeLabel('event') === '固定事件', 'event label 应该是固定事件');
  assert(getFixedEventEditorRenameScopeLabel('material') === '补充资料', 'material label 应该是补充资料');
}

function testRenameDecisionIsTextInputNotNativePrompt(): void {
  const decision = buildFixedEventEditorRenameDecision({ scope: 'event', oldId: 'event_001' });
  assert(decision.kind === 'input', '重命名应该使用 widget input decision');
  assert(decision.blocking === false, '重命名不应该使用 native blocking prompt');
  assert(decision.title === '重命名固定事件 id', '标题应该包含 scope label');
  assert(decision.initialValue === 'event_001', '应该保留旧 id 作为初始值');
  assert(decision.confirmLabel === '重命名', '确认按钮应该明确');
  assert(decision.cancelLabel === '取消', '取消按钮应该明确');
}

function main(): void {
  testScopeLabelsAreUserFacing();
  testRenameDecisionIsTextInputNotNativePrompt();
  console.log('widget/fixed-event-editor-rename-policy.check.ts OK');
}

main();
