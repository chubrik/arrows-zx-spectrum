import { rmSync } from 'fs';
import { dirname } from 'path';
import { buildCpu, buildRom } from './targets.ts';
import { cpuPipeline, FUSE_CPU_PATH, SMOKE_CPU_PATH, SMOKE_ROM_PATH, SRC_DIR } from './utils.ts';

export async function setup() {
  for (const path of [FUSE_CPU_PATH, SMOKE_CPU_PATH, SMOKE_ROM_PATH])
    rmSync(dirname(path), { recursive: true, force: true });

  // The production blocks for test/smoke-dist.test.ts, built apart from dist/
  console.log('Initializer (smoke-test):');
  await buildRom(dirname(SMOKE_ROM_PATH), SMOKE_ROM_PATH);

  console.log('');
  console.log('CPU (smoke-test):');
  await buildCpu(dirname(SMOKE_CPU_PATH), SMOKE_CPU_PATH);

  // The build with the globalThis.__cpu hook for test/fuse-dist.test.ts
  console.log('');
  console.log('CPU (FUSE-test):');

  const path = `${SRC_DIR}/cpu-test.ts`;
  const { built, minified, substed } = await cpuPipeline(path, { test: true, stepsDir: dirname(FUSE_CPU_PATH) });

  console.log(
    `${path}: ${built.length} bytes → ` +
    `minified: ${minified.length} bytes → ` +
    `substed: ${substed.length} bytes`);
  console.log('');
}
