import {
  alarmClockIconSvg,
  augustineEmpireIconSvg,
  bagShoppingIconSvg,
  beastAllianceIconSvg,
  bolensArcaneIconSvg,
  bookIconSvg,
  calendarIconSvg,
  candyCaneIconSvg,
  champagneGlassesIconSvg,
  chessIconSvg,
  compassIconSvg,
  crownIconSvg,
  diamondIconSvg,
  dragonIconSvg,
  elvenCivilizationIconSvg,
  ferryIconSvg,
  fortIconSvg,
  ghostIconSvg,
  heartIconSvg,
  moonIconSvg,
  musicIconSvg,
  nordgardAllianceIconSvg,
  sahraFederationIconSvg,
  solentisKingdomIconSvg,
  suitcaseIconSvg,
  temperatureDownIconSvg,
  temperatureUpIconSvg,
  toriiGateIconSvg,
  triangleExclamationIconSvg,
  valenciaIconSvg,
  wingedHolyCityIconSvg,
} from '../festival-icons';
import type { CalendarFestivalMarkerPreset, CalendarFestivalMarkerPresetGroup } from '../festival-visual-types';

const FATE_POEM_COUNTRY_MARKER_PRESETS: CalendarFestivalMarkerPreset[] = [
  {
    iconSvg: solentisKingdomIconSvg,
    color: { background: '#b9ddff', text: '#075c9f', border: '#4aa8ff' },
    keywords: ['索伦蒂斯王国', '潮汐王座', '珍珠湾', '银帆城'],
  },
  {
    iconSvg: augustineEmpireIconSvg,
    color: { background: '#ffc3bb', text: '#8f1d1d', border: '#ff6f61' },
    keywords: ['奥古斯提姆帝国', '艾瑟嘉德'],
  },
  {
    iconSvg: nordgardAllianceIconSvg,
    color: { background: '#f8fbff', text: '#17324d', border: '#dcecff' },
    keywords: ['诺斯加德联盟', '凛风渡', '霜镜港', '白港', '白曜城', '斯卡尔公国', '诺德海姆公国', '乌尔芬公国', '维斯格拉德公国'],
  },
  {
    iconSvg: elvenCivilizationIconSvg,
    color: { background: '#bff5d5', text: '#0f6a3f', border: '#34d399' },
    keywords: ['精灵文明', '艾尔文海姆', '翡翠之心', '璀璨之心', '织阳林冠', '光辉之厅', '月咏幽谷', '翠梦乡之树'],
  },
  {
    iconSvg: wingedHolyCityIconSvg,
    color: { background: '#fff08a', text: '#7a5700', border: '#facc15' },
    keywords: ['翼民圣都', '翼民圣都梵尼亚', '圣都梵尼亚', '白石回廊', '圣羽', '圣翼'],
  },
  {
    iconSvg: sahraFederationIconSvg,
    color: { background: '#ffd18a', text: '#8a4600', border: '#fb923c' },
    keywords: ['萨赫拉联邦', '阿兹哈尔', '流沙', '金铎', '荣耀之冠'],
  },
  {
    iconSvg: bolensArcaneIconSvg,
    color: { background: '#b9e9ff', text: '#075985', border: '#38bdf8' },
    keywords: ['伯伦斯法环', '雾晶港', '雾晶学院', '法环'],
  },
  {
    iconSvg: beastAllianceIconSvg,
    color: { background: '#ffd0e4', text: '#8b315e', border: '#f472b6' },
    keywords: ['兽族联盟', '卡拉什利亚斯', '巡天王庭', '风信子城', '鼠族王国', '龙渊京', '蝾螈王朝'],
  },
  {
    iconSvg: valenciaIconSvg,
    color: { background: '#d7d2ff', text: '#4338ca', border: '#818cf8' },
    keywords: ['瓦伦蒂亚', '地牢', 'dungeon'],
  },
  {
    iconSvg: musicIconSvg,
    color: { background: '#dff4ff', text: '#09627a', border: '#38bdf8' },
    keywords: ['赛瑞利亚'],
  },
];

