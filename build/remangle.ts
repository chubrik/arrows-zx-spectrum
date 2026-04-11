import * as acorn from 'acorn';

interface Scope {
  declared: Set<string>;
  referenced: Set<string>;
  children: Scope[];
}

/** Optimal top-level variable re-mangling using acorn scope analysis. */
// Terser's mangler assigns short names per-scope greedily, which can give
// 1-char names to low-frequency local variables while high-frequency top-level
// variables get 2-char names. This pass fixes that by reassigning top-level
// names based on global reference frequency.
export function remangleTopLevel(code: string): string {
  const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' }) as any;

  // Build scope tree
  const globalScope: Scope = { declared: new Set(), referenced: new Set(), children: [] };
  let current = globalScope;

  function enter(): Scope {
    const s: Scope = { declared: new Set(), referenced: new Set(), children: [] };
    current.children.push(s);
    current = s;
    return s;
  }

  function leave() {
    // Find parent by walking from global
    function findParent(scope: Scope, target: Scope): Scope | null {
      for (const child of scope.children) {
        if (child === target) return scope;
        const found = findParent(child, target);
        if (found) return found;
      }
      return null;
    }
    current = findParent(globalScope, current) || globalScope;
  }

  const identPositions: { start: number, end: number, name: string }[] = [];

  function walkPattern(node: any, declare: boolean) {
    if (!node) return;
    if (node.type === 'Identifier') {
      if (declare) current.declared.add(node.name);
      identPositions.push(node);
    } else if (node.type === 'AssignmentPattern') {
      walkPattern(node.left, declare);
      walkNode(node.right);
    } else if (node.type === 'RestElement') {
      walkPattern(node.argument, declare);
    } else if (node.type === 'ArrayPattern') {
      for (const el of node.elements) if (el) walkPattern(el, declare);
    } else if (node.type === 'ObjectPattern') {
      for (const prop of node.properties) walkPattern(prop.value || prop.argument, declare);
    }
  }

  function walkNode(node: any) {
    if (!node || typeof node !== 'object') return;

    switch (node.type) {
      case 'ArrowFunctionExpression':
      case 'FunctionExpression':
      case 'FunctionDeclaration': {
        if (node.type === 'FunctionDeclaration' && node.id) {
          current.declared.add(node.id.name);
          identPositions.push(node.id);
        }
        enter();
        for (const p of node.params) walkPattern(p, true);
        walkNode(node.body);
        leave();
        return;
      }
      case 'VariableDeclaration':
        for (const d of node.declarations) {
          walkPattern(d.id, true);
          if (d.init) walkNode(d.init);
        }
        return;
      case 'Identifier':
        current.referenced.add(node.name);
        identPositions.push(node);
        return;
      case 'MemberExpression':
        walkNode(node.object);
        if (node.computed) walkNode(node.property);
        return;
      case 'Property':
        if (node.computed) walkNode(node.key);
        walkNode(node.value);
        return;
    }

    for (const key of Object.keys(node)) {
      if (key === 'type' || key === 'start' || key === 'end' || key === 'raw') continue;
      const val = node[key];
      if (Array.isArray(val)) {
        for (const item of val) if (item && typeof item.type === 'string') walkNode(item);
      } else if (val && typeof val === 'object' && typeof val.type === 'string') {
        walkNode(val);
      }
    }
  }

  walkNode(ast);

  // For each top-level var, find names blocked by child scopes
  function getBlocked(varName: string): Set<string> {
    const blocked = new Set<string>();
    function check(scope: Scope) {
      if (scope.referenced.has(varName)) {
        for (const d of scope.declared) blocked.add(d);
      }
      for (const child of scope.children) check(child);
    }
    for (const child of globalScope.children) check(child);
    return blocked;
  }

  // Count references from AST positions (excludes property keys and member access)
  const topVars = [...globalScope.declared];
  const topVarSet = new Set(topVars);
  const freq: Record<string, number> = {};
  for (const name of topVars) freq[name] = 0;
  for (const pos of identPositions) {
    if (topVarSet.has(pos.name)) freq[pos.name]++;
  }

  // Sort by frequency descending
  topVars.sort((a, b) => freq[b] - freq[a]);

  // Generate candidate names: 1-char first, then 2-char
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$';
  const candidates: string[] = [];
  // 1-char names
  for (const c of chars) candidates.push(c);
  // 2-char names
  for (const c1 of chars) for (const c2 of chars + '0123456789') candidates.push(c1 + c2);

  // Assign optimal names greedily
  const assigned = new Set<string>();
  const rename: Record<string, string> = {};

  for (const oldName of topVars) {
    const blocked = getBlocked(oldName);
    for (const newName of candidates) {
      if (assigned.has(newName)) continue;
      if (blocked.has(newName)) continue;
      // Also: new name must not be a JS keyword
      if (isKeyword(newName)) continue;
      assigned.add(newName);
      rename[oldName] = newName;
      break;
    }
  }

  // Check if any renaming actually changes things
  let savings = 0;
  for (const [oldName, newName] of Object.entries(rename)) {
    savings += (oldName.length - newName.length) * freq[oldName];
  }
  if (savings <= 0) return code;

  // Apply renames at exact AST positions (preserves property keys and member access)
  const toReplace = identPositions
    .filter(p => p.name in rename)
    .sort((a, b) => a.start - b.start);

  let result = '';
  let lastEnd = 0;
  for (const pos of toReplace) {
    result += code.slice(lastEnd, pos.start) + rename[pos.name];
    lastEnd = pos.end;
  }
  result += code.slice(lastEnd);

  // const newSize = result.length;
  // const oldSize = code.length;
  // console.log(`  remangle: ${oldSize} → ${newSize} bytes (${oldSize - newSize > 0 ? '-' : '+'}${Math.abs(oldSize - newSize)})`);

  return result;
}

function isKeyword(name: string): boolean {
  const keywords = new Set([
    'break', 'case', 'catch', 'continue', 'debugger', 'default', 'delete',
    'do', 'else', 'finally', 'for', 'function', 'if', 'in', 'instanceof',
    'new', 'return', 'switch', 'this', 'throw', 'try', 'typeof', 'var',
    'void', 'while', 'with', 'class', 'const', 'enum', 'export', 'extends',
    'import', 'super', 'implements', 'interface', 'let', 'package', 'private',
    'protected', 'public', 'static', 'yield', 'await', 'of',
  ]);
  return keywords.has(name);
}
