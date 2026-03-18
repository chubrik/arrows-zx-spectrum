import { get8 } from '../common/utils';
import { posF } from './positions';
import { CCSelect } from './types';

export const bitFS = 0x80;  // Sign
export const bitFZ = 0x40;  // Zero
const bitF5 = 0x20;         // Bit 5 (undocumented)
export const bitFH = 0x10;  // Half-carry
const bitF3 = 0x08;         // Bit 3 (undocumented)
export const bitFPV = 0x04; // Parity/Overflow
export const bitFN = 0x02;  // Subtract
export const bitFC = 0x01;  // Carry

export const maskFSZPV = bitFS | bitFZ | bitFPV;
export const maskF53 = bitF5 | bitF3;
export const maskFS53 = bitFS | maskF53;
const maskCC = [bitFZ, bitFC, bitFPV, bitFS];

/** NZ, Z, NC, C, PO, PE, P, M */
export function checkCC(cc: CCSelect): any {
  const isSet = get8(posF) & maskCC[cc >> 1];
  return cc & 1 ? isSet : !isSet;
}

/** S, Z, F5, F3, P from 8-bit result */
export function flagsSZ53P(value: number): number {
  return flagsSZ53(value) | flagP(value);
}

/** S, Z, F5, F3 from 8-bit result */
export function flagsSZ53(value: number): number {
  return (value & maskFS53) | (value ? 0 : bitFZ);
}

/** P: 0x04 if parity is even */
export function flagP(value: number): number {
  value ^= value >> 4;
  value ^= value << 2;
  value ^= value >> 1;
  return ~value & bitFPV;
}
