import { build } from 'esbuild';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { minify, type MinifyOptions } from 'terser';
import { remangleTopLevel } from './remangle.ts';

export const SRC_DIR = 'src';
export const DIST_DIR = 'dist';

export async function buildPath(path: string): Promise<string> {
  const result = await build({
    entryPoints: [path],
    bundle: true,
    format: 'esm',
    write: false,
    drop: ['console', 'debugger'],
    treeShaking: true,
  });
  return result.outputFiles[0].text;
}

export async function buildTs(code: string): Promise<string> {
  const result = await build({
    stdin: {
      contents: code,
      loader: 'ts',
      resolveDir: SRC_DIR,
    },
    bundle: true,
    format: 'esm',
    write: false,
    treeShaking: true,
  });
  return result.outputFiles[0].text;
}

export async function minifyJs(code: string): Promise<string> {
  // Pass 1: Compress with collapse_vars (single pass — multi-pass collapse_vars has a bug)
  // Pass 2: Compress without collapse_vars (3 passes)
  // Pass 3: Convert function declarations/expressions to arrow functions
  //         (also removes braces from single-expression arrow bodies)
  // Pass 4: Compress - optimizes arrow bodies ({return expr} → expr), inlines IIFEs
  // Pass 5: Mangle - terser assigns initial names
  // Pass 6: Remangle - optimal top-level name assignment via acorn scope analysis
  // Pass 7: Post-processing - const → let, === → ==, !== → !=
  const min1 = (await minify(code, terserOptsCollapse)).code!;
  const min = (await minify(min1, terserOptsCompressOnly)).code!;
  const min2 = convertFunctions(min);
  const min3 = (await minify(min2, terserOptsCompressOnly)).code!;
  const final = (await minify(min3, terserOptsMangleOnly)).code!;
  return postProcess(remangleTopLevel(final));
}

export function writeToPath(path: string, content: string | NodeJS.ArrayBufferView) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

const terserCompress = {
  passes: 3,
  toplevel: true,
  ecma: 2020 as const,
  inline: 3 as const,
  reduce_vars: true,
  collapse_vars: false,
  arrows: true,
  unsafe: true,
  unsafe_comps: true,
  unsafe_math: true,
  unsafe_proto: true,
  unsafe_undefined: true,
  dead_code: true,
  conditionals: true,
  if_return: true,
  switches: true,
  pure_getters: true,
  hoist_funs: true,
  hoist_vars: true,
  join_vars: true,
  sequences: true,
  booleans_as_integers: true,
};

const terserFormat = { ecma: 2020 as const, semicolons: true };
const terserMangle = { toplevel: true, eval: true };

const terserOptsCollapse: MinifyOptions = {
  module: true,
  toplevel: true,
  ecma: 2020,
  compress: { ...terserCompress, passes: 1, collapse_vars: true },
  mangle: terserMangle,
  format: terserFormat,
};

const terserOptsCompressOnly: MinifyOptions = {
  module: true,
  toplevel: true,
  ecma: 2020,
  compress: terserCompress,
  mangle: false,
  format: terserFormat,
};

const terserOptsMangleOnly: MinifyOptions = {
  module: true,
  toplevel: true,
  ecma: 2020,
  compress: false,
  mangle: terserMangle,
  format: terserFormat,
};

// ── Convert all function declarations/expressions to arrow functions ──
// Safe for this project: no this/arguments/new.target usage in any function.
// Uses brace-counting to extract bodies; handles nested functions recursively.

interface ExtractedFunction {
  name: string;
  params: string;
  body: string;
  end: number;
}

function convertFunctions(code: string): string {
  let result = '';
  let i = 0;

  while (i < code.length) {
    const isNamed = code.startsWith('function ', i);
    const isAnon = !isNamed && code.startsWith('function(', i);

    if (isNamed || isAnon) {
      const info = extractFunction(code, i, isNamed);
      if (info) {
        // Recursively convert any functions nested in the body
        const body = convertFunctions(info.body);
        const params = fmtParams(info.params);
        const isIIFE = info.end < code.length && code[info.end] === '(';

        const arrow = `${params}=>${fmtArrowBody(body)}`;
        if (isNamed) {
          result += isIIFE
            ? `var ${info.name}=(${arrow})`
            : `var ${info.name}=${arrow};`;
        } else {
          result += isIIFE ? `(${arrow})` : arrow;
        }
        i = info.end;
        continue;
      }
    }

    result += code[i];
    i++;
  }

  return result;
}

function extractFunction(code: string, start: number, named: boolean): ExtractedFunction | null {
  let i = start + 'function'.length;
  let name = '';

  if (named) {
    if (code[i] !== ' ') return null;
    i++;
    const s = i;
    while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) i++;
    name = code.slice(s, i);
    if (!name) return null;
  }

  // Extract params (balanced parens)
  if (code[i] !== '(') return null;
  i++;
  const ps = i;
  let depth = 1;
  while (i < code.length && depth > 0) {
    if (code[i] === '(') depth++;
    else if (code[i] === ')') depth--;
    i++;
  }
  const params = code.slice(ps, i - 1);

  // Extract body (balanced braces, skipping strings)
  if (code[i] !== '{') return null;
  i++;
  const bs = i;
  depth = 1;
  while (i < code.length && depth > 0) {
    const ch = code[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      i++;
      while (i < code.length && code[i] !== ch) {
        if (code[i] === '\\') i++;
        i++;
      }
      i++; // skip closing quote
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    i++;
  }
  const body = code.slice(bs, i - 1);

  return { name, params, body, end: i };
}

function fmtParams(params: string): string {
  if (!params) return '()';
  // Single simple param → no parens needed (saves 2 chars)
  if (!/[,={\[]/.test(params)) return params;
  return `(${params})`;
}

// ── Format arrow body: remove braces for single-expression bodies ──

function fmtArrowBody(body: string): string {
  if (!body || body[0] === '{') return `{${body}}`;
  // Bodies starting with statement keywords must keep braces
  if (/^(?:return|if|for|while|do|switch|try|throw|let |const |var |break|continue)\b/.test(body)) return `{${body}}`;
  // Check for semicolons at top nesting level — multi-statement bodies keep braces
  if (hasTopLevel(body, ';')) return `{${body}}`;
  // Single expression — wrap in parens if has top-level comma, else bare
  return hasTopLevel(body, ',') ? `(${body})` : body;
}

function hasTopLevel(code: string, target: string): boolean {
  let depth = 0;
  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      i++;
      while (i < code.length && code[i] !== ch) {
        if (code[i] === '\\') i++;
        i++;
      }
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;
    else if (ch === target && depth === 0) return true;
  }
  return false;
}

// ── Post-processing: const → let, === → ==, !== → != ──

function postProcess(code: string): string {
  return code.replaceAll('const ', 'let ').replaceAll('!==', '!=').replaceAll('===', '==');
}
