import { readFileSync } from 'fs';
import { getQuickJS, type QuickJSContext } from 'quickjs-emscripten';
import { describe, expect, it } from 'vitest';
import { decodeClipboard, findCommandBlocks } from '../build/clipboard';
import { SMOKE_CPU_PATH, SMOKE_GFX_PATH, SMOKE_ROM_PATH } from '../build/utils';

// Smoke test of the packed command blocks in QuickJS — the engine of the Steam version of the game.
// Loads the CPU, GFX and ROM initializer blocks (built by build/build-test.ts) into a VM with a
// minimal world mock, boots the ROM for a number of frames and checks the runtime memory profile.

const FRAMES = 50;

// The mock keeps the bytes committed by the CPU (see values.ts: commitValue copies a row of the
// values cache into the byte position) and reads them back for fetchValue. Coordinates follow
// getPosition() = (1024, 1024): cpuX = 1040, cpuY = 1024 → cacheX0 = 784, cacheY = 2080;
// the display area starts at displayX = 1120, displayY = 624 and is 512 × 384 cells.
const PRELUDE = `
  var __active = [], __always = [], __tick = 0;
  var __stats = { getArrow: 0, memoryWrites: 0, screenWrites: 0, displayWrites: 0 };
  var __CX0 = 784, __CX1 = 792, __CY = 2080;
  var __DX = 1120, __DY = 624;
  // Two palettes stand on the map (paletteX = memoryX - 32) eight rows apart,
  // with the selector on the first one
  var __PX = 784, __PY = 1056, __PY_END = __PY + 16, __selectorY = __PY + 1;
  var __PALETTE = { type: 16, rotation: 0, flip: false, extra: 0 };
  var __Y0 = 1000, __bytes = new Uint8Array(256 * 600); // x in [0, 2048) by 8 cells, y in [1000, 1600)

  function onActive(cb) { __active.push(cb); }
  function always(cb) { __always.push(cb); }
  function getPosition() { return { x: 1024, y: 1024 }; }
  function getTick() { return __tick; }
  function log() { }
  function showText() { }
  // In the game globalState is a proxy over JSON, so a value that does not survive the round trip
  // (a typed array, a mutation in place) must not survive it here either
  var __globalStateRaw = {};
  var globalState = new Proxy({}, {
    get(_target, key) {
      if (typeof key !== 'string') return undefined;
      const raw = __globalStateRaw[key];
      if (raw === undefined) return undefined;
      try { return JSON.parse(raw); } catch (e) { return undefined; }
    },
    set(_target, key, value) {
      if (typeof key === 'string') {
        try { __globalStateRaw[key] = JSON.stringify(value); } catch (e) { __globalStateRaw[key] = undefined; }
      }
      return true;
    },
    deleteProperty(_target, key) {
      if (typeof key === 'string') __globalStateRaw[key] = undefined;
      return true;
    },
  });

  var world = {
    clearSignals() { },
    copy() { },
    copyRegion(x0, y0, x1, y1, dx, dy) {
      if (x0 === __PX + 18) __selectorY = dy; // The selector moved to another palette
      if ((x0 === __CX0 || x0 === __CX1) && x1 === x0 + 7 && y0 === y1 && y0 >= __CY && y0 < __CY + 256) {
        if (dx < 0 || dx >= 2048 || dy < __Y0 || dy >= __Y0 + 600) throw new Error('mock: out of range ' + dx + ',' + dy);
        __bytes[(dx >> 3) + ((dy - __Y0) << 8)] = y0 - __CY;
        __stats.memoryWrites++;
      }
    },
    copyRegionWithSignals(x0, y0, x1, y1, dx, dy) {
      __stats.screenWrites++;
      if (dx >= __DX && dx < __DX + 512 && dy >= __DY && dy < __DY + 384) __stats.displayWrites++;
    },
    getArrow(x, y) {
      __stats.getArrow++;
      if (y >= __PY && y <= __PY_END) { // The palette rows, outside the byte area
        if (x === __PX + 15) return y < __PY_END ? __PALETTE : null; // Palette exists
        if (x === __PX + 18) return y === __PY + 1 ? __PALETTE : null; // Selector exists
      }
      const b = __bytes[(x >> 3) + ((y - __Y0) << 8)];
      return { type: (b >> (7 - (x & 7))) & 1 ? 16 : 0, rotation: 0, flip: false, extra: 0 };
    },
    getChunks() { return []; },
    getSignal() { return 0; },
    removeArrow() { },
    setArrow() { },
    setCommandBlockCode() { },
    setSignal() { },
  };

  function __byte(x, y) { return __bytes[(x >> 3) + ((y - __Y0) << 8)]; }
  function __load(code) { new Function(code)(); }
  // The data block deduplicates its activations by the tick, so every callback needs an event
  function __event(type) { return { type: type, tick: __tick, x: 1024, y: 1024 }; }
  // An activation belongs to a tick of its own, the way a player keypress does. By default it goes
  // to the block loaded last; the blocks are numbered in the order they are loaded
  function __activate(index = __active.length - 1) { __tick++; __active[index](__event('commandBlockActive')); }
  function __ticks(n) {
    for (let i = 0; i < n; i++) { __tick++; for (const cb of __always) cb(__event('always')); }
  }
`;

