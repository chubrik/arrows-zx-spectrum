import { rmSync } from 'fs';
import { buildCpu, buildRom } from './targets.ts';
import { cpuPipeline, DIST_DIR, SMOKE_DIR, SRC_DIR } from './utils.ts';

export async function setup() {
  rmSync(`${DIST_DIR}/temp/z80-test`, { recursive: true, force: true });
  rmSync(SMOKE_DIR, { recursive: true, force: true });

  const path = `${SRC_DIR}/z80-test.ts`;
  const { built, minified, substed } = await cpuPipeline(path, { test: true });

  console.log(
    `${path} (test): ${built.length} bytes → ` +
    `minified: ${minified.length} bytes → ` +
    `substed: ${substed.length} bytes`);

  // Production CPU block and ROM initializer for the dist smoke test, built apart from dist/
  await buildCpu(SMOKE_DIR, SMOKE_DIR);
  await buildRom(SMOKE_DIR, SMOKE_DIR);
  console.log('');
}
