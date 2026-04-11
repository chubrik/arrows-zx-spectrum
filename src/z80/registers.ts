import { BIT7, xFF, xFFFF } from '../hw/constants';

export let a = 0;
export let b = 0;
export let c = 0;
export let d = 0;
export let e = 0;
export let sp = 0;
export let pc = 0;
export let aa = 0;
export let fa = 0;
export let ba = 0;
export let ca = 0;
export let da = 0;
export let ea = 0;
export let hla = 0;
export let i = 0;

export function setA(value: number) { /*!inline*/ a = value; }
export function setB(value: number) { /*!inline*/ b = value; }
export function setC(value: number) { /*!inline*/ c = value; }
export function setD(value: number) { /*!inline*/ d = value; }
export function setE(value: number) { /*!inline*/ e = value; }

export function setAa(value: number) { /*!inline*/ aa = value; }
export function setFa(value: number) { /*!inline*/ fa = value; }
export function setBa(value: number) { /*!inline*/ ba = value; }
export function setCa(value: number) { /*!inline*/ ca = value; }
export function setDa(value: number) { /*!inline*/ da = value; }
export function setEa(value: number) { /*!inline*/ ea = value; }
export function setHLa(value: number) { /*!inline*/ hla = value; }

export function getBC() { /*!inline*/ return c | (b << 8); }
export function setBC(value: number) { /*!inline*/ c = value & xFF; b = value >> 8; }
export function incBC() { /*!inline*/ if (++c > xFF) { c = 0; b = (b + 1) & xFF; } }
export function decBC() { /*!inline*/ if (--c < 0) { c = xFF; b = (b - 1) & xFF; } }

export function getDE() { /*!inline*/ return e | (d << 8); }
export function setDE(value: number) { /*!inline*/ e = value & xFF; d = value >> 8; }
export function incDE() { /*!inline*/ if (++e > xFF) { e = 0; d = (d + 1) & xFF; } }
export function decDE() { /*!inline*/ if (--e < 0) { e = xFF; d = (d - 1) & xFF; } }

export function getHa() { /*!inline*/ return hla >> 8; }
export function getLa() { /*!inline*/ return hla & xFF; }
export function setHa(value: number) { /*!inline*/ hla = (hla & xFF) | (value << 8); }
export function setLa(value: number) { /*!inline*/ hla = (hla & 0xFF00) | value; }

export function setSP(value: number) { /*!inline*/ sp = value; }
export function setPC(value: number) { /*!inline*/ pc = value; }
export function incSP_() { /*!inline*/ return sp++; }
export function incPC_() { /*!inline*/ return pc++; }
export function normSP() { /*!inline*/ sp &= xFFFF; }
export function normPC() { /*!inline*/ pc &= xFFFF; }

export function setI(value: number) { /*!inline*/ i = value; }

export let r7 = 0;
export let ri = 0;
export function getR() { return (r7 & BIT7) | (ri &= 0x7F); }
export function setR(value: number) { r7 = ri = value; }
export function refresh() { /*!inline*/ ri++; }

export let eiDelay: 0 | 1 = 0;
export function setEIDelay(value: 0 | 1) { /*!inline*/ eiDelay = value; }

//todo: Register WZ is not realized in the CPU state, but is used in some FUSE tests
export let wzh = 0;
let wzl = 0;
export function setWZ(value: number) { wzl = value & xFF; wzh = value >> 8; }

//#region HL / IX / IY

export let isXYMode = false;
export let hlxy = 0;
let hl = 0;
let ix = 0;
let iy = 0;

export function setIXMode() { /*!inline*/ isXYMode = true; hl = hlxy; hlxy = ix; }
export function setIYMode() { /*!inline*/ isXYMode = true; hl = hlxy; hlxy = iy; }
export function unsetIXMode() { /*!inline*/ isXYMode = false; ix = hlxy; hlxy = hl; }
export function unsetIYMode() { /*!inline*/ isXYMode = false; iy = hlxy; hlxy = hl; }

export function setHLXY(value: number) { /*!inline*/ hlxy = value; }
export function incHLXY() { /*!inline*/ hlxy = (hlxy + 1) & xFFFF; }
export function decHLXY() { /*!inline*/ hlxy = (hlxy - 1) & xFFFF; }

export function getHL() { /*!inline*/ return isXYMode ? hl : hlxy; }
export function getHXY() { /*!inline*/ return hlxy >> 8; }
export function getLXY() { /*!inline*/ return hlxy & xFF; }
export function setHL(value: number) { /*!inline*/ hl = hlxy = value; }
export function setHXY(value: number) { /*!inline*/ hlxy = (hlxy & xFF) | (value << 8); }
export function setLXY(value: number) { /*!inline*/ hlxy = (hlxy & 0xFF00) | value; }

export function getH() { /*!inline*/ return (isXYMode ? hl : hlxy) >> 8; }
export function getL() { /*!inline*/ return (isXYMode ? hl : hlxy) & xFF; }
export function getIXh() { /*!inline*/ return (isXYMode ? hlxy : ix) >> 8; }
export function getIXl() { /*!inline*/ return (isXYMode ? hlxy : ix) & xFF; }
export function getIYh() { /*!inline*/ return (isXYMode ? hlxy : iy) >> 8; }
export function getIYl() { /*!inline*/ return (isXYMode ? hlxy : iy) & xFF; }

export function setIX(value: number) { /*!inline*/ ix = value; }
export function setIY(value: number) { /*!inline*/ iy = value; }

export function setH(value: number) {
  if (isXYMode) hl = (hl & xFF) | (value << 8);
  else hlxy = (hlxy & xFF) | (value << 8);
}

export function setL(value: number) {
  if (isXYMode) hl = (hl & 0xFF00) | value;
  else hlxy = (hlxy & 0xFF00) | value;
}

export function setIXh(value: number) {
  if (isXYMode) hlxy = (hlxy & xFF) | (value << 8);
  else ix = (ix & xFF) | (value << 8);
}

export function setIXl(value: number) {
  if (isXYMode) hlxy = (hlxy & 0xFF00) | value;
  else ix = (ix & 0xFF00) | value;
}

export function setIYh(value: number) {
  if (isXYMode) hlxy = (hlxy & xFF) | (value << 8);
  else iy = (iy & xFF) | (value << 8);
}

export function setIYl(value: number) {
  if (isXYMode) hlxy = (hlxy & 0xFF00) | value;
  else iy = (iy & 0xFF00) | value;
}

//#endregion
