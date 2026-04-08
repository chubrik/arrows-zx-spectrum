import { clearCpu, restoreCpu } from '../z80/init';
import { RAM_MIN_ADDR, xFFFF } from './constants';
import { deployMemoryBlock, resetMemoryBlock } from './mem-init';

export let chunkX: number;
export let chunkY: number;

export const _state = state as State;

export function initState() {
  const pos = getPosition();
  chunkX = pos.x & ~15;
  chunkY = pos.y & ~15;
}

export function fetchState() {
  if (!_state.todo) return;
  _state.todo = 0;

  if (_state.rom) {
    clearCpu();
    deployMemoryBlock(_state.rom, 0);
    resetMemoryBlock(RAM_MIN_ADDR, xFFFF);
    _state.rom = 0;
  }

  if (_state.cpu) {
    restoreCpu(_state.cpu);
    _state.cpu = 0;
  }
}

interface State {
  todo?: number;
  cpu?: number[] | 0;
  rom?: number[] | 0;
  x0004?: number[] | 0;
  x0008?: number[] | 0;
  x000C?: number[] | 0;
}
