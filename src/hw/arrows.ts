import { memCtxA, memCtxX, memCtxY } from './mem-state.ts';
import { world_getArrow, world_setArrow } from './world-refs.ts';

export type ArrowCtx = { x: number; y: number; a: number[]; };

export function getDirect(x: number, y: number): number {
  let value = 0;

  for (let i = 0; i < 8; i++) {
    value <<= 1;
    const arrow = world_getArrow(x + i, y);

    if (arrow && arrow.type >= 16)
      value |= 1;
  }

  return value;
}

export function setMemDirect(addr: number, value: number) {
  const x = memCtxX[addr];
  const y = memCtxY[addr];
  const arrowTypes = memCtxA[addr];
  /*! @__INLINE__ */ setDirect(x, y, arrowTypes, value);
}

export function setDirect(x: number, y: number, arrowTypes: number[], value: number) {
  for (let i = 7; i >= 0; i--) {
    const arrowType = arrowTypes[value & 1];
    world_setArrow(x + i, y, arrowType, 1);
    value >>= 1;
  }
}

export function createCtx(x: number, y: number): ArrowCtx {
  const xMod = x & 8;
  const yMod = y & 8;
  const arrowTypes = xMod === yMod ? arrowTypes1 : arrowTypes2;
  return { x, y, a: arrowTypes };
}

const arrowTypes1 = [10, 25];
const arrowTypes2 = [1, 18];
