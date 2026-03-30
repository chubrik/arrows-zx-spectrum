import { get, get16, set, set16, set88 } from '../common/utils';
import { BIT7 } from './flags';
import { HL, HLXY, PC, R } from './registers';

export function nop() { };

export function addPC(add: number) {
  const pc = get16(PC);
  set16(PC, (pc + add) & 0xFFFF);
}

export function next16(): number {
  const pc = get16(PC);
  set16(PC, (pc + 2) & 0xFFFF);
  const value = get16(pc);
  return value;
}

export function next(): number {
  const pc = get16(PC);
  set16(PC, (pc + 1) & 0xFFFF);
  const value = get(pc);
  return value;
}

export function setPCNext16() {
  const pc = get16(PC);
  const valueLow = get(pc);
  const valueHigh = get(pc + 1);
  set88(PC, valueLow, valueHigh);
}

export function refresh() {
  const r = get(R);
  const newR = (r & BIT7) | ((r + 1) & 0x7F);
  set(R, newR);
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
