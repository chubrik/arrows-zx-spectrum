export const BIT7 = 0x80;
export const BIT6 = 0x40;
export const BIT5 = 0x20;
export const BIT4 = 0x10;
export const BIT3 = 0x08;
export const BIT2 = 0x04;
export const BIT1 = 0x02;
export const BIT0 = 0x01;

export const FS = BIT7; // Sign
export const FZ = BIT6; // Zero
export const F5 = BIT5; // Bit 5 (undocumented)
export const FH = BIT4; // Half-carry
export const F3 = BIT3; // Bit 3 (undocumented)
export const FO = BIT2; // Parity/Overflow
export const FN = BIT1; // Subtract
export const FC = BIT0; // Carry

export const IM2 = BIT5;
export const IM1 = BIT4;
export const IFF2 = BIT3;
export const IFF1 = BIT2;
export const HLT = BIT1;
export const INT = BIT0;

/** P: 0x04 if parity is even */
export function flagP(value: number): number {
  value ^= value >> 4;
  value ^= value << 2;
  value ^= value >> 1;
  return ~value & FO;
}

// --- Unpacked flag objects ---

export const ff = {
  s: 0, z: 0, f5: 0, h: 0, f3: 0, o: 0, n: 0, c: 0,
};

export const sf = {
  im2: 0, im1: 0, iff2: 0, iff1: 0, hlt: 0, int: 0,
};

export function packF(): number {
  return ff.s | ff.z | ff.f5 | ff.h | ff.f3 | ff.o | ff.n | ff.c;
}

export function unpackF(byte: number) {
  ff.s = byte & FS;
  ff.z = byte & FZ;
  ff.f5 = byte & F5;
  ff.h = byte & FH;
  ff.f3 = byte & F3;
  ff.o = byte & FO;
  ff.n = byte & FN;
  ff.c = byte & FC;
}

export function packSF(): number {
  return sf.im2 | sf.im1 | sf.iff2 | sf.iff1 | sf.hlt | sf.int;
}

export function unpackSF(byte: number) {
  sf.im2 = byte & IM2;
  sf.im1 = byte & IM1;
  sf.iff2 = byte & IFF2;
  sf.iff1 = byte & IFF1;
  sf.hlt = byte & HLT;
  sf.int = byte & INT;
}

/** Set S, Z, 5, 3 flags from 8-bit result */
export function setFSZ53(value: number) {
  ff.s = value & FS;
  ff.z = value ? 0 : FZ;
  ff.f5 = value & F5;
  ff.f3 = value & F3;
}

/** Set S, Z, 5, 3, P flags from 8-bit result */
export function setFSZ53P(value: number) {
  setFSZ53(value);
  ff.o = flagP(value);
}
