import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';
import { decodeClipboard, findCommandBlocks } from '../build/clipboard';
import { SMOKE_GFX_PATH } from '../build/utils';
import type { GfxTables } from '../src/common/state';

// The built GFX block on a mock map: two palettes of 16 colors, a cell holds the color number and
// a region copy carries it over. Checks that the window of every byte of every attribute, found
// through the tables in globalState, consists of exactly the pixels the attribute sets, in both
// flash phases, and that a palette switch rebuilds the cache from the second palette.

const MEM_X = 1000;
const MEM_Y = 2000;
const PALETTE_X = MEM_X - 32;
const PALETTE_Y = MEM_Y;
const PALETTE_STEP = 8;         // The second palette stands eight rows below the first
const SECOND_COLOR_BASE = 16;   // Colors of the second palette: 16..31
const SELECTOR_X = PALETTE_X + 18;
const FLASH = 0x80;
const BRIGHT = 0x40;

type Cells = Map<string, number>;
const key = (x: number, y: number) => `${x},${y}`;
const get = (cells: Cells, x: number, y: number) => cells.get(key(x, y)) ?? -1;

/** Loads the block onto the mock map and activates it; returns the map and access to the block */
function runGfx() {
  const code = findCommandBlocks(decodeClipboard(readFileSync(SMOKE_GFX_PATH, 'utf8')))[0].code!;
  const cells: Cells = new Map();

  for (let palette = 0; palette < 2; palette++)
    for (let c = 0; c < 16; c++)
      for (let dx = 0; dx < 2; dx++)
        for (let dy = 0; dy < 2; dy++)
          cells.set(
            key(PALETTE_X + ((c & 7) << 1) + dx, PALETTE_Y + palette * PALETTE_STEP + ((c & 8) >> 2) + dy),
            palette * SECOND_COLOR_BASE + c);

  let copies = 0;
  let selectorY = PALETTE_Y + 1;

  function copyRegion(x0: number, y0: number, x1: number, y1: number, dx: number, dy: number) {
    const w = x1 - x0 + 1;
    const h = y1 - y0 + 1;
    const buf: number[] = [];

    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++)
        buf.push(get(cells, x0 + i, y0 + j));

    let k = 0;

    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const v = buf[k++];
        if (v === -1) cells.delete(key(dx + i, dy + j));
        else cells.set(key(dx + i, dy + j), v);
      }
  }

  const world = {
    setSignal() { },
    getSignal() { return 0; },
    getArrow(x: number, y: number) {
      const paletteRow = (y - PALETTE_Y) % PALETTE_STEP === 0 && y < PALETTE_Y + 2 * PALETTE_STEP;
      if (x === PALETTE_X + 15 && paletteRow) return { type: 1 }; // Palette exists
      if (x === SELECTOR_X && y === PALETTE_Y + 1) return { type: 1 }; // Selector exists
      return null;
    },
    copyRegion(x0: number, y0: number, x1: number, y1: number, dx: number, dy: number) {
      if (x0 === SELECTOR_X) selectorY = dy; // The selector moved to another palette
      copyRegion(x0, y0, x1, y1, dx, dy);
    },
    copyRegionWithSignals(x0: number, y0: number, x1: number, y1: number, dx: number, dy: number) {
      copies++;
      copyRegion(x0, y0, x1, y1, dx, dy);
    },
  };

  // In the game globalState is a proxy over JSON
  const store: Record<string, string> = { memX: JSON.stringify(MEM_X), memY: JSON.stringify(MEM_Y) };
  const globalState = new Proxy({} as Record<string, unknown>, {
    get: (_, p) => typeof p === 'string' && p in store ? JSON.parse(store[p]) : undefined,
    set: (_, p, v) => { if (typeof p === 'string') store[p] = JSON.stringify(v); return true; },
  });

  let activate: ((e: { tick: number }) => void) | undefined;
  const onActive = (cb: typeof activate) => { activate = cb; };
  const getPosition = () => ({ x: 0, y: 0 });

  new Function('world', 'globalState', 'onActive', 'getPosition', code)(world, globalState, onActive, getPosition);
  activate!({ tick: 1 }); // Skipped: the palettes light up a tick later
  activate!({ tick: 3 });

  return {
    cells,
    activate: (tick: number) => activate!({ tick }),
    gfx: () => globalState.gfx as GfxTables,
    flags: () => ({ do: globalState.do, pal: globalState.pal }),
    copies: () => copies,
    selectorY: () => selectorY,
  };
}

/** How many cells in the byte windows disagree with the attribute; colorBase is the number of
 *  color 0 in the palette wanted */
function countMismatches(cells: Cells, gfx: GfxTables, colorBase: number): number {
  let mismatches = 0;

  for (let attr = 0; attr < 256; attr++) {
    const bright = (attr & BRIGHT) >> 3;
    const ink = colorBase + (bright | (attr & 7));
    const paper = colorBase + (bright | ((attr >> 3) & 7));
    const y = gfx.attrYs[attr];

    for (const [kinds, swapped] of [[gfx.attrKinds, false], [gfx.attrKindsFlash, !!(attr & FLASH)]] as const) {
      const xs = gfx.valueXs[kinds[attr]];
      const inkPixel = swapped ? paper : ink;
      const paperPixel = swapped ? ink : paper;

      for (let value = 0; value < 256; value++) {
        const x = xs[value];

        for (let i = 0; i < 8; i++) {
          const expected = (value >> (7 - i)) & 1 ? inkPixel : paperPixel;

          for (let dx = 0; dx < 2; dx++)
            for (let dy = 0; dy < 2; dy++)
              if (get(cells, x + i * 2 + dx, y + dy) !== expected) mismatches++;
        }
      }
    }
  }

  return mismatches;
}

describe('GFX block (dist)', () => {
  const block = runGfx();
  const gfx = block.gfx();
  const cacheY = Math.min(...gfx.attrYs); // The top row of the cache

  it('builds the cache: 64 rows, solid rows as wide as the screen', () => {
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const k of block.cells.keys()) {
      const [x, y] = k.split(',').map(Number);
      if (y < cacheY) continue;
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }

    expect(maxX - MEM_X).toBe(575);
    expect(maxY - cacheY).toBe(127);
    expect(block.copies()).toBe(257);
  });

  it('puts the tables into globalState', () => {
    expect(gfx.attrYs).toHaveLength(256);
    expect(gfx.valueXs.map(xs => xs.length)).toEqual([256, 256, 256, 256]);
    expect(gfx.attrKinds).toHaveLength(256);
    expect(gfx.attrKindsFlash).toHaveLength(256);
  });

  it('draws every byte of every attribute from the cache, in both flash phases', () => {
    expect(countMismatches(block.cells, gfx, 0)).toBe(0);
  });

  it('switches the palette: moves the selector, rebuilds the cache and asks for a redraw', () => {
    block.activate(5);

    expect(block.selectorY()).toBe(PALETTE_Y + PALETTE_STEP + 1);
    expect(block.flags()).toEqual({ do: 1, pal: 1 });
    expect(block.copies()).toBe(257 * 2);
    expect(block.gfx()).toEqual(gfx); // The tables do not depend on the palette
    expect(countMismatches(block.cells, gfx, SECOND_COLOR_BASE)).toBe(0);
  });
});
