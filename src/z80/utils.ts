import { xFFFF } from '../hw/constants';
import { mem } from '../hw/memory';
import { hlxy, inc2PC, incPC, pc, xyMode } from './registers';

export function nop() { };

export function next(): number {
  const value = mem[pc];
  incPC();
  return value;
}

export function next16(): number {
  const value = mem[pc] | (mem[pc + 1] << 8);
  inc2PC();
  return value;
}

/** (HL/IX+d/IY+d) */
export function getHLXYd(): number {
  if (xyMode) {
    let d = next();
    if (d >= 128) d -= 256; // -128...+127
    return (hlxy + d) & xFFFF;
  }
  return hlxy;
}
