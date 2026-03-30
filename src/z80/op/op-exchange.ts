import { read, write } from '../../common/memory';
import { packF, unpackF } from '../flags';
import { A, Aa, B, Ba, C, Ca, D, Da, E, Ea, Fa, get16, H, Ha, HXY, L, La, LXY, regs, SP } from '../registers';

/** EX AF,AF' */
export function EX_AF_AF() {
  const a1 = regs[A];
  const f1 = packF();
  const a2 = regs[Aa];
  const f2 = regs[Fa];
  regs[A] = a2;
  unpackF(f2);
  regs[Aa] = a1;
  regs[Fa] = f1;
}

/** EXX */
export function EXX() {
  const b1 = regs[B];
  const c1 = regs[C];
  const d1 = regs[D];
  const e1 = regs[E];
  const h1 = regs[H];
  const l1 = regs[L];
  const b2 = regs[Ba];
  const c2 = regs[Ca];
  const d2 = regs[Da];
  const e2 = regs[Ea];
  const h2 = regs[Ha];
  const l2 = regs[La];
  regs[B] = b2;
  regs[C] = c2;
  regs[D] = d2;
  regs[E] = e2;
  regs[H] = h2;
  regs[L] = l2;
  regs[Ba] = b1;
  regs[Ca] = c1;
  regs[Da] = d1;
  regs[Ea] = e1;
  regs[Ha] = h1;
  regs[La] = l1;
}

/** EX (SP),HL | EX (SP),IX | EX (SP),IY */
export function EX_sp_HL() {
  const sp = get16(SP);
  const spl = read(sp);
  const sph = read(sp + 1);
  const lxy = regs[LXY];
  const hxy = regs[HXY];
  write(sp, lxy);
  write(sp + 1, hxy);
  regs[LXY] = spl;
  regs[HXY] = sph;
}

/** EX DE,HL */
export function EX_DE_HL() {
  const d1 = regs[D];
  const e1 = regs[E];
  const h1 = regs[H];
  const l1 = regs[L];
  regs[D] = h1;
  regs[E] = l1;
  regs[H] = d1;
  regs[L] = e1;
}
