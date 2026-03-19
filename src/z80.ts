import { initMemory } from './common/memory';
import { executeMain } from './z80/execute';
import { interrupt } from './z80/interrupt';
import { copyCpu } from './z80/positions';
import { commitRegs, fetchRegs, initCpu } from './z80/utils';

const pos = getPosition();
const chunkX = pos.x & ~0xF;
const chunkY = pos.y & ~0xF;
initMemory(chunkX, chunkY);
initCpu(chunkX, chunkY);

let enabled = false;
onActive(() => enabled = !enabled);

always(() => {
  if (!enabled) return;
  copyCpu();
  fetchRegs();
  executeMain();
  interrupt();
  commitRegs();
});
