export const RAM_MIN_ADDR = 0x4000;
export const RAM_MAX_ADDR = 0xFFFF;

export const poses: Position[] = [];

const bits = 20;
const mask = (1 << bits) - 1;
const cpOff = 0xA0;
const toCP = (v: number): number => { v += cpOff; return v < 0xD800 ? v : v + 0x800; };
const toVal = (cp: number): number => (cp < 0xD800 ? cp : cp - 0x800) - cpOff;

// |--len0-|--len1-|-data0-|-data1-|-data2-|...
// |----cp0-(20bit)----|----cp1-(20bit)----|...
//
/** Efficiency 94.3% */
export function bytesToUnicode(buf: Buffer): string {
    const hdr = Buffer.alloc(2);
    hdr.writeUInt16BE(buf.length);
    const data = Buffer.concat([hdr, buf]);
    const cp: number[] = [];
    let acc = 0, n = 0;
    for (let i = 0; i < data.length; i++) {
        acc = (acc << 8) | data[i];
        n += 8;
        while (n >= bits) {
            n -= bits;
            cp.push(toCP((acc >> n) & mask));
            acc &= (1 << n) - 1;
        }
    }
    if (n > 0) cp.push(toCP((acc << (bits - n)) & mask));
    let s = '';
    for (let i = 0; i < cp.length; i += 4096)
        s += String.fromCodePoint(...cp.slice(i, i + 4096));
    return s;
}

export function unicodeToBytes(str: string): number[] {
    let acc = 0, n = 0;
    const bytes: number[] = [];
    for (const ch of str) {
        acc = (acc << bits) | toVal(ch.codePointAt(0)!);
        n += bits;
        while (n >= 8) {
            n -= 8;
            bytes.push((acc >> n) & 0xFF);
            acc &= (1 << n) - 1;
        }
    }
    const len = (bytes[0] << 8) | bytes[1];
    return bytes.slice(2, 2 + len);
}
