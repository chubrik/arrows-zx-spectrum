import { type ArrowCtx, getDirect, setDirect } from './arrows.ts';
import { ATTRIBUTES_MIN_ADDR, RAM_MIN_ADDR, xFFFF } from './constants.ts';
import { commitScreen } from './screen.ts';

export const mem: number[] = [];
export const memCtx: ArrowCtx[] = [];
const DIRTY_BITMAP_SIZE = 2048; // 0x10000 >> 5
export const dirtyBitmap = /* @__PURE__ */ new Uint32Array(DIRTY_BITMAP_SIZE); // "PURE" needs for correct minification

let ramMinAddr = RAM_MIN_ADDR;
export function setRamMinAddrForTest(value: number) { ramMinAddr = value; }

export function write88(addr: number, low: number, high: number) {
  if (addr < ramMinAddr) return;
  writeBase(addr, low);
  if (addr === xFFFF) return;
  addr++;
  writeBase(addr, high);
}

export function write(addr: number, value: number) {
  if (addr < ramMinAddr) return;
  writeBase(addr, value);
}

/*! @__INLINE__ */
function writeBase(addr: number, value: number) {
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
  commitScreen();

  for (let i = ATTRIBUTES_MIN_ADDR >> 5; i < DIRTY_BITMAP_SIZE; i++) {
    let bits = dirtyBitmap[i];
    if (bits === 0) continue;
    dirtyBitmap[i] = 0;
    const addrBase = i << 5;

    while (bits) {
      const bit = bits & -bits;
      const offset = 31 - Math.clz32(bit);
      bits ^= bit;

      const addr = addrBase + offset;
      const value = mem[addr];
      const ctx = memCtx[addr];
      setDirect(ctx.x, ctx.y, ctx.a, value);
    }
  }
}
