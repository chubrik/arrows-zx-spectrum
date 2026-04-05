import { BIT7, xFF } from '../../hw/constants';
import { calcFP, calcFSZ53, F3, f3, F5, f5, FC, fc, FH, fh, fn, FN, FP, setF3, setF5, setFC, setFH, setFN, setFP } from '../flags';
import { A, cpu } from '../registers';

/** DAA */
export function DAA() {
  const a = cpu[A];
  let newA = a;
  let correction = 0;
  if (fh || (newA & 0x0F) > 9) correction |= 0x06;
  if (fc || newA > 0x99) { correction |= 0x60; setFC(FC); }
  newA = (fn ? newA - correction : newA + correction) & xFF;
  cpu[A] = newA;

  calcFSZ53(newA);
  calcFP(newA);
  setFH((a ^ correction ^ newA) & FH);
}

/** CPL */
export function CPL() {
  const newA = cpu[A] ^ xFF;
  cpu[A] = newA;

  setF5(newA & F5);
  setF3(newA & F3);
  setFH(FH);
  setFN(FN);
}

/** CCF */
export function CCF() {
  const a = cpu[A];

  setF5((a & F5) | f5);
  setF3((a & F3) | f3);
  setFH(fc ? FH : 0);
  setFN(0);
  setFC(fc ? 0 : FC);
}

/** SCF */
export function SCF() {
  const a = cpu[A];

  setF5((a & F5) | f5);
  setF3((a & F3) | f3);
  setFH(0);
  setFN(0);
  setFC(FC);
}

/** NEG */
export function NEG() {
  const a = cpu[A];
  const newA = -a & xFF;
  cpu[A] = newA;

  calcFSZ53(newA);
  setFH((a ^ newA) & FH);
  setFP(a === BIT7 ? FP : 0);
  setFN(FN);
  setFC(a ? FC : 0);
}
