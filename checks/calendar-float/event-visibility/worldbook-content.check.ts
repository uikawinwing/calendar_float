/* eslint-disable import-x/no-nodejs-modules -- These checks execute under Node.js. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  buildCalendarUpdateRulesEntryContent,
  buildCalendarVariableListEntryContent,
} from '../../../src/calendar-float/worldbook-manager/content';

const display = buildCalendarVariableListEntryContent();
assert.match(display, /仅玩家.*完全不显示/);
assert.match(display, /'可见性'/);

const rules = buildCalendarUpdateRulesEntryContent();
const staticRules = readFileSync('src/calendar-float/mvu_rules/月历变量更新规则.txt', 'utf8');

for (const content of [rules, staticRules]) {
  assert.doesNotMatch(content, /只有\{\{user\}\}明确要求记录/);
  assert.doesNotMatch(content, /未经\{\{user\}\}明确同意/);
  assert.doesNotMatch(content, /系统核心名|systemCore/);
  assert.doesNotMatch(content, /^隐藏剧情事件:/m);
  assert.doesNotMatch(content, /^ {2}可见性:/m);
  assert.doesNotMatch(content, /仅玩家/);
  assert.match(content, /提前提醒天数: optional\[number\]/);
  assert.match(content, /可见性: optional\['玩家与LLM' \| '完全不显示'\]/);
  assert.match(content, /普通事件.*默认.*`玩家与LLM`/);
  assert.match(content, /隐藏剧情事件.*`完全不显示`/);
  assert.match(content, /LLM不得主动写入或改为`仅LLM`/);
  assert.match(content, /只能由月历脚本.*`完全不显示`.*`仅LLM`/);
  assert.match(content, /看到`可见性: 仅LLM`/);
  assert.match(content, /不得因为到达提醒时间就自动公开给玩家/);
  assert.doesNotMatch(content, /<hidden_event>/);
  assert.doesNotMatch(content, /remind_before_days|hidden_event_vault/);

  const tempRulesStart = content.indexOf('  事件.月历.临时:');
  const repeatRulesStart = content.indexOf('  事件.月历.重复:');
  assert.ok(tempRulesStart >= 0 && repeatRulesStart > tempRulesStart);
  const tempRules = content.slice(tempRulesStart, repeatRulesStart);
  assert.match(tempRules, /隐藏剧情事件/);
  assert.match(tempRules, /`完全不显示`/);
  assert.match(tempRules, /`仅LLM`/);
}

console.log('event-visibility/worldbook-content.check.ts OK');
