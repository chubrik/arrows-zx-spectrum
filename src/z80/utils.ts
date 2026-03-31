import { BIT7, xFF, xFFFF } from '../common/constants';
import { mem } from '../common/memory';
import { HL, HLXY, HXY, LXY, PCh, PCl, R, cpu } from './registers';

// Hot code!
// Any attempt to extract common parts leads to slowdown.

export function nop() { };

export function incPC(inc: number) {
  const pc = (cpu[PCh] << 8) | cpu[PCl];
  const newPc = (pc + inc) & xFFFF;
  cpu[PCl] = newPc & xFF;
  cpu[PCh] = newPc >> 8;
}

export function next16(): number {
  const pc = (cpu[PCh] << 8) | cpu[PCl];
  const newPc = (pc + 2) & xFFFF;
  cpu[PCl] = newPc & xFF;
  cpu[PCh] = newPc >> 8;
  const low = mem[pc];
  const high = mem[pc + 1];
  return (high << 8) | low;
}

export function next(): number {
  const pcl = cpu[PCl];
  const pch = cpu[PCh];
  const pc = (pch << 8) | pcl;
  if (pcl === xFF) {
    cpu[PCl] = 0;
    cpu[PCh] = (pch + 1) & xFF;
  } else {
    cpu[PCl] = pcl + 1;
  }
  const value = mem[pc];
  return value;
}

export function setPCNext16() {
  const pc = (cpu[PCh] << 8) | cpu[PCl];
  const low = mem[pc];
  const high = mem[pc + 1];
  cpu[PCl] = low;
  cpu[PCh] = high;
}

export function refresh() {
  const r = cpu[R];
  const newR = (r & BIT7) | ((r + 1) & 0x7F);
  cpu[R] = newR;
}

/** (HL/IX+d/IY+d) */
export function getHLXYd() {
  let hlxyd = (cpu[HXY] << 8) | cpu[LXY];

  if (HLXY !== HL) {
    const rawD = next();
    const d = rawD >= 128 ? rawD - 256 : rawD; // -128...+127
    hlxyd = (hlxyd + d) & xFFFF;
  }

  return hlxyd;
}
