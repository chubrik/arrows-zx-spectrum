import { clearCpu, fetchCpu, resetCpu, restoreCpu } from '../cpu/init';
import { fetchBeeper } from './beeper';
import { ATTRIBUTES_AFTER_ADDR, RAM_MIN_ADDR, xFFFF } from './constants';
import { clearMemory, fetchMemory, restoreMemory } from './memory';
import { clearPort, fetchPort, restorePort } from './port';
import { clearScreen, commitBorder, initScreen, refreshScreen, switchPalette } from './screen';

export let cpuX: number;
export let cpuY: number;
export let memoryX: number;
export let memoryY: number;
export let cpuStarted = false;
let _state: State;

export function initState() {
  const pos = getPosition()!;
  cpuX = (pos.x & ~15) + 16;
  cpuY = pos.y & ~15;
  _state = state as State;
  _state.memX = memoryX = cpuX - 224;
  _state.memY = memoryY = cpuY + 32;
}

export let stepMode = false;
export let speedLimited = true;
export let screenEnabled = true;
export let beeperEnabled = true;
export let memoryCommitFromAddr = ATTRIBUTES_AFTER_ADDR;

export function fetchState() {
  if (!_state.do) return;
  _state.do = 0;

  if (_state.run) {
    cpuStarted = _state.run > 0;
    _state.run = 0;

    if (cpuStarted) {
      fetchCpu();
      fetchPort();
      fetchBeeper();
      fetchMemory();
      refreshScreen();
    }
  }

  if (_state.res) {
    resetCpu();
    _state.res = 0;
  }

  if (_state.by1) {
    stepMode = _state.by1 > 0;
    _state.by1 = 0;
  }

  if (_state.max) {
    speedLimited = _state.max < 0;
    _state.max = 0;
  }

  const cpu = _state.cpu;

  if (cpu) {
    restoreCpu(cpu);
    _state.cpu = 0;
  }

  if (_state.prt != null) {
    initScreen();
    restorePort(_state.prt);
    if (screenEnabled) commitBorder();
    _state.prt = null;
  }

  const rom = _state.rom;

  if (rom) {
    clearCpu();
    clearPort();
    restoreMemory(0x0000, rom);
    clearMemory(RAM_MIN_ADDR, xFFFF);
    clearScreen();
    _state.rom = 0;
  }

  const ram1 = _state.ram1;

  if (ram1) {
    restoreMemory(0x4000, ram1);
    refreshScreen();
    _state.ram1 = 0;
  }

  const ram2 = _state.ram2;

  if (ram2) {
    restoreMemory(0x8000, ram2);
    _state.ram2 = 0;
  }

  const ram3 = _state.ram3;

  if (ram3) {
    restoreMemory(0xC000, ram3);
    _state.ram3 = 0;
  }

  if (_state.scr) {
    if (_state.scr > 0) {
      screenEnabled = true;
      memoryCommitFromAddr = ATTRIBUTES_AFTER_ADDR;
      refreshScreen();
    }
    else {
      clearScreen();
      screenEnabled = false;
      memoryCommitFromAddr = RAM_MIN_ADDR;
    }
    _state.scr = 0;
  }

  if (_state.pal) {
    switchPalette(_state.pal);
    _state.pal = 0;
  }

  if (_state.snd) {
    beeperEnabled = _state.snd > 0;
    _state.snd = 0;
  }
}

// The GFX tables are read from state in one access: every read parses the JSON
export function fetchGfx(): GfxTables | undefined { return _state.gfx; }

export type State = {
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
 * Screen rendering tables. The GFX block builds them from the layout of the graphics cache on the
 * map and hands them to the main block through state. All coordinates are absolute.
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
