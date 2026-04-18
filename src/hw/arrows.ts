import { cpuX, cpuY } from './state.ts';
import { world_copyRegion, world_getArrow } from './world-refs.ts';

let inited: boolean;
let cacheX0: number;
let cacheX1: number;
let cacheY: number;

export function initDirect() {
  if (inited) return;
  inited = true;

  cacheX0 = cpuX - 304;
  cacheX1 = cacheX0 + 8;
  cacheY = cpuY + 32;
}

export function getCacheX(x: number, y: number): number {
  const xMod = x & 8;
  const yMod = y & 8;
  return xMod === yMod ? cacheX0 : cacheX1;
}

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

export function setDirect(x: number, y: number, cacheX: number, value: number) {
  /*!inline*/
  const valueCacheY = cacheY + value;
  world_copyRegion(cacheX, valueCacheY, cacheX + 7, valueCacheY, x, y);
}
