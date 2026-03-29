import { initMemory } from './common/memory';
import { commitUpdated, fetchAll, get, set } from './common/utils';
import { executeMain } from './z80/execute-main';
import { INT } from './z80/flags';
import { initCpu } from './z80/init';
import { interrupt } from './z80/interrupt';
import { SYS } from './z80/registers';

const pos = getPosition();
const chunkX = pos.x & ~0xF;
const chunkY = pos.y & ~0xF;
initMemory(chunkX, chunkY);
initCpu(chunkX, chunkY);

const opPerFrame = 10000;
let opPerTick = 0;
let opCount = 0;

onActive(() => {
  if (opPerTick === 0) {
    fetchAll();
    opPerTick = 1;
  }
  else if (opPerTick === 1)
    opPerTick = opPerFrame;
  else
    opPerTick = 0;
});

always(() => {
  if (!opPerTick) return;

  for (let i = 0; i < opPerTick; i++) {
    opCount++;
    executeMain();

    if (opCount === opPerFrame) {
      opCount = 0;
      set(SYS, get(SYS) | INT);
    }

    interrupt();
  }

  commitUpdated();
});
