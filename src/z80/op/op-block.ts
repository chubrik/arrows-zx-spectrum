import { get, get16, set, set16 } from '../../common/utils';
import { F3, ff, FH, FN, FO, FS, FZ } from '../flags';
import { A, BC, DE, HLXY } from '../registers';
import { addPC } from '../utils';

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

  const n = (a + value) & 0xFF;
  ff.f5 = (n & 0x02) << 4;
  ff.f3 = n & F3;
  ff.h = 0;
  ff.o = newCount ? FO : 0;
  ff.n = 0;

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

  const halfCarry = (a ^ value ^ diff) & FH;
  const n = (diff - (halfCarry ? 1 : 0)) & 0xFF;

  ff.s = diff & FS;
  ff.z = diff ? 0 : FZ;
  ff.f5 = (n & 0x02) << 4;
  ff.h = halfCarry;
  ff.f3 = n & F3;
  ff.o = newCount ? FO : 0;
  ff.n = FN;

  if (repeat && newCount && diff)
    addPC(-2);
}
