import { BIT7, xFF } from '../common/constants';

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

export let sp = 0;
export let pc = 0;
/*! @__INLINE__ */ export function setSP(value: number) { sp = value; }
/*! @__INLINE__ */ export function setPC(value: number) { pc = value; }
/*! @__INLINE__ */ export function incSP() { return sp++; }
/*! @__INLINE__ */ export function incPC() { return pc++; }

export let HXY = H; // H / IXh / IYh
export let LXY = L; // L / IXl / IYl

/*! @__INLINE__ */
export function setHLXY(hlxy: number) {
  LXY = hlxy;
  HXY = hlxy + 1;
}

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
let wzh = 0;
let wzl = 0;
export function getWZh(): number { return wzh; }
export function setWZ(value: number) { wzl = value & xFF; wzh = value >> 8; }

export function get16(reg: number): number {
  return cpu[reg] | (cpu[reg + 1] << 8);
}

export function set16(reg: number, value: number) {
  cpu[reg] = value & xFF;
  cpu[reg + 1] = value >> 8;
}

export function set88(reg: number, valueLow: number, valueHigh: number) {
  cpu[reg] = valueLow;
  cpu[reg + 1] = valueHigh;
}

export { F as AF, C as BC, E as DE, L as HL, LXY as HLXY, IXl as IX, IYl as IY };

