import { getMemPos, initMemory, set8 } from '../common/data';

export function draw(rom: number[]) {
  const initPos = getPosition();
  const chunkX = initPos.x - (initPos.x % 16);
  const chunkY = initPos.y - (initPos.y % 16);
  initMemory(chunkX, chunkY);

  for (let addr = 0; addr <= 0xFFFF; addr++) {
    const memPos = getMemPos(addr);
    const value = addr < rom.length ? rom[addr] : 0;
    set8(memPos, value);
  }
}
