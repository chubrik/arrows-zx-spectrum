import { initMemory } from './common/memory';
import { executeMain } from './z80/execute';
import { initCpu } from './z80/positions';
import { interrupt } from './z80/interrupt';
import { commitRegs, copyCPU, fetchRegs } from './z80/utils';

const pos = getPosition();
const chunkX = pos.x & ~0xF;
const chunkY = pos.y & ~0xF;
initCpu(chunkX, chunkY);
initMemory(chunkX, chunkY);

always(() => {
  copyCPU();
  fetchRegs();
  executeMain();
  interrupt();
  commitRegs();
});
