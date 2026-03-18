import { get8, set8 } from './utils';

const ROM_MAX_ADDR = 0x3FFF;
let memoryX: number;
let memoryY: number;

export function initMemory(chunkX: number, chunkY: number) {
  memoryX = chunkX + 16;
  memoryY = chunkY + 16;
}

export function deployMemory(rom: number[]) {
  for (let addr = 0; addr <= 0xFFFF; addr++) {
    const memPos = getMemPos(addr);
    const value = addr < rom.length ? rom[addr] : 0;
    set8(memPos, value);
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
  if (addr <= ROM_MAX_ADDR) return;
  const memPos = getMemPos(addr);
  set8(memPos, value);
}

export function getMemPos(addr: number): Position {
  const xShift = ((addr & 0xC000) >> 14) * 272;

  // 8x8 blocks:
  const x = memoryX + (addr & 0xF8) + xShift;
  const y = memoryY + ((addr & 0x3F00) >> 5) + (addr & 0x7);

  // Line by line:
  // const x = memoryX + (addr & 0x1F) * 8 + xShift;
  // const y = memoryY + ((addr & 0x3FFF) >> 5);

  return { x, y };
}
