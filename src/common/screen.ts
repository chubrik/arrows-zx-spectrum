import { ATTRIBUTES_AFTER_ADDR, ATTRIBUTES_MIN_ADDR, BIT4, BIT6, BIT7, SCREEN_MIN_ADDR } from './constants.ts';
import { commitMemoryValue, mem, memoryDirtyBitmap } from './memory.ts';
import { cpuX, cpuY, screenEnabled } from './state.ts';
import { world_copyRegion, world_getArrow, world_setSignal } from './world-refs.ts';

let screenX: number;
let screenY: number;
const addrXs: number[] = [];
const addrYs: number[] = [];
const borderXs: number[] = [];
const borderYs: number[] = [];
const palettesDefault: number[][] = [];
const palettesFlash: number[][] = [];
let currentPalettes = palettesDefault;

//#region Init

let inited: boolean;

export function initScreen() {
  if (inited) return;
  inited = true;

  screenX = cpuX + 80;
  screenY = cpuY - 400;
  const paletteX = cpuX;
  const paletteY = cpuY - 32;

  for (let addr = SCREEN_MIN_ADDR; addr < ATTRIBUTES_MIN_ADDR; addr++) {
    addrXs[addr] = screenX + ((addr & 0x1F) << 4);
    addrYs[addr] = screenY + ((addr & 0x1800) >> 4) + ((addr & 0x0700) >> 7) + ((addr & 0xE0) >> 1);
  }

  initBorder();
  initPalettes(paletteX, paletteY);
}

function initBorder() {
  const minX = screenX - 32;
  const minY = screenY - 28;
  const maxX = screenX + 512 + 32 - 2;
  const maxY = screenY + 384 + 28 - 2;
  const skips = [20, 14, 10, 8, 6, 4, 4, 2, 2, 2];

  for (let y = minY; y <= maxY; y += 2) {
    let skip = 0;
    if (y < minY + 20)
      skip = skips[(y - minY) >> 1];
    else if (y > maxY - 20)
      skip = skips[(maxY - y) >> 1];

    for (let x = minX + skip; x <= maxX - skip; x += 2) {
      if (x < screenX || x >= screenX + 512 || y < screenY || y >= screenY + 384) {
        borderXs.push(x);
        borderYs.push(y);
      }
    }
  }
}

function initPalettes(paletteX: number, paletteY: number) {
  const palSrc: number[][] = [];

  for (let i = 0; i < 16; i++) {
    const x = paletteX + ((i & 7) << 1);
    const y = paletteY + ((i & 8) >> 2);
    const arrow0 = world_getArrow(x, y);
    const arrow1 = world_getArrow(x + 1, y);
    const arrow2 = world_getArrow(x + 1, y + 1);
    const arrow3 = world_getArrow(x, y + 1);
    const arrowAlt = world_getArrow(x, y + 4);

    palSrc[i] = [
      x,
      arrowAlt ? y + 4 : y,
      arrow0 ? arrow0.extra & 7 : 0,
      arrow1 ? arrow1.extra & 7 : 0,
      arrow2 ? arrow2.extra & 7 : 0,
      arrow3 ? arrow3.extra & 7 : 0,
    ];
  }

  initPalettesPhase(false, palettesDefault, palSrc);
  initPalettesPhase(true, palettesFlash, palSrc);
}

function initPalettesPhase(isFlash: boolean, palettes: number[][], palSrc: number[][]) {
  for (let attr = 0; attr < 256; attr++) {
    const rawInk = attr & 0x07;
    const rawPaper = (attr & 0x38) >> 3;
    const rawFlash = (attr & BIT7) !== 0;

    const flash = rawFlash && isFlash;
    const ink = flash ? rawPaper : rawInk;
    const paper = flash ? rawInk : rawPaper;
    const bright = (attr & BIT6) >> 3;

    const inkPal = palSrc[bright | ink];
    const paperPal = palSrc[bright | paper];

    palettes[attr] = [
      inkPal[0], inkPal[1], inkPal[2], inkPal[3], inkPal[4], inkPal[5],
      paperPal[0], paperPal[1], paperPal[2], paperPal[3], paperPal[4], paperPal[5],
    ];
  }
}

//#endregion

let frameCount = 0;
export function incFrameCount() { /*!inline*/ frameCount++; }

let flashPhase = 0; // 0 | BIT4

function checkFlashPhase(): boolean {
  const newPhase = frameCount & BIT4;
  if (flashPhase === newPhase) return false;
  flashPhase = newPhase;
  currentPalettes = flashPhase ? palettesFlash : palettesDefault;
  return true;
}

export function clearScreen() {
  if (!screenEnabled) return;
  initScreen();
  clearBorder();
  const emptyAreaX = screenX + 560;
  world_copyRegion(emptyAreaX, screenY, emptyAreaX + 512, screenY + 384, screenX, screenY);
}

export function refreshScreen() {
  if (!screenEnabled) return;
  initScreen();
  const indexAfterAttrs = ATTRIBUTES_AFTER_ADDR >> 5;

  for (let i = ATTRIBUTES_MIN_ADDR >> 5; i < indexAfterAttrs; i++)
    memoryDirtyBitmap[i] = -1;

  commitScreen();
}

