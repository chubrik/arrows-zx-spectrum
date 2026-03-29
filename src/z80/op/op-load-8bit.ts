import { get, set } from '../../common/utils';
import { FO, IFF2, flagsSZ53 } from '../flags';
import { A, F, I, R, SYS } from '../registers';
import { getFC } from '../utils';

/** LD A,I */
export function LD_A_I() {
  const value = get(I);
  ld_A_IR(value);
}

/** LD A,R */
export function LD_A_R() {
  const value = get(R);
  ld_A_IR(value);
}

function ld_A_IR(value: number) {
  set(A, value);
  set(F, flagsSZ53(value) | ((get(SYS) & IFF2) ? FO : 0) | getFC());
}
