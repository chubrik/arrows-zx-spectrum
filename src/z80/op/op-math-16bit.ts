import { F3, F5, FC, fc, FH, FN, FS, FZ, setF3, setF5, setFC, setFH, setFN, setFP, setFS, setFZ } from '../flags';
import { get16, HL, HLXY, set16 } from '../registers';

/** ADD HL,ss | ADD IX,pp | ADD IY,rr */
export function ADD_HL(reg: number) {
  const hlxy = get16(HLXY);
  const r = get16(reg);
  const sum = hlxy + r;
  const result = sum & 0xFFFF;
  set16(HLXY, result);

  setF5((result >> 8) & F5);
  setF3((result >> 8) & F3);
  setFH(((hlxy ^ r ^ result) >> 8) & FH);
  setFN(0);
  setFC((sum >> 16) & FC);
}

/** ADC HL,ss */
export function ADC_HL(reg: number) {
  const hl = get16(HL);
  const r = get16(reg);
  const sum = hl + r + fc;
  const result = sum & 0xFFFF;
  set16(HL, result);

  setFS((result >> 8) & FS);
  setFZ(result ? 0 : FZ);
  setF5((result >> 8) & F5);
  setF3((result >> 8) & F3);
  setFH(((hl ^ r ^ result) >> 8) & FH);
  setFP(((hl ^ ~r) & (hl ^ result) & 0x8000) >> 13);
  setFN(0);
  setFC((sum >> 16) & FC);
}

/** SBC HL,ss */
export function SBC_HL(reg: number) {
  const hl = get16(HL);
  const r = get16(reg);
  const diff = hl - r - fc;
  const result = diff & 0xFFFF;
  set16(HL, result);

  setFS((result >> 8) & FS);
  setFZ(result ? 0 : FZ);
  setF5((result >> 8) & F5);
  setF3((result >> 8) & F3);
  setFH(((hl ^ r ^ result) >> 8) & FH);
  setFP(((hl ^ r) & (hl ^ result) & 0x8000) >> 13);
  setFN(FN);
  setFC((diff >> 16) & FC);
}
