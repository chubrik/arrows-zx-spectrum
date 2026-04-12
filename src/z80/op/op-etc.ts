import { xFF, xFFFF } from '../../hw/constants';
import { mem, read16, write16 } from '../../hw/memory';
import { readPort } from '../../hw/ports';
import { calcFP, calcFSZ53, FP, iff2, setFH, setFN, setFP } from '../flags';
import { b, c, dec2SP, inc2SP, incPC, pc, setA, setB, setPC, sp } from '../registers';
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
  else incPC();
}

/** JP nn | JP cc,nn */
export function JP_nn() {
  setPC(mem[pc] | (mem[pc + 1] << 8));
}

/** JR e */
export function JR_e() {
  let e = next();
  if (e >= 128) e -= 256;
  setPC((pc + e) & xFFFF); // -126...+129 relative to operation start
}

/** RST p */
export function RST_p(addr: number) {
  dec2SP();
  write16(sp, pc);
  setPC(addr);
}

/** CALL nn | CALL cc,nn */
export function CALL_nn() {
  dec2SP();
  write16(sp, (pc + 2) & xFFFF);
  setPC(read16(pc));
}

/** RET | RET cc | RETN | RETI */
export function RET() {
  setPC(read16(sp));
  inc2SP();
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
