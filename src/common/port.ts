import { setBeeper, writeBeeper } from './beeper';
import { BIT0, BIT1, BIT2, BIT3, BIT4, xFF } from './constants';
import { setBorder } from './screen';
import { cpuX, cpuY } from './state';
import { commitValue, fetchValue, getValuesCacheX, initValues } from './values';
import { world_getSignal } from './world-refs';

export const mockPorts: {
  readQueue: number[];
  readIndex: number;
  reads: Array<{ addr: number; value: number }>;
  writes: Array<{ addr: number; value: number }>;
} = TEST ? { readQueue: [], readIndex: 0, reads: [], writes: [] } : (undefined as never);

const PORT_MASK = 0x1F; // Bits: 4 - beeper, 3 - MIC, 2-0 - border
const BEEPER_MASK = BIT4;
const BORDER_MASK = 0x07;

let inited: boolean;
let portX: number;
let portY: number;
let portCacheX: number;
let keysY: number;

function initPort() {
  if (inited) return;
  inited = true;

  initValues();

  portX = cpuX + 8;
  portY = cpuY - 17;
  portCacheX = getValuesCacheX(portX, portY);

  keysY = portY - 2;
}

export function readPort(lo: number, hi: number): number {
  if (TEST) {
    const value = mockPorts.readQueue[mockPorts.readIndex++] ?? xFF;
    mockPorts.reads.push({ addr: (hi << 8) | lo, value });
    return value;
  }

  let result = xFF;

  for (let i = 0; i < 8; i++) {
    if (hi & (1 << i)) continue;
    const x = portX + i;
    let y = keysY;
    if (world_getSignal(x, y--)) result &= ~BIT0;
    if (world_getSignal(x, y--)) result &= ~BIT1;
    if (world_getSignal(x, y--)) result &= ~BIT2;
    if (world_getSignal(x, y--)) result &= ~BIT3;
    if (world_getSignal(x, y)) result &= ~BIT4;
  }

  return result;
}

let portValue = 0;
let portCommited = -1;

export function writePort(lo: number, hi: number, value: number) {
  if (TEST) {
    mockPorts.writes.push({ addr: (hi << 8) | lo, value });
    return;
  }

  if (lo & BIT0) return;
  portValue = value & PORT_MASK;
  writeBeeper(portValue & BEEPER_MASK);
  setBorder(portValue & BORDER_MASK);
}

function setPort(value: number) {
  portValue = value & PORT_MASK;
  setBeeper(portValue & BEEPER_MASK);
  setBorder(portValue & BORDER_MASK);
}

export function fetchPort() {
  initPort();
  const value = fetchValue(portX, portY);
  setPort(value);
  portCommited = value;
}

export function commitPort() {
  if (portCommited === portValue) return;
  portCommited = portValue;
  commitValue(portX, portY, portCacheX, portValue);
}

export function clearPort() { /*!inline*/ restorePort(0); }

export function restorePort(value: number) {
  initPort();
  setPort(value);
  commitPort();
}
