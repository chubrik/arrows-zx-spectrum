import { get, set } from '../../common/utils';
import { F53, FC, FH, FN, FO, FS, FZ, flagsSZ53, flagsSZ53P } from '../flags';
import { A, F } from '../positions';
import { getFC } from '../utils';

/** INC r | INC (HL) | INC (IX+d) | INC (IY+d) */
export function inc(addr: number) {
  const value = get(addr);
  const result = (value + 1) & 0xFF;
  set(addr, result);

  set(F,
    flagsSZ53(result)
    | (!(result & 0x0F) ? FH : 0)
    | (value === 0x7F ? FO : 0)
    | getFC()
  );
}

/** DEC r | DEC (HL) | DEC (IX+d) | DEC (IY+d) */
export function dec(addr: number) {
  const value = get(addr);
  const result = (value - 1) & 0xFF;
  set(addr, result);

  set(F,
    flagsSZ53(result)
    | (!(value & 0x0F) ? FH : 0)
    | (value === 0x80 ? FO : 0)
    | getFC()
    | FN
  );
}

export function add(operand: number, carry: number = 0) {
  const a = get(A);
  const sum = a + operand + carry;
  const result = sum & 0xFF;
  set(A, result);

  set(F,
    flagsSZ53(result)
    | ((a ^ operand ^ result) & FH)
    | (((a ^ ~operand) & (a ^ result) & 0x80) >> 5)
    | ((sum >> 8) & FC)
  );
}

export function sub(operand: number, carry: number = 0) {
  const a = get(A);
  const diff = a - operand - carry;
  const result = diff & 0xFF;
  set(A, result);

  set(F,
    flagsSZ53(result)
    | ((a ^ operand ^ result) & FH)
    | (((a ^ operand) & (a ^ result) & 0x80) >> 5)
    | ((diff >> 8) & FC)
    | FN
  );
}

export function cp(operand: number) {
  const a = get(A);
  const diff = a - operand;
  const result = diff & 0xFF;

  set(F,
    (result & FS) | (result ? 0 : FZ) | (operand & F53)
    | ((a ^ operand ^ result) & FH)
    | (((a ^ operand) & (a ^ result) & 0x80) >> 5)
    | ((diff >> 8) & FC)
    | FN
  );
}

export function logic(result: number, fH: number = 0) {
  set(A, result);
  set(F, flagsSZ53P(result) | fH);
}
