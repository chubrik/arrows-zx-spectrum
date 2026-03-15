import { getMemPos, set8 } from '../common/utils';

export function deployMemory(rom: number[]) {
  for (let addr = 0; addr <= 0xFFFF; addr++) {
    const memPos = getMemPos(addr);
    const value = addr < rom.length ? rom[addr] : 0;
    set8(memPos, value);
  }
}
