import { get, set } from '../../common/utils';
import { ff, setFSZ53, setFSZ53P } from '../flags';
import { A } from '../registers';

/** DAA */
export function DAA() {
  let a = get(A);
  const origA = a;
  const wasN = ff.n;
  let correction = 0;
  if (ff.h || (a & 0x0F) > 9) correction |= 0x06;
  if (ff.c || a > 0x99) { correction |= 0x60; ff.c = 0x01; }
  a = (wasN ? a - correction : a + correction) & 0xFF;
  setFSZ53P(a);
  ff.h = (origA ^ correction ^ a) & 0x10;
  set(A, a);
}

/** CPL */
export function CPL() {
  const a = get(A) ^ 0xFF;
  set(A, a);
  ff.f5 = a & 0x20;
  ff.f3 = a & 0x08;
  ff.h = 0x10;
  ff.n = 0x02;
}

/** CCF */
export function CCF() {
  const a = get(A);
  const oldC = ff.c;
  ff.f5 = (a & 0x20) | ff.f5;
  ff.f3 = (a & 0x08) | ff.f3;
  ff.h = oldC ? 0x10 : 0;
  ff.n = 0;
  ff.c = oldC ? 0 : 0x01;
}

/** SCF */
export function SCF() {
  const a = get(A);
  ff.f5 = (a & 0x20) | ff.f5;
  ff.f3 = (a & 0x08) | ff.f3;
  ff.h = 0;
  ff.n = 0;
  ff.c = 0x01;
}

/** NEG */
export function NEG() {
  const a = get(A);
  const result = -a & 0xFF;
  set(A, result);

  setFSZ53(result);
  ff.h = (a ^ result) & 0x10;
  ff.o = a === 0x80 ? 0x04 : 0;
  ff.n = 0x02;
  ff.c = a ? 0x01 : 0;
}
