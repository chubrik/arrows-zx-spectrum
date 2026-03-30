import { read, write } from '../../common/memory';
import { BIT7, F3, F5, FC, FH, FN, FP, FS, FZ, setF3, setF5, setFC, setFH, setFN, setFP, setFS, setFSZ53, setFSZ53P, setFZ } from '../flags';
import { A, regs } from '../registers';

/** INC r */
export function incReg(reg: number) {
  const r = regs[reg];
  const result = (r + 1) & 0xFF;
  regs[reg] = result;

  setFSZ53(result);
  setFH(!(result & 0x0F) ? FH : 0);
  setFP(r === 0x7F ? FP : 0);
  setFN(0);
}

/** INC (HL) | INC (IX+d) | INC (IY+d) */
export function inc(addr: number) {
  const value = read(addr);
  const result = (value + 1) & 0xFF;
  write(addr, result);

  setFSZ53(result);
  setFH(!(result & 0x0F) ? FH : 0);
  setFP(value === 0x7F ? FP : 0);
  setFN(0);
}

/** DEC r */
export function decReg(addr: number) {
  const r = regs[addr];
  const result = (r - 1) & 0xFF;
  regs[addr] = result;

  setFSZ53(result);
  setFH(!(r & 0x0F) ? FH : 0);
  setFP(r === BIT7 ? FP : 0);
  setFN(FN);
}

/** DEC (HL) | DEC (IX+d) | DEC (IY+d) */
export function dec(addr: number) {
  const value = read(addr);
  const result = (value - 1) & 0xFF;
  write(addr, result);

  setFSZ53(result);
  setFH(!(value & 0x0F) ? FH : 0);
  setFP(value === BIT7 ? FP : 0);
  setFN(FN);
}

export function add(operand: number, fc: number = 0) {
  const a = regs[A];
  const sum = a + operand + fc;
  const result = sum & 0xFF;
  regs[A] = result;

  setFSZ53(result);
  setFH((a ^ operand ^ result) & FH);
  setFP(((a ^ ~operand) & (a ^ result) & FS) >> 5);
  setFN(0);
  setFC((sum >> 8) & FC);
}

export function sub(operand: number, fc: number = 0) {
  const a = regs[A];
  const diff = a - operand - fc;
  const result = diff & 0xFF;
  regs[A] = result;

  setFSZ53(result);
  setFH((a ^ operand ^ result) & FH);
  setFP(((a ^ operand) & (a ^ result) & FS) >> 5);
  setFN(FN);
  setFC((diff >> 8) & FC);
}

export function cp(operand: number) {
  const a = regs[A];
  const diff = a - operand;
  const result = diff & 0xFF;

  setFS(result & FS);
  setFZ(result ? 0 : FZ);
  setF5(operand & F5);
  setF3(operand & F3);
  setFH((a ^ operand ^ result) & FH);
  setFP(((a ^ operand) & (a ^ result) & FS) >> 5);
  setFN(FN);
  setFC((diff >> 8) & FC);
}

export function logic(result: number, fh: number = 0) {
  regs[A] = result;

  setFSZ53P(result);
  setFH(fh);
  setFN(0);
  setFC(0);
}
