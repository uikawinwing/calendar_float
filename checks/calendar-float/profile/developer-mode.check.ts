import { resolveCalendarProfileConfig } from '../../../src/calendar-float/profile/normalize';
import { shouldShowCalendarDeveloperTools } from '../../../src/calendar-float/widget/developer-mode';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function testDeveloperModeDefaultsToHidden(): void {
  const result = resolveCalendarProfileConfig({ profileHint: 'generic' });

  assert(result.profile.developerMode === false, '开发者模式缺省应该关闭');
  assert(!shouldShowCalendarDeveloperTools(result.profile), '缺省 profile 不应该显示开发者入口');
}

function testDeveloperModeCanBeEnabledFromProfileConfig(): void {
  const result = resolveCalendarProfileConfig({
    profileHint: 'generic',
    config: {
      developerMode: true,
    },
  });

  assert(result.profile.developerMode === true, '配置档案设置.开发者模式=true 应该启用开发者模式');
  assert(shouldShowCalendarDeveloperTools(result.profile), '开发者模式开启时才显示开发者入口');
}

function main(): void {
  testDeveloperModeDefaultsToHidden();
  testDeveloperModeCanBeEnabledFromProfileConfig();
  console.log('profile/developer-mode.check.ts OK');
}

main();
