import { deflateSync, inflateSync } from 'zlib';
import { check } from '../src/util/check.ts';

/**
 * Reads and writes the clipboard format of the game, so that a build can produce a string which
 * pastes a ready machine onto the map. The format was recovered from copied buildings.
 *
 * Container: base64 of [FORMAT_VERSION, 0, compressed] followed by the payload, which is a zlib
 * stream when the third byte is 1 and raw bytes when it is 0 (the game leaves small ones raw).
 * The compression level matters: the game reads its own 78 9C header and rejects 78 DA.
 *
 * Payload: u16 chunk count, then for every chunk u16 x, u16 y (in chunks of CHUNK_SIZE cells, the
 * sign in the high bit) and u8 type count - 1, then for every type u8 type, u8 arrow count - 1 and,
 * for every arrow, u8 position (x in the low nibble, y in the high one) plus u8 flags. A command
 * block adds u16 code length in UTF-8 bytes followed by the code itself; the length is always
 * there, while CODE_FLAG tells the game whether to read the code at all.
 *
 * Arrows are grouped by type and ordered by x, then y, exactly as in the first version of the game.
 */

const CHUNK_SIZE = 16;
const COMMAND_BLOCK = 33; // Arrow type of a command block
const CODE_FLAG = 0x10;   // In the flags of a command block: the game reads its code only when set
const FORMAT_VERSION = 4;

// The templates below are clipboard strings copied from the game; replace one by copying a new
// building over it. The codes are put into the command blocks it contains.

/** A whole machine: three command blocks for the memory packs. */
const PROGRAM_TEMPLATE =
  'BAABeJwVw7cSQVEUhtHP8dujlbVyK7ulTCnTyrX8AHhv15pZAf5cxpUDkPF3/GmvrYmLuKnbuouLKquqdZmx40pQMeVUsx' +
  '5z9tx4I8WVV936LDhw50NICRXUsAFLjjz4klRRTRuy4sSTlEpq2Yg1Z154NmZDmIr9ADrPETA=';

/** A single command block, for the CPU and for the ROM initializer. */
export const BLOCK_TEMPLATE = 'BAAAAQAAAAAAACEAAAEAAA==';

/** In flags, bits 0-1 are the rotation and bit 2 the flip; bit 4 is the CODE_FLAG of a command block. */
type ClipboardArrow = { x: number, y: number, flags: number, code?: string };

type ClipboardType = { type: number, arrows: ClipboardArrow[] };

type ClipboardChunk = { x: number, y: number, types: ClipboardType[] };

type ClipboardMap = { chunks: ClipboardChunk[] };

export function decodeClipboard(text: string): ClipboardMap {
  const raw = Buffer.from(text.trim(), 'base64');
  check(raw[0] === FORMAT_VERSION, `Clipboard format version is ${raw[0]}, expected ${FORMAT_VERSION}`);

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
        const arrow: ClipboardArrow = { x: position & 0x0F, y: position >> 4, flags: u8() };

        if (type === COMMAND_BLOCK) {
          const length = u16();
          arrow.code = payload.subarray(pos, pos + length).toString('utf8');
          pos += length;
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

  const chunkCount = Buffer.alloc(2);
  chunkCount.writeUInt16LE(map.chunks.length, 0);
  parts.push(chunkCount);

  for (const chunk of map.chunks) {
    const head = Buffer.alloc(5);
    head.writeUInt16LE(coord(chunk.x), 0);
    head.writeUInt16LE(coord(chunk.y), 2);
    head[4] = chunk.types.length - 1;
    parts.push(head);

    for (const { type, arrows } of chunk.types) {
      parts.push(Buffer.from([type, arrows.length - 1]));

      for (const arrow of arrows) {
        if (type !== COMMAND_BLOCK) {
          parts.push(Buffer.from([arrow.y << 4 | arrow.x, arrow.flags]));
          continue;
        }

        const code = Buffer.from(arrow.code ?? '', 'utf8');
        const flags = code.length ? arrow.flags | CODE_FLAG : arrow.flags & ~CODE_FLAG;
        const length = Buffer.alloc(2);
        length.writeUInt16LE(code.length, 0);
        parts.push(Buffer.from([arrow.y << 4 | arrow.x, flags]), length, code);
      }
    }
  }

  const compressed = deflateSync(Buffer.concat(parts));
  return Buffer.concat([Buffer.from([FORMAT_VERSION, 0, 1]), compressed]).toString('base64');
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
