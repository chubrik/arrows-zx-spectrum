import { B, regs } from '../registers';
import { addPC, next } from '../utils';

/** DJNZ e */
export function DJNZ_e() {
  const count = regs[B];
  const newCount = (count - 1) & 0xFF;
  regs[B] = newCount;

  if (newCount)
    JR_e();
  else
    addPC(1);
}

/** JR e */
export function JR_e() {
  const rawE = next();
  const e = rawE >= 128 ? rawE - 256 : rawE;
  addPC(e); // -126...+129 relative to operation start
}
