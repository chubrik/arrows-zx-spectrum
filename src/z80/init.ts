import { createInfo, infos, setDirect } from '../common/arrows';
import { A, Aa, B, Ba, C, Ca, D, Da, E, Ea, F, Fa, H, Ha, I, IXh, IXl, IYh, IYl, L, La, PCh, PCl, R, SPh, SPl, SYS } from './registers';

export function initCpu(chunkX: number, chunkY: number) {
  let x = chunkX + 16;
  let y = chunkY - 16;

  infos[A] = createInfo(x, y);
  infos[F] = createInfo(x, ++y);
  infos[B] = createInfo(x, ++y);
  infos[C] = createInfo(x, ++y);
  infos[D] = createInfo(x, ++y);
  infos[E] = createInfo(x, ++y);
  infos[H] = createInfo(x, ++y);
  infos[L] = createInfo(x, ++y);
  infos[IXh] = createInfo(x, ++y);
  infos[IXl] = createInfo(x, ++y);

  infos[SPh] = createInfo(x, y += 2);
  infos[SPl] = createInfo(x, ++y);
  infos[PCh] = createInfo(x, ++y);
  infos[PCl] = createInfo(x, ++y);

  infos[Aa] = createInfo(x += 8, y = chunkY - 16);
  infos[Fa] = createInfo(x, ++y);
  infos[Ba] = createInfo(x, ++y);
  infos[Ca] = createInfo(x, ++y);
  infos[Da] = createInfo(x, ++y);
  infos[Ea] = createInfo(x, ++y);
  infos[Ha] = createInfo(x, ++y);
  infos[La] = createInfo(x, ++y);
  infos[IYh] = createInfo(x, ++y);
  infos[IYl] = createInfo(x, ++y);

  infos[I] = createInfo(x, y += 2);
  infos[R] = createInfo(x, ++y);
  infos[SYS] = createInfo(x, y + 2);
}

export function resetCpu() {
  for (let i = F; i <= SYS; i++)
    setDirect(i, 0);
}
