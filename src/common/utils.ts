const RAM_MIN_ADDR = 0x4000;
const RAM_MAX_ADDR = 0xFFFF;
let memoryX: number;
let memoryY: number;

export function initMemory(chunkX: number, chunkY: number) {
  memoryX = chunkX + 16;
  memoryY = chunkY + 16;
}

export function getMem16(addr: number): number {
  const valueLow = getMem8(addr);
  const valueHigh = getMem8((addr + 1) & 0xFFFF);
  return (valueHigh << 8) | valueLow;
}

export function setMem16(addr: number, value: number) {
  setMem8(addr, value & 0xFF);
  setMem8((addr + 1) & 0xFFFF, value >> 8);
}

export function getMem8(addr: number): number {
  const memPos = getMemPos(addr);
  return get8(memPos);
}

export function setMem8(addr: number, value: number) {
  if (addr >= RAM_MIN_ADDR && addr <= RAM_MAX_ADDR) {
    const memPos = getMemPos(addr);
    set8(memPos, value);
  }
}

export function getMemPos(addr: number): Position {
  const xShift = ((addr & 0xC000) >> 14) * 272;

  // 8x8 blocks:
  const x = memoryX + (addr & 0xF8) + xShift;
  const y = memoryY + ((addr & 0x3F00) >> 5) + (addr & 0x7);

  // Line by line:
  // const x = memoryX + (addr & 0x1F) * 8 + xShift;
  // const y = memoryY + ((addr & 0x3FFF) >> 5);

  return { x, y };
}

export function get16(posHigh: Position, posLow: Position): number {
  const valueLow = get8(posLow);
  const valueHigh = get8(posHigh);
  return (valueHigh << 8) | valueLow;
}

export function set16(posHigh: Position, posLow: Position, value: number) {
  set8(posLow, value & 0xFF);
  set8(posHigh, value >> 8);
}

export function get8(pos: Position): number {
  let value = 0;
  for (let i = 7; i >= 0; i--) {
    const arrow = world.getArrow(pos.x + i, pos.y);
    if (arrow && arrow.type >= 16)
      value |= 1 << i;
  }
  return value;
}

export function set8(pos: Position, value: number) {
  const arrowTypes = getArrowTypes(pos);
  for (let i = 7; i >= 0; i--) {
    const bit = (value >> i) & 1;
    const arrowType = arrowTypes[bit];
    world.setArrow(pos.x + i, pos.y, arrowType, 1, false);
  }
}

export function get1(pos: Position): 0 | 1 {
  const arrow = world.getArrow(pos.x, pos.y);
  return arrow && arrow.type >= 16 ? 1 : 0;
}

export function set1(pos: Position, bit: 0 | 1) {
  const arrowTypes = getArrowTypes(pos);
  const arrowType = arrowTypes[bit];
  world.setArrow(pos.x, pos.y, arrowType, 1, false);
}

function getArrowTypes(pos: Position): number[] {
  const xMod = pos.x & 0x8;
  const yMod = pos.y & 0x8;
  return xMod === yMod ? arrowTypes1 : arrowTypes2;
}

const arrowTypes1 = [10, 25];
const arrowTypes2 = [1, 18];

// export function get8(pos: Position): number {
//   const arrow = world.getArrow(pos.x, pos.y);
//   if (!arrow) return 0;
//   let type = arrow.type;
//   if (type > 30) type--;
//   const typePart = (type - 1) << 3;
//   const rotationPart = arrow.rotation << 1;
//   const flipPart = arrow.flip ? 1 : 0;
//   const value = typePart | rotationPart | flipPart;
//   return value;
// }

// export function set8(pos: Position, value: number) {
//   let type = 1 + (value >> 3);
//   if (value === 0) type = 0;
//   if (type > 30) type++;
//   const rotation = (value & 0x7) >> 1;
//   const flip = (value & 0x1) !== 0;
//   world.setArrow(pos.x, pos.y, type, rotation, flip);
// }

export function check(condition: boolean, message: string = 'Check failed') {
  if (!condition)
    throw new Error(message);
}
