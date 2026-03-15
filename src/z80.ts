import { initMemory } from './common/utils';
import { executeMain } from './z80/execute';
import { commitRegs, copyCPU, fetchRegs, initCpu, interrupt } from './z80/utils';

const pos = getPosition();
const chunkX = pos.x & ~0xF;
const chunkY = pos.y & ~0xF;
initCpu(chunkX, chunkY);
initMemory(chunkX, chunkY);

always(() => {
  copyCPU();
  fetchRegs();
  executeMain();
  commitRegs();
  interrupt();
});
