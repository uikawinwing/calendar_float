import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Module from 'node:module';
import { strict as strictAssert } from 'node:assert';
import { parse as parseYaml } from 'yaml';
import { normalizeCalendarRuntimeIndexDocument } from '../../src/calendar-float/runtime-worldbook/index-normalizer';
import type { FestivalRecord } from '../../src/calendar-float/types';

function installSvgRawRequireHook(): void {
  const moduleWithLoad = Module as unknown as {
    _load: (request: string, parent: unknown, isMain: boolean) => unknown;
  };
  const originalLoad = moduleWithLoad._load;
  moduleWithLoad._load = (request, parent, isMain) => {
    if (request.endsWith('.svg?raw')) {
      return `<svg data-icon="${request.split('/').pop() ?? 'icon.svg'}"></svg>`;
    }
    return originalLoad(request, parent, isMain);
  };
}

installSvgRawRequireHook();

interface FestivalVisualProfilePresetCheckModules {
  profile: typeof import('../../src/calendar-float/profile');
  profilePresets: typeof import('../../src/calendar-float/profile/festival-visual-presets');
  festivalVisual: typeof import('../../src/calendar-float/festival-visual');
}

async function loadModules(): Promise<FestivalVisualProfilePresetCheckModules> {
  return {
    profile: await import('../../src/calendar-float/profile'),
    profilePresets: await import('../../src/calendar-float/profile/festival-visual-presets'),
    festivalVisual: await import('../../src/calendar-float/festival-visual'),
  };
}

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function createFestival(args: Partial<FestivalRecord>): FestivalRecord {
  return {
    id: 'festival_1',
    title: '',
    summary: '',
    content: '',
    start: '01-01',
    end: '01-01',
    locationKeywords: [],
    relatedBooks: [],
    metadata: {},
    sourceKind: 'worldbook',
    ...args,
  };
}

function testDefaultDataAndWorldbookSettingsAgree(modules: FestivalVisualProfilePresetCheckModules): void {
  modules.profile.applyCalendarProfileConfig({});
  const legacy = modules.profile.getActiveCalendarProfile().visual;
  const index = normalizeCalendarRuntimeIndexDocument(parseYaml(readFileSync('节庆_索引.latest.yaml', 'utf8')))!;
  modules.profile.applyCalendarProfileConfig({ config: index.Profile设置 });
  strictAssert.deepEqual(modules.profile.getActiveCalendarProfile().visual, legacy, '索引示例与旧版兼容数据应一致');
  const group = modules.profilePresets.buildFestivalMarkerPresetGroup(legacy);
  assert(
    group.locationPresets.some(preset => preset.keywords.includes('索伦蒂斯王国')),
    '旧版索伦蒂斯地点规则应保留',
  );
}

function testActiveProfileControlsFestivalMarkerPresets(modules: FestivalVisualProfilePresetCheckModules): void {
  const festival = createFestival({
    id: 'solentis_regatta',
    title: '索伦蒂斯王国赛艇节',
    locationKeywords: ['索伦蒂斯王国'],
  });

  modules.profile.applyCalendarProfileConfig({});
  const fateMarker = modules.festivalVisual.buildFestivalMarker(festival);
  assert(fateMarker.color.background === '#b9ddff', '命定之诗 profile 应该套用索伦蒂斯专属颜色');
  modules.profile.applyCalendarProfileConfig({
    config: {
      visual: {
        locationPresets: [
          { icon: 'heart-solid.svg', color: { background: '#123456', text: '#abcdef' }, keywords: ['索伦蒂斯王国'] },
        ],
      },
    },
  });
  const customMarker = modules.festivalVisual.buildFestivalMarker(festival);
  assert(customMarker.color.background === '#123456', '世界书的地点规则应覆盖旧版默认值');
  assert(customMarker.iconSvg.includes('heart-solid.svg'), '图标应采用配置的已打包文件');
  modules.profile.applyCalendarProfileConfig({});
  assert(
    modules.festivalVisual.buildFestivalMarker(festival).color.background === '#b9ddff',
    '重载无配置索引应清除自定义视觉规则',
  );
}

function testGenericFestivalVisualModuleDoesNotOwnFatePoemConstants(): void {
  const source = readFileSync(join(process.cwd(), 'src/calendar-float/festival-visual.ts'), 'utf8');
  assert(!source.includes('FATE_POEM_'), 'festival-visual.ts 不应该拥有命定之诗 FATE_POEM_* preset 常量');
}

async function main(): Promise<void> {
  const modules = await loadModules();
  testDefaultDataAndWorldbookSettingsAgree(modules);
  testActiveProfileControlsFestivalMarkerPresets(modules);
  testGenericFestivalVisualModuleDoesNotOwnFatePoemConstants();
  console.log('festival-visual-profile-presets.check.ts OK');
}

void main();
