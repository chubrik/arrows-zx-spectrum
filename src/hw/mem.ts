import { getDirect, setMemDirect } from './arrows.ts';
import { ATTRIBUTES_AFTER_ADDR } from './constants.ts';
import { dirtyBitmap, mem, memCtxX, memCtxY } from './mem-state.ts';

const DIRTY_BITMAP_SIZE = 2048; // 0x10000 >> 5

export function fetchMemory() {
  for (let addr = 0; addr < memCtxX.length; addr++)
    mem[addr] = getDirect(memCtxX[addr], memCtxY[addr]);
}

export function commitMemory() {
  for (let i = ATTRIBUTES_AFTER_ADDR >> 5; i < DIRTY_BITMAP_SIZE; i++) {
    let bits = dirtyBitmap[i];
    if (bits === 0) continue;
    dirtyBitmap[i] = 0;
    const addrBase = i << 5;

    while (bits) {
      const bit = bits & -bits;
      const offset = 31 - Math.clz32(bit);
      bits ^= bit;

      const addr = addrBase + offset;
      setMemDirect(addr, mem[addr]);
    }
  }
}
