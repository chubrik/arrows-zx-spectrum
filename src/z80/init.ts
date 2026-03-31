import { createCtx, getDirect, setDirect } from '../common/arrows';
import { packF, packSYS, unpackF, unpackSYS } from './flags';
import { A, Aa, B, Ba, C, Ca, cpu, cpuCtx, D, Da, E, Ea, F, Fa, H, Ha, I, IXh, IXl, IYh, IYl, L, La, PCh, PCl, R, REG_COUNT, SPh, SPl, SYS } from './registers';

export function initCpu(chunkX: number, chunkY: number) {
  let x = chunkX + 32;
  let y = chunkY;

  cpuCtx[A] = createCtx(x, y);
  cpuCtx[F] = createCtx(x, ++y);
  cpuCtx[B] = createCtx(x, ++y);
  cpuCtx[C] = createCtx(x, ++y);
  cpuCtx[D] = createCtx(x, ++y);
  cpuCtx[E] = createCtx(x, ++y);
  cpuCtx[H] = createCtx(x, ++y);
  cpuCtx[L] = createCtx(x, ++y);
  cpuCtx[IXh] = createCtx(x, ++y);
  cpuCtx[IXl] = createCtx(x, ++y);

  cpuCtx[SPh] = createCtx(x, y += 2);
  cpuCtx[SPl] = createCtx(x, ++y);
  cpuCtx[PCh] = createCtx(x, ++y);
  cpuCtx[PCl] = createCtx(x, ++y);

  cpuCtx[Aa] = createCtx(x += 8, y = chunkY);
  cpuCtx[Fa] = createCtx(x, ++y);
  cpuCtx[Ba] = createCtx(x, ++y);
  cpuCtx[Ca] = createCtx(x, ++y);
  cpuCtx[Da] = createCtx(x, ++y);
  cpuCtx[Ea] = createCtx(x, ++y);
  cpuCtx[Ha] = createCtx(x, ++y);
  cpuCtx[La] = createCtx(x, ++y);
  cpuCtx[IYh] = createCtx(x, ++y);
  cpuCtx[IYl] = createCtx(x, ++y);

  cpuCtx[I] = createCtx(x, y += 2);
  cpuCtx[R] = createCtx(x, ++y);

  cpuCtx[SYS] = createCtx(x, y + 2);
}

export function fetchCpu() {
  for (let i = 0; i < REG_COUNT; i++) {
    const ctx = cpuCtx[i];
    cpu[i] = getDirect(ctx);
  }

  unpackF(cpu[F]);
  unpackSYS(cpu[SYS]);
}

export function commitCpu() {
  cpu[F] = packF();
  cpu[SYS] = packSYS();

  for (let i = 0; i < REG_COUNT; i++) {
    const ctx = cpuCtx[i];
    setDirect(ctx, cpu[i]);
  }
}

export function resetCpu() {
  for (let i = 0; i < REG_COUNT; i++) {
    const ctx = cpuCtx[i];
    setDirect(ctx, 0);
  }
}
