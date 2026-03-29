import { get, get16, set, set16, set88 } from '../../common/utils';
import { F53, FC, FH, FN, FS53, FSZO, FZ } from '../flags';
import { F, HL, HLXY } from '../registers';
import { getFC, next16 } from '../utils';

/** ADD HL,ss | ADD IX,pp | ADD IY,rr */
export function addHLXY(SS: number) {
  const hl = get16(HLXY);
  const ss = get16(SS);
  const sum = hl + ss;
  const result = sum & 0xFFFF;
  set16(HLXY, result);

  set(F,
    (get(F) & FSZO)
    | ((result >> 8) & F53)
    | (((hl ^ ss ^ result) >> 8) & FH)
    | ((sum >> 16) & FC)
  );
}

/** LD (nn),dd */
export function LD_nn_dd(src: number) {
  const destAddr = next16();
  const valueLow = get(src);
  const valueHigh = get(src + 1);
  set88(destAddr, valueLow, valueHigh);
}

/** LD dd,(nn) */
export function LD_dd_nn(dest: number) {
  const srcAddr = next16();
  const valueLow = get(srcAddr);
  const valueHigh = get(srcAddr + 1);
  set88(dest, valueLow, valueHigh);
}

/** ADC HL,ss */
export function ADC_HL(src: number) {
  const hl = get16(HL);
  const ss = get16(src);
  const carry = getFC();
  const sum = hl + ss + carry;
  const result = sum & 0xFFFF;
  set16(HL, result);

  set(F,
    ((result >> 8) & FS53)
    | (result ? 0 : FZ)
    | (((hl ^ ss ^ result) >> 8) & FH)
    | (((hl ^ ~ss) & (hl ^ result) & 0x8000) >> 13)
    | ((sum >> 16) & FC)
  );
}

/** SBC HL,ss */
export function SBC_HL(src: number) {
  const hl = get16(HL);
  const ss = get16(src);
  const carry = getFC();
  const diff = hl - ss - carry;
  const result = diff & 0xFFFF;
  set16(HL, result);

  set(F,
    ((result >> 8) & FS53)
    | (result ? 0 : FZ)
    | (((hl ^ ss ^ result) >> 8) & FH)
    | (((hl ^ ss) & (hl ^ result) & 0x8000) >> 13)
    | ((diff >> 16) & FC)
    | FN
  );
}

export function inc16(addr: number) {
  const value = get16(addr);
  const result = (value + 1) & 0xFFFF;
  set16(addr, result);
}

export function dec16(addr: number) {
  const value = get16(addr);
  const result = (value - 1) & 0xFFFF;
  set16(addr, result);
}
