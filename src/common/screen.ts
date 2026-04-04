import { setMemDirect } from './arrows.ts';
import { ATTRIBUTES_AFTER_ADDR, ATTRIBUTES_MIN_ADDR, SCREEN_MIN_ADDR } from './constants.ts';
import { dirtyBitmap, mem } from './memory.ts';

const posXCache: number[] = [];
const posYCache: number[] = [];
const palXCache: number[] = [];
const palYCache: number[] = [];
const sig0Cache: number[] = [];
const sig1Cache: number[] = [];

export function initScreen(chunkX: number, chunkY: number) {
  const screenX = chunkX + 32;
  const screenY = chunkY - 416;
  const paletteX = chunkX + 48;
  const paletteY = chunkY - 16;

  for (let addr = SCREEN_MIN_ADDR; addr < ATTRIBUTES_MIN_ADDR; addr++) {
    posXCache[addr] = screenX + ((addr & 0x1F) << 4);
    posYCache[addr] = screenY + ((addr & 0x1800) >> 4) + ((addr & 0x0700) >> 7) + ((addr & 0xE0) >> 1);
  }

  const sig0Table = [0, 2, 1, 6, 4, 2, 3, 6];
  const sig1Table = [0, 2, 1, 6, 4, 4, 3, 4];

  for (let attr = 0; attr < 256; attr++) {
    const ink = attr & 0x07;
    const paper = (attr & 0x38) >> 3;
    const bright = (attr & 0x40) >> 6;
    const brightY = paletteY + (bright << 1);
    const base = attr << 1;
    palXCache[base] = paletteX + (paper << 1);
    palYCache[base] = brightY;
    palXCache[base | 1] = paletteX + (ink << 1);
    palYCache[base | 1] = brightY;
    sig0Cache[base] = sig0Table[paper];
    sig1Cache[base] = sig1Table[paper];
    sig0Cache[base | 1] = sig0Table[ink];
    sig1Cache[base | 1] = sig1Table[ink];
  }
}

export function refreshScreen() {
  for (let i = ATTRIBUTES_MIN_ADDR >> 5; i < ATTRIBUTES_AFTER_ADDR >> 5; i++)
    dirtyBitmap[i] = 0xFFFFFFFF;

  commitScreen();
}

export function commitScreen() {
  const minAttrIndex = ATTRIBUTES_MIN_ADDR >> 5;
  let pixelBase = SCREEN_MIN_ADDR >> 5;
  let zoneCount = 8;

  for (let i = 0; i < 24; i++) {
    const attrIndex = minAttrIndex + i;
    const attrBits = dirtyBitmap[attrIndex];
    const attrAddrBase = attrIndex << 5;

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
    world.copyRegion(palX, palY, palX + 1, palY + 1, pixelX, posY);
    world.setSignal(pixelX, posY, sig0);
    world.setSignal(pixelX + 1, posY, sig1);
    world.setSignal(pixelX + 1, posY + 1, sig0);
    world.setSignal(pixelX, posY + 1, sig1);
    value >>= 1;
  }
}
