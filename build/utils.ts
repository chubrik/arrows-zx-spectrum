import { build, type BuildOptions } from 'esbuild';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { minify, type MinifyOptions } from 'terser';
import { remangleTopLevel } from './remangle.ts';

export const SRC_DIR = 'src';
export const DIST_DIR = 'dist';

export async function buildPath(path: string): Promise<string> {
  const options = getBuildConfig();
  options.entryPoints = [path];
  const result = await build(options);
  return result.outputFiles![0].text;
}

/** Build TypeScript → JavaScript. */
export async function buildTs(code: string): Promise<string> {
  const options = getBuildConfig();
  options.stdin = { contents: code, loader: 'ts', resolveDir: SRC_DIR };
  const result = await build(options);
  return result.outputFiles![0].text;
}

function getBuildConfig(): BuildOptions {
  return {
    bundle: true,
    format: 'esm',
    write: false,
    drop: ['console', 'debugger'],
    treeShaking: true,
    legalComments: 'inline',
  };
}

export async function minifyJs(code: string): Promise<string> {
  const inlined = inlineFunctions(code);
  const collapsed = await terserCollapse(inlined);
  const compressed = await terserCompress(collapsed);
  const arrowed = arrowFunctions(compressed);
  const final = await terserCMangle(arrowed);
  return postProcess(remangleTopLevel(final));
}

/** Collapse code (single pass — multi-pass collapse_vars has a terser bug). */
export async function terserCollapse(code: string): Promise<string> {
  return (await minify(code, optsCollapse)).code!;
}

/** Compress (no mangle). */
export async function terserCompress(code: string): Promise<string> {
  return (await minify(code, optsCompress)).code!;
}

/** Re-compress (arrow body optimization, inline IIFEs) + mangle variable names. */
export async function terserCMangle(code: string): Promise<string> {
  return (await minify(code, optsCompressMangle)).code!;
}

export function writeToPath(path: string, content: string | NodeJS.ArrayBufferView) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

