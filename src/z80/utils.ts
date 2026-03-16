import { get1, get16, get8, getMem8, getMemPos, set1, set16, set8 } from '../common/utils';
import { HLMode, QQSelect, RhlSelect, SSSelect } from './types';

let posF: Position;
let posA: Position;
let posB: Position;
let posC: Position;
let posD: Position;
let posE: Position;
let posH: Position;
let posL: Position;
let posFa: Position;
let posAa: Position;
let posBa: Position;
let posCa: Position;
let posDa: Position;
let posEa: Position;
let posHa: Position;
let posLa: Position;
let posIXh: Position;
let posIXl: Position;
let posIYh: Position;
let posIYl: Position;
let posSPh: Position;
let posSPl: Position;
let posPCh: Position;
let posPCl: Position;
let posI: Position;
let posR: Position;
let posHalted: Position;
let posBitDest: (Position | null)[];

export let hlMode = HLMode.HL;
export function setHLMode(mode: HLMode) { hlMode = mode; }

export function initCpu(chunkX: number, chunkY: number) {
  const cpuX = chunkX + 16;
  const cpuY = chunkY - 16;

  posF = createPos(cpuX, cpuY);
  posA = createPos(cpuX, cpuY + 1);
  posB = createPos(cpuX, cpuY + 2);
  posC = createPos(cpuX, cpuY + 3);
  posD = createPos(cpuX, cpuY + 4);
  posE = createPos(cpuX, cpuY + 5);
  posH = createPos(cpuX, cpuY + 6);
  posL = createPos(cpuX, cpuY + 7);
  posFa = createPos(cpuX + 8, cpuY);
  posAa = createPos(cpuX + 8, cpuY + 1);
  posBa = createPos(cpuX + 8, cpuY + 2);
  posCa = createPos(cpuX + 8, cpuY + 3);
  posDa = createPos(cpuX + 8, cpuY + 4);
  posEa = createPos(cpuX + 8, cpuY + 5);
  posHa = createPos(cpuX + 8, cpuY + 6);
  posLa = createPos(cpuX + 8, cpuY + 7);
  posIXh = createPos(cpuX, cpuY + 8);
  posIXl = createPos(cpuX, cpuY + 9);
  posIYh = createPos(cpuX, cpuY + 10);
  posIYl = createPos(cpuX, cpuY + 11);
  posSPh = createPos(cpuX, cpuY + 12);
  posSPl = createPos(cpuX, cpuY + 13);
  posPCh = createPos(cpuX, cpuY + 14);
  posPCl = createPos(cpuX, cpuY + 15);
  posI = createPos(cpuX + 8, cpuY + 8);
  posR = createPos(cpuX + 8, cpuY + 9);
  posHalted = createPos(cpuX + 8, cpuY + 10);
  posBitDest = [posB, posC, posD, posE, posH, posL, null, posA];
}

export function getA(): number { return get8(posA); }
export function setA(value: number) { set8(posA, value); }
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

export function getHalted(): boolean { return get1(posHalted); }
export function setHalted(value: boolean) { set1(posHalted, value); }

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

export function next16(): number {
  const valueLow = next8();
  const valueHigh = next8();
  return (valueHigh << 8) | valueLow;
}

export function next8(): number {
  const value = getMem8(currentPC);
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

export function copyCPU() {
  /* TODO */
  // const topLeft = { x: 0, y: 0 };
  // const bottomRight = { x: topLeft.x + 15, y: topLeft.y + 15 };
  // world.copyRegion(topLeft.x, topLeft.y, bottomRight.x, bottomRight.y, topLeft.x - 32, topLeft.y);
}

export function interrupt() {
  /* TODO */
}

/** B, C, D, E, H/IXh/IYh, L/IXl/IYl, (HL/IX+d/IY+d), A */
export function getPosRhl(select: RhlSelect): Position {
  return posRhl[select]();
}

/** B, C, D, E, H, L, null, A */
export function getPosBitDest(select: RhlSelect): Position | null {
  return posBitDest[select];
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
  const d = rawD >= 128 ? rawD - 256 : rawD; // -128..+127
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

function createPos(x: number, y: number): Position {
  return { x, y };
}
