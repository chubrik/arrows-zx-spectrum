import { type ArrowCtx, getDirect, setDirect } from './arrows.ts';

// Hot code!
// Any attempt to extract common parts leads to slowdown.

export const mems: number[] = [];
export const memsCtx: ArrowCtx[] = [];
const DIRTY_BITMAP_SIZE = 2048; // 0x10000 >> 5
const dirtyBitmap = new Uint32Array(DIRTY_BITMAP_SIZE);

let ramMinAddr = 0x4000;
export function setRamMinAddrForTest(value: number) { ramMinAddr = value; }

export function write88(addr: number, low: number, high: number) {
  if (addr < ramMinAddr) return;
  if (mems[addr] !== low) {
    mems[addr] = low;
    dirtyBitmap[addr >> 5] |= (1 << (addr & 31));
  }
  if (addr === 0xFFFF) return;
  if (mems[++addr] !== high) {
    mems[addr] = high;
    dirtyBitmap[addr >> 5] |= (1 << (addr & 31));
  }
}

export function write(addr: number, value: number) {
  if (addr < ramMinAddr) return;
  if (mems[addr] !== value) {
    mems[addr] = value;
    dirtyBitmap[addr >> 5] |= (1 << (addr & 31));
  }
}

export function fetchMemory() {
  for (let addr = 0; addr < memsCtx.length; addr++) {
    const ctx = memsCtx[addr];
    mems[addr] = getDirect(ctx);
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
      const value = mems[addr];
      const ctx = memsCtx[addr];
      setDirect(ctx, value);
      bits ^= bit;
    }
  }
}
