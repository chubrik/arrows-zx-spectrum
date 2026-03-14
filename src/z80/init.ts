import { initMemory } from '../common/data';
import { initRegisters } from './utils';

export function init() {
  const initPos = getPosition();
  const chunkX = initPos.x - (initPos.x % 16);
  const chunkY = initPos.y - (initPos.y % 16);

  initRegisters(chunkX, chunkY);
  initMemory(chunkX, chunkY);
}
