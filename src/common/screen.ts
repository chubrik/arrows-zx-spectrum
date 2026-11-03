import {
  ATTRIBUTES_AFTER_ADDR, ATTRIBUTES_MIN_ADDR, BIT4, BIT6, BIT7, DISPLAY_LINE_COUNT,
  DISPLAY_MIN_ADDR, TSTATES_AT_DISPLAY_FIRST_LINE_MIDDLE, TSTATES_PER_LINE
} from './constants.ts';
import { commitMemoryValue, initMemory, mem, memoryDirtyBitmap } from './memory.ts';
import { cpuX, cpuY, memoryX, memoryY, screenEnabled } from './state.ts';
import { world_copyRegion, world_copyRegionWithSignals, world_getArrow } from './world-refs.ts';

// Screen = display area + border

let displayX: number;
let displayY: number;
const addrXs: number[] = []; // addr => pixel x (leftmost of the byte)
const addrYs: number[] = []; // addr => pixel y
const borderXs: number[] = []; // index => pixel x
const borderYs: number[] = []; // index => pixel y
const dirtyPixelIndexByLine: number[] = []; // line => memoryDirtyBitmap index of the line's pixels
export const displayCommitTStatesByLine: number[] = []; // line => T-states to commit the line at

let paletteX: number;
let paletteYs: number[] = [];
let paletteIndex: number;
const colorMapDefault: number[][] = []; // attr => [inkX, inkY, paperX, paperY]
const colorMapFlash: number[][] = []; // ink and paper are swapped when flash bit is set
let colorMapCurrent = colorMapDefault;

//#region Init

let inited: boolean;

