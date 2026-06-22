import {
  buildManagedWorldbookInstallFailureToast,
  buildMissingManagedWorldbookRulesDiagnostic,
  createManagedWorldbookDiagnosticsState,
  shouldNotifyMissingRulesOnce,
} from '../../../src/calendar-float/worldbook-manager/diagnostics';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function testMissingRulesDiagnosticUsesToastOnlyError(): void {
  const diagnostic = buildMissingManagedWorldbookRulesDiagnostic({
    worldbookName: '命定之诗',
    missingRules: ['月历变量更新规则', '当前月历内容展示'],
  });

  assert(diagnostic.level === 'error', '缺失规则诊断应该是 error 级别');
  assert(diagnostic.delivery === 'toast', '缺失规则诊断应该只走 toast 提醒');
  assert(diagnostic.blocking === false, '缺失规则诊断不应该阻塞窗口');
  assert(!('confirmText' in diagnostic), '缺失规则诊断不应该携带 confirm 文案');
}

function testMissingRulesNotificationIsDedupedByKey(): void {
  const state = createManagedWorldbookDiagnosticsState();

  assert(shouldNotifyMissingRulesOnce(state, 'rules-missing:命定之诗') === true, '第一次缺规则应该提醒');
  assert(shouldNotifyMissingRulesOnce(state, 'rules-missing:命定之诗') === false, '同一缺规则提醒不应该重复弹出');
  assert(shouldNotifyMissingRulesOnce(state, 'rules-missing:聊天世界书') === true, '不同世界书缺规则应该允许提醒一次');
}

function testMissingRulesDiagnosticKeepsReadableMvuMessage(): void {
  const diagnostic = buildMissingManagedWorldbookRulesDiagnostic({
    worldbookName: '命定之诗',
    missingRules: ['月历变量更新规则'],
  });

  assert(diagnostic.message.includes('找不到日历 MVU 规则'), '提示应该保留用户可读的日历 MVU 规则缺失信息');
  assert(diagnostic.message.includes('命定之诗'), '提示应该包含目标世界书名称');
  assert(diagnostic.message.includes('月历变量更新规则'), '提示应该列出缺失规则');
}

function testInstallFailureToastDoesNotAskForConfirmation(): void {
  const toast = buildManagedWorldbookInstallFailureToast(new Error('当前角色主世界书未绑定'), {
    worldbookName: '当前角色绑定世界书',
  });

  assert(toast.level === 'error', '安装失败 toast 应该是 error 级别');
  assert(toast.delivery === 'toast', '安装失败应该返回 toast 通知对象');
  assert(toast.blocking === false, '安装失败提醒不应该阻塞窗口');
  assert(toast.message.includes('当前角色主世界书未绑定'), '安装失败 toast 应该保留原始错误信息');
}

function main(): void {
  testMissingRulesDiagnosticUsesToastOnlyError();
  testMissingRulesNotificationIsDedupedByKey();
  testMissingRulesDiagnosticKeepsReadableMvuMessage();
  testInstallFailureToastDoesNotAskForConfirmation();
  console.log('diagnostics.check.ts OK');
}

main();
