import { readMem8, writeMem8 } from '../../common/memory';
import { bitFC, flagsSZ53P, maskF53, maskFSZPV } from '../flags';
import { getA, getF, getFC, getHL, setA, setF } from '../utils';

/** RLCA */
export function RLCA() {
  const a = getA();
  const carry = (a >> 7) & bitFC;
  const result = ((a << 1) | carry) & 0xFF;
  setA(result);
  setFRotA(result, carry);
}

/** RRCA */
export function RRCA() {
  const a = getA();
  const carry = a & bitFC;
  const result = ((a >> 1) | (carry << 7)) & 0xFF;
  setA(result);
  setFRotA(result, carry);
}

/** RLA */
export function RLA() {
  const a = getA();
  const oldCarry = getFC();
  const carry = (a >> 7) & bitFC;
  const result = ((a << 1) | oldCarry) & 0xFF;
  setA(result);
  setFRotA(result, carry);
}

/** RRA */
export function RRA() {
  const a = getA();
  const oldCarry = getFC();
  const carry = a & bitFC;
  const result = ((a >> 1) | (oldCarry << 7)) & 0xFF;
  setA(result);
  setFRotA(result, carry);
}

function setFRotA(result: number, carry: number) {
  setF((getF() & maskFSZPV) | (result & maskF53) | carry);
}

/** RLD */
export function RLD() {
  const a = getA();
  const addr = getHL();
  const mem = readMem8(addr);
  const resultA = (a & 0xF0) | (mem >> 4);
  const resultMem = ((mem << 4) | (a & 0x0F)) & 0xFF;
  setA(resultA);
  writeMem8(addr, resultMem);
  setF(flagsSZ53P(resultA) | getFC());
}

/** RRD */
export function RRD() {
  const a = getA();
  const addr = getHL();
  const mem = readMem8(addr);
  const resultA = (a & 0xF0) | (mem & 0x0F);
  const resultMem = ((a << 4) | (mem >> 4)) & 0xFF;
  setA(resultA);
  writeMem8(addr, resultMem);
  setF(flagsSZ53P(resultA) | getFC());
}

/** RLC r | RLC (HL) | RLC (IX+d) | RLC (IY+d) */
export function RLC_val(value: number): number {
  const carry = (value >> 7) & bitFC;
  const result = ((value << 1) | carry) & 0xFF;
  setF(flagsSZ53P(result) | carry);
  return result;
}

/** RRC r | RRC (HL) | RRC (IX+d) | RRC (IY+d) */
export function RRC_val(value: number): number {
  const carry = value & bitFC;
  const result = ((value >> 1) | (carry << 7)) & 0xFF;
  setF(flagsSZ53P(result) | carry);
  return result;
}

/** RL r | RL (HL) | RL (IX+d) | RL (IY+d) */
export function RL_val(value: number): number {
  const oldCarry = getFC();
  const carry = (value >> 7) & bitFC;
  const result = ((value << 1) | oldCarry) & 0xFF;
  setF(flagsSZ53P(result) | carry);
  return result;
}

/** RR r | RR (HL) | RR (IX+d) | RR (IY+d) */
export function RR_val(value: number): number {
  const oldCarry = getFC();
  const carry = value & bitFC;
  const result = ((value >> 1) | (oldCarry << 7)) & 0xFF;
  setF(flagsSZ53P(result) | carry);
  return result;
}

/** SLA r | SLA (HL) | SLA (IX+d) | SLA (IY+d) */
export function SLA_val(value: number): number {
  const carry = (value >> 7) & bitFC;
  const result = (value << 1) & 0xFF;
  setF(flagsSZ53P(result) | carry);
  return result;
}

/** SRA r | SRA (HL) | SRA (IX+d) | SRA (IY+d) */
export function SRA_val(value: number): number {
  const carry = value & bitFC;
  const result = ((value >> 1) | (value & 0x80)) & 0xFF;
  setF(flagsSZ53P(result) | carry);
  return result;
}

/** SLL r | SLL (HL) | SLL (IX+d) | SLL (IY+d) */
export function SLL_val(value: number): number {
  const carry = (value >> 7) & bitFC;
  const result = ((value << 1) | 0x01) & 0xFF;
  setF(flagsSZ53P(result) | carry);
  return result;
}

/** SRL r | SRL (HL) | SRL (IX+d) | SRL (IY+d) */
export function SRL_val(value: number): number {
  const carry = value & bitFC;
  const result = (value >> 1) & 0xFF;
  setF(flagsSZ53P(result) | carry);
  return result;
}
