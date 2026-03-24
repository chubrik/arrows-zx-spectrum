import { packPos, unpackX, unpackY } from '../common/utils';

export let posA: number;
export let posF: number;
export let posB: number;
export let posC: number;
export let posD: number;
export let posE: number;
export let posH: number;
export let posL: number;
export let posAa: number;
export let posFa: number;
export let posBa: number;
export let posCa: number;
export let posDa: number;
export let posEa: number;
export let posHa: number;
export let posLa: number;
export let posIXh: number;
export let posIXl: number;
export let posIYh: number;
export let posIYl: number;
export let posSPh: number;
export let posSPl: number;
export let posPCh: number;
export let posPCl: number;
export let posI: number;
export let posR: number;
export let posIM1: number;
export let posIM2: number;
export let posIFF1: number;
export let posIFF2: number;
export let posHalt: number;
export let posINT: number;
export let posReg: (number | 0)[]; // B, C, D, E, H, L, 0, A
export let posHXY: number[];       // H, IXh, IYh
export let posLXY: number[];       // L, IXl, IYl

export function initCpuStartPosition(chunkX: number, chunkY: number): number {
  const x = chunkX + 16;
  const y = chunkY - 16;
  posA = packPos(x, y);
  return posA;
}

export function initCpuPositions(chunkX: number, chunkY: number) {
  initCpuStartPosition(chunkX, chunkY);
  let x = chunkX + 16;
  let y = chunkY - 16;

  posF = packPos(x, ++y);
  posB = packPos(x, ++y);
  posC = packPos(x, ++y);
  posD = packPos(x, ++y);
  posE = packPos(x, ++y);
  posH = packPos(x, ++y);
  posL = packPos(x, ++y);
  posIXh = packPos(x, ++y);
  posIXl = packPos(x, ++y);

  posSPh = packPos(x, y += 2);
  posSPl = packPos(x, ++y);
  posPCh = packPos(x, ++y);
  posPCl = packPos(x, ++y);

  posAa = packPos(x += 8, y = chunkY - 16);
  posFa = packPos(x, ++y);
  posBa = packPos(x, ++y);
  posCa = packPos(x, ++y);
  posDa = packPos(x, ++y);
  posEa = packPos(x, ++y);
  posHa = packPos(x, ++y);
  posLa = packPos(x, ++y);
  posIYh = packPos(x, ++y);
  posIYl = packPos(x, ++y);

  posI = packPos(x, y += 2);
  posR = packPos(x, ++y);

  posIM1 = packPos(x, y += 2);
  posIM2 = packPos(++x, y);
  posIFF1 = packPos(x += 2, y);
  posIFF2 = packPos(++x, y);
  posHalt = packPos(x += 2, y);
  posINT = packPos(++x, y);

  posReg = [posB, posC, posD, posE, posH, posL, 0, posA];
  posHXY = [posH, posIXh, posIYh];
  posLXY = [posL, posIXl, posIYl];
}

export const getPosA = () => posA;
export const getPosF = () => posF;
export const getPosB = () => posB;
export const getPosC = () => posC;
export const getPosD = () => posD;
export const getPosE = () => posE;
export const getPosH = () => posH;
export const getPosL = () => posL;
export const getPosSPh = () => posSPh;
export const getPosSPl = () => posSPl;

export function resetCpu() {
  const x = unpackX(posA);
  const y = unpackY(posA);
  world.copyRegion(x + 32, y, x + 47, y + 15, x, y);
  world.copyRegion(x, y, x + 15, y + 15, x - 32, y);
}

export function copyCpu() {
  const x = unpackX(posA);
  const y = unpackY(posA);
  world.copyRegion(x, y, x + 15, y + 15, x - 32, y);
}
