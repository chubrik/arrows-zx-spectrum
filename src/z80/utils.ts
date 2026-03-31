import { mems } from '../common/memory';
import { BIT7 } from './flags';
import { HL, HLXY, HXY, LXY, PCh, PCl, R, regs } from './registers';

// Hot code!
// Any attempt to extract common parts leads to slowdown.

export function nop() { };

export function incPC(inc: number) {
  const pc = (regs[PCh] << 8) | regs[PCl];
  const newPc = (pc + inc) & 0xFFFF;
  regs[PCl] = newPc & 0xFF;
  regs[PCh] = newPc >> 8;
}

export function next16(): number {
  const pc = (regs[PCh] << 8) | regs[PCl];
  const newPc = (pc + 2) & 0xFFFF;
  regs[PCl] = newPc & 0xFF;
  regs[PCh] = newPc >> 8;
  const low = mems[pc];
  const high = mems[pc + 1];
  return (high << 8) | low;
}

export function next(): number {
  const pcl = regs[PCl];
  const pch = regs[PCh];
  const pc = (pch << 8) | pcl;
  if (pcl === 0xFF) {
    regs[PCl] = 0;
    regs[PCh] = (pch + 1) & 0xFF;
  } else {
    regs[PCl] = pcl + 1;
  }
  const value = mems[pc];
  return value;
}

export function setPCNext16() {
  const pc = (regs[PCh] << 8) | regs[PCl];
  const low = mems[pc];
  const high = mems[pc + 1];
  regs[PCl] = low;
  regs[PCh] = high;
}

export function refresh() {
  const r = regs[R];
  const newR = (r & BIT7) | ((r + 1) & 0x7F);
  regs[R] = newR;
}

/** (HL/IX+d/IY+d) */
export function getHLXYd() {
  let hlxyd = (regs[HXY] << 8) | regs[LXY];

  if (HLXY !== HL) {
    const rawD = next();
    const d = rawD >= 128 ? rawD - 256 : rawD; // -128...+127
    hlxyd = (hlxyd + d) & 0xFFFF;
  }

  return hlxyd;
}
