import { set1Direct, set8Direct } from './common/utils';
import { initMemory } from './common/memory';
import {
  initCpuPositions,
  posA, posF, posB, posC, posD, posE, posH, posL,
  posAa, posFa, posBa, posCa, posDa, posEa, posHa, posLa,
  posIXh, posIXl, posIYh, posIYl, posSPh, posSPl, posPCh, posPCl,
  posI, posR, posIM1, posIM2, posIFF1, posIFF2, posHalt,
} from './z80/positions';

const pos = getPosition();
const chunkX = pos.x & ~0xF;
const chunkY = pos.y & ~0xF;
initMemory(chunkX, chunkY);
initCpuPositions(chunkX, chunkY);

onActive(() => {
  restoreCpu();
});

function restoreCpu() { } // Body replaced during build
