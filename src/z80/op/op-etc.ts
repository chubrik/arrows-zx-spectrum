import { xFF, xFFFF } from '../../common/constants';
import { mem } from '../../common/memory';
import { readPort, writePort } from '../../common/ports';
import { calcFP, calcFSZ53, FP, iff2, setFH, setFN, setFP } from '../flags';
import { A, B, C, cpu, get16, PC, set16, set88 } from '../registers';
import { incPC, next } from '../utils';

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
  let pc = get16(PC);
  const low = mem[pc++];
  const high = mem[pc++];
  set16(PC, pc & xFFFF);
  set88(reg, low, high);
}

/** DJNZ e */
export function DJNZ_e() {
  const b = cpu[B];
  const newB = (b - 1) & xFF;
  cpu[B] = newB;
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
  const portLow = next();
  const portHigh = cpu[A];
  cpu[A] = readPort(portLow, portHigh);
}

/** OUT (n),A */
export function OUT_n_A() {
  const portLow = next();
  const portHigh = cpu[A];
  writePort(portLow, portHigh, portHigh);
}

/** IN r,(C) | IN (C) (undocumented) */
export function IN_c(reg: number = 0) {
  const portLow = cpu[C];
  const portHigh = cpu[B];
  const result = readPort(portLow, portHigh);
  if (reg) cpu[reg] = result;

  calcFSZ53(result);
  calcFP(result);
  setFH(0);
  setFN(0);
}

/** OUT (C),r | OUT (C),0 (undocumented) */
export function OUT_c(reg: number = 0) {
  const portLow = cpu[C];
  const portHigh = cpu[B];
  const value = reg ? cpu[reg] : 0; // NMOS: 0, CMOS: 255 (undocumented)
  writePort(portLow, portHigh, value);
}
