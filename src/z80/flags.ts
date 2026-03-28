export const FS = 0x80; // Sign
export const FZ = 0x40; // Zero
const F5 = 0x20;        // Bit 5 (undocumented)
export const FH = 0x10; // Half-carry
const F3 = 0x08;        // Bit 3 (undocumented)
export const FO = 0x04; // Parity/Overflow
export const FN = 0x02; // Subtract
export const FC = 0x01; // Carry

export const FSZC = FS | FZ | FC;
export const FSZO = FS | FZ | FO;
export const FSZOC = FS | FZ | FO | FC;
export const FZO = FZ | FO;
export const F53 = F5 | F3;
export const FS53 = FS | F53;
export const FHC = FH | FC;
export const FHN = FH | FN;
export const FNC = FN | FC;

/** S, Z, 5, 3, P from 8-bit result */
export function flagsSZ53P(value: number): number {
  return flagsSZ53(value) | flagP(value);
}

/** S, Z, 5, 3 from 8-bit result */
export function flagsSZ53(value: number): number {
  return (value & FS53) | (value ? 0 : FZ);
}

/** P: 0x04 if parity is even */
export function flagP(value: number): number {
  value ^= value >> 4;
  value ^= value << 2;
  value ^= value >> 1;
  return ~value & FO;
}

export const IM2 = 0x20;
export const IM1 = 0x10;
export const IFF2 = 0x08;
export const IFF1 = 0x04;
export const HLT = 0x02;
export const INT = 0x01;

export const IM12 = IM1 | IM2;
export const IFF12 = IFF1 | IFF2;
export const IFF1_INT = IFF1 | INT;
