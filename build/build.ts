import { readdirSync, readFileSync } from 'fs';
import { basename } from 'path';
import { asciiToUnicode, bytesToUnicode } from '../src/common/encode.ts';
import { check } from '../src/common/utils.ts';
import { getResource } from './resources.ts';
import { buildPath, buildTs, DIST_DIR, minifyJs, SRC_DIR, writeToPath } from './utils.ts';
import { loadSnapshot, type Z80Snapshot } from './z80-snapshot.ts';

await buildAndPack(`${SRC_DIR}/ula.ts`);
await buildAndPack(`${SRC_DIR}/z80.ts`);
await buildAndPackDeployer(`${SRC_DIR}/deployer.ts`);
await buildAllSnapshots();
console.log('');

//

async function buildAndPack(path: string) {
  const fileName = basename(path, '.ts');

  const built = await buildPath(path);
  writeToPath(`${DIST_DIR}/temp/${fileName}.js`, built);

  const minified = await minifyJs(built);
  writeToPath(`${DIST_DIR}/temp/${fileName}.min.js`, minified);

  // Build just decode function (has export → clean ESM, no CJS shims)
  const decoderFuncName = 'unicodeToAscii';
  const decoderTsCode = `export{${decoderFuncName}}from'./common/encode.ts';`;
  const decoderBuilt = await buildTs(decoderTsCode);
  const decoderStripped = decoderBuilt.replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, '').trim();

  const encoded = asciiToUnicode(minified);
  const finalJs = `${decoderStripped};eval(${decoderFuncName}('${encoded}'));`;
  const packed = await minifyJs(finalJs);
  writeToPath(`${DIST_DIR}/${fileName}.pack.js`, packed);

  console.log(
    `${path}: ${built.length} bytes → ` +
    `minified: ${[...minified].length} bytes → ` +
    `packed: ${packed.length} bytes (${[...packed].length} chars)`);
}

async function buildAndPackDeployer(path: string) {
  const fileName = basename(path, '.ts');
  const toReplace = `unicodeToBytes('')`;

  const rom = await getResource('48k.rom');
  const romBase64 = rom.toString('base64');
  check(Buffer.from(romBase64, 'base64').equals(rom), 'Base64 verification failed');

  const rawCode = readFileSync(path, 'utf8');
  const codeForBuild = rawCode.replace(toReplace, `atob('${romBase64}')`);
  const built = await buildTs(codeForBuild);
  writeToPath(`${DIST_DIR}/temp/${fileName}.js`, built);

  const minified = await minifyJs(built);
  writeToPath(`${DIST_DIR}/temp/${fileName}.min.js`, minified);

  const romEncoded = bytesToUnicode(rom);
  const codeForPack = rawCode.replace(toReplace, `unicodeToBytes('${romEncoded}')`);
  const finalJs = await buildTs(codeForPack);
  const pack = await minifyJs(finalJs);
  writeToPath(`${DIST_DIR}/${fileName}.pack.js`, pack);

  console.log(
    `${path}: ${built.length} bytes → ` +
    `minified: ${minified.length} bytes → ` +
    `packed: ${pack.length} bytes (${[...pack].length} chars)`);
}

async function buildAllSnapshots() {
  const z80Files = readdirSync('resources').filter(f => f.toLowerCase().endsWith('.z80'));
  for (const file of z80Files)
    await buildSnapshot(`resources/${file}`);
}

