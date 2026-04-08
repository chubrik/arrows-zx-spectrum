import { readdirSync, readFileSync } from 'fs';
import { basename } from 'path';
import { xFF } from '../src/hw/constants.ts';
import { asciiToUnicode, bytesToUnicode } from '../src/util/encode.ts';
import { IFF1, IFF2, IM1, IM2 } from '../src/z80/flags.ts';
import { remangleTopLevel } from './remangle.ts';
import { getResource } from './resources.ts';
import { arrowFunctions, buildTs, DIST_DIR, inlineFunctions, postProcess, SRC_DIR, terserCMangle, terserCollapse, terserCompress, writeToPath } from './utils.ts';
import { loadSnapshot } from './z80-snapshot.ts';

await buildCpu();
await buildRom();

const z80Files = readdirSync('resources').filter(f => f.toLowerCase().endsWith('.z80'));

for (const file of z80Files)
  await buildSnapshot(`resources/${file}`);

console.log('');

//

async function buildCpu() {
  const path = `${SRC_DIR}/z80.ts`;
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

async function buildRom() {
  const rom = await getResource('48k.rom');
  await buildData(DIST_DIR, 'initializer', 'rom', rom);
}

async function buildSnapshot(z80Path: string) {
  const fileName = basename(z80Path, '.z80');
  const snap = loadSnapshot(z80Path);
  console.log(`\n${fileName}:`);

  const cpuSYS =
    (snap.IM === 2 ? IM2 : snap.IM === 1 ? IM1 : 0) |
    (snap.IFF2 ? IFF2 : 0) |
    (snap.IFF1 ? IFF1 : 0);

  const cpuValues = [
    snap.A, snap.F, snap.B, snap.C, snap.D, snap.E, snap.H, snap.L,
    snap.IX >> 8, snap.IX & xFF, snap.SP >> 8, snap.SP & xFF, snap.PC >> 8, snap.PC & xFF,
    snap.Aa, snap.Fa, snap.Ba, snap.Ca, snap.Da, snap.Ea, snap.Ha, snap.La,
    snap.IY >> 8, snap.IY & xFF, snap.I, snap.R, cpuSYS
  ];

  await buildData(`${DIST_DIR}/${fileName}`, `${fileName}.pack1`, 'ram1', snap.ram4000, 'cpu', cpuValues);
  await buildData(`${DIST_DIR}/${fileName}`, `${fileName}.pack2`, 'ram2', snap.ram8000);
  await buildData(`${DIST_DIR}/${fileName}`, `${fileName}.pack3`, 'ram3', snap.ramC000);
}

async function buildData(
  distDir: string, fileName: string, stateName: string, data: Buffer,
  extraName?: string, extraData?: number[]) {
  let stepNum = 0;

  const step = (label: string, code: string) => {
    const num = String(++stepNum).padStart(2, '0');
    writeToPath(`${distDir}/${fileName}/${fileName}.step${num}.${label}.js`, code);
    return code;
  };

  const dataEncoded = bytesToUnicode(data);

  const srcTsCode = readFileSync(`${SRC_DIR}/data-template.ts`, 'utf8');
  const built = step('build', await buildTs(srcTsCode));

  let assemble = built.replace('NAME', stateName).replace('("")', `('${dataEncoded}')`);
  if (extraName) assemble = assemble.replace('let placeholder;', `state.${extraName} = [${extraData}];`);

  const assembled = step('assemble', assemble);
  const collapsed = step('collapse', await terserCollapse(assembled));
  const compressed = step('compress', await terserCompress(collapsed));
  const arrowed = step('arrows', arrowFunctions(compressed));
  const cmangled = step('cmangle', await terserCMangle(arrowed));
  const processed = step('postprocess', postProcess(cmangled));

  writeToPath(`${distDir}/${fileName}.js`, processed);

  console.log(
    `${fileName}: ${built.length + data.length} bytes → ` +
    `packed: ${processed.length} bytes (${[...processed].length} chars)`);
}
