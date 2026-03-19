import { unicodeToBytes } from './common/encode';
import { deployMemory, initMemory } from './common/memory';
import { initCpuStartPosition, resetCpu } from './z80/positions';

const pos = getPosition();
const chunkX = pos.x & ~0xF;
const chunkY = pos.y & ~0xF;
initMemory(chunkX, chunkY);
initCpuStartPosition(chunkX, chunkY);

onActive(() => {
  const rom = unicodeToBytes(''); // Replaced during build
  deployMemory(rom);
  resetCpu();
});
