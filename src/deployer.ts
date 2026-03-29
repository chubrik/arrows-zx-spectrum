import { unicodeToBytes } from './common/encode';
import { deployMemoryBlock, initMemory } from './common/memory';
import { initCpu, resetCpu } from './z80/init';

const pos = getPosition();
const chunkX = pos.x & ~0xF;
const chunkY = pos.y & ~0xF;
initMemory(chunkX, chunkY);
initCpu(chunkX, chunkY);

onActive(() => {
  const rom = unicodeToBytes(''); // Replaced during build
  const ram: number[] = [];
  ram.length = 0xC000;
  deployMemoryBlock(rom, 0x0000);
  deployMemoryBlock(ram, 0x4000);
  resetCpu();
});
