import { setRamMinAddrForTest, values } from '../src/common/utils';
import { executeMain } from '../src/z80/execute-main';
import { HLT, IFF1, IFF2, IM1, IM2, ff, packF, sf, unpackF } from '../src/z80/flags';
import { A, Aa, B, Ba, C, Ca, D, Da, E, Ea, F, Fa, H, Ha, HL, I, IXh, IXl, IYh, IYl, L, La, PCh, PCl, R, setHLXY, setWZ, SPh, SPl, SYS } from '../src/z80/registers';

export function setupCpu() {
  setRamMinAddrForTest(0);
  for (let i = 0; i <= 0xFFFF; i++) values[i] = 0;
  for (let i = 0x10000; i <= 0x1001C; i++) values[i] = 0;
  unpackF(0);
  sf.im2 = 0; sf.im1 = 0; sf.iff2 = 0; sf.iff1 = 0; sf.hlt = 0; sf.int = 0;
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
  if (state.A !== undefined) values[A] = state.A;
  if (state.F !== undefined) { values[F] = state.F; unpackF(state.F); }
  if (state.B !== undefined) values[B] = state.B;
  if (state.C !== undefined) values[C] = state.C;
  if (state.D !== undefined) values[D] = state.D;
  if (state.E !== undefined) values[E] = state.E;
  if (state.H !== undefined) values[H] = state.H;
  if (state.L !== undefined) values[L] = state.L;
  if (state.Aa !== undefined) values[Aa] = state.Aa;
  if (state.Fa !== undefined) values[Fa] = state.Fa;
  if (state.Ba !== undefined) values[Ba] = state.Ba;
  if (state.Ca !== undefined) values[Ca] = state.Ca;
  if (state.Da !== undefined) values[Da] = state.Da;
  if (state.Ea !== undefined) values[Ea] = state.Ea;
  if (state.Ha !== undefined) values[Ha] = state.Ha;
  if (state.La !== undefined) values[La] = state.La;
  if (state.IX !== undefined) { values[IXl] = state.IX & 0xFF; values[IXh] = (state.IX >> 8) & 0xFF; }
  if (state.IY !== undefined) { values[IYl] = state.IY & 0xFF; values[IYh] = (state.IY >> 8) & 0xFF; }
  if (state.SP !== undefined) { values[SPl] = state.SP & 0xFF; values[SPh] = (state.SP >> 8) & 0xFF; }
  if (state.PC !== undefined) { values[PCl] = state.PC & 0xFF; values[PCh] = (state.PC >> 8) & 0xFF; }
  if (state.WZ !== undefined) setWZ(state.WZ);
  if (state.I !== undefined) values[I] = state.I;
  if (state.R !== undefined) values[R] = state.R;
  if (state.IM !== undefined) {
    sf.im1 = state.IM === 1 ? IM1 : 0;
    sf.im2 = state.IM === 2 ? IM2 : 0;
  }
  if (state.IFF1 !== undefined) sf.iff1 = state.IFF1 ? IFF1 : 0;
  if (state.IFF2 !== undefined) sf.iff2 = state.IFF2 ? IFF2 : 0;
  if (state.halt !== undefined) sf.hlt = state.halt ? HLT : 0;
  if (state.mem) {
    for (const [addr, value] of Object.entries(state.mem)) {
      values[Number(addr)] = value;
    }
  }
}

export function getState() {
  return {
    A: values[A],
    F: packF(),
    B: values[B],
    C: values[C],
    D: values[D],
    E: values[E],
    H: values[H],
    L: values[L],
    Aa: values[Aa],
    Fa: values[Fa],
    Ba: values[Ba],
    Ca: values[Ca],
    Da: values[Da],
    Ea: values[Ea],
    Ha: values[Ha],
    La: values[La],
    IX: (values[IXh] << 8) | values[IXl],
    IY: (values[IYh] << 8) | values[IYl],
    SP: (values[SPh] << 8) | values[SPl],
    PC: (values[PCh] << 8) | values[PCl],
    I: values[I],
    R: values[R],
    IM: (sf.im2 ? 2 : sf.im1 ? 1 : 0) as 0 | 1 | 2,
    IFF1: (sf.iff1 ? 1 : 0) as 0 | 1,
    IFF2: (sf.iff2 ? 1 : 0) as 0 | 1,
    halt: (sf.hlt ? 1 : 0) as 0 | 1,
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
