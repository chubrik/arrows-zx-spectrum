import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';
import { decodeClipboard, findCommandBlocks } from '../build/clipboard';
import { SMOKE_GFX_PATH } from '../build/utils';
import type { GfxTables } from '../src/common/state';

// The built GFX block on a mock map: a palette of 16 colors, a cell holds the color number and a
// region copy carries it over. Checks that the window of every byte of every attribute, found
// through the tables in state, consists of exactly the pixels the attribute sets, in both flash
// phases.

const MEM_X = 1000;
const MEM_Y = 2000;
const PALETTE_X = MEM_X - 32;
const PALETTE_Y = MEM_Y;
const FLASH = 0x80;
const BRIGHT = 0x40;

type Cells = Map<string, number>;
const key = (x: number, y: number) => `${x},${y}`;
const get = (cells: Cells, x: number, y: number) => cells.get(key(x, y)) ?? -1;

/** Loads the block, activates it and returns the map together with the tables from state */
function runGfx(): { cells: Cells; gfx: GfxTables; copies: number } {
  const code = findCommandBlocks(decodeClipboard(readFileSync(SMOKE_GFX_PATH, 'utf8')))[0].code!;
  const cells: Cells = new Map();

  for (let c = 0; c < 16; c++)
    for (let dx = 0; dx < 2; dx++)
      for (let dy = 0; dy < 2; dy++)
        cells.set(key(PALETTE_X + ((c & 7) << 1) + dx, PALETTE_Y + ((c & 8) >> 2) + dy), c);

  let copies = 0;

  const world = {
    setSignal() { },
    getArrow(x: number, y: number) {
      if (x === PALETTE_X + 15 && y === PALETTE_Y) return { type: 1 }; // Palette exists
      if (x === PALETTE_X + 18 && y === PALETTE_Y + 1) return { type: 1 }; // Selector exists
      return null;
    },
    copyRegionWithSignals(x0: number, y0: number, x1: number, y1: number, dx: number, dy: number) {
      copies++;
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
    },
  };

  // In the game state is a proxy over JSON
  const store: Record<string, string> = { memX: JSON.stringify(MEM_X), memY: JSON.stringify(MEM_Y) };
  const state = new Proxy({} as Record<string, unknown>, {
    get: (_, p) => typeof p === 'string' && p in store ? JSON.parse(store[p]) : undefined,
    set: (_, p, v) => { if (typeof p === 'string') store[p] = JSON.stringify(v); return true; },
  });

  let activate: ((e: { tick: number }) => void) | undefined;
  const onActive = (cb: typeof activate) => { activate = cb; };
  const getPosition = () => ({ x: 0, y: 0 });

  new Function('world', 'state', 'onActive', 'getPosition', code)(world, state, onActive, getPosition);
  activate!({ tick: 1 }); // Skipped: the palettes light up a tick later
  activate!({ tick: 3 });

  return { cells, gfx: state.gfx as GfxTables, copies };
}

describe('GFX block (dist)', () => {
  const { cells, gfx, copies } = runGfx();
  const cacheY = Math.min(...gfx.attrYs); // The top row of the cache

  it('builds the cache: 64 rows, solid rows as wide as the screen with the border', () => {
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const k of cells.keys()) {
      const [x, y] = k.split(',').map(Number);
      if (y < cacheY) continue;
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }

    expect(maxX - MEM_X).toBe(575);
    expect(maxY - cacheY).toBe(127);
    expect(copies).toBe(257);
  });

  it('puts the tables into state', () => {
    expect(gfx.attrYs).toHaveLength(256);
    expect(gfx.valueXs.map(xs => xs.length)).toEqual([256, 256, 256, 256]);
    expect(gfx.attrKinds).toHaveLength(256);
    expect(gfx.attrKindsFlash).toHaveLength(256);
  });

  it('draws every byte of every attribute from the cache, in both flash phases', () => {
    let mismatches = 0;

    for (let attr = 0; attr < 256; attr++) {
      const bright = (attr & BRIGHT) >> 3;
      const ink = bright | (attr & 7);
      const paper = bright | ((attr >> 3) & 7);
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

    expect(mismatches).toBe(0);
  });
});
