import { expect, it } from 'vitest';
import { setTStates, tStates } from '../src/z80/utils';
import { loadProgram, setState, setupCpu, step } from './helpers';

// Instruction timings the FUSE suite does not cover: prefix chains, undefined ED opcodes,
// the (IX+d) special cases. Expected values are those of a real Z80.
const cases: [string, number[], number][] = [
  ['ED 00: undefined ED opcode', [0xED, 0x00], 8],
  ['ED 77: undefined ED opcode', [0xED, 0x77], 8],
  ['DD 00: prefixed NOP', [0xDD, 0x00], 8],
  ['DD DD 21 nn nn: each extra prefix costs 4', [0xDD, 0xDD, 0x21, 0x34, 0x12], 18],
  ['DD FD 21 nn nn: LD IY,nn after a dropped prefix', [0xDD, 0xFD, 0x21, 0x34, 0x12], 18],
  ['DD 36 d n: LD (IX+d),n', [0xDD, 0x36, 0x05, 0x42], 19],
  ['DD CB d 46: BIT 0,(IX+d)', [0xDD, 0xCB, 0x05, 0x46], 20],
  ['DD 34 d: INC (IX+d)', [0xDD, 0x34, 0x05], 23],
  ['DD E3: EX (SP),IX', [0xDD, 0xE3], 23],
  ['76: HALT, one iteration', [0x76], 4],
  ['10 e: DJNZ taken', [0x10, 0xFE], 13],
  ['C0: RET NZ taken', [0xC0], 11],
  ['C4 nn nn: CALL NZ taken', [0xC4, 0x00, 0x80], 17],
];

for (const [name, bytes, expected] of cases)
  it(name, () => {
    setupCpu();
    setState({ B: 2, F: 0, HL: 0x8000, IX: 0x8000, IY: 0x8000, SP: 0x9000, PC: 0 });
    loadProgram(0, bytes);
    setTStates(0);
    step();
    expect(tStates).toBe(expected);
  });
