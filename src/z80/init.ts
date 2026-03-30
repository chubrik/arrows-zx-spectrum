import { createInfo, infos, setDirect } from '../common/arrows';
import { A, Aa, B, Ba, C, Ca, D, Da, E, Ea, F, Fa, H, Ha, I, IXh, IXl, IYh, IYl, L, La, PCh, PCl, R, REG_BASE, REG_COUNT, SPh, SPl, SYS } from './registers';

export function initCpu(chunkX: number, chunkY: number) {
  let x = chunkX + 16;
  let y = chunkY - 16;

  infos[REG_BASE + A] = createInfo(x, y);
  infos[REG_BASE + F] = createInfo(x, ++y);
  infos[REG_BASE + B] = createInfo(x, ++y);
  infos[REG_BASE + C] = createInfo(x, ++y);
  infos[REG_BASE + D] = createInfo(x, ++y);
  infos[REG_BASE + E] = createInfo(x, ++y);
  infos[REG_BASE + H] = createInfo(x, ++y);
  infos[REG_BASE + L] = createInfo(x, ++y);
  infos[REG_BASE + IXh] = createInfo(x, ++y);
  infos[REG_BASE + IXl] = createInfo(x, ++y);

  infos[REG_BASE + SPh] = createInfo(x, y += 2);
  infos[REG_BASE + SPl] = createInfo(x, ++y);
  infos[REG_BASE + PCh] = createInfo(x, ++y);
  infos[REG_BASE + PCl] = createInfo(x, ++y);

  infos[REG_BASE + Aa] = createInfo(x += 8, y = chunkY - 16);
  infos[REG_BASE + Fa] = createInfo(x, ++y);
  infos[REG_BASE + Ba] = createInfo(x, ++y);
  infos[REG_BASE + Ca] = createInfo(x, ++y);
  infos[REG_BASE + Da] = createInfo(x, ++y);
  infos[REG_BASE + Ea] = createInfo(x, ++y);
  infos[REG_BASE + Ha] = createInfo(x, ++y);
  infos[REG_BASE + La] = createInfo(x, ++y);
  infos[REG_BASE + IYh] = createInfo(x, ++y);
  infos[REG_BASE + IYl] = createInfo(x, ++y);

  infos[REG_BASE + I] = createInfo(x, y += 2);
  infos[REG_BASE + R] = createInfo(x, ++y);
  infos[REG_BASE + SYS] = createInfo(x, y + 2);
}

export function resetCpu() {
  for (let i = 0; i < REG_COUNT; i++)
    setDirect(REG_BASE + i, 0);
}
