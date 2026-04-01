import { MS_PER_FRAME, OP_PER_FRAME } from './common/constants';
import { commitMemory, fetchMemory } from './common/memory';
import { initMemory } from './common/utils';
import { executeMain } from './z80/execute-main';
import { INT, setINT } from './z80/flags';
import { commitCpu, fetchCpu, initCpu } from './z80/init';
import { interrupt } from './z80/interrupt';
import { eiDelay, setEIDelay } from './z80/registers';

const pos = getPosition();
const chunkX = pos.x & ~15;
const chunkY = pos.y & ~15;
initCpu(chunkX, chunkY);
initMemory(chunkX, chunkY);

let opPerTick = 0;
let opCount = 0;
let lastFrameTime = 0;

onActive(() => {
  if (opPerTick === 0) {
    fetchCpu();
    fetchMemory();
    opPerTick = 1;
  }
  else if (opPerTick === 1)
    opPerTick = OP_PER_FRAME + 2; // +2 to guarantee interrupt handling
  else
    opPerTick = 0;
});

always(() => {
  if (!opPerTick) return;

  for (let i = 0; i < opPerTick; i++) {
    opCount++;
    executeMain();

    // Hack: we call interrupt only once per frame
    if (opCount < OP_PER_FRAME) continue;

    if (eiDelay) {
      setEIDelay(0);
      continue;
    }

    opCount -= OP_PER_FRAME;
    setINT(INT);
    interrupt();

    let now: number;
    while ((now = Date.now()) < lastFrameTime + MS_PER_FRAME) { }
    lastFrameTime = now;

    break;
  }

  commitCpu();
  commitMemory();
});
