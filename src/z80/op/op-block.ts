import { get, get16, set, set16 } from '../../common/utils';
import { FH, FN, FO, FS, FSZC, FZ } from '../flags';
import { A, BC, DE, F, HLXY } from '../positions';
import { addPC, getFC } from '../utils';

export function ldx(increment: 1 | -1, repeat: 0 | 1 = 0) {
  const a = get(A);
  const count = get16(BC);
  const destAddr = get16(DE);
  const srcAddr = get16(HLXY);
  const value = get(srcAddr);

  const newCount = (count - 1) & 0xFFFF;
  set(destAddr, value);
  set16(BC, newCount);
  set16(DE, (destAddr + increment) & 0xFFFF);
  set16(HLXY, (srcAddr + increment) & 0xFFFF);

  // F5 = bit 1 of n
  // F3 = bit 3 of n, where n = A + value
  const n = (a + value) & 0xFF;
  const f53 = ((n & 0x02) << 4) | (n & 0x08); //todo const

  set(F,
    (get(F) & FSZC)
    | (newCount ? FO : 0)
    | f53);

  if (repeat && newCount)
    addPC(-2);
}

export function cpx(increment: 1 | -1, repeat: 0 | 1 = 0) {
  const a = get(A);
  const count = get16(BC);
  const srcAddr = get16(HLXY);
  const value = get(srcAddr);

  const newCount = (count - 1) & 0xFFFF;
  const diff = (a - value) & 0xFF;
  set16(BC, newCount);
  set16(HLXY, (srcAddr + increment) & 0xFFFF);

  // F5 = bit 1 of n
  // F3 = bit 3 of n, where n = diff - halfCarry
  const halfCarry = (a ^ value ^ diff) & FH;
  const n = (diff - (halfCarry ? 1 : 0)) & 0xFF;
  const f53 = ((n & 0x02) << 4) | (n & 0x08); //todo const

  set(F,
    (diff & FS)
    | (diff ? 0 : FZ)
    | halfCarry
    | (newCount ? FO : 0)
    | FN
    | f53
    | getFC());

  if (repeat && newCount && diff)
    addPC(-2);
}
