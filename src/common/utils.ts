import { createCtx, setDirect } from './arrows.ts';
import { memsCtx } from './memory.ts';

const SCREEN_MIN_ADDR = 0x4000;
const ATTRIBUTES_MIN_ADDR = 0x5800;
const ATTRIBUTES_AFTER_ADDR = 0x5B00;

export function check(condition: boolean, message: string = 'Check failed') {
  if (!condition)
    throw new Error(message);
}

export function initMemory(chunkX: number, chunkY: number) {
  const memoryX = chunkX - 256;
  const memoryY = chunkY + 16;

  for (let addr = 0; addr <= 0xFFFF; addr++)
    initAddrCtx(addr, memoryX, memoryY);

  memsCtx[0x10000] = memsCtx[0]; // Mirror 0x0000 address for easier access to byte pairs
}

function initAddrCtx(addr: number, memoryX: number, memoryY: number) {
  const xShift = ((addr & 0xC000) >> 14) * 272;
  let x, y: number;

  if (addr >= SCREEN_MIN_ADDR && addr < ATTRIBUTES_MIN_ADDR) {
    // Pretty screen
    x = memoryX + (addr & 0x1F) * 8 + xShift;
    y = memoryY + ((addr & 0x1800) >> 5) + ((addr & 0x0700) >> 8) + ((addr & 0xE0) >> 2);
  }
  else if (addr >= ATTRIBUTES_MIN_ADDR && addr < ATTRIBUTES_AFTER_ADDR) {
    // Line by line:
    x = memoryX + (addr & 0x1F) * 8 + xShift;
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

  memsCtx[addr] = createCtx(x, y);
}

export function deployMemoryBlock(beginAddr: number, data: number[]) {
  for (let i = 0; i < data.length; i++) {
    const ctx = memsCtx[beginAddr + i];
    setDirect(ctx, data[i]);
  }
}

export function resetMemoryBlock(firstAddr: number, lastAddr: number) {
  for (let addr = firstAddr; addr <= lastAddr; addr++) {
    const ctx = memsCtx[addr];
    setDirect(ctx, 0);
  }
}
