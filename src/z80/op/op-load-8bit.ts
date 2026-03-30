import { get, setReg } from '../../common/utils';
import { FO, iff2, setFH, setFN, setFO, setFSZ53 } from '../flags';
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
  setReg(A, value);
  
  setFSZ53(value);
  setFO(iff2 ? FO : 0);
  setFH(0);
  setFN(0);
}
