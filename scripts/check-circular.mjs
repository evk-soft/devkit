#!/usr/bin/env node
// Fails when the declared @evk-soft/* workspace dependency graph contains a cycle.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GLOB_DIRS = ['configs', 'packages'];

function readWorkspaces() {
  const found = new Map();
  for (const dir of GLOB_DIRS) {
    const base = join(ROOT, dir);
    if (!existsSync(base)) continue;
    for (const entry of readdirSync(base, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const manifestPath = join(base, entry.name, 'package.json');
      if (!existsSync(manifestPath)) continue;
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      if (typeof manifest.name !== 'string') continue;
      const deps = new Set();
      for (const field of ['dependencies', 'devDependencies', 'peerDependencies']) {
        for (const name of Object.keys(manifest[field] ?? {})) {
          if (name.startsWith('@evk-soft/')) deps.add(name);
        }
      }
      found.set(manifest.name, { dir: `${dir}/${entry.name}`, deps });
    }
  }
  return found;
}

function findCycle(graph) {
  const state = new Map();
  const stack = [];
  function visit(name) {
    if (state.get(name) === 'done') return null;
    if (state.get(name) === 'open') return [...stack.slice(stack.indexOf(name)), name];
    if (!graph.has(name)) return null;
    state.set(name, 'open');
    stack.push(name);
    for (const next of graph.get(name).deps) {
      const cycle = visit(next);
      if (cycle !== null) return cycle;
    }
    stack.pop();
    state.set(name, 'done');
    return null;
  }
  for (const name of [...graph.keys()].sort()) {
    const cycle = visit(name);
    if (cycle !== null) return cycle;
  }
  return null;
}

const graph = readWorkspaces();
const cycle = findCycle(graph);
if (cycle !== null) {
  console.error(`PACKAGE_CYCLE: ${cycle.join(' -> ')}`);
  process.exit(1);
}
console.log(`check-circular ok (${graph.size} workspaces, no cycle)`);
