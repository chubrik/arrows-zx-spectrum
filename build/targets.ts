import { readFileSync, statSync } from 'fs';
import { basename } from 'path';
import { xFF } from '../src/common/constants.ts';
import { IFF1, IFF2, IM1, IM2 } from '../src/cpu/flags.ts';
import { asciiToUnicode, bytesToUnicode } from '../src/util/encode.ts';
import { BLOCK_TEMPLATE, buildClipboard } from './clipboard.ts';
import { getResource } from './resources.ts';
import {
  arrowFunctions, buildTs, cpuPipeline, createStepFn, DIST_DIR, RESOURCES_DIR, simplifyCode,
  SRC_DIR, stepName, terserCMangle, terserCollapse, terserCompress, writeToPath
} from './utils.ts';
import { loadSnapshot } from './z80-snapshot.ts';

const ROM_RESOURCE = '_48k.rom';

/** `<input>: <bytes> bytes → packed: <chars> chars → <output>: <bytes> bytes` */
function logBlocks(input: string, srcBytes: number, blocks: string[], output: string, clipboard: string) {
  console.log(
    `${input} ${srcBytes} bytes → ` +
    `packed: ${blocks.map(block => [...block].length).join(' + ')} chars → ` +
    `${output} ${clipboard.length} bytes`);
}

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
  const packTemplate = step('pack-template', await buildTs(decoderTsCode));
  const packStripped = step('pack-strip', packTemplate.replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, ''));

  // Packing pipeline
  const packEncoded = asciiToUnicode(substed);
  const packAssembled = step('pack-assemble', `${packStripped};\neval(${decoderFuncName}('${packEncoded}'));`);
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
    `${outPath}: ${clipboard.length} bytes`);

  return packed;
}

/** Builds the ROM initializer command block → `<outPath>`. Returns the block code. */
export async function buildRom(
  stepsDir = `${DIST_DIR}/temp/_initializer`, outPath = `${DIST_DIR}/_initializer.txt`
): Promise<string> {
  const rom = await getResource(ROM_RESOURCE);
  const block = await buildData(stepsDir, stepName(stepsDir), 'rom', rom);
  const clipboard = buildClipboard([block], BLOCK_TEMPLATE);

  writeToPath(outPath, clipboard);
  logBlocks(`${RESOURCES_DIR}/${ROM_RESOURCE}:`, rom.length, [block], `${outPath}:`, clipboard);
  return block;
}

/** Builds the three RAM command blocks of a `.z80` snapshot into one string → `dist/<name>.txt`. */
export async function buildSnapshot(z80Path: string, nameWidth = 0) {
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

  const blocks = [
    await buildData(stepsDir, fileName, 'ram1', snap.ram4000, 'pack1', { values: cpuValues, border: snap.border }),
    await buildData(stepsDir, fileName, 'ram2', snap.ram8000, 'pack2'),
    await buildData(stepsDir, fileName, 'ram3', snap.ramC000, 'pack3'),
  ];

  // A string that pastes the whole machine onto the map, memory included
  const clipboard = buildClipboard(blocks);
  const outPath = `${DIST_DIR}/${fileName}.txt`;

  const pad = ' '.repeat(Math.max(0, nameWidth - fileName.length));

  writeToPath(outPath, clipboard);
  logBlocks(`${z80Path}:${pad}`, statSync(z80Path).size, blocks, `${outPath}:${pad}`, clipboard);
}

/** Builds a data command block; the steps go to `<stepsDir>/`. */
async function buildData(
  stepsDir: string, fileName: string, stateName: string, data: Buffer,
  part?: string, cpu?: { values: number[], border: number }
): Promise<string> {
  const step = createStepFn(stepsDir, fileName, part);

  const dataEncoded = bytesToUnicode(data);
  const srcTsCode = readFileSync(`${SRC_DIR}/data-template.ts`, 'utf8');
  const template = step('template', await buildTs(srcTsCode));

  let assemble = template.replace('NAME', stateName).replace('("")', `('${dataEncoded}')`);

  if (cpu)
    assemble = assemble.replace(
      'let placeholder;', `state.cpu = [${cpu.values}];\n  state.brd = ${cpu.border};`);

  const assembled = step('assemble', assemble);
  const collapsed = step('collapse', await terserCollapse(assembled));
  const compressed = step('compress', await terserCompress(collapsed));
  const arrowed = step('arrows', arrowFunctions(compressed));
  const cmangled = step('cmangle', await terserCMangle(arrowed));
  const simplified = step('simplify', simplifyCode(cmangled, { constToLet: true }));

  return simplified;
}
