import { TSTATES_INT_IM01, TSTATES_INT_IM2, xFF } from '../common/constants';
import { read16 } from '../common/memory';
import { hlt, iff1, im2, int, setHLT, setIFF1, setIFF2, setINT } from './flags';
import { RST_p } from './op/op-etc';
import { i, incPC, refresh } from './registers';
import { ts } from './utils';

const IM01_VECTOR = 0x0038;
const IM2_BUS_VALUE = xFF;

export function interrupt() {
  if (!int) return;
  setINT(0);
  if (!iff1) return;
  if (hlt) incPC();
  setIFF1(0);
  setIFF2(0);
  setHLT(0);

  refresh();

  if (im2) {
    ts(TSTATES_INT_IM2);
    const vector = IM2_BUS_VALUE | (i << 8);
    RST_p(read16(vector));
  }
  else {
    // On ZX Spectrum IM 0 is equivalent to IM 1 (bus = 0xFF = RST 38h)
    ts(TSTATES_INT_IM01);
    RST_p(IM01_VECTOR);
  }
}
