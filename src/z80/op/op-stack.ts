import { xFF, xFFFF } from '../../common/constants';
import { mem, write88 } from '../../common/memory';
import { packF, unpackF } from '../flags';
import { A, cpu, get16, PC, PCh, PCl, set16, set88, SP } from '../registers';

/** CALL addr */
export function CALL_addr(addrLow: number, addrHigh: number = 0) {
  const pcl = cpu[PCl];
  const pch = cpu[PCh];
  const sp = get16(SP);
  const newSp = (sp - 2) & xFFFF;
  set88(PC, addrLow, addrHigh);
  set16(SP, newSp);
  write88(newSp, pcl, pch);
}

/** CALL nn | CALL cc,nn */
export function CALL_nn() {
  let pc = get16(PC);
  const nnLow = mem[pc++];
  const nnHigh = mem[pc++];
  const sp = get16(SP);
  const newSp = (sp - 2) & xFFFF;
  set88(PC, nnLow, nnHigh);
  set16(SP, newSp);
  const newPcl = pc & xFF;
  const newPch = (pc >> 8) & xFF;
  write88(newSp, newPcl, newPch);
}

/** PUSH qq | PUSH IX | PUSH IY */
export function PUSH_QQ(reg: number) {
  const rLow = cpu[reg];
  const rHigh = cpu[reg + 1];
  const sp = get16(SP);
  const newSp = (sp - 2) & xFFFF;
  set16(SP, newSp);
  write88(newSp, rLow, rHigh);
}

/** PUSH AF */
export function PUSH_AF() {
  const f = packF();
  const a = cpu[A];
  const sp = get16(SP);
  const newSp = (sp - 2) & xFFFF;
  set16(SP, newSp);
  write88(newSp, f, a);
}

/** POP qq | POP IX | POP IY */
export function POP_QQ(reg: number) {
  let sp = get16(SP);
  const rLow = mem[sp++];
  const rHigh = mem[sp++];
  set16(SP, sp & xFFFF);
  set88(reg, rLow, rHigh);
}

/** POP AF */
export function POP_AF() {
  let sp = get16(SP);
  const f = mem[sp++];
  const a = mem[sp++];
  set16(SP, sp & xFFFF);
  unpackF(f);
  cpu[A] = a;
}
