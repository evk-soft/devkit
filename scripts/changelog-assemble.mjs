#!/usr/bin/env node
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'changelog.d');
const TYPES = new Set(['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security']);
const checkOnly = process.argv.includes('--check');

function parse(name) {
  const text = readFileSync(join(DIR, name), 'utf8');
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/u.exec(text);
  if (match === null) throw new Error(`${name}: missing front matter`);
  const meta = {};
  for (const line of match[1].split(/\r?\n/u)) {
    if (line.trim().startsWith('#') || line.trim() === '') continue;
    const kv = /^([a-zA-Z]+):\s*(.*)$/u.exec(line);
    if (kv === null) throw new Error(`${name}: unparseable front-matter line "${line}"`);
    meta[kv[1]] = kv[2].trim();
  }
  if (!TYPES.has(meta.type)) {
    throw new Error(`${name}: type must be one of ${[...TYPES].join(', ')}`);
  }
  const body = /## changelog\r?\n([\s\S]*?)(?=\r?\n## |\s*$)/u.exec(match[2]);
  const entry = (body?.[1] ?? '')
    .split(/\r?\n/u)
    .filter((l) => !l.trim().startsWith('<!--'))
    .join('\n')
    .trim();
  if (entry === '') throw new Error(`${name}: the "## changelog" section is empty`);
  return { name, type: meta.type, scope: meta.scope, entry };
}

const names = readdirSync(DIR).filter(
  (n) => n.endsWith('.md') && n !== 'README.md' && n !== '_template.md',
);
const errors = [];
const parsed = [];
for (const name of names.sort()) {
  try {
    parsed.push(parse(name));
  } catch (error) {
    errors.push(error.message);
  }
}
if (errors.length > 0) {
  for (const message of errors) console.error(`FRAGMENT_INVALID: ${message}`);
  process.exit(1);
}
if (checkOnly) {
  console.log(`changelog-assemble ok (${parsed.length} fragments valid)`);
  process.exit(0);
}
const sections = new Map();
for (const item of parsed) {
  if (!sections.has(item.type)) sections.set(item.type, []);
  sections
    .get(item.type)
    .push(item.scope === undefined ? item.entry : `**${item.scope}:** ${item.entry}`);
}
const lines = [];
for (const type of [...TYPES].filter((t) => sections.has(t))) {
  lines.push(`### ${type}`, '');
  for (const entry of sections.get(type).sort()) lines.push(`- ${entry}`);
  lines.push('');
}
process.stdout.write(`${lines.join('\n')}\n`);
