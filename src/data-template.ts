import { State } from './common/state';
import { unicodeToBytes } from './util/encode';

const { x, y } = getPosition()!;
let cache: number[] | undefined;
let prevTick = 0;

onActive(e => {
  world.setSignal(x, y, 0);

  const affect = prevTick < e.tick - 1;
  prevTick = e.tick;
  if (!affect) return;

  let placeholder: number;                     // Replaced during build (optional)
  (state as State).do = 1;
  state.NAME = (cache ??= unicodeToBytes('')); // NAME and '' replaced during build
});
