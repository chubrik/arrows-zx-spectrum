import { xFF, xFFFF } from '../src/hw/constants';
import { mem, setRamMinAddrForTest } from '../src/hw/mem-state';
import { executeMain } from '../src/z80/execute-main';
import { HLT, hlt, IFF1, iff1, IFF2, iff2, IM1, im1, IM2, im2, packF, setHLT, setIFF1, setIFF2, setIM1, setIM2, unpackF, unpackSYS } from '../src/z80/flags';
import { a, aa, b, ba, c, ca, cpu, d, da, e, ea, F, Fa, H, Ha, I, IXh, IXl, IYh, IYl, L, La, packR, pc, R, setA, setAa, setB, setBa, setC, setCa, setD, setDa, setE, setEa, setHLMode, setPC, setSP, setWZ, sp, unpackR } from '../src/z80/registers';

export function setupCpu() {
  setRamMinAddrForTest(0);
  for (let i = 0; i <= xFFFF; i++) mem[i] = 0;
  for (let i = 0; i < 32; i++) cpu[i] = 0;
  setA(0); setB(0); setC(0); setD(0); setE(0);
  setAa(0); setBa(0); setCa(0); setDa(0); setEa(0);
  setSP(0); setPC(0);
  unpackF(0);
  unpackSYS(0);
  setHLMode();
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
  if (state.A !== undefined) setA(state.A);
  if (state.F !== undefined) { cpu[F] = state.F; unpackF(state.F); }
  if (state.B !== undefined) setB(state.B);
  if (state.C !== undefined) setC(state.C);
  if (state.D !== undefined) setD(state.D);
  if (state.E !== undefined) setE(state.E);
  if (state.H !== undefined) cpu[H] = state.H;
  if (state.L !== undefined) cpu[L] = state.L;
  if (state.Aa !== undefined) setAa(state.Aa);
  if (state.Fa !== undefined) cpu[Fa] = state.Fa;
  if (state.Ba !== undefined) setBa(state.Ba);
  if (state.Ca !== undefined) setCa(state.Ca);
  if (state.Da !== undefined) setDa(state.Da);
  if (state.Ea !== undefined) setEa(state.Ea);
  if (state.Ha !== undefined) cpu[Ha] = state.Ha;
  if (state.La !== undefined) cpu[La] = state.La;
  if (state.IX !== undefined) { cpu[IXl] = state.IX & xFF; cpu[IXh] = (state.IX >> 8) & xFF; }
  if (state.IY !== undefined) { cpu[IYl] = state.IY & xFF; cpu[IYh] = (state.IY >> 8) & xFF; }
  if (state.SP !== undefined) setSP(state.SP);
  if (state.PC !== undefined) setPC(state.PC);
  if (state.WZ !== undefined) setWZ(state.WZ);
  if (state.I !== undefined) cpu[I] = state.I;
  if (state.R !== undefined) { cpu[R] = state.R; unpackR(state.R); }
  if (state.IM !== undefined) {
    setIM1(state.IM === 1 ? IM1 : 0);
    setIM2(state.IM === 2 ? IM2 : 0);
  }
  if (state.IFF1 !== undefined) setIFF1(state.IFF1 ? IFF1 : 0);
  if (state.IFF2 !== undefined) setIFF2(state.IFF2 ? IFF2 : 0);
  if (state.halt !== undefined) setHLT(state.halt ? HLT : 0);
  if (state.mem) {
    for (const [addr, value] of Object.entries(state.mem)) {
      mem[Number(addr)] = value;
    }
  }
}

export function getState() {
  return {
    A: a,
    F: packF(),
    B: b,
    C: c,
    D: d,
    E: e,
    H: cpu[H],
    L: cpu[L],
    Aa: aa,
    Fa: cpu[Fa],
    Ba: ba,
    Ca: ca,
    Da: da,
    Ea: ea,
    Ha: cpu[Ha],
    La: cpu[La],
    IX: (cpu[IXh] << 8) | cpu[IXl],
    IY: (cpu[IYh] << 8) | cpu[IYl],
    SP: sp,
    PC: pc,
    I: cpu[I],
    R: packR(),
    IM: (im2 ? 2 : im1 ? 1 : 0) as 0 | 1 | 2,
    IFF1: (iff1 ? 1 : 0) as 0 | 1,
    IFF2: (iff2 ? 1 : 0) as 0 | 1,
    halt: (hlt ? 1 : 0) as 0 | 1,
  };
}

export function loadProgram(addr: number, bytes: number[]) {
  for (let i = 0; i < bytes.length; i++) {
    mem[(addr + i) & xFFFF] = bytes[i];
  }
}

export function step() {
  executeMain();
}
