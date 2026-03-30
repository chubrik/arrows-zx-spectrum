import { read, read16 } from '../common/memory';
import { BIT7 } from './flags';
import { get16, HL, HLXY, PC, R, regs, set16, set88 } from './registers';

export function nop() { };

export function incPC(inc: number) {
  const pc = get16(PC);
  set16(PC, (pc + inc) & 0xFFFF);
}

export function next16(): number {
  const pc = get16(PC);
  set16(PC, (pc + 2) & 0xFFFF);
  const value = read16(pc);
  return value;
}

export function next(): number {
  const pc = get16(PC);
  set16(PC, (pc + 1) & 0xFFFF);
  const value = read(pc);
  return value;
}

export function setPCNext16() {
  const pc = get16(PC);
  const low = read(pc);
  const high = read(pc + 1);
  set88(PC, low, high);
}

export function refresh() {
  const r = regs[R];
  const newR = (r & BIT7) | ((r + 1) & 0x7F);
  regs[R] = newR;
}

/** (IX+d/IY+d) */
export function getXYd(): number {
  const xy = get16(HLXY); // IX/IY
  const rawD = next();
  const d = rawD >= 128 ? rawD - 256 : rawD; // -128...+127
  return (xy + d) & 0xFFFF;
}

/** (HL/IX+d/IY+d) */
export function getHLXYd() {
  let hlxyd = get16(HLXY);

  if (HLXY !== HL) {
    const rawD = next();
    const d = rawD >= 128 ? rawD - 256 : rawD; // -128...+127
    hlxyd = (hlxyd + d) & 0xFFFF;
  }

  return hlxyd;
}
