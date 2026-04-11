import { mem, write } from '../../hw/mem-state';
import { getF, setF } from '../flags';
import { a, aa, b, ba, c, ca, d, da, e, ea, fa, getH, getHL, getHXY, getL, getLXY, hla, setA, setAa, setB, setBa, setC, setCa, setD, setDa, setE, setEa, setFa, setH, setHL, setHLa, setHXY, setL, setLXY, sp } from '../registers';

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
  const hl_ = getHL();
  setB(ba);
  setC(ca);
  setD(da);
  setE(ea);
  setHL(hla);
  setBa(b_);
  setCa(c_);
  setDa(d_);
  setEa(e_);
  setHLa(hl_);
}

/** EX (SP),HL | EX (SP),IX | EX (SP),IY */
export function EX_sp_HL() {
  const spl = mem[sp];
  const sph = mem[sp + 1];
  write(sp, getLXY());
  write(sp + 1, getHXY());
  setLXY(spl);
  setHXY(sph);
}

/** EX DE,HL (игнорирует DD/FD префикс — всегда D/E/H/L, не HXY/LXY) */
export function EX_DE_HL() {
  const d_ = d;
  const e_ = e;
  setD(getH());
  setE(getL());
  setH(d_);
  setL(e_);
}
