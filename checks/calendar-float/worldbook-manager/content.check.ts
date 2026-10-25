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
  assert(content.includes("String(_.get(event, '可见性', '')).trim() !== '仅玩家'"), '变量展示条目应隐藏仅玩家事件');
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
  assert(
    content.includes('未经{{user}}明确同意，不得自动新增、修改或删除月历事件'),
    '更新规则应该包含新版用户确认约束',
  );
  assert(content.includes('新增事件前必须先检查现有事件是否已经记录同一事项'), '更新规则应该包含新版查重约束');
  assert(
    content.includes('若事件已发生、取消或不再具有提醒价值，应移除该事件'),
    '更新规则应该允许无提醒价值事件被移除',
  );
  assert(content.includes('标签不是任务类型'), '更新规则应该说明月历标签不能替代任务类型');
  assert(
    content.includes('不得因为任务列表中存在“主线/支线/限时”等任务而自动新增月历事件'),
    '更新规则应该隔离任务列表和月历事件',
  );
}

function testPlayerOnlyTagsStayOutOfModelRules(): void {
  const content = buildCalendarUpdateRulesEntryContent();
  const expression = [...content.matchAll(/<%- ([\s\S]*?) %>/g)]
    .map(match => match[1])
    .find(value => value.includes('collectBucketTags'));
  assert(expression, '更新规则应包含可执行的标签展示表达式');
  const calendar = {
    临时: {
      public: { 标签: ['公开标签'] },
      private: { 标签: ['私人标签'], 可见性: '仅玩家' },
    },
    重复: { private: { 标签: ['私人重复标签'], 可见性: '仅玩家' } },
  };
  const getvar = (path: string) => (path === 'stat_data.事件.月历' ? calendar : ['私人标签', '私人重复标签']);
  const rendered: string = new Function('getvar', '_', `return ${expression}`)(getvar, _);
  assert(rendered.includes('公开标签'), '旧事件的缺省可见标签应继续提供给模型');
  assert(
    !rendered.includes('私人标签') && !rendered.includes('私人重复标签'),
    '仅玩家标签和 UI 镜像标签不得进入模型规则',
  );
}

function main(): void {
  testVariableListUsesLatestMvuRuleTemplate();
  testWorldbookRulesFollowConfiguredRuntimePathsAndExamples();
  testUpdateRulesUseLatestMvuRuleTemplate();
  testPlayerOnlyTagsStayOutOfModelRules();
  console.log('content.check.ts OK');
}

main();
