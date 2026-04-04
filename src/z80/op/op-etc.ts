import { xFF, xFFFF } from '../../common/constants';
import { mem } from '../../common/memory';
import { readPort, writePort } from '../../common/ports';
import { calcFP, calcFSZ53, FP, iff2, setFH, setFN, setFP } from '../flags';
import { A, B, C, cpu, incPC, pc, set88, setPC, setSP } from '../registers';
import { next } from '../utils';

/** LD A,I | LD A,R */
export function ld_A_IR(value: number) {
  cpu[A] = value;

  calcFSZ53(value);
  setFP(iff2 ? FP : 0);
  setFH(0);
  setFN(0);
}

/** LD dd,nn | LD IX,nn | LD IY,nn */
export function LD_dd_nn(reg: number) {
  set88(reg, mem[incPC()], mem[incPC()]);
  setPC(pc & xFFFF);
}

/** LD SP,nn */
export function LD_SP_nn() {
  setSP(mem[incPC()] | (mem[incPC()] << 8));
  setPC(pc & xFFFF);
}

/** DJNZ e */
export function DJNZ_e() {
  const newB = (cpu[B] - 1) & xFF;
  cpu[B] = newB;
  if (newB) JR_e();
  else setPC((pc + 1) & xFFFF);
}

/** JR e */
export function JR_e() {
  let e = next();
  if (e >= 128) e -= 256;
  setPC((pc + e) & xFFFF); // -126...+129 relative to operation start
}

/** IN r,(C) | IN (C) (undocumented) */
export function IN_c(reg: number = 0) {
  const result = readPort(cpu[C], cpu[B]);
  if (reg) cpu[reg] = result;

  calcFSZ53(result);
  calcFP(result);
  setFH(0);
  setFN(0);
}
