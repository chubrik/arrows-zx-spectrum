import { mems, write } from '../../common/memory';
import { BIT7, F3, F5, FC, FH, FN, FP, FS, FZ, setF3, setF5, setFC, setFH, setFN, setFP, setFS, setFSZ53, setFSZ53P, setFZ } from '../flags';
import { A, regs } from '../registers';
import { getHLXYd } from '../utils';

/** INC r */
export function INC_r(reg: number) {
  const r = regs[reg];
  const result = (r + 1) & 0xFF;
  regs[reg] = result;

  setFSZ53(result);
  setFH(!(result & 0x0F) ? FH : 0);
  setFP(r === 0x7F ? FP : 0);
  setFN(0);
}

/** INC (HL) | INC (IX+d) | INC (IY+d) */
export function INC_hl() {
  const addr = getHLXYd();
  const value = mems[addr];
  const result = (value + 1) & 0xFF;
  write(addr, result);

  setFSZ53(result);
  setFH(!(result & 0x0F) ? FH : 0);
  setFP(value === 0x7F ? FP : 0);
  setFN(0);
}

/** DEC r */
export function DEC_r(reg: number) {
  const r = regs[reg];
  const result = (r - 1) & 0xFF;
  regs[reg] = result;

  setFSZ53(result);
  setFH(!(r & 0x0F) ? FH : 0);
  setFP(r === BIT7 ? FP : 0);
  setFN(FN);
}

/** DEC (HL) | DEC (IX+d) | DEC (IY+d) */
export function DEC_hl() {
  const addr = getHLXYd();
  const value = mems[addr];
  const result = (value - 1) & 0xFF;
  write(addr, result);

  setFSZ53(result);
  setFH(!(value & 0x0F) ? FH : 0);
  setFP(value === BIT7 ? FP : 0);
  setFN(FN);
}

/**
 * ADD A,n | ADD A,r | ADD A,(HL) | ADD A,(IX+d) | ADD A,(IY+d)
 * ADC A,n | ADC A,r | ADC A,(HL) | ADC A,(IX+d) | ADC A,(IY+d)
 */
export function ADD_ADC(operand: number, fc: number = 0) {
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

/**
 * SUB A,n | SUB A,r | SUB A,(HL) | SUB A,(IX+d) | SUB A,(IY+d)
 * SBC A,n | SBC A,r | SBC A,(HL) | SBC A,(IX+d) | SBC A,(IY+d)
 */
export function SUB_SBC(operand: number, fc: number = 0) {
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

/** CP n | CP r | CP (HL) | CP (IX+d) | CP (IY+d) */
export function CP(operand: number) {
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

/**
 * AND n | AND r | AND (HL) | AND (IX+d) | AND (IY+d)
 * XOR n | XOR r | XOR (HL) | XOR (IX+d) | XOR (IY+d)
 * OR n  | OR r  | OR (HL)  | OR (IX+d)  | OR (IY+d)
 */
export function AND_XOR_OR(result: number, fh: number = 0) {
  regs[A] = result;

  setFSZ53P(result);
  setFH(fh);
  setFN(0);
  setFC(0);
}
