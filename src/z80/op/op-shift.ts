import { getA, setA } from '../utils';

/** RLCA */
export function RLCA() {
  const value = getA();
  const result = RLC_val(value);
  setA(result);
}

/** RRCA */
export function RRCA() {
  const value = getA();
  const result = RRC_val(value);
  setA(result);
}

/** RLA */
export function RLA() {
  const value = getA();
  const result = RL_val(value);
  setA(result);
}

/** RRA */
export function RRA() {
  const value = getA();
  const result = RR_val(value);
  setA(result);
}

/** RLD */
export function RLD() {
  /* TODO */
}

/** RRD */
export function RRD() {
  /* TODO */
}

/** RLC r | RLC (HL) | RLC (IX+d) | RLC (IY+d) */
export function RLC_val(value: number): number {
  return 0; /* TODO */
}

/** RRC r | RRC (HL) | RRC (IX+d) | RRC (IY+d) */
export function RRC_val(value: number): number {
  return 0; /* TODO */
}

/** RL r | RL (HL) | RL (IX+d) | RL (IY+d) */
export function RL_val(value: number): number {
  return 0; /* TODO */
}

/** RR r | RR (HL) | RR (IX+d) | RR (IY+d) */
export function RR_val(value: number): number {
  return 0; /* TODO */
}

/** SLA r | SLA (HL) | SLA (IX+d) | SLA (IY+d) */
export function SLA_val(value: number): number {
  return 0; /* TODO */
}

/** SRA r | SRA (HL) | SRA (IX+d) | SRA (IY+d) */
export function SRA_val(value: number): number {
  return 0; /* TODO */
}

/** SLL r | SLL (HL) | SLL (IX+d) | SLL (IY+d) */
export function SLL_val(value: number): number {
  return 0; /* TODO */
}

/** SRL r | SRL (HL) | SRL (IX+d) | SRL (IY+d) */
export function SRL_val(value: number): number {
  return 0; /* TODO */
}
