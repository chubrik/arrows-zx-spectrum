import {
  ATTRIBUTES_AFTER_ADDR, ATTRIBUTES_MIN_ADDR, BIT4, BIT7, BORDER_LINE_COUNT, DISPLAY_LINE_COUNT,
  DISPLAY_MIN_ADDR, TOP_BORDER_LINE_COUNT, TSTATES_AT_DISPLAY_FIRST_LINE_MIDDLE, TSTATES_PER_LINE
} from './constants.ts';
import { commitMemoryValue, initMemory, mem, memoryDirtyBitmap } from './memory.ts';
import { cpuX, cpuY, fetchGfx, memoryX, memoryY, screenEnabled } from './state.ts';
import { world_copyRegion, world_copyRegionWithSignals, world_getArrow } from './world-refs.ts';

// Screen = display area + border. The screen is committed line by line, following the beam, in
// three phases the frame loop runs one after another: the top border lines, the display lines with
// their margins and the bottom border lines. The rest of the border is cropped. The display lines
// are numbered from the display, the border lines from the top border, the bottom ones right after
// the top ones.

let displayX: number;
let displayY: number;
const addrXs: number[] = []; // addr => pixel x (leftmost of the byte)
const addrYs: number[] = []; // addr => pixel y
const dirtyPixelIndexByLine: number[] = []; // display line => memoryDirtyBitmap index of its pixels
export const displayCommitTStates: number[] = []; // display line => T-states to commit it at

// A border line above or below the display is one run of cells across the whole width minus the
// rounded corners, drawn with one copy from a solid color row of the cache
export const borderCommitTStates: number[] = []; // border line => T-states to commit it at
const borderXs: number[] = [];     // border line => x where the run starts
const borderSrcX1s: number[] = []; // border line => x where the copy of the run from the cache ends
const borderYs: number[] = [];     // border line => pixel y
const borderColors: number[] = []; // border line => color it is drawn with, -1 = none

// The margins of a display line are the same two runs on every line, 16 pixels at each side
let marginLeftX: number;  // The left edge of the screen
let marginRightX: number; // Right after the display
let marginSrcX1: number;  // x where the copy of a margin from the cache ends
const marginColors: number[] = []; // display line => color its margins are drawn with, -1 = none

// The outermost lines above and below the display are cut at the corners by CORNER_SKIPS pixels
// from each end
const BORDER_PIXELS = 16;
const SCREEN_PIXELS = 256 + BORDER_PIXELS * 2; // Pixels in a screen line
const CORNER_SKIPS = [10, 7, 5, 4, 3, 2, 2, 1, 1, 1];

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
let cacheLeft: number; // Left edge of the cache: a solid color row spans the screen width from it

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

  initPalettes();
  initGfx();
  initBorder(); // After initGfx: the runs are laid out against the cache

  // Every line is committed in the middle of its visible part
  for (let line = 0; line < DISPLAY_LINE_COUNT; line++)
    displayCommitTStates[line] = TSTATES_AT_DISPLAY_FIRST_LINE_MIDDLE + line * TSTATES_PER_LINE;

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

  marginLeftX = screenX;
  marginRightX = displayX + 512;
  marginSrcX1 = cacheLeft + BORDER_PIXELS * 2 - 1;

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
    borderXs[line] = screenX + skip * 2;
    borderSrcX1s[line] = cacheLeft + (SCREEN_PIXELS - skip * 2) * 2 - 1;
    borderYs[line] = displayY + offset * 2;
    borderColors[line] = -1;
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

  // The left edge of the cache is the leftmost window of the byte table, the byte with zero shift
  const byteXs = valueXs[0];
  cacheLeft = byteXs[0];

  for (let value = 1; value < 256; value++)
    if (byteXs[value] < cacheLeft) cacheLeft = byteXs[value];
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

// Snapshot of the dirty attributes of the current 8-line row, taken before the whole row is drawn
let dirtyRowAttrs = 0;

// Commits a display line following the beam: dirty pixels and attributes are copied to the world.
// An attribute changed before its 8-line row begins is marked clean, but is remembered in
// dirtyRowAttrs and drawn on all eight lines of the current row. An attribute changed while the row
// is being drawn is marked dirty the usual way, and it gets drawn both in the current frame, on the
// remaining lines of its row, and in the next frame.
export function commitDisplayLine(line: number) {
  commitMargins(line);
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

// The whole border at once: the top lines, the margins of the display lines, the bottom lines
export function commitBorder() {
  for (let line = 0; line < TOP_BORDER_LINE_COUNT; line++)
    commitBorderLine(line);

  for (let line = 0; line < DISPLAY_LINE_COUNT; line++)
    commitMargins(line);

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

// The margins of a display line, the same way
function commitMargins(line: number) {
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
