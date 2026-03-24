let readonlyMaxX: number;
let readonlyMinY: number;

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
  for (const [pos, byte] of update8) {
    const initByte = init8.get(pos);
    if (byte === initByte) continue;
    const x = unpackX(pos);
    const y = unpackY(pos);
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

  for (const [pos, bit] of update1) {
    const initBit = init1.get(pos);
    if (bit === initBit) continue;
    const x = unpackX(pos);
    const y = unpackY(pos);
    const arrowTypes = getArrowTypes(x, y);
    world.setArrow(x, y, arrowTypes[bit], 1, false);
  }
}

export function packPos(x: number, y: number): number {
  return ((x + 1024) << 11) | (y + 1024);
}

export function unpackX(pos: number): number {
  return (pos >> 11) - 1024;
}

export function unpackY(pos: number): number {
  return (pos & 0x7FF) - 1024;
}

export function get16(posHigh: number, posLow: number): number {
  const valueLow = get8(posLow);
  const valueHigh = get8(posHigh);
  return (valueHigh << 8) | valueLow;
}

export function set16(posHigh: number, posLow: number, value: number) {
  set8(posLow, value & 0xFF);
  set8(posHigh, value >> 8);
}

export function get8(pos: number): number {
  const cached = update8.get(pos);
  if (cached !== undefined) return cached;

  const x = unpackX(pos);
  const y = unpackY(pos);
  let byte = 0;

  for (let i = 0; i < 8; i++) {
    const arrow = world.getArrow(x + i, y);

    if (arrow && arrow.type >= 16)
      byte |= 1 << (7 - i);
  }

  init8.set(pos, byte);
  update8.set(pos, byte);
  return byte;
}

export function set8Direct(pos: number, value: number) {
  const x = unpackX(pos);
  const y = unpackY(pos);
  const arrowTypes = getArrowTypes(x, y);
  for (let i = 0; i < 8; i++) {
    const bit = (value >> (7 - i)) & 1;
    const arrowType = arrowTypes[bit];
    world.setArrow(x + i, y, arrowType, 1, false);
  }
}

export function set8(pos: number, byte: number) {
  const x = unpackX(pos);
  if (x < readonlyMaxX) {
    const y = unpackY(pos);
    if (y >= readonlyMinY) return;
  }
  update8.set(pos, byte);
}

export function get1(pos: number): 0 | 1 {
  const cached = update1.get(pos);
  if (cached !== undefined) return cached;

  const x = unpackX(pos);
  const y = unpackY(pos);
  const arrow = world.getArrow(x, y);
  const bit = arrow && arrow.type >= 16 ? 1 : 0;

  init1.set(pos, bit);
  update1.set(pos, bit);
  return bit;
}

export function set1Direct(pos: number, bit: 0 | 1) {
  const x = unpackX(pos);
  const y = unpackY(pos);
  const arrowTypes = getArrowTypes(x, y);
  world.setArrow(x, y, arrowTypes[bit], 1, false);
}

export function set1(pos: number, bit: 0 | 1) {
  const x = unpackX(pos);
  if (x < readonlyMaxX) {
    const y = unpackY(pos);
    if (y >= readonlyMinY) return;
  }
  update1.set(pos, bit);
}

function getArrowTypes(x: number, y: number): number[] {
  const xMod = x & 0x8;
  const yMod = y & 0x8;
  return xMod === yMod ? arrowTypes1 : arrowTypes2;
}

const arrowTypes1 = [10, 25];
const arrowTypes2 = [1, 18];
