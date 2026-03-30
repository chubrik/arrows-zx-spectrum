import { read, write } from '../../common/memory';
import { BIT7, F3, F5, FC, fc, FH, FP, FS, FZ, setF3, setF5, setFC, setFH, setFN, setFP, setFS, setFSZ53P, setFZ } from '../flags';
import { A, get16, HL, regs } from '../registers';

/** BIT b,r | BIT b,(HL) | BIT b,(IX+d) | BIT b,(IY+d) */
export function BIT_b_val(bit: number, value: number, f53Source: number) {
  const isSet = value & bit;

  setFS(isSet & FS);
  setFZ(isSet ? 0 : FZ);
  setF5(f53Source & F5);
  setFH(FH);
  setF3(f53Source & F3);
  setFP(isSet ? 0 : FP);
  setFN(0);
}

/** RLCA */
export function RLCA() {
  const a = regs[A];
  const fc = (a >> 7) & FC;
  const result = ((a << 1) | fc) & 0xFF;
  regs[A] = result;
  setFRotA(result, fc);
}

/** RRCA */
export function RRCA() {
  const a = regs[A];
  const fc = a & FC;
  const result = ((a >> 1) | (fc << 7)) & 0xFF;
  regs[A] = result;
  setFRotA(result, fc);
}

/** RLA */
export function RLA() {
  const a = regs[A];
  const newFc = (a >> 7) & FC;
  const result = ((a << 1) | fc) & 0xFF;
  regs[A] = result;
  setFRotA(result, newFc);
}

/** RRA */
export function RRA() {
  const a = regs[A];
  const newFc = a & FC;
  const result = ((a >> 1) | (fc << 7)) & 0xFF;
  regs[A] = result;
  setFRotA(result, newFc);
}

/** RLD */
export function RLD() {
  const a = regs[A];
  const hl = get16(HL);
  const value = read(hl);
  const resultA = (a & 0xF0) | (value >> 4);
  const resultMem = ((value << 4) | (a & 0x0F)) & 0xFF;
  regs[A] = resultA;
  write(hl, resultMem);

  setFSZ53P(resultA);
  setFH(0);
  setFN(0);
}

/** RRD */
export function RRD() {
  const a = regs[A];
  const hl = get16(HL);
  const value = read(hl);
  const resultA = (a & 0xF0) | (value & 0x0F);
  const resultMem = ((a << 4) | (value >> 4)) & 0xFF;
  regs[A] = resultA;
  write(hl, resultMem);

  setFSZ53P(resultA);
  setFH(0);
  setFN(0);
}

/** RLC r | RLC (HL) | RLC (IX+d) | RLC (IY+d) */
export function RLC_val(value: number): number {
  const fc = (value >> 7) & FC;
  const result = ((value << 1) | fc) & 0xFF;
  setFShift(result, fc);
  return result;
}

/** RRC r | RRC (HL) | RRC (IX+d) | RRC (IY+d) */
export function RRC_val(value: number): number {
  const fc = value & FC;
  const result = ((value >> 1) | (fc << 7)) & 0xFF;
  setFShift(result, fc);
  return result;
}

/** RL r | RL (HL) | RL (IX+d) | RL (IY+d) */
export function RL_val(value: number): number {
  const newFc = (value >> 7) & FC;
  const result = ((value << 1) | fc) & 0xFF;
  setFShift(result, newFc);
  return result;
}

/** RR r | RR (HL) | RR (IX+d) | RR (IY+d) */
export function RR_val(value: number): number {
  const newFc = value & FC;
  const result = ((value >> 1) | (fc << 7)) & 0xFF;
  setFShift(result, newFc);
  return result;
}

/** SLA r | SLA (HL) | SLA (IX+d) | SLA (IY+d) */
export function SLA_val(value: number): number {
  const fc = (value >> 7) & FC;
  const result = (value << 1) & 0xFF;
  setFShift(result, fc);
  return result;
}

/** SRA r | SRA (HL) | SRA (IX+d) | SRA (IY+d) */
export function SRA_val(value: number): number {
  const fc = value & FC;
  const result = ((value & BIT7) | (value >> 1)) & 0xFF;
  setFShift(result, fc);
  return result;
}

/** SLL r | SLL (HL) | SLL (IX+d) | SLL (IY+d) */
export function SLL_val(value: number): number {
  const fc = (value >> 7) & FC;
  const result = ((value << 1) | 0x01) & 0xFF;
  setFShift(result, fc);
  return result;
}

/** SRL r | SRL (HL) | SRL (IX+d) | SRL (IY+d) */
export function SRL_val(value: number): number {
  const fc = value & FC;
  const result = (value >> 1) & 0xFF;
  setFShift(result, fc);
  return result;
}

function setFRotA(result: number, fc: number) {
  setF5(result & F5);
  setF3(result & F3);
  setFH(0);
  setFN(0);
  setFC(fc);
}

function setFShift(result: number, fc: number) {
  setFSZ53P(result);
  setFH(0);
  setFN(0);
  setFC(fc);
}
