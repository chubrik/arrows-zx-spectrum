import { build, type BuildOptions } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { basename, dirname } from 'path';
import { minify, type MinifyOptions } from 'terser';
import { check } from '../src/util/check.ts';
import { remangleTopLevel } from './remangle.ts';

export const SRC_DIR = 'src';
export const DIST_DIR = 'dist';

export type StepFn = (label: string, code: string) => string;

export function createStepFn(tempDir: string, fileName: string): StepFn {
  let stepNum = 0;
  return (label: string, code: string) => {
    const num = String(++stepNum).padStart(2, '0');
    writeToPath(`${tempDir}/${fileName}.step${num}.${label}.js`, code);
    return code;
  };
}

/** Full CPU build pipeline: esbuild → inline → terser × 3 → arrows → remangle → postprocess. */
export async function cpuPipeline(srcPath: string, opts?: { test?: boolean }) {
  const fileName = basename(srcPath, '.ts');
  const tempDir = `${DIST_DIR}/temp/${fileName}`;
  const step = createStepFn(tempDir, fileName);

  const srcTsCode = readFileSync(srcPath, 'utf8');
  const built = step('build', await buildTs(srcTsCode, opts));
  const inlined = step('inline', inlineFunctions(built));
  const collapsed = step('collapse', await terserCollapse(inlined));
  const compressed = step('compress', await terserCompress(collapsed));
  const arrowed = step('arrows', arrowFunctions(compressed));
  const cmangled = step('cmangle', await terserCMangle(arrowed));
  const remangled = step('remangle', remangleTopLevel(cmangled));
  const minified = step('simplify', simplifyCode(remangled));
  const substed = step('subst', substCode(minified));

  return { built, minified, substed, step, tempDir, fileName };
}

export async function buildPath(path: string, opts?: { test?: boolean }): Promise<string> {
  const options = getBuildConfig(opts);
  options.entryPoints = [path];
  const result = await build(options);
  return result.outputFiles![0].text;
}

/** Build TypeScript → JavaScript. */
export async function buildTs(code: string, opts?: { test?: boolean }): Promise<string> {
  const options = getBuildConfig(opts);
  options.stdin = { contents: code, loader: 'ts', resolveDir: SRC_DIR };
  const result = await build(options);
  return result.outputFiles![0].text;
}

