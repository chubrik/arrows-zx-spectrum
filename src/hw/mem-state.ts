import { RAM_MIN_ADDR, xFFFF } from './constants.ts';

export const mem: number[] = [];
export const memCtxX: number[] = [];
export const memCtxY: number[] = [];
export const memCtxA: number[][] = [];
const DIRTY_BITMAP_SIZE = 2048; // 0x10000 >> 5
export const dirtyBitmap = /* @__PURE__ */ new Uint32Array(DIRTY_BITMAP_SIZE);

let ramMinAddr = RAM_MIN_ADDR;
export function setRamMinAddrForTest(value: number) { ramMinAddr = value; }

export function write16(addr: number, lo: number, hi: number) {
  if (addr < ramMinAddr) return;
  writeBase(addr, lo);
  if (addr === xFFFF) return;
  addr++;
  writeBase(addr, hi);
}

export function write(addr: number, value: number) {
  if (addr < ramMinAddr) return;
  writeBase(addr, value);
}

/*! @__INLINE__ */
function writeBase(addr: number, value: number) {
  if (mem[addr] !== value) {
    mem[addr] = value;
    dirtyBitmap[addr >> 5] |= 1 << addr;
  }
}
