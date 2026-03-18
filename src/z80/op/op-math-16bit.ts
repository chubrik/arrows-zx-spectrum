import { bitFC, bitFH, bitFN, bitFZ, flagsSZ53, maskF53, maskFSZPV } from '../flags';
import { SSSelect } from '../types';
import { getF, getFC, getHL, getSS, setF, setHL, setSS } from '../utils';

/** ADD HL,ss | ADD IX,pp | ADD IY,rr */
export function ADD_HL_SS(select: SSSelect) {
  const hl = getHL();
  const ss = getSS(select);
  const sum = hl + ss;
  const result = sum & 0xFFFF;
  setHL(result);

  setF(
    (getF() & maskFSZPV)
    | ((result >> 8) & maskF53)
    | (((hl ^ ss ^ result) >> 8) & bitFH)
    | ((sum >> 16) & bitFC)
  );
}

/** ADC HL,ss */
export function ADC_HL_SS(select: SSSelect) {
  const hl = getHL();
  const ss = getSS(select);
  const carry = getFC();
  const sum = hl + ss + carry;
  const result = sum & 0xFFFF;
  setHL(result);

  setF(
    flagsSZ53(result >> 8)
    | (result ? 0 : bitFZ)
    | (((hl ^ ss ^ result) >> 8) & bitFH)
    | (((hl ^ ~ss) & (hl ^ result) & 0x8000) >> 13)
    | ((sum >> 16) & bitFC)
  );
}

/** SBC HL,ss */
export function SBC_HL_SS(select: SSSelect) {
  const hl = getHL();
  const ss = getSS(select);
  const carry = getFC();
  const diff = hl - ss - carry;
  const result = diff & 0xFFFF;
  setHL(result);

  setF(
    flagsSZ53(result >> 8)
    | (result ? 0 : bitFZ)
    | (((hl ^ ss ^ result) >> 8) & bitFH)
    | (((hl ^ ss) & (hl ^ result) & 0x8000) >> 13)
    | ((diff >> 16) & bitFC)
    | bitFN
  );
}

/** INC ss | INC IX | INC IY */
export function INC_SS(select: SSSelect) {
  const value = getSS(select);
  const result = (value + 1) & 0xFFFF;
  setSS(select, result);
}

/** DEC ss | DEC IX | DEC IY */
export function DEC_SS(select: SSSelect) {
  const value = getSS(select);
  const result = (value - 1) & 0xFFFF;
  setSS(select, result);
}
