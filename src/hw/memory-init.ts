import { getCacheX, getDirect, initDirect } from './arrows.ts';
import { ATTRIBUTES_AFTER_ADDR, ATTRIBUTES_MIN_ADDR, RAM_MIN_ADDR, SCREEN_MIN_ADDR, xFFFF } from './constants.ts';
import { DIRTY_BITMAP_SIZE, dirtyBitmap, mem, memCacheX, memCtxX, memCtxY, setMemDirect } from './memory.ts';
import { cpuX, cpuY, memoryCommitFromAddr } from './state.ts';

let inited: boolean;

export function initMemory() {
  if (inited) return;
  inited = true;

  initDirect();

  const memoryX = cpuX - 272;
  const memoryY = cpuY + 32;

  for (let addr = 0; addr <= xFFFF; addr++)
    initAddrCtx(addr, memoryX, memoryY);

  // Mirror the first 8 bytes of ROM at addresses 0x10000–0x10007 so that PC can cross the 0xFFFF
  // boundary without an & 0xFFFF mask on every increment (see registers.ts).
  for (let i = 0; i < 8; i++) {
    memCtxX[0x10000 + i] = memCtxX[i];
    memCtxY[0x10000 + i] = memCtxY[i];
  }
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
  memCacheX[addr] = getCacheX(x, y);
}

let romFetched = false;

export function fetchMemory() {
  const fromAddr = romFetched ? RAM_MIN_ADDR : 0;

  for (let addr = fromAddr; addr <= xFFFF; addr++)
    mem[addr] = getDirect(memCtxX[addr], memCtxY[addr]);

  // Mirror the first 8 bytes of ROM
  if (!romFetched)
    for (let i = 0; i < 8; i++)
      mem[0x10000 + i] = mem[i];

  romFetched = true;
}

export function commitMemory() {
  for (let i = memoryCommitFromAddr >> 5; i < DIRTY_BITMAP_SIZE; i++) {
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
  data.fill(0);
  restoreMemory(fromAddr, data);
}

export function restoreMemory(fromAddr: number, data: number[]) {
  initMemory();

  data.forEach((value, i) => {
    const addr = fromAddr + i;
    mem[addr] = value;
    setMemDirect(addr, value);
  });

  // Mirror the first 8 bytes of ROM
  if (fromAddr < 8)
    for (let i = 0; i < 8; i++)
      mem[0x10000 + i] = mem[i];
}
