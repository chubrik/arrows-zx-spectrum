import { RAM_MIN_ADDR, xFFFF } from './hw/constants';
import { deployMemoryBlock, initMemory, resetMemoryBlock } from './hw/mem-init';
import { unicodeToBytes } from './util/encode';
import { clearCpu, initCpu } from './z80/init';

declare const $: string; // Encoded ROM data

onActive(() => {
  const pos = getPosition();
  const chunkX = pos.x & ~15;
  const chunkY = pos.y & ~15;
  initCpu(chunkX, chunkY);
  initMemory(chunkX, chunkY);

  clearCpu();

  const rom = unicodeToBytes($);
  deployMemoryBlock(0x0000, rom);
  resetMemoryBlock(RAM_MIN_ADDR, xFFFF);
});
