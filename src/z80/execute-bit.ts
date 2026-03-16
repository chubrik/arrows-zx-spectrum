import { get8, set8 } from '../common/utils';
import { BIT_b_Rhl, RES_b_Rhl, SET_b_Rhl } from './ops/ops-bit';
import { RL_Rhl, RLC_Rhl, RR_Rhl, RRC_Rhl, SLA_Rhl, SLL_Rhl, SRA_Rhl, SRL_Rhl } from './ops/ops-shift';
import { HLMode } from './types';
import { getMemPosIXIYd, getPosBitDest, getPosRhl, hlMode, next8, refresh, splitOp } from './utils';

/** Bit Instructions (CB) | IX Bit Instructions (DDCB) | IY Bit Instructions (FDCB) */
export function executeBit() {
  let b76, b543, b210: number;
  let srcPos, destPos: Position;

  if (hlMode === HLMode.HL) {
    refresh();
    const op = next8();
    ({ b76, b543, b210 } = splitOp(op));
    srcPos = destPos = getPosRhl(b210);
  }
  else {
    const rawD = next8();
    const op = next8();
    ({ b76, b543, b210 } = splitOp(op));
    srcPos = getMemPosIXIYd(rawD);
    destPos = getPosBitDest(b210) || srcPos;
  }

  const value = get8(srcPos);
  let result: number;

  if (b76 === 0) {
    if (b543 === 0) result = RLC_Rhl(value);
    else if (b543 === 1) result = RRC_Rhl(value);
    else if (b543 === 2) result = RL_Rhl(value);
    else if (b543 === 3) result = RR_Rhl(value);
    else if (b543 === 4) result = SLA_Rhl(value);
    else if (b543 === 5) result = SRA_Rhl(value);
    else if (b543 === 6) result = SLL_Rhl(value);
    else result = SRL_Rhl(value);
  }
  else {
    const bit = 1 << b543;

    if (b76 === 1) {
      BIT_b_Rhl(value, bit);
      return;
    }
    else if (b76 === 2) {
      result = RES_b_Rhl(value, bit);
    }
    else {
      result = SET_b_Rhl(value, bit);
    }
  }

  set8(destPos, result);
}
