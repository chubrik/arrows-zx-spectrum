import { readMem16 } from '../common/memory';
import { get1, set1 } from '../common/utils';
import { posINT } from './positions';
import { getHalt, getI, getIFF1NotDelayed, getIM, getPC, incPC, push16, refresh, setHalt, setIFF1, setIFF2, setPC } from './utils';

const IM01_VECTOR = 0x0038;
const IM2_BUS_VALUE = 0xFF;

export function interrupt() {
  if (!getIFF1NotDelayed()) return;
  if (!get1(posINT)) return;

  set1(posINT, 0);
  setIFF1(0);
  setIFF2(0);

  if (getHalt()) {
    setHalt(0);
    incPC(1);
  }

  refresh();

  const im = getIM();

  if (im === 2) {
    const vector = (getI() << 8) | IM2_BUS_VALUE;
    const jumpAddr = readMem16(vector);
    push16(getPC());
    setPC(jumpAddr);
  }
  else {
    // On ZX Spectrum IM 0 is equivalent to IM 1 (bus = 0xFF = RST 38h)
    push16(getPC());
    setPC(IM01_VECTOR);
  }
}
