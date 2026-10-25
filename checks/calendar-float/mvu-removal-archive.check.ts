import _ from 'lodash';
import { CHAT_ARCHIVE_PATH } from '../../src/calendar-float/constants';
import { syncArchiveFromMvuVariableDiff } from '../../src/calendar-float/storage';

const chatVariables: Record<string, any> = {};

(globalThis as any).getVariables = (option: { type: string }) => {
  if (option.type !== 'chat') {
    return {};
  }
  return _.cloneDeep(chatVariables);
};

(globalThis as any).replaceVariables = (nextVariables: Record<string, any>, option: { type: string }) => {
  if (option.type === 'chat') {
    Object.keys(chatVariables).forEach(key => delete chatVariables[key]);
    Object.assign(chatVariables, _.cloneDeep(nextVariables));
  }
};

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function testRemovedMvuCalendarEventIsArchived(): void {
  const oldVariables = {
    stat_data: {
      世界: {
        时间: '复兴纪元488年-6月27日-星期六',
      },
      事件: {
        月历: {
          临时: {
            trial_day: {
              标题: '试炼日',
              内容: '一次性提醒',
              时间: '复兴纪元488年-6月27日-星期六',
              重要度: '重要且紧急',
              标签: ['主线'],
            },
          },
          重复: {
            weekly_trial: {
              标题: '每周试炼',
              内容: '每周重复提醒',
              时间: '每周三',
              重复规则: '每周',
              重要度: '不重要不紧急',
              标签: ['课程'],
            },
          },
        },
      },
    },
  };
  const newVariables = _.cloneDeep(oldVariables);
  _.unset(newVariables, 'stat_data.事件.月历.临时.trial_day');
  _.unset(newVariables, 'stat_data.事件.月历.重复.weekly_trial');

  const result = syncArchiveFromMvuVariableDiff({
    oldVariables,
    newVariables,
    completedAt: String(_.get(newVariables, 'stat_data.世界.时间')),
  });

  assert(result.archived === 2, 'LLM 同时移除临时与重复事件时应该归档 2 条');
  assert(_.has(chatVariables, `${CHAT_ARCHIVE_PATH}.completed.trial_day`), '归档区应该保存被移除的事件');
  assert(
    _.get(chatVariables, `${CHAT_ARCHIVE_PATH}.completed.weekly_trial.type`) === '重复',
    '重复事件归档时应该保留事件类型',
  );
  assert(
    _.get(chatVariables, `${CHAT_ARCHIVE_PATH}.completed.trial_day.completed_at`) === '复兴纪元488年-6月27日-星期六',
    '归档事件应该记录当前世界时间',
  );
}

function main(): void {
  testRemovedMvuCalendarEventIsArchived();
  console.log('mvu-removal-archive.check.ts OK');
}

main();
