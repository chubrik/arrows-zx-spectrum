import { initCpu } from './z80/init';
import {
  A, F, B, C, D, E, H, L, Aa, Fa, Ba, Ca, Da, Ea, Ha, La,
  IXh, IXl, IYh, IYl, SP, PC, I, R, SYS, cpuCtxA, cpuCtxX, cpuCtxY
} from './z80/registers';

onActive(() => {
  const pos = getPosition();
  const chunkX = pos.x & ~15;
  const chunkY = pos.y & ~15;
  initCpu(chunkX, chunkY);

  restoreCpu();
});

function restoreCpu() { } // Body replaced during build
