import { commitBeeper } from './common/beeper';
import { MS_PER_FRAME, TSTATES_PER_DISPLAY_CENTER, TSTATES_PER_FRAME } from './common/constants';
import { commitMemory } from './common/memory';
import { commitScreen, incFrameCount } from './common/screen';
import { cpuStarted, fetchState, initState, speedLimited, stepMode } from './common/state';
import { executeMain } from './z80/execute-main';
import { INT, setINT } from './z80/flags';
import { commitCpu } from './z80/init';
import { interrupt } from './z80/interrupt';
import { eiTStates, setEiTStates, setTStates, tStates } from './z80/utils';

initState();

always(() => {
  fetchState();
  if (!cpuStarted) return;

  if (stepMode) {
    executeMain();
    commitScreen();

    if (tStates >= TSTATES_PER_FRAME) {
      setINT(INT);

      if (eiTStates !== tStates) {
        interrupt();
        setTStates(tStates - TSTATES_PER_FRAME);
        setEiTStates(0);
        incFrameCount();
      }
    }
  }
  else {
    do executeMain(); while (tStates < TSTATES_PER_DISPLAY_CENTER);

    //todo: Unlike the rest of the memory, the synchronization of the screen area occurs as the beam moves
    commitScreen();
    incFrameCount();

    do executeMain(); while (tStates < TSTATES_PER_FRAME);
    setINT(INT);

    while (eiTStates === tStates)
      executeMain();

    interrupt();
    setTStates(tStates - TSTATES_PER_FRAME);
    setEiTStates(0);

    if (speedLimited) limitSpeed();
  }

  commitCpu();
  commitMemory();
  commitBeeper();
});

const FRAME_WINDOW = 50;
const FRAME_WINDOW_MS = FRAME_WINDOW * MS_PER_FRAME;
const FRAME_DRIFT_MAX_MS = 25 * MS_PER_FRAME;
const frameTimes = new Float64Array(FRAME_WINDOW);
let frameTimesIdx = 0;

function limitSpeed() {
  let now = Date.now();
  const target = frameTimes[frameTimesIdx] + FRAME_WINDOW_MS;

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
