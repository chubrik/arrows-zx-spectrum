import { get8, getMem16, set8, setMem16 } from '../../common/utils';
import { getHL, getSP, posA, posAa, posB, posBa, posC, posCa, posD, posDa, posE, posEa, posF, posFa, posH, posHa, posL, posLa, setHL } from '../utils';

/** EX AF,AF' */
export function EX_AF_AF() {
  const a1 = get8(posA);
  const f1 = get8(posF);
  const a2 = get8(posAa);
  const f2 = get8(posFa);
  set8(posA, a2);
  set8(posF, f2);
  set8(posAa, a1);
  set8(posFa, f1);
}

/** EXX */
export function EXX() {
  const b1 = get8(posB);
  const c1 = get8(posC);
  const d1 = get8(posD);
  const e1 = get8(posE);
  const h1 = get8(posH);
  const l1 = get8(posL);
  const b2 = get8(posBa);
  const c2 = get8(posCa);
  const d2 = get8(posDa);
  const e2 = get8(posEa);
  const h2 = get8(posHa);
  const l2 = get8(posLa);
  set8(posB, b2);
  set8(posC, c2);
  set8(posD, d2);
  set8(posE, e2);
  set8(posH, h2);
  set8(posL, l2);
  set8(posBa, b1);
  set8(posCa, c1);
  set8(posDa, d1);
  set8(posEa, e1);
  set8(posHa, h1);
  set8(posLa, l1);
}

/** EX (SP),HL | EX (SP),IX | EX (SP),IY */
export function EX_sp_HL() {
  const addr = getSP();
  const hlValue = getHL();
  const memValue = getMem16(addr);
  setHL(memValue);
  setMem16(addr, hlValue);
}

/** EX DE,HL */
export function EX_DE_HL() {
  const d1 = get8(posD);
  const e1 = get8(posE);
  const h1 = get8(posH);
  const l1 = get8(posL);
  set8(posD, h1);
  set8(posE, l1);
  set8(posH, d1);
  set8(posL, e1);
}
