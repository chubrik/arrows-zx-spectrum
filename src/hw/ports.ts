import { BIT0, BIT1, BIT2, BIT3, BIT4, xFF } from './constants';
import { drawBorder } from './screen';
import { cpuX, cpuY } from './state';
import { world_getSignal } from './world-refs';

let inited = false;
let keysX: number;
let keysY: number;

export function initPorts() {
  if (inited) return;
  inited = true;

  keysX = cpuX + 8;
  keysY = cpuY - 24;
}

export function readPort(lo: number, hi: number): number {
  let result = xFF;

  for (let i = 0; i < 8; i++) {
    if (hi & (1 << i)) continue;
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

export function writePort(lo: number, hi: number, value: number) {
  if (!(lo & BIT0))
    drawBorder(value & 0x07);
}
