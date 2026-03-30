import { get, get16 } from '../common/utils';
import { BIT7 } from './flags';
import { getReg16, HL, HLXY, PC, R, regs, setReg16, setReg88 } from './registers';

export function nop() { };

export function addPC(add: number) {
  const pc = getReg16(PC);
  setReg16(PC, (pc + add) & 0xFFFF);
}

export function next16(): number {
  const pc = getReg16(PC);
  setReg16(PC, (pc + 2) & 0xFFFF);
  const value = get16(pc);
  return value;
}

export function next(): number {
  const pc = getReg16(PC);
  setReg16(PC, (pc + 1) & 0xFFFF);
  const value = get(pc);
  return value;
}

export function setPCNext16() {
  const pc = getReg16(PC);
  const valueLow = get(pc);
  const valueHigh = get(pc + 1);
  setReg88(PC, valueLow, valueHigh);
}

export function refresh() {
  const r = regs[R];
  const newR = (r & BIT7) | ((r + 1) & 0x7F);
  regs[R] = newR;
}

/** (IX+d/IY+d) */
export function getXYd(): number {
  const xy = getReg16(HLXY); // IX/IY
  const rawD = next();
  const d = rawD >= 128 ? rawD - 256 : rawD; // -128...+127
  return (xy + d) & 0xFFFF;
}

/** (HL/IX+d/IY+d) */
export function getHLXYd() {
  let hlxyd = getReg16(HLXY);

  if (HLXY !== HL) {
    const rawD = next();
    const d = rawD >= 128 ? rawD - 256 : rawD; // -128...+127
    hlxyd = (hlxyd + d) & 0xFFFF;
  }

  return hlxyd;
}
