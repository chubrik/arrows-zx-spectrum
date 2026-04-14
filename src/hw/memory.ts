import { setDirect } from './arrows.ts';
import { RAM_MIN_ADDR, xFFFF } from './constants.ts';

export const mem: number[] = [];
export const memCtxX: number[] = [];
export const memCtxY: number[] = [];
export const memCacheX: number[] = [];
export const DIRTY_BITMAP_SIZE = 2048; // 0x10000 >> 5
export const dirtyBitmap = /* @__PURE__ */ new Uint32Array(DIRTY_BITMAP_SIZE);

let ramMinAddr = RAM_MIN_ADDR;
export function setRamMinAddrForTest(value: number) { ramMinAddr = value; }

export function read16(addr: number): number {
  /*!inline*/
  return mem[addr] | (mem[addr + 1] << 8);
}

export function write16(addr: number, value: number) {
  /*!inline*/
  write88(addr, value & 0xFF, value >> 8);
}

export function write88(addr: number, lo: number, hi: number) {
  if (addr < ramMinAddr) return;
  writeBase(addr, lo);
  if (++addr > xFFFF) return;
  writeBase(addr, hi);
}

export function write(addr: number, value: number) {
  if (addr < ramMinAddr) return;
  writeBase(addr, value);
}

function writeBase(addr: number, value: number) {
  /*!inline*/
  if (mem[addr] !== value) {
    mem[addr] = value;
    dirtyBitmap[addr >> 5] |= 1 << addr; // "& 31" not needed
  }
}

export function setMemDirect(addr: number, value: number) {
  /*!inline*/
  const x = memCtxX[addr];
  const y = memCtxY[addr];
  const cacheX = memCacheX[addr];
  setDirect(x, y, cacheX, value);
}
