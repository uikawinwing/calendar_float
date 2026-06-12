import augustineEmpireIconSvg from '../../svg/奥古斯提姆帝国_landmark-flag-solid-full.svg?raw';
import bolensArcaneIconSvg from '../../svg/伯伦斯法环_hat-wizard-solid-full.svg?raw';
import beastAllianceIconSvg from '../../svg/兽族联盟_paw-solid-full.svg?raw';
import elvenCivilizationIconSvg from '../../svg/精灵文明_leaf-solid-full.svg?raw';
import nordgardAllianceIconSvg from '../../svg/诺斯加德联盟_snowflake-solid-full.svg?raw';
import sahraFederationIconSvg from '../../svg/萨赫拉联邦_sun-solid-full.svg?raw';
import solentisKingdomIconSvg from '../../svg/索伦蒂斯王国_chess-queen-regular-full.svg?raw';
import valenciaIconSvg from '../../svg/瓦伦蒂亚_dungeon-solid-full.svg?raw';
import wingedHolyCityIconSvg from '../../svg/翼民圣都_feather-solid-full.svg?raw';
import crownIconSvg from '../../svg/crown-solid-full.svg?raw';
import fortIconSvg from '../../svg/fort-awesome-brands-solid-full.svg?raw';
import ghostIconSvg from '../../svg/ghost-solid-full.svg?raw';
import { getFestivalLocationKeywords } from './festival-location';
import { getActiveCalendarProfile } from './profile';
import type { CalendarEventColorStyle, DayCellFestivalMarker, FestivalRecord } from './types';

type FestivalVisualSource = Pick<
  FestivalRecord,
  'id' | 'title' | 'summary' | 'content' | 'locationKeywords' | 'metadata'
>;

