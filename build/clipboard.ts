import { deflateSync, inflateSync } from 'zlib';
import { check } from '../src/util/check.ts';

/**
 * Reads and writes the clipboard format of the game, so that a build can produce a string which
 * pastes a ready machine onto the map. The format was recovered from copied buildings.
 *
 * Container: base64 of u16 format version, u8 compressed (1 = zlib, 0 = raw) and the payload.
 * The compression level matters: the game rejects the 78 DA zlib header.
 *
 * Payload: u16 chunk count, then for every chunk u16 x, u16 y (in chunks of CHUNK_SIZE cells, the
 * sign in the high bit) and u8 type count - 1, then for every type u8 type, u8 arrow count - 1 and,
 * for every arrow, u8 position (x | y << 4), u8 flags (rotation | flipped << 2 | hasData << 3 |
 * state << 4) and, with hasData, u16 data. For a command block the data is the code length in UTF-8
 * bytes, and the code follows.
 *
 * Arrows are grouped by type and ordered by x, then y.
 */

const CHUNK_SIZE = 16;
const COMMAND_BLOCK = 33; // Arrow type of a command block
const CODE_STATE = 1;     // State of a command block with code
const FORMAT_VERSION = 5;

// Flags of an arrow
const ROTATION = 0x03;
const FLIPPED = 0x04;
const HAS_DATA = 0x08;
const STATE_SHIFT = 4;

// The templates below are clipboard strings copied from the game; replace one by copying a new
// building over it. The codes are put into the command blocks it contains.

/** A whole machine: three command blocks for the memory packs. */
const PROGRAM_TEMPLATE =
  'BQABeJwVw7cSAQEUhtFv/8uMVtau2MqhkyllWrmWHwDvvbtn5jgEHFflCHT9M3+mE5WrivWYs+dGTFlVrc+CA3dMceVUsw' +
  'FLjjz4ElJCedVtyIoTT36ElVRBDRux5syLPykV1bQxGy68Sauklk3YcuVD26bs8AAMUhD9';

/** A single command block, for the CPU and for the ROM initializer. */
export const BLOCK_TEMPLATE = 'BQAAAQAAAAAAACEAAAgAAA==';

/** A command block keeps its code instead of data. */
type ClipboardArrow = {
  x: number, y: number, rotation: number, flipped: boolean, state: number, data?: number, code?: string,
};

type ClipboardType = { type: number, arrows: ClipboardArrow[] };

type ClipboardChunk = { x: number, y: number, types: ClipboardType[] };

type ClipboardMap = { chunks: ClipboardChunk[] };

export function decodeClipboard(text: string): ClipboardMap {
  const raw = Buffer.from(text.trim(), 'base64');
  const version = raw.readUInt16LE(0);
  check(version === FORMAT_VERSION, `Clipboard format version is ${version}, expected ${FORMAT_VERSION}`);

  const payload = raw[2] ? inflateSync(raw.subarray(3)) : raw.subarray(3);

  let pos = 0;
  const u8 = () => payload[pos++];
  const u16 = () => { const value = payload.readUInt16LE(pos); pos += 2; return value; };
  const coord = () => { const value = u16(); return value & 0x8000 ? -(value & 0x7FFF) : value; };

  const chunks: ClipboardChunk[] = [];
  const chunkCount = u16();

  for (let c = 0; c < chunkCount; c++) {
    const chunk: ClipboardChunk = { x: coord(), y: coord(), types: [] };
    const typeCount = u8() + 1;

    for (let t = 0; t < typeCount; t++) {
      const type = u8();
      const arrowCount = u8() + 1;
      const arrows: ClipboardArrow[] = [];

      for (let a = 0; a < arrowCount; a++) {
        const position = u8();
        const flags = u8();
        const arrow: ClipboardArrow = {
          x: position & 0x0F, y: position >> 4,
          rotation: flags & ROTATION, flipped: (flags & FLIPPED) !== 0, state: flags >> STATE_SHIFT,
        };

        if (flags & HAS_DATA) {
          const data = u16();

          if (type === COMMAND_BLOCK) {
            arrow.code = payload.subarray(pos, pos + data).toString('utf8');
            pos += data;
          } else {
            arrow.data = data;
          }
        }

        arrows.push(arrow);
      }

      chunk.types.push({ type, arrows });
    }

    chunks.push(chunk);
  }

  check(pos === payload.length, `Clipboard has ${payload.length - pos} bytes left unread`);
  return { chunks };
}

function encodeClipboard(map: ClipboardMap): string {
  const parts: Buffer[] = [];
  const coord = (value: number) => value < 0 ? (-value & 0x7FFF) | 0x8000 : value & 0x7FFF;
  const u16 = (value: number) => { const buffer = Buffer.alloc(2); buffer.writeUInt16LE(value, 0); return buffer; };

  parts.push(u16(map.chunks.length));

  for (const chunk of map.chunks) {
    parts.push(u16(coord(chunk.x)), u16(coord(chunk.y)), Buffer.from([chunk.types.length - 1]));

    for (const { type, arrows } of chunk.types) {
      parts.push(Buffer.from([type, arrows.length - 1]));

      for (const arrow of arrows) {
        // The game writes the code length even for an empty block
        const code = type === COMMAND_BLOCK ? Buffer.from(arrow.code ?? '', 'utf8') : undefined;
        const data = code ? code.length : arrow.data;
        const state = code ? (code.length ? arrow.state | CODE_STATE : arrow.state & ~CODE_STATE) : arrow.state;
        const flags = arrow.rotation | (arrow.flipped ? FLIPPED : 0) | (data !== undefined ? HAS_DATA : 0) |
          state << STATE_SHIFT;

        parts.push(Buffer.from([arrow.y << 4 | arrow.x, flags]));
        if (data !== undefined) parts.push(u16(data));
        if (code) parts.push(code);
      }
    }
  }

  const compressed = deflateSync(Buffer.concat(parts));
  return Buffer.concat([u16(FORMAT_VERSION), Buffer.from([1]), compressed]).toString('base64');
}

/** Every command block of the map, in the order they are read across chunks: by y, then x. */
export function findCommandBlocks(map: ClipboardMap): ClipboardArrow[] {
  return map.chunks
    .flatMap(chunk => chunk.types
      .filter(({ type }) => type === COMMAND_BLOCK)
      .flatMap(({ arrows }) => arrows.map(arrow => ({
        arrow,
        x: chunk.x * CHUNK_SIZE + arrow.x,
        y: chunk.y * CHUNK_SIZE + arrow.y,
      }))))
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map(({ arrow }) => arrow);
}

/** Puts the codes into the command blocks of the template, in the order the blocks are read. */
export function buildClipboard(codes: string[], template = PROGRAM_TEMPLATE): string {
  const map = decodeClipboard(template);
  const blocks = findCommandBlocks(map);

  check(blocks.length === codes.length,
    `The clipboard template has ${blocks.length} command blocks, but ${codes.length} are needed`);

  blocks.forEach((block, i) => { block.code = codes[i]; });
  return encodeClipboard(map);
}
