import { get, set } from '../common/utils';
import { HLT, IFF12, IM2, INT } from './flags';
import { call88 } from './op/op-call';
import { I, SYS } from './positions';
import { addPC, getIFF1NotDelayed, refresh } from './utils';

const IM01_VECTOR = 0x0038;
const IM2_BUS_VALUE = 0xFF;

//todo hack not often
export function interrupt() {
  const sys = get(SYS);
  if (!getIFF1NotDelayed(sys)) return;
  if (!(sys & INT)) return;

  const hlt = sys & HLT;
  set(SYS, sys & ~(INT | IFF12 | HLT));
  if (hlt) addPC(1);
  refresh();

  if (sys & IM2) {
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
