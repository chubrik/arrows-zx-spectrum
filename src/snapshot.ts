import { deployMemoryBlock, initMemory } from './hw/mem-init';
import { unicodeToBytes } from './util/encode';

onActive(() => {
  const pos = getPosition();
  const chunkX = pos.x & ~15;
  const chunkY = pos.y & ~15;
  initMemory(chunkX, chunkY);

  const data = unicodeToBytes(''); // Replaced during build
  deployMemoryBlock(0x0000, data); // 0x0000 replaced during build
});
