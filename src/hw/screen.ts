import { setMemDirect } from './arrows.ts';
import { ATTRIBUTES_AFTER_ADDR, ATTRIBUTES_MIN_ADDR, BIT4, BIT7, SCREEN_MIN_ADDR } from './constants.ts';
import { dirtyBitmap, mem } from './mem-state.ts';
import { cpuX, cpuY } from './state.ts';
import { world_copyRegion, world_setSignal } from './world-refs.ts';

const posXCache: number[] = [];
const posYCache: number[] = [];

const palXCacheDefault: number[] = [];
const palYCacheDefault: number[] = [];
const sig0CacheDefault: number[] = [];
const sig1CacheDefault: number[] = [];

const palXCacheFlash: number[] = [];
const palYCacheFlash: number[] = [];
const sig0CacheFlash: number[] = [];
const sig1CacheFlash: number[] = [];

let palXCache: number[] = palXCacheDefault;
let palYCache: number[] = palYCacheDefault;
let sig0Cache: number[] = sig0CacheDefault;
let sig1Cache: number[] = sig1CacheDefault;

let flashPhase = 0; // 0 | BIT4

function checkFlashPhase(): boolean {
  const newPhase = frameCount & BIT4;
  if (flashPhase === newPhase) return false;
  flashPhase = newPhase;

  if (newPhase) {
    palXCache = palXCacheFlash;
    palYCache = palYCacheFlash;
    sig0Cache = sig0CacheFlash;
    sig1Cache = sig1CacheFlash;
  } else {
    palXCache = palXCacheDefault;
    palYCache = palYCacheDefault;
    sig0Cache = sig0CacheDefault;
    sig1Cache = sig1CacheDefault;
  }

  return true;
}

let frameCount = 0;
/*! @__INLINE__ */ export function incFrameCount() { frameCount++; }

let inited = false;

export function initScreen() {
  if (inited) return;
  inited = true;

  const screenX = cpuX + 80;
  const screenY = cpuY - 400;
  const paletteX = cpuX;
  const paletteY = cpuY - 32;

  for (let addr = SCREEN_MIN_ADDR; addr < ATTRIBUTES_MIN_ADDR; addr++) {
    posXCache[addr] = screenX + ((addr & 0x1F) << 4);
    posYCache[addr] = screenY + ((addr & 0x1800) >> 4) + ((addr & 0x0700) >> 7) + ((addr & 0xE0) >> 1);
  }

  fillAttrCache(palXCacheDefault, palYCacheDefault, sig0CacheDefault, sig1CacheDefault, paletteX, paletteY, false);
  fillAttrCache(palXCacheFlash, palYCacheFlash, sig0CacheFlash, sig1CacheFlash, paletteX, paletteY, true);
}

function fillAttrCache(
  palX: number[], palY: number[], sig0: number[], sig1: number[],
  paletteX: number, paletteY: number, flashPhase: boolean,
) {
  const sig0Table = [0, 2, 1, 6, 4, 2, 3, 6];
  const sig1Table = [0, 2, 1, 6, 4, 4, 3, 4];

  for (let attr = 0; attr < 256; attr++) {
    const rawInk = attr & 0x07;
    const rawPaper = (attr & 0x38) >> 3;
    const flash = (attr & BIT7) !== 0 && flashPhase;
    const ink = flash ? rawPaper : rawInk;
    const paper = flash ? rawInk : rawPaper;
    const bright = (attr & 0x40) >> 6;
    const brightY = paletteY + (bright << 1);
    const base = attr << 1;
    palX[base] = paletteX + (paper << 1);
    palY[base] = brightY;
    palX[base | 1] = paletteX + (ink << 1);
    palY[base | 1] = brightY;
    sig0[base] = sig0Table[paper];
    sig1[base] = sig1Table[paper];
    sig0[base | 1] = sig0Table[ink];
    sig1[base | 1] = sig1Table[ink];
  }
}

export function refreshScreen() {
  initScreen();

  for (let i = ATTRIBUTES_MIN_ADDR >> 5; i < ATTRIBUTES_AFTER_ADDR >> 5; i++)
    dirtyBitmap[i] = 0xFFFFFFFF;

  commitScreen();
}

export function commitScreen() {
  const flashChanged = checkFlashPhase();
  const minAttrIndex = ATTRIBUTES_MIN_ADDR >> 5;
  let pixelBase = SCREEN_MIN_ADDR >> 5;
  let zoneCount = 8;

  for (let i = 0; i < 24; i++) {
    const attrIndex = minAttrIndex + i;
    let attrBits = dirtyBitmap[attrIndex];
    dirtyBitmap[attrIndex] = 0;
    const attrAddrBase = attrIndex << 5;

    if (flashChanged) {
      // Once every 16 frames: check all 32 attributes in the line. Save dirty ones to world.
      // Mark those with flash bit as dirty for the subsequent screen output phase.
      for (let offset = 0; offset < 32; offset++) {
        const bit = 1 << offset;
        const attrAddr = attrAddrBase + offset;
        const value = mem[attrAddr];
        if (attrBits & bit) setMemDirect(attrAddr, value);
        else if (value & BIT7) attrBits |= bit;
      }
    } else {
      // Hot path (15 out of 16 frames): save dirty attributes to world
      let ab = attrBits;
      while (ab) {
        const bit = ab & -ab;
        ab ^= bit;
        const attrAddr = attrAddrBase + 31 - Math.clz32(bit);
        setMemDirect(attrAddr, mem[attrAddr]);
      }
    }

    for (let j = 0; j < 64; j += 8) {
      const pixelIndex = pixelBase + i + j;
      const pixelBits = dirtyBitmap[pixelIndex];
      let bits = attrBits | pixelBits;
      if (bits === 0) continue;
      dirtyBitmap[pixelIndex] = 0;
      const addrBase = pixelIndex << 5;

      while (bits) {
        const bit = bits & -bits;
        const offset = 31 - Math.clz32(bit);
        bits ^= bit;

        const addr = addrBase + offset;
        const value = mem[addr];

        if (pixelBits & bit)
          setMemDirect(addr, value);

        const attrAddr = attrAddrBase + offset;
        const attr = mem[attrAddr];
        setPixels(addr, value, attr);
      }
    }

    if (!--zoneCount) {
      zoneCount = 8;
      pixelBase += 56; // 64 - 8
    }
  }
}

function setPixels(addr: number, value: number, attr: number) {
  const posX = posXCache[addr];
  const posY = posYCache[addr];
  const base = attr << 1;

  for (let pixelX = posX + 14; pixelX >= posX; pixelX -= 2) {
    const index = base | (value & 1);
    const palX = palXCache[index];
    const palY = palYCache[index];
    const sig0 = sig0Cache[index];
    const sig1 = sig1Cache[index];
    world_copyRegion(palX, palY, palX + 1, palY + 1, pixelX, posY);
    world_setSignal(pixelX, posY, sig0);
    world_setSignal(pixelX + 1, posY, sig1);
    world_setSignal(pixelX + 1, posY + 1, sig0);
    world_setSignal(pixelX, posY + 1, sig1);
    value >>= 1;
  }
}
