import { build } from "esbuild";
import { minify } from "terser";
import { readFileSync, writeFileSync, readdirSync, globSync } from "fs";

// Step 1: Bundle with esbuild (no minification — terser will handle it)
await build({
  entryPoints: globSync("src/*.ts"),
  bundle: true,
  format: "esm",
  outdir: "dist",
  drop: ["console", "debugger"],
  treeShaking: true,
});

// Terser options for aggressive minification
const terserOpts = {
  module: true,
  toplevel: true,
  ecma: 2020,
  compress: {
    passes: 4,
    toplevel: true,
    ecma: 2020,
    inline: 3,
    reduce_vars: true,
    collapse_vars: true,
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
  },
  mangle: { toplevel: true },
  format: { ecma: 2020, semicolons: true },
};

const files = readdirSync("dist").filter((f) => f.endsWith(".js"));
for (const file of files) {
  const path = `dist/${file}`;
  const original = readFileSync(path, "utf8");
  let code = original;

  // Pass 1: Terser aggressive minification
  code = (await minify(code, terserOpts)).code;

  // Pass 2: Convert function declarations/expressions to arrow functions
  code = convertFunctions(code);

  // Pass 3: Terser again — optimizes arrow bodies ({return expr} → expr), inlines IIFEs
  code = (await minify(code, terserOpts)).code;

  writeFileSync(path, code);
  console.log(`${file}: ${original.length} -> ${code.length} bytes`);
}

// ── Convert all function declarations/expressions to arrow functions ──
// Safe for this project: no this/arguments/new.target usage in any function.
// Uses brace-counting to extract bodies; handles nested functions recursively.

function convertFunctions(code) {
  let result = "";
  let i = 0;

  while (i < code.length) {
    const isNamed = code.startsWith("function ", i);
    const isAnon = !isNamed && code.startsWith("function(", i);

    if (isNamed || isAnon) {
      const info = extractFunction(code, i, isNamed);
      if (info) {
        // Recursively convert any functions nested in the body
        const body = convertFunctions(info.body);
        const params = fmtParams(info.params);
        const isIIFE = info.end < code.length && code[info.end] === "(";

        if (isNamed) {
          // function name(p){body} → var name=p=>{body};
          result += isIIFE
            ? `var ${info.name}=(${params}=>{${body}})`
            : `var ${info.name}=${params}=>{${body}};`;
        } else {
          // function(p){body} → p=>{body}  (wrapped in parens if IIFE)
          result += isIIFE
            ? `(${params}=>{${body}})`
            : `${params}=>{${body}}`;
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

function extractFunction(code, start, named) {
  let i = start + "function".length;
  let name = "";

  if (named) {
    if (code[i] !== " ") return null;
    i++;
    const s = i;
    while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) i++;
    name = code.slice(s, i);
    if (!name) return null;
  }

  // Extract params (balanced parens)
  if (code[i] !== "(") return null;
  i++;
  const ps = i;
  let depth = 1;
  while (i < code.length && depth > 0) {
    if (code[i] === "(") depth++;
    else if (code[i] === ")") depth--;
    i++;
  }
  const params = code.slice(ps, i - 1);

  // Extract body (balanced braces, skipping strings)
  if (code[i] !== "{") return null;
  i++;
  const bs = i;
  depth = 1;
  while (i < code.length && depth > 0) {
    const ch = code[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      i++;
      while (i < code.length && code[i] !== ch) {
        if (code[i] === "\\") i++;
        i++;
      }
      i++; // skip closing quote
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    i++;
  }
  const body = code.slice(bs, i - 1);

  return { name, params, body, end: i };
}

function fmtParams(params) {
  if (!params) return "()";
  // Single simple param → no parens needed (saves 2 chars)
  if (!/[,={\[]/.test(params)) return params;
  return `(${params})`;
}
