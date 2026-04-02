import { xFF, xFFFF } from '../common/constants';
import { mem } from '../common/memory';
import { hlt, iff1, im2, int, setHLT, setIFF1, setIFF2, setINT } from './flags';
import { CALL_addr } from './op/op-stack';
import { I, PC, PCv, cpu, setPCv } from './registers';
import { refresh } from './utils';

const IM01_VECTOR = 0x0038;
const IM2_BUS_VALUE = xFF;

export function interrupt() {
  if (!int) return;
  setINT(0);
  if (!iff1) return;
  if (hlt) setPCv((PCv + 1) & xFFFF);
  setIFF1(0);
  setIFF2(0);
  setHLT(0);

  refresh();

  if (im2) {
    const vector = (cpu[I] << 8) | IM2_BUS_VALUE;
    const addrLow = mem[vector];
    const addrHigh = mem[vector + 1];
    CALL_addr((addrHigh) << 8 | addrLow);
  }
  else {
    // On ZX Spectrum IM 0 is equivalent to IM 1 (bus = 0xFF = RST 38h)
    CALL_addr(IM01_VECTOR);
  }
}
