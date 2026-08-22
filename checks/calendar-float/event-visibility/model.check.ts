/* eslint-disable import-x/no-nodejs-modules -- These checks execute under Node.js. */
import assert from 'node:assert/strict';

import { sanitizeRawEvent, sanitizeReminderLeadDays } from '../../../src/calendar-float/event-normalizer';

assert.equal(sanitizeReminderLeadDays(undefined), 0);
assert.equal(sanitizeReminderLeadDays(-2), 0);
assert.equal(sanitizeReminderLeadDays(3.9), 3);

const publicEvent = sanitizeRawEvent({ 标题: '公开事项', 时间: '2026-08-01 09:00' });
assert.equal(publicEvent.显示, true);
assert.equal(publicEvent.提醒, true);

const legacyHidden = sanitizeRawEvent({
  标题: '旧隐藏事项',
  时间: '2026-08-02 09:00',
  提前提醒天数: 4,
  可见性: '完全不显示',
});
assert.equal(legacyHidden.提前提醒天数, 4);
assert.equal(legacyHidden.显示, false);
assert.equal(legacyHidden.提醒, true);

const legacyPlayerOnly = sanitizeRawEvent({
  标题: '旧仅玩家事项',
  时间: '2026-08-03 09:00',
  可见性: '仅玩家',
});
assert.equal(legacyPlayerOnly.显示, true);
assert.equal(legacyPlayerOnly.提醒, false);

console.log('event-visibility/model.check.ts OK');
