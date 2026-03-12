import { createHash } from 'crypto';
import { mkdirSync, writeFileSync } from 'fs';
import { bytesToUnicode, unicodeToBytes } from '../common/utils.ts';

const srcUrl = 'https://mdfs.net/Software/Spectrum/ROMImages/48k.rom';
const sha256 = 'd55daa439b673b0e3f5897f99ac37ecb45f974d1862b4dadb85dec34af99cb42';
const romPath = 'rom/48.rom';
const tsPath = 'rom/48.ts';

mkdirSync('rom', { recursive: true });

const array = await fetch(srcUrl).then(r => r.arrayBuffer());
const buffer = Buffer.from(array);
const hashCheck = createHash('sha256').update(buffer).digest('hex');

if (hashCheck !== sha256)
    throw Error(`Sha256 mismatch: ${hashCheck}`);

const encoded = bytesToUnicode(buffer);
const decoded = unicodeToBytes(encoded);

if (!buffer.equals(Buffer.from(decoded)))
    throw Error('Encode verification failed');

const tsText = `export const romEncoded='${encoded}';`;

writeFileSync(romPath, buffer);
writeFileSync(tsPath, tsText, 'utf8');

console.log(`ROM: ${buffer.length} bytes -> ${[...encoded].length} unicode chars`);
