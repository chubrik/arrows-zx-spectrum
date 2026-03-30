import { readPort, writePort } from '../../common/ports';
import { get, set } from '../../common/utils';
import { F3, F5, FC, FH, flagP, FN, FS, FZ, setF3, setF5, setFC, setFH, setFN, setFO, setFS, setFSZ53P, setFZ } from '../flags';
import { A, B, BC, C, getReg16, HL, regs, setReg16 } from '../registers';
import { addPC, next } from '../utils';

const ED71_VALUE = 0; // NMOS: 0, CMOS: 255 (undocumented)

/** IN A,(n) */
export function IN_A_n() {
  const a = regs[A];
  const n = next();
  const ioAddr = (a << 8) | n;
  regs[A] = readPort(ioAddr);
}

/** OUT (n),A */
export function OUT_n_A() {
  const n = next();
  const a = regs[A];
  const ioAddr = (a << 8) | n;
  writePort(ioAddr, a);
}

/** IN r,(C) | IN (C) (undocumented) */
export function IN_c(reg: number) {
  const ioAddr = getReg16(BC);
  const value = readPort(ioAddr);
  if (reg) regs[reg] = value;

  setFSZ53P(value);
  setFH(0);
  setFN(0);
}

/** OUT (C),r | OUT (C),0 (undocumented) */
export function OUT_c(reg: number) {
  const ioAddr = getReg16(BC);
  const value = reg ? regs[reg] : ED71_VALUE;
  writePort(ioAddr, value);
}

export function inx(increment: 1 | -1, repeat: 0 | 1 = 0) {
  const b = regs[B];
  const c = regs[C];
  const ioAddr = (b << 8) | c;
  const count = (b - 1) & 0xFF;
  const memAddr = getReg16(HL);
  const value = readPort(ioAddr);
  set(memAddr, value);
  regs[B] = count;
  setReg16(HL, (memAddr + increment) & 0xFFFF);

  const k = value + ((c + increment) & 0xFF);
  const kOverflow = k > 255;
  setFS(count & FS);
  setF5(count & F5);
  setF3(count & F3);
  setFZ(count ? 0 : FZ);
  setFH(kOverflow ? FH : 0);
  setFO(flagP((k & 7) ^ count));
  setFN(value & FS ? FN : 0);
  setFC(kOverflow ? FC : 0);

  if (repeat && count)
    addPC(-2);
}

export function outx(increment: 1 | -1, repeat: 0 | 1 = 0) {
  const b = regs[B];
  const c = regs[C];
  const count = (b - 1) & 0xFF;
  const ioAddr = (count << 8) | c;
  const memAddr = getReg16(HL);
  const value = get(memAddr);
  writePort(ioAddr, value);
  regs[B] = count;
  const newHL = (memAddr + increment) & 0xFFFF;
  setReg16(HL, newHL);

  const k = value + (newHL & 0xFF);
  const kOverflow = k > 255;
  setFS(count & FS);
  setF5(count & F5);
  setF3(count & F3);
  setFZ(count ? 0 : FZ);
  setFH(kOverflow ? FH : 0);
  setFO(flagP((k & 7) ^ count));
  setFN(value & FS ? FN : 0);
  setFC(kOverflow ? FC : 0);

  if (repeat && count)
    addPC(-2);
}