const FATE_POEM_THEME_MARKER_PRESETS: CalendarFestivalMarkerPreset[] = [
  {
    iconSvg: champagneGlassesIconSvg,
    color: { background: '#fff0c9', text: '#8a5a00', border: '#f2c55c' },
    keywords: ['创生', '新年', '岁首', '开年', '庆典', '欢庆', '宴', '酒', '麦酒', '丰饶宴', '欢宴', '开幕'],
  },
  {
    iconSvg: toriiGateIconSvg,
    color: { background: '#ffe1d8', text: '#9b2f18', border: '#f9735b' },
    keywords: ['神', '祭祀', '祈年', '祈愿', '祷', '圣灵', '神恩', '典礼', '仪式', '礼拜', '祈祷'],
  },
  {
    iconSvg: calendarIconSvg,
    color: { background: '#e8edf2', text: '#4d5c6b', border: '#bdc7d1' },
    keywords: ['纪念', '周年', '诞辰', '日期', '日历', '月历', '年历', '节气', '历法'],
  },
  {
    iconSvg: alarmClockIconSvg,
    color: { background: '#f1e6d8', text: '#73583c', border: '#d3bea6' },
    keywords: ['限时', '倒计时', '钟', '时钟', '准点', '期限', '时限', '提醒'],
  },
  {
    iconSvg: crownIconSvg,
    color: { background: '#fff0b8', text: '#895710', border: '#e8bf59' },
    keywords: ['女王', '皇后', '王后', '贵族', '王座', '冠', '盟约', '倾国', '倾城', '阿芙罗黛蒂', '美'],
  },
  {
    iconSvg: suitcaseIconSvg,
    color: { background: '#dff2f3', text: '#2d6f73', border: '#a7d4d7' },
    keywords: ['旅行', '旅客', '旅人', '旅途', '行囊', '远行', '远游', '出发'],
  },
  {
    iconSvg: compassIconSvg,
    color: { background: '#dcecff', text: '#305d97', border: '#a8c7ed' },
    keywords: ['探索', '远征', '巡礼', '航路', '航线', '导航', '地图', '罗盘', '启程'],
  },
  {
    iconSvg: heartIconSvg,
    color: { background: '#ffe1eb', text: '#9a3d61', border: '#efadc2' },
    keywords: ['恋', '爱', '情人', '约会', '婚', '蜜月', '心愿', '心动', '告白'],
  },
  {
    iconSvg: ferryIconSvg,
    color: { background: '#dff4ff', text: '#09627a', border: '#38bdf8' },
    keywords: ['渡', '船', '舟', '航船', '渡船', '渡口', '港航', '赛艇', '摸鱼', '飞天鱼'],
  },
  {
    iconSvg: chessIconSvg,
    color: { background: '#e5ddff', text: '#5440a6', border: '#9b87f5' },
    keywords: ['比赛', '大赛', '竞赛', '决赛', '盘口', '棋', '博弈', '冠军', '评审', '投票'],
  },
  {
    iconSvg: dragonIconSvg,
    color: { background: '#ffe3cf', text: '#9a4b20', border: '#efb186' },
    keywords: ['龙', '龙骑', '龙血', '龙渊京', '飞龙', '巨龙', '龙裔'],
  },
  {
    iconSvg: diamondIconSvg,
    color: { background: '#dff2f3', text: '#2d6f73', border: '#a7d4d7' },
    keywords: ['钻', '辉钻', '宝石', '珠宝', '珍珠', '水晶', '琉璃', '星环'],
  },
  {
    iconSvg: bagShoppingIconSvg,
    color: { background: '#ffe5bf', text: '#8a4a05', border: '#f59e0b' },
    keywords: ['市场', '大市', '集市', '商会', '贸易', '拍卖', '商行', '商品', '购物', '交易', '名录'],
  },
  {
    iconSvg: fortIconSvg,
    color: { background: '#ffcdd4', text: '#9f2834', border: '#fb7185' },
    keywords: ['城', '堡', '港', '海', '湖', '潮', '水', '归港', '开港', '航线', '联盟'],
  },
  {
    iconSvg: bolensArcaneIconSvg,
    color: { background: '#c6f3ff', text: '#056477', border: '#22d3ee' },
    keywords: ['魔', '幻', '假面', '辉钻', '钻', '仪式', '誓', '立约', '典礼'],
  },
  {
    iconSvg: ghostIconSvg,
    color: { background: '#e2d7ff', text: '#5b35c8', border: '#a78bfa' },
    keywords: ['魂', '灵', '亡', '幽', '先祖', '祖灵', '兽灵', '亡者', '冥'],
  },
  {
    iconSvg: triangleExclamationIconSvg,
    color: { background: '#ffd8d2', text: '#9b2f2f', border: '#ee9e96' },
    keywords: ['灾', '灾厄', '危机', '警告', '警戒', '噩梦', '黑紫泡泡', '裂隙', '暴乱', '骚乱'],
  },
  {
    iconSvg: nordgardAllianceIconSvg,
    color: { background: '#d0f0ff', text: '#11628a', border: '#5ac8fa' },
    keywords: ['雪', '冰', '冬', '寒', '长夜'],
  },
  {
    iconSvg: temperatureDownIconSvg,
    color: { background: '#e8f6ff', text: '#155e75', border: '#93d5f5' },
    keywords: ['寒潮', '霜冻', '冰雪', '凛冬', '冬至', '降温', '严寒'],
  },
  {
    iconSvg: sahraFederationIconSvg,
    color: { background: '#ffe7b8', text: '#895710', border: '#e7bd67' },
    keywords: ['太阳', '耀日', '日', '夏', '夏至', '火', '焰', '炉', '炎', '星', '天空', '天'],
  },
  {
    iconSvg: temperatureUpIconSvg,
    color: { background: '#ffe3cf', text: '#9a4b20', border: '#efb186' },
    keywords: ['酷暑', '炎暑', '烈日', '高温', '升温', '火山', '热浪'],
  },
  {
    iconSvg: moonIconSvg,
    color: { background: '#e5ddff', text: '#5440a6', border: '#9b87f5' },
    keywords: ['月咏', '灯海夜', '满月', '新月', '月夜', '月祭', '月华'],
  },
  {
    iconSvg: bookIconSvg,
    color: { background: '#fff3c7', text: '#8b6c13', border: '#e8cf68' },
    keywords: ['课程', '书', '卷', '诗', '万卷', '承露', '文本', '典籍', '学院', '手册'],
  },
  {
    iconSvg: candyCaneIconSvg,
    color: { background: '#ffe1eb', text: '#9a3d61', border: '#efadc2' },
    keywords: ['糖', '糖果', '甜点', '冬幕', '礼物', '祝礼', '甜'],
  },
  {
    iconSvg: musicIconSvg,
    color: { background: '#dff4ff', text: '#09627a', border: '#38bdf8' },
    keywords: ['赛瑞利亚演奏会', '苍籁剧场', '歌', '咏', '音乐', '风铃', '欢歌', '献歌', '摇篮曲', '旋律'],
  },
];

