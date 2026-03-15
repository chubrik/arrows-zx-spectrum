import { initMemory } from './common/data';
import { unicodeToBytes } from './common/encode';
import { draw } from './memory/draw';

const pos = getPosition();
const chunkX = pos.x & ~0xF;
const chunkY = pos.y & ~0xF;
initMemory(chunkX, chunkY);

onActive(() => {
  const rom = unicodeToBytes(''); // Replaced during build
  draw(rom);
});
