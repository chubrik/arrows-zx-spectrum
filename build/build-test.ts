import { cpuPipeline, DIST_DIR, SRC_DIR, writeToPath } from './utils.ts';

export async function setup() {
  const path = `${SRC_DIR}/z80-test-hook.ts`;
  const { built, processed } = await cpuPipeline(path, { test: true });

  const fileName = 'z80-test';
  writeToPath(`${DIST_DIR}/temp/${fileName}/${fileName}.js`, processed);

  console.log(`${path} (test): ${built.length} bytes → minified: ${processed.length} bytes`);
}
