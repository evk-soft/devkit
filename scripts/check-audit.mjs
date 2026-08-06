#!/usr/bin/env node
// Bounded wrapper over `pnpm audit`. An unreachable registry or an unparseable response is a
// failure, never a silent pass.
import { spawnSync } from 'node:child_process';

const IGNORED_ADVISORIES = new Set([
  // 'GHSA-xxxx-yyyy-zzzz',  // reason, reviewed YYYY-MM-DD
]);
const FAIL_LEVELS = ['high', 'critical'];

// Run pnpm's JavaScript entry through this Node binary. Spawning the bare name `pnpm` with
// shell: false fails on Windows with ENOENT, because pnpm resolves only to a pnpm.CMD shim there,
// and shell: true would add an argument-quoting surface for no benefit. pnpm sets npm_execpath when
// it invokes a package script, which is the only supported way to run this guard.
const pnpmEntry = process.env.npm_execpath;
if (pnpmEntry === undefined) {
  console.error('AUDIT_UNAVAILABLE: run this through `pnpm run check:audit`, not directly');
  process.exit(1);
}

const result = spawnSync(process.execPath, [pnpmEntry, 'audit', '--json'], {
  encoding: 'utf8',
  shell: false,
  maxBuffer: 64 * 1024 * 1024,
});

if (result.error !== undefined) {
  console.error(`AUDIT_UNAVAILABLE: ${result.error.message}`);
  process.exit(1);
}

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  console.error('AUDIT_UNPARSEABLE: pnpm audit did not emit JSON');
  console.error(result.stderr.slice(0, 2000));
  process.exit(1);
}

const advisories = Object.values(report.advisories ?? {});
const blocking = advisories.filter(
  (a) => FAIL_LEVELS.includes(a.severity) && !IGNORED_ADVISORIES.has(a.github_advisory_id ?? a.url),
);

if (blocking.length > 0) {
  for (const a of blocking) {
    console.error(`ADVISORY: ${a.severity} ${a.github_advisory_id ?? a.url} ${a.module_name}`);
  }
  process.exit(1);
}
console.log(`check-audit ok (${advisories.length} advisories, 0 blocking)`);
