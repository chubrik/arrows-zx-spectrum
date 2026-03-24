import { get8, packPos, set8, set8Direct, setReadonly, unpackX, unpackY } from './utils';

const RAM_MIN_ADDR = 0x4000;
const ATTRIBUTES_MIN_ADDR = 0x5800;
const ATTRIBUTES_AFTER_ADDR = 0x5B00;
let memoryX: number;
let memoryY: number;

export function initMemory(chunkX: number, chunkY: number) {
  memoryX = chunkX - 256;
  memoryY = chunkY + 16;
  const ramMinPos = getMemPos(RAM_MIN_ADDR);
  const ramMinX = unpackX(ramMinPos);
  const ramMinY = unpackY(ramMinPos);
  setReadonly(ramMinX, ramMinY);
}

export function deployMemoryBlock(data: number[], baseAddr: number) {
  for (let i = 0; i < data.length; i++) {
    const memPos = getMemPos(baseAddr + i);
    set8Direct(memPos, data[i]);
  }
}

export function readMem16(addr: number): number {
  const valueLow = readMem8(addr);
  const valueHigh = readMem8((addr + 1) & 0xFFFF);
  return (valueHigh << 8) | valueLow;
}

export function writeMem16(addr: number, value: number) {
  writeMem8(addr, value & 0xFF);
  writeMem8((addr + 1) & 0xFFFF, value >> 8);
}

export function readMem8(addr: number): number {
  const memPos = getMemPos(addr);
  return get8(memPos);
}

export function writeMem8(addr: number, value: number) {
  const memPos = getMemPos(addr);
  set8(memPos, value);
}

export function getMemPos(addr: number): number {
  const xShift = ((addr & 0xC000) >> 14) * 272;
  let x, y: number;

  if (addr >= RAM_MIN_ADDR && addr < ATTRIBUTES_MIN_ADDR) {
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

  return packPos(x, y);
}
