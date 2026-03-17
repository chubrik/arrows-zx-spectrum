/** BIT b,r | BIT b,(HL) | BIT b,(IX+d) | BIT b,(IY+d) */
export function BIT_b_val(bit: number, value: number) {
  const isSet = value & bit;
  /* TODO flags */
}

/** RES b,r | RES b,(HL) | RES b,(IX+d) | RES b,(IY+d) */
export function RES_b_val(bit: number, value: number): number {
  return value & ~bit;
  /* TODO flags */
}

/** SET b,r | SET b,(HL) | SET b,(IX+d) | SET b,(IY+d) */
export function SET_b_val(bit: number, value: number): number {
  return value | bit;
  /* TODO flags */
}
