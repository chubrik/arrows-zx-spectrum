import { xFF, xFFFF } from '../../hw/constants';
import { mem, write16 } from '../../hw/mem-state';
import { incSP, pc, setPC, setSP, sp } from '../registers';

/** RST p */
export function RST_p(addr: number) {
  setSP((sp - 2) & xFFFF);
  write16(sp, pc & xFF, pc >> 8);
  setPC(addr);
}

/** CALL nn | CALL cc,nn */
export function CALL_nn() {
  let pc_ = pc;
  setSP((sp - 2) & xFFFF);
  setPC(mem[pc_++] | (mem[pc_++] << 8));
  write16(sp, pc_ & xFF, (pc_ >> 8) & xFF);
}

/** RET | RET cc | RETN | RETI */
export function RET() {
  setPC(mem[incSP()] | (mem[incSP()] << 8));
  setSP(sp & xFFFF);
}
