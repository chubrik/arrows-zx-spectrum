import { read, write16, write88 } from '../../common/memory';
import { packF, unpackF } from '../flags';
import { A, get16, PC, PCh, PCl, regs, set16, set88, SP } from '../registers';

export function call88(addrLow: number, addrHigh: number = 0) {
  const pcl = regs[PCl];
  const pch = regs[PCh];
  const sp = get16(SP);
  const newSp = (sp - 2) & 0xFFFF;
  set88(PC, addrLow, addrHigh);
  set16(SP, newSp);
  write88(newSp, pcl, pch);
}

export function callNext16() {
  let pc = get16(PC);
  const newPcl = read(pc++);
  const newPch = read(pc++);
  const sp = get16(SP);
  const newSp = (sp - 2) & 0xFFFF;
  set88(PC, newPcl, newPch);
  set16(SP, newSp);
  write16(newSp, pc & 0xFFFF);
}

export function push16(reg: number) {
  const rLow = regs[reg];
  const rHigh = regs[reg + 1];
  const sp = get16(SP);
  const newSp = (sp - 2) & 0xFFFF;
  set16(SP, newSp);
  write88(newSp, rLow, rHigh);
}

export function pushAF() {
  const f = packF();
  const a = regs[A];
  const sp = get16(SP);
  const newSp = (sp - 2) & 0xFFFF;
  set16(SP, newSp);
  write88(newSp, f, a);
}

export function pop16(reg: number) {
  let sp = get16(SP);
  const rLow = read(sp++);
  const rHigh = read(sp++);
  set16(SP, sp & 0xFFFF);
  set88(reg, rLow, rHigh);
}

export function popAF() {
  let sp = get16(SP);
  const f = read(sp++);
  const a = read(sp++);
  set16(SP, sp & 0xFFFF);
  unpackF(f);
  regs[A] = a;
}
