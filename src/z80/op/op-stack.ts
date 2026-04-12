import { xFFFF } from '../../hw/constants';
import { read16, write16 } from '../../hw/mem-state';
import { pc, setPC, setSP, sp } from '../registers';

/** RST p */
export function RST_p(addr: number) {
  setSP((sp - 2) & xFFFF);
  write16(sp, pc);
  setPC(addr);
}

/** CALL nn | CALL cc,nn */
export function CALL_nn() {
  setSP((sp - 2) & xFFFF);
  write16(sp, (pc + 2) & xFFFF);
  setPC(read16(pc));
}

/** RET | RET cc | RETN | RETI */
export function RET() {
  setPC(read16(sp));
  setSP((sp + 2) & xFFFF);
}
