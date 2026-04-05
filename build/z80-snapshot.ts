import { readFileSync } from 'fs';
import { xFFFF } from '../src/hw/constants.ts';
import { check } from '../src/util/check.ts';

const PAGE_SIZE = 16384;

const PAGE_TO_ADDR: Record<number, number> = {
  4: 0x8000,
  5: 0xC000,
  8: 0x4000,
};

export interface Z80Snapshot {
  A: number; F: number;
  B: number; C: number;
  D: number; E: number;
  H: number; L: number;
  Aa: number; Fa: number;
  Ba: number; Ca: number;
  Da: number; Ea: number;
  Ha: number; La: number;
  I: number; R: number;
  IX: number; IY: number;
  SP: number; PC: number;
  IM: 0 | 1 | 2;
  IFF1: 0 | 1;
  IFF2: 0 | 1;
  border: number;
  ram4000: Buffer;
  ram8000: Buffer;
  ramC000: Buffer;
}

export function loadSnapshot(path: string): Z80Snapshot {
  const buf = readFileSync(path);
  return parseZ80(buf);
}

function parseZ80(buf: Buffer): Z80Snapshot {
  check(buf.length >= 30, '.z80: file too short');

  // V1 header (bytes 0–29)
  const A = buf[0];
  const F = buf[1];
  const C = buf[2];
  const B = buf[3];
  const L = buf[4];
  const H = buf[5];
  const pcV1 = buf.readUInt16LE(6);
  const SP = buf.readUInt16LE(8);
  const I = buf[10];
  const rLow7 = buf[11] & 0x7F;
  const byte12 = buf[12] === 255 ? 1 : buf[12];
  const rBit7 = (byte12 & 0x01) << 7;
  const R = rBit7 | rLow7;
  const border = (byte12 >> 1) & 0x07;
  const E = buf[13];
  const D = buf[14];
  const Ca = buf[15];
  const Ba = buf[16];
  const Ea = buf[17];
  const Da = buf[18];
  const La = buf[19];
  const Ha = buf[20];
  const Aa = buf[21];
  const Fa = buf[22];
  const IY = buf.readUInt16LE(23);
  const IX = buf.readUInt16LE(25);
  const IFF1: 0 | 1 = buf[27] ? 1 : 0;
  const IFF2: 0 | 1 = buf[28] ? 1 : 0;
  const imBits = buf[29] & 0x03;
  const IM: 0 | 1 | 2 = imBits <= 2 ? imBits as 0 | 1 | 2 : 0;

  // V2+ detection
  check(pcV1 === 0, '.z80: only v2/v3 format supported (PC at offset 6 must be 0)');
  const addHeaderLen = buf.readUInt16LE(30);
  check(addHeaderLen === 23 || addHeaderLen === 54 || addHeaderLen === 55,
    `.z80: unexpected additional header length ${addHeaderLen}`);

  const PC = buf.readUInt16LE(32);
  const hwMode = buf[34];
  check(hwMode === 0 || hwMode === 1, `.z80: only 48K mode supported, got hwMode=${hwMode}`);

  // Parse compressed memory blocks
  const dataStart = 32 + addHeaderLen;
  const ram = new Map<number, Buffer>();
  let offset = dataStart;

  while (offset < buf.length) {
    check(offset + 3 <= buf.length, '.z80: truncated block header');
    const blockLen = buf.readUInt16LE(offset);
    const page = buf[offset + 2];
    offset += 3;

    const baseAddr = PAGE_TO_ADDR[page];
    if (baseAddr === undefined) {
      // Skip unknown pages (e.g. 128K pages)
      offset += blockLen === xFFFF ? PAGE_SIZE : blockLen;
      continue;
    }

    let decompressed: Buffer;
    if (blockLen === xFFFF) {
      // Uncompressed block
      check(offset + PAGE_SIZE <= buf.length, `.z80: truncated uncompressed block for page ${page}`);
      decompressed = Buffer.from(buf.subarray(offset, offset + PAGE_SIZE));
      offset += PAGE_SIZE;
    } else {
      check(offset + blockLen <= buf.length, `.z80: truncated compressed block for page ${page}`);
      const compressed = buf.subarray(offset, offset + blockLen);
      decompressed = decompressBlock(compressed);
      offset += blockLen;
    }

    check(decompressed.length === PAGE_SIZE,
      `.z80: page ${page} decompressed to ${decompressed.length}, expected ${PAGE_SIZE}`);
    ram.set(baseAddr, decompressed);
  }

  check(ram.has(0x4000), '.z80: missing page 8 (0x4000–0x7FFF)');
  check(ram.has(0x8000), '.z80: missing page 4 (0x8000–0xBFFF)');
  check(ram.has(0xC000), '.z80: missing page 5 (0xC000–0xFFFF)');

  return {
    A, F, B, C, D, E, H, L,
    Aa, Fa, Ba, Ca, Da, Ea, Ha, La,
    I, R, IX, IY, SP, PC,
    IM, IFF1, IFF2, border,
    ram4000: ram.get(0x4000)!,
    ram8000: ram.get(0x8000)!,
    ramC000: ram.get(0xC000)!,
  };
}

function decompressBlock(data: Buffer): Buffer {
  const out: number[] = [];
  let i = 0;

  while (i < data.length) {
    if (i + 3 < data.length && data[i] === 0xED && data[i + 1] === 0xED) {
      const count = data[i + 2];
      const value = data[i + 3];
      for (let j = 0; j < count; j++) out.push(value);
      i += 4;
    } else {
      out.push(data[i]);
      i++;
    }
  }

  return Buffer.from(out);
}
