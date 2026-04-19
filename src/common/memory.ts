import { ATTRIBUTES_AFTER_ADDR, ATTRIBUTES_MIN_ADDR, RAM_MIN_ADDR, SCREEN_MIN_ADDR, xFFFF } from './constants.ts';
import { cpuX, cpuY, memoryCommitFromAddr } from './state.ts';
import { commitValue, fetchValue, getValuesCacheX, initValues } from './values.ts';

const DIRTY_BITMAP_SIZE = 2048; // 0x10000 >> 5

export const mem: number[] = [];
export const memoryDirtyBitmap = /* @__PURE__ */ new Uint32Array(DIRTY_BITMAP_SIZE);
const addrXs: number[] = [];
const addrYs: number[] = [];
const cacheXs: number[] = [];

let ramMinAddr = RAM_MIN_ADDR;
export function setRamMinAddrForTest(value: number) { ramMinAddr = value; }

//#region Init

let inited: boolean;

export function initMemory() {
  if (inited) return;
  inited = true;

  initValues();

  const memoryX = cpuX - 272;
  const memoryY = cpuY + 32;

  for (let addr = 0; addr <= xFFFF; addr++)
    initMemoryAddr(addr, memoryX, memoryY);

  // Mirror the first 8 bytes of ROM at addresses 0x10000–0x10007 so that PC can cross the 0xFFFF
  // boundary without an & 0xFFFF mask on every increment (see registers.ts).
  for (let i = 0; i < 8; i++) {
    addrXs[0x10000 + i] = addrXs[i];
    addrYs[0x10000 + i] = addrYs[i];
  }
}

function initMemoryAddr(addr: number, memoryX: number, memoryY: number) {
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

  addrXs[addr] = x;
  addrYs[addr] = y;
  cacheXs[addr] = getValuesCacheX(x, y);
}

//#endregion

//#region Fetch, Commit, Clear, Restore

let romFetched = false;

export function fetchMemory() {
  const fromAddr = romFetched ? RAM_MIN_ADDR : 0;

  for (let addr = fromAddr; addr <= xFFFF; addr++)
    mem[addr] = fetchValue(addrXs[addr], addrYs[addr]);

  // Mirror the first 8 bytes of ROM
  if (!romFetched)
    for (let i = 0; i < 8; i++)
      mem[0x10000 + i] = mem[i];

  romFetched = true;
}

export function commitMemory() {
  for (let i = memoryCommitFromAddr >> 5; i < DIRTY_BITMAP_SIZE; i++) {
    let bits = memoryDirtyBitmap[i];
    if (bits === 0) continue;
    memoryDirtyBitmap[i] = 0;
    const addrBase = i << 5;

    while (bits) {
      const bit = bits & -bits;
      const offset = 31 - Math.clz32(bit);
      bits ^= bit;

      const addr = addrBase + offset;
      commitMemoryValue(addr, mem[addr]);
    }
  }
}

export function commitMemoryValue(addr: number, value: number) {
  /*!inline*/
  const x = addrXs[addr];
  const y = addrYs[addr];
  const cacheX = cacheXs[addr];
  commitValue(x, y, cacheX, value);
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
    commitMemoryValue(addr, value);
  });

  // Mirror the first 8 bytes of ROM
  if (fromAddr < 8)
    for (let i = 0; i < 8; i++)
      mem[0x10000 + i] = mem[i];
}

//#endregion

export function read16(addr: number): number {
  /*!inline*/
  return mem[addr] | (mem[addr + 1] << 8);
}

export function write16(addr: number, value: number) {
  /*!inline*/
  write88(addr, value & 0xFF, value >> 8);
}

export function write88(addr: number, lo: number, hi: number) {
  if (addr < ramMinAddr) return;
  writeBase(addr, lo);
  if (++addr > xFFFF) return;
  writeBase(addr, hi);
}

export function write(addr: number, value: number) {
  if (addr < ramMinAddr) return;
  writeBase(addr, value);
}

function writeBase(addr: number, value: number) {
  /*!inline*/
  if (mem[addr] !== value) {
    mem[addr] = value;
    memoryDirtyBitmap[addr >> 5] |= 1 << addr; // "& 31" not needed
  }
}
