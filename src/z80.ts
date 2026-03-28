import { initMemory } from './common/memory';
import { commitUpdated, fetchAll, get, set } from './common/utils';
import { executeMain } from './z80/_execute-main';
import { INT } from './z80/flags';
import { interrupt } from './z80/interrupt';
import { SYS } from './z80/positions';
import { initCpu } from './z80/utils';

const pos = getPosition();
const chunkX = pos.x & ~0xF;
const chunkY = pos.y & ~0xF;
initMemory(chunkX, chunkY);
initCpu(chunkX, chunkY);

let opsPerTick = 0;

onActive(() => {
  if (opsPerTick === 0) {
    fetchAll();
    opsPerTick = 1;
  }
  else if (opsPerTick === 1)
    opsPerTick = 10000; // Approximate number of operations per frame
  else
    opsPerTick = 0;
});

always(() => {
  if (!opsPerTick) return;
  // copyCpu();

  for (let i = 0; i < opsPerTick; i++) {
    executeMain();
    interrupt();
  }

  //todo Hack
  if (opsPerTick > 1000)
    set(SYS, get(SYS) | INT);

  commitUpdated();
});
