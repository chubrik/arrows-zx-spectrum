import { readFileSync } from 'fs';
import { basename } from 'path';
import { xFF } from '../src/common/constants.ts';
import { asciiToUnicode, bytesToUnicode } from '../src/util/encode.ts';
import { IFF1, IFF2, IM1, IM2 } from '../src/z80/flags.ts';
import { getResource } from './resources.ts';
import {
  arrowFunctions, buildTs, cpuPipeline, createStepFn, DIST_DIR, simplifyCode, SRC_DIR,
  terserCMangle, terserCollapse, terserCompress, writeToPath
} from './utils.ts';
import { loadSnapshot } from './z80-snapshot.ts';

/** Builds the packed CPU command block → `<distDir>/z80.pack.js` (steps → `<tempDir>/z80/`). Returns the packed code. */
export async function buildCpu(distDir = DIST_DIR, tempDir = `${distDir}/temp`): Promise<string> {
  const path = `${SRC_DIR}/z80.ts`;
  const fileName = basename(path, '.ts');

  // Build pipeline
  const { built, minified, substed, step } = await cpuPipeline(path, { tempDir: `${tempDir}/${fileName}` });

  // Decoder pipeline
  const decoderFuncName = 'unicodeToAscii';
  const decoderTsCode = `export{${decoderFuncName}}from'./util/encode.ts';`;
  const decoderBuilt = step('decoder-build', await buildTs(decoderTsCode));
  const decoderStripped = step('decoder-strip', decoderBuilt.replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, ''));

  // Packing pipeline
  const packEncoded = asciiToUnicode(substed);
  const packAssembled = step('pack-assemble', `${decoderStripped};\neval(${decoderFuncName}('${packEncoded}'));`);
  const packCollapsed = step('pack-collapse', await terserCollapse(packAssembled));
  const packArrowed = step('pack-arrows', arrowFunctions(packCollapsed));
  const packCmangled = step('pack-cmangle', await terserCMangle(packArrowed));
  const packed = step('pack-simplify', simplifyCode(packCmangled, { constToLet: true }));

  writeToPath(`${distDir}/${fileName}.pack.js`, packed);

  console.log(
    `${path}: ${built.length} bytes → ` +
    `minified: ${minified.length} bytes → ` +
    `substed: ${substed.length} bytes → ` +
    `packed: ${[...packed].length} chars`);

  return packed;
}

/** Builds the ROM initializer command block → `<distDir>/initializer.js` (steps → `<tempDir>/initializer/`). Returns the block code. */
export async function buildRom(distDir = DIST_DIR, tempDir = `${distDir}/temp`): Promise<string> {
  const rom = await getResource('48k.rom');
  return buildData(distDir, tempDir, 'initializer', 'rom', rom);
}

/** Builds the three RAM command blocks of a `.z80` snapshot → `dist/<name>/<name>.pack1..3.js`. */
export async function buildSnapshot(z80Path: string) {
  const fileName = basename(z80Path, '.z80');
  const snap = loadSnapshot(z80Path);
  console.log(``);

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

  const distDir = `${DIST_DIR}/${fileName}`; // steps stay next to the packs
  await buildData(distDir, distDir, `${fileName}.pack1`, 'ram1', snap.ram4000, cpuValues, snap.border);
  await buildData(distDir, distDir, `${fileName}.pack2`, 'ram2', snap.ram8000);
  await buildData(distDir, distDir, `${fileName}.pack3`, 'ram3', snap.ramC000);
}

/** Builds a data command block → `<distDir>/<fileName>.js` (steps → `<tempDir>/<fileName>/`). */
async function buildData(
  distDir: string, tempDir: string, fileName: string, stateName: string, data: Buffer,
  cpuValues?: number[], border?: number
): Promise<string> {
  const step = createStepFn(`${tempDir}/${fileName}`, fileName);

  const dataEncoded = bytesToUnicode(data);
  const srcTsCode = readFileSync(`${SRC_DIR}/data-template.ts`, 'utf8');
  const built = step('build', await buildTs(srcTsCode));

  let assemble = built.replace('NAME', stateName).replace('("")', `('${dataEncoded}')`);

  if (cpuValues)
    assemble = assemble.replace('let placeholder;', `state.cpu = [${cpuValues}];\nstate.brd = ${border};`);

  const assembled = step('assemble', assemble);
  const collapsed = step('collapse', await terserCollapse(assembled));
  const compressed = step('compress', await terserCompress(collapsed));
  const arrowed = step('arrows', arrowFunctions(compressed));
  const cmangled = step('cmangle', await terserCMangle(arrowed));
  const simplified = step('simplify', simplifyCode(cmangled, { constToLet: true }));

  writeToPath(`${distDir}/${fileName}.js`, simplified);

  console.log(
    `${fileName}: ${built.length + data.length} bytes → ` +
    `packed: ${[...simplified].length} chars`);

  return simplified;
}
