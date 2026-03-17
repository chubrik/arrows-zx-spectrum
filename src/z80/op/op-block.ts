import { getMem8, setMem8 } from '../../common/utils';
import { incPC, getA, getBC, getDE, getHL, setBC, setDE, setHL } from '../utils';

/** LDIR */
export function LDIR() {
  const repeat = LDI();
  if (repeat) incPC(-2);
}

/** LDI */
export function LDI(): any {
  return ldx(value => value + 1);
}

/** LDDR */
export function LDDR() {
  const repeat = LDD();
  if (repeat) incPC(-2);
}

/** LDD */
export function LDD(): any {
  return ldx(value => value - 1);
}

function ldx(update: (value: number) => number): any {
  const count = getBC();
  const countAfter = (count - 1) & 0xFFFF;
  const destAddr = getDE();
  const srcAddr = getHL();
  const value = getMem8(srcAddr);
  setMem8(destAddr, value);
  setBC(countAfter);
  setDE(update(destAddr) & 0xFFFF);
  setHL(update(srcAddr) & 0xFFFF);
  return countAfter;
  /* TODO flags */
}

/** CPIR */
export function CPIR() {
  const repeat = CPI();
  if (repeat) incPC(-2);
}

/** CPI */
export function CPI(): any {
  return cpx(value => value + 1);
}

/** CPDR */
export function CPDR() {
  const repeat = CPD();
  if (repeat) incPC(-2);
}

/** CPD */
export function CPD(): any {
  return cpx(value => value - 1);
}

function cpx(update: (value: number) => number): any {
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
