import { readdirSync, readFileSync } from 'fs';
import { basename } from 'path';
import { asciiToUnicode, bytesToUnicode } from '../src/common/encode.ts';
import { check } from '../src/common/utils.ts';
import { IFF1, IFF2, IM1, IM2 } from '../src/z80/flags.ts';
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

  const sys =
    (snap.IM === 2 ? IM2 : snap.IM === 1 ? IM1 : 0) |
    (snap.IFF2 ? IFF2 : 0) |
    (snap.IFF1 ? IFF1 : 0);

  const body = [
    `setDirect(A, ${snap.A})`,
    `setDirect(F, ${snap.F})`,
    `setDirect(B, ${snap.B})`,
    `setDirect(C, ${snap.C})`,
    `setDirect(D, ${snap.D})`,
    `setDirect(E, ${snap.E})`,
    `setDirect(H, ${snap.H})`,
    `setDirect(L, ${snap.L})`,
    `setDirect(Aa, ${snap.Aa})`,
    `setDirect(Fa, ${snap.Fa})`,
    `setDirect(Ba, ${snap.Ba})`,
    `setDirect(Ca, ${snap.Ca})`,
    `setDirect(Da, ${snap.Da})`,
    `setDirect(Ea, ${snap.Ea})`,
    `setDirect(Ha, ${snap.Ha})`,
    `setDirect(La, ${snap.La})`,
    `setDirect(IXh, ${snap.IX >> 8})`,
    `setDirect(IXl, ${snap.IX & 0xFF})`,
    `setDirect(IYh, ${snap.IY >> 8})`,
    `setDirect(IYl, ${snap.IY & 0xFF})`,
    `setDirect(SPh, ${snap.SP >> 8})`,
    `setDirect(SPl, ${snap.SP & 0xFF})`,
    `setDirect(PCh, ${snap.PC >> 8})`,
    `setDirect(PCl, ${snap.PC & 0xFF})`,
    `setDirect(I, ${snap.I})`,
    `setDirect(R, ${snap.R})`,
    `setDirect(SYS, ${sys})`,
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
