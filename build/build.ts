import { readdirSync } from 'fs';
import { buildCpu, buildRom, buildSnapshot } from './targets.ts';

const cpuOnly = process.argv.includes('--cpuOnly');

await buildCpu();

if (!cpuOnly) {
  await buildRom();

  const z80Files = readdirSync('resources').filter(f => f.toLowerCase().endsWith('.z80'));

  for (const file of z80Files)
    await buildSnapshot(`resources/${file}`);
}

console.log('');
