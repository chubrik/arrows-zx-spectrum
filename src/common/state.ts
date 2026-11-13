import { clearCpu, fetchCpu, resetCpu, restoreCpu } from '../cpu/init';
import { fetchBeeper } from './beeper';
import { ATTRIBUTES_AFTER_ADDR, RAM_MIN_ADDR, xFFFF } from './constants';
import { clearMemory, fetchMemory, restoreMemory } from './memory';
import { clearPort, fetchPort, restorePort } from './port';
import { clearScreen, commitBorder, initScreen, refreshScreen } from './screen';

export let cpuX: number;
export let cpuY: number;
export let memoryX: number;
export let memoryY: number;
export let cpuStarted = false;
let _globalState: GlobalState;

export function initState() {
  const pos = getPosition();
  cpuX = (pos.x & ~15) + 16;
  cpuY = pos.y & ~15;
  _globalState = globalState as GlobalState;
  _globalState.memX = memoryX = cpuX - 224;
  _globalState.memY = memoryY = cpuY + 32;
}

export let stepMode = false;
export let speedLimited = true;
export let screenEnabled = true;
export let beeperEnabled = true;
export let memoryCommitFromAddr = ATTRIBUTES_AFTER_ADDR;

export function fetchState() {
  if (!_globalState.do) return;
  _globalState.do = 0;

  if (_globalState.run) {
    cpuStarted = _globalState.run > 0;
    _globalState.run = 0;

    if (cpuStarted) {
      fetchCpu();
      fetchPort();
      fetchBeeper();
      fetchMemory();
      refreshScreen();
    }
  }

  if (_globalState.res) {
    resetCpu();
    _globalState.res = 0;
  }

  if (_globalState.by1) {
    stepMode = _globalState.by1 > 0;
    _globalState.by1 = 0;
  }

  if (_globalState.max) {
    speedLimited = _globalState.max < 0;
    _globalState.max = 0;
  }

  const cpu = _globalState.cpu;

  if (cpu) {
    restoreCpu(cpu);
    _globalState.cpu = 0;
  }

  if (_globalState.prt != null) {
    initScreen();
    restorePort(_globalState.prt);
    if (screenEnabled) commitBorder();
    _globalState.prt = null;
  }

  const rom = _globalState.rom;

  if (rom) {
    clearCpu();
    clearPort();
    restoreMemory(0x0000, rom);
    clearMemory(RAM_MIN_ADDR, xFFFF);
    clearScreen();
    _globalState.rom = 0;
  }

  const ram1 = _globalState.ram1;

  if (ram1) {
    restoreMemory(0x4000, ram1);
    refreshScreen();
    _globalState.ram1 = 0;
  }

  const ram2 = _globalState.ram2;

  if (ram2) {
    restoreMemory(0x8000, ram2);
    _globalState.ram2 = 0;
  }

  const ram3 = _globalState.ram3;

  if (ram3) {
    restoreMemory(0xC000, ram3);
    _globalState.ram3 = 0;
  }

  if (_globalState.scr) {
    if (_globalState.scr > 0) {
      screenEnabled = true;
      memoryCommitFromAddr = ATTRIBUTES_AFTER_ADDR;
      refreshScreen();
    }
    else {
      clearScreen();
      screenEnabled = false;
      memoryCommitFromAddr = RAM_MIN_ADDR;
    }
    _globalState.scr = 0;
  }

  if (_globalState.pal) {
    refreshScreen();
    _globalState.pal = 0;
  }

  if (_globalState.snd) {
    beeperEnabled = _globalState.snd > 0;
    _globalState.snd = 0;
  }
}

// The GFX tables are read from globalState in one access: every read parses the JSON
export function fetchGfx(): GfxTables | undefined { /*!inline*/ return _globalState.gfx; }

export type GlobalState = {
  memX: number;
  memY: number;
  gfx: GfxTables | undefined;
  do: number;
  run: number;
  res: number;
  by1: number;
  max: number;
  cpu: number[] | 0;
  prt: number | null;
  rom: number[] | 0;
  ram1: number[] | 0;
  ram2: number[] | 0;
  ram3: number[] | 0;
  scr: number;
  pal: number;
  snd: number;
}

/**
 * Screen rendering tables. The GFX block builds them from the layout of the GFX cache on the map
 * and hands them to the CPU block through globalState. All coordinates are absolute.
 */
export type GfxTables = {
  /** Attribute → Y of the cache row */
  attrYs: number[];
  /** [kind][byte] → X of the byte's window in the row. Kinds: 0 — the byte as is, 1 — inverted,
   *  2 — the solid ink of the row, 3 — the solid paper of the row */
  valueXs: number[][];
  /** Attribute → kind of the X table */
  attrKinds: number[];
  /** Attribute → kind of the X table in the flash phase, when ink and paper are swapped */
  attrKindsFlash: number[];
}
