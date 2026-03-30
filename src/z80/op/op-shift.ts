import { get, get16, set } from '../../common/utils';
import { ff, setFSZ53P } from '../flags';
import { A, HL } from '../registers';

/** RLCA */
export function RLCA() {
  const a = get(A);
  const carry = (a >> 7) & 0x01;
  const result = ((a << 1) | carry) & 0xFF;
  set(A, result);
  setFRotA(result, carry);
}

/** RRCA */
export function RRCA() {
  const a = get(A);
  const carry = a & 0x01;
  const result = ((a >> 1) | (carry << 7)) & 0xFF;
  set(A, result);
  setFRotA(result, carry);
}

/** RLA */
export function RLA() {
  const a = get(A);
  const oldCarry = ff.c;
  const carry = (a >> 7) & 0x01;
  const result = ((a << 1) | oldCarry) & 0xFF;
  set(A, result);
  setFRotA(result, carry);
}

/** RRA */
export function RRA() {
  const a = get(A);
  const oldCarry = ff.c;
  const carry = a & 0x01;
  const result = ((a >> 1) | (oldCarry << 7)) & 0xFF;
  set(A, result);
  setFRotA(result, carry);
}

function setFRotA(result: number, carry: number) {
  ff.f5 = result & 0x20;
  ff.f3 = result & 0x08;
  ff.h = 0;
  ff.n = 0;
  ff.c = carry;
}

/** RLD */
export function RLD() {
  const a = get(A);
  const addr = get16(HL);
  const mem = get(addr);
  const resultA = (a & 0xF0) | (mem >> 4);
  const resultMem = ((mem << 4) | (a & 0x0F)) & 0xFF;
  set(A, resultA);
  set(addr, resultMem);
  setFSZ53P(resultA);
  ff.h = 0;
  ff.n = 0;
}

/** RRD */
export function RRD() {
  const a = get(A);
  const addr = get16(HL);
  const mem = get(addr);
  const resultA = (a & 0xF0) | (mem & 0x0F);
  const resultMem = ((a << 4) | (mem >> 4)) & 0xFF;
  set(A, resultA);
  set(addr, resultMem);
  setFSZ53P(resultA);
  ff.h = 0;
  ff.n = 0;
}

function setFShift(result: number, carry: number) {
  setFSZ53P(result);
  ff.h = 0;
  ff.n = 0;
  ff.c = carry;
}

/** RLC r | RLC (HL) | RLC (IX+d) | RLC (IY+d) */
export function RLC_val(value: number): number {
  const carry = (value >> 7) & 0x01;
  const result = ((value << 1) | carry) & 0xFF;
  setFShift(result, carry);
  return result;
}

/** RRC r | RRC (HL) | RRC (IX+d) | RRC (IY+d) */
export function RRC_val(value: number): number {
  const carry = value & 0x01;
  const result = ((value >> 1) | (carry << 7)) & 0xFF;
  setFShift(result, carry);
  return result;
}

/** RL r | RL (HL) | RL (IX+d) | RL (IY+d) */
export function RL_val(value: number): number {
  const oldCarry = ff.c;
  const carry = (value >> 7) & 0x01;
  const result = ((value << 1) | oldCarry) & 0xFF;
  setFShift(result, carry);
  return result;
}

/** RR r | RR (HL) | RR (IX+d) | RR (IY+d) */
export function RR_val(value: number): number {
  const oldCarry = ff.c;
  const carry = value & 0x01;
  const result = ((value >> 1) | (oldCarry << 7)) & 0xFF;
  setFShift(result, carry);
  return result;
}

/** SLA r | SLA (HL) | SLA (IX+d) | SLA (IY+d) */
export function SLA_val(value: number): number {
  const carry = (value >> 7) & 0x01;
  const result = (value << 1) & 0xFF;
  setFShift(result, carry);
  return result;
}

/** SRA r | SRA (HL) | SRA (IX+d) | SRA (IY+d) */
export function SRA_val(value: number): number {
  const carry = value & 0x01;
  const result = ((value >> 1) | (value & 0x80)) & 0xFF;
  setFShift(result, carry);
  return result;
}

/** SLL r | SLL (HL) | SLL (IX+d) | SLL (IY+d) */
export function SLL_val(value: number): number {
  const carry = (value >> 7) & 0x01;
  const result = ((value << 1) | 0x01) & 0xFF;
  setFShift(result, carry);
  return result;
}

/** SRL r | SRL (HL) | SRL (IX+d) | SRL (IY+d) */
export function SRL_val(value: number): number {
  const carry = value & 0x01;
  const result = (value >> 1) & 0xFF;
  setFShift(result, carry);
  return result;
}
