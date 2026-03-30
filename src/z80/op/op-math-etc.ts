import { get, set } from '../../common/utils';
import { BIT7, F3, F5, FC, ff, FH, FN, FO, setFSZ53, setFSZ53P } from '../flags';
import { A } from '../registers';

/** DAA */
export function DAA() {
  let a = get(A);
  const origA = a;
  const wasN = ff.n;
  let correction = 0;
  if (ff.h || (a & 0x0F) > 9) correction |= 0x06;
  if (ff.c || a > 0x99) { correction |= 0x60; ff.c = FC; }
  a = (wasN ? a - correction : a + correction) & 0xFF;
  setFSZ53P(a);
  ff.h = (origA ^ correction ^ a) & FH;
  set(A, a);
}

/** CPL */
export function CPL() {
  const a = get(A) ^ 0xFF;
  set(A, a);
  ff.f5 = a & F5;
  ff.f3 = a & F3;
  ff.h = FH;
  ff.n = FN;
}

/** CCF */
export function CCF() {
  const a = get(A);
  const oldC = ff.c;
  ff.f5 = (a & F5) | ff.f5;
  ff.f3 = (a & F3) | ff.f3;
  ff.h = oldC ? FH : 0;
  ff.n = 0;
  ff.c = oldC ? 0 : FC;
}

/** SCF */
export function SCF() {
  const a = get(A);
  ff.f5 = (a & F5) | ff.f5;
  ff.f3 = (a & F3) | ff.f3;
  ff.h = 0;
  ff.n = 0;
  ff.c = FC;
}

/** NEG */
export function NEG() {
  const a = get(A);
  const result = -a & 0xFF;
  set(A, result);

  setFSZ53(result);
  ff.h = (a ^ result) & FH;
  ff.o = a === BIT7 ? FO : 0;
  ff.n = FN;
  ff.c = a ? FC : 0;
}
