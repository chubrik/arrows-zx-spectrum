import { BIT0, BIT1, BIT2, BIT3, BIT4, BIT5, BIT6, BIT7 } from '../hw/constants.ts';

export const FS = BIT7; // Sign
export const FZ = BIT6; // Zero
export const F5 = BIT5; // (undocumented)
export const FH = BIT4; // Half-carry
export const F3 = BIT3; // (undocumented)
export const FP = BIT2; // Parity/Overflow
export const FN = BIT1; // Subtract
export const FC = BIT0; // Carry
export const F53 = F5 | F3;

export const IM2 = BIT5;
export const IM1 = BIT4;
export const IFF2 = BIT3;
export const IFF1 = BIT2;
export const HLT = BIT1;
export const INT = BIT0;

export let fs = 0, fz = 0, f53 = 0, fh = 0, fp = 0, fn = 0, fc = 0;
export let im2 = 0, im1 = 0, iff2 = 0, iff1 = 0, hlt = 0, int = 0;

export function setFS(value: number) { /*!inline*/ fs = value; }
export function setFZ(value: number) { /*!inline*/ fz = value; }
export function setF53(value: number) { /*!inline*/ f53 = value; }
export function setFH(value: number) { /*!inline*/ fh = value; }
export function setFP(value: number) { /*!inline*/ fp = value; }
export function setFN(value: number) { /*!inline*/ fn = value; }
export function setFC(value: number) { /*!inline*/ fc = value; }

export function setIM2(value: number) { /*!inline*/ im2 = value; }
export function setIM1(value: number) { /*!inline*/ im1 = value; }
export function setIFF2(value: number) { /*!inline*/ iff2 = value; }
export function setIFF1(value: number) { /*!inline*/ iff1 = value; }
export function setHLT(value: number) { /*!inline*/ hlt = value; }
export function setINT(value: number) { /*!inline*/ int = value; }

export function getF(): number {
  return fs | fz | f53 | fh | fp | fn | fc;
}

export function setF(value: number) {
  fs = value & FS;
  fz = value & FZ;
  f53 = value & F53;
  fh = value & FH;
  fp = value & FP;
  fn = value & FN;
  fc = value & FC;
}

export function getSYS(): number {
  return im2 | im1 | iff2 | iff1 | hlt | int;
}

export function setSYS(value: number) {
  im2 = value & IM2;
  im1 = value & IM1;
  iff2 = value & IFF2;
  iff1 = value & IFF1;
  hlt = value & HLT;
  int = value & INT;
}

/** Set S, Z, 5, 3 flags from 8-bit result */
export function calcFSZ53(value: number) {
  /*!inline*/
  fs = value & FS;
  fz = value ? 0 : FZ;
  f53 = value & F53;
}

/** Set P flag from 8-bit result */
export function calcFP(value: number) {
  /*!inline*/
  let v = value;
  v ^= v >> 4;
  v ^= v << 2;
  v ^= v >> 1;
  fp = ~v & FP;
}
