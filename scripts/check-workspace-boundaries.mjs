#!/usr/bin/env node
// Fails when a relative import escapes its own workspace directory. pnpm's isolated linker already
// blocks phantom package imports; a deep relative path such as ../../other/src/x sidesteps package
// boundaries entirely and nothing else in this repository looks for it.
//
// Known limits, accepted deliberately: the regex does not strip comments, so a commented-out
// relative import is reported; and it does not match CommonJS require('../../x'). This repository
// is ESM throughout, a false positive is loud and cheap, and the missed case cannot occur without
// first adding CommonJS sources. Revisit if .cjs files ever appear.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GLOB_DIRS = ['configs', 'packages'];
const SOURCE_EXT = new Set(['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs']);
const SKIP_DIRS = new Set(['node_modules', 'dist', '.turbo', '.git']);
const IMPORT_RE =
  /(?:^|[^\w$])(?:import|export)\s[^'"]*?from\s*['"](\.[^'"]*)['"]|import\s*\(\s*['"](\.[^'"]*)['"]\s*\)/gmu;

function listWorkspaceDirs() {
  const dirs = [];
  for (const dir of GLOB_DIRS) {
    const base = join(ROOT, dir);
    if (!existsSync(base)) continue;
    for (const entry of readdirSync(base, { withFileTypes: true })) {
      if (entry.isDirectory() && existsSync(join(base, entry.name, 'package.json'))) {
        dirs.push(join(base, entry.name));
      }
    }
  }
  return dirs;
}

function walk(dir, out) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (SOURCE_EXT.has(entry.name.slice(entry.name.lastIndexOf('.')))) out.push(full);
  }
  return out;
}

const violations = [];
let scanned = 0;
for (const workspace of listWorkspaceDirs()) {
  for (const file of walk(workspace, [])) {
    scanned += 1;
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(IMPORT_RE)) {
      const spec = match[1] ?? match[2];
      if (spec === undefined) continue;
      const target = resolve(dirname(file), spec);
      const rel = relative(workspace, target);
      if (rel.startsWith(`..${sep}`) || rel === '..') {
        violations.push(`${relative(ROOT, file)} -> ${spec}`);
      }
    }
  }
}

if (violations.length > 0) {
  for (const v of violations) console.error(`BOUNDARY_ESCAPE: ${v}`);
  process.exit(1);
}
console.log(`check-workspace-boundaries ok (${scanned} source files, no escape)`);
