import { get, get16, set, set16, set88 } from '../common/utils';
import { FC, IFF1 } from './flags';
import { F, HL, HLXY, initCpuPositions, PC, R, SP } from './positions';

export function initCpu(chunkX: number, chunkY: number) {
  initCpuPositions(chunkX, chunkY);
}

export const nop = () => { };

export function getFC(): number { return get(F) & FC; }

export function pushValue88(valueLow: number, valueHigh: number) {
  const sp = get16(SP);
  const newSp = (sp - 2) & 0xFFFF;
  set16(SP, newSp);
  set88(newSp, valueLow, valueHigh);
}

export function push16(src: number) {
  const sp = get16(SP);
  const newSp = (sp - 2) & 0xFFFF;
  set16(SP, newSp);
  const valueLow = get(src);
  const valueHigh = get(src + 1);
  set88(newSp, valueLow, valueHigh);
}

export function pop16(dest: number) {
  let sp = get16(SP);
  const valueLow = get(sp++);
  const valueHigh = get(sp++);
  set16(SP, sp & 0xFFFF);
  set88(dest, valueLow, valueHigh);
}

let eiDelay: 0 | 1 = 0;
export function setEIDelay() { eiDelay = 1; }

export function getIFF1NotDelayed(sys: number): 0 | 0x04 {
  if (eiDelay) return eiDelay = 0;
  return (sys & IFF1) as any;
}

//todo: Register WZ is not realized in the CPU state, but is used in some FUSE tests
let wz = 0;
export function getWZ(): number { return wz; }
export function setWZ(value: number) { wz = value; }

export function addPC(add: number) {
  const pc = get16(PC);
  set16(PC, (pc + add) & 0xFFFF);
}

export function next16(): number {
  const pc = get16(PC);
  set16(PC, (pc + 2) & 0xFFFF);
  const value = get16(pc);
  return value;
}

export function next(): number {
  const pc = get16(PC);
  set16(PC, (pc + 1) & 0xFFFF);
  const value = get(pc);
  return value;
}

export function setPCNext16() {
  const pc = get16(PC);
  const valueLow = get(pc);
  const valueHigh = get(pc + 1);
  set88(PC, valueLow, valueHigh);
}

export function refresh() {
  const r = get(R);
  const newR = (r & 0x80) | ((r + 1) & 0x7F);
  set(R, newR);
}

/** (IX+d/IY+d) */
export function getAddrXYd(rawD: number): number {
  const hl = get16(HLXY); // IX/IY
  const d = rawD >= 128 ? rawD - 256 : rawD; // -128...+127
  return (hl + d) & 0xFFFF;
}

/** (HL/IX+d/IY+d) */
export function getHLXYd() {
  let hlxyd = get16(HLXY);

  if (HLXY !== HL) {
    const rawD = next();
    const d = rawD >= 128 ? rawD - 256 : rawD; // -128...+127
    hlxyd = (hlxyd + d) & 0xFFFF;
  }

  return hlxyd;
}
