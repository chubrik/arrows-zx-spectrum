import { readdirSync, readFileSync } from 'fs';
import { basename } from 'path';
import { xFF } from '../src/hw/constants.ts';
import { check } from '../src/util/check.ts';
import { asciiToUnicode, bytesToUnicode } from '../src/util/encode.ts';
import { IFF1, IFF2, IM1, IM2 } from '../src/z80/flags.ts';
import { remangleTopLevel } from './remangle.ts';
import { getResource } from './resources.ts';
import { arrowFunctions, buildTs, DIST_DIR, inlineFunctions, minifyJs, postProcess, SRC_DIR, terserCMangle, terserCollapse, terserCompress, writeToPath } from './utils.ts';
import { loadSnapshot, type Z80Snapshot } from './z80-snapshot.ts';

await buildCpu(`${SRC_DIR}/z80.ts`);
await buildDeployer(`${SRC_DIR}/deployer.ts`);
await buildSnapshots();
console.log('');

//

async function buildCpu(path: string) {
  const fileName = basename(path, '.ts');
  let stepNum = 0;

  const step = (label: string, code: string) => {
    const num = String(++stepNum).padStart(2, '0');
    writeToPath(`${DIST_DIR}/temp/${fileName}/${fileName}.step${num}.${label}.js`, code);
    return code;
  };

  // Build pipeline
  const srcTsCode = readFileSync(path, 'utf8');
  const built = step('build', await buildTs(srcTsCode));
  const inlined = step('inline', inlineFunctions(built));
  const collapsed = step('collapse', await terserCollapse(inlined));
  const compressed = step('compress', await terserCompress(collapsed));
  const arrowed = step('arrows', arrowFunctions(compressed));
  const cmangled = step('cmangle', await terserCMangle(arrowed));
  const remangled = step('remangle', remangleTopLevel(cmangled));
  const processed = step('postprocess', postProcess(remangled));

  // Decoder pipeline
  const decoderFuncName = 'unicodeToAscii';
  const decoderTsCode = `export{${decoderFuncName}}from'./util/encode.ts';`;
  const decoderBuilt = step('decoder-build', await buildTs(decoderTsCode));
  const decoderStripped = step('decoder-strip', decoderBuilt.replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, ''));

  // Packing pipeline
  const packEncoded = asciiToUnicode(processed);
  const packAssembled = step('pack-assemble', `${decoderStripped};\neval(${decoderFuncName}('${packEncoded}'));`);
  const packCollapsed = step('pack-collapse', await terserCollapse(packAssembled));
  const packArrowed = step('pack-arrows', arrowFunctions(packCollapsed));
  const packCmangled = step('pack-cmangle', await terserCMangle(packArrowed));
  const packProcessed = step('pack-postprocess', postProcess(packCmangled));

  writeToPath(`${DIST_DIR}/${fileName}.pack.js`, packProcessed);

  console.log(
    `${path}: ${built.length} bytes → ` +
    `minified: ${[...processed].length} bytes → ` +
    `packed: ${packProcessed.length} bytes (${[...packProcessed].length} chars)`);
}

async function buildDeployer(path: string) {
  const fileName = basename(path, '.ts');
  let stepNum = 0;

  const step = (label: string, code: string) => {
    const num = String(++stepNum).padStart(2, '0');
    writeToPath(`${DIST_DIR}/temp/${fileName}/${fileName}.step${num}.${label}.js`, code);
    return code;
  };

  // Encode ROM data
  const rom = await getResource('48k.rom');
  const romEncoded = bytesToUnicode(rom);

  // Build pipeline
  const srcTsCode = readFileSync(path, 'utf8');
  const built = step('build', await buildTs(srcTsCode));
  const assembled = step('assemble', built.replace('("")', `('${romEncoded}')`));
  const collapsed = step('collapse', await terserCollapse(assembled));
  const compressed = step('compress', await terserCompress(collapsed));
  const arrowed = step('arrows', arrowFunctions(compressed));
  const cmangled = step('cmangle', await terserCMangle(arrowed));
  const processed = step('postprocess', postProcess(cmangled));

  writeToPath(`${DIST_DIR}/${fileName}.pack.js`, processed);

  console.log(
    `${path}: ${built.length + rom.length} bytes → ` +
    `packed: ${processed.length} bytes (${[...processed].length} chars)`);
}

async function buildSnapshots() {
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
  const srcTsCode = readFileSync(`${SRC_DIR}/snapshot-cpu.ts`, 'utf8');

  const sys =
    (snap.IM === 2 ? IM2 : snap.IM === 1 ? IM1 : 0) |
    (snap.IFF2 ? IFF2 : 0) |
    (snap.IFF1 ? IFF1 : 0);

  const values = [
    snap.A, snap.F, snap.B, snap.C, snap.D, snap.E, snap.H, snap.L,
    snap.IX >> 8, snap.IX & xFF, snap.SP >> 8, snap.SP & xFF, snap.PC >> 8, snap.PC & xFF,
    snap.Aa, snap.Fa, snap.Ba, snap.Ca, snap.Da, snap.Ea, snap.Ha, snap.La,
    snap.IY >> 8, snap.IY & xFF, snap.I, snap.R, sys
  ];

  const code = srcTsCode.replace(
    'state.cpu = [];',
    `state.cpu = [${values}];`
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
