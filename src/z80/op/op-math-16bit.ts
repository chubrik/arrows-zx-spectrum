import { get, set88 } from '../../common/utils';
import { F3, F5, FC, fc, FH, FN, FS, FZ, setF3, setF5, setFC, setFH, setFN, setFO, setFS, setFZ } from '../flags';
import { getReg16, HL, HLXY, regs, setReg16, setReg88 } from '../registers';
import { next16 } from '../utils';

/** ADD HL,ss | ADD IX,pp | ADD IY,rr */
export function addHLXY(SS: number) {
  const hl = getReg16(HLXY);
  const ss = getReg16(SS);
  const sum = hl + ss;
  const result = sum & 0xFFFF;
  setReg16(HLXY, result);

  setF5((result >> 8) & F5);
  setF3((result >> 8) & F3);
  setFH(((hl ^ ss ^ result) >> 8) & FH);
  setFN(0);
  setFC((sum >> 16) & FC);
}

/** LD (nn),dd */
export function LD_nn_dd(src: number) {
  const destAddr = next16();
  const valueLow = regs[src];
  const valueHigh = regs[src + 1];
  set88(destAddr, valueLow, valueHigh);
}

/** LD dd,(nn) */
export function LD_dd_nn(reg: number) {
  const srcAddr = next16();
  const valueLow = get(srcAddr);
  const valueHigh = get(srcAddr + 1);
  setReg88(reg, valueLow, valueHigh);
}

/** ADC HL,ss */
export function ADC_HL(src: number) {
  const hl = getReg16(HL);
  const ss = getReg16(src);
  const sum = hl + ss + fc;
  const result = sum & 0xFFFF;
  setReg16(HL, result);

  setFS((result >> 8) & FS);
  setFZ(result ? 0 : FZ);
  setF5((result >> 8) & F5);
  setF3((result >> 8) & F3);
  setFH(((hl ^ ss ^ result) >> 8) & FH);
  setFO(((hl ^ ~ss) & (hl ^ result) & 0x8000) >> 13);
  setFN(0);
  setFC((sum >> 16) & FC);
}

/** SBC HL,ss */
export function SBC_HL(src: number) {
  const hl = getReg16(HL);
  const ss = getReg16(src);
  const diff = hl - ss - fc;
  const result = diff & 0xFFFF;
  setReg16(HL, result);

  setFS((result >> 8) & FS);
  setFZ(result ? 0 : FZ);
  setF5((result >> 8) & F5);
  setF3((result >> 8) & F3);
  setFH(((hl ^ ss ^ result) >> 8) & FH);
  setFO(((hl ^ ss) & (hl ^ result) & 0x8000) >> 13);
  setFN(FN);
  setFC((diff >> 16) & FC);
}

export function incReg16(reg: number) {
  const value = getReg16(reg);
  const result = (value + 1) & 0xFFFF;
  setReg16(reg, result);
}

export function decReg16(reg: number) {
  const value = getReg16(reg);
  const result = (value - 1) & 0xFFFF;
  setReg16(reg, result);
}
