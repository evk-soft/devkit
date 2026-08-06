#!/usr/bin/env node
// Allowlist over installed dependency licences. Reads package manifests from the pnpm store layout
// directly rather than parsing CLI JSON, so the check does not depend on a pnpm output shape.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STORE = join(ROOT, 'node_modules', '.pnpm');
const ALLOWED = new Set([
  '0BSD',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'BlueOak-1.0.0',
  'CC0-1.0',
  'CC-BY-4.0',
  'ISC',
  'MIT',
  'MIT-0',
  // MPL-2.0 is file-level weak copyleft: it obliges disclosure only for modified MPL files, never
  // for a work that merely depends on them, so it is safe for a permissively licensed toolchain.
  // Present today via lightningcss, an optional transitive dependency of vite under Vitest 4.
  'MPL-2.0',
  'Python-2.0',
  'Unlicense',
]);
const EXEMPT = new Set([]); // 'package@version' entries, each with a reviewed reason

function licenceOf(manifest) {
  if (typeof manifest.license === 'string') return manifest.license;
  if (typeof manifest.license === 'object' && manifest.license !== null)
    return manifest.license.type;
  if (Array.isArray(manifest.licenses) && manifest.licenses.length > 0)
    return manifest.licenses[0].type;
  return undefined;
}

function isAllowed(expression) {
  if (expression === undefined) return false;
  // Accept simple SPDX OR/AND groupings when every named licence is allowed.
  return expression
    .replace(/[()]/gu, ' ')
    .split(/\s+(?:OR|AND)\s+/u)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .every((part) => ALLOWED.has(part));
}

if (!existsSync(STORE)) {
  console.error('LICENSE_STORE_MISSING: run pnpm install first');
  process.exit(1);
}

const violations = [];
let checked = 0;
for (const entry of readdirSync(STORE, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name === 'node_modules') continue;
  const inner = join(STORE, entry.name, 'node_modules');
  if (!existsSync(inner)) continue;
  const scopes = readdirSync(inner, { withFileTypes: true });
  const manifests = [];
  for (const scope of scopes) {
    if (!scope.isDirectory()) continue;
    if (scope.name.startsWith('@')) {
      for (const pkg of readdirSync(join(inner, scope.name), { withFileTypes: true })) {
        if (pkg.isDirectory()) manifests.push(join(inner, scope.name, pkg.name, 'package.json'));
      }
    } else {
      manifests.push(join(inner, scope.name, 'package.json'));
    }
  }
  for (const path of manifests) {
    if (!existsSync(path)) continue;
    const manifest = JSON.parse(readFileSync(path, 'utf8'));
    if (typeof manifest.name !== 'string') continue;
    const id = `${manifest.name}@${manifest.version}`;
    if (EXEMPT.has(id)) continue;
    checked += 1;
    const licence = licenceOf(manifest);
    if (!isAllowed(licence)) violations.push(`${id}: ${licence ?? '<none declared>'}`);
  }
}

if (violations.length > 0) {
  for (const v of [...new Set(violations)].sort())
    console.error(`DEPENDENCY_LICENSE_CONFLICT: ${v}`);
  process.exit(1);
}
console.log(`check-licenses ok (${checked} packages, 0 conflicts)`);
