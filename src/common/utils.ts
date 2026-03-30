import { packF, packSF, unpackF, unpackSF } from '../z80/flags.ts';
import { F, SYS } from '../z80/registers.ts';
import { getDirect, infos, setDirect } from './arrows.ts';

export const values: number[] = [];
const dirtyBitmap = new Uint32Array(2049); // 0x0000...0x1001F (including CPU registers)

let ramMinAddr = 0x4000;
export function setRamMinAddrForTest(value: number) { ramMinAddr = value; }

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
  if (values[addr] === value) return;
  values[addr] = value;
  dirtyBitmap[addr >> 5] |= (1 << (addr & 31));
}

export function markDirty(addr: number) {
  dirtyBitmap[addr >> 5] |= (1 << (addr & 31));
}

export function fetchAll() {
  for (let addr = 0; addr < infos.length; addr++)
    values[addr] = getDirect(addr);
  
    unpackF(values[F]);
    unpackSF(values[SYS]);
}

export function commitUpdated() {
  
  const packedF = packF();

  if (values[F] !== packedF) {
    values[F] = packedF;
    markDirty(F);
  }

  const packedSF = packSF();

  if (values[SYS] !== packedSF) {
    values[SYS] = packedSF;
    markDirty(SYS);
  }

  for (let i = ramMinAddr >> 5; i < 2049; i++) {
    let bits = dirtyBitmap[i];
    if (bits === 0) continue;
    dirtyBitmap[i] = 0;
    const base = i << 5;
    while (bits) {
      const bit = bits & -bits;
      const offset = 31 - Math.clz32(bit);
      setDirect(base + offset, values[base + offset]);
      bits ^= bit;
    }
  }
}
