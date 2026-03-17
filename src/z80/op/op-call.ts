import { CCSelect } from '../types';
import { checkCC, getIFF2, getPC, incPC, next16, pop16, push16, setIFF1, setPC } from '../utils';

/** CALL cc,nn */
export function CALL_cc_NN(cc: CCSelect) {
  if (checkCC(cc))
    CALL_NN();
  else
    incPC(2);
}

/** CALL nn */
export function CALL_NN() {
  const callAddr = next16();
  call(callAddr);
}

/** RET cc */
export function RET_cc(cc: CCSelect) {
  if (checkCC(cc))
    RET();
}

/** RET */
export function RET() {
  const retAddr = pop16();
  setPC(retAddr);
}

/** RETI */
export function RETI() {
  /* TODO */
}

/** RETN */
export function RETN() {
  const iff2 = getIFF2();
  setIFF1(iff2);
  RET();
}

/** RST p */
export function RST_p(select: number) {
  const callAddr = select << 3;
  call(callAddr);
}

function call(addr: number) {
  const retAddr = getPC();
  push16(retAddr);
  setPC(addr);
}
