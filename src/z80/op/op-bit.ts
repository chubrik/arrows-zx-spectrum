import { set } from '../../common/utils';
import { F53, FH, FS, FZO } from '../flags';
import { F } from '../positions';
import { getFC } from '../utils';

/** BIT b,r | BIT b,(HL) | BIT b,(IX+d) | BIT b,(IY+d) */
export function BIT_b_val(bit: number, value: number, f53Source: number) {
  const isSet = value & bit;

  set(F,
    (isSet & FS)
    | (isSet ? 0 : FZO)
    | FH | (f53Source & F53)
    | getFC());
}

/** RES b,r | RES b,(HL) | RES b,(IX+d) | RES b,(IY+d) */
export function RES_b_val(bit: number, value: number): number {
  return value & ~bit;
}

/** SET b,r | SET b,(HL) | SET b,(IX+d) | SET b,(IY+d) */
export function SET_b_val(bit: number, value: number): number {
  return value | bit;
}
