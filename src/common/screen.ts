import { ATTRIBUTES_AFTER_ADDR, ATTRIBUTES_MIN_ADDR, BIT4, BIT6, BIT7, DISPLAY_MIN_ADDR, TSTATES_PER_DISPLAY_FIRST_ROW_MIDDLE, TSTATES_PER_DISPLAY_ROW } from './constants.ts';
import { commitMemoryValue, mem, memoryDirtyBitmap } from './memory.ts';
import { cpuX, cpuY, screenEnabled } from './state.ts';
import { world_copyRegion, world_getArrow, world_setSignal } from './world-refs.ts';

// Screen = display area + border

let displayX: number;
let displayY: number;
const addrXs: number[] = [];
const addrYs: number[] = [];
const borderXs: number[] = [];
const borderYs: number[] = [];
const palettesDefault: number[][] = [];
const palettesFlash: number[][] = [];
const pixelIndexBaseByRow: number[] = [];
export const displayCommitTStatesByRow: number[] = [];

//#region Init

let inited: boolean;

export function initScreen() {
  if (inited) return;
  inited = true;

  displayX = cpuX + 80;
  displayY = cpuY - 400;
  const paletteX = cpuX;
  const paletteY = cpuY - 32;

  for (let addr = DISPLAY_MIN_ADDR; addr < ATTRIBUTES_MIN_ADDR; addr++) {
    addrXs[addr] = displayX + ((addr & 0x1F) << 4);
    addrYs[addr] = displayY + ((addr & 0x1800) >> 4) + ((addr & 0x0700) >> 7) + ((addr & 0xE0) >> 1);
  }

  initBorder();
  initPalettes(paletteX, paletteY);

  let rowPixelIndexBase = DISPLAY_MIN_ADDR >> 5;
  let rowCommitTStates = TSTATES_PER_DISPLAY_FIRST_ROW_MIDDLE;
  let zoneCount = 8;

  for (let i = 0; i < 24; i++) {
    pixelIndexBaseByRow[i] = rowPixelIndexBase + i;
    displayCommitTStatesByRow[i] = rowCommitTStates;
    rowCommitTStates += TSTATES_PER_DISPLAY_ROW;

    if (!--zoneCount) {
      zoneCount = 8;
      rowPixelIndexBase += 56; // 64 - 8
    }
  }
}

function initBorder() {
  const minX = displayX - 32;
  const minY = displayY - 28;
  const maxX = displayX + 512 + 32 - 2;
  const maxY = displayY + 384 + 28 - 2;
  const skips = [20, 14, 10, 8, 6, 4, 4, 2, 2, 2];

  for (let y = minY; y <= maxY; y += 2) {
    let skip = 0;
    if (y < minY + 20)
      skip = skips[(y - minY) >> 1];
    else if (y > maxY - 20)
      skip = skips[(maxY - y) >> 1];

    for (let x = minX + skip; x <= maxX - skip; x += 2) {
      if (x < displayX || x >= displayX + 512 || y < displayY || y >= displayY + 384) {
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
let flashPhase = 0; // 0 | BIT4
let flashPhaseChanged = false;
let currentPalettes = palettesDefault;

export function incFrameCount() {
  const newFlashPhase = ++frameCount & BIT4;
  flashPhaseChanged = flashPhase !== newFlashPhase;

  if (flashPhaseChanged) {
    flashPhase = newFlashPhase;
    currentPalettes = flashPhase ? palettesFlash : palettesDefault;
  }
}

export function clearScreen() {
  if (!screenEnabled) return;
  initScreen();
  clearBorder();
  const emptyAreaX = displayX + 560;
  world_copyRegion(emptyAreaX, displayY, emptyAreaX + 512, displayY + 384, displayX, displayY);
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

  for (let i = 0; i < 24; i++)
    commitDisplayRow(i);

  commitBorder();
}

const minAttrIndex = ATTRIBUTES_MIN_ADDR >> 5;

export function commitDisplayRow(row: number) {
  const attrIndex = minAttrIndex + row;
  const pixelIndexBase = pixelIndexBaseByRow[row];
  const attrAddrBase = attrIndex << 5;
  let attrBits = memoryDirtyBitmap[attrIndex];
  memoryDirtyBitmap[attrIndex] = 0;

  if (flashPhaseChanged) {
    // Once every 16 frames: check all 32 attributes in the line. Save dirty ones to world.
    // Mark those with flash bit as dirty for the subsequent display output phase.
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

  for (let i = 0; i < 64; i += 8) {
    const pixelIndex = pixelIndexBase + i;
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
      commitDisplayValue(addr, attr, value);
    }
  }
}

function commitDisplayValue(addr: number, attr: number, value: number) {
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
