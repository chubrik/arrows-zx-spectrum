import { initCpu, restoreCpu } from './z80/init';

onActive(() => {
  const pos = getPosition();
  const chunkX = pos.x & ~15;
  const chunkY = pos.y & ~15;
  initCpu(chunkX, chunkY);

  restoreCpu([]); // Array filled during build
});
