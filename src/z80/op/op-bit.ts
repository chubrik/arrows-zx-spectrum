import { F3, F5, FH, FO, FS, FZ, ff } from '../flags';

/** BIT b,r | BIT b,(HL) | BIT b,(IX+d) | BIT b,(IY+d) */
export function BIT_b_val(bit: number, value: number, f53Source: number) {
  const isSet = value & bit;

  ff.s = isSet & FS;
  ff.z = isSet ? 0 : FZ;
  ff.f5 = f53Source & F5;
  ff.h = FH;
  ff.f3 = f53Source & F3;
  ff.o = isSet ? 0 : FO;
  ff.n = 0;
}
