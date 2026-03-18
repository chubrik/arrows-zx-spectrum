import { unicodeToBytes } from './common/encode';
import { deployMemory, initMemory } from './common/memory';

const pos = getPosition();
const chunkX = pos.x & ~0xF;
const chunkY = pos.y & ~0xF;
initMemory(chunkX, chunkY);

onActive(() => {
  const rom = unicodeToBytes(''); // Replaced during build
  deployMemory(rom);
});
