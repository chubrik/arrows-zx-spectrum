import { mems } from '../../common/memory';
import { readPort, writePort } from '../../common/ports';
import { FP, iff2, setFH, setFN, setFP, setFSZ53, setFSZ53P } from '../flags';
import { A, B, BC, get16, PC, regs, set16, set88 } from '../registers';
import { incPC, next } from '../utils';

/** LD A,I | LD A,R */
export function ld_A_IR(value: number) {
  regs[A] = value;

  setFSZ53(value);
  setFP(iff2 ? FP : 0);
  setFH(0);
  setFN(0);
}

/** LD dd,nn | LD IX,nn | LD IY,nn */
export function LD_dd_nn(reg: number) {
  let pc = get16(PC);
  const low = mems[pc++];
  const high = mems[pc++];
  set16(PC, pc & 0xFFFF);
  set88(reg, low, high);
}

/** DJNZ e */
export function DJNZ_e() {
  const b = regs[B];
  const newB = (b - 1) & 0xFF;
  regs[B] = newB;
  if (newB) JR_e();
  else incPC(1);
}

/** JR e */
export function JR_e() {
  const rawE = next();
  const e = rawE >= 128 ? rawE - 256 : rawE;
  incPC(e); // -126...+129 relative to operation start
}

/** IN A,(n) */
export function IN_A_n() {
  const a = regs[A];
  const n = next();
  const ioAddr = (a << 8) | n;
  regs[A] = readPort(ioAddr);
}

/** OUT (n),A */
export function OUT_n_A() {
  const a = regs[A];
  const n = next();
  const ioAddr = (a << 8) | n;
  writePort(ioAddr, a);
}

/** IN r,(C) | IN (C) (undocumented) */
export function IN_c(reg: number = 0) {
  const ioAddr = get16(BC);
  const result = readPort(ioAddr);
  if (reg) regs[reg] = result;

  setFSZ53P(result);
  setFH(0);
  setFN(0);
}

/** OUT (C),r | OUT (C),0 (undocumented) */
export function OUT_c(reg: number = 0) {
  const ioAddr = get16(BC);
  const value = reg ? regs[reg] : 0; // NMOS: 0, CMOS: 255 (undocumented)
  writePort(ioAddr, value);
}
