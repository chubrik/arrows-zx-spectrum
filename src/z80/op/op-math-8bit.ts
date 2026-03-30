import { get, set } from '../../common/utils';
import { ff, setFSZ53, setFSZ53P } from '../flags';
import { A } from '../registers';

/** INC r | INC (HL) | INC (IX+d) | INC (IY+d) */
export function inc(addr: number) {
  const value = get(addr);
  const result = (value + 1) & 0xFF;
  set(addr, result);

  setFSZ53(result);
  ff.h = !(result & 0x0F) ? 0x10 : 0;
  ff.o = value === 0x7F ? 0x04 : 0;
  ff.n = 0;
}

/** DEC r | DEC (HL) | DEC (IX+d) | DEC (IY+d) */
export function dec(addr: number) {
  const value = get(addr);
  const result = (value - 1) & 0xFF;
  set(addr, result);

  setFSZ53(result);
  ff.h = !(value & 0x0F) ? 0x10 : 0;
  ff.o = value === 0x80 ? 0x04 : 0;
  ff.n = 0x02;
}

export function add(operand: number, carry: number = 0) {
  const a = get(A);
  const sum = a + operand + carry;
  const result = sum & 0xFF;
  set(A, result);

  setFSZ53(result);
  ff.h = (a ^ operand ^ result) & 0x10;
  ff.o = ((a ^ ~operand) & (a ^ result) & 0x80) >> 5;
  ff.n = 0;
  ff.c = (sum >> 8) & 0x01;
}

export function sub(operand: number, carry: number = 0) {
  const a = get(A);
  const diff = a - operand - carry;
  const result = diff & 0xFF;
  set(A, result);

  setFSZ53(result);
  ff.h = (a ^ operand ^ result) & 0x10;
  ff.o = ((a ^ operand) & (a ^ result) & 0x80) >> 5;
  ff.n = 0x02;
  ff.c = (diff >> 8) & 0x01;
}

export function cp(operand: number) {
  const a = get(A);
  const diff = a - operand;
  const result = diff & 0xFF;

  ff.s  = result & 0x80;
  ff.z  = result ? 0 : 0x40;
  ff.f5 = operand & 0x20;
  ff.f3 = operand & 0x08;
  ff.h  = (a ^ operand ^ result) & 0x10;
  ff.o  = ((a ^ operand) & (a ^ result) & 0x80) >> 5;
  ff.n  = 0x02;
  ff.c  = (diff >> 8) & 0x01;
}

export function logic(result: number, fH: number = 0) {
  set(A, result);
  setFSZ53P(result);
  ff.h = fH;
  ff.n = 0;
  ff.c = 0;
}
