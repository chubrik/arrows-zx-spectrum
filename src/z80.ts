import { MS_PER_FRAME, OP_PER_FRAME } from './common/constants';
import { commitMemory, fetchMemory } from './common/memory';
import { initPorts } from './common/ports';
import { initMemory } from './common/utils';
import { executeMain } from './z80/execute-main';
import { INT, setINT } from './z80/flags';
import { commitCpu, fetchCpu, initCpu } from './z80/init';
import { interrupt } from './z80/interrupt';
import { fetchOptions, initOptions, OPTS_LIMITED_SPEED, OPTS_OP_PER_TICK } from './z80/options';
import { eiDelay, setEIDelay } from './z80/registers';

const pos = getPosition();
const chunkX = pos.x & ~15;
const chunkY = pos.y & ~15;
initOptions(chunkX, chunkY);
initCpu(chunkX, chunkY);
initMemory(chunkX, chunkY);
initPorts(chunkX, chunkY);

let enabled = false;
let opCount = 0;
let lastFrameTime = 0;

onActive(() => {
  if (enabled = !enabled) {
    fetchCpu();
    fetchMemory();
  }
});

always(() => {
  if (!enabled) return;
  fetchOptions();

  for (let i = 0; i < OPTS_OP_PER_TICK; i++) {
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

    if (OPTS_LIMITED_SPEED) {
      let now: number;
      while ((now = Date.now()) < lastFrameTime + MS_PER_FRAME) { }
      lastFrameTime = now;
    }

    break;
  }

  commitCpu();
  commitMemory();
});
