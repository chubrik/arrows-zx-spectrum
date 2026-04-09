import { clearCpu, fetchCpu, initCpu, restoreCpu } from '../z80/init';
import { OP_PER_FRAME, RAM_MIN_ADDR, xFFFF } from './constants';
import { fetchMemory } from './mem';
import { clearMemoryBlock, initMemory, restoreMemoryBlock } from './mem-init';
import { initPorts } from './ports';
import { drawBorder, initScreen, refreshScreen } from './screen';

export let cpuX: number;
export let cpuY: number;
export let cpuStarted = false;
let _state: State;

export function initState() {
  const pos = getPosition();
  cpuX = (pos.x & ~15) + 16;
  cpuY = pos.y & ~15;
  _state = state as State;
}

export let OPTS_OP_PER_TICK = OP_PER_FRAME + 2; // +2 to guarantee interrupt handling
export let OPTS_LIMITED_SPEED = true;

export function fetchState() {
  if (!_state.todo) return;
  _state.todo = 0;

  if (_state.run) {
    cpuStarted = _state.run > 0;
    _state.run = 0;

    if (cpuStarted) {
      initCpu();
      initMemory();
      initScreen();
      initPorts();

      fetchCpu();
      fetchMemory();
      refreshScreen();
    }
  }

  if (_state.by1) {
    OPTS_OP_PER_TICK = _state.by1 > 0 ? 1 : OP_PER_FRAME + 2; // +2 to guarantee interrupt handling
    _state.by1 = 0;
  }

  if (_state.max) {
    OPTS_LIMITED_SPEED = _state.max < 0;
    _state.max = 0;
  }

  if (_state.cpu) {
    restoreCpu(_state.cpu);
    _state.cpu = 0;
  }

  if (_state.brd !== undefined) {
    initScreen();
    drawBorder(_state.brd);
    _state.brd = undefined;
  }

  if (_state.rom) {
    clearCpu();
    restoreMemoryBlock(0x0000, _state.rom);
    clearMemoryBlock(RAM_MIN_ADDR, xFFFF);
    refreshScreen();
    drawBorder(0);
    _state.rom = 0;
  }

  if (_state.ram1) {
    restoreMemoryBlock(0x4000, _state.ram1);
    refreshScreen();
    _state.ram1 = 0;
  }

  if (_state.ram2) {
    restoreMemoryBlock(0x8000, _state.ram2);
    _state.ram2 = 0;
  }

  if (_state.ram3) {
    restoreMemoryBlock(0xC000, _state.ram3);
    _state.ram3 = 0;
  }
}

interface State {
  todo: number;
  run: number;
  by1: number;
  max: number;
  cpu: number[] | 0;
  brd?: number;
  rom: number[] | 0;
  ram1: number[] | 0;
  ram2: number[] | 0;
  ram3: number[] | 0;
}
