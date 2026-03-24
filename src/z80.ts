import { initMemory } from './common/memory';
import { applyCache, resetCache, set1 } from './common/utils';
import { executeMain } from './z80/execute';
import { interrupt } from './z80/interrupt';
import { copyCpu, posINT } from './z80/positions';
import { initCpu } from './z80/utils';

const pos = getPosition();
const chunkX = pos.x & ~0xF;
const chunkY = pos.y & ~0xF;
initMemory(chunkX, chunkY);
initCpu(chunkX, chunkY);

let opsPerTick = 0;

onActive(() => {
  if (opsPerTick === 0) opsPerTick = 1;
  else if (opsPerTick === 1) opsPerTick = 5000;
  else opsPerTick = 0;
});

always(() => {
  if (!opsPerTick) return;
  copyCpu();
  resetCache();

  for (let i = 0; i < opsPerTick; i++) {
    executeMain();
    interrupt();
  }

  //todo Hack
  if (opsPerTick > 1000)
    set1(posINT, 1);

  applyCache();
});
