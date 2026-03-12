import { getMemPos, set8Core } from '../common/data';
import { Reg } from '../common/types';
import { poses } from '../common/utils';

export function draw(rom: number[]) {
  const initPos = getPosition();
  const chunkX = initPos.x - (initPos.x % 16);
  const chunkY = initPos.y - (initPos.y % 16);
  const memX = chunkX + 16;
  const memY = chunkY + 16;

  poses[Reg.Mem0] = { x: memX, y: memY };

  for (let addr = 0; addr <= 0xFFFF; addr++) {
    const memPos = getMemPos(addr);
    const data = addr < rom.length ? rom[addr] : 0;
    set8Core(memPos, data);
  }
}
