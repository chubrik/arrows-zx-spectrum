import { ff } from '../flags';

/** BIT b,r | BIT b,(HL) | BIT b,(IX+d) | BIT b,(IY+d) */
export function BIT_b_val(bit: number, value: number, f53Source: number) {
  const isSet = value & bit;

  ff.s  = isSet & 0x80;
  ff.z  = isSet ? 0 : 0x40;
  ff.f5 = f53Source & 0x20;
  ff.h  = 0x10;
  ff.f3 = f53Source & 0x08;
  ff.o  = isSet ? 0 : 0x04;
  ff.n  = 0;
}
