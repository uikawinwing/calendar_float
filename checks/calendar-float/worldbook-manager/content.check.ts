import { buildCalendarUpdateRulesEntryContent, buildCalendarVariableListEntryContent } from '../../../src/calendar-float/worldbook-manager/content';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function testVariableListUsesLatestMvuRuleTemplate(): void {
  const content = buildCalendarVariableListEntryContent();
  assert(content.includes('<calendar_variables_display>'), '变量展示条目应该包含 calendar_variables_display 包裹');
  assert(content.includes("const rootPath = 'stat_data.事件.月历'"), '变量展示条目应该使用新版 mvu_rules 模板');
  assert(content.includes('YAML.stringify(displayOutput'), '变量展示条目应该输出清理后的 YAML');
}

function testUpdateRulesUseLatestMvuRuleTemplate(): void {
  const content = buildCalendarUpdateRulesEntryContent();
  assert(!content.includes('未经{{user}}明确同意'), '更新规则不应重复系统核心负责的确认限制');
  assert(!content.includes('只有{{user}}明确要求记录'), '更新规则不应保留无系统核心时的确认限制');
  assert(content.includes('新增事件前必须先检查现有事件是否已经记录同一事项'), '更新规则应该包含新版查重约束');
  assert(content.includes('若事件已发生、取消或不再具有提醒价值，应移除该事件'), '更新规则应该允许无提醒价值事件被移除');
  assert(content.includes('标签不是任务类型'), '更新规则应该说明月历标签不能替代任务类型');
  assert(content.includes('不得仅因为任务列表中存在“主线/支线/限时”等任务就新增月历事件'), '更新规则应该隔离任务列表和月历事件');
  assert(content.includes("可见性: optional['玩家与LLM' | '完全不显示']"), '更新规则只应暴露 LLM 可写的可见性');
  assert(content.includes('LLM不得主动写入或改为`仅LLM`'), '更新规则应该把仅 LLM 状态保留给脚本');
}

function main(): void {
  testVariableListUsesLatestMvuRuleTemplate();
  testUpdateRulesUseLatestMvuRuleTemplate();
  console.log('content.check.ts OK');
}

main();
