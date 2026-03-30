import { packF, packSYS, unpackF, unpackSYS } from '../z80/flags.ts';
import { F, SYS } from '../z80/registers.ts';
import { getDirect, infos, setDirect } from './arrows.ts';

// This is hot code. The repeated code is intentional.
// Any attempt to extract common parts leads to slowdown.

export const values: number[] = [];
const dirtyBitmap = new Uint32Array(2048); // 0x0000...0xFFFF

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

export function get(addr: number): number {
  return values[addr];
}

// Like set/set16/set88, but without ramMinAddr/0xFFFF guards.
// Safe for register addresses (>= 0x10000).

export function setReg16(addr: number, value: number) {
  const valueLow = value & 0xFF;
  const valueHigh = value >> 8;
  values[addr] = valueLow;
  values[++addr] = valueHigh;
}

export function setReg88(addr: number, valueLow: number, valueHigh: number) {
  values[addr] = valueLow;
  values[++addr] = valueHigh;
}

export function setReg(addr: number, value: number) {
  values[addr] = value;
}

export function set16(addr: number, value: number) {
  const valueLow = value & 0xFF;
  const valueHigh = value >> 8;
  set88(addr, valueLow, valueHigh);
}

export function set88(addr: number, valueLow: number, valueHigh: number) {
  if (addr < ramMinAddr) return;
  if (values[addr] !== valueLow) {
    values[addr] = valueLow;
    dirtyBitmap[addr >> 5] |= (1 << (addr & 31));
  }
  if (addr === 0xFFFF) return;
  if (values[++addr] !== valueHigh) {
    values[addr] = valueHigh;
    dirtyBitmap[addr >> 5] |= (1 << (addr & 31));
  }
}

export function set(addr: number, value: number) {
  if (addr < ramMinAddr) return;
  if (values[addr] === value) return;
  values[addr] = value;
  dirtyBitmap[addr >> 5] |= (1 << (addr & 31));
}

export function fetchAll() {
  for (let addr = 0; addr < infos.length; addr++)
    values[addr] = getDirect(addr);

  unpackF(values[F]);
  unpackSYS(values[SYS]);
}

export function commitUpdated() {
  values[F] = packF();
  values[SYS] = packSYS();

  for (let reg = F; reg <= SYS; reg++)
    setDirect(reg, values[reg]);

  for (let i = ramMinAddr >> 5; i < 2048; i++) {
    let bits = dirtyBitmap[i];
    if (bits === 0) continue;
    dirtyBitmap[i] = 0;
    const base = i << 5;
    while (bits) {
      const bit = bits & -bits;
      const offset = 31 - Math.clz32(bit);
      const addr = base + offset;
      setDirect(addr, values[addr]);
      bits ^= bit;
    }
  }
}