async function buildSnapshot(z80Path: string) {
  const gameName = basename(z80Path, '.z80');
  const snap = loadSnapshot(z80Path);
  console.log(`\n${gameName}:`);

  // CPU state entry point
  await buildSnapshotCpu(gameName, snap);

  const ramBlocks: { addr: number; data: Buffer }[] = [
    { addr: 0x4000, data: snap.ram4000 },
    { addr: 0x8000, data: snap.ram8000 },
    { addr: 0xC000, data: snap.ramC000 },
  ];

  const templateCode = readFileSync(`${SRC_DIR}/snapshot.ts`, 'utf8');
  const dataPlaceholder = `unicodeToBytes('')`;
  const addrPlaceholder = `0x0000`;

  for (const block of ramBlocks) {
    const addrHex = block.addr.toString(16);
    const fileName = `snapshot-${addrHex}`;

    const base64 = block.data.toString('base64');
    check(Buffer.from(base64, 'base64').equals(block.data), `Base64 verification failed for ${addrHex}`);

    const codeForBuild = templateCode
      .replace(dataPlaceholder, `atob('${base64}')`)
      .replace(addrPlaceholder, `0x${addrHex}`);
    const built = await buildTs(codeForBuild);
    writeToPath(`${DIST_DIR}/${gameName}/temp/${fileName}.js`, built);

    const minified = await minifyJs(built);
    writeToPath(`${DIST_DIR}/${gameName}/temp/${fileName}.min.js`, minified);

    const encoded = bytesToUnicode(block.data);
    const codeForPack = templateCode
      .replace(dataPlaceholder, `unicodeToBytes('${encoded}')`)
      .replace(addrPlaceholder, `0x${addrHex}`);
    const packBuilt = await buildTs(codeForPack);
    const pack = await minifyJs(packBuilt);
    writeToPath(`${DIST_DIR}/${gameName}/${fileName}.pack.js`, pack);

    console.log(
      `  ${fileName}: ${built.length} bytes → ` +
      `minified: ${minified.length} bytes → ` +
      `packed: ${pack.length} bytes (${[...pack].length} chars)`);
  }
}

async function buildSnapshotCpu(gameName: string, snap: Z80Snapshot) {
  const fileName = 'snapshot-cpu';
  const rawCode = readFileSync(`${SRC_DIR}/snapshot-cpu.ts`, 'utf8');

  const body = [
    `set8Direct(posA, ${snap.A})`,
    `set8Direct(posF, ${snap.F})`,
    `set8Direct(posB, ${snap.B})`,
    `set8Direct(posC, ${snap.C})`,
    `set8Direct(posD, ${snap.D})`,
    `set8Direct(posE, ${snap.E})`,
    `set8Direct(posH, ${snap.H})`,
    `set8Direct(posL, ${snap.L})`,
    `set8Direct(posAa, ${snap.Aa})`,
    `set8Direct(posFa, ${snap.Fa})`,
    `set8Direct(posBa, ${snap.Ba})`,
    `set8Direct(posCa, ${snap.Ca})`,
    `set8Direct(posDa, ${snap.Da})`,
    `set8Direct(posEa, ${snap.Ea})`,
    `set8Direct(posHa, ${snap.Ha})`,
    `set8Direct(posLa, ${snap.La})`,
    `set8Direct(posIXh, ${snap.IX >> 8})`,
    `set8Direct(posIXl, ${snap.IX & 0xFF})`,
    `set8Direct(posIYh, ${snap.IY >> 8})`,
    `set8Direct(posIYl, ${snap.IY & 0xFF})`,
    `set8Direct(posSPh, ${snap.SP >> 8})`,
    `set8Direct(posSPl, ${snap.SP & 0xFF})`,
    `set8Direct(posPCh, ${snap.PC >> 8})`,
    `set8Direct(posPCl, ${snap.PC & 0xFF})`,
    `set8Direct(posI, ${snap.I})`,
    `set8Direct(posR, ${snap.R})`,
    `set1Direct(posIM1, ${snap.IM === 1 ? 1 : 0})`,
    `set1Direct(posIM2, ${snap.IM === 2 ? 1 : 0})`,
    `set1Direct(posIFF1, ${snap.IFF1})`,
    `set1Direct(posIFF2, ${snap.IFF2})`,
    `set1Direct(posHalt, 0)`,
  ].join('; ');

  const code = rawCode.replace(
    'function restoreCpu() { }',
    `function restoreCpu() { ${body}; }`
  );

  const built = await buildTs(code);
  writeToPath(`${DIST_DIR}/${gameName}/temp/${fileName}.js`, built);

  const minified = await minifyJs(built);
  writeToPath(`${DIST_DIR}/${gameName}/temp/${fileName}.min.js`, minified);

  // Pack variant (same as minified — no large data payload)
  writeToPath(`${DIST_DIR}/${gameName}/${fileName}.pack.js`, minified);

  console.log(
    `  ${fileName}: ${built.length} bytes → ` +
    `minified: ${minified.length} bytes`);
}
