#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'changelog.d');
const slug = process.argv[2];

if (slug === undefined || !/^[a-z0-9][a-z0-9-]*$/u.test(slug)) {
  console.error('usage: node scripts/changelog-new.mjs <slug>   (lowercase, digits and hyphens)');
  process.exit(1);
}
const target = join(DIR, `${slug}.md`);
if (existsSync(target)) {
  console.error(`fragment already exists: changelog.d/${slug}.md`);
  process.exit(1);
}
writeFileSync(target, readFileSync(join(DIR, '_template.md'), 'utf8'), 'utf8');
console.log(`created changelog.d/${slug}.md`);
