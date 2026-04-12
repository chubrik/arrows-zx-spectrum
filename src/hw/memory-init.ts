import { getArrowTypes, getDirect, setMemDirect } from './arrows.ts';
import { ATTRIBUTES_AFTER_ADDR, ATTRIBUTES_MIN_ADDR, RAM_MIN_ADDR, SCREEN_MIN_ADDR, xFFFF } from './constants.ts';
import { DIRTY_BITMAP_SIZE, dirtyBitmap, mem, memCtxA, memCtxX, memCtxY } from './memory.ts';
import { cpuX, cpuY } from './state.ts';

let inited = false;

export function initMemory() {
  if (inited) return;
  inited = true;

  const memoryX = cpuX - 272;
  const memoryY = cpuY + 32;

  for (let addr = 0; addr <= xFFFF; addr++)
    initAddrCtx(addr, memoryX, memoryY);

  // Mirror 0x0000 address for easier access to byte pairs
  memCtxX[0x10000] = memCtxX[0];
  memCtxY[0x10000] = memCtxY[0];
  memCtxA[0x10000] = memCtxA[0];
}

function initAddrCtx(addr: number, memoryX: number, memoryY: number) {
  const xShift = ((addr & 0xC000) >> 14) * 272;
  let x, y: number;

  if (addr >= SCREEN_MIN_ADDR && addr < ATTRIBUTES_MIN_ADDR) {
    // Pretty screen
    x = memoryX + ((addr & 0x1F) << 3) + xShift;
    y = memoryY + ((addr & 0x1800) >> 5) + ((addr & 0x0700) >> 8) + ((addr & 0xE0) >> 2);
  }
  else if (addr >= ATTRIBUTES_MIN_ADDR && addr < ATTRIBUTES_AFTER_ADDR) {
    // Line by line:
    x = memoryX + ((addr & 0x1F) << 3) + xShift;
    y = memoryY + ((addr & 0x3FFF) >> 5);
  }
  else {
    // 8x8 blocks:
    x = memoryX + (addr & 0xF8) + xShift;
    y = memoryY + ((addr & 0x3F00) >> 5) + (addr & 0x7);
  }

  memCtxX[addr] = x;
  memCtxY[addr] = y;
  memCtxA[addr] = getArrowTypes(x, y);
}

let romFetched = false;

export function fetchMemory() {
  const fromAddr = romFetched ? RAM_MIN_ADDR : 0;
  romFetched = true;

  for (let addr = fromAddr; addr <= xFFFF; addr++)
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

export function clearMemory(fromAddr: number, toAddr: number) {
  const data: number[] = [];
  data.length = toAddr - fromAddr + 1;
  restoreMemory(fromAddr, data);
}

export function restoreMemory(fromAddr: number, data: number[]) {
  initMemory();

  for (let i = 0; i < data.length; i++) {
    const addr = fromAddr + i;
    const value = data[i];
    mem[addr] = value;
    setMemDirect(addr, value);
  }
}
