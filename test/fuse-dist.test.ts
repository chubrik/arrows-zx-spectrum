import { readFileSync } from 'fs';
import { getResource } from '../build/resources';
import { xFFFF } from '../src/common/constants';
import { runFuseSuite, type CpuApi, type MockPorts } from './fuse-runner';
import type { CpuState } from './helpers';

const distPath = 'dist/temp/z80-test/z80-test.step09.subst.js';
const code = readFileSync(distPath, 'utf-8');

// Bundle is ESM; eval'ing in a fresh function scope assigns globalThis.__z80
// as a side effect via the test-hook block.
const g = globalThis as Record<string, unknown>;
delete g.__z80;
// eslint-disable-next-line @typescript-eslint/no-implied-eval
new Function(code)();

const z80 = g.__z80 as {
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

  a: number; aa: number; b: number; ba: number; c: number; ca: number;
  d: number; da: number; e: number; ea: number; fa: number;
  hla: number; hlxy: number;
  i: number; ix: number; iy: number; pc: number; sp: number;
};

function setupCpu() {
  z80.clearCpu();
  z80.setRamMinAddrForTest(0);
}

function setState(s: CpuState) {
  if (s.A !== undefined) z80.setA(s.A);
  if (s.F !== undefined) z80.setF(s.F);
  if (s.B !== undefined) z80.setB(s.B);
  if (s.C !== undefined) z80.setC(s.C);
  if (s.D !== undefined) z80.setD(s.D);
  if (s.E !== undefined) z80.setE(s.E);
  if (s.HL !== undefined) z80.setHLXY(s.HL);
  if (s.Aa !== undefined) z80.setAa(s.Aa);
  if (s.Fa !== undefined) z80.setFa(s.Fa);
  if (s.Ba !== undefined) z80.setBa(s.Ba);
  if (s.Ca !== undefined) z80.setCa(s.Ca);
  if (s.Da !== undefined) z80.setDa(s.Da);
  if (s.Ea !== undefined) z80.setEa(s.Ea);
  if (s.HLa !== undefined) z80.setHLa(s.HLa);
  if (s.IX !== undefined) z80.setIX(s.IX);
  if (s.IY !== undefined) z80.setIY(s.IY);
  if (s.SP !== undefined) z80.setSP(s.SP);
  if (s.PC !== undefined) z80.setPC(s.PC);
  if (s.WZ !== undefined) z80.setWZ(s.WZ);
  if (s.I !== undefined) z80.setI(s.I);
  if (s.R !== undefined) z80.setR(s.R);
  if (s.IM !== undefined) {
    z80.setIM1(s.IM === 1 ? z80.IM1 : 0);
    z80.setIM2(s.IM === 2 ? z80.IM2 : 0);
  }
  if (s.IFF1 !== undefined) z80.setIFF1(s.IFF1 ? z80.IFF1 : 0);
  if (s.IFF2 !== undefined) z80.setIFF2(s.IFF2 ? z80.IFF2 : 0);
  if (s.halt !== undefined) z80.setHLT(s.halt ? z80.HLT : 0);
}

function getState(): CpuState {
  return {
    A: z80.a, F: z80.getF(),
    B: z80.b, C: z80.c,
    D: z80.d, E: z80.e,
    HL: z80.hlxy,
    Aa: z80.aa, Fa: z80.fa,
    Ba: z80.ba, Ca: z80.ca,
    Da: z80.da, Ea: z80.ea,
    HLa: z80.hla,
    IX: z80.ix, IY: z80.iy,
    SP: z80.sp, PC: z80.pc,
    I: z80.i, R: z80.getR(),
    IM: (z80.im2 ? 2 : z80.im1 ? 1 : 0) as 0 | 1 | 2,
    IFF1: (z80.iff1 ? 1 : 0) as 0 | 1,
    IFF2: (z80.iff2 ? 1 : 0) as 0 | 1,
    halt: (z80.hlt ? 1 : 0) as 0 | 1,
  };
}

function loadProgram(addr: number, bytes: number[]) {
  for (let i = 0; i < bytes.length; i++) {
    z80.mem[(addr + i) & xFFFF] = bytes[i];
  }
}

function step() { z80.executeMain(); }

const cpu: CpuApi = { setupCpu, setState, getState, loadProgram, step, mem: z80.mem, mockPorts: z80.mockPorts };

const inputText = await getResource('fuse-tests.in', 'utf-8');
const expectedText = await getResource('fuse-tests.expected', 'utf-8');

runFuseSuite('FUSE Z80 tests (dist)', cpu, inputText, expectedText);
