import { xFF, xFFFF } from '../../hw/constants';
import { mem, write88 } from '../../hw/mem-state';
import { packF, unpackF } from '../flags';
import { A, cpu, incSP, pc, set88, setPC, setSP, sp } from '../registers';

/** RST p */
export function RST_p(addr: number) {
  const newSp = (sp - 2) & xFFFF;
  setSP(newSp);
  write88(newSp, pc & xFF, pc >> 8);
  setPC(addr);
}

/** CALL nn | CALL cc,nn */
export function CALL_nn() {
  let pc_ = pc;
  const newSp = (sp - 2) & xFFFF;
  setPC(mem[pc_++] | (mem[pc_++] << 8));
  write88(newSp, pc_ & xFF, (pc_ >> 8) & xFF);
  setSP(newSp);
}

/** RET | RET cc | RETN | RETI */
export function RET() {
  setPC(mem[incSP()] | (mem[incSP()] << 8));
  setSP(sp & xFFFF);
}

/** PUSH qq | PUSH IX | PUSH IY */
export function PUSH_QQ(reg: number) {
  const newSp = (sp - 2) & xFFFF;
  write88(newSp, cpu[reg], cpu[reg + 1]);
  setSP(newSp);
}

/** PUSH AF */
export function PUSH_AF() {
  const newSp = (sp - 2) & xFFFF;
  write88(newSp, packF(), cpu[A]);
  setSP(newSp);
}

/** POP qq | POP IX | POP IY */
export function POP_QQ(reg: number) {
  set88(reg, mem[incSP()], mem[incSP()]);
  setSP(sp & xFFFF);
}

/** POP AF */
export function POP_AF() {
  unpackF(mem[incSP()]);
  cpu[A] = mem[incSP()];
  setSP(sp & xFFFF);
}
