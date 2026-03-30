import { get, set } from '../../common/utils';
import { BIT7, F3, F5, FC, ff, FH, FN, FO, FS, FZ, setFSZ53, setFSZ53P } from '../flags';
import { A } from '../registers';

/** INC r | INC (HL) | INC (IX+d) | INC (IY+d) */
export function inc(addr: number) {
  const value = get(addr);
  const result = (value + 1) & 0xFF;
  set(addr, result);

  setFSZ53(result);
  ff.h = !(result & 0x0F) ? FH : 0;
  ff.o = value === 0x7F ? FO : 0;
  ff.n = 0;
}

/** DEC r | DEC (HL) | DEC (IX+d) | DEC (IY+d) */
export function dec(addr: number) {
  const value = get(addr);
  const result = (value - 1) & 0xFF;
  set(addr, result);

  setFSZ53(result);
  ff.h = !(value & 0x0F) ? FH : 0;
  ff.o = value === BIT7 ? FO : 0;
  ff.n = FN;
}

export function add(operand: number, carry: number = 0) {
  const a = get(A);
  const sum = a + operand + carry;
  const result = sum & 0xFF;
  set(A, result);

  setFSZ53(result);
  ff.h = (a ^ operand ^ result) & FH;
  ff.o = ((a ^ ~operand) & (a ^ result) & FS) >> 5;
  ff.n = 0;
  ff.c = (sum >> 8) & FC;
}

export function sub(operand: number, carry: number = 0) {
  const a = get(A);
  const diff = a - operand - carry;
  const result = diff & 0xFF;
  set(A, result);

  setFSZ53(result);
  ff.h = (a ^ operand ^ result) & FH;
  ff.o = ((a ^ operand) & (a ^ result) & FS) >> 5;
  ff.n = FN;
  ff.c = (diff >> 8) & FC;
}

export function cp(operand: number) {
  const a = get(A);
  const diff = a - operand;
  const result = diff & 0xFF;

  ff.s = result & FS;
  ff.z = result ? 0 : FZ;
  ff.f5 = operand & F5;
  ff.f3 = operand & F3;
  ff.h = (a ^ operand ^ result) & FH;
  ff.o = ((a ^ operand) & (a ^ result) & FS) >> 5;
  ff.n = FN;
  ff.c = (diff >> 8) & FC;
}

export function logic(result: number, fH: number = 0) {
  set(A, result);
  setFSZ53P(result);
  ff.h = fH;
  ff.n = 0;
  ff.c = 0;
}
