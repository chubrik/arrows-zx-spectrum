import { get, set } from '../common/utils';
import { HLT, IFF12, IFF1_INT, IM2, INT } from './flags';
import { call88 } from './op/op-stack';
import { I, SYS } from './registers';
import { addPC, eiDelay, refresh, setEIDelay } from './utils';

const IM01_VECTOR = 0x0038;
const IM2_BUS_VALUE = 0xFF;

export function interrupt() {
  if (eiDelay) {
    setEIDelay(0);
    return;
  };

  const sys = get(SYS);
  if ((sys & IFF1_INT) !== IFF1_INT) return; // Needs both IFF1 and INT to interrupt

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
