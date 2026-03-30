import { get, set16, set88 } from '../../common/utils';
import { IFF1, iff2, packF, setIFF1, unpackF } from '../flags';
import { A, getReg16, PC, PCh, PCl, regs, setReg16, setReg88, SP } from '../registers';

/** RETI | RETN */
export function RETI_RETN() {
  pop16(PC);
  setIFF1(iff2 ? IFF1 : 0);
}

export function call88(addrLow: number, addrHigh: number = 0) {
  const pcLow = regs[PCl];
  const pcHigh = regs[PCh];
  const sp = getReg16(SP);
  const newSp = (sp - 2) & 0xFFFF;
  setReg16(SP, newSp);
  set88(newSp, pcLow, pcHigh);
  setReg88(PC, addrLow, addrHigh);
}

export function callNext16() {
  let pc = getReg16(PC);
  const addrLow = get(pc++);
  const addrHigh = get(pc++);
  const sp = getReg16(SP);
  const newSp = (sp - 2) & 0xFFFF;
  setReg16(SP, newSp);
  set16(newSp, pc & 0xFFFF);
  setReg88(PC, addrLow, addrHigh);
}

export function push16(src: number) {
  const valueLow = regs[src];
  const valueHigh = regs[src + 1];
  const sp = getReg16(SP);
  const newSp = (sp - 2) & 0xFFFF;
  setReg16(SP, newSp);
  set88(newSp, valueLow, valueHigh);
}

export function pop16(reg: number) {
  let sp = getReg16(SP);
  const valueLow = get(sp++);
  const valueHigh = get(sp++);
  setReg16(SP, sp & 0xFFFF);
  setReg88(reg, valueLow, valueHigh);
}

export function pushAF() {
  const fByte = packF();
  const aVal = regs[A];
  const sp = getReg16(SP);
  const newSp = (sp - 2) & 0xFFFF;
  setReg16(SP, newSp);
  set88(newSp, fByte, aVal);
}

export function popAF() {
  let sp = getReg16(SP);
  const fByte = get(sp++);
  const aVal = get(sp++);
  setReg16(SP, sp & 0xFFFF);
  unpackF(fByte);
  regs[A] = aVal;
}
