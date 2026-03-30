import { get } from '../common/utils';
import { hlt, iff1, im2, int, setHLT, setIFF1, setIFF2, setINT } from './flags';
import { call88 } from './op/op-stack';
import { I } from './registers';
import { addPC, refresh } from './utils';

const IM01_VECTOR = 0x0038;
const IM2_BUS_VALUE = 0xFF;

export function interrupt() {
  if (!(iff1 && int)) return;

  const wasHlt = hlt;
  setINT(0);
  setIFF1(0);
  setIFF2(0);
  setHLT(0);
  if (wasHlt) addPC(1);
  
  refresh();

  if (im2) {
    const vector = (get(I) << 8) | IM2_BUS_VALUE;
    const addrLow = get(vector);
    const addrHigh = get(vector + 1);
    call88(addrLow, addrHigh);
  }
  else {
    // On ZX Spectrum IM 0 is equivalent to IM 1 (bus = 0xFF = RST 38h)
    call88(IM01_VECTOR);
  }
}
