import { unicodeToBytes } from './common/encode';
import { deployMemoryBlock, initMemory } from './common/memory';
import { initCpuStartPosition } from './z80/positions';

const pos = getPosition();
const chunkX = pos.x & ~0xF;
const chunkY = pos.y & ~0xF;
initMemory(chunkX, chunkY);
initCpuStartPosition(chunkX, chunkY);

onActive(() => {
  const data = unicodeToBytes(''); // Replaced during build
  deployMemoryBlock(data, 0x0000); // 0x0000 replaced during build
});
