/* eslint-disable import-x/no-nodejs-modules */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function main(): void {
  const sourcePath = resolve(process.cwd(), 'src/calendar-float/widget/index.ts');
  const source = readFileSync(sourcePath, 'utf8');
  const forbidden = [
    'hostWindow.alert',
    'hostWindow.confirm',
    'hostWindow.prompt',
    'window.alert',
    'window.confirm',
    'window.prompt',
  ];
  const hits = forbidden.filter(token => source.includes(token));
  assert(hits.length === 0, `widget/index.ts 不应该再使用 native dialog: ${hits.join(', ')}`);
  console.log('widget/native-dialog.scan.check.ts OK');
}

main();
