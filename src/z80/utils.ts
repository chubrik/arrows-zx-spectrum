import { xFFFF } from '../hw/constants';
import { mem } from '../hw/mem-state';
import { hlxy, pc, setPC, xyMode } from './registers';

export function nop() { };

export function next(): number {
  const value = mem[pc];
  setPC((pc + 1) & xFFFF);
  return value;
}

export function next16(): number {
  const value = mem[pc] | (mem[pc + 1] << 8);
  setPC((pc + 2) & xFFFF);
  return value;
}

export function setPCNext16() {
  /*!inline*/
  setPC(mem[pc] | (mem[pc + 1] << 8));
}

/** (HL/IX+d/IY+d) */
export function getHLXYd() {
  if (xyMode) {
    let d = next();
    if (d >= 128) d -= 256; // -128...+127
    return (hlxy + d) & xFFFF;
  }
  return hlxy;
}
