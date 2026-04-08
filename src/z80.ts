import { MS_PER_FRAME, OP_PER_FRAME } from './hw/constants';
import { commitMemory, fetchMemory } from './hw/mem';
import { initMemory } from './hw/mem-init';
import { initPorts } from './hw/ports';
import { commitScreen, incFrameCount, initScreen, refreshScreen } from './hw/screen';
import { fetchState, initState } from './hw/state';
import { executeMain } from './z80/execute-main';
import { INT, setINT } from './z80/flags';
import { commitCpu, fetchCpu, initCpu } from './z80/init';
import { interrupt } from './z80/interrupt';
import { fetchOptions, initOptions, OPTS_LIMITED_SPEED, OPTS_OP_PER_TICK } from './z80/options';
import { eiDelay, setEIDelay } from './z80/registers';

let enabled = false;
let opCount = 0;
let lastFrameTime = 0;

initState();

onActive(() => {
  enabled = !enabled;
  if (!enabled) return;

  initOptions();
  initCpu();
  initMemory();
  initScreen();
  initPorts();

  fetchCpu();
  fetchMemory();
  refreshScreen();
});

always(() => {
  fetchState();
  if (!enabled) return;
  fetchOptions();

  for (let i = 0; i < OPTS_OP_PER_TICK; i++) {
    opCount++;
    executeMain();

    // Hack: we check interrupt only once per frame
    if (opCount < OP_PER_FRAME) continue;

    if (eiDelay) {
      setEIDelay(0);
      continue;
    }

    opCount -= OP_PER_FRAME;
    setINT(INT);
    interrupt();
    incFrameCount();

    if (OPTS_LIMITED_SPEED) {
      let now: number;
      while ((now = Date.now()) < lastFrameTime + MS_PER_FRAME) { }
      lastFrameTime = now;
    }

    break;
  }

  commitCpu();
  commitScreen();
  commitMemory();
});
