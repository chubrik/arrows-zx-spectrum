import { xFFFF } from '../common/constants';
import { mem } from '../common/memory';
import { HL, HLXY, HXY, LXY, PCv, cpu, setPCv } from './registers';

export function nop() { };

export function next16(): number {
  const value = mem[PCv] | (mem[PCv + 1] << 8);
  setPCv((PCv + 2) & xFFFF);
  return value;
}

export function next(): number {
  const value = mem[PCv];
  setPCv((PCv + 1) & xFFFF);
  return value;
}

//todo inline?
export function setPCNext16() {
  setPCv(mem[PCv] | (mem[PCv + 1] << 8));
}

/** (HL/IX+d/IY+d) */
export function getHLXYd() {
  let hlxyd = cpu[LXY] | (cpu[HXY] << 8);

  if (HLXY !== HL) {
    let d = next();
    if (d >= 128) d -= 256; // -128...+127
    hlxyd = (hlxyd + d) & xFFFF;
  }

  return hlxyd;
}
