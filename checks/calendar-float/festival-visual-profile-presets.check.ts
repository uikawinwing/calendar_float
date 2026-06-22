import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Module from 'node:module';
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

function testProfilePresetRegistryOwnsFatePoemPresets(modules: FestivalVisualProfilePresetCheckModules): void {
  const generic = modules.profilePresets.getCalendarProfileFestivalMarkerPresetGroup(undefined);
  const fatePoem = modules.profilePresets.getCalendarProfileFestivalMarkerPresetGroup('fate-poem');

  assert(generic === null, '通用 profile 不应该注册命定之诗视觉 preset');
  assert(fatePoem !== null, '命定之诗 profile 应该注册视觉 preset');
  assert(fatePoem?.locationPresets.some(preset => preset.keywords.includes('索伦蒂斯王国')), '命定之诗 preset 应该包含索伦蒂斯地点规则');
}

function testActiveProfileControlsFestivalMarkerPresets(modules: FestivalVisualProfilePresetCheckModules): void {
  const festival = createFestival({
    id: 'solentis_regatta',
    title: '索伦蒂斯王国赛艇节',
    locationKeywords: ['索伦蒂斯王国'],
  });

  modules.profile.applyCalendarProfileConfig({ profileHint: 'generic' });
  const genericMarker = modules.festivalVisual.buildFestivalMarker(festival);
  assert(genericMarker.color.background !== '#b9ddff', '通用 profile 不应该套用索伦蒂斯专属颜色');

  modules.profile.applyCalendarProfileHint('命定之诗');
  const fateMarker = modules.festivalVisual.buildFestivalMarker(festival);
  assert(fateMarker.color.background === '#b9ddff', '命定之诗 profile 应该套用索伦蒂斯专属颜色');
}

function testGenericFestivalVisualModuleDoesNotOwnFatePoemConstants(): void {
  const source = readFileSync(join(process.cwd(), 'src/calendar-float/festival-visual.ts'), 'utf8');
  assert(!source.includes('FATE_POEM_'), 'festival-visual.ts 不应该拥有命定之诗 FATE_POEM_* preset 常量');
}

async function main(): Promise<void> {
  const modules = await loadModules();
  testProfilePresetRegistryOwnsFatePoemPresets(modules);
  testActiveProfileControlsFestivalMarkerPresets(modules);
  testGenericFestivalVisualModuleDoesNotOwnFatePoemConstants();
  console.log('festival-visual-profile-presets.check.ts OK');
}

void main();
