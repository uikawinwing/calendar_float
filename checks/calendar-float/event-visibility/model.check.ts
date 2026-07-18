/* eslint-disable import-x/no-nodejs-modules -- These checks execute under Node.js. */
import assert from 'node:assert/strict';

import {
  sanitizeRawEvent,
  sanitizeReminderLeadDays,
  sanitizeVisibility,
} from '../../../src/calendar-float/event-normalizer';

for (const value of ['玩家与LLM', '仅玩家', '仅LLM', '完全不显示'] as const) {
  assert.equal(sanitizeVisibility(value), value);
}
assert.equal(sanitizeVisibility('unknown'), '玩家与LLM');
assert.equal(sanitizeReminderLeadDays(undefined), 0);
assert.equal(sanitizeReminderLeadDays(-2), 0);
assert.equal(sanitizeReminderLeadDays(3.9), 3);
assert.equal(sanitizeRawEvent({ 标题: '暗雷', 提前提醒天数: 4, 可见性: '完全不显示' }).提前提醒天数, 4);

console.log('event-visibility/model.check.ts OK');
