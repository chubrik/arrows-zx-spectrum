import { getMem8, setMem8 } from '../../common/utils';
import { bitFC, bitFH, bitFN, bitFPV, bitFS, bitFZ, getA, getBC, getDE, getF, getFC, getHL, incPC, maskF53, setBC, setDE, setF, setHL } from '../utils';

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
  const oldCount = getBC();
  const count = (oldCount - 1) & 0xFFFF;
  const destAddr = getDE();
  const srcAddr = getHL();
  const value = getMem8(srcAddr);
  setMem8(destAddr, value);
  setBC(count);
  setDE(update(destAddr) & 0xFFFF);
  setHL(update(srcAddr) & 0xFFFF);

  // F5/F3: bit 1 and bit 3 from n = A + value
  const n = (getA() + value) & 0xFF;

  setF(
    (getF() & (bitFS | bitFZ | bitFC))
    | (count ? bitFPV : 0)
    | (((n << 4) | n) & maskF53));

  return count;
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
  const oldCount = getBC();
  const count = (oldCount - 1) & 0xFFFF;
  const addr = getHL();
  const value = getMem8(addr);
  const a = getA();
  const diff = (a - value) & 0xFF;
  setBC(count);
  setHL(update(addr) & 0xFFFF);

  // F5/F3: bit 1 and bit 3 from n = result - H
  const halfCarry = (a ^ value ^ diff) & bitFH;
  const n = (diff - (halfCarry ? 1 : 0)) & 0xFF;

  setF(
    (diff & bitFS)
    | (diff ? 0 : bitFZ)
    | halfCarry
    | (count ? bitFPV : 0)
    | bitFN
    | (((n << 4) | n) & maskF53)
    | getFC());

  return count && diff;
}
