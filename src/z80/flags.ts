import { BIT0, BIT1, BIT2, BIT3, BIT4, BIT5, BIT6, BIT7 } from '../hw/constants.ts';

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

/*! @__INLINE__ */ export function setFS(value: number) { fs = value; }
/*! @__INLINE__ */ export function setFZ(value: number) { fz = value; }
/*! @__INLINE__ */ export function setF5(value: number) { f5 = value; }
/*! @__INLINE__ */ export function setFH(value: number) { fh = value; }
/*! @__INLINE__ */ export function setF3(value: number) { f3 = value; }
/*! @__INLINE__ */ export function setFP(value: number) { fp = value; }
/*! @__INLINE__ */ export function setFN(value: number) { fn = value; }
/*! @__INLINE__ */ export function setFC(value: number) { fc = value; }

/*! @__INLINE__ */ export function setIM2(value: number) { im2 = value; }
/*! @__INLINE__ */ export function setIM1(value: number) { im1 = value; }
/*! @__INLINE__ */ export function setIFF2(value: number) { iff2 = value; }
/*! @__INLINE__ */ export function setIFF1(value: number) { iff1 = value; }
/*! @__INLINE__ */ export function setHLT(value: number) { hlt = value; }
/*! @__INLINE__ */ export function setINT(value: number) { int = value; }

export function getF(): number {
  return fs | fz | f5 | fh | f3 | fp | fn | fc;
}

export function setF(value: number) {
  fs = value & FS;
  fz = value & FZ;
  f5 = value & F5;
  fh = value & FH;
  f3 = value & F3;
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
