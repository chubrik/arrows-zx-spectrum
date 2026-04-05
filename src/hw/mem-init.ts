import { createCtx, setMemDirect } from './arrows.ts';
import { ATTRIBUTES_AFTER_ADDR, ATTRIBUTES_MIN_ADDR, SCREEN_MIN_ADDR, xFFFF } from './constants.ts';
import { memCtxA, memCtxX, memCtxY } from './mem-state.ts';

export function initMemory(chunkX: number, chunkY: number) {
  const memoryX = chunkX - 240;
  const memoryY = chunkY + 32;

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

    y += 16;
  }
  else {
    // 8x8 blocks:
    x = memoryX + (addr & 0xF8) + xShift;
    y = memoryY + ((addr & 0x3F00) >> 5) + (addr & 0x7);

    if (addr >= ATTRIBUTES_MIN_ADDR && addr < 0x8000)
      y += 16;
  }

  const ctx = createCtx(x, y);
  memCtxX[addr] = ctx.x;
  memCtxY[addr] = ctx.y;
  memCtxA[addr] = ctx.a;
}

export function deployMemoryBlock(beginAddr: number, data: number[]) {
  for (let i = 0; i < data.length; i++)
    setMemDirect(beginAddr + i, data[i]);
}

export function resetMemoryBlock(firstAddr: number, lastAddr: number) {
  for (let addr = firstAddr; addr <= lastAddr; addr++)
    setMemDirect(addr, 0);
}
