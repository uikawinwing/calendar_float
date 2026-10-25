import {
  applyCalendarProfileConfig,
  getActiveCalendarProfile,
  initializeCalendarProfile,
} from '../../../src/calendar-float/profile';
import { resolveCalendarProfileConfig } from '../../../src/calendar-float/profile/normalize';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

async function testFatePoemIsTheOnlyProfile(): Promise<void> {
  await initializeCalendarProfile();
  assert(getActiveCalendarProfile().id === 'fate-poem', 'startup always selects Fate Poem');
  assert(getActiveCalendarProfile().addons.includes('dlc_ellia'), 'Fate Poem addon is retained');
  assert(
    getActiveCalendarProfile().visual?.festivalMarkerPresetId === 'fate-poem',
    'the Fate Poem marker preset stays active',
  );

  for (const hint of ['generic', 'custom-court', 'unrelated-character']) {
    const result = resolveCalendarProfileConfig({ profileHint: hint });
    assert(result.profile.id === 'fate-poem', `unexpected profile ${hint} must not change product identity`);
    assert(result.warnings.some(warning => warning.includes(hint)), 'unsupported profile must be reported');
  }
}

async function testFateIndexOverridesOnlyRuntimeData(): Promise<void> {
  await initializeCalendarProfile();
  const result = applyCalendarProfileConfig({
    profileHint: 'fate-poem',
    config: {
      id: 'custom-court',
      label: '命定之诗月历',
      paths: {
        worldTime: 'stat_data.世界.时辰',
        worldLocation: 'stat_data.世界.所在地',
      },
      date: {
        eraName: '复兴纪元',
        eraNames: ['复兴纪元', '旧历'],
        useChineseNumeralYear: true,
      },
      worldbook: {
        variableDisplayTitle: '现有月历事件',
        updateRuleTimeExamples: ['复兴纪元一二三年-4月5日'],
      },
      developerMode: true,
    },
  });
  assert(result.profile.id === 'fate-poem', 'runtime index cannot make a generic/custom product');
  assert(result.warnings.some(warning => warning.includes('custom-court')), 'ignored custom profile ID is diagnosed');
  assert(result.profile.paths.worldTime === 'stat_data.世界.时辰', 'Fate Worldbook time override works');
  assert(result.profile.paths.worldLocation === 'stat_data.世界.所在地', 'Fate Worldbook location override works');
  assert(result.profile.date.eraNames.join('|') === '复兴纪元|旧历', 'Fate era alias override works');
  assert(result.profile.developerMode === true, 'Fate editor developer mode works');
  assert(result.profile.addons.includes('dlc_ellia'), 'Fate addons remain intact');
}

function testFunctionLikeValuesRemainRejected(): void {
  const result = resolveCalendarProfileConfig({
    profileHint: 'fate-poem',
    config: {
      paths: { worldTime: () => 'stat_data.bad' },
      worldbook: { updateRuleTimeExamples: ['safe', () => 'bad'] },
      visual: { festivalMarkerPresetId: () => 'evil' },
      addons: ['dlc_ellia', 'eval(() => bad)'],
    },
  });
  assert(result.profile.paths.worldTime === 'stat_data.世界.时间', 'function path must be ignored');
  assert(result.profile.worldbook.updateRuleTimeExamples.join('|') === 'safe', 'unsafe examples ignored');
  assert(result.profile.visual?.festivalMarkerPresetId === 'fate-poem', 'unsafe visual keeps Fate preset');
  assert(result.profile.addons.join('|') === 'dlc_ellia', 'unsafe add-ons filtered');
  assert(result.warnings.length >= 2, 'rejected values receive warnings');
}

async function testChatResetKeepsFateIdentity(): Promise<void> {
  applyCalendarProfileConfig({
    config: { paths: { worldTime: 'stat_data.世界.临时时辰' }, developerMode: true },
  });
  await initializeCalendarProfile();
  assert(getActiveCalendarProfile().paths.worldTime === 'stat_data.世界.时间', 'chat reset restores original Fate paths');
  assert(getActiveCalendarProfile().developerMode === false, 'chat reset resets developer tools');
}

async function main(): Promise<void> {
  await testFatePoemIsTheOnlyProfile();
  await testFateIndexOverridesOnlyRuntimeData();
  testFunctionLikeValuesRemainRejected();
  await testChatResetKeepsFateIdentity();
  console.log('profile.check.ts Fate-only OK');
}

void main();
