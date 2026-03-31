import { xFF, xFFFF } from '../../common/constants';
import { mem, write } from '../../common/memory';
import { readPort, writePort } from '../../common/ports';
import { calcFP, F3, F5, FC, FH, FN, FP, FS, FZ, setF3, setF5, setFC, setFH, setFN, setFP, setFS, setFZ } from '../flags';
import { A, B, BC, C, cpu, DE, get16, HL, HLXY, set16 } from '../registers';
import { incPC } from '../utils';

/** LDI | LDD | LDIR | LDDR */
export function LD_block(inc: 1 | -1, repeat: 0 | 1 = 0) {
  const a = cpu[A];
  const bc = get16(BC);
  const de = get16(DE);
  const hlxy = get16(HLXY);
  const count = (bc - 1) & xFFFF;
  const value = mem[hlxy];
  set16(BC, count);
  set16(DE, (de + inc) & xFFFF);
  set16(HLXY, (hlxy + inc) & xFFFF);
  write(de, value);

  const n = (a + value) & xFF;
  setF5((n & 0x02) << 4);
  setF3(n & F3);
  setFH(0);
  setFP(count ? FP : 0);
  setFN(0);

  if (repeat && count)
    incPC(-2);
}

/** CPI | CPD | CPIR | CPDR */
export function CP_block(inc: 1 | -1, repeat: 0 | 1 = 0) {
  const a = cpu[A];
  const bc = get16(BC);
  const hlxy = get16(HLXY);
  const count = (bc - 1) & xFFFF;
  const value = mem[hlxy];
  set16(BC, count);
  set16(HLXY, (hlxy + inc) & xFFFF);

  const diff = (a - value) & xFF;
  const fh = (a ^ value ^ diff) & FH;
  const n = (diff - (fh ? 1 : 0)) & xFF;
  setFS(diff & FS);
  setFZ(diff ? 0 : FZ);
  setF5((n & 0x02) << 4);
  setFH(fh);
  setF3(n & F3);
  setFP(count ? FP : 0);
  setFN(FN);

  if (repeat && count && diff)
    incPC(-2);
}

/** INI | IND | INIR | INDR */
export function IN_block(inc: 1 | -1, repeat: 0 | 1 = 0) {
  const b = cpu[B];
  const c = cpu[C];
  const hl = get16(HL);
  const count = (b - 1) & xFF;
  const newHL = (hl + inc) & xFFFF;
  const ioAddr = (b << 8) | c;
  const value = readPort(ioAddr);
  cpu[B] = count;
  set16(HL, newHL);
  write(hl, value);

  const k = value + ((c + inc) & xFF);
  const kOverflow = k > 255;
  setFS(count & FS);
  setF5(count & F5);
  setF3(count & F3);
  setFZ(count ? 0 : FZ);
  setFH(kOverflow ? FH : 0);
  calcFP((k & 7) ^ count);
  setFN(value & FS ? FN : 0);
  setFC(kOverflow ? FC : 0);

  if (repeat && count)
    incPC(-2);
}

/** OUTI | OUTD | OTIR | OTDR */
export function OUT_block(inc: 1 | -1, repeat: 0 | 1 = 0) {
  const b = cpu[B];
  const c = cpu[C];
  const hl = get16(HL);
  const count = (b - 1) & xFF;
  const newHL = (hl + inc) & xFFFF;
  const ioAddr = (count << 8) | c;
  const value = mem[hl];
  cpu[B] = count;
  set16(HL, newHL);
  writePort(ioAddr, value);

  const k = value + (newHL & xFF);
  const kOverflow = k > 255;
  setFS(count & FS);
  setF5(count & F5);
  setF3(count & F3);
  setFZ(count ? 0 : FZ);
  setFH(kOverflow ? FH : 0);
  calcFP((k & 7) ^ count);
  setFN(value & FS ? FN : 0);
  setFC(kOverflow ? FC : 0);

  if (repeat && count)
    incPC(-2);
}
