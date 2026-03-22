import { bitFC, bitFH, bitFN, bitFPV, flagsSZ53, flagsSZ53P, maskF53, maskFSZPV } from '../flags';
import { getA, getF, setA, setF } from '../utils';

/** DAA */
export function DAA() {
  let a = getA();
  let f = getF();
  const origA = a;
  let correction = 0;
  if ((f & bitFH) || (a & 0x0F) > 9) correction |= 0x06;
  if ((f & bitFC) || a > 0x99) { correction |= 0x60; f |= bitFC; }
  a = (f & bitFN ? a - correction : a + correction) & 0xFF;
  f = (f & (bitFN | bitFC)) | flagsSZ53P(a) | ((origA ^ correction ^ a) & bitFH);
  setA(a);
  setF(f);
}

/** CPL */
export function CPL() {
  const a = getA() ^ 0xFF;
  const f = getF();
  setA(a);
  setF((f & (maskFSZPV | bitFC)) | (a & maskF53) | bitFH | bitFN);
}

/** CCF */
export function CCF() {
  const a = getA();
  const f = getF();
  setF((f & maskFSZPV) | ((a | f) & maskF53) | ((f & bitFC) << 4) | (~f & bitFC));
}

/** SCF */
export function SCF() {
  const a = getA();
  const f = getF();
  setF((f & maskFSZPV) | ((a | f) & maskF53) | bitFC);
}

/** NEG */
export function NEG() {
  const a = getA();
  const result = -a & 0xFF;
  setA(result);

  setF(
    flagsSZ53(result)
    | (a === 0x80 ? bitFPV : 0)
    | ((0 ^ a ^ result) & bitFH)
    | (a ? bitFC : 0)
    | bitFN
  );
}
