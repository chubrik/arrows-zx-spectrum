import { readPort, writePort } from '../../common/ports';
import { get, get16, set, set16 } from '../../common/utils';
import { F3, F5, FC, ff, FH, flagP, FN, FS, FZ, setFSZ53P } from '../flags';
import { A, B, BC, C, HL } from '../registers';
import { addPC, next } from '../utils';

const ED71_VALUE = 0; // NMOS: 0, CMOS: 255 (undocumented)

/** IN A,(n) */
export function IN_A_n() {
  const a = get(A);
  const n = next();
  const ioAddr = (a << 8) | n;
  set(A, readPort(ioAddr));
}

/** OUT (n),A */
export function OUT_n_A() {
  const n = next();
  const a = get(A);
  const ioAddr = (a << 8) | n;
  writePort(ioAddr, a);
}

/** IN r,(C) | IN (C) (undocumented) */
export function IN_c(reg: number) {
  const ioAddr = get16(BC);
  const value = readPort(ioAddr);
  if (reg) set(reg, value);
  setFSZ53P(value);
  ff.h = 0;
  ff.n = 0;
}

/** OUT (C),r | OUT (C),0 (undocumented) */
export function OUT_c(reg: number) {
  const ioAddr = get16(BC);
  const value = reg ? get(reg) : ED71_VALUE;
  writePort(ioAddr, value);
}

export function inx(increment: 1 | -1, repeat: 0 | 1 = 0) {
  const b = get(B);
  const c = get(C);
  const ioAddr = (b << 8) | c;
  const count = (b - 1) & 0xFF;
  const memAddr = get16(HL);
  const value = readPort(ioAddr);
  set(memAddr, value);
  set(B, count);
  set16(HL, (memAddr + increment) & 0xFFFF);

  const k = value + ((c + increment) & 0xFF);
  const kOverflow = k > 255;

  ff.s = count & FS;
  ff.f5 = count & F5;
  ff.f3 = count & F3;
  ff.z = count ? 0 : FZ;
  ff.h = kOverflow ? FH : 0;
  ff.o = flagP((k & 7) ^ count);
  ff.n = value & FS ? FN : 0;
  ff.c = kOverflow ? FC : 0;

  if (repeat && count)
    addPC(-2);
}

export function outx(increment: 1 | -1, repeat: 0 | 1 = 0) {
  const b = get(B);
  const c = get(C);
  const count = (b - 1) & 0xFF;
  const ioAddr = (count << 8) | c;
  const memAddr = get16(HL);
  const value = get(memAddr);
  writePort(ioAddr, value);
  set(B, count);
  const newHL = (memAddr + increment) & 0xFFFF;
  set16(HL, newHL);

  const k = value + (newHL & 0xFF);
  const kOverflow = k > 255;

  ff.s = count & FS;
  ff.f5 = count & F5;
  ff.f3 = count & F3;
  ff.z = count ? 0 : FZ;
  ff.h = kOverflow ? FH : 0;
  ff.o = flagP((k & 7) ^ count);
  ff.n = value & FS ? FN : 0;
  ff.c = kOverflow ? FC : 0;

  if (repeat && count)
    addPC(-2);
}
