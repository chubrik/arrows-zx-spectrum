import { xFF, xFFFF } from '../src/hw/constants';
import { mem, setRamMinAddrForTest } from '../src/hw/mem-state';
import { executeMain } from '../src/z80/execute-main';
import { getF, HLT, hlt, IFF1, iff1, IFF2, iff2, IM1, im1, IM2, im2, setF, setHLT, setIFF1, setIFF2, setIM1, setIM2 } from '../src/z80/flags';
import { clearCpu } from '../src/z80/init';
import { a, aa, b, ba, c, ca, d, da, e, ea, fa, getH, getIXh, getIXl, getIYh, getIYl, getL, getR, ha, i, la, pc, setA, setAa, setB, setBa, setC, setCa, setD, setDa, setE, setEa, setFa, setH, setHa, setI, setIXh, setIXl, setIYh, setIYl, setL, setLa, setPC, setR, setSP, setWZ, sp } from '../src/z80/registers';

export function setupCpu() {
  clearCpu();
  setRamMinAddrForTest(0); //todo
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
  if (state.F !== undefined) setF(state.F);
  if (state.B !== undefined) setB(state.B);
  if (state.C !== undefined) setC(state.C);
  if (state.D !== undefined) setD(state.D);
  if (state.E !== undefined) setE(state.E);
  if (state.H !== undefined) setH(state.H);
  if (state.L !== undefined) setL(state.L);
  if (state.Aa !== undefined) setAa(state.Aa);
  if (state.Fa !== undefined) setFa(state.Fa);
  if (state.Ba !== undefined) setBa(state.Ba);
  if (state.Ca !== undefined) setCa(state.Ca);
  if (state.Da !== undefined) setDa(state.Da);
  if (state.Ea !== undefined) setEa(state.Ea);
  if (state.Ha !== undefined) setHa(state.Ha);
  if (state.La !== undefined) setLa(state.La);
  if (state.IX !== undefined) { setIXl(state.IX & xFF); setIXh((state.IX >> 8) & xFF); }
  if (state.IY !== undefined) { setIYl(state.IY & xFF); setIYh((state.IY >> 8) & xFF); }
  if (state.SP !== undefined) setSP(state.SP);
  if (state.PC !== undefined) setPC(state.PC);
  if (state.WZ !== undefined) setWZ(state.WZ);
  if (state.I !== undefined) setI(state.I);
  if (state.R !== undefined) setR(state.R);
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
    F: getF(),
    B: b,
    C: c,
    D: d,
    E: e,
    H: getH(),
    L: getL(),
    Aa: aa,
    Fa: fa,
    Ba: ba,
    Ca: ca,
    Da: da,
    Ea: ea,
    Ha: ha,
    La: la,
    IX: getIXl() | (getIXh() << 8),
    IY: getIYl() | (getIYh() << 8),
    SP: sp,
    PC: pc,
    I: i,
    R: getR(),
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
