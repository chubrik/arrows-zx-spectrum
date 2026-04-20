import { beeperEnabled, cpuX, cpuY } from './state';
import { world_setSignal } from './world-refs';

let inited: boolean;
let noteX0: number;
let noteX1: number;
let noteY: number;

export function initBeeper() {
  if (inited) return;
  inited = true;

  noteX0 = cpuX;
  noteX1 = noteX0 + 1;
  noteY = cpuY - 24;
}

let beeperCounter = 0;
let beeperBit: number; // 0 | 16

export function incBeeper(bit: number) {
  if (!beeperEnabled) return;
  if (beeperBit !== bit) beeperCounter++;
  beeperBit = bit;
}

let phase = false;

export function commitBeeper() {
  if (!beeperCounter) return;
  beeperCounter = 0;
  world_setSignal(phase ? noteX1 : noteX0, noteY, 6);
  phase = !phase;
}
