import { mem, write } from '../../common/memory';
import { packF, unpackF } from '../flags';
import { A, Aa, B, Ba, C, Ca, cpu, D, Da, E, Ea, Fa, H, Ha, HXY, L, La, LXY, sp } from '../registers';

/** EX AF,AF' */
export function EX_AF_AF() {
  const a = cpu[A];
  const f = packF();
  cpu[A] = cpu[Aa];
  unpackF(cpu[Fa]);
  cpu[Aa] = a;
  cpu[Fa] = f;
}

/** EXX */
export function EXX() {
  const b = cpu[B];
  const c = cpu[C];
  const d = cpu[D];
  const e = cpu[E];
  const h = cpu[H];
  const l = cpu[L];
  cpu[B] = cpu[Ba];
  cpu[C] = cpu[Ca];
  cpu[D] = cpu[Da];
  cpu[E] = cpu[Ea];
  cpu[H] = cpu[Ha];
  cpu[L] = cpu[La];
  cpu[Ba] = b;
  cpu[Ca] = c;
  cpu[Da] = d;
  cpu[Ea] = e;
  cpu[Ha] = h;
  cpu[La] = l;
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

/** EX DE,HL */
export function EX_DE_HL() {
  const d = cpu[D];
  const e = cpu[E];
  cpu[D] = cpu[H];
  cpu[E] = cpu[L];
  cpu[H] = d;
  cpu[L] = e;
}