const compressOpts = {
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

const formatOpts = { ecma: 2020 as const, semicolons: true };
const mangleOpts = { toplevel: true, eval: true };

// Collapse variables — single pass (multi-pass collapse_vars has a terser bug), no mangle
const optsCollapse: MinifyOptions = {
  module: true,
  toplevel: true,
  ecma: 2020,
  compress: { ...compressOpts, passes: 1, collapse_vars: true },
  mangle: false,
  format: formatOpts,
};

// Compress only — 3 passes, no mangle
const optsCompress: MinifyOptions = {
  module: true,
  toplevel: true,
  ecma: 2020,
  compress: compressOpts,
  mangle: false,
  format: formatOpts,
};

// Compress + mangle — 3 passes with name shortening
const optsCompressMangle: MinifyOptions = {
  module: true,
  toplevel: true,
  ecma: 2020,
  compress: compressOpts,
  mangle: mangleOpts,
  format: formatOpts,
};

/** Inline functions annotated with \@\_\_INLINE\__. */
// Replaces all call sites with the function body, substituting params with args.
// Handles single-statement bodies (e.g. simple setters: SPv = value).
export function inlineFunctions(code: string): string {
  const marker = '/*! @__INLINE__ */';

  interface InlineDef {
    name: string;
    params: string[];
    bodyExpr: string;
    defStart: number;
    defEnd: number;
  }

  const defs: InlineDef[] = [];
  let searchPos = 0;

  while (true) {
    const idx = code.indexOf(marker, searchPos);
    if (idx === -1) break;

    let i = idx + marker.length;
    while (i < code.length && /\s/.test(code[i])) i++;

    if (!code.startsWith('function ', i)) {
      searchPos = idx + 1;
      continue;
    }

    // Parse name
    i += 'function '.length;
    const nameStart = i;
    while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) i++;
    const name = code.slice(nameStart, i);
    if (!name) { searchPos = idx + 1; continue; }

    // Parse params
    while (i < code.length && code[i] !== '(') i++;
    i++;
    const ps = i;
    let depth = 1;
    while (i < code.length && depth > 0) {
      if (code[i] === '(') depth++;
      else if (code[i] === ')') depth--;
      i++;
    }
    const params = code.slice(ps, i - 1).split(',').map(p => p.trim()).filter(Boolean);

    // Parse body
    while (i < code.length && /\s/.test(code[i])) i++;
    if (code[i] !== '{') { searchPos = idx + 1; continue; }
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
        i++;
        continue;
      }
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      i++;
    }

    const bodyExpr = code.slice(bs, i - 1).trim().replace(/;$/, '');
    defs.push({ name, params, bodyExpr, defStart: idx, defEnd: i });
    searchPos = i;
  }

  if (defs.length === 0)
    return code.replaceAll(marker, '');

  // Remove definitions (reverse order to preserve indices)
  let result = code;
  for (let d = defs.length - 1; d >= 0; d--) {
    const { defStart, defEnd } = defs[d];
    let end = defEnd;
    while (end < result.length && (result[end] === '\n' || result[end] === '\r')) end++;
    result = result.slice(0, defStart) + result.slice(end);
  }

  // Replace all call sites
  for (const { name, params, bodyExpr } of defs) {
    const token = name + '(';
    let out = '';
    let pos = 0;

    while (pos < result.length) {
      const ci = result.indexOf(token, pos);
      if (ci === -1) { out += result.slice(pos); break; }

      // Skip if part of a larger identifier or member access
      if (ci > 0 && /[a-zA-Z0-9_$.]/.test(result[ci - 1])) {
        out += result.slice(pos, ci + token.length);
        pos = ci + token.length;
        continue;
      }

      // Extract arguments with balanced parens
      let ai = ci + token.length;
      let depth = 1;
      while (ai < result.length && depth > 0) {
        const ch = result[ai];
        if (ch === '(') depth++;
        else if (ch === ')') depth--;
        else if (ch === '"' || ch === "'" || ch === '`') {
          ai++;
          while (ai < result.length && result[ai] !== ch) {
            if (result[ai] === '\\') ai++;
            ai++;
          }
        }
        ai++;
      }

      const argsStr = result.slice(ci + token.length, ai - 1);
      const args = params.length <= 1
        ? [argsStr]
        : splitInlineArgs(argsStr);

      // Substitute params → args in body (extract non-trivial args to temp vars)
      const sub = safeSubstitute(params, args, bodyExpr);
      const inlined = sub.preamble + sub.body;

      out += result.slice(pos, ci) + inlined;
      pos = ai;
    }

    result = out;
  }

  // Handle call-site selective inlining (marker before a call, not a definition).
  // Loop to support nested inlining (inlined body may contain further markers).
  while (true) {
    const prev = result;
    result = inlineCallSites(result, marker);
    if (result === prev) break;
  }

  // Remove orphaned markers (e.g. when esbuild tree-shakes the function but keeps the comment)
  return result.replaceAll(marker, '');
}

