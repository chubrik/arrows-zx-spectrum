import { createCtx, getDirect, setDirect } from '../common/arrows';
import { packF, packSYS, unpackF, unpackSYS } from './flags';
import { A, Aa, B, Ba, C, Ca, D, Da, E, Ea, F, Fa, H, Ha, I, IXh, IXl, IYh, IYl, L, La, PCh, PCl, R, REG_COUNT, regs, regsCtx, SPh, SPl, SYS } from './registers';

export function initCpu(chunkX: number, chunkY: number) {
  let x = chunkX + 16;
  let y = chunkY - 16;

  regsCtx[A] = createCtx(x, y);
  regsCtx[F] = createCtx(x, ++y);
  regsCtx[B] = createCtx(x, ++y);
  regsCtx[C] = createCtx(x, ++y);
  regsCtx[D] = createCtx(x, ++y);
  regsCtx[E] = createCtx(x, ++y);
  regsCtx[H] = createCtx(x, ++y);
  regsCtx[L] = createCtx(x, ++y);
  regsCtx[IXh] = createCtx(x, ++y);
  regsCtx[IXl] = createCtx(x, ++y);

  regsCtx[SPh] = createCtx(x, y += 2);
  regsCtx[SPl] = createCtx(x, ++y);
  regsCtx[PCh] = createCtx(x, ++y);
  regsCtx[PCl] = createCtx(x, ++y);

  regsCtx[Aa] = createCtx(x += 8, y = chunkY - 16);
  regsCtx[Fa] = createCtx(x, ++y);
  regsCtx[Ba] = createCtx(x, ++y);
  regsCtx[Ca] = createCtx(x, ++y);
  regsCtx[Da] = createCtx(x, ++y);
  regsCtx[Ea] = createCtx(x, ++y);
  regsCtx[Ha] = createCtx(x, ++y);
  regsCtx[La] = createCtx(x, ++y);
  regsCtx[IYh] = createCtx(x, ++y);
  regsCtx[IYl] = createCtx(x, ++y);

  regsCtx[I] = createCtx(x, y += 2);
  regsCtx[R] = createCtx(x, ++y);

  regsCtx[SYS] = createCtx(x, y + 2);
}

export function fetchCpu() {
  for (let i = 0; i < REG_COUNT; i++) {
    const ctx = regsCtx[i];
    regs[i] = getDirect(ctx);
  }

  unpackF(regs[F]);
  unpackSYS(regs[SYS]);
}

export function commitCpu() {
  regs[F] = packF();
  regs[SYS] = packSYS();

  for (let i = 0; i < REG_COUNT; i++) {
    const ctx = regsCtx[i];
    setDirect(ctx, regs[i]);
  }
}

export function resetCpu() {
  for (let i = 0; i < REG_COUNT; i++) {
    const ctx = regsCtx[i];
    setDirect(ctx, 0);
  }
}
