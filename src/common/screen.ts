import {
  ATTRIBUTES_AFTER_ADDR, ATTRIBUTES_MIN_ADDR, BIT4, BIT7, BORDER_LINE_COUNT, BORDER_WIDTH,
  DISPLAY_HEIGHT, DISPLAY_LINE_COUNT, DISPLAY_MIN_ADDR, DISPLAY_WIDTH, PIXEL, SCREEN_WIDTH,
  TOP_BORDER_LINE_COUNT, TSTATES_AT_DISPLAY_FIRST_LINE_MIDDLE, TSTATES_PER_LINE
} from './constants.ts';
import { commitMemoryValue, initMemory, mem, memoryDirtyBitmap } from './memory.ts';
import { cpuX, cpuY, fetchGfx, screenEnabled } from './state.ts';
import { world_copyRegion, world_copyRegionWithSignals } from './world-refs.ts';

//#region Constants

// Screen = display area + border. The screen is committed line by line, following the beam, in
// three phases the frame loop runs one after another: the top border lines, the display lines with
// their border margins and the bottom border lines. The rest of the border is cropped. The display
// lines are numbered from the display, the border lines from the top border, the bottom ones right
// after the top ones.

let displayX: number;
let displayY: number;
const addrXs: number[] = []; // addr => x of the leftmost pixel of the byte
const addrYs: number[] = []; // addr => y of the byte
const dirtyPixelIndexByLine: number[] = []; // display line => memoryDirtyBitmap index of its pixels
export const displayCommitTStates: number[] = []; // display line => T-states to commit it at

// A border line above or below the display is one run of cells across the whole width minus the
// rounded corners, drawn with one copy from a solid color row of the GFX cache
export const borderCommitTStates: number[] = []; // border line => T-states to commit it at
const borderXs: number[] = [];     // border line => x where the run starts
const borderSrcX1s: number[] = []; // border line => x where the copy of the run from the cache ends
const borderYs: number[] = [];     // border line => y
const borderColors: number[] = []; // border line => color it is drawn with, -1 = none

// The border margins of a display line are the same two runs on every line, BORDER_WIDTH cells
// at each side
let marginLeftX: number;  // The left edge of the screen
let marginRightX: number; // Right after the display
let marginSrcX1: number;  // x where the copy of a border margin from the cache ends
const marginColors: number[] = []; // display line => color its border margins are drawn with

// The outermost lines above and below the display are cut at the corners by CORNER_SKIPS pixels
// from each end
const CORNER_SKIPS = [10, 7, 5, 4, 3, 2, 2, 1, 1, 1];

// The GFX block (gfx.ts) builds the GFX cache on the map and hands its tables over through state.
// A display byte is drawn with one copy of its window from the cache: the attribute sets the row,
// the byte value sets the X through the X table chosen for that attribute.
let attrYs: number[];                   // attr => y of the cache row
const xsByAttrDefault: number[][] = []; // attr => value => x of the byte's window
const xsByAttrFlash: number[][] = [];   // the same for the flash phase: ink and paper swapped
let xsByAttrCurrent = xsByAttrDefault;
let cacheLeft: number; // Left edge of the GFX cache: a solid color row spans the screen from it

//#endregion

//#region Init

let inited: boolean;

export function initScreen() {
  if (inited) return;
  inited = true;

  displayX = cpuX + 80;
  displayY = cpuY - 400;

  initDisplayLines();
  initDisplayPixels();
  initGfx();
  initGfxBorder();
}

function initDisplayLines() {
  // Every line is committed in the middle of its visible part
  for (let line = 0; line < DISPLAY_LINE_COUNT; line++)
    displayCommitTStates[line] = TSTATES_AT_DISPLAY_FIRST_LINE_MIDDLE + line * TSTATES_PER_LINE;
}

function initDisplayPixels() {
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

  // The dirty bits of the 32 bytes of a display line share one memoryDirtyBitmap word: its index
  // is the byte address without the five low column bits. Of the address layout
  // 010ZZ LLL RRR CCCCC that leaves 010ZZLLLRRR, where ZZ is the third of the screen, LLL the line
  // within the row and RRR the row within the third.
  const minPixelIndex = DISPLAY_MIN_ADDR >> 5;

  for (let line = 0; line < DISPLAY_LINE_COUNT; line++)
    dirtyPixelIndexByLine[line] = minPixelIndex + (line & 0xC0) + ((line & 7) << 3) + ((line >> 3) & 7);
}

// The GFX tables are there by the first start of the screen: the GFX block puts them into state on
// the third tick after the map loads, and no game can be pasted before that.
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

  // The left edge of the cache is the leftmost window of the byte table, the byte with zero shift
  const byteXs = valueXs[0];
  cacheLeft = byteXs[0];

  for (let value = 1; value < 256; value++)
    if (byteXs[value] < cacheLeft) cacheLeft = byteXs[value];
}

