import { readFileSync } from 'fs';
import { getResource } from '../build/resources';
import { FUSE_CPU_PATH } from '../build/utils';
import { xFFFF } from '../src/common/constants';
import { runFuseSuite, type CpuApi, type MockPorts } from './fuse-runner';
import type { CpuState } from './helpers';

const code = readFileSync(FUSE_CPU_PATH, 'utf-8');

// Bundle is ESM; eval'ing in a fresh function scope assigns globalThis.__cpu
// as a side effect via the test-hook block.
const g = globalThis as Record<string, unknown>;
delete g.__cpu;
// eslint-disable-next-line @typescript-eslint/no-implied-eval
new Function(code)();

const hook = g.__cpu as {
  mem: number[];
  setRamMinAddrForTest: (v: number) => void;
  executeMain: () => void;
  clearCpu: () => void;
  mockPorts: MockPorts;

  getF: () => number;
  setF: (v: number) => void;
  HLT: number; setHLT: (v: number) => void;
  IFF1: number; setIFF1: (v: number) => void;
  IFF2: number; setIFF2: (v: number) => void;
  IM1: number; setIM1: (v: number) => void;
  IM2: number; setIM2: (v: number) => void;
  hlt: number; iff1: number; iff2: number; im1: number; im2: number;

  setA: (v: number) => void; setAa: (v: number) => void;
  setB: (v: number) => void; setBa: (v: number) => void;
  setC: (v: number) => void; setCa: (v: number) => void;
  setD: (v: number) => void; setDa: (v: number) => void;
  setE: (v: number) => void; setEa: (v: number) => void;
  setFa: (v: number) => void;
  setHLa: (v: number) => void; setHLXY: (v: number) => void;
  setI: (v: number) => void; setIX: (v: number) => void; setIY: (v: number) => void;
  setPC: (v: number) => void; setR: (v: number) => void; setSP: (v: number) => void;
  setWZ: (v: number) => void;
  getR: () => number;
  setTStates: (v: number) => void;

  a: number; aa: number; b: number; ba: number; c: number; ca: number;
  d: number; da: number; e: number; ea: number; fa: number;
  hla: number; hlxy: number;
  i: number; ix: number; iy: number; pc: number; sp: number;
  tStates: number;
};

function setupCpu() {
  hook.clearCpu();
  hook.setRamMinAddrForTest(0);
}

function setState(s: CpuState) {
  if (s.A !== undefined) hook.setA(s.A);
  if (s.F !== undefined) hook.setF(s.F);
  if (s.B !== undefined) hook.setB(s.B);
  if (s.C !== undefined) hook.setC(s.C);
  if (s.D !== undefined) hook.setD(s.D);
  if (s.E !== undefined) hook.setE(s.E);
  if (s.HL !== undefined) hook.setHLXY(s.HL);
  if (s.Aa !== undefined) hook.setAa(s.Aa);
  if (s.Fa !== undefined) hook.setFa(s.Fa);
  if (s.Ba !== undefined) hook.setBa(s.Ba);
  if (s.Ca !== undefined) hook.setCa(s.Ca);
  if (s.Da !== undefined) hook.setDa(s.Da);
  if (s.Ea !== undefined) hook.setEa(s.Ea);
  if (s.HLa !== undefined) hook.setHLa(s.HLa);
  if (s.IX !== undefined) hook.setIX(s.IX);
  if (s.IY !== undefined) hook.setIY(s.IY);
  if (s.SP !== undefined) hook.setSP(s.SP);
  if (s.PC !== undefined) hook.setPC(s.PC);
  if (s.WZ !== undefined) hook.setWZ(s.WZ);
  if (s.I !== undefined) hook.setI(s.I);
  if (s.R !== undefined) hook.setR(s.R);
  if (s.IM !== undefined) {
    hook.setIM1(s.IM === 1 ? hook.IM1 : 0);
    hook.setIM2(s.IM === 2 ? hook.IM2 : 0);
  }
  if (s.IFF1 !== undefined) hook.setIFF1(s.IFF1 ? hook.IFF1 : 0);
  if (s.IFF2 !== undefined) hook.setIFF2(s.IFF2 ? hook.IFF2 : 0);
  if (s.halt !== undefined) hook.setHLT(s.halt ? hook.HLT : 0);
}

function getState(): CpuState {
  return {
    A: hook.a, F: hook.getF(),
    B: hook.b, C: hook.c,
    D: hook.d, E: hook.e,
    HL: hook.hlxy,
    Aa: hook.aa, Fa: hook.fa,
    Ba: hook.ba, Ca: hook.ca,
    Da: hook.da, Ea: hook.ea,
    HLa: hook.hla,
    IX: hook.ix, IY: hook.iy,
    SP: hook.sp, PC: hook.pc,
    I: hook.i, R: hook.getR(),
    IM: (hook.im2 ? 2 : hook.im1 ? 1 : 0) as 0 | 1 | 2,
    IFF1: (hook.iff1 ? 1 : 0) as 0 | 1,
    IFF2: (hook.iff2 ? 1 : 0) as 0 | 1,
    halt: (hook.hlt ? 1 : 0) as 0 | 1,
  };
}

function loadProgram(addr: number, bytes: number[]) {
  for (let i = 0; i < bytes.length; i++) {
    hook.mem[(addr + i) & xFFFF] = bytes[i];
  }
}

function step() { hook.executeMain(); }

const cpu: CpuApi = {
  setupCpu, setState, getState, loadProgram, step,
  mem: hook.mem, mockPorts: hook.mockPorts,
  setTStates: (v) => hook.setTStates(v),
  getTStates: () => hook.tStates,
};

const inputText = await getResource('_fuse-tests.in', 'utf-8');
const expectedText = await getResource('_fuse-tests.expected', 'utf-8');

runFuseSuite('FUSE Z80 tests (dist)', cpu, inputText, expectedText);
