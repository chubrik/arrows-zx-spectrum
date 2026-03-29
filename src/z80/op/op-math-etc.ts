import { get, set } from '../../common/utils';
import { F53, FC, FH, FHN, FN, FNC, FO, FSZO, FSZOC, flagsSZ53, flagsSZ53P } from '../flags';
import { A, F } from '../registers';

/** DAA */
export function DAA() {
  let a = get(A);
  let f = get(F);
  const origA = a;
  let correction = 0;
  if ((f & FH) || (a & 0x0F) > 9) correction |= 0x06;
  if ((f & FC) || a > 0x99) { correction |= 0x60; f |= FC; }
  a = (f & FN ? a - correction : a + correction) & 0xFF;
  f = (f & FNC) | flagsSZ53P(a) | ((origA ^ correction ^ a) & FH);
  set(A, a);
  set(F, f);
}

/** CPL */
export function CPL() {
  const a = get(A) ^ 0xFF;
  const f = get(F);
  set(A, a);
  set(F, (f & FSZOC) | (a & F53) | FHN);
}

/** CCF */
export function CCF() {
  const a = get(A);
  const f = get(F);
  set(F, (f & FSZO) | ((a | f) & F53) | ((f & FC) << 4) | (~f & FC));
}

/** SCF */
export function SCF() {
  const a = get(A);
  const f = get(F);
  set(F, (f & FSZO) | ((a | f) & F53) | FC);
}

/** NEG */
export function NEG() {
  const a = get(A);
  const result = -a & 0xFF;
  set(A, result);

  set(F,
    flagsSZ53(result)
    | (a === 0x80 ? FO : 0)
    | ((0 ^ a ^ result) & FH)
    | (a ? FC : 0)
    | FN
  );
}
