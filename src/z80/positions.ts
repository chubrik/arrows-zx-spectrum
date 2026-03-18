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
export let posHalt: Position;
export let posIFF1: Position;
export let posIFF2: Position;
export let posIM1: Position;
export let posIM2: Position;
export let posReg: (Position | null)[];

export function initCpu(chunkX: number, chunkY: number) {
  const cpuX = chunkX + 16;
  const cpuY = chunkY - 16;

  posF = createPos(cpuX, cpuY);
  posA = createPos(cpuX, cpuY + 1);
  posB = createPos(cpuX, cpuY + 2);
  posC = createPos(cpuX, cpuY + 3);
  posD = createPos(cpuX, cpuY + 4);
  posE = createPos(cpuX, cpuY + 5);
  posH = createPos(cpuX, cpuY + 6);
  posL = createPos(cpuX, cpuY + 7);
  posFa = createPos(cpuX + 8, cpuY);
  posAa = createPos(cpuX + 8, cpuY + 1);
  posBa = createPos(cpuX + 8, cpuY + 2);
  posCa = createPos(cpuX + 8, cpuY + 3);
  posDa = createPos(cpuX + 8, cpuY + 4);
  posEa = createPos(cpuX + 8, cpuY + 5);
  posHa = createPos(cpuX + 8, cpuY + 6);
  posLa = createPos(cpuX + 8, cpuY + 7);
  posIXh = createPos(cpuX, cpuY + 8);
  posIXl = createPos(cpuX, cpuY + 9);
  posIYh = createPos(cpuX, cpuY + 10);
  posIYl = createPos(cpuX, cpuY + 11);
  posSPh = createPos(cpuX, cpuY + 12);
  posSPl = createPos(cpuX, cpuY + 13);
  posPCh = createPos(cpuX, cpuY + 14);
  posPCl = createPos(cpuX, cpuY + 15);
  posI = createPos(cpuX + 8, cpuY + 8);
  posR = createPos(cpuX + 8, cpuY + 9);
  posHalt = createPos(cpuX + 8, cpuY + 10);
  posIFF1 = createPos(cpuX + 8, cpuY + 11);
  posIFF2 = createPos(cpuX + 8, cpuY + 12);
  posIM1 = createPos(cpuX + 8, cpuY + 13);
  posIM2 = createPos(cpuX + 8, cpuY + 14);
  posReg = [posB, posC, posD, posE, posH, posL, null, posA];
}

function createPos(x: number, y: number): Position {
  return { x, y };
}
