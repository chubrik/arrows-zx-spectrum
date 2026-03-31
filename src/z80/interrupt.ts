import { mems } from '../common/memory';
import { hlt, iff1, im2, int, setHLT, setIFF1, setIFF2, setINT } from './flags';
import { CALL_nn } from './op/op-stack';
import { I, regs } from './registers';
import { incPC, refresh } from './utils';

const IM01_VECTOR = 0x0038;
const IM2_BUS_VALUE = 0xFF;

export function interrupt() {
  if (!(iff1 && int)) return;

  if (hlt) incPC(1);
  setINT(0);
  setIFF1(0);
  setIFF2(0);
  setHLT(0);

  refresh();

  if (im2) {
    const vector = (regs[I] << 8) | IM2_BUS_VALUE;
    const addrLow = mems[vector];
    const addrHigh = mems[vector + 1];
    CALL_nn(addrLow, addrHigh);
  }
  else {
    // On ZX Spectrum IM 0 is equivalent to IM 1 (bus = 0xFF = RST 38h)
    CALL_nn(IM01_VECTOR);
  }
}
