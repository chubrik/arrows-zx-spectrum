export let posA: Position;
export let posF: Position;
export let posB: Position;
export let posC: Position;
export let posD: Position;
export let posE: Position;
export let posH: Position;
export let posL: Position;
export let posAa: Position;
export let posFa: Position;
export let posBa: Position;
export let posCa: Position;
export let posDa: Position;
export let posEa: Position;
export let posHa: Position;
export let posLa: Position;
export let posIXh: Position;
export let posIXl: Position;
export let posIYh: Position;
export let posIYl: Position;
export let posSPh: Position;
export let posSPl: Position;
export let posPCh: Position;
export let posPCl: Position;
export let posI: Position;
export let posR: Position;
export let posIM1: Position;
export let posIM2: Position;
export let posIFF1: Position;
export let posIFF2: Position;
export let posHalt: Position;
export let posINT: Position;
export let posReg: (Position | 0)[]; // B, C, D, E, H, L, 0, A
export let posHXY: Position[];       // H, IXh, IYh
export let posLXY: Position[];       // L, IXl, IYl

export function initCpuStartPosition(chunkX: number, chunkY: number): Position {
  return posA = createPos(chunkX + 16, chunkY - 16);
}

export function initCpuPositions(chunkX: number, chunkY: number) {
  let { x, y } = initCpuStartPosition(chunkX, chunkY);

  posF = createPos(x, ++y);
  posB = createPos(x, ++y);
  posC = createPos(x, ++y);
  posD = createPos(x, ++y);
  posE = createPos(x, ++y);
  posH = createPos(x, ++y);
  posL = createPos(x, ++y);
  posIXh = createPos(x, ++y);
  posIXl = createPos(x, ++y);

  posSPh = createPos(x, y += 2);
  posSPl = createPos(x, ++y);
  posPCh = createPos(x, ++y);
  posPCl = createPos(x, ++y);

  posAa = createPos(x += 8, y = posA.y);
  posFa = createPos(x, ++y);
  posBa = createPos(x, ++y);
  posCa = createPos(x, ++y);
  posDa = createPos(x, ++y);
  posEa = createPos(x, ++y);
  posHa = createPos(x, ++y);
  posLa = createPos(x, ++y);
  posIYh = createPos(x, ++y);
  posIYl = createPos(x, ++y);

  posI = createPos(x, y += 2);
  posR = createPos(x, ++y);

  posIM1 = createPos(x, y += 2);
  posIM2 = createPos(++x, y);
  posIFF1 = createPos(x += 2, y);
  posIFF2 = createPos(++x, y);
  posHalt = createPos(x += 2, y);
  posINT = createPos(++x, y);

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
  const { x, y } = posA;
  world.copyRegion(x + 32, y, x + 47, y + 15, x, y);
  world.copyRegion(x, y, x + 15, y + 15, x - 32, y);
}

export function copyCpu() {
  const { x, y } = posA;
  world.copyRegion(x, y, x + 15, y + 15, x - 32, y);
}

function createPos(x: number, y: number): Position {
  return { x, y };
}
