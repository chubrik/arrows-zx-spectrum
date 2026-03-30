import { get, get16, set, set16, set88 } from '../../common/utils';
import { packF, sf, unpackF } from '../flags';
import { A, PC, PCh, PCl, SP } from '../registers';

/** RETI | RETN */
export function RETI_RETN() {
  sf.iff1 = sf.iff2 ? 0x04 : 0;
  pop16(PC);
}

export function call88(addrLow: number, addrHigh: number = 0) {
  const pcLow = get(PCl);
  const pcHigh = get(PCh);
  const sp = get16(SP);
  const newSp = (sp - 2) & 0xFFFF;
  set16(SP, newSp);
  set88(newSp, pcLow, pcHigh);
  set88(PC, addrLow, addrHigh);
}

export function callNext16() {
  let pc = get16(PC);
  const addrLow = get(pc++);
  const addrHigh = get(pc++);
  const sp = get16(SP);
  const newSp = (sp - 2) & 0xFFFF;
  set16(SP, newSp);
  set16(newSp, pc & 0xFFFF);
  set88(PC, addrLow, addrHigh);
}

export function push16(src: number) {
  const valueLow = get(src);
  const valueHigh = get(src + 1);
  const sp = get16(SP);
  const newSp = (sp - 2) & 0xFFFF;
  set16(SP, newSp);
  set88(newSp, valueLow, valueHigh);
}

export function pop16(dest: number) {
  let sp = get16(SP);
  const valueLow = get(sp++);
  const valueHigh = get(sp++);
  set16(SP, sp & 0xFFFF);
  set88(dest, valueLow, valueHigh);
}

export function pushAF() {
  const fByte = packF();
  const aVal = get(A);
  const sp = get16(SP);
  const newSp = (sp - 2) & 0xFFFF;
  set16(SP, newSp);
  set88(newSp, fByte, aVal);
}

export function popAF() {
  let sp = get16(SP);
  const fByte = get(sp++);
  const aVal = get(sp++);
  set16(SP, sp & 0xFFFF);
  unpackF(fByte);
  set(A, aVal);
}
