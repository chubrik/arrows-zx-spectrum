import { xFF, xFFFF } from '../../common/constants';
import { mem, write88 } from '../../common/memory';
import { packF, unpackF } from '../flags';
import { A, cpu, incSPv, PCv, set88, setPCv, setSPv, SPv } from '../registers';

/** RST p */
export function RST_p(addr: number) {
  const newSp = (SPv - 2) & xFFFF;
  setSPv(newSp);
  write88(newSp, PCv & xFF, PCv >> 8);
  setPCv(addr);
}

/** CALL nn | CALL cc,nn */
export function CALL_nn() {
  let pc = PCv;
  const newSp = (SPv - 2) & xFFFF;
  setPCv(mem[pc++] | (mem[pc++] << 8));
  write88(newSp, pc & xFF, (pc >> 8) & xFF);
  setSPv(newSp);
}

/** RET | RET cc | RETN | RETI */
export function RET() {
  setPCv(mem[incSPv()] | (mem[incSPv()] << 8));
  setSPv(SPv & xFFFF);
}

/** PUSH qq | PUSH IX | PUSH IY */
export function PUSH_QQ(reg: number) {
  const newSp = (SPv - 2) & xFFFF;
  write88(newSp, cpu[reg], cpu[reg + 1]);
  setSPv(newSp);
}

/** PUSH AF */
export function PUSH_AF() {
  const newSp = (SPv - 2) & xFFFF;
  write88(newSp, packF(), cpu[A]);
  setSPv(newSp);
}

/** POP qq | POP IX | POP IY */
export function POP_QQ(reg: number) {
  set88(reg, mem[incSPv()], mem[incSPv()]);
  setSPv(SPv & xFFFF);
}

/** POP AF */
export function POP_AF() {
  unpackF(mem[incSPv()]);
  cpu[A] = mem[incSPv()];
  setSPv(SPv & xFFFF);
}