function initGfxBorder() {
  const screenX = displayX - BORDER_WIDTH;

  marginLeftX = screenX;
  marginRightX = displayX + DISPLAY_WIDTH;
  marginSrcX1 = cacheLeft + BORDER_WIDTH - 1;

  for (let line = 0; line < DISPLAY_LINE_COUNT; line++)
    marginColors[line] = -1;

  for (let line = 0; line < BORDER_LINE_COUNT; line++) {
    const top = line < TOP_BORDER_LINE_COUNT;

    // Where the line lies counted from the first display line: the top ones above it, the bottom
    // ones below the last one
    const offset = top ? line - TOP_BORDER_LINE_COUNT : DISPLAY_LINE_COUNT + line - TOP_BORDER_LINE_COUNT;

    // The lines nearest to the edge are cut at the corners
    const edge = top ? line : BORDER_LINE_COUNT - 1 - line;
    const skip = edge < CORNER_SKIPS.length ? CORNER_SKIPS[edge] : 0;

    borderCommitTStates[line] = TSTATES_AT_DISPLAY_FIRST_LINE_MIDDLE + offset * TSTATES_PER_LINE;
    borderXs[line] = screenX + skip * PIXEL;
    borderSrcX1s[line] = cacheLeft + SCREEN_WIDTH - skip * PIXEL * 2 - 1;
    borderYs[line] = displayY + offset * PIXEL;
    borderColors[line] = -1;
  }
}

//#endregion

//#region Lifecycle

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
  const emptyAreaX = displayX + DISPLAY_WIDTH + 48; // An empty area to the right of the screen

  world_copyRegion(
    emptyAreaX, displayY, emptyAreaX + DISPLAY_WIDTH, displayY + DISPLAY_HEIGHT, displayX, displayY);

  clearBorder();
}

export function refreshScreen() {
  if (!screenEnabled) return;
  initMemory();
  initScreen();
  const indexAfterAttrs = ATTRIBUTES_AFTER_ADDR >> 5;

  for (let i = ATTRIBUTES_MIN_ADDR >> 5; i < indexAfterAttrs; i++)
    memoryDirtyBitmap[i] = -1;

  borderColors.fill(-1);
  marginColors.fill(-1);
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

//#endregion

//#region Commit

// The whole screen at once, in the order of the beam
export function commitScreen() {
  if (!screenEnabled) return;

  for (let line = 0; line < TOP_BORDER_LINE_COUNT; line++)
    commitBorderLine(line);

  for (let line = 0; line < DISPLAY_LINE_COUNT; line++)
    commitDisplayLine(line);

  for (let line = TOP_BORDER_LINE_COUNT; line < BORDER_LINE_COUNT; line++)
    commitBorderLine(line);
}

const minAttrIndex = ATTRIBUTES_MIN_ADDR >> 5;

// Snapshot of the dirty attributes of the current attribute row, the eight display lines that share
// a row of attributes, taken before the whole row is drawn
let dirtyRowAttrs = 0;

// Commits a display line following the beam: dirty pixels and attributes are committed to the map.
// An attribute changed before its attribute row begins is marked clean, but is remembered in
// dirtyRowAttrs and drawn on all eight lines of the current row. An attribute changed while the row
// is being drawn is marked dirty the usual way, and it gets drawn both in the current frame, on the
// remaining lines of its row, and in the next frame.
export function commitDisplayLine(line: number) {
  commitBorderMargins(line);
  const dirtyAttrIndex = minAttrIndex + (line >> 3);
  const attrAddrBase = dirtyAttrIndex << 5;

  // The snapshot of the dirty attributes is taken on every line, so that a character cell can be
  // recolored following the beam, an effect some games use.
  const dirtyAttrs = memoryDirtyBitmap[dirtyAttrIndex];

  // Before the attribute row begins: track the flash, commit the dirty attributes of the row to
  // the map and remember dirtyRowAttrs for the other 7 lines of the current row.
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
    // Once every 16 frames: check all 32 attributes in the row. Commit the dirty ones to the map.
    // Mark those with flash bit as dirty for the subsequent display output phase.
    for (let offset = 0; offset < 32; offset++) {
      const bit = 1 << offset;
      const attrAddr = attrAddrBase + offset;
      const value = mem[attrAddr];
      if (dirtyRowAttrs & bit) commitMemoryValue(attrAddr, value);
      else if (value & BIT7) dirtyRowAttrs |= bit;
    }
  } else {
    // Hot path (15 of 16 frames): commit the dirty attributes to the map
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

// The whole border at once: the top lines, the margins of the display lines, the bottom lines
export function commitBorder() {
  for (let line = 0; line < TOP_BORDER_LINE_COUNT; line++)
    commitBorderLine(line);

  for (let line = 0; line < DISPLAY_LINE_COUNT; line++)
    commitBorderMargins(line);

  for (let line = TOP_BORDER_LINE_COUNT; line < BORDER_LINE_COUNT; line++)
    commitBorderLine(line);
}

// The border of a line is redrawn when the border color differs from the one it was drawn with.
// So a color changed through the port in the middle of a frame lands on the lines below at once
// and on the lines above in the next frame, and a split the game repeats every frame costs nothing
// after the first one. The attribute with ink = paper = color has a solid color row in the cache
// as wide as the screen, the lines are copied from it.
export function commitBorderLine(line: number) {
  const color = borderColor;
  if (borderColors[line] === color) return;
  borderColors[line] = color;

  const srcY = attrYs[color | (color << 3)];

  world_copyRegionWithSignals(
    cacheLeft, srcY, borderSrcX1s[line], srcY + 1, borderXs[line], borderYs[line]);
}

// The border margins of a display line, the same way
function commitBorderMargins(line: number) {
  /*!inline*/
  const color = borderColor;

  if (marginColors[line] !== color) {
    marginColors[line] = color;

    const srcY = attrYs[color | (color << 3)];
    const srcY1 = srcY + 1;
    const y = displayY + line + line;
    world_copyRegionWithSignals(cacheLeft, srcY, marginSrcX1, srcY1, marginLeftX, y);
    world_copyRegionWithSignals(cacheLeft, srcY, marginSrcX1, srcY1, marginRightX, y);
  }
}

//#endregion
