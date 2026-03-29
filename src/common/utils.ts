import { getDirect, infos, setDirect } from './arrows.ts';

export const values: number[] = [];
const updated = new Set<number>();

let ramMinAddr = 0x4000;
export function setRamMinAddrForTest(addr: number) { ramMinAddr = addr; }

export function check(condition: boolean, message: string = 'Check failed') {
  if (!condition)
    throw new Error(message);
}

export function get16(addr: number): number {
  const valueLow = values[addr];
  const valueHigh = values[addr + 1];
  return (valueHigh << 8) | valueLow;
}

export function set16(addr: number, value: number) {
  set(addr, value & 0xFF);
  if (addr !== 0xFFFF) set(addr + 1, value >> 8);
}

export function set88(addr: number, valueLow: number, valueHigh: number) {
  set(addr, valueLow);
  if (addr !== 0xFFFF) set(addr + 1, valueHigh);
}

export function get(addr: number): number {
  return values[addr];
}

export function set(addr: number, value: number) {
  if (addr < ramMinAddr) return;
  values[addr] = value;
  updated.add(addr);
}

export function fetchAll() {
  for (let addr = 0; addr < infos.length; addr++)
    values[addr] = getDirect(addr);
}

export function commitUpdated() {
  for (let addr of updated)
    setDirect(addr, values[addr]);

  updated.clear();
}
