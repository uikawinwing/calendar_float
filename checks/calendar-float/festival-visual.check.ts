/* eslint-disable import-x/no-nodejs-modules */
import * as fs from 'fs';
import * as path from 'path';
import defaults from '../../src/calendar-float/profile/fate-poem-defaults.json';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function readSource(relativePath: string): string {
  return fs.readFileSync(path.resolve(__dirname, '../../src/calendar-float', relativePath), 'utf8');
}

function testNewBundledIconsAreMapped(): void {
  const source = readSource('festival-icons.ts');
  [
    'torii-gate-solid.svg',
    'music-solid.svg',
    'chess-solid.svg',
    'champagne-glasses-solid.svg',
    'book-solid.svg',
    'bag-shopping-solid.svg',
    'alarm-clock-regular.svg',
    'calendar-regular.svg',
    'diamond-solid.svg',
    'heart-solid.svg',
    'triangle-exclamation-solid.svg',
    'candy-cane-solid.svg',
    'compass-regular.svg',
    'dragon-solid.svg',
    'ferry-solid.svg',
    'moon-regular.svg',
    'suitcase-solid.svg',
    'temperature-arrow-down-solid.svg',
    'temperature-arrow-up-solid.svg',
    'arrows-to-circle-solid.svg',
  ].forEach(filename => {
    assert(source.includes(`['${filename}'`), `应该注册新增 SVG：${filename}`);
  });
}

function testGhostIsNotGenericFallback(): void {
  assert(
    !defaults.visual.fallbackMarkers.some(item => item.icon === 'ghost-solid-full.svg'),
    '默认标记应避免把新年等节日随机显示为幽灵',
  );
}

function testCreationDayKeywordsPreferCelebrationIcon(): void {
  const keywords = defaults.visual.markerPresets.find(item => item.icon === 'champagne-glasses-solid.svg')!.keywords;
  assert(keywords.includes('创生'), '创生之日应该命中庆典图标');
  assert(keywords.includes('新年'), '新年应该命中庆典图标');
}

function testSaireliaUsesMusicIcon(): void {
  assert(
    defaults.visual.locationPresets.some(item => item.icon === 'music-solid.svg' && item.keywords.includes('赛瑞利亚')),
    '赛瑞利亚应该命中音乐图标',
  );
}

function testSvgColorCssCoversCommonShapes(): void {
  const source = readSource('widget/style-parts/overrides.ts');
  ['path', 'circle', 'rect', 'polygon', 'polyline', 'line'].forEach(tagName => {
    assert(source.includes(`.${'th-festival-title-svg'} ${tagName}`), `标题 SVG 应该覆盖 ${tagName} 的颜色`);
    assert(source.includes(`.${'th-corner-marker-svg'} ${tagName}`), `角标 SVG 应该覆盖 ${tagName} 的颜色`);
  });
}

function testTagColorPreviewCoversSvgShapes(): void {
  const source = readSource('widget/style-parts/base.ts');
  assert(source.includes('th-tag-color-preview-svg'), '标签颜色弹窗应该显示 SVG 预览');
  ['path', 'circle', 'rect', 'polygon', 'polyline', 'line'].forEach(tagName => {
    assert(source.includes(`.${'th-tag-color-preview-svg'} ${tagName}`), `标签 SVG 预览应该覆盖 ${tagName} 的颜色`);
  });
}

function testFestivalCanUseHashtagColor(): void {
  const runtimeSource = readSource('runtime-dataset/festivals.ts');
  const visualSource = readSource('festival-visual.ts');
  assert(runtimeSource.includes('resolveFestivalHashtagColor'), 'runtime dataset 应该能按节庆名/地点读取标签颜色');
  assert(runtimeSource.includes('tagColor, hashtagColor'), '节庆 metadata 应该保存命中的标签颜色');
  assert(visualSource.includes('festival.metadata.tagColor'), '节庆 marker 应该读取标签颜色');
}

function testBaseHashtagsUseDifferentIcons(): void {
  [
    ['主线', 'compass-regular.svg'],
    ['支线', 'arrows-to-circle-solid.svg'],
    ['节庆', 'champagne-glasses-solid.svg'],
    ['课程', 'book-solid.svg'],
    ['旅行', 'suitcase-solid.svg'],
    ['限时', 'alarm-clock-regular.svg'],
    ['约会', 'heart-solid.svg'],
    ['比赛', 'chess-solid.svg'],
    ['纪念', 'calendar-regular.svg'],
  ].forEach(([tag, iconName]) => {
    assert(
      defaults.visual.tagPresets.some(item => item.icon === iconName && item.keywords.includes(tag)),
      `${tag} 应该绑定 ${iconName}`,
    );
  });
}

function testUtilityIconsUseSvgAndCurrentColor(): void {
  const iconSource = readSource('widget/icons.ts');
  const rootSource = readSource('widget/index.ts');
  const renderSource = readSource('widget/render.ts');
  const styleSource = readSource('widget/style-parts/base.ts');
  [
    'arrow-rotate-right-solid.svg',
    'arrows-rotate-solid.svg',
    'expand-solid.svg',
    'left-long-solid.svg',
    'maximize-solid.svg',
    'minimize-solid.svg',
    'right-long-solid.svg',
    'xmark-solid.svg',
  ].forEach(filename => {
    assert(iconSource.includes(filename), `utility icon 应该注册 ${filename}`);
  });
  assert(rootSource.includes("renderUtilityIcon('maximize')"), '窗口全屏按钮应该使用 SVG 图标');
  assert(rootSource.includes("renderUtilityIcon('reload')"), '窗口刷新按钮应该使用 SVG 图标');
  assert(rootSource.includes("renderUtilityIcon('close')"), '窗口关闭按钮应该使用 SVG 图标');
  assert(renderSource.includes("renderUtilityIcon('monthPrev'"), '月份上一页按钮应该使用 SVG 图标');
  assert(renderSource.includes("renderUtilityIcon('monthNext'"), '月份下一页按钮应该使用 SVG 图标');
  assert(styleSource.includes('.th-utility-icon path'), 'utility SVG 应该覆盖 path 颜色');
  assert(styleSource.includes('fill: currentColor !important'), 'utility SVG 应该使用 currentColor');
}

function main(): void {
  testNewBundledIconsAreMapped();
  testGhostIsNotGenericFallback();
  testCreationDayKeywordsPreferCelebrationIcon();
  testSaireliaUsesMusicIcon();
  testSvgColorCssCoversCommonShapes();
  testTagColorPreviewCoversSvgShapes();
  testFestivalCanUseHashtagColor();
  testBaseHashtagsUseDifferentIcons();
  testUtilityIconsUseSvgAndCurrentColor();
  console.log('festival-visual.check.ts OK');
}

main();
