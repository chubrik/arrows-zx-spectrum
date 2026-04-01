import { BIT0, BIT1, BIT2, BIT3, BIT4, BIT5, BIT6, BIT7 } from '../common/constants.ts';

export const FS = BIT7; // Sign
export const FZ = BIT6; // Zero
export const F5 = BIT5; // (undocumented)
export const FH = BIT4; // Half-carry
export const F3 = BIT3; // (undocumented)
export const FP = BIT2; // Parity/Overflow
export const FN = BIT1; // Subtract
export const FC = BIT0; // Carry

export const IM2 = BIT5;
export const IM1 = BIT4;
export const IFF2 = BIT3;
export const IFF1 = BIT2;
export const HLT = BIT1;
export const INT = BIT0;

export let fs = 0, fz = 0, f5 = 0, fh = 0, f3 = 0, fp = 0, fn = 0, fc = 0;
export let im2 = 0, im1 = 0, iff2 = 0, iff1 = 0, hlt = 0, int = 0;

export function setFS(value: number) { fs = value; }
export function setFZ(value: number) { fz = value; }
export function setF5(value: number) { f5 = value; }
export function setFH(value: number) { fh = value; }
export function setF3(value: number) { f3 = value; }
export function setFP(value: number) { fp = value; }
export function setFN(value: number) { fn = value; }
export function setFC(value: number) { fc = value; }

export function setIM2(value: number) { im2 = value; }
export function setIM1(value: number) { im1 = value; }
export function setIFF2(value: number) { iff2 = value; }
export function setIFF1(value: number) { iff1 = value; }
export function setHLT(value: number) { hlt = value; }
export function setINT(value: number) { int = value; }

export function packF(): number {
  return fs | fz | f5 | fh | f3 | fp | fn | fc;
}

export function unpackF(byte: number) {
  fs = byte & FS;
  fz = byte & FZ;
  f5 = byte & F5;
  fh = byte & FH;
  f3 = byte & F3;
  fp = byte & FP;
  fn = byte & FN;
  fc = byte & FC;
}

export function packSYS(): number {
  return im2 | im1 | iff2 | iff1 | hlt | int;
}

export function unpackSYS(byte: number) {
  im2 = byte & IM2;
  im1 = byte & IM1;
  iff2 = byte & IFF2;
  iff1 = byte & IFF1;
  hlt = byte & HLT;
  int = byte & INT;
}

/** Set S, Z, 5, 3 flags from 8-bit result */
export function calcFSZ53(value: number) {
  fs = value & FS;
  fz = value ? 0 : FZ;
  f5 = value & F5;
  f3 = value & F3;
}

/** Set P flag from 8-bit result */
export function calcFP(value: number) {
  value ^= value >> 4;
  value ^= value << 2;
  value ^= value >> 1;
  fp = ~value & FP;
}
