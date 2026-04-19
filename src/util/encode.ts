import { xFF } from '../common/constants.ts';
import { check } from './check.ts';

const bits = 20;
const cpOff = 0xA0;
const toCP = (v: number): number => { v += cpOff; return v < 0xD800 ? v : v + 0x800; };
const toVal = (cp: number): number => (cp < 0xD800 ? cp : cp - 0x800) - cpOff;

// Each code point = 3 ascii chars (possible one or two extra spaces at the end)
//
/** Efficiency 77.1% */
export function asciiToUnicode(str: string): string {
  check(/^[\x20-\x7e]*$/.test(str), 'Input contains non-ASCII characters');
  const cp: number[] = [];
  for (let i = 0; i < str.length; i += 3) {
    const c0 = str.charCodeAt(i) - 0x20;
    const c1 = i + 1 < str.length ? str.charCodeAt(i + 1) - 0x20 : 0;
    const c2 = i + 2 < str.length ? str.charCodeAt(i + 2) - 0x20 : 0;
    cp.push(toCP(c0 * 9025 + c1 * 95 + c2));
  }
  let enc = '';
  for (let i = 0; i < cp.length; i += 4096)
    enc += String.fromCodePoint(...cp.slice(i, i + 4096));
  check(unicodeToAscii(enc).trim() === str.trim(), 'Encode verification failed');
  return enc;
}

export function unicodeToAscii(str: string): string {
  const result: number[] = [];
  for (const char of str) {
    const v = toVal(char.codePointAt(0)!);
    result.push((v / 9025 | 0) + 0x20);
    result.push(((v / 95 | 0) % 95) + 0x20);
    result.push((v % 95) + 0x20);
  }
  return String.fromCharCode(...result);
}

// |--len0-|--len1-|-data0-|-data1-|-data2-|...
// |----cp0-(20bit)----|----cp1-(20bit)----|...
//
/** Efficiency 94.3% */
export function bytesToUnicode(buf: Buffer): string {
  const mask = (1 << bits) - 1;
  const hdr = Buffer.alloc(2);
  hdr.writeUInt16BE(buf.length + 2);
  const data = Buffer.concat([hdr, buf]);
  const cp: number[] = [];
  let acc = 0, n = 0;
  for (const byte of data) {
    acc = (acc << 8) | byte;
    n += 8;
    while (n >= bits) {
      n -= bits;
      cp.push(toCP((acc >> n) & mask));
      acc &= (1 << n) - 1;
    }
  }
  if (n > 0) cp.push(toCP((acc << (bits - n)) & mask));
  let enc = '';
  for (let i = 0; i < cp.length; i += 4096)
    enc += String.fromCodePoint(...cp.slice(i, i + 4096));
  check(Buffer.from(unicodeToBytes(enc)).equals(buf), 'Encode verification failed');
  return enc;
}

export function unicodeToBytes(str: string): number[] {
  let acc = 0, n = 0;
  const bytes: number[] = [];
  for (const char of str) {
    acc = (acc << bits) | toVal(char.codePointAt(0)!);
    n += bits;
    while (n >= 8) {
      n -= 8;
      bytes.push((acc >> n) & xFF);
      acc &= (1 << n) - 1;
    }
  }
  const end = (bytes[0] << 8) | bytes[1];
  return bytes.slice(2, end);
}