let borderColor = -1;
export function setBorder(color: number) { /*!inline*/ borderColor = color; }

function clearBorder() {
  const color = borderColor;
  setBorder(0);
  commitBorder();
  setBorder(color);
}

//#region Commit

export function commitScreen() {
  if (!screenEnabled) return;
  commitBorder();

  const flashChanged = checkFlashPhase();
  const minAttrIndex = ATTRIBUTES_MIN_ADDR >> 5;
  let pixelBase = SCREEN_MIN_ADDR >> 5;
  let zoneCount = 8;

  for (let i = 0; i < 24; i++) {
    const attrIndex = minAttrIndex + i;
    let attrBits = memoryDirtyBitmap[attrIndex];
    memoryDirtyBitmap[attrIndex] = 0;
    const attrAddrBase = attrIndex << 5;

    if (flashChanged) {
      // Once every 16 frames: check all 32 attributes in the line. Save dirty ones to world.
      // Mark those with flash bit as dirty for the subsequent screen output phase.
      for (let offset = 0; offset < 32; offset++) {
        const bit = 1 << offset;
        const attrAddr = attrAddrBase + offset;
        const value = mem[attrAddr];
        if (attrBits & bit) { commitMemoryValue(attrAddr, value); }
        else if (value & BIT7) attrBits |= bit;
      }
    } else {
      // Hot path (15 of 16 frames): save dirty attributes to world
      let ab = attrBits;
      while (ab) {
        const bit = ab & -ab;
        ab ^= bit;
        const attrAddr = attrAddrBase + 31 - Math.clz32(bit);
        commitMemoryValue(attrAddr, mem[attrAddr]);
      }
    }

    for (let j = 0; j < 64; j += 8) {
      const pixelIndex = pixelBase + i + j;
      const pixelBits = memoryDirtyBitmap[pixelIndex];
      let bits = attrBits | pixelBits;
      if (bits === 0) continue;
      memoryDirtyBitmap[pixelIndex] = 0;
      const addrBase = pixelIndex << 5;

      while (bits) {
        const bit = bits & -bits;
        const offset = 31 - Math.clz32(bit);
        bits ^= bit;

        const addr = addrBase + offset;
        const value = mem[addr];

        if (pixelBits & bit) {
          commitMemoryValue(addr, value);
        }

        const attrAddr = attrAddrBase + offset;
        const attr = mem[attrAddr];
        commitScreenValue(addr, attr, value);
      }
    }

    if (!--zoneCount) {
      zoneCount = 8;
      pixelBase += 56; // 64 - 8
    }
  }
}

function commitScreenValue(addr: number, attr: number, value: number) {
  const posX = addrXs[addr];
  const y = addrYs[addr];
  const pal = currentPalettes[attr];

  const inkX0 = pal[0];
  const inkY0 = pal[1];
  const inkX1 = inkX0 + 1;
  const inkY1 = inkY0 + 1;
  const inkSig0 = pal[2];
  const inkSig1 = pal[3];
  const inkSig2 = pal[4];
  const inkSig3 = pal[5];

  const paperX0 = pal[6];
  const paperY0 = pal[7];
  const paperX1 = paperX0 + 1;
  const paperY1 = paperY0 + 1;
  const paperSig0 = pal[8];
  const paperSig1 = pal[9];
  const paperSig2 = pal[10];
  const paperSig3 = pal[11];

  for (let x = posX + 14; x >= posX; x -= 2) {
    if (value & 1) {
      world_copyRegion(inkX0, inkY0, inkX1, inkY1, x, y);
      world_setSignal(x, y, inkSig0);
      world_setSignal(x + 1, y, inkSig1);
      world_setSignal(x + 1, y + 1, inkSig2);
      world_setSignal(x, y + 1, inkSig3);
    }
    else {
      world_copyRegion(paperX0, paperY0, paperX1, paperY1, x, y);
      world_setSignal(x, y, paperSig0);
      world_setSignal(x + 1, y, paperSig1);
      world_setSignal(x + 1, y + 1, paperSig2);
      world_setSignal(x, y + 1, paperSig3);
    }
    value >>= 1;
  }
}

let borderCommited = -1;

export function commitBorder() {
  if (borderCommited === borderColor) return;
  borderCommited = borderColor;

  const pal = palettesDefault[borderColor];

  const palX0 = pal[0];
  const palY0 = pal[1];
  const palX1 = palX0 + 1;
  const palY1 = palY0 + 1;
  const sig0 = pal[2];
  const sig1 = pal[3];
  const sig2 = pal[4];
  const sig3 = pal[5];

  borderXs.forEach((x, i) => {
    const y = borderYs[i];
    world_copyRegion(palX0, palY0, palX1, palY1, x, y);
    world_setSignal(x, y, sig0);
    world_setSignal(x + 1, y, sig1);
    world_setSignal(x + 1, y + 1, sig2);
    world_setSignal(x, y + 1, sig3);
  });
}

//#endregion
