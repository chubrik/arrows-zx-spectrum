import { get, get16, set16, set88 } from '../../common/utils';
import { F3, F5, FC, ff, FH, FN, FS, FZ } from '../flags';
import { HL, HLXY } from '../registers';
import { next16 } from '../utils';

/** ADD HL,ss | ADD IX,pp | ADD IY,rr */
export function addHLXY(SS: number) {
  const hl = get16(HLXY);
  const ss = get16(SS);
  const sum = hl + ss;
  const result = sum & 0xFFFF;
  set16(HLXY, result);

  ff.f5 = (result >> 8) & F5;
  ff.f3 = (result >> 8) & F3;
  ff.h = ((hl ^ ss ^ result) >> 8) & FH;
  ff.n = 0;
  ff.c = (sum >> 16) & FC;
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
  const sum = hl + ss + ff.c;
  const result = sum & 0xFFFF;
  set16(HL, result);

  ff.s = (result >> 8) & FS;
  ff.z = result ? 0 : FZ;
  ff.f5 = (result >> 8) & F5;
  ff.f3 = (result >> 8) & F3;
  ff.h = ((hl ^ ss ^ result) >> 8) & FH;
  ff.o = ((hl ^ ~ss) & (hl ^ result) & 0x8000) >> 13;
  ff.n = 0;
  ff.c = (sum >> 16) & FC;
}

/** SBC HL,ss */
export function SBC_HL(src: number) {
  const hl = get16(HL);
  const ss = get16(src);
  const diff = hl - ss - ff.c;
  const result = diff & 0xFFFF;
  set16(HL, result);

  ff.s = (result >> 8) & FS;
  ff.z = result ? 0 : FZ;
  ff.f5 = (result >> 8) & F5;
  ff.f3 = (result >> 8) & F3;
  ff.h = ((hl ^ ss ^ result) >> 8) & FH;
  ff.o = ((hl ^ ss) & (hl ^ result) & 0x8000) >> 13;
  ff.n = FN;
  ff.c = (diff >> 16) & FC;
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
