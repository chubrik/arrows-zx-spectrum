import { BIT7, F3, f3, F5, f5, FC, fc, FH, fh, fn, FN, FP, setF3, setF5, setFC, setFH, setFN, setFP, setFSZ53, setFSZ53P } from '../flags';
import { A, regs } from '../registers';

/** DAA */
export function DAA() {
  const a = regs[A];
  let newA = a;
  const wasN = fn;
  let correction = 0;
  if (fh || (newA & 0x0F) > 9) correction |= 0x06;
  if (fc || newA > 0x99) { correction |= 0x60; setFC(FC); }
  newA = (wasN ? newA - correction : newA + correction) & 0xFF;
  regs[A] = newA;

  setFSZ53P(newA);
  setFH((a ^ correction ^ newA) & FH);
}

/** CPL */
export function CPL() {
  const newA = regs[A] ^ 0xFF;
  regs[A] = newA;

  setF5(newA & F5);
  setF3(newA & F3);
  setFH(FH);
  setFN(FN);
}

/** CCF */
export function CCF() {
  const a = regs[A];

  setF5((a & F5) | f5);
  setF3((a & F3) | f3);
  setFH(fc ? FH : 0);
  setFN(0);
  setFC(fc ? 0 : FC);
}

/** SCF */
export function SCF() {
  const a = regs[A];

  setF5((a & F5) | f5);
  setF3((a & F3) | f3);
  setFH(0);
  setFN(0);
  setFC(FC);
}

/** NEG */
export function NEG() {
  const a = regs[A];
  const newA = -a & 0xFF;
  regs[A] = newA;

  setFSZ53(newA);
  setFH((a ^ newA) & FH);
  setFP(a === BIT7 ? FP : 0);
  setFN(FN);
  setFC(a ? FC : 0);
}
