import { xFF, xFFFF } from '../../common/constants';
import { mem, write88 } from '../../common/memory';
import { packF, unpackF } from '../flags';
import { A, cpu, PCv, set88, setPCv, setSPv, SPv } from '../registers';

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
  let sp = SPv;
  setPCv(mem[sp++] | (mem[sp++] << 8));
  setSPv(sp & xFFFF);
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
  let sp = SPv;
  set88(reg, mem[sp++], mem[sp++]);
  setSPv(sp & xFFFF);
}

/** POP AF */
export function POP_AF() {
  let sp = SPv;
  unpackF(mem[sp++]);
  cpu[A] = mem[sp++];
  setSPv(sp & xFFFF);
}
