import { setDirect } from './common/arrows';
import { initMemory } from './common/utils';
import { initCpu } from './z80/init';
import {
  A, F, B, C, D, E, H, L, Aa, Fa, Ba, Ca, Da, Ea, Ha, La,
  IXh, IXl, IYh, IYl, SPh, SPl, PCh, PCl, I, R, SYS, cpuCtx
} from './z80/registers';

const pos = getPosition();
const chunkX = pos.x & ~15;
const chunkY = pos.y & ~15;
initMemory(chunkX, chunkY);
initCpu(chunkX, chunkY);

onActive(() => {
  restoreCpu();
});

function restoreCpu() { } // Body replaced during build
