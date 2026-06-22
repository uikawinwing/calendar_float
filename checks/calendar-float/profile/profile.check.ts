import {
  applyCalendarProfileConfig,
  applyCalendarProfileHint,
  getActiveCalendarProfile,
  initializeCalendarProfile,
} from '../../../src/calendar-float/profile/index';
import { resolveCalendarProfileConfig } from '../../../src/calendar-float/profile/normalize';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function testBuiltinGenericStillResolves(): Promise<void> {
  await initializeCalendarProfile();
  const result = resolveCalendarProfileConfig({ profileHint: 'generic' });

  assert(result.profile.id === 'generic', 'generic profile should resolve');
  assert(result.profile.label === '通用月历', 'generic profile label should stay intact');
  assert(result.source === 'builtin', 'generic hint should resolve as builtin');
  assert(result.warnings.length === 0, 'generic profile should not warn');
}

async function testFatePoemResolvesFromChineseProfileHint(): Promise<void> {
  await initializeCalendarProfile();
  const profile = applyCalendarProfileHint('命定之诗');

  assert(profile.id === 'fate-poem', 'Chinese fate-poem hint should resolve builtin profile');
  assert(getActiveCalendarProfile().addons.includes('dlc_ellia'), 'fate-poem should keep built-in addon');
}

async function testCustomProfileConfigOverridesDataOnlyFields(): Promise<void> {
  await initializeCalendarProfile();
  const result = applyCalendarProfileConfig({
    profileHint: 'custom-court',
    config: {
      id: 'custom-court',
      label: '王庭月历',
      paths: {
        worldTime: 'stat_data.王庭.时间',
        worldLocation: 'stat_data.王庭.地点',
      },
      date: {
        eraName: '星历',
        eraNames: ['星历', '旧历'],
        useChineseNumeralYear: true,
      },
      worldbook: {
        variableDisplayTitle: '王庭日程',
        updateRuleTimeExamples: ['星历一二三年-4月5日'],
      },
      visual: {
        festivalMarkerPresetId: 'fate-poem',
      },
      addons: ['dlc_ellia'],
    },
  });

  assert(result.source === 'runtime_index', 'custom config should be runtime-index sourced');
  assert(result.profile.id === 'custom-court', 'custom id should be accepted');
  assert(result.profile.label === '王庭月历', 'custom label should be applied');
  assert(result.profile.paths.worldTime === 'stat_data.王庭.时间', 'worldTime path should be overridden');
  assert(result.profile.paths.worldLocation === 'stat_data.王庭.地点', 'worldLocation path should be overridden');
  assert(result.profile.paths.eventRoot === 'stat_data.事件.月历', 'unspecified paths should inherit generic default');
  assert(result.profile.date.eraName === '星历', 'single era label should be preserved');
  assert(result.profile.date.eraNames.join('|') === '星历|旧历', 'era names should be preserved');
  assert(result.profile.date.useChineseNumeralYear === true, 'Chinese numeral year option should be preserved');
  assert(result.profile.worldbook.variableDisplayTitle === '王庭日程', 'worldbook label should be overridden');
  assert(result.profile.worldbook.forbiddenRepeatTimeExamples.length > 0, 'worldbook defaults should be retained');
  assert(result.profile.visual?.festivalMarkerPresetId === 'fate-poem', 'visual preset id should be overridden');
  assert(result.profile.addons.includes('dlc_ellia'), 'known addon should be accepted');
}

function testBuiltinProfilesOwnVisualCapabilities(): void {
  const generic = resolveCalendarProfileConfig({ profileHint: 'generic' }).profile;
  const fatePoem = resolveCalendarProfileConfig({ profileHint: 'fate-poem' }).profile;

  assert(!generic.visual?.festivalMarkerPresetId, 'generic profile should not enable fate-poem marker presets');
  assert(fatePoem.visual?.festivalMarkerPresetId === 'fate-poem', 'fate-poem marker preset should live in profile data');
}

function testUnknownProfileFallsBackToGenericWithWarning(): void {
  const result = resolveCalendarProfileConfig({ profileHint: 'no-such-profile' });

  assert(result.profile.id === 'generic', 'unknown profile should fall back to generic');
  assert(result.source === 'default', 'unknown profile should resolve from default');
  assert(result.warnings.some(warning => warning.includes('no-such-profile')), 'unknown profile should warn');
}

function testFunctionLikeValuesAreRejected(): void {
  const result = resolveCalendarProfileConfig({
    profileHint: 'generic',
    config: {
      paths: {
        worldTime: () => 'stat_data.bad',
      },
      worldbook: {
        updateRuleTimeExamples: ['safe', () => 'bad'],
      },
      visual: {
        festivalMarkerPresetId: () => 'fate-poem',
      },
      addons: ['dlc_ellia', 'eval(() => bad)'],
    },
  });

  assert(result.profile.paths.worldTime === 'stat_data.世界.时间', 'function path override should be ignored');
  assert(
    result.profile.worldbook.updateRuleTimeExamples.join('|') === 'safe',
    'function-like example values should be filtered',
  );
  assert(!result.profile.visual?.festivalMarkerPresetId, 'function visual preset should be ignored');
  assert(result.profile.addons.join('|') === 'dlc_ellia', 'unknown addons should be rejected');
  assert(result.warnings.length >= 2, 'rejected data should produce warnings');
}

async function main(): Promise<void> {
  await testBuiltinGenericStillResolves();
  await testFatePoemResolvesFromChineseProfileHint();
  await testCustomProfileConfigOverridesDataOnlyFields();
  testBuiltinProfilesOwnVisualCapabilities();
  testUnknownProfileFallsBackToGenericWithWarning();
  testFunctionLikeValuesAreRejected();
  console.log('profile.check.ts OK');
}

void main();
