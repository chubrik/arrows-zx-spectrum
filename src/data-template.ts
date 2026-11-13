import { Signal } from 'logic-arrows-api';
import { GlobalState } from './common/state';
import { unicodeToBytes } from './util/encode';

const { x, y } = getPosition();
let cache: number[] | undefined;
let prevTick = 0;

onActive(e => {
  world.setSignal(x, y, Signal.NONE);

  const affect = prevTick < e.tick - 1;
  prevTick = e.tick;
  if (!affect) return;

  let placeholder: number;                           // Replaced during build (optional)
  (globalState as GlobalState).do = 1;
  globalState.NAME = (cache ??= unicodeToBytes('')); // NAME and '' replaced during build
});
