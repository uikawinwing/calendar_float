import {
  resolveCalendarFestivalReminder,
  resolveCalendarFestivalStageReminder,
} from '../../../src/calendar-float/runtime-trigger-evaluator/reminders';
import type { CalendarRuntimeFestivalEntry } from '../../../src/calendar-float/runtime-worldbook/types';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const festival: CalendarRuntimeFestivalEntry = {
  id: 'disabled-festival',
  名称: '已禁用节庆提醒',
  开始: '06-05',
  结束: '06-05',
  提醒: {
    id: 'disabled-festival:reminder',
    名称: '提醒',
    启用: false,
    状态正文: { 未开始: '不应回退输出的正文' },
    元数据: { 提醒默认值: { 缺省模板: { 未开始: '不应命中默认提醒' } } },
  },
};

async function main(): Promise<void> {
  const context = { 当前日期: { year: 488, month: 6, day: 1 } };
  const reminder = await resolveCalendarFestivalReminder(festival, context);
  assert(reminder.正文 === '', '禁用的节庆提醒不应回退到正文或默认模板');
  assert(reminder.状态 === '未命中', '禁用的节庆提醒不应形成命中');

  const stageReminder = await resolveCalendarFestivalStageReminder(
    festival,
    {
      id: 'disabled-stage',
      名称: '禁用阶段',
      开始: '06-05',
      结束: '06-05',
      提醒: festival.提醒,
    },
    context,
  );
  assert(stageReminder.正文 === '', '禁用阶段提醒不应回退到正文或默认模板');
  assert(stageReminder.状态 === '未命中', '禁用阶段提醒不应形成命中');
  console.log('disabled-reminders.check.ts OK');
}

void main();
