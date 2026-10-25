import { globSync } from 'node:fs';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const register = require.resolve('ts-node/register/transpile-only');
const files = [...globSync('checks/calendar-float/**/*.check.ts')].sort();
let failed = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, ['-r', register, file], {
    encoding: 'utf8',
    env: { ...process.env, TS_NODE_COMPILER_OPTIONS: JSON.stringify({ module: 'CommonJS', moduleResolution: 'Node' }) },
  });
  if (result.status !== 0) {
    failed += 1;
    console.error(`FAIL ${file}\n${result.stdout}${result.stderr}${result.error ?? ''}`);
  }
}
console.log(`${files.length - failed}/${files.length} checks passed`);
process.exitCode = failed ? 1 : 0;
