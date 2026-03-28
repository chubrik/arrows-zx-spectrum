import { get, get16, set } from '../../common/utils';
import { A, Aa, B, Ba, C, Ca, D, Da, E, Ea, F, Fa, H, Ha, HXY, L, La, LXY, SP } from '../positions';

/** EX AF,AF' */
export function EX_AF_AF() {
  const a1 = get(A);
  const f1 = get(F);
  const a2 = get(Aa);
  const f2 = get(Fa);
  set(A, a2);
  set(F, f2);
  set(Aa, a1);
  set(Fa, f1);
}

/** EXX */
export function EXX() {
  const b1 = get(B);
  const c1 = get(C);
  const d1 = get(D);
  const e1 = get(E);
  const h1 = get(H);
  const l1 = get(L);
  const b2 = get(Ba);
  const c2 = get(Ca);
  const d2 = get(Da);
  const e2 = get(Ea);
  const h2 = get(Ha);
  const l2 = get(La);
  set(B, b2);
  set(C, c2);
  set(D, d2);
  set(E, e2);
  set(H, h2);
  set(L, l2);
  set(Ba, b1);
  set(Ca, c1);
  set(Da, d1);
  set(Ea, e1);
  set(Ha, h1);
  set(La, l1);
}

/** EX (SP),HL | EX (SP),IX | EX (SP),IY */
export function EX_sp_HL() {
  const sp = get16(SP);
  const stackLow = get(sp);
  const stackHigh = get(sp + 1);
  const lxy = get(LXY);
  const hxy = get(HXY);
  set(sp, lxy);
  set(sp + 1, hxy);
  set(LXY, stackLow);
  set(HXY, stackHigh);
}

/** EX DE,HL */
export function EX_DE_HL() {
  const d1 = get(D);
  const e1 = get(E);
  const h1 = get(H);
  const l1 = get(L);
  set(D, h1);
  set(E, l1);
  set(H, d1);
  set(L, e1);
}
