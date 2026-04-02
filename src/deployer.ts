import { RAM_MIN_ADDR, xFFFF } from './common/constants';
import { unicodeToBytes } from './common/encode';
import { deployMemoryBlock, initMemory, resetMemoryBlock } from './common/utils';
import { initCpu, resetCpu } from './z80/init';

declare const $: string; // Encoded ROM data

onActive(() => {
  const pos = getPosition();
  const chunkX = pos.x & ~15;
  const chunkY = pos.y & ~15;
  initCpu(chunkX, chunkY);
  initMemory(chunkX, chunkY);

  const rom = unicodeToBytes($);
  deployMemoryBlock(0x0000, rom);
  resetMemoryBlock(RAM_MIN_ADDR, xFFFF);
  resetCpu();
});
