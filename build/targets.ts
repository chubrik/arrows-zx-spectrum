import { readFileSync } from 'fs';
import { basename } from 'path';
import { xFF } from '../src/common/constants.ts';
import { IFF1, IFF2, IM1, IM2 } from '../src/cpu/flags.ts';
import { asciiToUnicode, bytesToUnicode } from '../src/util/encode.ts';
import { BLOCK_TEMPLATE, buildClipboard } from './clipboard.ts';
import { getResource } from './resources.ts';
import {
  arrowFunctions, buildTs, cpuPipeline, createStepFn, DIST_DIR, simplifyCode, SRC_DIR, stepName,
  terserCMangle, terserCollapse, terserCompress, writeToPath
} from './utils.ts';
import { loadSnapshot } from './z80-snapshot.ts';

/** Builds the CPU command block → `<outPath>`, a string that pastes it. Returns the packed code. */
export async function buildCpu(
  stepsDir = `${DIST_DIR}/temp/_cpu`, outPath = `${DIST_DIR}/_cpu.txt`
): Promise<string> {
  const path = `${SRC_DIR}/cpu.ts`;

  // Build pipeline
  const { built, minified, substed, step } = await cpuPipeline(path, { stepsDir });

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

  const clipboard = buildClipboard([packed], BLOCK_TEMPLATE);
  writeToPath(outPath, clipboard);

  console.log(
    `${path}: ${built.length} bytes → ` +
    `minified: ${minified.length} bytes → ` +
    `substed: ${substed.length} bytes → ` +
    `packed: ${[...packed].length} chars → ` +
    `${basename(outPath)}: ${clipboard.length} chars`);

  return packed;
}

/** Builds the ROM initializer command block → `<outPath>`. Returns the block code. */
export async function buildRom(
  stepsDir = `${DIST_DIR}/temp/_initializer`, outPath = `${DIST_DIR}/_initializer.txt`
): Promise<string> {
  const rom = await getResource('_48k.rom');
  const { code, log } = await buildData(stepsDir, stepName(stepsDir), 'rom', rom);
  const clipboard = buildClipboard([code], BLOCK_TEMPLATE);

  writeToPath(outPath, clipboard);
  console.log(`${log} → ${basename(outPath)}: ${clipboard.length} chars`);
  return code;
}

/** Builds the three RAM command blocks of a `.z80` snapshot into one string → `dist/<name>.txt`. */
export async function buildSnapshot(z80Path: string) {
  const fileName = basename(z80Path, '.z80');
  const snap = loadSnapshot(z80Path);

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

  const stepsDir = `${DIST_DIR}/temp/${fileName}`;
  const packs = [
    await buildData(stepsDir, fileName, 'ram1', snap.ram4000, 'pack1', cpuValues, snap.border),
    await buildData(stepsDir, fileName, 'ram2', snap.ram8000, 'pack2'),
    await buildData(stepsDir, fileName, 'ram3', snap.ramC000, 'pack3'),
  ];

  for (const { log } of packs)
    console.log(log);

  // A string that pastes the whole machine onto the map, memory included
  const clipboard = buildClipboard(packs.map(({ code }) => code));
  writeToPath(`${DIST_DIR}/${fileName}.txt`, clipboard);
  console.log(`${fileName}.txt: ${clipboard.length} chars`);

  console.log('');
}

/** Builds a data command block; the steps go to `<stepsDir>/`. Returns the code and its log line. */
async function buildData(
  stepsDir: string, fileName: string, stateName: string, data: Buffer,
  part?: string, cpuValues?: number[], border?: number
): Promise<{ code: string, log: string }> {
  const step = createStepFn(stepsDir, fileName, part);
  const name = part ? `${fileName}.${part}` : fileName;

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

  const log = `${name}: ${built.length + data.length} bytes → ` +
    `packed: ${[...simplified].length} chars`;

  return { code: simplified, log };
}
