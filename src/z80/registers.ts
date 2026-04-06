import { BIT7, xFF } from '../hw/constants';

export const cpu: number[] = [];
export const cpuCtxX: number[] = [];
export const cpuCtxY: number[] = [];
export const cpuCtxA: number[][] = [];

export const F = 0;
export const A = 1;
export const C = 2;
export const B = 3;
export const E = 4;
export const D = 5;
export const L = 6;
export const H = 7;
export const Fa = 8;
export const Aa = 9;
export const Ca = 10;
export const Ba = 11;
export const Ea = 12;
export const Da = 13;
export const La = 14;
export const Ha = 15;
export const IXl = 16;
export const IXh = 17;
export const IYl = 18;
export const IYh = 19;
export const I = 20;
export const R = 21;
export const SYS = 22;

export const SP = 23;
export const PC = 24;

export let a = 0;
export let b = 0;
export let c = 0;
export let d = 0;
export let e = 0;
export let aa = 0;
export let ba = 0;
export let ca = 0;
export let da = 0;
export let ea = 0;
/*! @__INLINE__ */ export function setA(value: number) { a = value; }
/*! @__INLINE__ */ export function setB(value: number) { b = value; }
/*! @__INLINE__ */ export function setC(value: number) { c = value; }
/*! @__INLINE__ */ export function setD(value: number) { d = value; }
/*! @__INLINE__ */ export function setE(value: number) { e = value; }
/*! @__INLINE__ */ export function setAa(value: number) { aa = value; }
/*! @__INLINE__ */ export function setBa(value: number) { ba = value; }
/*! @__INLINE__ */ export function setCa(value: number) { ca = value; }
/*! @__INLINE__ */ export function setDa(value: number) { da = value; }
/*! @__INLINE__ */ export function setEa(value: number) { ea = value; }

/*! @__INLINE__ */ export function getBC() { return c | (b << 8); }
/*! @__INLINE__ */ export function getDE() { return e | (d << 8); }
/*! @__INLINE__ */ export function setBC(value: number) { c = value & xFF; b = value >> 8; }
/*! @__INLINE__ */ export function setDE(value: number) { e = value & xFF; d = value >> 8; }

export let sp = 0;
export let pc = 0;
/*! @__INLINE__ */ export function setSP(value: number) { sp = value; }
/*! @__INLINE__ */ export function setPC(value: number) { pc = value; }
/*! @__INLINE__ */ export function incSP() { return sp++; }
/*! @__INLINE__ */ export function incPC() { return pc++; }

export let HXY = H; // H / IXh / IYh
export let LXY = L; // L / IXl / IYl
/*! @__INLINE__ */ export function setHLMode() { LXY = L; HXY = H; }
/*! @__INLINE__ */ export function setIXMode() { LXY = IXl; HXY = IXh; }
/*! @__INLINE__ */ export function setIYMode() { LXY = IYl; HXY = IYh; }

/*! @__INLINE__ */ export function getHL() { return cpu[L] | (cpu[H] << 8); }
/*! @__INLINE__ */ export function setHL(value: number) { cpu[L] = value & xFF; cpu[H] = value >> 8; }
/*! @__INLINE__ */ export function getHLXY() { return cpu[LXY] | (cpu[HXY] << 8); }
/*! @__INLINE__ */ export function setHLXY(value: number) { cpu[LXY] = value & xFF; cpu[HXY] = value >> 8; }

export let r7 = 0;
export let ri = 0;
/*! @__INLINE__ */ export function refresh() { ri++; }

export function unpackR(value: number) {
  r7 = ri = value;
}

export function packR(): number {
  return (r7 & BIT7) | (ri &= 0x7F);
}

export let eiDelay: 0 | 1 = 0;
/*! @__INLINE__ */ export function setEIDelay(value: 0 | 1) { eiDelay = value; }

//todo: Register WZ is not realized in the CPU state, but is used in some FUSE tests
export let wzh = 0;
let wzl = 0;
export function setWZ(value: number) { wzl = value & xFF; wzh = value >> 8; }
