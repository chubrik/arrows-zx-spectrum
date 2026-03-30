import { get, get16, set, setReg } from '../../common/utils';
import { packF, unpackF } from '../flags';
import { A, Aa, B, Ba, C, Ca, D, Da, E, Ea, Fa, H, Ha, HXY, L, La, LXY, SP } from '../registers';

/** EX AF,AF' */
export function EX_AF_AF() {
  const a1 = get(A);
  const f1 = packF();
  const a2 = get(Aa);
  const f2 = get(Fa);
  setReg(A, a2);
  unpackF(f2);
  setReg(Aa, a1);
  setReg(Fa, f1);
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
  setReg(B, b2);
  setReg(C, c2);
  setReg(D, d2);
  setReg(E, e2);
  setReg(H, h2);
  setReg(L, l2);
  setReg(Ba, b1);
  setReg(Ca, c1);
  setReg(Da, d1);
  setReg(Ea, e1);
  setReg(Ha, h1);
  setReg(La, l1);
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
  setReg(LXY, stackLow);
  setReg(HXY, stackHigh);
}

/** EX DE,HL */
export function EX_DE_HL() {
  const d1 = get(D);
  const e1 = get(E);
  const h1 = get(H);
  const l1 = get(L);
  setReg(D, h1);
  setReg(E, l1);
  setReg(H, d1);
  setReg(L, e1);
}
