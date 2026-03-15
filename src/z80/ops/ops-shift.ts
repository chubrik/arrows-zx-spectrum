import { getRegA, setRegA } from '../utils';

/** RLCA */
export function RLCA() {
  const value = getRegA();
  const result = RLC_Rhl(value);
  setRegA(result);
}

/** RRCA */
export function RRCA() {
  const value = getRegA();
  const result = RRC_Rhl(value);
  setRegA(result);
}

/** RLA */
export function RLA() {
  const value = getRegA();
  const result = RL_Rhl(value);
  setRegA(result);
}

/** RRA */
export function RRA() {
  const value = getRegA();
  const result = RR_Rhl(value);
  setRegA(result);
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
export function RLC_Rhl(value: number): number {
  return 0; /* TODO */
}

/** RRC r | RRC (HL) | RRC (IX+d) | RRC (IY+d) */
export function RRC_Rhl(value: number): number {
  return 0; /* TODO */
}

/** RL r | RL (HL) | RL (IX+d) | RL (IY+d) */
export function RL_Rhl(value: number): number {
  return 0; /* TODO */
}

/** RR r | RR (HL) | RR (IX+d) | RR (IY+d) */
export function RR_Rhl(value: number): number {
  return 0; /* TODO */
}

/** SLA r | SLA (HL) | SLA (IX+d) | SLA (IY+d) */
export function SLA_Rhl(value: number): number {
  return 0; /* TODO */
}

/** SRA r | SRA (HL) | SRA (IX+d) | SRA (IY+d) */
export function SRA_Rhl(value: number): number {
  return 0; /* TODO */
}

/** SLL r | SLL (HL) | SLL (IX+d) | SLL (IY+d) */
export function SLL_Rhl(value: number): number {
  return 0; /* TODO */
}

/** SRL r | SRL (HL) | SRL (IX+d) | SRL (IY+d) */
export function SRL_Rhl(value: number): number {
  return 0; /* TODO */
}
