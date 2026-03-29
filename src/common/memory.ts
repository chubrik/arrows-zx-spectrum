import { createInfo, infos, setDirect } from './arrows';

const SCREEN_MIN_ADDR = 0x4000;
const ATTRIBUTES_MIN_ADDR = 0x5800;
const ATTRIBUTES_AFTER_ADDR = 0x5B00;

export function initMemory(chunkX: number, chunkY: number) {
  const memoryX = chunkX - 256;
  const memoryY = chunkY + 16;

  for (let addr = 0; addr <= 0xFFFF; addr++)
    initAddrInfo(addr, memoryX, memoryY);
  
  infos[0x10000] = infos[0]; // Mirror 0x0000 address for easier access to byte pairs
}

function initAddrInfo(addr: number, memoryX: number, memoryY: number) {
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

  infos[addr] = createInfo(x, y);
}

export function deployMemoryBlock(data: number[], startAddr: number) {
  for (let i = 0; i < data.length; i++)
    setDirect(startAddr + i, data[i]);
}
