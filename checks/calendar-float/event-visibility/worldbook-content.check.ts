/* eslint-disable import-x/no-nodejs-modules -- These checks execute under Node.js. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  buildCalendarUpdateRulesEntryContent,
  buildCalendarVariableListEntryContent,
} from '../../../src/calendar-float/worldbook-manager/content';

const display = buildCalendarVariableListEntryContent();
assert.match(display, /rawCalendar\.临时/); // legacy read compatibility
assert.match(display, /事件: \{ 月历:/);
assert.match(display, /'显示'/);
assert.match(display, /'提醒'/);
assert.doesNotMatch(display, /'关联'/);
assert.doesNotMatch(display, /'类型'/);
assert.doesNotMatch(display, /'完成后'/);
assert.doesNotMatch(display, /'重要度'/);

const rules = buildCalendarUpdateRulesEntryContent();
const staticRules = readFileSync('src/calendar-float/mvu_rules/月历变量更新规则.txt', 'utf8');

for (const content of [rules, staticRules]) {
  assert.match(content, /月历只记录.*明确时间锚点/);
  assert.match(content, /月历UI显示与到时提醒/);
  assert.match(content, /不负责保存任务进度、世界事件状态、新闻内容或剧情结果/);
  assert.match(content, /不得为了填充月历自行创造未来事件/);
  assert.match(content, /固定事项.*不重复写入变量/);
  assert.match(content, /一次性与重复事项使用同一个collection/);
  assert.match(content, /显示: optional\[boolean\]/);
  assert.match(content, /提醒: optional\[boolean\]/);
  assert.match(content, /显示.*只表示不显示在玩家月历UI/);
  assert.match(content, /到达预定时间只表示时间条件成立/);
  assert.doesNotMatch(content, /关联: optional/);
  assert.doesNotMatch(content, /可见性: optional/);
  assert.doesNotMatch(content, /仅LLM/);
  assert.doesNotMatch(content, /回忆/);
  assert.doesNotMatch(content, /归档/);
  assert.doesNotMatch(content, /完成后/);
  assert.doesNotMatch(content, /重要度/);
  assert.doesNotMatch(content, /隐藏剧情/);
  assert.doesNotMatch(content, /^ {2}事件\.月历\.临时:/m);
  assert.doesNotMatch(content, /^ {2}事件\.月历\.重复:/m);
}

console.log('event-visibility/worldbook-content.check.ts OK');
