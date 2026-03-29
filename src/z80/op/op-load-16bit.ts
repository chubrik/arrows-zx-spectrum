import { get, get16, set16, set88 } from '../../common/utils';
import { PC } from '../registers';

/** LD dd,nn | LD IX,nn | LD IY,nn */
export function ld16Next(dest: number) {
  let pc = get16(PC);
  const valueLow = get(pc++);
  const valueHigh = get(pc++);
  set16(PC, pc & 0xFFFF);
  set88(dest, valueLow, valueHigh);
}

/**
 * LD (nn),dd | LD (nn),HL | LD (nn),IX | LD (nn),IY
 * LD dd,(nn) | LD HL,(nn) | LD IX,(nn) | LD IY,(nn)
 */
export function ld16(dest: number, src: number) {
  const valueLow = get(src);
  const valueHigh = get(src + 1);
  set88(dest, valueLow, valueHigh);
}
