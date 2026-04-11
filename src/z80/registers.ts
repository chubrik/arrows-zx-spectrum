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

/*! @__INLINE__ */ export function setA(value: number) { a = value; }
/*! @__INLINE__ */ export function setB(value: number) { b = value; }
/*! @__INLINE__ */ export function setC(value: number) { c = value; }
/*! @__INLINE__ */ export function setD(value: number) { d = value; }
/*! @__INLINE__ */ export function setE(value: number) { e = value; }

/*! @__INLINE__ */ export function setAa(value: number) { aa = value; }
/*! @__INLINE__ */ export function setFa(value: number) { fa = value; }
/*! @__INLINE__ */ export function setBa(value: number) { ba = value; }
/*! @__INLINE__ */ export function setCa(value: number) { ca = value; }
/*! @__INLINE__ */ export function setDa(value: number) { da = value; }
/*! @__INLINE__ */ export function setEa(value: number) { ea = value; }
/*! @__INLINE__ */ export function setHLa(value: number) { hla = value; }

/*! @__INLINE__ */ export function getBC() { return c | (b << 8); }
/*! @__INLINE__ */ export function setBC(value: number) { c = value & xFF; b = value >> 8; }
/*! @__INLINE__ */ export function incBC() { if (++c > xFF) { c = 0; b = (b + 1) & xFF; } }
/*! @__INLINE__ */ export function decBC() { if (--c < 0) { c = xFF; b = (b - 1) & xFF; } }

/*! @__INLINE__ */ export function getDE() { return e | (d << 8); }
/*! @__INLINE__ */ export function setDE(value: number) { e = value & xFF; d = value >> 8; }
/*! @__INLINE__ */ export function incDE() { if (++e > xFF) { e = 0; d = (d + 1) & xFF; } }
/*! @__INLINE__ */ export function decDE() { if (--e < 0) { e = xFF; d = (d - 1) & xFF; } }

/*! @__INLINE__ */ export function getHa() { return hla >> 8; }
/*! @__INLINE__ */ export function getLa() { return hla & xFF; }
/*! @__INLINE__ */ export function setHa(value: number) { hla = (hla & xFF) | (value << 8); }
/*! @__INLINE__ */ export function setLa(value: number) { hla = (hla & 0xFF00) | value; }

/*! @__INLINE__ */ export function setSP(value: number) { sp = value; }
/*! @__INLINE__ */ export function setPC(value: number) { pc = value; }
/*! @__INLINE__ */ export function incSP_() { return sp++; }
/*! @__INLINE__ */ export function incPC_() { return pc++; }
/*! @__INLINE__ */ export function normSP() { sp &= xFFFF; }
/*! @__INLINE__ */ export function normPC() { pc &= xFFFF; }

/*! @__INLINE__ */ export function setI(value: number) { i = value; }

export let r7 = 0;
export let ri = 0;
export function getR() { return (r7 & BIT7) | (ri &= 0x7F); }
export function setR(value: number) { r7 = ri = value; }
/*! @__INLINE__ */ export function refresh() { ri++; }

export let eiDelay: 0 | 1 = 0;
/*! @__INLINE__ */ export function setEIDelay(value: 0 | 1) { eiDelay = value; }

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

/*! @__INLINE__ */ export function setIXMode() { isXYMode = true; hl = hlxy; hlxy = ix; }
/*! @__INLINE__ */ export function setIYMode() { isXYMode = true; hl = hlxy; hlxy = iy; }
/*! @__INLINE__ */ export function unsetIXMode() { isXYMode = false; ix = hlxy; hlxy = hl; }
/*! @__INLINE__ */ export function unsetIYMode() { isXYMode = false; iy = hlxy; hlxy = hl; }

/*! @__INLINE__ */ export function setHLXY(value: number) { hlxy = value; }
/*! @__INLINE__ */ export function incHLXY() { hlxy = (hlxy + 1) & xFFFF; }
/*! @__INLINE__ */ export function decHLXY() { hlxy = (hlxy - 1) & xFFFF; }

/*! @__INLINE__ */ export function getHL() { return isXYMode ? hl : hlxy; }
/*! @__INLINE__ */ export function getHXY() { return hlxy >> 8; }
/*! @__INLINE__ */ export function getLXY() { return hlxy & xFF; }
/*! @__INLINE__ */ export function setHL(value: number) { hl = hlxy = value; }
/*! @__INLINE__ */ export function setHXY(value: number) { hlxy = (hlxy & xFF) | (value << 8); }
/*! @__INLINE__ */ export function setLXY(value: number) { hlxy = (hlxy & 0xFF00) | value; }

/*! @__INLINE__ */ export function getH() { return (isXYMode ? hl : hlxy) >> 8; }
/*! @__INLINE__ */ export function getL() { return (isXYMode ? hl : hlxy) & xFF; }
/*! @__INLINE__ */ export function getIXh() { return (isXYMode ? hlxy : ix) >> 8; }
/*! @__INLINE__ */ export function getIXl() { return (isXYMode ? hlxy : ix) & xFF; }
/*! @__INLINE__ */ export function getIYh() { return (isXYMode ? hlxy : iy) >> 8; }
/*! @__INLINE__ */ export function getIYl() { return (isXYMode ? hlxy : iy) & xFF; }

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
