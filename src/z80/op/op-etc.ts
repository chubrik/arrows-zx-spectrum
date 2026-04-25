import { TSTATES_EXTRA_CALL, TSTATES_EXTRA_JR, TSTATES_EXTRA_RET, xFF, xFFFF } from '../../common/constants';
import { mem, read16, write16 } from '../../common/memory';
import { readPort } from '../../common/ports';
import { calcFP, calcFSZ53, FP, iff2, setFH, setFN, setFP } from '../flags';
import { b, c, dec2SP, inc2SP, incPC, pc, setA, setB, setPC, sp } from '../registers';
import { next, ts } from '../utils';

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

/** JR e | JR cc,e taken | DJNZ taken: charges the extra T-states of a taken jump */
export function JR_e() {
  ts(TSTATES_EXTRA_JR);
  const e = next();
  const addr = e < 128 ? (pc + e) & xFFFF : pc - 256 + e; // -126...+129 relative to operation start
  // Negative addr is impossible in practice: ROM at 0x0000 has no backward JR that would underflow.
  setPC(TEST ? addr & xFFFF : addr);
}

/** RST p */
export function RST_p(addr: number) {
  dec2SP();
  write16(sp, pc & xFFFF);
  setPC(addr);
}

/** CALL nn | CALL cc,nn taken: charges the extra T-states of a taken call */
export function CALL_nn() {
  ts(TSTATES_EXTRA_CALL);
  dec2SP();
  write16(sp, (pc + 2) & xFFFF);
  setPC(read16(pc));
}

/** RET | RET cc taken | RETN | RETI: charges the extra T-states of a taken return */
export function RET() {
  ts(TSTATES_EXTRA_RET);
  setPC(read16(sp));
  inc2SP();
}

/** IN r,(C) */
export function in_port(): number {
  const result = readPort(c, b);
  calcFSZ53(result);
  calcFP(result);
  setFH(0);
  setFN(0);
  return result;
}
