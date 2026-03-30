import { setRamMinAddrForTest, values } from '../src/common/utils';
import { executeMain } from '../src/z80/execute-main';
import { HLT, hlt, IFF1, iff1, IFF2, iff2, IM1, im1, IM2, im2, packF, setHLT, setIFF1, setIFF2, setIM1, setIM2, unpackF, unpackSYS } from '../src/z80/flags';
import { A, Aa, B, Ba, C, Ca, D, Da, E, Ea, F, Fa, H, Ha, HL, I, IXh, IXl, IYh, IYl, L, La, PCh, PCl, R, regs, setHLXY, setWZ, SPh, SPl } from '../src/z80/registers';

export function setupCpu() {
  setRamMinAddrForTest(0);
  for (let i = 0; i <= 0xFFFF; i++) values[i] = 0;
  for (let i = 0; i < 32; i++) regs[i] = 0;
  unpackF(0);
  unpackSYS(0);
  setHLXY(HL);
  setWZ(0);
}

export interface CpuState {
  A?: number; F?: number;
  B?: number; C?: number;
  D?: number; E?: number;
  H?: number; L?: number;
  Aa?: number; Fa?: number;
  Ba?: number; Ca?: number;
  Da?: number; Ea?: number;
  Ha?: number; La?: number;
  IX?: number; IY?: number;
  SP?: number; PC?: number;
  WZ?: number;
  I?: number; R?: number;
  IM?: 0 | 1 | 2;
  IFF1?: 0 | 1; IFF2?: 0 | 1;
  halt?: 0 | 1;
  mem?: Record<number, number>;
}

export function setState(state: CpuState) {
  if (state.A !== undefined) regs[A] = state.A;
  if (state.F !== undefined) { regs[F] = state.F; unpackF(state.F); }
  if (state.B !== undefined) regs[B] = state.B;
  if (state.C !== undefined) regs[C] = state.C;
  if (state.D !== undefined) regs[D] = state.D;
  if (state.E !== undefined) regs[E] = state.E;
  if (state.H !== undefined) regs[H] = state.H;
  if (state.L !== undefined) regs[L] = state.L;
  if (state.Aa !== undefined) regs[Aa] = state.Aa;
  if (state.Fa !== undefined) regs[Fa] = state.Fa;
  if (state.Ba !== undefined) regs[Ba] = state.Ba;
  if (state.Ca !== undefined) regs[Ca] = state.Ca;
  if (state.Da !== undefined) regs[Da] = state.Da;
  if (state.Ea !== undefined) regs[Ea] = state.Ea;
  if (state.Ha !== undefined) regs[Ha] = state.Ha;
  if (state.La !== undefined) regs[La] = state.La;
  if (state.IX !== undefined) { regs[IXl] = state.IX & 0xFF; regs[IXh] = (state.IX >> 8) & 0xFF; }
  if (state.IY !== undefined) { regs[IYl] = state.IY & 0xFF; regs[IYh] = (state.IY >> 8) & 0xFF; }
  if (state.SP !== undefined) { regs[SPl] = state.SP & 0xFF; regs[SPh] = (state.SP >> 8) & 0xFF; }
  if (state.PC !== undefined) { regs[PCl] = state.PC & 0xFF; regs[PCh] = (state.PC >> 8) & 0xFF; }
  if (state.WZ !== undefined) setWZ(state.WZ);
  if (state.I !== undefined) regs[I] = state.I;
  if (state.R !== undefined) regs[R] = state.R;
  if (state.IM !== undefined) {
    setIM1(state.IM === 1 ? IM1 : 0);
    setIM2(state.IM === 2 ? IM2 : 0);
  }
  if (state.IFF1 !== undefined) setIFF1(state.IFF1 ? IFF1 : 0);
  if (state.IFF2 !== undefined) setIFF2(state.IFF2 ? IFF2 : 0);
  if (state.halt !== undefined) setHLT(state.halt ? HLT : 0);
  if (state.mem) {
    for (const [addr, value] of Object.entries(state.mem)) {
      values[Number(addr)] = value;
    }
  }
}

export function getState() {
  return {
    A: regs[A],
    F: packF(),
    B: regs[B],
    C: regs[C],
    D: regs[D],
    E: regs[E],
    H: regs[H],
    L: regs[L],
    Aa: regs[Aa],
    Fa: regs[Fa],
    Ba: regs[Ba],
    Ca: regs[Ca],
    Da: regs[Da],
    Ea: regs[Ea],
    Ha: regs[Ha],
    La: regs[La],
    IX: (regs[IXh] << 8) | regs[IXl],
    IY: (regs[IYh] << 8) | regs[IYl],
    SP: (regs[SPh] << 8) | regs[SPl],
    PC: (regs[PCh] << 8) | regs[PCl],
    I: regs[I],
    R: regs[R],
    IM: (im2 ? 2 : im1 ? 1 : 0) as 0 | 1 | 2,
    IFF1: (iff1 ? 1 : 0) as 0 | 1,
    IFF2: (iff2 ? 1 : 0) as 0 | 1,
    halt: (hlt ? 1 : 0) as 0 | 1,
  };
}

export function loadProgram(addr: number, bytes: number[]) {
  for (let i = 0; i < bytes.length; i++) {
    values[(addr + i) & 0xFFFF] = bytes[i];
  }
}

export function step() {
  executeMain();
}
