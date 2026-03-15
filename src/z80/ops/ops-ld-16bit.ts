import { getMem16, setMem16 } from '../../common/data';
import { QQSelect, SSSelect } from '../types';
import { getRegHL, getRegSS, nextPC16, setRegSP, setRegSS } from '../utils';

/** LD (nn),dd | LD (nn),HL | LD (nn),IX | LD (nn),IY */
export function LD_nn_SS(src: SSSelect) {
  const destAddr = nextPC16();
  const value = getRegSS(src);
  setMem16(destAddr, value);
}

/** LD dd,(nn) | LD HL,(nn) | LD IX,(nn) | LD IY,(nn) */
export function LD_SS_nn(dest: SSSelect) {
  const srcAddr = nextPC16();
  const value = getMem16(srcAddr);
  setRegSS(dest, value);
}

/** LD dd,nn | LD IX,nn | LD IY,nn */
export function LD_SS_NN(dest: SSSelect) {
  const nn = nextPC16();
  setRegSS(dest, nn);
}

/** LD SP,HL | LD SP,IX | LD SP,IY */
export function LD_SP_HL() {
  const value = getRegHL();
  setRegSP(value);
}

/** PUSH qq | PUSH IX | PUSH IY */
export function PUSH_QQ(select: QQSelect) {
  /* TODO */
}

/** POP qq | POP IX | POP IY */
export function POP_QQ(select: QQSelect) {
  /* TODO */
}
