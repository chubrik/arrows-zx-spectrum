import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getResource } from '../build/resources';
import { readMem8 } from '../src/common/memory';
import { FuseTestExpected, parseTestsExpected, parseTestsIn } from './fuse-parse';
import { getState, loadProgram, setState, setupCpu, step } from './helpers';

// ---------------------------------------------------------------------------
// Port mocking — queue-based for multiple reads per instruction
// ---------------------------------------------------------------------------

const mockPorts = vi.hoisted(() => ({
  readQueue: [] as number[],
  readIndex: 0,
  writes: [] as Array<{ addr: number; value: number }>,
}));

vi.mock('../src/common/ports', () => ({
  readPort: () => mockPorts.readQueue[mockPorts.readIndex++] ?? 0xFF,
  writePort: (addr: number, value: number) => { mockPorts.writes.push({ addr, value }); },
}));

// ---------------------------------------------------------------------------
// Load FUSE test data
// ---------------------------------------------------------------------------

const inputText = await getResource('fuse-tests.in', 'utf-8');
const expectedText = await getResource('fuse-tests.expected', 'utf-8');

const inputs = parseTestsIn(inputText);
const expecteds = parseTestsExpected(expectedText);

const expectedMap = new Map<string, FuseTestExpected>();
for (const exp of expecteds) {
  expectedMap.set(exp.name, exp);
}

// ---------------------------------------------------------------------------
// Register name mapping for diagnostics
// ---------------------------------------------------------------------------

const REG_NAMES_16: Array<[keyof ReturnType<typeof getState>, keyof ReturnType<typeof getState>, string]> = [
  ['A', 'F', 'AF'],
  ['B', 'C', 'BC'],
  ['D', 'E', 'DE'],
  ['H', 'L', 'HL'],
  ['Aa', 'Fa', "AF'"],
  ['Ba', 'Ca', "BC'"],
  ['Da', 'Ea', "DE'"],
  ['Ha', 'La', "HL'"],
];

const REG_NAMES_SINGLE = ['IX', 'IY', 'SP', 'PC', 'I', 'R', 'IM', 'IFF1', 'IFF2', 'halt'] as const;

function splitHigh(val16: number): number { return (val16 >> 8) & 0xFF; }
function splitLow(val16: number): number { return val16 & 0xFF; }

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('FUSE Z80 tests', () => {
  beforeEach(() => {
    mockPorts.readQueue = [];
    mockPorts.readIndex = 0;
    mockPorts.writes = [];
  });

  for (const input of inputs) {
    const expected = expectedMap.get(input.name);
    if (!expected) continue;

    it(input.name, () => {
      // 1. Setup CPU
      setupCpu();

      // 2. Extract PR values from expected events → fill readQueue
      for (const event of expected.events) {
        if (event.type === 'PR' && event.value !== undefined) {
          mockPorts.readQueue.push(event.value);
        }
      }

      // 3. Set registers from input
      setState({
        A: splitHigh(input.AF), F: splitLow(input.AF),
        B: splitHigh(input.BC), C: splitLow(input.BC),
        D: splitHigh(input.DE), E: splitLow(input.DE),
        H: splitHigh(input.HL), L: splitLow(input.HL),
        Aa: splitHigh(input.AFa), Fa: splitLow(input.AFa),
        Ba: splitHigh(input.BCa), Ca: splitLow(input.BCa),
        Da: splitHigh(input.DEa), Ea: splitLow(input.DEa),
        Ha: splitHigh(input.HLa), La: splitLow(input.HLa),
        IX: input.IX, IY: input.IY,
        SP: input.SP, PC: input.PC,
        WZ: input.WZ,
        I: input.I, R: input.R,
        IM: input.im as 0 | 1 | 2,
        IFF1: input.iff1 as 0 | 1,
        IFF2: input.iff2 as 0 | 1,
        halt: input.halted as 0 | 1,
      });

      // 4. Load memory blocks from input
      for (const block of input.memBlocks) {
        loadProgram(block.addr, block.bytes);
      }

      // 5. Execute instruction(s)
      if (input.tStates > 1) {
        // Multi-cycle test: step until PC matches expected
        for (let i = 0; i < 10000; i++) {
          step();
          if (getState().PC === expected.PC) break;
        }
      } else {
        step();
      }

      // 6. Compare registers (skip WZ and tStates)
      const got = getState();
      const mismatches: string[] = [];

      // Compare 16-bit register pairs
      for (const [hi, lo, pairName] of REG_NAMES_16) {
        const gotHi = got[hi] as number;
        const gotLo = got[lo] as number;
        const gotVal = (gotHi << 8) | gotLo;
        let expVal: number;
        switch (pairName) {
          case 'AF': expVal = expected.AF; break;
          case 'BC': expVal = expected.BC; break;
          case 'DE': expVal = expected.DE; break;
          case 'HL': expVal = expected.HL; break;
          case "AF'": expVal = expected.AFa; break;
          case "BC'": expVal = expected.BCa; break;
          case "DE'": expVal = expected.DEa; break;
          case "HL'": expVal = expected.HLa; break;
          default: continue;
        }
        if (gotVal !== expVal) {
          const expHi = splitHigh(expVal);
          const expLo = splitLow(expVal);
          if (gotHi !== expHi) mismatches.push(`  ${hi}: got 0x${gotHi.toString(16).padStart(2, '0')}, expected 0x${expHi.toString(16).padStart(2, '0')}`);
          if (gotLo !== expLo) mismatches.push(`  ${lo}: got 0x${gotLo.toString(16).padStart(2, '0')}, expected 0x${expLo.toString(16).padStart(2, '0')}`);
        }
      }

      // Compare single registers
      for (const name of REG_NAMES_SINGLE) {
        const gotVal = got[name] as number;
        let expVal: number;
        switch (name) {
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
          const pad = name === 'IX' || name === 'IY' || name === 'SP' || name === 'PC' ? 4 : 2;
          mismatches.push(`  ${name}: got 0x${gotVal.toString(16).padStart(pad, '0')}, expected 0x${expVal.toString(16).padStart(pad, '0')}`);
        }
      }

      // 7. Compare memory
      for (const block of expected.memBlocks) {
        for (let j = 0; j < block.bytes.length; j++) {
          const addr = (block.addr + j) & 0xFFFF;
          const gotByte = readMem8(addr);
          const expByte = block.bytes[j];
          if (gotByte !== expByte) {
            mismatches.push(`  mem[0x${addr.toString(16).padStart(4, '0')}]: got 0x${gotByte.toString(16).padStart(2, '0')}, expected 0x${expByte.toString(16).padStart(2, '0')}`);
          }
        }
      }

      // 8. Compare port writes
      const expectedPW = expected.events
        .filter(e => e.type === 'PW' && e.value !== undefined)
        .map(e => ({ addr: e.addr, value: e.value! }));

      if (mockPorts.writes.length !== expectedPW.length) {
        mismatches.push(`  port writes count: got ${mockPorts.writes.length}, expected ${expectedPW.length}`);
      } else {
        for (let j = 0; j < expectedPW.length; j++) {
          const gotPW = mockPorts.writes[j];
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
