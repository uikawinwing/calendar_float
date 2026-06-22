import { AGENDA_SORT_MODES, CALENDAR_BUCKET_TYPES, FESTIVAL_SCOPE_MODES, SIDEBAR_TABS } from '../../../../src/calendar-float/widget/event-binding/types';

function assertJsonEqual(name: string, actual: unknown, expected: unknown): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${name}: expected ${expectedJson}, got ${actualJson}`);
  }
}

assertJsonEqual('sidebar tabs stay stable', SIDEBAR_TABS, ['detail', 'form', 'archive']);
assertJsonEqual('agenda sort modes stay stable', AGENDA_SORT_MODES, [
  'date-asc',
  'date-desc',
  'title-asc',
  'festival-first',
  'event-first',
]);
assertJsonEqual('calendar bucket types stay stable', CALENDAR_BUCKET_TYPES, ['临时', '重复']);
assertJsonEqual('festival scope modes stay stable', FESTIVAL_SCOPE_MODES, ['all', 'local', 'none']);

console.log('widget/event-binding/types.check.ts OK');
