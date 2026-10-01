import { existsSync, readdirSync } from 'fs';
import { basename } from 'path';
import { buildCpu, buildRom, buildSnapshot } from './targets.ts';
import { RESOURCES_DIR } from './utils.ts';

const cpuOnly = process.argv.includes('--cpu');
let noPrograms = false;

if (!cpuOnly) {
  const z80Files = existsSync(RESOURCES_DIR)
    ? readdirSync(RESOURCES_DIR).filter(f => f.toLowerCase().endsWith('.z80'))
    : [];

  noPrograms = !z80Files.length;

  if (!noPrograms) {
    console.log('Programs:');

    const nameWidth = Math.max(...z80Files.map(file => basename(file, '.z80').length));

    for (const file of z80Files)
      await buildSnapshot(`${RESOURCES_DIR}/${file}`, nameWidth);

    console.log('');
  }

  console.log('Initializer:');
  await buildRom();
  console.log('');
}

console.log('CPU:');
await buildCpu();
console.log('');

if (noPrograms) {
  console.warn('No programs:');
  console.warn(`- Put ZX Spectrum 48K *.z80 snapshots into ${RESOURCES_DIR}/ to get a paste-ready string for each`);
  console.log('');
}
