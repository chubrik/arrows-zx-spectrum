import { get, get16, set, setReg16 } from '../../common/utils';
import { F3, FH, FN, FO, FS, FZ, setF3, setF5, setFH, setFN, setFO, setFS, setFZ } from '../flags';
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
  setReg16(BC, newCount);
  setReg16(DE, (destAddr + increment) & 0xFFFF);
  setReg16(HLXY, (srcAddr + increment) & 0xFFFF);

  const n = (a + value) & 0xFF;
  setF5((n & 0x02) << 4);
  setF3(n & F3);
  setFH(0);
  setFO(newCount ? FO : 0);
  setFN(0);

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
  setReg16(BC, newCount);
  setReg16(HLXY, (srcAddr + increment) & 0xFFFF);

  const halfCarry = (a ^ value ^ diff) & FH;
  const n = (diff - (halfCarry ? 1 : 0)) & 0xFF;

  setFS(diff & FS);
  setFZ(diff ? 0 : FZ);
  setF5((n & 0x02) << 4);
  setFH(halfCarry);
  setF3(n & F3);
  setFO(newCount ? FO : 0);
  setFN(FN);

  if (repeat && newCount && diff)
    addPC(-2);
}
