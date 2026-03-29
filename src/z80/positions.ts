import { createInfo, infos, setDirect } from '../common/arrows';

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

export function initCpu(chunkX: number, chunkY: number) {
  let x = chunkX + 16;
  let y = chunkY - 16;

  infos[A] = createInfo(x, y);
  infos[F] = createInfo(x, ++y);
  infos[B] = createInfo(x, ++y);
  infos[C] = createInfo(x, ++y);
  infos[D] = createInfo(x, ++y);
  infos[E] = createInfo(x, ++y);
  infos[H] = createInfo(x, ++y);
  infos[L] = createInfo(x, ++y);
  infos[IXh] = createInfo(x, ++y);
  infos[IXl] = createInfo(x, ++y);

  infos[SPh] = createInfo(x, y += 2);
  infos[SPl] = createInfo(x, ++y);
  infos[PCh] = createInfo(x, ++y);
  infos[PCl] = createInfo(x, ++y);

  infos[Aa] = createInfo(x += 8, y = chunkY - 16);
  infos[Fa] = createInfo(x, ++y);
  infos[Ba] = createInfo(x, ++y);
  infos[Ca] = createInfo(x, ++y);
  infos[Da] = createInfo(x, ++y);
  infos[Ea] = createInfo(x, ++y);
  infos[Ha] = createInfo(x, ++y);
  infos[La] = createInfo(x, ++y);
  infos[IYh] = createInfo(x, ++y);
  infos[IYl] = createInfo(x, ++y);

  infos[I] = createInfo(x, y += 2);
  infos[R] = createInfo(x, ++y);
  infos[SYS] = createInfo(x, y + 2);
}

export function resetCpu() {
  for (let i = F; i <= SYS; i++)
    setDirect(i, 0);
}
