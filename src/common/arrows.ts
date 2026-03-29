type Info = { x: number; y: number; a: number[]; };

export const infos: Info[] = [];

export function getDirect(addr: number): number {
  const info = infos[addr];
  let value = 0;

  for (let i = 0; i < 8; i++) {
    value <<= 1;
    const arrow = world.getArrow(info.x + i, info.y);

    if (arrow && arrow.type >= 16)
      value |= 1;
  }

  return value;
}

export function setDirect(addr: number, value: number) {
  const info = infos[addr];

  for (let i = 7; i >= 0; i--) {
    const arrowType = info.a[value & 1];
    world.setArrow(info.x + i, info.y, arrowType, 1, false);
    value >>= 1;
  }
}

export function createInfo(x: number, y: number): Info {
  const xMod = x & 8;
  const yMod = y & 8;
  const arrowTypes = xMod === yMod ? arrowTypes1 : arrowTypes2;
  return { x, y, a: arrowTypes };
}

const arrowTypes1 = [10, 25];
const arrowTypes2 = [1, 18];
