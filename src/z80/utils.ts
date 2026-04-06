import { xFFFF } from '../hw/constants';
import { mem } from '../hw/mem-state';
import { cpu, HXY, L, LXY, pc, setPC } from './registers';

export function nop() { };

export function next16(): number {
  const value = mem[pc] | (mem[pc + 1] << 8);
  setPC((pc + 2) & xFFFF);
  return value;
}

export function next(): number {
  const value = mem[pc];
  setPC((pc + 1) & xFFFF);
  return value;
}

export function setPCNext16() {
  setPC(mem[pc] | (mem[pc + 1] << 8));
}

/** (HL/IX+d/IY+d) */
export function getHLXYd() {
  let hlxyd = cpu[LXY] | (cpu[HXY] << 8);

  if (LXY !== L) {
    let d = next();
    if (d >= 128) d -= 256; // -128...+127
    hlxyd = (hlxyd + d) & xFFFF;
  }

  return hlxyd;
}
