import { readFileSync } from 'fs';
import { getQuickJS, type QuickJSContext } from 'quickjs-emscripten';
import { describe, expect, it } from 'vitest';
import { SMOKE_DIR } from '../build/utils';

// Smoke test of the packed command blocks in QuickJS — the engine of the Steam version of the game.
// Loads the CPU block and the ROM initializer (built by build/build-test.ts) into a VM with a
// minimal world mock, boots the ROM for a number of frames and checks the runtime memory profile.

const FRAMES = 50;

// The mock keeps the bytes committed by the CPU (see values.ts: commitValue copies a row of the
// values cache into the byte position) and reads them back for fetchValue. Coordinates follow
// getPosition() = (1024, 1024): cpuX = 1040, cpuY = 1024 → cacheX0 = 736, cacheY = 1312.
const PRELUDE = `
  var __active = [], __always = [];
  var __stats = { getArrow: 0, memoryWrites: 0, screenWrites: 0 };
  var __CX0 = 736, __CX1 = 744, __CY = 1312;
  var __Y0 = 1000, __bytes = new Uint8Array(256 * 600); // x in [0, 2048) by 8 cells, y in [1000, 1600)

  function onActive(cb) { __active.push(cb); }
  function always(cb) { __always.push(cb); }
  function getPosition() { return { x: 1024, y: 1024 }; }
  function getTick() { return 0; }
  function log() { }
  function showText() { }
  // In the game state is a proxy over JSON, so a value that does not survive the round trip
  // (a typed array, a mutation in place) must not survive it here either
  var __stateRaw = {};
  var state = new Proxy({}, {
    get(_target, key) {
      if (typeof key !== 'string') return undefined;
      const raw = __stateRaw[key];
      if (raw === undefined) return undefined;
      try { return JSON.parse(raw); } catch (e) { return undefined; }
    },
    set(_target, key, value) {
      if (typeof key === 'string') {
        try { __stateRaw[key] = JSON.stringify(value); } catch (e) { __stateRaw[key] = undefined; }
      }
      return true;
    },
    deleteProperty(_target, key) {
      if (typeof key === 'string') __stateRaw[key] = undefined;
      return true;
    },
  });

  var world = {
    clearSignals() { },
    copy() { },
    copyRegion(x0, y0, x1, y1, dx, dy) {
      if ((x0 === __CX0 || x0 === __CX1) && x1 === x0 + 7 && y0 === y1 && y0 >= __CY && y0 < __CY + 256) {
        if (dx < 0 || dx >= 2048 || dy < __Y0 || dy >= __Y0 + 600) throw new Error('mock: out of range ' + dx + ',' + dy);
        __bytes[(dx >> 3) + ((dy - __Y0) << 8)] = y0 - __CY;
        __stats.memoryWrites++;
      }
    },
    copyRegionWithSignals() { __stats.screenWrites++; },
    getArrow(x, y) {
      __stats.getArrow++;
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

  function __load(code) { new Function(code)(); }
  function __activate() { __active[__active.length - 1](); }
  function __ticks(n) { for (let i = 0; i < n; i++) for (const cb of __always) cb(); }
`;

function evalOrThrow(vm: QuickJSContext, code: string, name: string) {
  const result = vm.evalCode(code, name);
  if (result.error) {
    const error = vm.dump(result.error);
    result.error.dispose();
    throw new Error(`${name}: ${error?.message ?? JSON.stringify(error)}\n${error?.stack ?? ''}`);
  }
  result.value.dispose();
}

describe('dist smoke (QuickJS)', () => {
  it(`boots the ROM for ${FRAMES} frames`, async () => {
    const cpu = readFileSync(`${SMOKE_DIR}/z80.pack.js`, 'utf8');
    const rom = readFileSync(`${SMOKE_DIR}/initializer.js`, 'utf8');

    const QuickJS = await getQuickJS();
    const runtime = QuickJS.newRuntime();
    const vm = runtime.newContext();

    try {
      evalOrThrow(vm, PRELUDE, 'prelude.js');
      evalOrThrow(vm, `__load(${JSON.stringify(cpu)})`, 'cpu.js');
      // Screen enabled before anything is loaded: refreshScreen must cope with untouched memory
      evalOrThrow(vm, `state.do = 1; state.scr = 1; __ticks(1);`, 'scr.js');
      evalOrThrow(vm, `__load(${JSON.stringify(rom)}); __activate(); __ticks(1);`, 'rom.js');
      evalOrThrow(vm, `state.do = 1; state.run = 1; state.max = 1; __ticks(1 + ${FRAMES});`, 'run.js');

      const statsHandle = vm.getProp(vm.global, '__stats');
      const stats = vm.dump(statsHandle) as { getArrow: number; memoryWrites: number; screenWrites: number };
      statsHandle.dispose();

      const usageHandle = runtime.computeMemoryUsage();
      const usage = vm.dump(usageHandle) as { memory_used_size: number; prop_count: number };
      usageHandle.dispose();

      // The ROM boot writes to RAM (RAM test) and to the screen (CLS)
      expect(stats.memoryWrites).toBeGreaterThan(0);
      expect(stats.screenWrites).toBeGreaterThan(0);

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
