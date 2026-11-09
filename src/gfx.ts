import { DISPLAY_WIDTH, PIXEL, SCREEN_WIDTH } from './common/constants';
import type { GfxTables, GlobalState } from './common/state';
import {
  world_copyRegion, world_copyRegionWithSignals, world_getArrow, world_getSignal, world_setSignal
} from './common/world-refs';

const { x, y } = getPosition()!;
const _globalState = globalState as GlobalState;
let prevTick = 0;

// The first two ticks have to be left to the palettes on the map to initialize. So here the block
// arranges a delayed activation for itself.
world_setSignal(x + 2, y, 5);

onActive(e => {
  world_setSignal(x, y, 0);

  const affect = prevTick < e.tick - 1;
  prevTick = e.tick;
  if (!affect) return;

  if (!inited)
    init();
  else
    switchPalette(world_getSignal(x, y - 1) ? -1 : 1);
});

let inited: boolean;
let cacheX: number;
let cacheY: number;

function init() {
  inited = true;
  const memoryX = _globalState.memX;
  const memoryY = _globalState.memY;
  cacheX = memoryX;
  cacheY = memoryY + 1024;

  // One-time initializations: the palettes, the cache layout by rows and columns, the GFX tables
  initPalettes(memoryX, memoryY);
  initCacheRows();
  initCacheColumns();
  const gfx = buildGfxTables();

  // The cache is drawn on the map at once, and again on every palette switch
  rebuildCache();

  // The GFX tables are handed to the CPU block only when everything is ready to work
  _globalState.gfx = gfx;
}

const BYTE_BITS = 8;
const BYTE_COUNT = 1 << BYTE_BITS;
const ATTR_COUNT = 256;
const COLORS = 8;    // Colors per brightness level
const FLASH = 0x80;  // Attribute bit: flash
const BRIGHT = 0x40; // Attribute bit: brightness

//#region Palettes

let paletteX: number;
const paletteYs: number[] = [];
let paletteIndex = 0; // Without a selector on the map, the first palette

function initPalettes(memoryX: number, memoryY: number) {
  paletteX = memoryX - 32;
  let palIndex = 0;
  let palY = memoryY;

  while (world_getArrow(paletteX + 15, palY)) { // Palette exists
    if (world_getArrow(paletteX + 18, palY + 1)) // Selector exists
      paletteIndex = palIndex;

    paletteYs[palIndex++] = palY;
    palY += 8;
  }
}

// Palette switch: the selector moves to the neighbouring palette, the cache is rebuilt from it and
// the CPU block gets a request to redraw the screen. The tables do not depend on the palette and
// stay as they are.
function switchPalette(inc: number) {
  const count = paletteYs.length;
  if (count < 2) return;

  const selectorX = paletteX + 18;
  const selectorY = paletteYs[paletteIndex] + 1;
  paletteIndex = (paletteIndex + inc + count) % count;
  const newSelectorY = paletteYs[paletteIndex] + 1;
  world_copyRegion(selectorX, selectorY, selectorX + 1, selectorY + 1, selectorX, newSelectorY);
  world_copyRegion(selectorX - 2, selectorY, selectorX - 1, selectorY + 1, selectorX, selectorY);

  rebuildCache();
  _globalState.do = 1;
  _globalState.pal = 1;
}

//#endregion

//#region Cache layout by rows

// Kinds of the X tables: the one the CPU block looks up the X of a byte's window in
const NORMAL = 0;      // The byte as is: the ones are the ink of the row
const INVERTED = 1;    // The inverted byte: the row holds the pair the other way round
const SOLID_INK = 2;   // The solid ink color of the row: the window of byte 0xFF for any byte
const SOLID_PAPER = 3; // The solid paper color of the row: the window of byte 0x00 for any byte

// The cache rows, top down: the solid colors without brightness (white..black) as wide as the
// screen, then the pairs ink > paper without and with brightness, ink descending, paper descending.
// A pair row holds the paper as the background and the ink along the ones of the de Bruijn
// sequence, so the window of any byte of that pair lies in it at the byte's shift. In a solid row
// any window will do.
const SOLID_ROW_COUNT = COLORS;
const rowInks: number[] = [];   // Row → ink color: 0..7 with the BRIGHT bit
const rowPapers: number[] = []; // Row → paper color: 0..7 with the BRIGHT bit
const keyRows = new Int32Array(ATTR_COUNT);  // Pair key → the row the pair lies in
const keyKinds = new Int32Array(ATTR_COUNT); // Pair key → the kind of the X table for it

function initCacheRows() {
  for (let color = COLORS - 1; color >= 0; color--)
    addRow(0, color, color);

  for (let bright = 0; bright <= BRIGHT; bright += BRIGHT)
    for (let ink = COLORS - 1; ink > 0; ink--)
      for (let paper = ink - 1; paper >= 0; paper--)
        addRow(bright, ink, paper);

  // The solid bright colors have no rows of their own and come from the pair rows: an ink color
  // from the window of byte 0xFF, and bright black, which is never ink, from the window of byte
  // 0x00 of a row where it is the paper.
  for (let color = 1; color < COLORS; color++)
    setKey(pairKey(BRIGHT, color, color), keyRows[pairKey(BRIGHT, color, color - 1)], SOLID_INK);

  setKey(pairKey(BRIGHT, 0, 0), keyRows[pairKey(BRIGHT, 1, 0)], SOLID_PAPER);
}

function addRow(bright: number, ink: number, paper: number) {
  const row = rowInks.length;
  rowInks.push(bright | ink);
  rowPapers.push(bright | paper);
  setKey(pairKey(bright, ink, paper), row, NORMAL);

  // The reverse pair is the same picture by the inverted byte
  if (ink !== paper)
    setKey(pairKey(bright, paper, ink), row, INVERTED);
}

