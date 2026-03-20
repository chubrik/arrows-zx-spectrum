import { get8, set8 } from '../common/utils';
import { BIT_b_val, RES_b_val, SET_b_val } from './op/op-bit';
import { RL_val, RLC_val, RR_val, RRC_val, SLA_val, SLL_val, SRA_val, SRL_val } from './op/op-shift';
import { HLMode } from './types';
import { getMemPosIXIYd, getPosReg, getPosRhl, hlMode, next8, refresh, splitOp } from './utils';

/** Bit Instructions (CB) | IX Bit Instructions (DDCB) | IY Bit Instructions (FDCB) */
export function executeBit() {
  let b76, b543, b210: number;
  let srcPos: Position;
  let destPos: Position | 0 = 0;

  if (hlMode === HLMode.HL) {
    refresh();
    const op = next8();
    ({ b76, b543, b210 } = splitOp(op));
    srcPos = getPosRhl(b210);
  }
  else {
    const rawD = next8();
    const op = next8();
    ({ b76, b543, b210 } = splitOp(op));
    srcPos = getMemPosIXIYd(rawD);
    destPos = getPosReg(b210);
  }

  const value = get8(srcPos);
  let result: number;

  if (b76 === 0) {
    if (b543 === 0) result = RLC_val(value);
    else if (b543 === 1) result = RRC_val(value);
    else if (b543 === 2) result = RL_val(value);
    else if (b543 === 3) result = RR_val(value);
    else if (b543 === 4) result = SLA_val(value);
    else if (b543 === 5) result = SRA_val(value);
    else if (b543 === 6) result = SLL_val(value);
    else result = SRL_val(value);
  }
  else {
    const bit = 1 << b543;

    if (b76 === 1) {
      BIT_b_val(bit, value);
      return;
    }
    else if (b76 === 2) {
      result = RES_b_val(bit, value);
    }
    else {
      result = SET_b_val(bit, value);
    }
  }

  set8(srcPos, result);

  if (destPos)
    set8(destPos, result);
}
