import { get } from '../common/utils';
import { sf } from './flags';
import { call88 } from './op/op-stack';
import { I } from './registers';
import { addPC, eiDelay, refresh, setEIDelay } from './utils';

const IM01_VECTOR = 0x0038;
const IM2_BUS_VALUE = 0xFF;

export function interrupt() {
  if (eiDelay) {
    setEIDelay(0);
    return;
  };

  if (!(sf.iff1 && sf.int)) return;

  const wasHlt = sf.hlt;
  sf.int = 0;
  sf.iff1 = 0;
  sf.iff2 = 0;
  sf.hlt = 0;
  if (wasHlt) addPC(1);
  refresh();

  if (sf.im2) {
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
