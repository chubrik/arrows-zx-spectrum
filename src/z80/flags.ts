export const FH = 0x10; // Half-carry

/** P: 0x04 if parity is even */
export function flagP(value: number): number {
  value ^= value >> 4;
  value ^= value << 2;
  value ^= value >> 1;
  return ~value & 0x04;
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
  ff.s  = byte & 0x80;
  ff.z  = byte & 0x40;
  ff.f5 = byte & 0x20;
  ff.h  = byte & 0x10;
  ff.f3 = byte & 0x08;
  ff.o  = byte & 0x04;
  ff.n  = byte & 0x02;
  ff.c  = byte & 0x01;
}

export function packSF(): number {
  return sf.im2 | sf.im1 | sf.iff2 | sf.iff1 | sf.hlt | sf.int;
}

export function unpackSF(byte: number) {
  sf.im2  = byte & 0x20;
  sf.im1  = byte & 0x10;
  sf.iff2 = byte & 0x08;
  sf.iff1 = byte & 0x04;
  sf.hlt  = byte & 0x02;
  sf.int  = byte & 0x01;
}

/** Set S, Z, 5, 3 flags from 8-bit result */
export function setFSZ53(value: number) {
  ff.s  = value & 0x80;
  ff.z  = value ? 0 : 0x40;
  ff.f5 = value & 0x20;
  ff.f3 = value & 0x08;
}

/** Set S, Z, 5, 3, P flags from 8-bit result */
export function setFSZ53P(value: number) {
  setFSZ53(value);
  ff.o = flagP(value);
}
