/* eslint-disable import-x/no-nodejs-modules -- These checks execute under Node.js. */
import assert from 'node:assert/strict';

import {
  isCalendarEventVisibleToLlm,
  isCalendarEventVisibleToPlayer,
} from '../../../src/calendar-float/event-visibility';
import { buildSuggestionSet } from '../../../src/calendar-float/storage/suggestions';
import type { CalendarVisibility } from '../../../src/calendar-float/types';

const event = (可见性: CalendarVisibility) => ({ 可见性 });

assert.equal(isCalendarEventVisibleToPlayer(event('玩家与LLM')), true);
assert.equal(isCalendarEventVisibleToPlayer(event('仅玩家')), true);
assert.equal(isCalendarEventVisibleToPlayer(event('仅LLM')), false);
assert.equal(isCalendarEventVisibleToPlayer(event('完全不显示')), false);

assert.equal(isCalendarEventVisibleToLlm(event('玩家与LLM')), true);
assert.equal(isCalendarEventVisibleToLlm(event('仅玩家')), false);
assert.equal(isCalendarEventVisibleToLlm(event('仅LLM')), true);
assert.equal(isCalendarEventVisibleToLlm(event('完全不显示')), false);

const suggestions = buildSuggestionSet({
  activeBuckets: {
    临时: {
      public_event: {
        标题: '公开事件',
        内容: '',
        时间: '2026-08-01 09:00',
        重复规则: '无',
        可见性: '玩家与LLM',
      },
      secret_event: {
        标题: '秘密地震',
        内容: '',
        时间: '2026-08-02 09:00',
        重复规则: '无',
        可见性: '完全不显示',
      },
    },
    重复: {},
  },
  archive: {
    completed: {},
    policy: { customTags: [] },
  } as never,
});
assert.equal(suggestions.titleCandidates.includes('公开事件'), true);
assert.equal(suggestions.titleCandidates.includes('秘密地震'), false);
assert.equal(suggestions.idCandidates.includes('secret_event'), false);

console.log('event-visibility/projection.check.ts OK');
