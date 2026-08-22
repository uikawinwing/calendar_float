/* eslint-disable import-x/no-nodejs-modules -- This check executes under Node.js. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { buildCalendarTimedReminderPrompt } from '../../src/calendar-float/event-reminder';

const prompt = buildCalendarTimedReminderPrompt([
  {
    id: 'exam_01',
    title: '月末测验',
    timeText: '复兴纪元488年-6月28日-09:00',
    daysUntil: 0,
    status: 'due',
  },
]);

assert.match(prompt, /<calendar_reminder>/);
assert.match(prompt, /预定时间已到：月末测验/);
assert.match(prompt, /不代表对应任务、事件或剧情结果已经发生/);
assert.match(prompt, /不要仅因本提醒自行判定任务完成\/失败或强制推进剧情/);
assert.doesNotMatch(prompt, /仅LLM|完全不显示|转回忆|归档/);

const scanner = readFileSync('src/calendar-float/runtime-worldbook/scanner.ts', 'utf8');
assert.match(scanner, /evaluateCalendarTimedReminders\(monthAliases\)/);
assert.match(scanner, /normalizeCalendarMonthAliasList/);
assert.doesNotMatch(scanner, /promoteDueSealedCalendarEvents/);
assert.doesNotMatch(scanner, /event-visibility-scheduler/);

console.log('event-reminder.check.ts OK');
