import { rmSync } from 'fs';
import { cpuPipeline, DIST_DIR, SRC_DIR } from './utils.ts';

export async function setup() {
  rmSync(`${DIST_DIR}/temp/z80-test`, { recursive: true, force: true });

  const path = `${SRC_DIR}/z80-test.ts`;
  const { built, minified, substed } = await cpuPipeline(path, { test: true });

  console.log(
    `${path} (test): ${built.length} bytes → ` +
    `minified: ${minified.length} bytes → ` +
    `substed: ${substed.length} bytes\n`);
}
