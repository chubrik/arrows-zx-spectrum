import { readMem8, writeMem8 } from '../../common/memory';
import { readPort, writePort } from '../../common/ports';
import { get8, set8 } from '../../common/utils';
import { bitFC, bitFH, bitFN, bitFZ, flagP, flagsSZ53P, maskFS53 } from '../flags';
import { RegSelect } from '../types';
import { getA, getB, getBC, getC, getFC, getHL, getPosReg, incPC, next8, setA, setB, setF, setHL } from '../utils';

const hED71_value = 0; // NMOS: 0, CMOS: 255 (undocumented)

/** IN A,(n) */
export function IN_A_n() {
  const a = getA();
  const n = next8();
  const ioAddr = (a << 8) | n;
  const value = readPort(ioAddr);
  setA(value);
}

/** OUT (n),A */
export function OUT_n_A() {
  const n = next8();
  const value = getA();
  const ioAddr = (value << 8) | n;
  writePort(ioAddr, value);
}

/** IN r,(C) | IN (C) (undocumented) */
export function IN_Reg_c(select: RegSelect) {
  const ioAddr = getBC();
  const posReg = getPosReg(select);
  const value = readPort(ioAddr);
  if (posReg) set8(posReg, value);
  setF(flagsSZ53P(value) | getFC());
}

/** OUT (C),r | OUT (C),0 (undocumented) */
export function OUT_c_Reg(select: RegSelect) {
  const ioAddr = getBC();
  const posReg = getPosReg(select);
  const value = posReg ? get8(posReg) : hED71_value;
  writePort(ioAddr, value);
}

/** INI */
export function INI() {
  inx(+1);
}

/** INIR */
export function INIR() {
  inx(+1, true);
}

/** IND */
export function IND() {
  inx(-1);
}

/** INDR */
export function INDR() {
  inx(-1, true);
}

/** OUTI */
export function OUTI() {
  outx(+1);
}

/** OTIR */
export function OTIR() {
  outx(+1, true);
}

/** OUTD */
export function OUTD() {
  outx(-1);
}

/** OTDR */
export function OTDR() {
  outx(-1, true);
}

function inx(increment: 1 | -1, repeat: boolean = false) {
  const b = getB();
  const c = getC();
  const ioAddr = (b << 8) | c;
  const count = (b - 1) & 0xFF;
  const memAddr = getHL();
  const value = readPort(ioAddr);
  writeMem8(memAddr, value);
  setB(count);
  setHL((memAddr + increment) & 0xFFFF);

  const k = value + ((c + increment) & 0xFF);

  setF(
    (count & maskFS53)
    | (count ? 0 : bitFZ)
    | (k > 255 ? bitFH | bitFC : 0)
    | flagP((k & 7) ^ count)
    | (value & 0x80 ? bitFN : 0));

  if (repeat && count)
    incPC(-2);
}

function outx(increment: 1 | -1, repeat: boolean = false) {
  const b = getB();
  const c = getC();
  const count = (b - 1) & 0xFF;
  const ioAddr = (count << 8) | c;
  const memAddr = getHL();
  const value = readMem8(memAddr);
  writePort(ioAddr, value);
  setB(count);
  const newHL = (memAddr + increment) & 0xFFFF;
  setHL(newHL);

  const k = value + (newHL & 0xFF);

  setF(
    (count & maskFS53)
    | (count ? 0 : bitFZ)
    | (k > 255 ? bitFH | bitFC : 0)
    | flagP((k & 7) ^ count)
    | (value & 0x80 ? bitFN : 0));

  if (repeat && count)
    incPC(-2);
}
