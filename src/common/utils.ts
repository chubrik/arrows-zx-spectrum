export let readonlyMaxX: number;
export let readonlyMinY: number;

export function setReadonly(x: number, y: number) {
  readonlyMaxX = x;
  readonlyMinY = y;
}

export function check(condition: boolean, message: string = 'Check failed') {
  if (!condition)
    throw new Error(message);
}

const init8 = new Map<number, number>();
const update8 = new Map<number, number>();
const init1 = new Map<number, 0 | 1>();
const update1 = new Map<number, 0 | 1>();

export function resetCache() {
  init8.clear();
  update8.clear();
  init1.clear();
  update1.clear();
}

export function applyCache() {
  for (const [key, byte] of update8) {
    const initByte = init8.get(key);
    if (byte === initByte) continue;
    const x = (key >> 11) - 1024;
    const y = (key & 0x7FF) - 1024;
    const arrowTypes = getArrowTypes(x, y);

    for (let i = 0; i < 8; i++) {
      const bit = (byte >> (7 - i)) & 1;

      if (initByte !== undefined) {
        const initBit = (initByte! >> (7 - i)) & 1;
        if (bit === initBit) continue;
      }

      world.setArrow(x + i, y, arrowTypes[bit], 1, false);
    }
  }

  for (const [key, bit] of update1) {
    const initBit = init1.get(key);
    if (bit === initBit) continue;
    const x = (key >> 11) - 1024;
    const y = (key & 0x7FF) - 1024;
    const arrowTypes = getArrowTypes(x, y);
    world.setArrow(x, y, arrowTypes[bit], 1, false);
  }
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
  const key = getKey(pos);

  if (update8.has(key))
    return update8.get(key)!;

  let byte = 0;

  for (let i = 0; i < 8; i++) {
    const arrow = world.getArrow(pos.x + i, pos.y);

    if (arrow && arrow.type >= 16)
      byte |= 1 << (7 - i);
  }

  init8.set(key, byte);
  update8.set(key, byte);
  return byte;
}

export function set8Direct(pos: Position, value: number) {
  const arrowTypes = getArrowTypes(pos.x, pos.y);
  for (let i = 0; i < 8; i++) {
    const bit = (value >> (7 - i)) & 1;
    const arrowType = arrowTypes[bit];
    world.setArrow(pos.x + i, pos.y, arrowType, 1, false);
  }
}

export function set8(pos: Position, byte: number) {
  if (pos.x < readonlyMaxX && pos.y >= readonlyMinY) return;
  const key = getKey(pos);
  update8.set(key, byte);
}

export function get1(pos: Position): 0 | 1 {
  const key = getKey(pos);

  if (update1.has(key))
    return update1.get(key) as 0 | 1;

  const arrow = world.getArrow(pos.x, pos.y);
  const bit = arrow && arrow.type >= 16 ? 1 : 0;

  init1.set(key, bit);
  update1.set(key, bit);
  return bit;
}

export function set1(pos: Position, bit: 0 | 1) {
  if (pos.x < readonlyMaxX && pos.y >= readonlyMinY) return;
  const key = getKey(pos);
  update1.set(key, bit);
}

function getKey(pos: Position): number {
  return ((pos.x + 1024) << 11) | (pos.y + 1024);
}

function getArrowTypes(x: number, y: number): number[] {
  const xMod = x & 0x8;
  const yMod = y & 0x8;
  return xMod === yMod ? arrowTypes1 : arrowTypes2;
}

const arrowTypes1 = [10, 25];
const arrowTypes2 = [1, 18];
