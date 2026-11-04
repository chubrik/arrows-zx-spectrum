import {
  ATTRIBUTES_AFTER_ADDR, ATTRIBUTES_MIN_ADDR, BIT4, BIT7, BORDER_LINE_COUNT, DISPLAY_LINE_COUNT,
  DISPLAY_MIN_ADDR, SCREEN_LINE_COUNT, TSTATES_AT_DISPLAY_FIRST_LINE_MIDDLE, TSTATES_PER_LINE
} from './constants.ts';
import { commitMemoryValue, initMemory, mem, memoryDirtyBitmap } from './memory.ts';
import { cpuX, cpuY, fetchGfx, memoryX, memoryY, screenEnabled } from './state.ts';
import { world_copyRegion, world_copyRegionWithSignals, world_getArrow } from './world-refs.ts';

// Screen = display area + border. The screen is committed line by line, following the beam:
// BORDER_LINE_COUNT lines of the top border, the display lines with the side borders and
// BORDER_LINE_COUNT lines of the bottom border, SCREEN_LINE_COUNT in all. The rest of the border
// is cropped. A display line is numbered from the display, a screen line from the top border.

let displayX: number;
let displayY: number;
const addrXs: number[] = []; // addr => pixel x (leftmost of the byte)
const addrYs: number[] = []; // addr => pixel y
const dirtyPixelIndexByLine: number[] = []; // display line => memoryDirtyBitmap index of its pixels
export const screenCommitTStatesByLine: number[] = []; // screen line => T-states to commit it at

// Border of a screen line as two runs of cells, [x, xEnd, x, xEnd] with xEnd exclusive: a line
// above or below the display has one run across the whole width minus the rounded corners and an
// empty second run, a display line has the left and the right margins
const borderRunsByLine: number[][] = [];
const borderYs: number[] = [];           // screen line => pixel y
const borderColorsByLine: number[] = []; // screen line => color its border is drawn with, -1 = none

const BORDER_PIXELS = 16;                             // Border shown at each side of the display
const SCREEN_PIXELS = 256 + BORDER_PIXELS * 2;        // Pixels in a screen line
const CORNER_SKIPS = [10, 7, 5, 4, 3, 2, 2, 1, 1, 1]; // Rounded corners: pixels cut from each end
                                                      // of the outermost lines

let paletteX: number;
let paletteYs: number[] = [];
let paletteIndex: number;

// The GFX block (gfx.ts) builds the graphics cache on the map and hands its tables over through
// state. A display byte is drawn with one copy of its window from the cache: the attribute sets
// the row, the byte value sets the X through the X table chosen for that attribute.
let attrYs: number[];                   // attr => y of the cache row
const xsByAttrDefault: number[][] = []; // attr => value => x of the byte's window
const xsByAttrFlash: number[][] = [];   // the same for the flash phase: ink and paper swapped
let xsByAttrCurrent = xsByAttrDefault;

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
  initGfx();

  // Every screen line is committed in the middle of its visible part
  for (let line = 0; line < SCREEN_LINE_COUNT; line++)
    screenCommitTStatesByLine[line] =
      TSTATES_AT_DISPLAY_FIRST_LINE_MIDDLE + (line - BORDER_LINE_COUNT) * TSTATES_PER_LINE;

  // The dirty bits of the 32 bytes of a display line share one memoryDirtyBitmap word: its index
  // is the byte address without the five low column bits. Of the address layout
  // 010ZZ LLL RRR CCCCC that leaves 010ZZLLLRRR, where ZZ is the third of the screen, LLL the line
  // within the row and RRR the row within the third.
  const minPixelIndex = DISPLAY_MIN_ADDR >> 5;

  for (let line = 0; line < DISPLAY_LINE_COUNT; line++)
    dirtyPixelIndexByLine[line] = minPixelIndex + (line & 0xC0) + ((line & 7) << 3) + ((line >> 3) & 7);
}

