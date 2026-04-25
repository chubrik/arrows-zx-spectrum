import { TSTATES_EXTRA_XY, xFFFF } from '../common/constants';
import { mem } from '../common/memory';
import { hlxy, incPC, xyMode } from './registers';

export let tStates = 0;
export function setTStates(value: number) { /*!inline*/ tStates = value; }
function addTStates(n: number) { /*!inline*/ tStates += n; }
export { addTStates as ts };

export let eiTStates = 0;
export function setEiTStates(value: number) { /*!inline*/ eiTStates = value; }

export function nop() { };

export function next() { /*!inline*/ return mem[incPC()]; }
export function next16() { /*!inline*/ return next() | (next() << 8); }

/** (HL/IX+d/IY+d) */
export function getHLXYd(): number {
  if (xyMode) {
    addTStates(TSTATES_EXTRA_XY);
    const d = next();
    return (hlxy + (d < 128 ? d : d - 256)) & xFFFF; // -128...+127 relative to HL/IX/IY
  }
  return hlxy;
}
