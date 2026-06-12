import type { CalendarProfile } from './types';

export const GENERIC_CALENDAR_PROFILE: CalendarProfile = {
  id: 'generic',
  label: '通用月历',
  paths: {
    eventRoot: 'stat_data.事件.月历',
    tempEvents: 'stat_data.事件.月历.临时',
    repeatEvents: 'stat_data.事件.月历.重复',
    worldTime: 'stat_data.世界.时间',
    worldLocation: 'stat_data.世界.地点',
  },
  date: {
    eraNames: [],
  },
  worldbook: {
    variableDisplayTitle: '现有月历事件',
    updateRuleTimeExamples: ['完整世界时间（如 488年-6月5日-星期三-09:00）', '完整世界日期（如 488年-6月5日-星期三）', '月日锚点（如 6月5日）'],
    forbiddenRepeatTimeExamples: ['月底', '每隔几天', '488年-6月5日', '课程结束后'],
  },
  addons: [],
  detection: {
    characterNames: [],
    worldbookKeywords: [],
  },
};

export const FATE_POEM_CALENDAR_PROFILE: CalendarProfile = {
  id: 'fate-poem',
  label: '命定之诗',
  paths: {
    eventRoot: 'stat_data.事件.月历',
    tempEvents: 'stat_data.事件.月历.临时',
    repeatEvents: 'stat_data.事件.月历.重复',
    worldTime: 'stat_data.世界.时间',
    worldLocation: 'stat_data.世界.地点',
  },
  date: {
    eraNames: ['复兴纪元'],
  },
  worldbook: {
    variableDisplayTitle: '现有月历事件',
    updateRuleTimeExamples: ['复兴纪元488年-6月5日-星期三-09:00', '复兴纪元488年-6月5日-星期三', '6月5日'],
    forbiddenRepeatTimeExamples: ['月底', '每隔几天', '复兴纪元488年-6月5日', '课程结束后'],
  },
  addons: ['dlc_ellia'],
  detection: {
    characterNames: ['命定之诗'],
    worldbookKeywords: ['命定之诗'],
  },
};

export const CALENDAR_PROFILES: CalendarProfile[] = [GENERIC_CALENDAR_PROFILE, FATE_POEM_CALENDAR_PROFILE];
