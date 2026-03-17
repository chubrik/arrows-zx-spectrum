import { CCSelect } from '../types';
import { checkCC, getB, getHL, incPC, next16, next8, setB, setPC } from '../utils';

/** JP cc,nn */
export function JP_cc_NN(select: CCSelect) {
  if (checkCC(select))
    JP_NN();
  else
    incPC(2);
}

/** JP nn */
export function JP_NN() {
  const addr = next16();
  setPC(addr);
}

/** JR NZ,e | JR Z,e | JR NC,e | JR C,e */
export function JR_cc_e(select: CCSelect) {
  if (checkCC(select))
    JR_e();
  else
    incPC(1);
}

/** DJNZ e */
export function DJNZ_e() {
  const oldCount = getB();
  const count = (oldCount - 1) & 0xFF;
  setB(count);

  if (count)
    JR_e();
  else
    incPC(1);
}

/** JR e */
export function JR_e() {
  const rawE = next8();
  const e = rawE >= 128 ? rawE - 256 : rawE;
  incPC(e); // -126...+129 relative to operation start
}

/** JP (HL) | JP (IX) | JP (IY) */
export function JP_hl() {
  const addr = getHL();
  setPC(addr);
}
