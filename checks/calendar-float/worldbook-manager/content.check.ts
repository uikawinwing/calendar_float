import _ from 'lodash';
import {
  buildCalendarUpdateRulesEntryContent,
  buildCalendarVariableListEntryContent,
} from '../../../src/calendar-float/worldbook-manager/content';
import { applyCalendarProfileConfig } from '../../../src/calendar-float/profile';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function testVariableListUsesLatestMvuRuleTemplate(): void {
  const content = buildCalendarVariableListEntryContent();
  assert(content.includes('<calendar_variables_display>'), '变量展示条目应该包含 calendar_variables_display 包裹');
  assert(content.includes('const rootPath = "stat_data.事件.月历"'), '变量展示条目应该使用新版 mvu_rules 模板');
  assert(content.includes('YAML.stringify(displayOutput'), '变量展示条目应该输出清理后的 YAML');
  assert(
    content.includes("!['仅玩家', '完全不显示'].includes(String(_.get(event, '可见性', '')).trim())"),
    '变量展示条目应隐藏仅玩家和完全隐藏事件',
  );
}

function testWorldbookRulesFollowConfiguredRuntimePathsAndExamples(): void {
  applyCalendarProfileConfig({
    profileHint: 'fate-poem',
    config: {
      paths: { eventRoot: "stat_data.诗歌'世界.月历" },
      worldbook: {
        updateRuleTimeExamples: ['星历120年-3月8日'],
        forbiddenRepeatTimeExamples: ['星历120年-3月8日'],
      },
    },
  });

  const variableList = buildCalendarVariableListEntryContent();
  const rules = buildCalendarUpdateRulesEntryContent();
  assert(
    variableList.includes(`const rootPath = ${JSON.stringify("stat_data.诗歌'世界.月历")}`),
    '变量展示条目应安全使用索引配置的事件根路径',
  );
  assert(rules.includes('`星历120年-3月8日`'), '时间示例应来自索引配置');
  assert(rules.includes('“星历120年-3月8日”'), '重复事件示例应来自索引配置');
  applyCalendarProfileConfig({ profileHint: 'fate-poem' });
}

function testUpdateRulesUseLatestMvuRuleTemplate(): void {
  const content = buildCalendarUpdateRulesEntryContent();
  assert(!content.includes('未经{{user}}明确同意'), '更新规则不应重复系统核心负责的确认限制');
  assert(!content.includes('只有{{user}}明确要求记录'), '更新规则不应保留无系统核心时的确认限制');
  assert(content.includes('新增事件前必须先检查现有事件是否已经记录同一事项'), '更新规则应该包含新版查重约束');
  assert(
    content.includes('若事件已发生、取消或不再具有提醒价值，应移除该事件'),
    '更新规则应该允许无提醒价值事件被移除',
  );
  assert(content.includes('标签不是任务类型'), '更新规则应该说明月历标签不能替代任务类型');
  assert(content.includes('不得仅因为任务列表中存在“主线/支线/限时”等任务就新增月历事件'), '更新规则应该隔离任务列表和月历事件');
  assert(content.includes("可见性: optional['玩家与LLM' | '完全不显示']"), '更新规则只应暴露 LLM 可写的可见性');
  assert(content.includes('LLM不得主动写入或改为`仅LLM`'), '更新规则应该把仅 LLM 状态保留给脚本');
}

function testHiddenTagsStayOutOfModelRules(): void {
  const content = buildCalendarUpdateRulesEntryContent();
  const expression = [...content.matchAll(/<%- ([\s\S]*?) %>/g)]
    .map(match => match[1])
    .find(value => value.includes('collectBucketTags'));
  assert(expression, '更新规则应包含可执行的标签展示表达式');
  const calendar = {
    临时: {
      default: { 标签: ['缺省公开标签'] },
      playerAndLlm: { 标签: ['玩家与LLM标签'], 可见性: '玩家与LLM' },
      llmOnly: { 标签: ['仅LLM标签'], 可见性: '仅LLM' },
      playerOnly: { 标签: ['仅玩家标签'], 可见性: '仅玩家' },
      hidden: { 标签: ['完全隐藏标签'], 可见性: '完全不显示' },
    },
    重复: { hidden: { 标签: ['隐藏重复标签'], 可见性: '完全不显示' } },
  };
  const mirrorOnlyTags = ['UI镜像标签'];
  const getvar = (path: string) =>
    path === 'stat_data.事件.月历'
      ? calendar
      : path === 'calendar_float_store.runtime.known_tags'
        ? mirrorOnlyTags
        : [];
  const rendered: string = new Function('getvar', '_', `return ${expression}`)(getvar, _);
  assert(rendered.includes('缺省公开标签'), '缺少可见性字段时应按公开标签处理');
  assert(rendered.includes('玩家与LLM标签'), '玩家与 LLM 可见标签应提供给模型');
  assert(rendered.includes('仅LLM标签'), '仅 LLM 可见标签应提供给模型');
  assert(
    !rendered.includes('仅玩家标签') && !rendered.includes('完全隐藏标签') && !rendered.includes('隐藏重复标签'),
    '仅玩家与完全不显示标签不得进入模型规则',
  );
  assert(!rendered.includes(mirrorOnlyTags[0]), '模型规则不得从 UI known_tags 镜像注入标签');
}

function main(): void {
  testVariableListUsesLatestMvuRuleTemplate();
  testWorldbookRulesFollowConfiguredRuntimePathsAndExamples();
  testUpdateRulesUseLatestMvuRuleTemplate();
  testHiddenTagsStayOutOfModelRules();
  console.log('content.check.ts OK');
}

main();
