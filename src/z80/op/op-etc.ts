import { xFF, xFFFF } from '../../hw/constants';
import { readPort } from '../../hw/ports';
import { calcFP, calcFSZ53, FP, iff2, setFH, setFN, setFP } from '../flags';
import { b, c, pc, setA, setB, setPC } from '../registers';
import { next } from '../utils';

/** LD A,I | LD A,R */
export function ld_A_IR(value: number) {
  setA(value);

  calcFSZ53(value);
  setFP(iff2 ? FP : 0);
  setFH(0);
  setFN(0);
}

/** DJNZ e */
export function DJNZ_e() {
  setB((b - 1) & xFF);
  if (b) JR_e();
  else setPC((pc + 1) & xFFFF);
}

/** JR e */
export function JR_e() {
  let e = next();
  if (e >= 128) e -= 256;
  setPC((pc + e) & xFFFF); // -126...+129 relative to operation start
}

/** IN r,(C) — reads port, returns value and updates flags */
export function in_port(): number {
  const result = readPort(c, b);
  calcFSZ53(result);
  calcFP(result);
  setFH(0);
  setFN(0);
  return result;
}
