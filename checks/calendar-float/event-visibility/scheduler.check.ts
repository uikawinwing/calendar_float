/* eslint-disable import-x/no-nodejs-modules -- These checks execute under Node.js. */
import assert from 'node:assert/strict';

import { promoteDueSealedEventsInBuckets } from '../../../src/calendar-float/event-visibility-scheduler';
import type { ActiveCalendarBuckets, RawCalendarEvent } from '../../../src/calendar-float/types';

function sealedEvent(overrides: Partial<RawCalendarEvent> = {}): RawCalendarEvent {
  return {
    标题: '应对突发地震',
    内容: '不能出现在警告里的秘密描述',
    时间: '2026-08-01 23:23',
    重复规则: '无',
    提前提醒天数: 3,
    可见性: '完全不显示',
    ...overrides,
  };
}

function buckets(event: RawCalendarEvent, repeatEvent?: RawCalendarEvent): ActiveCalendarBuckets {
  return {
    临时: { quake: event },
    重复: repeatEvent ? { repeat_quake: repeatEvent } : {},
  };
}

const sealed = promoteDueSealedEventsInBuckets(buckets(sealedEvent()), '2026-07-29 23:22');
assert.equal(sealed.buckets.临时.quake.可见性, '完全不显示');
assert.equal(sealed.changed, false);
assert.deepEqual(sealed.promotedIds, []);

const due = promoteDueSealedEventsInBuckets(buckets(sealedEvent()), '2026-07-29 23:23');
assert.equal(due.buckets.临时.quake.可见性, '仅LLM');
assert.equal(due.changed, true);
assert.deepEqual(due.promotedIds, ['quake']);

const zeroDay = promoteDueSealedEventsInBuckets(buckets(sealedEvent({ 提前提醒天数: 0 })), '2026-08-01 23:23');
assert.equal(zeroDay.buckets.临时.quake.可见性, '仅LLM');

const alreadyLlmOnly = promoteDueSealedEventsInBuckets(buckets(sealedEvent({ 可见性: '仅LLM' })), '2026-08-02 00:00');
assert.equal(alreadyLlmOnly.buckets.临时.quake.可见性, '仅LLM');
assert.equal(alreadyLlmOnly.changed, false);

const invalid = promoteDueSealedEventsInBuckets(buckets(sealedEvent({ 时间: '明天' })), '2026-08-02 00:00');
assert.equal(invalid.buckets.临时.quake.可见性, '完全不显示');
assert.deepEqual(invalid.warnings, ['隐藏月历事件 quake 的时间无法解析，已保持完全不显示']);
assert.doesNotMatch(invalid.warnings.join('\n'), /秘密描述/);

const repeated = promoteDueSealedEventsInBuckets(
  buckets(sealedEvent({ 可见性: '玩家与LLM' }), sealedEvent({ 时间: '每天' })),
  '2026-08-02 00:00',
);
assert.equal(repeated.buckets.重复.repeat_quake.可见性, '完全不显示');

const noSealedEvent = promoteDueSealedEventsInBuckets(buckets(sealedEvent({ 可见性: '玩家与LLM' })), '');
assert.deepEqual(noSealedEvent.warnings, []);

console.log('event-visibility/scheduler.check.ts OK');
