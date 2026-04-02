import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { check } from '../src/common/utils.ts';

const RESOURCES = {
  '48k.rom': {
    url: 'https://mdfs.net/Software/Spectrum/ROMImages/48k.rom',
    sha256: 'd55daa439b673b0e3f5897f99ac37ecb45f974d1862b4dadb85dec34af99cb42',
  },
  'fuse-tests.in': {
    url: 'https://sourceforge.net/p/fuse-emulator/fuse/ci/master/tree/z80/tests/tests.in?format=raw',
    sha256: '9f36e866f22e72ff1f8bf2100bf70ffbf58edd97b453500aab60acf1f403ebbb',
  },
  'fuse-tests.expected': {
    url: 'https://sourceforge.net/p/fuse-emulator/fuse/ci/master/tree/z80/tests/tests.expected?format=raw',
    sha256: '15a6946f4addcf97e137b5bdd1d5fdb08124ff91f1b169f36a8bf4afe4bab6e4',
  },
};

type ResourceName = keyof typeof RESOURCES;

export async function getResource(name: ResourceName): Promise<Buffer>;
export async function getResource(name: ResourceName, encoding: 'utf-8'): Promise<string>;
/** Load and verify resource. */
export async function getResource(name: ResourceName, encoding?: 'utf-8'): Promise<Buffer | string> {
  const res = RESOURCES[name];
  const path = `resources/${name}`;
  let buffer: Buffer;

  if (existsSync(path))
    buffer = readFileSync(path);
  else {
    const response = await fetch(res.url);
    check(response.ok, `Failed to download ${name}: HTTP ${response.status}`);
    buffer = Buffer.from(await response.arrayBuffer());
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, buffer);
    console.log(`${path}: ${buffer.length} bytes downloaded`);
  }

  verifyHash(buffer, res.sha256, name);
  return encoding ? buffer.toString(encoding) : buffer;
}

function verifyHash(buffer: Buffer, expected: string, name: string): void {
  const actual = createHash('sha256').update(buffer).digest('hex');
  check(actual === expected, `SHA256 mismatch for ${name}: got ${actual}, expected ${expected}`);
}
