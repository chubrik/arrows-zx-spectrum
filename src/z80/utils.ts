import { BIT7, xFF, xFFFF } from '../common/constants';
import { mem } from '../common/memory';
import { HL, HLXY, HXY, LXY, PC, PCv, R, cpu, setPCv } from './registers';

// Hot code!
// Any attempt to extract common parts leads to slowdown.

export function nop() { };

export function next16(): number {
  const pc = PCv;
  setPCv((pc + 2) & xFFFF);
  const low = mem[pc];
  const high = mem[pc + 1];
  return (high << 8) | low;
}

export function next(): number {
  const pc = PCv;
  const value = mem[pc];
  setPCv((pc + 1) & xFFFF);
  return value;
}

export function setPCNext16() {
  const pc = PCv;
  const low = mem[pc];
  const high = mem[pc + 1];
  setPCv((high << 8) | low);
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
