import { checkCC } from '../flags';
import { CCSelect } from '../types';
import { getIFF2, getPC, incPC, next16, pop16, push16, setIFF1, setPC } from '../utils';

/** CALL cc,nn */
export function CALL_cc_NN(select: CCSelect) {
  if (checkCC(select))
    CALL_NN();
  else
    incPC(2);
}

/** CALL nn */
export function CALL_NN() {
  const addr = next16();
  call(addr);
}

/** RET cc */
export function RET_cc(select: CCSelect) {
  if (checkCC(select))
    RET();
}

/** RETI | RETN */
export function RETI_RETN() {
  const iff2 = getIFF2();
  setIFF1(iff2);
  RET();
}

/** RET */
export function RET() {
  const addr = pop16();
  setPC(addr);
}

/** RST p */
export function RST_p(p: number) {
  const addr = p << 3;
  call(addr);
}

export function call(addr: number) {
  const retAddr = getPC();
  push16(retAddr);
  setPC(addr);
}
