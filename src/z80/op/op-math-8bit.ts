import { get, set } from '../../common/utils';
import { BIT7, F3, F5, FC, FH, FN, FO, FS, FZ, setF3, setF5, setFC, setFH, setFN, setFO, setFS, setFSZ53, setFSZ53P, setFZ } from '../flags';
import { A, regs } from '../registers';

/** INC r */
export function incReg(reg: number) {
  const value = regs[reg];
  const result = (value + 1) & 0xFF;
  regs[reg] = result;

  setFSZ53(result);
  setFH(!(result & 0x0F) ? FH : 0);
  setFO(value === 0x7F ? FO : 0);
  setFN(0);
}

/** INC (HL) | INC (IX+d) | INC (IY+d) */
export function inc(addr: number) {
  const value = get(addr);
  const result = (value + 1) & 0xFF;
  set(addr, result);

  setFSZ53(result);
  setFH(!(result & 0x0F) ? FH : 0);
  setFO(value === 0x7F ? FO : 0);
  setFN(0);
}

/** DEC r */
export function decReg(addr: number) {
  const value = regs[addr];
  const result = (value - 1) & 0xFF;
  regs[addr] = result;

  setFSZ53(result);
  setFH(!(value & 0x0F) ? FH : 0);
  setFO(value === BIT7 ? FO : 0);
  setFN(FN);
}

/** DEC (HL) | DEC (IX+d) | DEC (IY+d) */
export function dec(addr: number) {
  const value = get(addr);
  const result = (value - 1) & 0xFF;
  set(addr, result);

  setFSZ53(result);
  setFH(!(value & 0x0F) ? FH : 0);
  setFO(value === BIT7 ? FO : 0);
  setFN(FN);
}

export function add(operand: number, carry: number = 0) {
  const a = regs[A];
  const sum = a + operand + carry;
  const result = sum & 0xFF;
  regs[A] = result;

  setFSZ53(result);
  setFH((a ^ operand ^ result) & FH);
  setFO(((a ^ ~operand) & (a ^ result) & FS) >> 5);
  setFN(0);
  setFC((sum >> 8) & FC);
}

export function sub(operand: number, carry: number = 0) {
  const a = regs[A];
  const diff = a - operand - carry;
  const result = diff & 0xFF;
  regs[A] = result;

  setFSZ53(result);
  setFH((a ^ operand ^ result) & FH);
  setFO(((a ^ operand) & (a ^ result) & FS) >> 5);
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
  setFO(((a ^ operand) & (a ^ result) & FS) >> 5);
  setFN(FN);
  setFC((diff >> 8) & FC);
}

export function logic(result: number, fH: number = 0) {
  regs[A] = result;

  setFSZ53P(result);
  setFH(fH);
  setFN(0);
  setFC(0);
}
