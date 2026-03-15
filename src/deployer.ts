import { unicodeToBytes } from './common/encode';
import { initMemory } from './common/utils';
import { deployMemory } from './deployer/memory';

const pos = getPosition();
const chunkX = pos.x & ~0xF;
const chunkY = pos.y & ~0xF;
initMemory(chunkX, chunkY);

onActive(() => {
  const rom = unicodeToBytes(''); // Replaced during build
  deployMemory(rom);
});
