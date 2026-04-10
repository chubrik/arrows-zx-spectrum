import { MS_PER_FRAME, OP_PER_FRAME } from './hw/constants';
import { commitMemory } from './hw/mem';
import { commitScreen, incFrameCount } from './hw/screen';
import { cpuStarted, fetchState, initState, OPTS_LIMITED_SPEED, OPTS_OP_PER_TICK } from './hw/state';
import { executeMain } from './z80/execute-main';
import { INT, setINT } from './z80/flags';
import { commitCpu } from './z80/init';
import { interrupt } from './z80/interrupt';
import { eiDelay, setEIDelay } from './z80/registers';

let opCount = 0;

initState();

always(() => {
  fetchState();
  if (!cpuStarted) return;

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

    if (OPTS_LIMITED_SPEED) limitSpeed();
    break;
  }

  commitCpu();
  commitScreen();
  commitMemory();
});

const FRAME_WINDOW = 50;
const FRAME_WINDOW_MS = FRAME_WINDOW * MS_PER_FRAME;
const FRAME_DRIFT_MAX_MS = 25 * MS_PER_FRAME;
const frameTimes = new Float64Array(FRAME_WINDOW);
let frameTimesIdx = 0;

function limitSpeed() {
  let now = Date.now();
  let target = frameTimes[frameTimesIdx] + FRAME_WINDOW_MS;

  if (now - target > FRAME_DRIFT_MAX_MS) {
    // If the buffer is not warmed up or we are more than 25 frames behind, we fill the buffer 
    // as if the previous 50 frames were running strictly according to schedule and are ending now.
    frameTimes[frameTimesIdx] = now;

    for (let i = 1; i < FRAME_WINDOW; i++)
      frameTimes[(frameTimesIdx + i) % FRAME_WINDOW] = now + i * MS_PER_FRAME - FRAME_WINDOW_MS;
  }
  else {
    frameTimes[frameTimesIdx] = target;
    while (now < target) now = Date.now();
  }

  if (++frameTimesIdx === FRAME_WINDOW) frameTimesIdx = 0;
}
