import { xFFFF } from '../hw/constants';
import { mem } from '../hw/memory';
import { hlxy, incPC, xyMode } from './registers';

export function nop() { };

export function next() { /*!inline*/ return mem[incPC()]; }
export function next16() { /*!inline*/ return next() | (next() << 8); }

/** (HL/IX+d/IY+d) */
export function getHLXYd(): number {
  if (xyMode) {
    const d = next();
    return (hlxy + (d < 128 ? d : d - 256)) & xFFFF; // -128...+127 relative to HL/IX/IY
  }
  return hlxy;
}
