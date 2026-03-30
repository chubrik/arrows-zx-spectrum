import { commitMemory, fetchMemory } from './common/memory';
import { initMemory } from './common/utils';
import { executeMain } from './z80/execute-main';
import { INT, setINT } from './z80/flags';
import { commitCpu, fetchCpu, initCpu } from './z80/init';
import { interrupt } from './z80/interrupt';
import { eiDelay, setEIDelay } from './z80/registers';

const pos = getPosition();
const chunkX = pos.x & ~0xF;
const chunkY = pos.y & ~0xF;
initCpu(chunkX, chunkY);
initMemory(chunkX, chunkY);

const opPerFrame = 10000;
const opBeforeFrame = opPerFrame - 1;
let opPerTick = 0;
let opCount = 0;

onActive(() => {
  if (opPerTick === 0) {
    fetchCpu();
    fetchMemory();
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

    // Hack: we call interrupt only once per frame
    if (opCount < opBeforeFrame) continue;

    if (opCount === opPerFrame) {
      opCount = 0;
      setINT(INT);
    }

    if (eiDelay) {
      setEIDelay(0);
      continue;
    };

    interrupt();
  }

  commitCpu();
  commitMemory();
});
