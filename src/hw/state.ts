import { clearCpu, restoreCpu } from '../z80/init';
import { RAM_MIN_ADDR, xFFFF } from './constants';
import { clearMemoryBlock, restoreMemoryBlock } from './mem-init';
import { refreshScreen } from './screen';

export let chunkX: number;
export let chunkY: number;

export function initState() {
  const pos = getPosition();
  chunkX = pos.x & ~15;
  chunkY = pos.y & ~15;
}

export function fetchState() {
  if (!state.todo) return;
  state.todo = 0;

  if (state.rom) {
    clearCpu();
    restoreMemoryBlock(0x0000, state.rom);
    clearMemoryBlock(RAM_MIN_ADDR, xFFFF);
    refreshScreen();
    state.rom = 0;
  }

  if (state.cpu) {
    restoreCpu(state.cpu);
    state.cpu = 0;
  }

  if (state.ram1) {
    restoreMemoryBlock(0x4000, state.ram1);
    refreshScreen();
    state.ram1 = 0;
  }

  if (state.ram2) {
    restoreMemoryBlock(0x8000, state.ram2);
    state.ram2 = 0;
  }

  if (state.ram3) {
    restoreMemoryBlock(0xC000, state.ram3);
    state.ram3 = 0;
  }
}
