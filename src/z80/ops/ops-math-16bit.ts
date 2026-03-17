import { SSSelect } from '../types';
import { f53, fC, fH, flagsSZ53, fN, fSZPV, fZ, getF, getFC, getHL, getSS, setF, setHL, setSS } from '../utils';

/** ADD HL,ss | ADD IX,pp | ADD IY,rr */
export function ADD_HL_SS(src: SSSelect) {
  const hl = getHL();
  const ss = getSS(src);
  const sum = hl + ss;
  const result = sum & 0xFFFF;
  setHL(result);

  setF(
    (getF() & fSZPV)
    | ((result >> 8) & f53)
    | (((hl ^ ss ^ result) >> 8) & fH)
    | ((sum >> 16) & fC)
  );
}

/** ADC HL,ss */
export function ADC_HL_SS(src: SSSelect) {
  const hl = getHL();
  const ss = getSS(src);
  const c = getFC();
  const sum = hl + ss + c;
  const result = sum & 0xFFFF;
  setHL(result);

  setF(
    flagsSZ53(result >> 8)
    | (result ? 0 : fZ)
    | (((hl ^ ss ^ result) >> 8) & fH)
    | (((hl ^ ~ss) & (hl ^ result) & 0x8000) >> 13)
    | ((sum >> 16) & fC)
  );
}

/** SBC HL,ss */
export function SBC_HL_SS(src: SSSelect) {
  const hl = getHL();
  const ss = getSS(src);
  const c = getFC();
  const diff = hl - ss - c;
  const result = diff & 0xFFFF;
  setHL(result);

  setF(
    flagsSZ53(result >> 8)
    | (result ? 0 : fZ)
    | (((hl ^ ss ^ result) >> 8) & fH)
    | (((hl ^ ss) & (hl ^ result) & 0x8000) >> 13)
    | ((diff >> 16) & fC)
    | fN
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
