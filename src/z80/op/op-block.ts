import { xFF, xFFFF } from '../../hw/constants';
import { mem, write } from '../../hw/mem-state';
import { readPort, writePort } from '../../hw/ports';
import { calcFP, F3, F5, F53, FC, FH, FN, FP, FS, FZ, setF53, setFC, setFH, setFN, setFP, setFS, setFZ } from '../flags';
import { a, b, c, decBC, decDE, decHLXY, getDE, hlxy, incDE, incHLXY, pc, setB, setHLXY, setPC } from '../registers';

/** LDI | LDD | LDIR | LDDR */
export function LD_block(inc: 1 | 0, repeat: 0 | 1 = 0) {
  const de = getDE();
  const value = mem[hlxy];
  decBC();
  if (inc) { incDE(); incHLXY(); }
  else { decDE(); decHLXY(); }
  write(de, value);

  const n = (a + value) & xFF;
  const cORb = c || b;
  setF53(((n << 4) & F5) | (n & F3));
  setFH(0);
  setFP(cORb ? FP : 0);
  setFN(0);

  if (repeat && cORb)
    setPC((pc - 2) & xFFFF);
}

/** CPI | CPD | CPIR | CPDR */
export function CP_block(inc: 1 | 0, repeat: 0 | 1 = 0) {
  const value = mem[hlxy];
  decBC();
  if (inc) { incHLXY(); }
  else { decHLXY(); }

  const diff = (a - value) & xFF;
  const newFh = (a ^ value ^ diff) & FH;
  const n = (diff - (newFh ? 1 : 0)) & xFF;
  const cORb = c || b;
  setFS(diff & FS);
  setFZ(diff ? 0 : FZ);
  setF53(((n << 4) & F5) | (n & F3));
  setFH(newFh);
  setFP(cORb ? FP : 0);
  setFN(FN);

  if (repeat && cORb && diff)
    setPC((pc - 2) & xFFFF);
}

/** INI | IND | INIR | INDR */
export function IN_block(inc: 1 | -1, repeat: 0 | 1 = 0) {
  const count = (b - 1) & xFF;
  const value = readPort(c, count);
  setB(count);
  write(hlxy, value);
  setHLXY((hlxy + inc) & xFFFF);

  const k = value + ((c + inc) & xFF);
  const kOverflow = k > 255;
  setFS(count & FS);
  setF53(count & F53);
  setFZ(count ? 0 : FZ);
  setFH(kOverflow ? FH : 0);
  calcFP((k & 7) ^ count);
  setFN(value & FS ? FN : 0);
  setFC(kOverflow ? FC : 0);

  if (repeat && count)
    setPC((pc - 2) & xFFFF);
}

/** OUTI | OUTD | OTIR | OTDR */
export function OUT_block(inc: 1 | -1, repeat: 0 | 1 = 0) {
  const count = (b - 1) & xFF;
  const newHL = (hlxy + inc) & xFFFF;
  const value = mem[hlxy];
  setB(count);
  setHLXY(newHL);
  writePort(c, count, value);

  const k = value + (newHL & xFF);
  const kOverflow = k > 255;
  setFS(count & FS);
  setF53(count & F53);
  setFZ(count ? 0 : FZ);
  setFH(kOverflow ? FH : 0);
  calcFP((k & 7) ^ count);
  setFN(value & FS ? FN : 0);
  setFC(kOverflow ? FC : 0);

  if (repeat && count)
    setPC((pc - 2) & xFFFF);
}
