export let posF: Position;
export let posA: Position;
export let posB: Position;
export let posC: Position;
export let posD: Position;
export let posE: Position;
export let posH: Position;
export let posL: Position;
export let posFa: Position;
export let posAa: Position;
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

export function initCpuStartPosition(chunkX: number, chunkY: number): Position {
  return posF = createPos(chunkX + 16, chunkY - 16);
}

export function initCpuPositions(chunkX: number, chunkY: number) {
  let { x, y } = initCpuStartPosition(chunkX, chunkY);

  posF = createPos(x, y);
  posA = createPos(x, ++y);
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

  posFa = createPos(x += 8, y = posF.y);
  posAa = createPos(x, ++y);
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
}

export function resetCpu() {
  const { x, y } = posF;
  world.copyRegion(x + 32, y, x + 47, y + 15, x, y);
  world.copyRegion(x, y, x + 15, y + 15, x - 32, y);
}

export function copyCpu() {
  const { x, y } = posF;
  world.copyRegion(x, y, x + 15, y + 15, x - 32, y);
}

function createPos(x: number, y: number): Position {
  return { x, y };
}
