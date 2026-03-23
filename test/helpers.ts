import { initMemory, writeMem8 } from '../src/common/memory';
import { applyCache, get1, get16, get8, resetCache, set1, set16, set8, setReadonly } from '../src/common/utils';
import { executeMain } from '../src/z80/execute';
import { posA, posAa, posB, posBa, posC, posCa, posD, posDa, posE, posEa, posF, posFa, posH, posHa, posHalt, posI, posIFF1, posIFF2, posIXh, posIXl, posIYh, posIYl, posL, posLa, posPCh, posPCl, posR, posSPh, posSPl } from '../src/z80/positions';
import { HLMode } from '../src/z80/types';
import { getIM, initCpu, setHLMode, setIM, setWZ } from '../src/z80/utils';

const CHUNK_X = 0;
const CHUNK_Y = 100;

export function setupCpu() {
  resetCache();
  initCpu(CHUNK_X, CHUNK_Y);
  initMemory(CHUNK_X, CHUNK_Y);
  setReadonly(-99999, 99999);
  setHLMode(HLMode.HL);
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
  if (state.A !== undefined) set8(posA, state.A);
  if (state.F !== undefined) set8(posF, state.F);
  if (state.B !== undefined) set8(posB, state.B);
  if (state.C !== undefined) set8(posC, state.C);
  if (state.D !== undefined) set8(posD, state.D);
  if (state.E !== undefined) set8(posE, state.E);
  if (state.H !== undefined) set8(posH, state.H);
  if (state.L !== undefined) set8(posL, state.L);
  if (state.Aa !== undefined) set8(posAa, state.Aa);
  if (state.Fa !== undefined) set8(posFa, state.Fa);
  if (state.Ba !== undefined) set8(posBa, state.Ba);
  if (state.Ca !== undefined) set8(posCa, state.Ca);
  if (state.Da !== undefined) set8(posDa, state.Da);
  if (state.Ea !== undefined) set8(posEa, state.Ea);
  if (state.Ha !== undefined) set8(posHa, state.Ha);
  if (state.La !== undefined) set8(posLa, state.La);
  if (state.IX !== undefined) set16(posIXh, posIXl, state.IX);
  if (state.IY !== undefined) set16(posIYh, posIYl, state.IY);
  if (state.SP !== undefined) set16(posSPh, posSPl, state.SP);
  if (state.PC !== undefined) set16(posPCh, posPCl, state.PC);
  if (state.WZ !== undefined) setWZ(state.WZ);
  if (state.I !== undefined) set8(posI, state.I);
  if (state.R !== undefined) set8(posR, state.R);
  if (state.IM !== undefined) setIM(state.IM);
  if (state.IFF1 !== undefined) set1(posIFF1, state.IFF1);
  if (state.IFF2 !== undefined) set1(posIFF2, state.IFF2);
  if (state.halt !== undefined) set1(posHalt, state.halt);
  if (state.mem) {
    for (const [addr, value] of Object.entries(state.mem)) {
      writeMem8(Number(addr), value);
    }
  }
}

export function getState() {
  return {
    A: get8(posA),
    F: get8(posF),
    B: get8(posB),
    C: get8(posC),
    D: get8(posD),
    E: get8(posE),
    H: get8(posH),
    L: get8(posL),
    Aa: get8(posAa),
    Fa: get8(posFa),
    Ba: get8(posBa),
    Ca: get8(posCa),
    Da: get8(posDa),
    Ea: get8(posEa),
    Ha: get8(posHa),
    La: get8(posLa),
    IX: get16(posIXh, posIXl),
    IY: get16(posIYh, posIYl),
    SP: get16(posSPh, posSPl),
    PC: get16(posPCh, posPCl),
    I: get8(posI),
    R: get8(posR),
    IM: getIM(),
    IFF1: get1(posIFF1),
    IFF2: get1(posIFF2),
    halt: get1(posHalt),
  };
}

export function loadProgram(addr: number, bytes: number[]) {
  for (let i = 0; i < bytes.length; i++) {
    writeMem8((addr + i) & 0xFFFF, bytes[i]);
  }
}

export function step() {
  applyCache();
  resetCache();
  executeMain();
  applyCache();
}
