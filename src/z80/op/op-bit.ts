import { F3, F5, FH, FO, FS, FZ, setF3, setF5, setFH, setFN, setFO, setFS, setFZ } from '../flags';

/** BIT b,r | BIT b,(HL) | BIT b,(IX+d) | BIT b,(IY+d) */
export function BIT_b_val(bit: number, value: number, f53Source: number) {
  const isSet = value & bit;

  setFS(isSet & FS);
  setFZ(isSet ? 0 : FZ);
  setF5(f53Source & F5);
  setFH(FH);
  setF3(f53Source & F3);
  setFO(isSet ? 0 : FO);
  setFN(0);
}
