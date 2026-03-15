import { get1, get16, get8, getMem8, getMemPos, set1, set16, set8 } from '../common/utils';
import { HLMode, QQSelect, RhlSelect, SSSelect } from './types';

let F: Position;
let A: Position;
let B: Position;
let C: Position;
let D: Position;
let E: Position;
let H: Position;
let L: Position;
let Fa: Position;
let Aa: Position;
let Ba: Position;
let Ca: Position;
let Da: Position;
let Ea: Position;
let Ha: Position;
let La: Position;
let IXh: Position;
let IXl: Position;
let IYh: Position;
let IYl: Position;
let SPh: Position;
let SPl: Position;
let PCh: Position;
let PCl: Position;
let I: Position;
let R: Position;
let Hlt: Position;

let hlMode = HLMode.HL;
export function setHLMode(mode: HLMode) { hlMode = mode; }

export function initCpu(chunkX: number, chunkY: number) {
  const cpuX = chunkX + 16;
  const cpuY = chunkY - 16;

  F = createPos(cpuX, cpuY);
  A = createPos(cpuX, cpuY + 1);
  B = createPos(cpuX, cpuY + 2);
  C = createPos(cpuX, cpuY + 3);
  D = createPos(cpuX, cpuY + 4);
  E = createPos(cpuX, cpuY + 5);
  H = createPos(cpuX, cpuY + 6);
  L = createPos(cpuX, cpuY + 7);

  Fa = createPos(cpuX + 8, cpuY);
  Aa = createPos(cpuX + 8, cpuY + 1);
  Ba = createPos(cpuX + 8, cpuY + 2);
  Ca = createPos(cpuX + 8, cpuY + 3);
  Da = createPos(cpuX + 8, cpuY + 4);
  Ea = createPos(cpuX + 8, cpuY + 5);
  Ha = createPos(cpuX + 8, cpuY + 6);
  La = createPos(cpuX + 8, cpuY + 7);

  IXh = createPos(cpuX, cpuY + 8);
  IXl = createPos(cpuX, cpuY + 9);
  IYh = createPos(cpuX, cpuY + 10);
  IYl = createPos(cpuX, cpuY + 11);
  SPh = createPos(cpuX, cpuY + 12);
  SPl = createPos(cpuX, cpuY + 13);
  PCh = createPos(cpuX, cpuY + 14);
  PCl = createPos(cpuX, cpuY + 15);

  I = createPos(cpuX + 8, cpuY + 8);
  R = createPos(cpuX + 8, cpuY + 9);

  Hlt = createPos(cpuX + 8, cpuY + 10);
}

export function getRegA(): number { return get8(A); }
export function setRegA(value: number) { set8(A, value); }
export function getRegI(): number { return get8(I); }
export function setRegI(value: number) { set8(I, value); }

export function getRegBC(): number { return get16(B, C); }
export function setRegBC(value: number) { set16(B, C, value); }
export function getRegDE(): number { return get16(D, E); }
export function setRegDE(value: number) { set16(D, E, value); }
/** HL/IX/IY */
export function getRegHL(): number { return get16(getH(), getL()); }
/** HL/IX/IY */
export function setRegHL(value: number) { set16(getH(), getL(), value); }
export function getRegSP(): number { return get16(SPh, SPl); }
export function setRegSP(value: number) { set16(SPh, SPl, value); }

export function getRegHlt(): boolean { return get1(Hlt); }
export function setRegHlt(value: boolean) { set1(Hlt, value); }

/** B, C, D, E, H/IXh/IYh, L/IXl/IYl, (HL/IX+d/IY+d), A */
export function getRegRhl(select: RhlSelect): number { return get8(Rhl[select]()); }
/** B, C, D, E, H/IXh/IYh, L/IXl/IYl, (HL/IX+d/IY+d), A */
export function setRegRhl(select: RhlSelect, value: number) { set8(Rhl[select](), value); }

/** BC, DE, HL/IX/IY, AF */
export function getRegQQ(select: QQSelect): number { return get16(QQ[select](), QQ[select + 1]()); }
/** BC, DE, HL/IX/IY, AF */
export function setRegQQ(select: QQSelect, value: number) { set16(QQ[select](), QQ[select + 1](), value); }

/** BC, DE, HL/IX/IY, SP */
export function getRegSS(select: SSSelect): number { return get16(SS[select](), SS[select + 1]()); }
/** BC, DE, HL/IX/IY, SP */
export function setRegSS(select: SSSelect, value: number) { set16(SS[select](), SS[select + 1](), value); }

let RStart: number;
let RCurrent: number;
let PCStart: number;
let PCCurrent: number;

export function fetchRegs() {
  RStart = RCurrent = get8(R);
  PCStart = PCCurrent = get16(PCh, PCl);
}

export function commitRegs() {
  if (RCurrent !== RStart) set8(R, RCurrent);
  if (PCCurrent !== PCStart) set16(PCh, PCl, PCCurrent);
}

export function getRegR(): number { return RCurrent; }
export function setRegR(value: number) { RCurrent = value; }
export function getRegPC(): number { return PCCurrent; }
export function setRegPC(value: number) { PCCurrent = value; }

export function nextPC16(): number {
  const valueLow = nextPC8();
  const valueHigh = nextPC8();
  return (valueHigh << 8) | valueLow;
}

export function nextPC8(): number {
  const value = getMem8(PCCurrent);
  PCCurrent = (PCCurrent + 1) & 0xFFFF;
  return value;
}

export function refresh() {
  RCurrent = (RCurrent & 0x80) | ((RCurrent + 1) & 0x7F)
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

/** H/IXh/IYh */
function getH() {
  if (hlMode === HLMode.IX) return IXh;
  if (hlMode === HLMode.IY) return IYh;
  return H;
}

/** L/IXl/IYl */
function getL() {
  if (hlMode === HLMode.IX) return IXl;
  if (hlMode === HLMode.IY) return IYl;
  return L;
}

/** B, C, D, E, H/IXh/IYh, L/IXl/IYl, (HL/IX+d/IY+d), A */
const Rhl: (() => Position)[] = [
  () => B,
  () => C,
  () => D,
  () => E,
  getH, // H/IXh/IYh
  getL, // L/IXl/IYl
  () => { // (HL/IX+d/IY+d)
    let addr = get16(getH(), getL()); // HL/IX/IY

    if (hlMode !== HLMode.HL) {
      let d = nextPC8();
      if (d >= 128) d -= 256;
      addr = (addr + d) & 0xFFFF;
    }
    return getMemPos(addr);
  },
  () => A,
];

/** BC, DE, HL/IX/IY, AF */
const QQ: (() => Position)[] = [
  () => B,
  () => C,
  () => D,
  () => E,
  getH, // H/IXh/IYh
  getL, // L/IXl/IYl
  () => A,
  () => F,
];

/** BC, DE, HL/IX/IY, SP */
const SS: (() => Position)[] = [
  () => B,
  () => C,
  () => D,
  () => E,
  getH, // H/IXh/IYh
  getL, // L/IXl/IYl
  () => SPh,
  () => SPl,
];

function createPos(x: number, y: number): Position {
  return { x, y };
}
