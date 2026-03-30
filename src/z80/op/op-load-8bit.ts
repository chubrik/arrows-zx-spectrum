import { get, set } from '../../common/utils';
import { ff, setFSZ53, sf } from '../flags';
import { A, I, R } from '../registers';

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
  setFSZ53(value);
  ff.o = sf.iff2 ? 0x04 : 0;
  ff.h = 0;
  ff.n = 0;
}
