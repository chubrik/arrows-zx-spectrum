import { unicodeToBytes } from './common/encode';
import { deployMemoryBlock, initMemory } from './common/utils';

const pos = getPosition();
const chunkX = pos.x & ~15;
const chunkY = pos.y & ~15;
initMemory(chunkX, chunkY);

onActive(() => {
  const data = unicodeToBytes(''); // Replaced during build
  deployMemoryBlock(0x0000, data); // 0x0000 replaced during build
});