const FATE_POEM_FESTIVAL_MARKER_PRESETS: CalendarFestivalMarkerPreset[] = [
  ...FATE_POEM_COUNTRY_MARKER_PRESETS,
  ...FATE_POEM_THEME_MARKER_PRESETS,
];

const FATE_POEM_FALLBACK_FESTIVAL_MARKERS: CalendarFestivalMarkerPresetGroup['fallbackMarkers'] = [
  { iconSvg: sahraFederationIconSvg, background: '#ffd18a', text: '#8a4600', border: '#fb923c' },
  { iconSvg: wingedHolyCityIconSvg, background: '#fff08a', text: '#7a5700', border: '#facc15' },
  { iconSvg: bolensArcaneIconSvg, background: '#b9e9ff', text: '#075985', border: '#38bdf8' },
  { iconSvg: fortIconSvg, background: '#ffcdd4', text: '#9f2834', border: '#fb7185' },
  { iconSvg: champagneGlassesIconSvg, background: '#fff0c9', text: '#8a5a00', border: '#f2c55c' },
  { iconSvg: elvenCivilizationIconSvg, background: '#bff5d5', text: '#0f6a3f', border: '#34d399' },
  { iconSvg: beastAllianceIconSvg, background: '#ffd0e4', text: '#8b315e', border: '#f472b6' },
  { iconSvg: crownIconSvg, background: '#fff0b8', text: '#895710', border: '#facc15' },
];

const FESTIVAL_MARKER_PRESET_GROUPS = new Map<string, CalendarFestivalMarkerPresetGroup>([
  [
    'fate-poem',
    {
      markerPresets: FATE_POEM_FESTIVAL_MARKER_PRESETS,
      locationPresets: FATE_POEM_COUNTRY_MARKER_PRESETS,
      fallbackMarkers: FATE_POEM_FALLBACK_FESTIVAL_MARKERS,
    },
  ],
]);

export function getCalendarProfileFestivalMarkerPresetGroup(
  presetId: string | undefined,
): CalendarFestivalMarkerPresetGroup | null {
  const normalizedPresetId = String(presetId || '').trim();
  return normalizedPresetId ? (FESTIVAL_MARKER_PRESET_GROUPS.get(normalizedPresetId) ?? null) : null;
}