// Inline call-site markers: @__INLINE__ before a call → expand body at that call site only.
// Supports multi-statement bodies with `return`. Renames local variables (suffix `_`) to avoid
// name conflicts with the surrounding scope. The function definition is preserved.
function inlineCallSites(code: string, marker: string): string {

  interface CallSite {
    markerStart: number;
    callEnd: number;
    funcName: string;
    argsStr: string;
  }

  // Collect call-site markers
  const sites: CallSite[] = [];
  let searchPos = 0;

  while (true) {
    const idx = code.indexOf(marker, searchPos);
    if (idx === -1) break;

    let i = idx + marker.length;
    while (i < code.length && /\s/.test(code[i])) i++;

    // Skip declaration-level markers (already processed)
    if (code.startsWith('function ', i) || code.startsWith('function(', i)) {
      searchPos = idx + 1;
      continue;
    }

    // Parse function name
    const nameStart = i;
    while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) i++;
    const funcName = code.slice(nameStart, i);

    if (!funcName || code[i] !== '(') {
      searchPos = idx + 1;
      continue;
    }

    // Extract arguments (balanced parens, skip strings)
    i++; // skip (
    const argsStart = i;
    let depth = 1;
    while (i < code.length && depth > 0) {
      const ch = code[i];
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      else if (ch === '"' || ch === "'" || ch === '`') {
        i++;
        while (i < code.length && code[i] !== ch) {
          if (code[i] === '\\') i++;
          i++;
        }
      }
      i++;
    }

    // Check for wrapping parens added by esbuild: = (\n  marker\n  call()\n)
    // Only match grouping parens (preceded by operator/whitespace), not function call parens
    let replStart = idx;
    let replEnd = i;
    let before = idx - 1;
    while (before >= 0 && /\s/.test(code[before])) before--;
    if (before >= 0 && code[before] === '(' && (before === 0 || !/[a-zA-Z0-9_$]/.test(code[before - 1]))) {
      let after = i;
      while (after < code.length && /\s/.test(code[after])) after++;
      if (after < code.length && code[after] === ')') {
        replStart = before;
        replEnd = after + 1;
      }
    }

    sites.push({ markerStart: replStart, callEnd: replEnd, funcName, argsStr: code.slice(argsStart, i - 1) });
    searchPos = i;
  }

  if (sites.length === 0) return code;

  let result = code;

  // Process in reverse order to preserve indices
  for (let s = sites.length - 1; s >= 0; s--) {
    const site = sites[s];

    // Find the function definition
    const defToken = `function ${site.funcName}(`;
    const defIdx = result.indexOf(defToken);
    if (defIdx === -1) continue;

    const extracted = extractFunction(result, defIdx, true);
    if (!extracted) continue;

    const params = extracted.params.split(',').map(p => p.trim()).filter(Boolean);
    const args = params.length <= 1
      ? [site.argsStr]
      : splitInlineArgs(site.argsStr);

    let body = extracted.body;

    // Substitute params → args (extract non-trivial args to temp vars)
    const sub = safeSubstitute(params, args, body);
    body = sub.preamble + sub.body;

    // Rename local variables (append `_`) to avoid conflicts with surrounding scope
    const localVars: string[] = [];
    const varDeclRe = /\b(?:const|let|var)\s+([a-zA-Z_$]\w*)/g;
    let m;
    while ((m = varDeclRe.exec(body)) !== null) {
      if (!localVars.includes(m[1])) localVars.push(m[1]);
    }
    for (const v of localVars) {
      body = body.replace(new RegExp(`\\b${v}\\b`, 'g'), `${v}_`);
    }

    // Split body into preamble + return expression
    const { preamble, returnExpr } = splitBodyReturn(body);

    // Find the containing line boundaries
    let lineStart = site.markerStart;
    while (lineStart > 0 && result[lineStart - 1] !== '\n') lineStart--;

    // Detect call-site indentation
    const callIndent = result.slice(lineStart).match(/^(\s*)/)![1];

    // Detect body base indentation (from the first non-empty line)
    const bodyLines = preamble.split('\n').filter(l => l.trim());
    const bodyIndent = bodyLines.length > 0 ? bodyLines[0].match(/^(\s*)/)![1] : '';

    // Re-indent preamble lines to match call site
    const reindented = bodyLines
      .map(l => l.startsWith(bodyIndent) ? callIndent + l.slice(bodyIndent.length) : callIndent + l.trimStart())
      .join('\n');

    // Replace marker+call with returnExpr in the containing line
    const markerAndCall = result.slice(site.markerStart, site.callEnd);
    const beforeMarker = result.slice(0, site.markerStart);
    const afterCall = result.slice(site.callEnd);

    if (reindented) {
      result = beforeMarker.slice(0, lineStart) + reindented + '\n' + beforeMarker.slice(lineStart) + returnExpr + afterCall;
    } else {
      result = beforeMarker + returnExpr + afterCall;
    }
  }

  return result;
}

