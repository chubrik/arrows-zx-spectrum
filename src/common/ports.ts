import { incBeeper, initBeeper } from './beeper';
import { BIT0, BIT1, BIT2, BIT3, BIT4, xFF } from './constants';
import { setBorder } from './screen';
import { cpuX, cpuY } from './state';
import { world_getSignal } from './world-refs';

export const mockPorts: { readQueue: number[]; readIndex: number; writes: Array<{ addr: number; value: number }> } =
  TEST ? { readQueue: [], readIndex: 0, writes: [] } : (undefined as never);

let inited: boolean;
let keysX: number;
let keysY: number;

export function initPorts() {
  if (inited) return;
  inited = true;

  keysX = cpuX + 8;
  keysY = cpuY - 24;

  initBeeper();
}

export function readPort(lo: number, hi: number): number {
  if (TEST) return mockPorts.readQueue[mockPorts.readIndex++] ?? xFF;

  let result = xFF;

  for (let i = 0; i < 8; i++) {
    if (hi & (1 << i)) continue;
    const x = keysX + i;
    let y = keysY;
    if (world_getSignal(x, y++)) result &= ~BIT0;
    if (world_getSignal(x, y++)) result &= ~BIT1;
    if (world_getSignal(x, y++)) result &= ~BIT2;
    if (world_getSignal(x, y++)) result &= ~BIT3;
    if (world_getSignal(x, y)) result &= ~BIT4;
  }

  return result;
}

export function writePort(lo: number, hi: number, value: number) {
  if (TEST) {
    mockPorts.writes.push({ addr: (hi << 8) | lo, value });
    return;
  }

  if (lo & BIT0) return;
  setBorder(value & 0x07);
  incBeeper(value & BIT4);
}
