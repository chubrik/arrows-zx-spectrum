export function check(condition: boolean, message: string = 'Check failed') {
  if (!condition)
    throw new Error(message);
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
