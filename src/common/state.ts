import { clearCpu, fetchCpu, resetCpu, restoreCpu } from '../z80/init';
import { fetchBeeper } from './beeper';
import { ATTRIBUTES_AFTER_ADDR, RAM_MIN_ADDR, xFFFF } from './constants';
import { clearMemory, fetchMemory, restoreMemory } from './memory';
import { initPorts } from './ports';
import { clearScreen, commitBorder, initScreen, refreshScreen, setBorder, switchPalette } from './screen';

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
  memoryX = cpuX - 272;
  memoryY = cpuY + 32;
  _state = state as State;
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
      initPorts();
      fetchCpu();
      fetchMemory();
      fetchBeeper();
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

  if (_state.brd != null) {
    initScreen();
    setBorder(_state.brd);
    if (screenEnabled) commitBorder();
    _state.brd = null;
  }

  const rom = _state.rom;

  if (rom) {
    clearCpu();
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
    switchPalette();
    _state.pal = 0;
  }

  if (_state.snd) {
    beeperEnabled = _state.snd > 0;
    _state.snd = 0;
  }
}

export type State = {
  do: number;
  run: number;
  res: number;
  by1: number;
  max: number;
  cpu: number[] | 0;
  brd: number | null;
  rom: number[] | 0;
  ram1: number[] | 0;
  ram2: number[] | 0;
  ram3: number[] | 0;
  scr: number;
  pal: number;
  snd: number;
}
