import type { CalendarProfile } from './types';

export const FATE_POEM_CALENDAR_PROFILE: CalendarProfile = {
  id: 'fate-poem',
  label: '命定之诗',
  developerMode: false,
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
  visual: {
    festivalMarkerPresetId: 'fate-poem',
  },
  addons: ['dlc_ellia'],
};