function hashText(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

type FestivalMarkerPreset = {
  iconSvg: string;
  color: CalendarEventColorStyle;
  keywords: string[];
};

const BUNDLED_FESTIVAL_ICON_BY_FILENAME = new Map<string, string>([
  ['奥古斯提姆帝国_landmark-flag-solid-full.svg', augustineEmpireIconSvg],
  ['伯伦斯法环_hat-wizard-solid-full.svg', bolensArcaneIconSvg],
  ['兽族联盟_paw-solid-full.svg', beastAllianceIconSvg],
  ['精灵文明_leaf-solid-full.svg', elvenCivilizationIconSvg],
  ['诺斯加德联盟_snowflake-solid-full.svg', nordgardAllianceIconSvg],
  ['萨赫拉联邦_sun-solid-full.svg', sahraFederationIconSvg],
  ['索伦蒂斯王国_chess-queen-regular-full.svg', solentisKingdomIconSvg],
  ['瓦伦蒂亚_dungeon-solid-full.svg', valenciaIconSvg],
  ['翼民圣都_feather-solid-full.svg', wingedHolyCityIconSvg],
  ['crown-solid-full.svg', crownIconSvg],
  ['fort-awesome-brands-solid-full.svg', fortIconSvg],
  ['ghost-solid-full.svg', ghostIconSvg],
]);

const FATE_POEM_COUNTRY_MARKER_PRESETS: FestivalMarkerPreset[] = [
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
];

const FATE_POEM_THEME_MARKER_PRESETS: FestivalMarkerPreset[] = [
  {
    iconSvg: crownIconSvg,
    color: { background: '#fff0b8', text: '#895710', border: '#e8bf59' },
    keywords: ['女王', '皇后', '王后', '贵族', '王座', '冠', '盟约', '倾国', '倾城', '阿芙罗黛蒂', '美'],
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
    keywords: ['魂', '灵', '亡', '夜', '幽', '雾', '梦', '月'],
  },
  {
    iconSvg: nordgardAllianceIconSvg,
    color: { background: '#d0f0ff', text: '#11628a', border: '#5ac8fa' },
    keywords: ['雪', '冰', '冬', '寒', '长夜'],
  },
  {
    iconSvg: sahraFederationIconSvg,
    color: { background: '#ffe7b8', text: '#895710', border: '#e7bd67' },
    keywords: ['太阳', '耀日', '日', '夏', '夏至', '火', '焰', '炉', '炎', '星', '天空', '天'],
  },
  {
    iconSvg: wingedHolyCityIconSvg,
    color: { background: '#fff3c7', text: '#8b6c13', border: '#e8cf68' },
    keywords: ['书', '卷', '诗', '歌', '咏', '万卷', '承露', '文本'],
  },
];

const FATE_POEM_FESTIVAL_MARKER_PRESETS: FestivalMarkerPreset[] = [
  ...FATE_POEM_COUNTRY_MARKER_PRESETS,
  ...FATE_POEM_THEME_MARKER_PRESETS,
];

const FALLBACK_FESTIVAL_MARKERS: Array<DayCellFestivalMarker['color'] & { iconSvg: string }> = [
  { iconSvg: sahraFederationIconSvg, background: '#ffd18a', text: '#8a4600', border: '#fb923c' },
  { iconSvg: wingedHolyCityIconSvg, background: '#fff08a', text: '#7a5700', border: '#facc15' },
  { iconSvg: bolensArcaneIconSvg, background: '#b9e9ff', text: '#075985', border: '#38bdf8' },
  { iconSvg: fortIconSvg, background: '#ffcdd4', text: '#9f2834', border: '#fb7185' },
  { iconSvg: ghostIconSvg, background: '#e2d7ff', text: '#5b35c8', border: '#a78bfa' },
  { iconSvg: elvenCivilizationIconSvg, background: '#bff5d5', text: '#0f6a3f', border: '#34d399' },
  { iconSvg: beastAllianceIconSvg, background: '#ffd0e4', text: '#8b315e', border: '#f472b6' },
  { iconSvg: crownIconSvg, background: '#fff0b8', text: '#895710', border: '#facc15' },
];

const GENERIC_FALLBACK_FESTIVAL_MARKERS: Array<DayCellFestivalMarker['color'] & { iconSvg: string }> = [
  { iconSvg: fortIconSvg, background: '#ffcdd4', text: '#9f2834', border: '#fb7185' },
  { iconSvg: ghostIconSvg, background: '#e2d7ff', text: '#5b35c8', border: '#a78bfa' },
  { iconSvg: crownIconSvg, background: '#fff0b8', text: '#895710', border: '#facc15' },
];

function getActiveFestivalMarkerPresets(): FestivalMarkerPreset[] {
  return getActiveCalendarProfile().id === 'fate-poem' ? FATE_POEM_FESTIVAL_MARKER_PRESETS : [];
}

function getActiveFallbackFestivalMarkers(): typeof FALLBACK_FESTIVAL_MARKERS {
  return getActiveCalendarProfile().id === 'fate-poem' ? FALLBACK_FESTIVAL_MARKERS : GENERIC_FALLBACK_FESTIVAL_MARKERS;
}

function findPresetByOrderedKeywords(
  keywords: string[],
  presets: readonly FestivalMarkerPreset[],
): FestivalMarkerPreset | undefined {
  for (const keyword of keywords) {
    const normalizedKeyword = keyword.toLowerCase();
    const preset = presets.find(item =>
      item.keywords.some(presetKeyword => {
        const normalizedPresetKeyword = presetKeyword.toLowerCase();
        return (
          normalizedKeyword.includes(normalizedPresetKeyword) ||
          normalizedPresetKeyword.includes(normalizedKeyword)
        );
      }),
    );
    if (preset) {
      return preset;
    }
  }
  return undefined;
}

function getExplicitBundledIconSvg(festival: Pick<FestivalRecord, 'metadata'>): string | undefined {
  const filename = String(festival.metadata.groupIconSvgFilename ?? festival.metadata.分组图标 ?? '').trim();
  return filename ? BUNDLED_FESTIVAL_ICON_BY_FILENAME.get(filename) : undefined;
}

export function buildFestivalMarker(festival: FestivalVisualSource): DayCellFestivalMarker {
  const keywords = getFestivalLocationKeywords(festival);
  const searchableText = [festival.title, festival.summary, festival.content, ...keywords].join('|').toLowerCase();
  const presets = getActiveFestivalMarkerPresets();
  const fallbacks = getActiveFallbackFestivalMarkers();
  const locationPreset = findPresetByOrderedKeywords(keywords, FATE_POEM_COUNTRY_MARKER_PRESETS);
  const textPreset = presets.find(item =>
    item.keywords.some(keyword => searchableText.includes(keyword.toLowerCase())),
  );
  const preset = locationPreset ?? textPreset;
  const fallback = fallbacks[hashText(keywords[0] || festival.id) % fallbacks.length];
  const explicitIconSvg = getExplicitBundledIconSvg(festival);
  return {
    id: festival.id,
    title: festival.title,
    iconSvg: explicitIconSvg ?? preset?.iconSvg ?? fallback.iconSvg,
    iconColor: preset?.color.text ?? fallback.text,
    color: preset?.color ?? fallback,
  };
}
