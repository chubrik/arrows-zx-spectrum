import { f53, fC, fH, flagsSZ53, fN, fPV, fSZPV, getA, getF, flagP, setA, setF } from '../utils';

/** DAA */
export function DAA() {
  let a = getA();
  let f = getF();
  const origA = a;
  let correction = 0;
  if ((f & fH) || (a & 0x0F) > 9) correction |= 0x06;
  if ((f & fC) || a > 0x99) { correction |= 0x60; f |= fC; }
  a = (f & fN ? a - correction : a + correction) & 0xFF;
  f = (f & (fN | fC)) | flagsSZ53(a) | flagP(a) | ((origA ^ correction ^ a) & fH);
  setA(a);
  setF(f);
}

/** CPL */
export function CPL() {
  const a = getA() ^ 0xFF;
  const f = getF();
  setA(a);
  setF((f & (fSZPV | fC)) | (a & f53) | fH | fN);
}

/** CCF */
export function CCF() {
  const a = getA();
  const f = getF();
  setF((f & fSZPV) | (a & f53) | ((f & fC) << 4) | (~f & fC));
}

/** SCF */
export function SCF() {
  const a = getA();
  const f = getF();
  setF((f & fSZPV) | (a & f53) | fC);
}

/** NEG */
export function NEG() {
  const a = getA();
  const result = -a & 0xFF;
  setA(result);

  setF(
    flagsSZ53(result)
    | (a === 0x80 ? fPV : 0)
    | ((0 ^ a ^ result) & fH)
    | (a ? fC : 0)
    | fN
  );
}
