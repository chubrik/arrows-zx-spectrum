import { readMem8, writeMem8 } from '../../common/memory';
import { bitFC, bitFH, bitFN, bitFPV, bitFS, bitFZ, maskF53 } from '../flags';
import { getA, getBC, getDE, getF, getFC, getHL, incPC, setBC, setDE, setF, setHL } from '../utils';

/** LDI */
export function LDI() {
  ldx(+1);
}

/** LDIR */
export function LDIR() {
  ldx(+1, true);
}

/** LDD */
export function LDD() {
  ldx(-1);
}

/** LDDR */
export function LDDR() {
  ldx(-1, true);
}

/** CPI */
export function CPI() {
  cpx(+1);
}

/** CPIR */
export function CPIR() {
  cpx(+1, true);
}

/** CPD */
export function CPD() {
  cpx(-1);
}

/** CPDR */
export function CPDR() {
  cpx(-1, true);
}

function ldx(increment: 1 | -1, repeat: boolean = false) {
  const oldCount = getBC();
  const count = (oldCount - 1) & 0xFFFF;
  const destAddr = getDE();
  const srcAddr = getHL();
  const value = readMem8(srcAddr);
  writeMem8(destAddr, value);
  setBC(count);
  setDE((destAddr + increment) & 0xFFFF);
  setHL((srcAddr + increment) & 0xFFFF);

  // F5 = bit 1 of n
  // F3 = bit 3 of n, where n = A + value
  const n = (getA() + value) & 0xFF;
  const f53 = ((n & 0x02) << 4) | (n & 0x08);

  setF(
    (getF() & (bitFS | bitFZ | bitFC))
    | (count ? bitFPV : 0)
    | f53);

  if (repeat && count)
    incPC(-2);
}

function cpx(increment: 1 | -1, repeat: boolean = false) {
  const oldCount = getBC();
  const count = (oldCount - 1) & 0xFFFF;
  const addr = getHL();
  const value = readMem8(addr);
  const a = getA();
  const diff = (a - value) & 0xFF;
  setBC(count);
  setHL((addr + increment) & 0xFFFF);

  // F5 = bit 1 of n
  // F3 = bit 3 of n, where n = diff - halfCarry
  const halfCarry = (a ^ value ^ diff) & bitFH;
  const n = (diff - (halfCarry ? 1 : 0)) & 0xFF;
  const f53 = ((n & 0x02) << 4) | (n & 0x08);

  setF(
    (diff & bitFS)
    | (diff ? 0 : bitFZ)
    | halfCarry
    | (count ? bitFPV : 0)
    | bitFN
    | f53
    | getFC());

  if (repeat && count && diff)
    incPC(-2);
}
