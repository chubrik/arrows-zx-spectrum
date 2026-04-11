import { mem, write16 } from '../../hw/mem-state';
import { getF, setF } from '../flags';
import {
  a, aa, b, ba, c, ca, d, da, e, ea, fa, getDE, getHXY, getLXY, hla, hlxy, setA, setAa, setB, setBa,
  setC, setCa, setD, setDa, setDE, setE, setEa, setFa, setHLa, setHLXY, sp
} from '../registers';

/** EX AF,AF' */
export function EX_AF_AF() {
  const a_ = a;
  const f_ = getF();
  setA(aa);
  setF(fa);
  setAa(a_);
  setFa(f_);
}

/** EXX */
export function EXX() {
  const b_ = b;
  const c_ = c;
  const d_ = d;
  const e_ = e;
  const hl_ = hlxy;
  setB(ba);
  setC(ca);
  setD(da);
  setE(ea);
  setHLXY(hla);
  setBa(b_);
  setCa(c_);
  setDa(d_);
  setEa(e_);
  setHLa(hl_);
}

/** EX (SP),HL | EX (SP),IX | EX (SP),IY */
export function EX_sp_HL() {
  const hlxy_ = mem[sp] | (mem[sp + 1] << 8);
  write16(sp, getLXY(), getHXY());
  setHLXY(hlxy_);
}

/** EX DE,HL (игнорирует DD/FD префикс — всегда D/E/H/L, не HXY/LXY) */
export function EX_DE_HL() {
  const de = getDE();
  setDE(hlxy);
  setHLXY(de);
}
