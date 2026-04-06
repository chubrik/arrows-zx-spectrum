import { BIT0, BIT1, BIT2, BIT3, BIT4, xFF } from './constants';
import { world_getSignal } from './world-refs';

let keysX: number;
let keysY: number;

export function initPorts(chunkX: number, chunkY: number) {
  keysX = chunkX + 32;
  keysY = chunkY - 16;
}

export function readPort(low: number, high: number): number {
  let result = xFF;

  for (let i = 0; i < 8; i++) {
    if (high & (1 << i)) continue;
    const x = keysX + i;
    let y = keysY;
    if (world_getSignal(x, y)) result &= ~BIT0;
    if (world_getSignal(x, ++y)) result &= ~BIT1;
    if (world_getSignal(x, ++y)) result &= ~BIT2;
    if (world_getSignal(x, ++y)) result &= ~BIT3;
    if (world_getSignal(x, ++y)) result &= ~BIT4;
  }

  return result;
}

export function writePort(low: number, high: number, value: number) {
  /* TODO */
}
