import { incPC, setHalt, setIFF1, setIFF2, setIM } from '../utils';

/** HALT */
export function HALT() {
  setHalt(1);
  incPC(-1);
}

/** DI */
export function DI() {
  setIFF1(0);
  setIFF2(0);
}

/** EI */
export function EI() {
  setIFF1(1);
  setIFF2(1);
}

/** IM 0 | IM 1 | IM 2 */
export function IM(im: 0 | 1 | 2) {
  setIM(im);
}
