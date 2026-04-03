import { xFF, xFFFF } from '../../common/constants';
import { mem, write88 } from '../../common/memory';
import { packF, unpackF } from '../flags';
import { A, cpu, PCv, set88, setPCv, setSPv, SPv } from '../registers';

/** CALL addr */
export function CALL_addr(addr: number) {
  const pc = PCv;
  const newSp = (SPv - 2) & xFFFF;
  setPCv(addr);
  setSPv(newSp);
  write88(newSp, pc & xFF, pc >> 8);
}

/** CALL nn | CALL cc,nn */
export function CALL_nn() {
  let pc = PCv;
  const nnLow = mem[pc++];
  const nnHigh = mem[pc++];
  const newSp = (SPv - 2) & xFFFF;
  setPCv((nnHigh << 8) | nnLow);
  setSPv(newSp);
  const newPcl = pc & xFF;
  const newPch = (pc >> 8) & xFF;
  write88(newSp, newPcl, newPch);
}

/** PUSH qq | PUSH IX | PUSH IY */
export function PUSH_QQ(reg: number) {
  const rLow = cpu[reg];
  const rHigh = cpu[reg + 1];
  const newSp = (SPv - 2) & xFFFF;
  setSPv(newSp);
  write88(newSp, rLow, rHigh);
}

/** PUSH AF */
export function PUSH_AF() {
  const f = packF();
  const a = cpu[A];
  const newSp = (SPv - 2) & xFFFF;
  setSPv(newSp);
  write88(newSp, f, a);
}

/** POP qq | POP IX | POP IY */
export function POP_QQ(reg: number) {
  let sp = SPv;
  const rLow = mem[sp++];
  const rHigh = mem[sp++];
  setSPv(sp & xFFFF);
  set88(reg, rLow, rHigh);
}

export function POP_PC() {
  let sp = SPv;
  const rLow = mem[sp++];
  const rHigh = mem[sp++];
  setSPv(sp & xFFFF);
  setPCv((rHigh << 8) | rLow);
}

/** POP AF */
export function POP_AF() {
  let sp = SPv;
  const f = mem[sp++];
  const a = mem[sp++];
  setSPv(sp & xFFFF);
  unpackF(f);
  cpu[A] = a;
}
