import { mapActiveCalendarEvent, mapArchivedCalendarEvent } from '../../../src/calendar-float/runtime-dataset/active-events';
import type { ArchivedCalendarEvent, RawCalendarEvent } from '../../../src/calendar-float/types';

(globalThis as unknown as { getVariables: (target: unknown) => Record<string, unknown> }).getVariables = () => ({});

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function testMapActiveCalendarEventKeepsTagsRangeAndColor(): void {
  const raw: RawCalendarEvent = {
    标题: '训练',
    内容: '准备 #主线',
    时间: '1000-01-02',
    结束时间: '1000-01-03',
    重复规则: '无',
    标签: ['手动标签'],
  };
  const event = mapActiveCalendarEvent('临时', 'event_1', raw, { year: 1000, month: 1, day: 1 });

  assert(event.source === 'active', 'active event source 应该保持 active');
  assert(event.id === 'event_1', 'active event id 应该保持输入 id');
  assert(event.title === '训练', 'active event title 应该来自 raw 标题');
  assert(event.tags.includes('手动标签'), 'active event 应该保留 raw 标签');
  assert(event.tags.includes('主线'), 'active event 应该收集内容中的 hashtag');
  assert(event.range?.start.day === 2 && event.range.end.day === 3, 'active event 应该解析日期范围');
}

function testMapArchivedCalendarEventKeepsArchiveMetadata(): void {
  const raw: ArchivedCalendarEvent = {
    id: 'old_1',
    type: '临时',
    标题: '旧事件',
    内容: '已结束',
    时间: '1000-02-01',
    重复规则: '无',
    tags: ['归档'],
    archived_at: '1000-02-02',
    completed_at: '1000-02-01',
    preserved_for_player: true,
  };
  const event = mapArchivedCalendarEvent('old_1', raw, { year: 1000, month: 2, day: 1 });

  assert(event.source === 'archive', 'archived event source 应该保持 archive');
  assert(event.metadata.archived_at === '1000-02-02', 'archived event 应该保留 archived_at metadata');
  assert(event.metadata.completed_at === '1000-02-01', 'archived event 应该保留 completed_at metadata');
  assert(event.range?.start.month === 2 && event.range.start.day === 1, 'archived event 应该解析日期');
}

function main(): void {
  testMapActiveCalendarEventKeepsTagsRangeAndColor();
  testMapArchivedCalendarEventKeepsArchiveMetadata();
  console.log('runtime-dataset/active-events.check.ts OK');
}

main();
