import { readdirSync } from 'fs';
import { buildCpu, buildRom, buildSnapshot } from './targets.ts';

const cpuOnly = process.argv.includes('--cpuOnly');

if (!cpuOnly) {
  const z80Files = readdirSync('resources').filter(f => f.toLowerCase().endsWith('.z80'));

  for (const file of z80Files)
    await buildSnapshot(`resources/${file}`);

  await buildRom();
  console.log('');
}

await buildCpu();
console.log('');