function getBuildConfig(opts?: { test?: boolean }): BuildOptions {
  return {
    bundle: true,
    format: 'esm',
    write: false,
    drop: ['console', 'debugger'],
    treeShaking: true,
    legalComments: 'inline',
    define: { TEST: opts?.test ? 'true' : 'false' },
  };
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

/** Inline functions whose body begins with the inline marker. */
// Decl-level: `function name(...) { /*!inline*/ ... }` — body starts with marker.
// Call-site: `/*!inline*/ name(...)` — marker right before a call expression.
// Marker lives INSIDE the body so esbuild's tree-shaking removes it together with
// the function — no orphaning of the comment onto adjacent declarations.
export function inlineFunctions(code: string): string {
  const marker = '/*!inline*/';
  const hoistedVars: string[] = [];

  interface InlineDef {
    name: string;
    params: string[];
    bodyExpr: string;
    defStart: number;
    defEnd: number;
  }

  const defs: InlineDef[] = [];
  const funcRe = /\bfunction\s+([a-zA-Z_$][\w$]*)\s*\(/g;
  let match: RegExpExecArray | null;

  while ((match = funcRe.exec(code)) !== null) {
    const defStart = match.index;
    const name = match[1];
    let i = match.index + match[0].length; // position right after '('

    // Parse params (balanced parens)
    const ps = i;
    let depth = 1;
    while (i < code.length && depth > 0) {
      if (code[i] === '(') depth++;
      else if (code[i] === ')') depth--;
      i++;
    }
    const params = code.slice(ps, i - 1).split(',').map(p => p.trim()).filter(Boolean);

    // Skip whitespace, expect body opening brace
    while (i < code.length && /\s/.test(code[i])) i++;
    if (code[i] !== '{') continue;
    i++;

    // First non-whitespace token in body must be the marker
    let firstTok = i;
    while (firstTok < code.length && /\s/.test(code[firstTok])) firstTok++;
    if (!code.startsWith(marker, firstTok)) continue;

    // Body content starts after the marker
    const bs = firstTok + marker.length;

    // Find matching '}' (body end)
    let bi = bs;
    depth = 1;
    while (bi < code.length && depth > 0) {
      const ch = code[bi];
      if (ch === '"' || ch === "'" || ch === '`') {
        bi++;
        while (bi < code.length && code[bi] !== ch) {
          if (code[bi] === '\\') bi++;
          bi++;
        }
        bi++;
        continue;
      }
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      bi++;
    }

    let bodyExpr = code.slice(bs, bi - 1).trim().replace(/;$/, '');
    if (bodyExpr.startsWith('return ')) bodyExpr = bodyExpr.slice(7);
    defs.push({ name, params, bodyExpr, defStart, defEnd: bi });
    funcRe.lastIndex = bi;
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

  // Replace all call sites (loop for recursive inlining)
  while (true) {
    const prev = result;

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
        let inlined;

        if (sub.temps.length > 0 && isExpressionBody(bodyExpr)) {
          // Temp vars in expression context → comma expression with hoisted var
          const assigns = sub.temps.map(t => `${t.name} = ${t.arg}`).join(', ');
          inlined = '(' + assigns + ', ' + sub.body + ')';
          for (const t of sub.temps) hoistedVars.push(t.name);
        } else if (!sub.preamble && isExpressionBody(bodyExpr)) {
          // Wrap expression bodies in parens to preserve operator precedence at the call site.
          inlined = '(' + sub.body + ')';
        } else {
          inlined = sub.preamble + sub.body;
        }

        // Wrap in braces if non-expression body lands in arrow expression context
        if (!isExpressionBody(inlined)) {
          let k = ci - 1;
          while (k >= 0 && /\s/.test(result[k])) k--;
          if (k >= 1 && result[k - 1] === '=' && result[k] === '>') {
            inlined = '{ ' + inlined + ' }';
          }
        }

        out += result.slice(pos, ci) + inlined;
        pos = ai;
      }

      result = out;
    }

    // Replace bare references (inline function used as value, not called) → arrow
    for (const { name, params, bodyExpr } of defs) {
      let out = '';
      let pos = 0;

      while (pos < result.length) {
        const ri = result.indexOf(name, pos);
        if (ri === -1) { out += result.slice(pos); break; }

        // Skip if part of a larger identifier or member access
        if (ri > 0 && /[a-zA-Z0-9_$.]/.test(result[ri - 1])) {
          out += result.slice(pos, ri + name.length);
          pos = ri + name.length;
          continue;
        }
        const afterIdx = ri + name.length;
        if (afterIdx < result.length && /[a-zA-Z0-9_$(:.]/.test(result[afterIdx])) {
          out += result.slice(pos, afterIdx);
          pos = afterIdx;
          continue;
        }

        // Build arrow function wrapping the inlined body
        const fmtP = params.length === 0
          ? '()'
          : params.length === 1
            ? params[0]
            : `(${params.join(', ')})`;

        const arrow = isExpressionBody(bodyExpr)
          ? `${fmtP} => (${bodyExpr})`
          : `${fmtP} => { ${bodyExpr} }`;

        out += result.slice(pos, ri) + arrow;
        pos = afterIdx;
      }

      result = out;
    }

    if (result === prev) break;
  }

  // Handle call-site selective inlining (marker before a call, not a definition).
  // Loop to support nested inlining (inlined body may contain further markers).
  while (true) {
    const prev = result;
    result = inlineCallSites(result, marker);
    if (result === prev) break;
  }

  // Prepend hoisted var declarations for comma-expression temps
  if (hoistedVars.length > 0) {
    result = `var ${hoistedVars.join(', ')};\n` + result;
  }

  // Remove orphaned markers (e.g. when esbuild tree-shakes the function but keeps the comment)
  return result.replaceAll(marker, '');
}

// Inline call-site markers: marker before a call → expand body at that call site only.
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

interface SafeSubResult {
  preamble: string;
  temps: { name: string; arg: string }[];
  body: string;
}

function safeSubstitute(params: string[], args: string[], bodyExpr: string): SafeSubResult {
  const preambleLines: string[] = [];
  const temps: { name: string; arg: string }[] = [];
  let body = bodyExpr;
  for (let k = 0; k < params.length; k++) {
    const paramRe = new RegExp(`\\b${params[k]}\\b`, 'g');
    const arg = args[k];
    const occurrences = (bodyExpr.match(paramRe) || []).length;
    if (isSimpleArg(arg) || occurrences <= 1) {
      const replacement = isSimpleArg(arg) ? arg : `(${arg})`;
      body = body.replace(paramRe, () => replacement);
    } else {
      const tmp = `__${params[k]}_${__safeSubCounter++}`;
      preambleLines.push(`let ${tmp} = ${arg}`);
      temps.push({ name: tmp, arg });
      body = body.replace(paramRe, () => tmp);
    }
  }
  return { preamble: preambleLines.length > 0 ? preambleLines.join('; ') + '; ' : '', temps, body };
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

/** True if body is a single expression (safe to wrap in parens), not a statement. */
function isExpressionBody(body: string): boolean {
  if (!body || body[0] === '{') return false;
  if (/^(?:return|if|for|while|do|switch|try|throw|let |const |var |break|continue)\b/.test(body)) return false;
  return !hasTopLevel(body, ';');
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

/** === → ==, !== → != */
export function simplifyCode(code: string, opts?: { constToLet?: boolean }): string {
  // Don't replace "const/var" to "let" in main code.
  // It adds a TDZ check on every top-level binding read, slowing runtime by ~15%.

  let simplified = code
    .replaceAll('!==', '!=')
    .replaceAll('===', '==')
    .replace(/;$/, '');

  if (opts?.constToLet)
    simplified = simplified.replaceAll('const ', 'let ');

  return simplified;
}

function substCode(code: string): string {
  const useLogs = true;
  const toRegExp = (str: string) => new RegExp(str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');

  let replacedCode = code;
  let restoreSuffix = '';

  function subst(
    replaceFrom: string | RegExp, replaceTo: string,
    restoreFrom?: string | RegExp, restoreTo?: string,
  ) {
    const isReplaceFromStr = typeof replaceFrom === 'string';
    restoreFrom = restoreFrom ?? replaceTo;
    restoreTo = restoreTo ?? (isReplaceFromStr ? replaceFrom : replaceFrom.source);

    const replaceFromRegExp = isReplaceFromStr ? toRegExp(replaceFrom) : replaceFrom;
    const restoreFromRegExp = typeof restoreFrom === 'string' ? toRegExp(restoreFrom) : restoreFrom;

    const beforeLength = replacedCode.length;
    replacedCode = replacedCode.replace(replaceFromRegExp, replaceTo);
    const restorePart = `.replace(${restoreFromRegExp},'${restoreTo}')`;
    restoreSuffix = restorePart + restoreSuffix;

    if (useLogs) {
      const logReplaceFrom = isReplaceFromStr ? `'${replaceFrom}'` : replaceFrom.toString();
      const logReplaceTo = `'${replaceTo}'`;
      const savedChars = beforeLength - replacedCode.length - restorePart.length;
      console.log(`Replace ${logReplaceFrom.padEnd(11)} → ${logReplaceTo.padEnd(5)} saves ${savedChars} chars`);
    }
  }

  // Unused single-char: "`#@/ ; Extra (tricky): '\
  subst(',()=>'     /**/, '@');
  subst(/\((.)\)@/g /**/, '#$1', /#(.)/g, '($1)@');
  subst('const '    /**/, '"');
  subst(')@'        /**/, '`');
  subst('=0,'       /**/, '/');
  subst('=65280&'   /**/, '@@');
  subst(')<<8'      /**/, '@#');
  subst('for(let '  /**/, '@/');
  subst('()=>'      /**/, '#"');

  const codeResult = `'${replacedCode}'${restoreSuffix}`;
  check(eval(codeResult) === code, 'Restored code does not match original');

  const selfExtracted = `eval(${codeResult})`;

  if (useLogs)
    console.log(`Total saves ${code.length - selfExtracted.length} chars\n`);

  return selfExtracted;
}
