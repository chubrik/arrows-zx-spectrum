import { rmSync } from 'fs';
import { dirname } from 'path';
import { buildCpu, buildRom } from './targets.ts';
import { cpuPipeline, FUSE_CPU_PATH, SMOKE_CPU_PATH, SMOKE_ROM_PATH, SRC_DIR } from './utils.ts';

export async function setup() {
  for (const path of [FUSE_CPU_PATH, SMOKE_CPU_PATH, SMOKE_ROM_PATH])
    rmSync(dirname(path), { recursive: true, force: true });

  const path = `${SRC_DIR}/z80-test.ts`;
  const { built, minified, substed } = await cpuPipeline(path, { test: true, stepsDir: dirname(FUSE_CPU_PATH) });

  console.log(
    `${path} (test): ${built.length} bytes → ` +
    `minified: ${minified.length} bytes → ` +
    `substed: ${substed.length} bytes`);

  // Production CPU block and ROM initializer for the dist smoke test, built apart from dist/
  await buildCpu(dirname(SMOKE_CPU_PATH), SMOKE_CPU_PATH);
  await buildRom(dirname(SMOKE_ROM_PATH), SMOKE_ROM_PATH);
  console.log('');
}
