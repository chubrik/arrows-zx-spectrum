import { read16, write16 } from '../../common/memory';
import { getF, setF } from '../flags';
import {
  a, aa, b, ba, c, ca, d, da, e, ea, fa, getDE, hla, hlxy, setA, setAa, setB, setBa, setC, setCa,
  setD, setDa, setDE, setE, setEa, setFa, setHLa, setHLXY, sp
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
  const hlxy_ = read16(sp);
  write16(sp, hlxy);
  setHLXY(hlxy_);
}

/** EX DE,HL */
export function EX_DE_HL() {
  const de = getDE();
  setDE(hlxy);
  setHLXY(de);
}
