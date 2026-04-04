import { createCtx, getDirect, setDirect } from '../common/arrows';
import { xFF } from '../common/constants';
import { packF, packSYS, unpackF, unpackSYS } from './flags';
import { A, Aa, B, Ba, C, Ca, cpu, cpuCtxA, cpuCtxX, cpuCtxY, D, Da, E, Ea, F, Fa, H, Ha, I, IXh, IXl, IYh, IYl, L, La, packR, PC, pc, R, setPC, setSP, SP, sp, SYS, unpackR } from './registers';

export function initCpu(chunkX: number, chunkY: number) {
  let x = chunkX + 32;
  let y = chunkY;

  initReg(A, x, y);
  initReg(F, x, ++y);
  initReg(B, x, ++y);
  initReg(C, x, ++y);
  initReg(D, x, ++y);
  initReg(E, x, ++y);
  initReg(H, x, ++y);
  initReg(L, x, ++y);
  initReg(IXh, x, ++y);
  initReg(IXl, x, ++y);

  initReg(SP, x, y += 2);
  initReg(PC, x, y += 2);

  initReg(Aa, x += 8, y = chunkY);
  initReg(Fa, x, ++y);
  initReg(Ba, x, ++y);
  initReg(Ca, x, ++y);
  initReg(Da, x, ++y);
  initReg(Ea, x, ++y);
  initReg(Ha, x, ++y);
  initReg(La, x, ++y);
  initReg(IYh, x, ++y);
  initReg(IYl, x, ++y);

  initReg(I, x, y += 2);
  initReg(R, x, ++y);

  initReg(SYS, x, y + 2);
}

function initReg(reg: number, x: number, y: number) {
  const ctx = createCtx(x, y);
  cpuCtxX[reg] = ctx.x;
  cpuCtxY[reg] = ctx.y;
  cpuCtxA[reg] = ctx.a;
}

export function fetchCpu() {
  for (let reg = 0; reg <= SYS; reg++)
    cpu[reg] = getDirect(cpuCtxX[reg], cpuCtxY[reg]);

  unpackF(cpu[F]);
  unpackR(cpu[R]);
  unpackSYS(cpu[SYS]);

  const spX = cpuCtxX[SP];
  const spY = cpuCtxY[SP];
  setSP((getDirect(spX, spY) << 8) | getDirect(spX, spY + 1));

  const pcX = cpuCtxX[PC];
  const pcY = cpuCtxY[PC];
  setPC((getDirect(pcX, pcY) << 8) | getDirect(pcX, pcY + 1));
}

export function commitCpu() {
  cpu[F] = packF();
  cpu[R] = packR();
  cpu[SYS] = packSYS();

  for (let reg = 0; reg <= SYS; reg++)
    setDirect(cpuCtxX[reg], cpuCtxY[reg], cpuCtxA[reg], cpu[reg]);

  const spX = cpuCtxX[SP];
  const spY = cpuCtxY[SP];
  const spA = cpuCtxA[SP];
  setDirect(spX, spY, spA, sp >> 8);
  setDirect(spX, spY + 1, spA, sp & xFF);

  const pcX = cpuCtxX[PC];
  const pcY = cpuCtxY[PC];
  const pcA = cpuCtxA[PC];
  setDirect(pcX, pcY, pcA, pc >> 8);
  setDirect(pcX, pcY + 1, pcA, pc & xFF);
}

export function resetCpu() {
  for (let reg = 0; reg <= SYS; reg++)
    setDirect(cpuCtxX[reg], cpuCtxY[reg], cpuCtxA[reg], 0);

  const spX = cpuCtxX[SP];
  const spY = cpuCtxY[SP];
  const spA = cpuCtxA[SP];
  setDirect(spX, spY, spA, 0);
  setDirect(spX, spY + 1, spA, 0);

  const pcX = cpuCtxX[PC];
  const pcY = cpuCtxY[PC];
  const pcA = cpuCtxA[PC];
  setDirect(pcX, pcY, pcA, 0);
  setDirect(pcX, pcY + 1, pcA, 0);
}
