import { getMem8, setMem8 } from '../../common/utils';
import { incPC, getA, getBC, getDE, getHL, setBC, setDE, setHL } from '../utils';

/** LDIR */
export function LDIR() {
  const needRepeat = LDI();
  if (needRepeat) incPC(-2);
}

/** LDI */
export function LDI(): any {
  return LDX_base(value => value + 1);
}

/** LDDR */
export function LDDR() {
  const needRepeat = LDD();
  if (needRepeat) incPC(-2);
}

/** LDD */
export function LDD(): any {
  return LDX_base(value => value - 1);
}

function LDX_base(updatePtrs: (value: number) => number): any {
  const count = getBC();
  const countAfter = (count - 1) & 0xFFFF;
  const destAddr = getDE();
  const srcAddr = getHL();
  const value = getMem8(srcAddr);
  setMem8(destAddr, value);
  setBC(countAfter);
  setDE(updatePtrs(destAddr) & 0xFFFF);
  setHL(updatePtrs(srcAddr) & 0xFFFF);
  return countAfter;
  /* TODO flags */
}

/** CPIR */
export function CPIR() {
  const needRepeat = CPI();
  if (needRepeat) incPC(-2);
}

/** CPI */
export function CPI(): any {
  return CPX_base(value => value + 1);
}

/** CPDR */
export function CPDR() {
  const needRepeat = CPD();
  if (needRepeat) incPC(-2);
}

/** CPD */
export function CPD(): any {
  return CPX_base(value => value - 1);
}

function CPX_base(update: (value: number) => number): any {
  const count = getBC();
  const countAfter = (count - 1) & 0xFFFF;
  const addr = getHL();
  const value = getMem8(addr);
  const notEqual = value !== getA();
  setBC(countAfter);
  setHL(update(addr) & 0xFFFF);
  return notEqual || countAfter;
  /* TODO flags */
}
