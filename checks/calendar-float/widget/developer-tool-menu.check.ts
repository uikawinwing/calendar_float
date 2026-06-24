/* eslint-disable import-x/no-nodejs-modules */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function main(): void {
  const stylePath = resolve(process.cwd(), 'src/calendar-float/widget/style-parts/base.ts');
  const styleSource = readFileSync(stylePath, 'utf8');
  const hasDeveloperToolHiddenSelector =
    styleSource.includes("[data-role='developer-tool-menu-item'][hidden]") ||
    styleSource.includes('[data-role="developer-tool-menu-item"][hidden]');
  const hasDeveloperToolClassSelector =
    styleSource.includes("[data-role='developer-tool-menu-item'].is-hidden") ||
    styleSource.includes('[data-role="developer-tool-menu-item"].is-hidden');
  const hasImportantDisplayNone = /display:\s*none\s*!important/.test(styleSource);

  assert(hasDeveloperToolHiddenSelector, '开发者菜单项 hidden 状态必须有专门 CSS 兜底');
  assert(hasDeveloperToolClassSelector, '开发者菜单项 is-hidden 状态必须有专门 CSS 兜底');
  assert(hasImportantDisplayNone, '开发者菜单项隐藏规则必须用 display:none!important 压过按钮 display 样式');

  console.log('widget/developer-tool-menu.check.ts OK');
}

main();