function initBorder() {
  const screenX = displayX - BORDER_PIXELS * 2;
  const screenY = displayY - BORDER_LINE_COUNT * 2;
  const lastLine = SCREEN_LINE_COUNT - 1;

  for (let line = 0; line < SCREEN_LINE_COUNT; line++) {
    borderYs[line] = screenY + line * 2;
    borderColorsByLine[line] = -1;
    const displayLine = line - BORDER_LINE_COUNT;

    if (displayLine >= 0 && displayLine < DISPLAY_LINE_COUNT) {
      borderRunsByLine[line] = [screenX, displayX, displayX + 512, screenX + SCREEN_PIXELS * 2];
      continue;
    }

    // Above or below the display: the lines nearest to the edge are cut at the corners
    const edge = line < BORDER_LINE_COUNT ? line : lastLine - line;
    const skip = edge < CORNER_SKIPS.length ? CORNER_SKIPS[edge] : 0;
    borderRunsByLine[line] = [screenX + skip * 2, screenX + (SCREEN_PIXELS - skip) * 2, 0, 0];
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
}

//todo: Do not start the screen until the tables are in state
function initGfx() {
  const gfx = fetchGfx()!;
  attrYs = gfx.attrYs;
  const valueXs = gfx.valueXs;
  const attrKinds = gfx.attrKinds;
  const attrKindsFlash = gfx.attrKindsFlash;

  for (let attr = 0; attr < 256; attr++) {
    xsByAttrDefault[attr] = valueXs[attrKinds[attr]];
    xsByAttrFlash[attr] = valueXs[attrKindsFlash[attr]];
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
    xsByAttrCurrent = flashPhase ? xsByAttrFlash : xsByAttrDefault;
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

  borderColorsByLine.fill(-1);
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

  //todo: The colors come from the graphics cache, the GFX block has to rebuild it for a new palette
  refreshScreen();
}

//#region Commit

export function commitScreen() {
  if (!screenEnabled) return;

  for (let line = 0; line < SCREEN_LINE_COUNT; line++)
    commitScreenLine(line);
}

// Commits a screen line following the beam: its border always, its display part if it has one.
// The two are independent: the border of a line knows only its runs, the display part knows
// nothing of the border.
export function commitScreenLine(line: number) {
  commitBorderLine(line);
  const displayLine = line - BORDER_LINE_COUNT;
  if (displayLine >= 0 && displayLine < DISPLAY_LINE_COUNT) commitDisplayLine(displayLine);
}

const minAttrIndex = ATTRIBUTES_MIN_ADDR >> 5;

// Snapshot of the dirty attributes of the current 8-line row, taken before the whole row is drawn
let dirtyRowAttrs = 0;

// Commits a display line following the beam: dirty pixels and attributes are copied to the world.
// An attribute changed before its 8-line row begins is marked clean, but is remembered in
// dirtyRowAttrs and drawn on all eight lines of the current row. An attribute changed while the row
// is being drawn is marked dirty the usual way, and it gets drawn both in the current frame, on the
// remaining lines of its row, and in the next frame.
function commitDisplayLine(line: number) {
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
  const cacheX = xsByAttrCurrent[attr][value];
  const cacheY = attrYs[attr];
  world_copyRegionWithSignals(cacheX, cacheY, cacheX + 15, cacheY + 1, addrXs[addr], addrYs[addr]);
}

export function commitBorder() {
  for (let line = 0; line < SCREEN_LINE_COUNT; line++)
    commitBorderLine(line);
}

// The border of a line is redrawn when the border color differs from the one it was drawn with.
// So a color changed through the port in the middle of a frame lands on the lines below at once
// and on the lines above in the next frame, and a split the game repeats every frame costs nothing
// after the first one.
function commitBorderLine(line: number) {
  const color = borderColor;
  if (borderColorsByLine[line] === color) return;
  borderColorsByLine[line] = color;

  // A pixel of the border color: for the attribute with ink = paper = color any window lies in
  // a solid color row of the cache
  const attr = color | (color << 3);
  const srcX = xsByAttrDefault[attr][0];
  const srcY = attrYs[attr];
  const runs = borderRunsByLine[line];
  const y = borderYs[line];
  fillBorder(runs[0], runs[1], y, srcX, srcY);
  fillBorder(runs[2], runs[3], y, srcX, srcY);
}

// Fills the cells [x, xEnd) of a line with the pixel at (srcX, srcY): the bridge to the GFX cache,
// where the run is copied at once from a solid color row instead of pixel by pixel
function fillBorder(x: number, xEnd: number, y: number, srcX: number, srcY: number) {
  const srcX1 = srcX + 1;
  const srcY1 = srcY + 1;

  for (let px = x; px < xEnd; px += 2)
    world_copyRegionWithSignals(srcX, srcY, srcX1, srcY1, px, y);
}

//#endregion
