import {
  ATTRIBUTES_AFTER_ADDR, ATTRIBUTES_MIN_ADDR, BIT4, BIT6, BIT7, DISPLAY_MIN_ADDR,
  TSTATES_PER_DISPLAY_FIRST_ROW_MIDDLE, TSTATES_PER_DISPLAY_ROW
} from './constants.ts';
import { commitMemoryValue, initMemory, mem, memoryDirtyBitmap } from './memory.ts';
import { cpuX, cpuY, memoryX, memoryY, screenEnabled } from './state.ts';
import { world_copyRegion, world_copyRegionWithSignals } from './world-refs.ts';

// Screen = display area + border

let displayX: number;
let displayY: number;
const addrXs: number[] = []; // addr => pixel x (leftmost of the byte)
const addrYs: number[] = []; // addr => pixel y
const borderXs: number[] = []; // index => pixel x
const borderYs: number[] = []; // index => pixel y
const colorMapDefault: number[][] = []; // attr => [inkX, inkY, paperX, paperY]
const colorMapFlash: number[][] = []; // ink and paper are swapped when flash bit is set
let colorMapCurrent = colorMapDefault;
const pixelIndexBaseByRow: number[] = [];
export const displayCommitTStatesByRow: number[] = [];

//#region Init

let inited: boolean;

export function initScreen() {
  if (inited) return;
  inited = true;

  displayX = cpuX + 80;
  displayY = cpuY - 400;
  const paletteX = memoryX - 32;
  const paletteY = memoryY;

  // Fill the arrays sequentially so the QuickJS engine keeps them dense (fast). The 16K zeros below
  // DISPLAY_MIN_ADDR are never read: they are the price of indexing the arrays by addr directly.
  addrXs.length = ATTRIBUTES_MIN_ADDR;
  addrYs.length = ATTRIBUTES_MIN_ADDR;
  addrXs.fill(0);
  addrYs.fill(0);

  for (let addr = DISPLAY_MIN_ADDR; addr < ATTRIBUTES_MIN_ADDR; addr++) {
    addrXs[addr] = displayX + ((addr & 0x1F) << 4);
    addrYs[addr] = displayY + ((addr & 0x1800) >> 4) + ((addr & 0x0700) >> 7) + ((addr & 0xE0) >> 1);
  }

  initBorder();
  initColorMaps(paletteX, paletteY);

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

function initColorMaps(paletteX: number, paletteY: number) {
  const palette: number[][] = []; // color => [x, y]

  for (let i = 0; i < 16; i++) {
    const x = paletteX + ((i & 7) << 1);
    const y = paletteY + ((i & 8) >> 2);
    palette[i] = [x, y];
  }

  initColorMap(false, colorMapDefault, palette);
  initColorMap(true, colorMapFlash, palette);
}

function initColorMap(isFlash: boolean, colorMap: number[][], palette: number[][]) {
  for (let attr = 0; attr < 256; attr++) {
    const rawInk = attr & 0x07;
    const rawPaper = (attr & 0x38) >> 3;
    const rawFlash = (attr & BIT7) !== 0;

    const flash = rawFlash && isFlash;
    const ink = flash ? rawPaper : rawInk;
    const paper = flash ? rawInk : rawPaper;
    const bright = (attr & BIT6) >> 3;

    const inkXY = palette[bright | ink];
    const paperXY = palette[bright | paper];

    colorMap[attr] = [inkXY[0], inkXY[1], paperXY[0], paperXY[1]];
  }
}

//#endregion

let frameCount = 0;
let flashPhase = 0; // 0 | BIT4
let flashPhaseChanged = false;

export function incFrameCount() {
  const newFlashPhase = ++frameCount & BIT4;
  flashPhaseChanged = flashPhase !== newFlashPhase;

  if (flashPhaseChanged) {
    flashPhase = newFlashPhase;
    colorMapCurrent = flashPhase ? colorMapFlash : colorMapDefault;
  }
}

export function clearScreen() {
  if (!screenEnabled) return;
  initScreen();
  const emptyAreaX = displayX + 560;
  world_copyRegion(emptyAreaX, displayY, emptyAreaX + 512, displayY + 384, displayX, displayY);
  clearBorder();
}

export function refreshScreen() {
  if (!screenEnabled) return;
  initMemory();
  initScreen();
  const indexAfterAttrs = ATTRIBUTES_AFTER_ADDR >> 5;

  for (let i = ATTRIBUTES_MIN_ADDR >> 5; i < indexAfterAttrs; i++)
    memoryDirtyBitmap[i] = -1;

  commitScreen();
}

let borderColor = 0;
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
      if (attrBits & bit) commitMemoryValue(attrAddr, value);
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

      if (pixelBits & bit)
        commitMemoryValue(addr, value);

      const attrAddr = attrAddrBase + offset;
      const attr = mem[attrAddr];
      commitDisplayValue(addr, attr, value);
    }
  }
}

function commitDisplayValue(addr: number, attr: number, value: number) {
  const addrX = addrXs[addr];
  const y = addrYs[addr];

  const colorsXY = colorMapCurrent[attr];
  const inkX0 = colorsXY[0];
  const inkY0 = colorsXY[1];
  const inkX1 = inkX0 + 1;
  const inkY1 = inkY0 + 1;
  const paperX0 = colorsXY[2];
  const paperY0 = colorsXY[3];
  const paperX1 = paperX0 + 1;
  const paperY1 = paperY0 + 1;

  for (let x = addrX + 14; x >= addrX; x -= 2) {
    if (value & 1)
      world_copyRegionWithSignals(inkX0, inkY0, inkX1, inkY1, x, y);
    else
      world_copyRegionWithSignals(paperX0, paperY0, paperX1, paperY1, x, y);

    value >>= 1;
  }
}

let borderCommited = -1;

export function commitBorder() {
  if (borderCommited === borderColor) return;
  borderCommited = borderColor;

  const colorsXY = colorMapDefault[borderColor];
  const inkX0 = colorsXY[0];
  const inkY0 = colorsXY[1];
  const inkX1 = inkX0 + 1;
  const inkY1 = inkY0 + 1;

  borderXs.forEach((x, i) => world_copyRegionWithSignals(inkX0, inkY0, inkX1, inkY1, x, borderYs[i]));
}

//#endregion
