import { OP_PER_FRAME } from '../hw/constants';
import { world_getSignal } from '../hw/world-refs';

let optionsX: number;
let optionsY: number;

export function initOptions(chunkX: number, chunkY: number) {
  optionsX = chunkX + 64;
  optionsY = chunkY;
}

export let OPTS_OP_PER_TICK: number;
export let OPTS_LIMITED_SPEED: boolean;

export function fetchOptions() {
  OPTS_OP_PER_TICK = world_getSignal(optionsX, optionsY + 6) ? 1 : OP_PER_FRAME + 2; // +2 to guarantee interrupt handling
  OPTS_LIMITED_SPEED = !world_getSignal(optionsX, optionsY + 9);
}
