import { mem, write } from '../../hw/mem-state';
import { packF, unpackF } from '../flags';
import { a, aa, b, ba, c, ca, cpu, d, da, e, ea, Fa, H, Ha, HXY, L, La, LXY, setA, setAa, setB, setBa, setC, setCa, setD, setDa, setE, setEa, sp } from '../registers';

/** EX AF,AF' */
export function EX_AF_AF() {
  const a_ = a;
  const f_ = packF();
  setA(aa);
  unpackF(cpu[Fa]);
  setAa(a_);
  cpu[Fa] = f_;
}

/** EXX */
export function EXX() {
  const b_ = b;
  const c_ = c;
  const d_ = d;
  const e_ = e;
  setB(ba);
  setC(ca);
  setD(da);
  setE(ea);
  setBa(b_);
  setCa(c_);
  setDa(d_);
  setEa(e_);

  const h_ = cpu[H];
  const l_ = cpu[L];
  cpu[H] = cpu[Ha];
  cpu[L] = cpu[La];
  cpu[Ha] = h_;
  cpu[La] = l_;
}

/** EX (SP),HL | EX (SP),IX | EX (SP),IY */
export function EX_sp_HL() {
  const spl = mem[sp];
  const sph = mem[sp + 1];
  write(sp, cpu[LXY]);
  write(sp + 1, cpu[HXY]);
  cpu[LXY] = spl;
  cpu[HXY] = sph;
}

/** EX DE,HL (игнорирует DD/FD префикс — всегда D/E/H/L, не HXY/LXY) */
export function EX_DE_HL() {
  const d_ = d;
  const e_ = e;
  setD(cpu[H]);
  setE(cpu[L]);
  cpu[H] = d_;
  cpu[L] = e_;
}
