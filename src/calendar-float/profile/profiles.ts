import defaults from './fate-poem-defaults.json';
import type { CalendarProfile } from './types';

// 旧索引没有配置字段时的兼容数据；运行中的世界书索引可覆盖这些默认值。
export const FATE_POEM_CALENDAR_PROFILE: CalendarProfile = {
  id: 'fate-poem',
  label: '命定之诗',
  developerMode: false,
  ...defaults,
  visual: { ...defaults.visual, festivalMarkerPresetId: 'fate-poem' },
  addons: ['dlc_ellia'],
};