function setKey(key: number, row: number, kind: number) {
  keyRows[key] = row;
  keyKinds[key] = kind;
}

// The pair key is the attribute without the flash bit, laid out as in the attribute: 0BPPPIII
function pairKey(bright: number, ink: number, paper: number) {
  return bright | (paper << 3) | ink;
}

// Y of a cache row on the map
function rowY(row: number) { return cacheY + row * PIXEL; }

//#endregion

//#region Cache layout by columns

// A de Bruijn sequence B(2, 8), built by Martin's greedy walk: after seven zeros, append a one
// whenever the byte it completes is new, otherwise a zero, until neither is. The walk is known to
// pass every byte once, ending with 0x00, and the 7 + 256 bits are the fewest that fit them.

const columnBits: number[] = []; // The bit sequence that contains every possible byte
const columnShifts = new Int32Array(BYTE_COUNT); // The window shift of every byte

function initCacheColumns() {
  const used = new Uint8Array(BYTE_COUNT);

  for (let i = 1; i < BYTE_BITS; i++)
    columnBits.push(0);

  let byte = 0; // The byte the last eight bits make

  for (; ;) {
    const zero = (byte << 1) & 0xFF;
    const one = zero | 1;
    byte = used[one] ? zero : one;
    if (used[byte]) break;

    used[byte] = 1;
    columnBits.push(byte & 1);
    columnShifts[byte] = columnBits.length - BYTE_BITS;
  }
}

//#endregion

//#region GFX tables for the CPU block

function buildGfxTables(): GfxTables {
  const attrYs: number[] = [];
  const attrKinds: number[] = [];
  const attrKindsFlash: number[] = [];

  for (let attr = 0; attr < ATTR_COUNT; attr++) {
    const key = attr & ~FLASH;
    const kind = keyKinds[key];
    attrYs.push(rowY(keyRows[key]));
    attrKinds.push(kind);

    // Flash swaps ink and paper, that is inverts the byte; a solid color does not care
    const flashKind = kind === NORMAL ? INVERTED : kind === INVERTED ? NORMAL : kind;
    attrKindsFlash.push(attr & FLASH ? flashKind : kind);
  }

  const valueXs: number[][] = [[], [], [], []]; // By kind
  const solidInkX = cacheX + columnShifts[0xFF] * PIXEL;   // Byte 0xFF window: all pixels ink
  const solidPaperX = cacheX + columnShifts[0x00] * PIXEL; // Byte 0x00 window: all pixels paper

  for (let value = 0; value < BYTE_COUNT; value++) {
    valueXs[NORMAL].push(cacheX + columnShifts[value] * PIXEL);
    valueXs[INVERTED].push(cacheX + columnShifts[value ^ 0xFF] * PIXEL);
    valueXs[SOLID_INK].push(solidInkX);
    valueXs[SOLID_PAPER].push(solidPaperX);
  }

  return { attrYs, valueXs, attrKinds, attrKindsFlash };
}

//#endregion

//#region Drawing the cache on the map

function rebuildCache() {
  const paletteY = paletteYs[paletteIndex];
  const rowCount = rowInks.length;
  const solidBottom = rowY(SOLID_ROW_COUNT); // The first row after the solid ones
  const cacheBottom = rowY(rowCount);

  // The background column: the paper of every row
  for (let row = 0; row < rowCount; row++)
    copyColor(paletteY, rowPapers[row], cacheX, rowY(row));

  // Stretching the background to the display width
  for (let width = PIXEL; width < DISPLAY_WIDTH; width *= 2)
    world_copyRegionWithSignals(
      cacheX, cacheY, cacheX + width - 1, cacheBottom - 1, cacheX + width, cacheY);

  // The right edge of the background: the solid rows up to the width of the screen, the pair rows
  // up to the length of the sequence
  const pairWidth = columnBits.length * PIXEL;

  world_copyRegionWithSignals(
    cacheX, cacheY, cacheX + SCREEN_WIDTH - DISPLAY_WIDTH - 1, solidBottom - 1,
    cacheX + DISPLAY_WIDTH, cacheY);

  world_copyRegionWithSignals(
    cacheX, solidBottom, cacheX + pairWidth - DISPLAY_WIDTH - 1, cacheBottom - 1,
    cacheX + DISPLAY_WIDTH, solidBottom);

  // The signal column: the ink of every pair row in place of the first one of the sequence, which
  // comes after the seven zeros
  const signalX = cacheX + (BYTE_BITS - 1) * PIXEL;

  for (let row = SOLID_ROW_COUNT; row < rowCount; row++)
    copyColor(paletteY, rowInks[row], signalX, rowY(row));

  // Filling with signals along the ones of the sequence
  for (let i = BYTE_BITS; i < columnBits.length; i++)
    if (columnBits[i])
      world_copyRegionWithSignals(
        signalX, solidBottom, signalX + PIXEL - 1, cacheBottom - 1, cacheX + i * PIXEL, solidBottom);
}

// Copies the pixel of color (0..7 with the BRIGHT bit) from the current palette to (x, y)
function copyColor(paletteY: number, color: number, x: number, y: number) {
  const srcX = paletteX + ((color & 7) << 1);
  const srcY = color & BRIGHT ? paletteY + PIXEL : paletteY; // Bright colors: second palette row
  world_copyRegionWithSignals(srcX, srcY, srcX + PIXEL - 1, srcY + PIXEL - 1, x, y);
}

//#endregion
