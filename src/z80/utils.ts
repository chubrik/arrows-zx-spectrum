import { getMemPos, readMem16, readMem8, writeMem16 } from '../common/memory';
import { get1, get16, get8, set1, set16, set8 } from '../common/utils';
import { bitFC } from './flags';
import { getPosA, getPosB, getPosC, getPosD, getPosE, getPosF, getPosSPh, getPosSPl, initCpuPositions, posA, posB, posC, posD, posE, posF, posH, posHalt, posHXY, posI, posIFF1, posIFF2, posIM1, posIM2, posL, posLXY, posPCh, posPCl, posR, posReg, posSPh, posSPl } from './positions';
import { HLMode, QQSelect, RegSelect, RhlSelect, SSSelect } from './types';

export let hlMode = HLMode.HL;
export function setHLMode(mode: HLMode) { hlMode = mode; }

export function initCpu(chunkX: number, chunkY: number) {
  initCpuPositions(chunkX, chunkY);
}

export function getA(): number { return get8(posA); }
export function setA(value: number) { set8(posA, value); }
export function getF(): number { return get8(posF); }
export function setF(value: number) { set8(posF, value); }
export function getFC(): number { return get8(posF) & bitFC; }
export function getB(): number { return get8(posB); }
export function setB(value: number) { set8(posB, value); }
export function getC(): number { return get8(posC); }
export function setC(value: number) { set8(posC, value); }
export function getI(): number { return get8(posI); }
export function setI(value: number) { set8(posI, value); }
export function getR(): number { return get8(posR); }
export function setR(value: number) { set8(posR, value); }

export function getBC(): number { return get16(posB, posC); }
export function setBC(value: number) { set16(posB, posC, value); }
export function getDE(): number { return get16(posD, posE); }
export function setDE(value: number) { set16(posD, posE, value); }
export function getSP(): number { return get16(posSPh, posSPl); }
export function setSP(value: number) { set16(posSPh, posSPl, value); }

/** HL/IX/IY */
export function getHL(): number { return get16(getPosHXY(), getPosLXY()); }
/** HL/IX/IY */
export function setHL(value: number) { set16(getPosHXY(), getPosLXY(), value); }

/** B, C, D, E, H, L, 0, A */
export function getPosReg(select: RegSelect): Position | 0 { return posReg[select]; }

/** B, C, D, E, H/IXh/IYh, L/IXl/IYl, (HL/IX+d/IY+d), A */
export function getRhl(select: RhlSelect): number { return get8(getPosRhl(select)); }
/** B, C, D, E, H/IXh/IYh, L/IXl/IYl, (HL/IX+d/IY+d), A */
export function setRhl(select: RhlSelect, value: number) { set8(getPosRhl(select), value); }
/** B, C, D, E, H/IXh/IYh, L/IXl/IYl, (HL/IX+d/IY+d), A */
export function getPosRhl(select: RhlSelect): Position { return posRhl[select](); }
/** B, C, D, E, H/IXh/IYh, L/IXl/IYl, (HL/IX+d/IY+d), A */
const posRhl = [getPosB, getPosC, getPosD, getPosE, getPosHXY, getPosLXY, getPosHLXYd, getPosA];

/** BC, DE, HL/IX/IY, AF */
export function getQQ(select: QQSelect): number { return get16(posQQ[select](), posQQ[select + 1]()); }
/** BC, DE, HL/IX/IY, AF */
export function setQQ(select: QQSelect, value: number) { set16(posQQ[select](), posQQ[select + 1](), value); }
/** BC, DE, HL/IX/IY, AF */
const posQQ = [getPosB, getPosC, getPosD, getPosE, getPosHXY, getPosLXY, getPosA, getPosF];

/** BC, DE, HL/IX/IY, SP */
export function getSS(select: SSSelect): number { return get16(posSS[select](), posSS[select + 1]()); }
/** BC, DE, HL/IX/IY, SP */
export function setSS(select: SSSelect, value: number) { set16(posSS[select](), posSS[select + 1](), value); }
/** BC, DE, HL/IX/IY, SP */
const posSS = [getPosB, getPosC, getPosD, getPosE, getPosHXY, getPosLXY, getPosSPh, getPosSPl];

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
export function setIFF1(value: 0 | 1) { set1(posIFF1, value); }
export function getIFF2(): 0 | 1 { return get1(posIFF2); }
export function setIFF2(value: 0 | 1) { set1(posIFF2, value); }
export function getIM(): 0 | 1 | 2 { return get1(posIM2) ? 2 : get1(posIM1) ? 1 : 0; } //todo 1|2 → 0
export function setIM(value: 0 | 1 | 2) { set1(posIM1, value === 1 ? 1 : 0); set1(posIM2, value === 2 ? 1 : 0); }

let eiDelay: 0 | 1 = 0;
export function setEIDelay() { eiDelay = 1; }

export function getIFF1NotDelayed(): 0 | 1 {
  if (eiDelay) return eiDelay = 0;
  return get1(posIFF1);
}

//todo: Register WZ is not realized in the CPU state, but is used in some FUSE tests
let wz = 0;
export function getWZ(): number { return wz; }
export function setWZ(value: number) { wz = value; }

export function getPC(): number { return get16(posPCh, posPCl); }
export function setPC(value: number) { set16(posPCh, posPCl, value); }
export function incPC(add: number) { setPC((getPC() + add) & 0xFFFF); }

export function next16(): number {
  const valueLow = next8();
  const valueHigh = next8();
  return (valueHigh << 8) | valueLow;
}

export function next8(): number {
  const value = readMem8(getPC());
  incPC(1);
  return value;
}

export function refresh() {
  const r = getR();
  const newR = (r & 0x80) | ((r + 1) & 0x7F);
  setR(newR);
}

export function splitOp(op: number): { b76: number, b543: number, b210: number } {
  return {
    b76: op >> 6,
    b543: (op >> 3) & 0x7,
    b210: op & 0x7,
  };
}

/** (IX+d/IY+d) */
export function getAddrXYd(rawD: number): number {
  let hl = getHL() // IX/IY
  const d = rawD >= 128 ? rawD - 256 : rawD; // -128...+127
  return (hl + d) & 0xFFFF;
}

/** H/IXh/IYh */
function getPosHXY() { return posHXY[hlMode]; }

/** L/IXl/IYl */
function getPosLXY() { return posLXY[hlMode]; }

/** (HL/IX+d/IY+d) */
function getPosHLXYd() {
  if (hlMode === HLMode.HL) {
    const addr = get16(posH, posL);
    return getMemPos(addr);
  }
  else {
    const rawD = next8();
    const addr = getAddrXYd(rawD);
    return getMemPos(addr);
  }
}
