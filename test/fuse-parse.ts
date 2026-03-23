export interface FuseMemBlock {
  addr: number;
  bytes: number[];
}

export interface FuseTestInput {
  name: string;
  AF: number; BC: number; DE: number; HL: number;
  AFa: number; BCa: number; DEa: number; HLa: number;
  IX: number; IY: number; SP: number; PC: number; WZ: number;
  I: number; R: number;
  iff1: number; iff2: number; im: number;
  halted: number;
  tStates: number;
  memBlocks: FuseMemBlock[];
}

export interface FuseEvent {
  tStates: number;
  type: string; // MC, MR, MW, PR, PW, PC
  addr: number;
  value?: number;
}

export interface FuseTestExpected {
  name: string;
  events: FuseEvent[];
  AF: number; BC: number; DE: number; HL: number;
  AFa: number; BCa: number; DEa: number; HLa: number;
  IX: number; IY: number; SP: number; PC: number; WZ: number;
  I: number; R: number;
  iff1: number; iff2: number; im: number;
  halted: number;
  tStates: number;
  memBlocks: FuseMemBlock[];
}

export function parseTestsIn(text: string): FuseTestInput[] {
  const tests: FuseTestInput[] = [];
  const lines = text.split('\n');
  let i = 0;

  while (i < lines.length) {
    // Skip empty lines
    if (lines[i].trim() === '') { i++; continue; }

    // Line 1: test name
    const name = lines[i].trim();
    i++;

    // Line 2: 13 hex values — AF BC DE HL AF' BC' DE' HL' IX IY SP PC WZ
    const regs = lines[i].trim().split(/\s+/).map(s => parseInt(s, 16));
    i++;

    // Line 3: I R iff1 iff2 im halted tStates
    const parts = lines[i].trim().split(/\s+/);
    const I = parseInt(parts[0], 16);
    const R = parseInt(parts[1], 16);
    const iff1 = parseInt(parts[2], 10);
    const iff2 = parseInt(parts[3], 10);
    const im = parseInt(parts[4], 10);
    const halted = parseInt(parts[5], 10);
    const tStates = parseInt(parts[6], 10);
    i++;

    // Memory blocks: "addr byte1 byte2 ... -1" until line is just "-1"
    const memBlocks: FuseMemBlock[] = [];
    while (i < lines.length && lines[i].trim() !== '-1') {
      const memParts = lines[i].trim().split(/\s+/).map(s => parseInt(s, 16));
      const addr = memParts[0];
      // Last element is -1 (0xFFFF... parsed as hex, but actually it's the terminator)
      const bytes: number[] = [];
      for (let j = 1; j < memParts.length; j++) {
        if (memParts[j] < 0 || isNaN(memParts[j])) break; // -1 terminator
        bytes.push(memParts[j]);
      }
      memBlocks.push({ addr, bytes });
      i++;
    }
    i++; // skip the "-1" line

    tests.push({
      name,
      AF: regs[0], BC: regs[1], DE: regs[2], HL: regs[3],
      AFa: regs[4], BCa: regs[5], DEa: regs[6], HLa: regs[7],
      IX: regs[8], IY: regs[9], SP: regs[10], PC: regs[11], WZ: regs[12],
      I, R, iff1, iff2, im, halted, tStates,
      memBlocks,
    });
  }

  return tests;
}

export function parseTestsExpected(text: string): FuseTestExpected[] {
  const tests: FuseTestExpected[] = [];
  const lines = text.split('\n');
  let i = 0;

  while (i < lines.length) {
    // Skip empty lines
    if (lines[i].trim() === '') { i++; continue; }

    // Line 1: test name (not indented)
    const name = lines[i].trim();
    i++;

    // Event lines: indented, format "tStates type addr [value]"
    const events: FuseEvent[] = [];
    while (i < lines.length && lines[i].length > 0 && (lines[i][0] === ' ' || lines[i][0] === '\t')) {
      const parts = lines[i].trim().split(/\s+/);
      const tStates = parseInt(parts[0], 10);
      const type = parts[1];
      const addr = parseInt(parts[2], 16);
      const value = parts.length > 3 ? parseInt(parts[3], 16) : undefined;
      events.push({ tStates, type, addr, value });
      i++;
    }

    // Register line: 13 hex values
    const regs = lines[i].trim().split(/\s+/).map(s => parseInt(s, 16));
    i++;

    // State line: I R iff1 iff2 im halted tStates
    const parts = lines[i].trim().split(/\s+/);
    const I = parseInt(parts[0], 16);
    const R = parseInt(parts[1], 16);
    const iff1 = parseInt(parts[2], 10);
    const iff2 = parseInt(parts[3], 10);
    const im = parseInt(parts[4], 10);
    const halted = parseInt(parts[5], 10);
    const tStates = parseInt(parts[6], 10);
    i++;

    // Memory blocks (optional): "addr byte1 byte2 ... -1" until empty line or EOF
    const memBlocks: FuseMemBlock[] = [];
    while (i < lines.length && lines[i].trim() !== '' && !isNaN(parseInt(lines[i].trim()[0], 16))) {
      const memLine = lines[i].trim();
      // Check this looks like a memory block (starts with hex addr)
      const memParts = memLine.split(/\s+/).map(s => parseInt(s, 16));
      if (isNaN(memParts[0])) break;
      const addr = memParts[0];
      const bytes: number[] = [];
      for (let j = 1; j < memParts.length; j++) {
        if (memParts[j] < 0 || isNaN(memParts[j])) break; // -1 terminator
        bytes.push(memParts[j]);
      }
      memBlocks.push({ addr, bytes });
      i++;
    }

    tests.push({
      name, events,
      AF: regs[0], BC: regs[1], DE: regs[2], HL: regs[3],
      AFa: regs[4], BCa: regs[5], DEa: regs[6], HLa: regs[7],
      IX: regs[8], IY: regs[9], SP: regs[10], PC: regs[11], WZ: regs[12],
      I, R, iff1, iff2, im, halted, tStates,
      memBlocks,
    });
  }

  return tests;
}
