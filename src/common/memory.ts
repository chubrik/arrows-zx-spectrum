import { type ArrowCtx, getDirect, setDirect } from './arrows.ts';
import { RAM_MIN_ADDR, xFFFF } from './constants.ts';

// Hot code!
// Any attempt to extract common parts leads to slowdown.

export const mem: number[] = [];
export const memCtx: ArrowCtx[] = [];
const DIRTY_BITMAP_SIZE = 2048; // 0x10000 >> 5
const dirtyBitmap = /* @__PURE__ */ new Uint32Array(DIRTY_BITMAP_SIZE); // "PURE" needs for correct minification

let ramMinAddr = RAM_MIN_ADDR;
export function setRamMinAddrForTest(value: number) { ramMinAddr = value; }

export function write88(addr: number, low: number, high: number) {
  if (addr < ramMinAddr) return;
  if (mem[addr] !== low) {
    mem[addr] = low;
    dirtyBitmap[addr >> 5] |= (1 << (addr & 31));
  }
  if (addr === xFFFF) return;
  if (mem[++addr] !== high) {
    mem[addr] = high;
    dirtyBitmap[addr >> 5] |= (1 << (addr & 31));
  }
}

export function write(addr: number, value: number) {
  if (addr < ramMinAddr) return;
  if (mem[addr] !== value) {
    mem[addr] = value;
    dirtyBitmap[addr >> 5] |= (1 << (addr & 31));
  }
}

export function fetchMemory() {
  for (let addr = 0; addr < memCtx.length; addr++) {
    const ctx = memCtx[addr];
    mem[addr] = getDirect(ctx.x, ctx.y);
  }
}

export function commitMemory() {
  for (let i = ramMinAddr >> 5; i < DIRTY_BITMAP_SIZE; i++) {
    let bits = dirtyBitmap[i];
    if (bits === 0) continue;
    dirtyBitmap[i] = 0;
    const base = i << 5;
    while (bits) {
      const bit = bits & -bits;
      const offset = 31 - Math.clz32(bit);
      const addr = base + offset;
      const value = mem[addr];
      const ctx = memCtx[addr];
      setDirect(ctx, value);
      bits ^= bit;
    }
  }
}
