import { createCtx, getDirect, setDirect } from '../common/arrows';
import { xFF } from '../common/constants';
import { packF, packSYS, unpackF, unpackSYS } from './flags';
import { A, Aa, B, Ba, C, Ca, cpu, cpuCtx, D, Da, E, Ea, F, Fa, H, Ha, I, IXh, IXl, IYh, IYl, L, La, packR, PC, pc, R, setPC, setSP, SP, sp, SYS, unpackR } from './registers';

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

  cpuCtx[SP] = createCtx(x, y += 2);
  cpuCtx[PC] = createCtx(x, y += 2);

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
  for (let i = 0; i <= SYS; i++) {
    const ctx = cpuCtx[i];
    cpu[i] = getDirect(ctx.x, ctx.y);
  }

  unpackF(cpu[F]);
  unpackR(cpu[R]);
  unpackSYS(cpu[SYS]);

  const spCtx = cpuCtx[SP];
  setSP((getDirect(spCtx.x, spCtx.y) << 8) | getDirect(spCtx.x, spCtx.y + 1));

  const pcCtx = cpuCtx[PC];
  setPC((getDirect(pcCtx.x, pcCtx.y) << 8) | getDirect(pcCtx.x, pcCtx.y + 1));
}

export function commitCpu() {
  cpu[F] = packF();
  cpu[R] = packR();
  cpu[SYS] = packSYS();

  for (let i = 0; i <= SYS; i++) {
    const ctx = cpuCtx[i];
    setDirect(ctx.x, ctx.y, ctx.a, cpu[i]);
  }
  
  const spCtx = cpuCtx[SP];
  setDirect(spCtx.x, spCtx.y, spCtx.a, sp >> 8);
  setDirect(spCtx.x, spCtx.y + 1, spCtx.a, sp & xFF);

  const pcCtx = cpuCtx[PC];
  setDirect(pcCtx.x, pcCtx.y, pcCtx.a, pc >> 8);
  setDirect(pcCtx.x, pcCtx.y + 1, pcCtx.a, pc & xFF);
}

export function resetCpu() {
  for (let i = 0; i <= SYS; i++) {
    const ctx = cpuCtx[i];
    setDirect(ctx.x, ctx.y, ctx.a, 0);
  }

  const spCtx = cpuCtx[SP];
  setDirect(spCtx.x, spCtx.y, spCtx.a, 0);
  setDirect(spCtx.x, spCtx.y + 1, spCtx.a, 0);

  const pcCtx = cpuCtx[PC];
  setDirect(pcCtx.x, pcCtx.y, pcCtx.a, 0);
  setDirect(pcCtx.x, pcCtx.y + 1, pcCtx.a, 0);
}
