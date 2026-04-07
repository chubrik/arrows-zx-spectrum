import { xFFFF } from '../hw/constants';
import { mem } from '../hw/mem-state';
import { getHLXY, isXYMode, pc, setPC } from './registers';

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
  setPC(mem[pc] | (mem[pc + 1] << 8));
}

/** (HL/IX+d/IY+d) */
export function getHLXYd() {
  const hlxyd = getHLXY();

  if (isXYMode()) {
    let d = next();
    if (d >= 128) d -= 256; // -128...+127
    return (hlxyd + d) & xFFFF;
  }

  return hlxyd;
}
