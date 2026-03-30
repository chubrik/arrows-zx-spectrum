import { get, setReg } from '../../common/utils';
import { BIT7, F3, f3, F5, f5, FC, fc, FH, fh, fn, FN, FO, setF3, setF5, setFC, setFH, setFN, setFO, setFSZ53, setFSZ53P } from '../flags';
import { A } from '../registers';

/** DAA */
export function DAA() {
  let a = get(A);
  const origA = a;
  const wasN = fn;
  let correction = 0;
  if (fh || (a & 0x0F) > 9) correction |= 0x06;
  if (fc || a > 0x99) { correction |= 0x60; setFC(FC); }
  a = (wasN ? a - correction : a + correction) & 0xFF;
  setReg(A, a);

  setFSZ53P(a);
  setFH((origA ^ correction ^ a) & FH);
}

/** CPL */
export function CPL() {
  const a = get(A) ^ 0xFF;
  setReg(A, a);

  setF5(a & F5);
  setF3(a & F3);
  setFH(FH);
  setFN(FN);
}

/** CCF */
export function CCF() {
  const a = get(A);
  const oldC = fc;

  setF5((a & F5) | f5);
  setF3((a & F3) | f3);
  setFH(oldC ? FH : 0);
  setFN(0);
  setFC(oldC ? 0 : FC);
}

/** SCF */
export function SCF() {
  const a = get(A);
  
  setF5((a & F5) | f5);
  setF3((a & F3) | f3);
  setFH(0);
  setFN(0);
  setFC(FC);
}

/** NEG */
export function NEG() {
  const a = get(A);
  const result = -a & 0xFF;
  setReg(A, result);

  setFSZ53(result);
  setFH((a ^ result) & FH);
  setFO(a === BIT7 ? FO : 0);
  setFN(FN);
  setFC(a ? FC : 0);
}
