import { xFF, xFFFF } from '../common/constants';
import { mem } from '../common/memory';
import { hlt, iff1, im2, int, setHLT, setIFF1, setIFF2, setINT } from './flags';
import { RST_p } from './op/op-stack';
import { I, pc, cpu, refresh, setPC } from './registers';

const IM01_VECTOR = 0x0038;
const IM2_BUS_VALUE = xFF;

export function interrupt() {
  if (!int) return;
  setINT(0);
  if (!iff1) return;
  if (hlt) setPC((pc + 1) & xFFFF);
  setIFF1(0);
  setIFF2(0);
  setHLT(0);

  refresh();

  if (im2) {
    const vector = IM2_BUS_VALUE | (cpu[I] << 8);
    RST_p(mem[vector] | (mem[vector + 1] << 8));
  }
  else {
    // On ZX Spectrum IM 0 is equivalent to IM 1 (bus = 0xFF = RST 38h)
    RST_p(IM01_VECTOR);
  }
}
