import { describe, expect, it } from 'vitest';
import { getState, loadProgram, setState, setupCpu, step } from './helpers';

// DD/FD prefixes: a chain of prefixes collapses to the last one (as on a real Z80), registers that
// are not the target stay intact. Not covered by the FUSE suite.
describe('DD/FD prefix chains', () => {
  const regs = { HL: 0x1111, IX: 0x2222, IY: 0x3333 };
  const ldNN = [0x21, 0x34, 0x12]; // LD HL/IX/IY,1234h depending on the prefix

  const cases: [string, number[], typeof regs][] = [
    ['DD: LD IX,nn', [0xDD, ...ldNN], { HL: 0x1111, IX: 0x1234, IY: 0x3333 }],
    ['FD: LD IY,nn', [0xFD, ...ldNN], { HL: 0x1111, IX: 0x2222, IY: 0x1234 }],
    ['DD DD: LD IX,nn', [0xDD, 0xDD, ...ldNN], { HL: 0x1111, IX: 0x1234, IY: 0x3333 }],
    ['DD FD: LD IY,nn', [0xDD, 0xFD, ...ldNN], { HL: 0x1111, IX: 0x2222, IY: 0x1234 }],
    ['FD DD: LD IX,nn', [0xFD, 0xDD, ...ldNN], { HL: 0x1111, IX: 0x1234, IY: 0x3333 }],
    ['FD FD DD FD: LD IY,nn', [0xFD, 0xFD, 0xDD, 0xFD, ...ldNN], { HL: 0x1111, IX: 0x2222, IY: 0x1234 }],
    ['DD ×1000: LD IX,nn', [...new Array(1000).fill(0xDD), ...ldNN], { HL: 0x1111, IX: 0x1234, IY: 0x3333 }],
    ['DD then LD A,n (prefix without effect)', [0xDD, 0x3E, 0x42], regs],
  ];

  for (const [name, bytes, expected] of cases)
    it(name, () => {
      setupCpu();
      setState({ ...regs, PC: 0 });
      loadProgram(0, bytes);
      step();
      const s = getState();
      expect({ HL: s.HL, IX: s.IX, IY: s.IY }).toEqual(expected);
      expect(s.PC).toBe(bytes.length);
    });

  it('each prefix byte refreshes R', () => {
    setupCpu();
    setState({ ...regs, PC: 0, R: 0 });
    loadProgram(0, [0xDD, 0xDD, 0xDD, ...ldNN]);
    step();
    expect(getState().R).toBe(4); // 3 prefixes + the instruction itself
  });
});
