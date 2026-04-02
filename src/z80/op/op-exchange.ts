import { mem, write } from '../../common/memory';
import { packF, unpackF } from '../flags';
import { A, Aa, B, Ba, C, Ca, cpu, D, Da, E, Ea, Fa, H, Ha, HXY, L, La, LXY, SP, SPv } from '../registers';

/** EX AF,AF' */
export function EX_AF_AF() {
  const a1 = cpu[A];
  const f1 = packF();
  const a2 = cpu[Aa];
  const f2 = cpu[Fa];
  cpu[A] = a2;
  unpackF(f2);
  cpu[Aa] = a1;
  cpu[Fa] = f1;
}

/** EXX */
export function EXX() {
  const b1 = cpu[B];
  const c1 = cpu[C];
  const d1 = cpu[D];
  const e1 = cpu[E];
  const h1 = cpu[H];
  const l1 = cpu[L];
  const b2 = cpu[Ba];
  const c2 = cpu[Ca];
  const d2 = cpu[Da];
  const e2 = cpu[Ea];
  const h2 = cpu[Ha];
  const l2 = cpu[La];
  cpu[B] = b2;
  cpu[C] = c2;
  cpu[D] = d2;
  cpu[E] = e2;
  cpu[H] = h2;
  cpu[L] = l2;
  cpu[Ba] = b1;
  cpu[Ca] = c1;
  cpu[Da] = d1;
  cpu[Ea] = e1;
  cpu[Ha] = h1;
  cpu[La] = l1;
}

/** EX (SP),HL | EX (SP),IX | EX (SP),IY */
export function EX_sp_HL() {
  const spl = mem[SPv];
  const sph = mem[SPv + 1];
  const lxy = cpu[LXY];
  const hxy = cpu[HXY];
  write(SPv, lxy);
  write(SPv + 1, hxy);
  cpu[LXY] = spl;
  cpu[HXY] = sph;
}

/** EX DE,HL */
export function EX_DE_HL() {
  const d1 = cpu[D];
  const e1 = cpu[E];
  const h1 = cpu[H];
  const l1 = cpu[L];
  cpu[D] = h1;
  cpu[E] = l1;
  cpu[H] = d1;
  cpu[L] = e1;
}
