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
export let ha = 0;
export let la = 0;
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
/*! @__INLINE__ */ export function setHa(value: number) { ha = value; }
/*! @__INLINE__ */ export function setLa(value: number) { la = value; }

/*! @__INLINE__ */ export function getBC() { return c | (b << 8); }
/*! @__INLINE__ */ export function setBC(value: number) { c = value & xFF; b = value >> 8; }
/*! @__INLINE__ */ export function incBC() { if (++c > xFF) { c = 0; b = (b + 1) & xFF; } }
/*! @__INLINE__ */ export function decBC() { if (--c < 0) { c = xFF; b = (b - 1) & xFF; } }

/*! @__INLINE__ */ export function getDE() { return e | (d << 8); }
/*! @__INLINE__ */ export function setDE(value: number) { e = value & xFF; d = value >> 8; }
/*! @__INLINE__ */ export function incDE() { if (++e > xFF) { e = 0; d = (d + 1) & xFF; } }
/*! @__INLINE__ */ export function decDE() { if (--e < 0) { e = xFF; d = (d - 1) & xFF; } }

/*! @__INLINE__ */ export function getH() { return hlxy[H]; }
/*! @__INLINE__ */ export function getL() { return hlxy[L]; }
/*! @__INLINE__ */ export function setH(value: number) { hlxy[H] = value; }
/*! @__INLINE__ */ export function setL(value: number) { hlxy[L] = value; }

/*! @__INLINE__ */ export function getIXh() { return hlxy[IXh]; }
/*! @__INLINE__ */ export function getIXl() { return hlxy[IXl]; }
/*! @__INLINE__ */ export function setIXh(value: number) { hlxy[IXh] = value; }
/*! @__INLINE__ */ export function setIXl(value: number) { hlxy[IXl] = value; }

/*! @__INLINE__ */ export function getIYh() { return hlxy[IYh]; }
/*! @__INLINE__ */ export function getIYl() { return hlxy[IYl]; }
/*! @__INLINE__ */ export function setIYh(value: number) { hlxy[IYh] = value; }
/*! @__INLINE__ */ export function setIYl(value: number) { hlxy[IYl] = value; }

/*! @__INLINE__ */ export function setSP(value: number) { sp = value; }
/*! @__INLINE__ */ export function setPC(value: number) { pc = value; }
/*! @__INLINE__ */ export function incSP_() { return sp++; }
/*! @__INLINE__ */ export function incPC_() { return pc++; }
/*! @__INLINE__ */ export function normSP() { sp &= xFFFF; }
/*! @__INLINE__ */ export function normPC() { pc &= xFFFF; }

/*! @__INLINE__ */ export function setI(value: number) { i = value; }

//todo inline
const L = 0;
const H = 1;
const IXl = 2;
const IXh = 3;
const IYl = 4;
const IYh = 5;
const hlxy: number[] = [];

let LXY = L; // L / IXl / IYl
/*! @__INLINE__ */ export function setHLMode() { LXY = L; }
/*! @__INLINE__ */ export function setIXMode() { LXY = IXl; }
/*! @__INLINE__ */ export function setIYMode() { LXY = IYl; }
/*! @__INLINE__ */ export function isXYMode(): number { return LXY; }

/*! @__INLINE__ */ export function getLXY() { return hlxy[LXY]; }
/*! @__INLINE__ */ export function getHXY() { return hlxy[LXY + 1]; }
/*! @__INLINE__ */ export function setLXY(value: number) { hlxy[LXY] = value; }
/*! @__INLINE__ */ export function setHXY(value: number) { hlxy[LXY + 1] = value; }

/*! @__INLINE__ */ export function getHL() { return hlxy[L] | (hlxy[H] << 8); }
/*! @__INLINE__ */ export function setHL(value: number) { hlxy[L] = value & xFF; hlxy[H] = value >> 8; }
/*! @__INLINE__ */ export function getHLXY() { return hlxy[LXY] | (hlxy[LXY + 1] << 8); }
/*! @__INLINE__ */ export function setHLXY(value: number) { hlxy[LXY] = value & xFF; hlxy[LXY + 1] = value >> 8; }
/*! @__INLINE__ */ export function incHLXY() { if (++hlxy[LXY] > xFF) { hlxy[LXY] = 0; hlxy[LXY + 1] = (hlxy[LXY + 1] + 1) & xFF; } }
/*! @__INLINE__ */ export function decHLXY() { if (--hlxy[LXY] < 0) { hlxy[LXY] = xFF; hlxy[LXY + 1] = (hlxy[LXY + 1] - 1) & xFF; } }

export let r7 = 0;
export let ri = 0;
export function getR(): number { return (r7 & BIT7) | (ri &= 0x7F); }
export function setR(value: number) { r7 = ri = value; }
/*! @__INLINE__ */ export function refresh() { ri++; }

export let eiDelay: 0 | 1 = 0;
/*! @__INLINE__ */ export function setEIDelay(value: 0 | 1) { eiDelay = value; }

//todo: Register WZ is not realized in the CPU state, but is used in some FUSE tests
export let wzh = 0;
let wzl = 0;
export function setWZ(value: number) { wzl = value & xFF; wzh = value >> 8; }
