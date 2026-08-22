/* eslint-disable import-x/no-nodejs-modules -- This check executes under Node.js. */
import assert from 'node:assert/strict';

import {
  flattenCalendarBuckets,
  sanitizeActiveCalendarBuckets,
  sanitizeRawEvent,
} from '../../src/calendar-float/event-normalizer';

const hiddenLegacy = sanitizeRawEvent({
  标题: '旧暗雷',
  内容: '旧资料',
  时间: '复兴纪元488年-7月1日-23:00',
  可见性: '完全不显示',
  类型: '事件',
  完成后: '转回忆',
  重要度: '重要且紧急',
  关联: { 类型: '世界事件', ID: 'legacy_event' },
});
assert.equal(hiddenLegacy.显示, false);
assert.equal(hiddenLegacy.提醒, true);

const playerOnlyLegacy = sanitizeRawEvent({
  标题: '旧玩家事项',
  时间: '复兴纪元488年-7月2日-09:00',
  可见性: '仅玩家',
});
assert.equal(playerOnlyLegacy.显示, true);
assert.equal(playerOnlyLegacy.提醒, false);

const migrated = sanitizeActiveCalendarBuckets({
  临时: {
    legacy_hidden: {
      标题: '旧暗雷',
      时间: '复兴纪元488年-7月1日-23:00',
      可见性: '完全不显示',
      类型: '事件',
      完成后: '转回忆',
    },
  },
  重复: {
    weekly_class: {
      标题: '旧周课',
      时间: '每周三-14:00',
      重复规则分类: '每周',
    },
  },
});
const persisted = flattenCalendarBuckets(migrated);

assert.deepEqual(Object.keys(persisted).sort(), ['legacy_hidden', 'weekly_class']);
assert.equal(persisted.legacy_hidden.显示, false);
assert.equal(persisted.legacy_hidden.提醒, true);
assert.equal(persisted.weekly_class.重复规则, '每周');
for (const event of Object.values(persisted)) {
  assert.equal('可见性' in event, false);
  assert.equal('类型' in event, false);
  assert.equal('完成后' in event, false);
  assert.equal('重要度' in event, false);
  assert.equal('关联' in event, false);
}

console.log('calendar-migration.check.ts OK');
