import { get, get16, set, set88 } from '../../common/utils';
import { IFF1, IFF2 } from '../flags';
import { PC, PCh, PCl, SYS } from '../positions';
import { pop16, pushValue88 } from '../utils';

/** RETI | RETN */
export function RETI_RETN() {
  const sys = get(SYS);
  const iff2 = sys & IFF2;
  if (iff2) set(SYS, sys | IFF1);
  else set(SYS, sys & ~IFF1);
  pop16(PC);
}

export function call88(addrLow: number, addrHigh: number = 0) {
  const pcLow = get(PCl);
  const pcHigh = get(PCh);
  pushValue88(pcLow, pcHigh);
  set88(PC, addrLow, addrHigh);
}

export function callNext16() {
  let pc = get16(PC);
  const addrLow = get(pc++);
  const addrHigh = get(pc++);
  pc &= 0xFFFF;
  pushValue88(pc & 0xFF, pc >> 8);
  set88(PC, addrLow, addrHigh);
}