export function initScreen() {
  if (inited) return;
  inited = true;

  displayX = cpuX + 80;
  displayY = cpuY - 400;

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
  initPalettes();

  // The display is committed line by line, following the beam, in the middle of the visible part
  // of each line. The dirty bits of the 32 bytes of a line share one memoryDirtyBitmap word:
  // its index is the byte address without the five low column bits. Of the address layout
  // 010ZZ LLL RRR CCCCC that leaves 010ZZLLLRRR, where ZZ is the third of the screen, LLL the line
  // within the row and RRR the row within the third.
  const minPixelIndex = DISPLAY_MIN_ADDR >> 5;

  for (let line = 0; line < DISPLAY_LINE_COUNT; line++) {
    dirtyPixelIndexByLine[line] = minPixelIndex + (line & 0xC0) + ((line & 7) << 3) + ((line >> 3) & 7);
    displayCommitTStatesByLine[line] = TSTATES_AT_DISPLAY_FIRST_LINE_MIDDLE + line * TSTATES_PER_LINE;
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

function initPalettes() {
  paletteX = memoryX - 32;
  let index = 0;
  let y = memoryY;

  while (world_getArrow(paletteX + 15, y)) { // Palette exists
    if (world_getArrow(paletteX + 18, y + 1)) // Selector exists
      paletteIndex = index;

    paletteYs[index++] = y;
    y += 8;
  }

  initColorMaps();
}

function initColorMaps() {
  const paletteY = paletteYs[paletteIndex];
  const palette: number[][] = []; // color => [x, y]

  for (let i = 0; i < 16; i++) {
    const x = paletteX + ((i & 7) << 1);
    const y = paletteY + ((i & 8) >> 2);
    palette[i] = [x, y];
  }

  for (let attr = 0; attr < 256; attr++) {
    const flash = attr & BIT7;
    const bright = (attr & BIT6) >> 3;
    const paper = (attr & 0x38) >> 3;
    const ink = attr & 0x07;

    const inkXY = palette[bright | ink];
    const paperXY = palette[bright | paper];

    const colorXY = colorMapDefault[attr] = [inkXY[0], inkXY[1], paperXY[0], paperXY[1]];
    colorMapFlash[attr] = flash ? [paperXY[0], paperXY[1], inkXY[0], inkXY[1]] : colorXY;
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

  borderCommited = -1;
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

export function switchPalette(inc: number) {
  initScreen();
  const selectorX = paletteX + 18;
  const selectorY = paletteYs[paletteIndex] + 1;

  const count = paletteYs.length;
  paletteIndex = (paletteIndex + inc + count) % count;
  const newPaletteY = paletteYs[paletteIndex];
  world_copyRegion(selectorX, selectorY, selectorX + 1, selectorY + 1, selectorX, newPaletteY + 1);
  world_copyRegion(selectorX - 2, selectorY, selectorX - 1, selectorY + 1, selectorX, selectorY);

  initColorMaps();
  refreshScreen();
}

//#region Commit

export function commitScreen() {
  if (!screenEnabled) return;

  for (let line = 0; line < DISPLAY_LINE_COUNT; line++)
    commitDisplayLine(line);

  commitBorder();
}

const minAttrIndex = ATTRIBUTES_MIN_ADDR >> 5;

// Snapshot of the dirty attributes of the current 8-line row, taken before the whole row is drawn
let dirtyRowAttrs = 0;

// Commits a display line following the beam: dirty pixels and attributes are copied to the world.
// An attribute changed before its 8-line row begins is marked clean, but is remembered in
// dirtyRowAttrs and drawn on all eight lines of the current row. An attribute changed while the row
// is being drawn is marked dirty the usual way, and it gets drawn both in the current frame, on the
// remaining lines of its row, and in the next frame.
export function commitDisplayLine(line: number) {
  const dirtyAttrIndex = minAttrIndex + (line >> 3);
  const attrAddrBase = dirtyAttrIndex << 5;

  // The snapshot of the dirty attributes is taken on every line, so that a character cell can be
  // recoloured following the beam, an effect some games use.
  const dirtyAttrs = memoryDirtyBitmap[dirtyAttrIndex];

  // Before the 8-line row begins: track the flash, commit the dirty attributes of the row to the
  // world and remember dirtyRowAttrs for the other 7 lines of the current row.
  if ((line & 7) === 0) {
    dirtyRowAttrs = dirtyAttrs;
    memoryDirtyBitmap[dirtyAttrIndex] = 0;
    commitAttrsRow(attrAddrBase);
  }

  const dirtyPixelIndex = dirtyPixelIndexByLine[line];
  const dirtyPixels = memoryDirtyBitmap[dirtyPixelIndex];

  let dirtyMask = dirtyRowAttrs | dirtyAttrs | dirtyPixels;
  if (dirtyMask === 0) return;
  memoryDirtyBitmap[dirtyPixelIndex] = 0;
  const addrBase = dirtyPixelIndex << 5;

  while (dirtyMask) {
    const bit = dirtyMask & -dirtyMask;
    const offset = 31 - Math.clz32(bit);
    dirtyMask ^= bit;

    const addr = addrBase + offset;
    const value = mem[addr];

    if (dirtyPixels & bit)
      commitMemoryValue(addr, value);

    const attrAddr = attrAddrBase + offset;
    const attr = mem[attrAddr];
    commitPixels(addr, attr, value);
  }
}

function commitAttrsRow(attrAddrBase: number) {
  /*!inline*/
  if (flashPhaseChanged) {
    // Once every 16 frames: check all 32 attributes in the row. Save dirty ones to world.
    // Mark those with flash bit as dirty for the subsequent display output phase.
    for (let offset = 0; offset < 32; offset++) {
      const bit = 1 << offset;
      const attrAddr = attrAddrBase + offset;
      const value = mem[attrAddr];
      if (dirtyRowAttrs & bit) commitMemoryValue(attrAddr, value);
      else if (value & BIT7) dirtyRowAttrs |= bit;
    }
  } else {
    // Hot path (15 of 16 frames): save dirty attributes to world
    let ab = dirtyRowAttrs;
    while (ab) {
      const bit = ab & -ab;
      ab ^= bit;
      const attrAddr = attrAddrBase + 31 - Math.clz32(bit);
      commitMemoryValue(attrAddr, mem[attrAddr]);
    }
  }
}

function commitPixels(addr: number, attr: number, value: number) {
  /*!inline*/
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
  let bits = value;

  for (let x = addrX + 14; x >= addrX; x -= 2) {
    if (bits & 1)
      world_copyRegionWithSignals(inkX0, inkY0, inkX1, inkY1, x, y);
    else
      world_copyRegionWithSignals(paperX0, paperY0, paperX1, paperY1, x, y);

    bits >>= 1;
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
