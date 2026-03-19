import { getMemPos, readMem16, readMem8, writeMem16 } from '../common/memory';
import { get1, get16, get8, set1, set16, set8 } from '../common/utils';
import { bitFC } from './flags';
import { initCpuPositions, posA, posB, posC, posD, posE, posF, posH, posHalt, posI, posIFF1, posIFF2, posIM1, posIM2, posIXh, posIXl, posIYh, posIYl, posL, posPCh, posPCl, posR, posSPh, posSPl } from './positions';
import { HLMode, QQSelect, RegSelect, RhlSelect, SSSelect } from './types';

export let hlMode = HLMode.HL;
export function setHLMode(mode: HLMode) { hlMode = mode; }
export let posReg: (Position | null)[];

export function initCpu(chunkX: number, chunkY: number) {
  initCpuPositions(chunkX, chunkY);
  posReg = [posB, posC, posD, posE, posH, posL, null, posA];
}

export function getF(): number { return get8(posF); }
export function setF(value: number) { set8(posF, value); }
export function getFC(): number { return get8(posF) & bitFC; }
export function getA(): number { return get8(posA); }
export function setA(value: number) { set8(posA, value); }
export function getB(): number { return get8(posB); }
export function setB(value: number) { set8(posB, value); }
export function getC(): number { return get8(posC); }
export function setC(value: number) { set8(posC, value); }
export function getI(): number { return get8(posI); }
export function setI(value: number) { set8(posI, value); }

export function getBC(): number { return get16(posB, posC); }
export function setBC(value: number) { set16(posB, posC, value); }
export function getDE(): number { return get16(posD, posE); }
export function setDE(value: number) { set16(posD, posE, value); }
export function getSP(): number { return get16(posSPh, posSPl); }
export function setSP(value: number) { set16(posSPh, posSPl, value); }

/** HL/IX/IY */
export function getHL(): number { return get16(getPosH(), getPosL()); }
/** HL/IX/IY */
export function setHL(value: number) { set16(getPosH(), getPosL(), value); }

/** B, C, D, E, H/IXh/IYh, L/IXl/IYl, (HL/IX+d/IY+d), A */
export function getRhl(select: RhlSelect): number { return get8(posRhl[select]()); }
/** B, C, D, E, H/IXh/IYh, L/IXl/IYl, (HL/IX+d/IY+d), A */
export function setRhl(select: RhlSelect, value: number) { set8(posRhl[select](), value); }

/** BC, DE, HL/IX/IY, AF */
export function getQQ(select: QQSelect): number { return get16(posQQ[select](), posQQ[select + 1]()); }
/** BC, DE, HL/IX/IY, AF */
export function setQQ(select: QQSelect, value: number) { set16(posQQ[select](), posQQ[select + 1](), value); }

/** BC, DE, HL/IX/IY, SP */
export function getSS(select: SSSelect): number { return get16(posSS[select](), posSS[select + 1]()); }
/** BC, DE, HL/IX/IY, SP */
export function setSS(select: SSSelect, value: number) { set16(posSS[select](), posSS[select + 1](), value); }

export function push16(value: number) {
  const oldSP = getSP();
  const sp = (oldSP - 2) & 0xFFFF;
  setSP(sp);
  writeMem16(sp, value);
}

export function pop16(): number {
  const oldSP = getSP();
  const value = readMem16(oldSP);
  const sp = (oldSP + 2) & 0xFFFF;
  setSP(sp);
  return value;
}

export function getHalt(): 0 | 1 { return get1(posHalt); }
export function setHalt(value: 0 | 1) { set1(posHalt, value); }
export function getIFF1(): 0 | 1 { return get1(posIFF1); }
export function setIFF1(value: 0 | 1) { set1(posIFF1, value); }
export function getIFF2(): 0 | 1 { return get1(posIFF2); }
export function setIFF2(value: 0 | 1) { set1(posIFF2, value); }
export function getIM(): 0 | 1 | 2 { return get1(posIM2) ? 2 : get1(posIM1) ? 1 : 0; }
export function setIM(value: 0 | 1 | 2) { set1(posIM1, value === 1 ? 1 : 0); set1(posIM2, value === 2 ? 1 : 0); }

let startR: number;
let currentR: number;
let startPC: number;
let currentPC: number;

export function fetchRegs() {
  startR = currentR = get8(posR);
  startPC = currentPC = get16(posPCh, posPCl);
}

export function commitRegs() {
  if (currentR !== startR) set8(posR, currentR);
  if (currentPC !== startPC) set16(posPCh, posPCl, currentPC);
}

export function getR(): number { return currentR; }
export function setR(value: number) { currentR = value; }
export function getPC(): number { return currentPC; }
export function setPC(value: number) { currentPC = value; }
export function incPC(add: number) { currentPC = (currentPC + add) & 0xFFFF; }

export function next16(): number {
  const valueLow = next8();
  const valueHigh = next8();
  return (valueHigh << 8) | valueLow;
}

export function next8(): number {
  const value = readMem8(currentPC);
  currentPC = (currentPC + 1) & 0xFFFF;
  return value;
}

export function splitOp(op: number): { b76: number, b543: number, b210: number } {
  return {
    b76: op >> 6,
    b543: (op >> 3) & 0x7,
    b210: op & 0x7,
  };
}

export function refresh() {
  currentR = (currentR & 0x80) | ((currentR + 1) & 0x7F)
}

/** B, C, D, E, H/IXh/IYh, L/IXl/IYl, (HL/IX+d/IY+d), A */
export function getPosRhl(select: RhlSelect): Position {
  return posRhl[select]();
}

/** B, C, D, E, H, L, null, A */
export function getPosReg(select: RegSelect): Position | null {
  return posReg[select];
}

/** B, C, D, E, H/IXh/IYh, L/IXl/IYl, (HL/IX+d/IY+d), A */
const posRhl: (() => Position)[] = [
  () => posB,
  () => posC,
  () => posD,
  () => posE,
  getPosH, // H/IXh/IYh
  getPosL, // L/IXl/IYl
  () => { // (HL/IX+d/IY+d)
    if (hlMode === HLMode.HL) {
      const addr = get16(posH, posL);
      return getMemPos(addr);
    }
    else {
      let rawD = next8();
      return getMemPosIXIYd(rawD);
    }
  },
  () => posA,
];

/** (IX+d/IY+d) */
export function getMemPosIXIYd(rawD: number): Position {
  let addr = getHL() // IX/IY
  const d = rawD >= 128 ? rawD - 256 : rawD; // -128...+127
  addr = (addr + d) & 0xFFFF;
  return getMemPos(addr);
}

/** BC, DE, HL/IX/IY, AF */
const posQQ: (() => Position)[] = [
  () => posB,
  () => posC,
  () => posD,
  () => posE,
  getPosH, // H/IXh/IYh
  getPosL, // L/IXl/IYl
  () => posA,
  () => posF,
];

/** BC, DE, HL/IX/IY, SP */
const posSS: (() => Position)[] = [
  () => posB,
  () => posC,
  () => posD,
  () => posE,
  getPosH, // H/IXh/IYh
  getPosL, // L/IXl/IYl
  () => posSPh,
  () => posSPl,
];

/** H/IXh/IYh */
function getPosH() {
  if (hlMode === HLMode.IX) return posIXh;
  if (hlMode === HLMode.IY) return posIYh;
  return posH;
}

/** L/IXl/IYl */
function getPosL() {
  if (hlMode === HLMode.IX) return posIXl;
  if (hlMode === HLMode.IY) return posIYl;
  return posL;
}

