/** BIT b,r | BIT b,(HL) | BIT b,(IX+d) | BIT b,(IY+d) */
export function BIT_b_Rhl(value: number, bit: number) {
  const isSet = value & bit;
  /* TODO */
}

/** RES b,r | RES b,(HL) | RES b,(IX+d) | RES b,(IY+d) */
export function RES_b_Rhl(value: number, bit: number): number {
  return value & ~bit;
}

/** SET b,r | SET b,(HL) | SET b,(IX+d) | SET b,(IY+d) */
export function SET_b_Rhl(value: number, bit: number): number {
  return value | bit;
}
