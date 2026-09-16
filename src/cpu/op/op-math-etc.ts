import { BIT7, xFF } from '../../common/constants';
import { calcFP, calcFSZ53, F53, f53, FC, fc, FH, fh, fn, FN, FP, setF53, setFC, setFH, setFN, setFP } from '../flags';
import { a, setA } from '../registers';
import { ts } from '../utils';

/** DAA */
export function DAA() {
  ts(4);
  let correction = 0;
  if (fh || (a & 0x0F) > 9) correction |= 0x06;
  if (fc || a > 0x99) { correction |= 0x60; setFC(FC); }
  const newA = (fn ? a - correction : a + correction) & xFF;

  calcFSZ53(newA);
  calcFP(newA);
  setFH((a ^ correction ^ newA) & FH);

  setA(newA);
}

/** CPL */
export function CPL() {
  ts(4);
  setA(a ^ xFF);

  setF53(a & F53);
  setFH(FH);
  setFN(FN);
}

/** CCF */
export function CCF() {
  ts(4);
  setF53((a & F53) | f53);
  setFH(fc ? FH : 0);
  setFN(0);
  setFC(fc ? 0 : FC);
}

/** SCF */
export function SCF() {
  ts(4);
  setF53((a & F53) | f53);
  setFH(0);
  setFN(0);
  setFC(FC);
}

/** NEG */
export function NEG() {
  const newA = -a & xFF;

  calcFSZ53(newA);
  setFH((a ^ newA) & FH);
  setFP(a === BIT7 ? FP : 0);
  setFN(FN);
  setFC(a ? FC : 0);

  setA(newA);
}
