import { beforeEach, describe, expect, it } from 'vitest';
import { xFF, xFFFF } from '../src/common/constants';
import { FuseTestExpected, parseTestsExpected, parseTestsIn } from './fuse-parse';
import type { CpuState } from './helpers';

export interface MockPorts {
  readQueue: number[];
  readIndex: number;
  writes: Array<{ addr: number; value: number }>;
}

export interface CpuApi {
  setupCpu: () => void;
  setState: (s: CpuState) => void;
  getState: () => CpuState;
  loadProgram: (addr: number, bytes: number[]) => void;
  step: () => void;
  mem: number[];
  mockPorts: MockPorts;
}

const REG_NAMES_16: Array<[keyof CpuState, keyof CpuState, string]> = [
  ['A', 'F', 'AF'],
  ['B', 'C', 'BC'],
  ['D', 'E', 'DE'],
  ['Aa', 'Fa', "AF'"],
  ['Ba', 'Ca', "BC'"],
  ['Da', 'Ea', "DE'"],
];

const REG_NAMES_SINGLE = ['HL', 'HLa', 'IX', 'IY', 'SP', 'PC', 'I', 'R', 'IM', 'IFF1', 'IFF2', 'halt'] as const;

function splitHi(val16: number): number { return (val16 >> 8) & xFF; }
function splitLo(val16: number): number { return val16 & xFF; }

export function runFuseSuite(suiteName: string, cpu: CpuApi, inputText: string, expectedText: string) {
  const inputs = parseTestsIn(inputText);
  const expecteds = parseTestsExpected(expectedText);

  const expectedMap = new Map<string, FuseTestExpected>();
  for (const exp of expecteds) expectedMap.set(exp.name, exp);

  describe(suiteName, () => {
    beforeEach(() => {
      cpu.mockPorts.readQueue = [];
      cpu.mockPorts.readIndex = 0;
      cpu.mockPorts.writes = [];
    });

    for (const input of inputs) {
      const expected = expectedMap.get(input.name);
      if (!expected) continue;

      it(input.name, () => {
        cpu.setupCpu();

        for (const event of expected.events) {
          if (event.type === 'PR' && event.value !== undefined) {
            cpu.mockPorts.readQueue.push(event.value);
          }
        }

        cpu.setState({
          A: splitHi(input.AF), F: splitLo(input.AF),
          B: splitHi(input.BC), C: splitLo(input.BC),
          D: splitHi(input.DE), E: splitLo(input.DE),
          HL: input.HL,
          Aa: splitHi(input.AFa), Fa: splitLo(input.AFa),
          Ba: splitHi(input.BCa), Ca: splitLo(input.BCa),
          Da: splitHi(input.DEa), Ea: splitLo(input.DEa),
          HLa: input.HLa,
          IX: input.IX,
          IY: input.IY,
          SP: input.SP,
          PC: input.PC,
          WZ: input.WZ,
          I: input.I, R: input.R,
          IM: input.im as 0 | 1 | 2,
          IFF1: input.iff1 as 0 | 1,
          IFF2: input.iff2 as 0 | 1,
          halt: input.halted as 0 | 1,
        });

        for (const block of input.memBlocks) {
          cpu.loadProgram(block.addr, block.bytes);
        }

        if (input.tStates > 1) {
          for (let i = 0; i < 10000; i++) {
            cpu.step();
            if (cpu.getState().PC === expected.PC) break;
          }
        } else {
          cpu.step();
        }

        const got = cpu.getState();
        const mismatches: string[] = [];

        for (const [hi, lo, pairName] of REG_NAMES_16) {
          const gotHi = got[hi] as number;
          const gotLo = got[lo] as number;
          const gotVal = (gotHi << 8) | gotLo;
          let expVal: number;
          switch (pairName) {
            case 'AF': expVal = expected.AF; break;
            case 'BC': expVal = expected.BC; break;
            case 'DE': expVal = expected.DE; break;
            case "AF'": expVal = expected.AFa; break;
            case "BC'": expVal = expected.BCa; break;
            case "DE'": expVal = expected.DEa; break;
            default: continue;
          }
          if (gotVal !== expVal) {
            const expHi = splitHi(expVal);
            const expLo = splitLo(expVal);
            if (gotHi !== expHi) mismatches.push(`  ${String(hi)}: got 0x${gotHi.toString(16).padStart(2, '0')}, expected 0x${expHi.toString(16).padStart(2, '0')}`);
            if (gotLo !== expLo) mismatches.push(`  ${String(lo)}: got 0x${gotLo.toString(16).padStart(2, '0')}, expected 0x${expLo.toString(16).padStart(2, '0')}`);
          }
        }

        for (const name of REG_NAMES_SINGLE) {
          const gotVal = got[name] as number;
          let expVal: number;
          switch (name) {
            case 'HL': expVal = expected.HL; break;
            case 'HLa': expVal = expected.HLa; break;
            case 'IX': expVal = expected.IX; break;
            case 'IY': expVal = expected.IY; break;
            case 'SP': expVal = expected.SP; break;
            case 'PC': expVal = expected.PC; break;
            case 'I': expVal = expected.I; break;
            case 'R': expVal = expected.R; break;
            case 'IM': expVal = expected.im; break;
            case 'IFF1': expVal = expected.iff1; break;
            case 'IFF2': expVal = expected.iff2; break;
            case 'halt': expVal = expected.halted; break;
            default: continue;
          }
          if (gotVal !== expVal) {
            const pad = name === 'HL' || name === 'HLa' || name === 'IX' || name === 'IY' || name === 'SP' || name === 'PC' ? 4 : 2;
            mismatches.push(`  ${name}: got 0x${gotVal.toString(16).padStart(pad, '0')}, expected 0x${expVal.toString(16).padStart(pad, '0')}`);
          }
        }

        for (const block of expected.memBlocks) {
          for (let j = 0; j < block.bytes.length; j++) {
            const addr = (block.addr + j) & xFFFF;
            const gotByte = cpu.mem[addr];
            const expByte = block.bytes[j];
            if (gotByte !== expByte) {
              mismatches.push(`  mem[0x${addr.toString(16).padStart(4, '0')}]: got 0x${gotByte.toString(16).padStart(2, '0')}, expected 0x${expByte.toString(16).padStart(2, '0')}`);
            }
          }
        }

        const expectedPW = expected.events
          .filter(e => e.type === 'PW' && e.value !== undefined)
          .map(e => ({ addr: e.addr, value: e.value! }));

        if (cpu.mockPorts.writes.length !== expectedPW.length) {
          mismatches.push(`  port writes count: got ${cpu.mockPorts.writes.length}, expected ${expectedPW.length}`);
        } else {
          for (let j = 0; j < expectedPW.length; j++) {
            const gotPW = cpu.mockPorts.writes[j];
            const expPW = expectedPW[j];
            if (gotPW.addr !== expPW.addr || gotPW.value !== expPW.value) {
              mismatches.push(`  port write[${j}]: got {0x${gotPW.addr.toString(16).padStart(4, '0')}, 0x${gotPW.value.toString(16).padStart(2, '0')}}, expected {0x${expPW.addr.toString(16).padStart(4, '0')}, 0x${expPW.value.toString(16).padStart(2, '0')}}`);
            }
          }
        }

        if (mismatches.length > 0) {
          expect.fail(`Register/memory mismatch:\n${mismatches.join('\n')}`);
        }
      });
    }
  });
}
