import { strict as assert } from 'node:assert';
import {
  applyCalendarProfileConfig,
  getActiveCalendarProfile,
  initializeCalendarProfile,
} from '../../../src/calendar-float/profile';
import { resolveCalendarProfileConfig } from '../../../src/calendar-float/profile/normalize';

async function main(): Promise<void> {
  await initializeCalendarProfile();
  assert.equal(getActiveCalendarProfile().id, 'fate-poem');
  assert.equal(getActiveCalendarProfile().label, '命定之诗');
  const legacy = resolveCalendarProfileConfig({ profileHint: 'generic' });
  assert.equal(legacy.profile.id, 'fate-poem');
  assert.equal(legacy.compatible, true);
  assert.equal(resolveCalendarProfileConfig({ profileHint: 'FATE-POEM' }).compatible, true);
  assert(legacy.warnings.some(message => message.includes('旧版 generic')));

  const configured = applyCalendarProfileConfig({
    profileHint: '命定之诗',
    config: {
      label: '任意运行身份不再生效',
      paths: {
        eventRoot: 'stat_data.月历',
        worldTime: 'stat_data.世界.时刻',
        worldLocation: 'stat_data.世界.当前位置',
      },
      date: { eraName: '星历', eraNames: ['星历', '旧历'], useChineseNumeralYear: true },
      worldbook: { variableDisplayTitle: '现有月历', updateRuleTimeExamples: ['星历一二三年-4月5日'] },
      addons: ['dlc_ellia'],
      developerMode: true,
    },
  });
  assert.equal(configured.compatible, true);
  assert.equal(configured.profile.id, 'fate-poem');
  assert.equal(configured.profile.label, '命定之诗');
  assert.equal(configured.profile.paths.tempEvents, 'stat_data.月历.临时');
  assert.equal(configured.profile.paths.repeatEvents, 'stat_data.月历.重复');
  assert.equal(configured.profile.paths.worldTime, 'stat_data.世界.时刻');
  assert.equal(configured.profile.date.eraName, '星历');
  assert.deepEqual(configured.profile.date.eraNames, ['星历', '旧历']);
  assert.equal(configured.profile.date.useChineseNumeralYear, true);
  assert.deepEqual(configured.profile.worldbook.updateRuleTimeExamples, ['星历一二三年-4月5日']);
  assert(configured.profile.worldbook.forbiddenRepeatTimeExamples.length);
  assert.equal(configured.profile.developerMode, true);

  const invalid = applyCalendarProfileConfig({
    profileHint: 'unknown-world',
    config: { paths: { worldTime: 'stat_data.bad' } },
  });
  assert.equal(invalid.compatible, false);
  assert(invalid.warnings.some(message => message.includes('unknown-world')));
  assert.equal(getActiveCalendarProfile().id, 'fate-poem');
  assert.equal(getActiveCalendarProfile().paths.worldTime, 'stat_data.世界.时间');
  assert.equal(
    resolveCalendarProfileConfig({ profileHint: 'fate-poem', config: { id: 'unknown-world' } }).compatible,
    false,
  );

  const badData = resolveCalendarProfileConfig({
    config: {
      paths: { worldTime: () => 'stat_data.bad' },
      worldbook: { updateRuleTimeExamples: ['safe', () => 'bad'] },
      addons: ['dlc_ellia', 'eval(() => bad)'],
      visual: { markerPresets: [{ icon: '<svg onload=alert(1)>', color: {}, keywords: ['x'] }], fallbackMarkers: [] },
    },
  });
  assert.equal(badData.profile.paths.worldTime, 'stat_data.世界.时间');
  assert.deepEqual(badData.profile.worldbook.updateRuleTimeExamples, ['safe']);
  assert.deepEqual(badData.profile.addons, ['dlc_ellia']);
  assert(badData.profile.visual.markerPresets.length > 0);
  assert(badData.profile.visual.fallbackMarkers.length > 0);
  assert(badData.warnings.length >= 4);
  const clean = resolveCalendarProfileConfig({});
  clean.profile.visual.locationPresets[0].keywords.push('mutation');
  assert(!resolveCalendarProfileConfig({}).profile.visual.locationPresets[0].keywords.includes('mutation'));
  console.log('profile.check.ts OK');
}

void main();
