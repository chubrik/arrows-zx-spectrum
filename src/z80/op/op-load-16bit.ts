import { get, get16, set88, setReg16, setReg88 } from '../../common/utils';
import { PC } from '../registers';

/** LD dd,nn | LD IX,nn | LD IY,nn */
export function ld16Next(reg: number) {
  let pc = get16(PC);
  const valueLow = get(pc++);
  const valueHigh = get(pc++);
  setReg16(PC, pc & 0xFFFF);
  setReg88(reg, valueLow, valueHigh);
}

/**
 * LD (nn),dd | LD (nn),HL | LD (nn),IX | LD (nn),IY
 */
export function ld16(dest: number, src: number) {
  const valueLow = get(src);
  const valueHigh = get(src + 1);
  set88(dest, valueLow, valueHigh);
}

/**
 * LD dd,(nn) | LD HL,(nn) | LD IX,(nn) | LD IY,(nn)
 */
export function ldReg16(dest: number, src: number) {
  const valueLow = get(src);
  const valueHigh = get(src + 1);
  setReg88(dest, valueLow, valueHigh);
}
