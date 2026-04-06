import { BIT7, xFF } from '../../hw/constants';
import { calcFP, calcFSZ53, F3, f3, F5, f5, FC, fc, FH, fh, fn, FN, FP, setF3, setF5, setFC, setFH, setFN, setFP } from '../flags';
import { a, setA } from '../registers';

/** DAA */
export function DAA() {
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
  setA(a ^ xFF);

  setF5(a & F5);
  setF3(a & F3);
  setFH(FH);
  setFN(FN);
}

/** CCF */
export function CCF() {
  setF5((a & F5) | f5);
  setF3((a & F3) | f3);
  setFH(fc ? FH : 0);
  setFN(0);
  setFC(fc ? 0 : FC);
}

/** SCF */
export function SCF() {
  setF5((a & F5) | f5);
  setF3((a & F3) | f3);
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
