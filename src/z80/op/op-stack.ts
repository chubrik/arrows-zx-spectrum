import { mems, write88 } from '../../common/memory';
import { packF, unpackF } from '../flags';
import { A, get16, PC, PCh, PCl, regs, set16, set88, SP } from '../registers';

/** CALL nn */
export function CALL_nn(addrLow: number, addrHigh: number = 0) {
  const pcl = regs[PCl];
  const pch = regs[PCh];
  const sp = get16(SP);
  const newSp = (sp - 2) & 0xFFFF;
  set88(PC, addrLow, addrHigh);
  set16(SP, newSp);
  write88(newSp, pcl, pch);
}

/** CALL cc,nn */
export function CALL_cc_nn() {
  let pc = get16(PC);
  const nnLow = mems[pc++];
  const nnHigh = mems[pc++];
  const sp = get16(SP);
  const newSp = (sp - 2) & 0xFFFF;
  set88(PC, nnLow, nnHigh);
  set16(SP, newSp);
  const newPcl = pc & 0xFF;
  const newPch = (pc >> 8) & 0xFF;
  write88(newSp, newPcl, newPch);
}

/** PUSH qq | PUSH IX | PUSH IY */
export function PUSH_QQ(reg: number) {
  const rLow = regs[reg];
  const rHigh = regs[reg + 1];
  const sp = get16(SP);
  const newSp = (sp - 2) & 0xFFFF;
  set16(SP, newSp);
  write88(newSp, rLow, rHigh);
}

/** PUSH AF */
export function PUSH_AF() {
  const f = packF();
  const a = regs[A];
  const sp = get16(SP);
  const newSp = (sp - 2) & 0xFFFF;
  set16(SP, newSp);
  write88(newSp, f, a);
}

/** POP qq | POP IX | POP IY */
export function POP_QQ(reg: number) {
  let sp = get16(SP);
  const rLow = mems[sp++];
  const rHigh = mems[sp++];
  set16(SP, sp & 0xFFFF);
  set88(reg, rLow, rHigh);
}

/** POP AF */
export function POP_AF() {
  let sp = get16(SP);
  const f = mems[sp++];
  const a = mems[sp++];
  set16(SP, sp & 0xFFFF);
  unpackF(f);
  regs[A] = a;
}
