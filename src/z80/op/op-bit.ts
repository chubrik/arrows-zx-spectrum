import { BIT7, xFF } from '../../hw/constants';
import { mem, write } from '../../hw/memory';
import { calcFP, calcFSZ53, F53, FC, fc, FH, FP, FS, FZ, setF53, setFC, setFH, setFN, setFP, setFS, setFZ } from '../flags';
import { a, hlxy, setA } from '../registers';

/** BIT b,r | BIT b,(HL) | BIT b,(IX+d) | BIT b,(IY+d) */
export function BIT_b_r(isSet: number, f53Src: number) {
  /*!inline*/
  setFS(isSet & FS);
  setFZ(isSet ? 0 : FZ);
  setF53(f53Src & F53);
  setFH(FH);
  setFP(isSet ? 0 : FP);
  setFN(0);
}

/** RLCA */
export function RLCA() {
  const newFc = (a >> 7) & FC;
  const result = ((a << 1) | newFc) & xFF;
  setA(result);
  setFRotA(result, newFc);
}

/** RLC r | RLC (HL) | RLC (IX+d) | RLC (IY+d) */
export function RLC_val(value: number): number {
  const newFc = (value >> 7) & FC;
  const result = ((value << 1) | newFc) & xFF;
  setFShift(result, newFc);
  return result;
}

/** RRCA */
export function RRCA() {
  const newFc = a & FC;
  const result = ((a >> 1) | (newFc << 7)) & xFF;
  setA(result);
  setFRotA(result, newFc);
}

/** RRC r | RRC (HL) | RRC (IX+d) | RRC (IY+d) */
export function RRC_val(value: number): number {
  const newFc = value & FC;
  const result = ((value >> 1) | (newFc << 7)) & xFF;
  setFShift(result, newFc);
  return result;
}

/** RLA */
export function RLA() {
  const newFc = (a >> 7) & FC;
  const result = ((a << 1) | fc) & xFF;
  setA(result);
  setFRotA(result, newFc);
}

/** RL r | RL (HL) | RL (IX+d) | RL (IY+d) */
export function RL_val(value: number): number {
  const newFc = (value >> 7) & FC;
  const result = ((value << 1) | fc) & xFF;
  setFShift(result, newFc);
  return result;
}

/** RRA */
export function RRA() {
  const newFc = a & FC;
  const result = ((a >> 1) | (fc << 7)) & xFF;
  setA(result);
  setFRotA(result, newFc);
}

/** RR r | RR (HL) | RR (IX+d) | RR (IY+d) */
export function RR_val(value: number): number {
  const newFc = value & FC;
  const result = ((value >> 1) | (fc << 7)) & xFF;
  setFShift(result, newFc);
  return result;
}

/** RLD */
export function RLD() {
  const value = mem[hlxy];
  const resultA = (a & 0xF0) | (value >> 4);
  const resultMem = ((value << 4) | (a & 0x0F)) & xFF;
  setA(resultA);
  write(hlxy, resultMem);

  calcFSZ53(resultA);
  calcFP(resultA);
  setFH(0);
  setFN(0);
}

/** RRD */
export function RRD() {
  const value = mem[hlxy];
  const resultA = (a & 0xF0) | (value & 0x0F);
  const resultMem = ((a << 4) | (value >> 4)) & xFF;
  setA(resultA);
  write(hlxy, resultMem);

  calcFSZ53(resultA);
  calcFP(resultA);
  setFH(0);
  setFN(0);
}

/** SLA r | SLA (HL) | SLA (IX+d) | SLA (IY+d) */
export function SLA_val(value: number): number {
  const newFc = (value >> 7) & FC;
  const result = (value << 1) & xFF;
  setFShift(result, newFc);
  return result;
}

/** SRA r | SRA (HL) | SRA (IX+d) | SRA (IY+d) */
export function SRA_val(value: number): number {
  const newFc = value & FC;
  const result = ((value & BIT7) | (value >> 1)) & xFF;
  setFShift(result, newFc);
  return result;
}

/** SLL r | SLL (HL) | SLL (IX+d) | SLL (IY+d) */
export function SLL_val(value: number): number {
  const newFc = (value >> 7) & FC;
  const result = ((value << 1) | 0x01) & xFF;
  setFShift(result, newFc);
  return result;
}

/** SRL r | SRL (HL) | SRL (IX+d) | SRL (IY+d) */
export function SRL_val(value: number): number {
  const newFc = value & FC;
  const result = (value >> 1) & xFF;
  setFShift(result, newFc);
  return result;
}

function setFRotA(result: number, newFc: number) {
  /*!inline*/
  setF53(result & F53);
  setFH(0);
  setFN(0);
  setFC(newFc);
}

function setFShift(result: number, newFc: number) {
  /*!inline*/
  calcFSZ53(result);
  calcFP(result);
  setFH(0);
  setFN(0);
  setFC(newFc);
}
