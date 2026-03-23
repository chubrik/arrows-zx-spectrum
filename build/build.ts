import { readFileSync } from 'fs';
import { basename } from 'path';
import { asciiToUnicode, bytesToUnicode } from '../src/common/encode.ts';
import { check } from '../src/common/utils.ts';
import { getResource } from './resources.ts';
import { buildPath, buildTs, DIST_DIR, minifyJs, SRC_DIR, writeToPath } from './utils.ts';

await buildAndPack(`${SRC_DIR}/ula.ts`);
await buildAndPack(`${SRC_DIR}/z80.ts`);
await buildAndPackDeployer(`${SRC_DIR}/deployer.ts`);
console.log('');

//

async function buildAndPack(path: string) {
  const fileName = basename(path, '.ts');

  const built = await buildPath(path);
  writeToPath(`${DIST_DIR}/${fileName}.js`, built);

  const minified = await minifyJs(built);
  writeToPath(`${DIST_DIR}/${fileName}.min.js`, minified);

  // Build just decode function (has export → clean ESM, no CJS shims)
  const decoderFuncName = 'unicodeToAscii';
  const decoderTsCode = `export{${decoderFuncName}}from'./common/encode.ts';`;
  const decoderBuilt = await buildTs(decoderTsCode);
  const decoderStripped = decoderBuilt.replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, '').trim();

  const encoded = asciiToUnicode(minified);
  const finalJs = `${decoderStripped};eval(${decoderFuncName}('${encoded}'));`;
  const packed = await minifyJs(finalJs);
  writeToPath(`${DIST_DIR}/pack/${fileName}.pack.js`, packed);

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
  writeToPath(`${DIST_DIR}/${fileName}.js`, built);

  const minified = await minifyJs(built);
  writeToPath(`${DIST_DIR}/${fileName}.min.js`, minified);

  const romEncoded = bytesToUnicode(rom);
  const codeForPack = rawCode.replace(toReplace, `unicodeToBytes('${romEncoded}')`);
  const finalJs = await buildTs(codeForPack);
  const pack = await minifyJs(finalJs);
  writeToPath(`${DIST_DIR}/pack/${fileName}.pack.js`, pack);

  console.log(
    `${path}: ${built.length} bytes → ` +
    `minified: ${minified.length} bytes → ` +
    `packed: ${pack.length} bytes (${[...pack].length} chars)`);
}

