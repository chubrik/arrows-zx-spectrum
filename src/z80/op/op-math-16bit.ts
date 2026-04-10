import { xFFFF } from '../../hw/constants';
import { F3, F5, FC, fc, FH, FN, FS, FZ, setF3, setF5, setFC, setFH, setFN, setFP, setFS, setFZ } from '../flags';
import { getHL, getHLXY, setHL, setHLXY } from '../registers';

/** ADD HL,ss | ADD IX,pp | ADD IY,rr */
export function ADD_HL(rr: number) {
  const hlxy = getHLXY();
  const sum = hlxy + rr;
  const result = sum & xFFFF;
  setHLXY(result);

  const resultHi = result >> 8;
  setF5(resultHi & F5);
  setF3(resultHi & F3);
  setFH(((hlxy ^ rr ^ result) >> 8) & FH);
  setFN(0);
  setFC((sum >> 16) & FC);
}

/** ADC HL,ss */
export function ADC_HL(rr: number) {
  const hl = getHL();
  const sum = hl + rr + fc;
  const result = sum & xFFFF;
  setHL(result);

  const resultHi = result >> 8;
  setFS(resultHi & FS);
  setFZ(result ? 0 : FZ);
  setF5(resultHi & F5);
  setF3(resultHi & F3);
  setFH(((hl ^ rr ^ result) >> 8) & FH);
  setFP(((hl ^ ~rr) & (hl ^ result) & 0x8000) >> 13);
  setFN(0);
  setFC((sum >> 16) & FC);
}

/** SBC HL,ss */
export function SBC_HL(rr: number) {
  const hl = getHL();
  const diff = hl - rr - fc;
  const result = diff & xFFFF;
  setHL(result);

  const resultHi = result >> 8;
  const hlXorRr = hl ^ rr;
  setFS(resultHi & FS);
  setFZ(result ? 0 : FZ);
  setF5(resultHi & F5);
  setF3(resultHi & F3);
  setFH(((hlXorRr ^ result) >> 8) & FH);
  setFP((hlXorRr & (hl ^ result) & 0x8000) >> 13);
  setFN(FN);
  setFC((diff >> 16) & FC);
}
