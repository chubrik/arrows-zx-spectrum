export const A = 0x10002;
export const F = 0x10001;
export const B = 0x10004;
export const C = 0x10003;
export const D = 0x10006;
export const E = 0x10005;
export const H = 0x10008;
export const L = 0x10007;
export const Aa = 0x1000A;
export const Fa = 0x10009;
export const Ba = 0x1000C;
export const Ca = 0x1000B;
export const Da = 0x1000E;
export const Ea = 0x1000D;
export const Ha = 0x10010;
export const La = 0x1000F;
export const IXh = 0x10012;
export const IXl = 0x10011;
export const IYh = 0x10014;
export const IYl = 0x10013;
export const SPh = 0x10016;
export const SPl = 0x10015;
export const PCh = 0x10018;
export const PCl = 0x10017;
export const I = 0x10019;
export const R = 0x1001A;
export const SYS = 0x1001B;

export let HXY = H; // H / IXh / IYh
export let LXY = L; // L / IXl / IYl

export function setHLXY(hlxy: number) {
  LXY = hlxy;
  HXY = hlxy + 1;
}

export { F as AF, C as BC, E as DE, L as HL, LXY as HLXY, IXl as IX, IYl as IY, PCl as PC, SPl as SP };