function evalOrThrow(vm: QuickJSContext, code: string, name: string): unknown {
  const result = vm.evalCode(code, name);
  if (result.error) {
    const error = vm.dump(result.error);
    result.error.dispose();
    throw new Error(`${name}: ${error?.message ?? JSON.stringify(error)}\n${error?.stack ?? ''}`);
  }
  const value = vm.dump(result.value);
  result.value.dispose();
  return value;
}

/** The code of the single command block of a clipboard string, the way the game would paste it. */
function blockCode(path: string): string {
  return findCommandBlocks(decodeClipboard(readFileSync(path, 'utf8')))[0].code!;
}

describe('Smoke test (dist)', () => {
  it(`boots the ROM for ${FRAMES} frames`, async () => {
    const cpu = blockCode(SMOKE_CPU_PATH);
    const gfx = blockCode(SMOKE_GFX_PATH);
    const rom = blockCode(SMOKE_ROM_PATH);

    const QuickJS = await getQuickJS();
    const runtime = QuickJS.newRuntime();
    const vm = runtime.newContext();

    try {
      evalOrThrow(vm, PRELUDE, 'prelude.js');
      evalOrThrow(vm, `__load(${JSON.stringify(cpu)})`, 'cpu.js');
      // The GFX block finds the palettes, builds the GFX cache and puts its tables into
      // globalState. It skips the first activation, the palettes light up a tick later, so it is
      // activated twice
      evalOrThrow(vm, `__load(${JSON.stringify(gfx)}); __activate(); __ticks(1); __activate();`, 'gfx.js');
      expect(evalOrThrow(vm, `globalState.gfx.attrYs.length`, 'gfx-tables.js')).toBe(256);
      // Screen enabled before anything is loaded: refreshScreen must cope with untouched memory
      evalOrThrow(vm, `globalState.do = 1; globalState.scr = 1; __ticks(1);`, 'scr.js');
      evalOrThrow(vm, `__load(${JSON.stringify(rom)}); __activate(); __ticks(1);`, 'rom.js');
      // The port byte is kept on the map like a CPU register, at (cpuX + 8, cpuY - 17)
      evalOrThrow(vm, `globalState.do = 1; globalState.prt = 5; __ticks(1);`, 'prt.js');
      expect(evalOrThrow(vm, `__byte(1048, 1007)`, 'port.js')).toBe(5);

      // A palette switch is a repeated activation of the GFX block, the first one loaded with
      // onActive: the selector moves to the second palette, eight rows down plus the row of its own
      // offset, the cache is rebuilt and the pal flag asks the CPU block to redraw the screen
      expect(evalOrThrow(vm, `__activate(0); globalState.pal`, 'pal.js')).toBe(1);
      expect(evalOrThrow(vm, `__selectorY - __PY`, 'selector.js')).toBe(9);
      expect(evalOrThrow(vm, `__ticks(1); globalState.pal`, 'pal-done.js')).toBe(0);

      evalOrThrow(vm, `globalState.do = 1; globalState.run = 1; globalState.max = 1; __ticks(1 + ${FRAMES});`, 'run.js');

      const statsHandle = vm.getProp(vm.global, '__stats');
      const stats = vm.dump(statsHandle) as {
        getArrow: number; memoryWrites: number; screenWrites: number; displayWrites: number;
      };
      statsHandle.dispose();

      const usageHandle = runtime.computeMemoryUsage();
      const usage = vm.dump(usageHandle) as { memory_used_size: number; prop_count: number };
      usageHandle.dispose();

      // The ROM boot writes to RAM (RAM test) and to the screen (CLS)
      expect(stats.memoryWrites).toBeGreaterThan(0);
      expect(stats.screenWrites).toBeGreaterThan(0);
      // The display itself, not only the border: a display line commit that returns early would
      // still pass on the border copies
      expect(stats.displayWrites).toBeGreaterThan(0);

      // A sparse (hash-map) array of 64K entries would add 65K object properties
      expect(usage.prop_count).toBeLessThan(10_000);

      // wasm32 QuickJS: 8-byte values, about half of the native 64-bit footprint
      expect(usage.memory_used_size).toBeLessThan(8 << 20);
    }
    finally {
      vm.dispose();
      runtime.dispose();
    }
  });
});