function splitBodyReturn(body: string): { preamble: string; returnExpr: string } {
  // Find the last top-level `return` in the body
  let lastReturnPos = -1;
  let i = 0;
  let depth = 0;

  while (i < body.length) {
    const ch = body[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      i++;
      while (i < body.length && body[i] !== ch) {
        if (body[i] === '\\') i++;
        i++;
      }
      i++;
      continue;
    }
    if (ch === '{' || ch === '(' || ch === '[') depth++;
    else if (ch === '}' || ch === ')' || ch === ']') depth--;
    else if (depth === 0 && body.startsWith('return', i)) {
      const before = i > 0 ? body[i - 1] : ' ';
      const after = i + 6 < body.length ? body[i + 6] : ' ';
      if (!/[a-zA-Z0-9_$]/.test(before) && /[\s;]/.test(after)) {
        lastReturnPos = i;
      }
    }
    i++;
  }

  if (lastReturnPos === -1) {
    return { preamble: body.trim(), returnExpr: '' };
  }

  const preamble = body.slice(0, lastReturnPos).trimEnd();

  // Extract return expression
  let exprStart = lastReturnPos + 'return'.length;
  while (exprStart < body.length && /\s/.test(body[exprStart])) exprStart++;

  let exprEnd = exprStart;
  depth = 0;
  while (exprEnd < body.length) {
    const ch = body[exprEnd];
    if (ch === '"' || ch === "'" || ch === '`') {
      exprEnd++;
      while (exprEnd < body.length && body[exprEnd] !== ch) {
        if (body[exprEnd] === '\\') exprEnd++;
        exprEnd++;
      }
      exprEnd++;
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;
    else if (ch === ';' && depth === 0) break;
    exprEnd++;
  }

  return { preamble, returnExpr: body.slice(exprStart, exprEnd).trim() };
}

function splitInlineArgs(argsStr: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < argsStr.length; i++) {
    const ch = argsStr[i];
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;
    else if (ch === '"' || ch === "'" || ch === '`') {
      i++;
      while (i < argsStr.length && argsStr[i] !== ch) {
        if (argsStr[i] === '\\') i++;
        i++;
      }
    } else if (ch === ',' && depth === 0) {
      args.push(argsStr.slice(start, i).trim());
      start = i + 1;
    }
  }
  args.push(argsStr.slice(start).trim());
  return args;
}

function isSimpleArg(expr: string): boolean {
  return /^[a-zA-Z_$][\w$]*$/.test(expr) || /^-?(?:0x[\da-fA-F]+|\d+(?:\.\d+)?)$/.test(expr);
}

let __safeSubCounter = 0;

function safeSubstitute(params: string[], args: string[], bodyExpr: string): { preamble: string; body: string } {
  const preambleLines: string[] = [];
  let body = bodyExpr;
  for (let k = 0; k < params.length; k++) {
    const paramRe = new RegExp(`\\b${params[k]}\\b`, 'g');
    const arg = args[k];
    const occurrences = (bodyExpr.match(paramRe) || []).length;
    if (isSimpleArg(arg) || occurrences <= 1) {
      body = body.replace(paramRe, () => arg);
    } else {
      const tmp = `__${params[k]}_${__safeSubCounter++}`;
      preambleLines.push(`let ${tmp} = ${arg}`);
      body = body.replace(paramRe, () => tmp);
    }
  }
  return { preamble: preambleLines.length > 0 ? preambleLines.join('; ') + '; ' : '', body };
}

interface ExtractedFunction {
  name: string;
  params: string;
  body: string;
  end: number;
}

/** Convert all function declarations/expressions to arrow functions. */
// Safe for this project: no this/arguments/new.target usage in any function.
// Uses brace-counting to extract bodies; handles nested functions recursively.
export function arrowFunctions(code: string): string {
  let result = '';
  let i = 0;

  while (i < code.length) {
    const isNamed = code.startsWith('function ', i);
    const isAnon = !isNamed && code.startsWith('function(', i);

    if (isNamed || isAnon) {
      const info = extractFunction(code, i, isNamed);
      if (info) {
        // Recursively convert any functions nested in the body
        const body = arrowFunctions(info.body);
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
  while (i < code.length && /\s/.test(code[i])) i++;
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

/** Post-process: const → let, === → ==, !== → != */
export function postProcess(code: string): string {
  return code.replaceAll('const ', 'let ').replaceAll('!==', '!=').replaceAll('===', '==');
}
