import { xFFFF } from '../../hw/constants';
import { F53, FC, fc, FH, FN, FS, FZ, setF53, setFC, setFH, setFN, setFP, setFS, setFZ } from '../flags';
import { hlxy, setHLXY } from '../registers';

/** ADD HL,ss | ADD IX,pp | ADD IY,rr */
export function ADD_HL(rr: number) {
  const sum = hlxy + rr;
  const result = sum & xFFFF;

  setF53((result >> 8) & F53);
  setFH(((hlxy ^ rr ^ result) >> 8) & FH);
  setFN(0);
  setFC((sum >> 16) & FC);

  setHLXY(result);
}

/** ADC HL,ss */
export function ADC_HL(rr: number) {
  const sum = hlxy + rr + fc;
  const result = sum & xFFFF;

  const resultHi = result >> 8;
  setFS(resultHi & FS);
  setFZ(result ? 0 : FZ);
  setF53(resultHi & F53);
  setFH(((hlxy ^ rr ^ result) >> 8) & FH);
  setFP(((hlxy ^ ~rr) & (hlxy ^ result) & 0x8000) >> 13);
  setFN(0);
  setFC((sum >> 16) & FC);

  setHLXY(result);
}

/** SBC HL,ss */
export function SBC_HL(rr: number) {
  const diff = hlxy - rr - fc;
  const result = diff & xFFFF;

  const resultHi = result >> 8;
  const hlXorRr = hlxy ^ rr;
  setFS(resultHi & FS);
  setFZ(result ? 0 : FZ);
  setF53(resultHi & F53);
  setFH(((hlXorRr ^ result) >> 8) & FH);
  setFP((hlXorRr & (hlxy ^ result) & 0x8000) >> 13);
  setFN(FN);
  setFC((diff >> 16) & FC);

  setHLXY(result);
}
