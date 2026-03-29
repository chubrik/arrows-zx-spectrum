import { set } from '../../common/utils';
import { F53, FH, FS, FZO } from '../flags';
import { F } from '../registers';
import { getFC } from '../utils';

/** BIT b,r | BIT b,(HL) | BIT b,(IX+d) | BIT b,(IY+d) */
export function BIT_b_val(bit: number, value: number, f53Source: number) {
  const isSet = value & bit;

  set(F,
    (isSet & FS)
    | (isSet ? 0 : FZO)
    | FH
    | (f53Source & F53)
    | getFC());
}
