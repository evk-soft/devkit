#!/usr/bin/env node
// Typechecks the test sources, which no other command does.
//
// Why this exists at all: every workspace tsconfig deliberately sets `include: ["src/**/*.ts"]`,
// and Vitest transpiles without checking types, so no `.spec.ts` file was ever seen by a compiler.
// That silently defeats `@ts-expect-error` assertions -- an inverted or dead one reads as passing --
// and lets ordinary type errors accumulate in tests unnoticed.
//
// Why it is a repository-root guard rather than a `tsconfig.test.json` next to the tests:
//   * extending the workspace tsconfig is not an option. `rootDir: "src"` with `composite` and
//     `outDir: "dist"` means including tests would emit them into `dist`, and `pack:check` asserts
//     the published tarball's contents exactly.
//   * a new file under `packages/ai-tooling` or `configs/ai` is reported as `undeclared-entry` by
//     `check-stage1-artifacts.mjs`, whose owned roots are exactly those two directories, and the
//     Stage 1 phase manifests are committed records that must not be rewritten to admit it.
//   * `scripts/` at the repository root is outside those roots and already holds the other guards.
//
// Why it is not part of `pnpm check`: Stage 1 phase gates invoke `pnpm check` literally, and that
// command must not acquire new failure modes. This runs as its own script and its own CI step,
// exactly like `check:structure` and `check:supply-chain`.
//
// Two TypeScript 7 behaviours shape the invocation, both measured rather than assumed:
//   * TS5112 -- command-line file arguments are refused while a `tsconfig.json` is present, so
//     `--ignoreConfig` is required.
//   * TS6053 -- file arguments are not glob-expanded, so the file list is enumerated here.

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { argv, cwd, exit, stderr, stdout } from 'node:process';

const ROOT = resolve(dirname(argv[1] ?? cwd()), '..');
const WORKSPACE_PARENTS = ['packages', 'configs'];

// Emit shape belongs to the build, never to a type-only pass. Dropping these is what keeps the
// guard from writing anything, and from tripping over `rootDir` when the inputs live beside `src`.
const EMIT_OPTIONS = new Set([
  'composite',
  'declaration',
  'declarationDir',
  'declarationMap',
  'emitDeclarationOnly',
  'incremental',
  'outDir',
  'outFile',
  'rootDir',
  'sourceMap',
  'tsBuildInfoFile',
]);

function fail(message) {
  stderr.write(`${message}\n`);
  exit(1);
}

function readJsonc(path) {
  // The workspace tsconfigs are plain JSON by policy -- `pnpm check` runs Biome over them -- so a
  // real JSONC parser would be dead weight. A parse failure is a failure, never a skip.
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`CONFIG_UNREADABLE: ${path}: ${error.message}`);
  }
}

function listTrackedTestSources(workspace) {
  const result = spawnSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '-z', '--', 'tests'],
    { cwd: workspace, shell: false, encoding: 'buffer', timeout: 30_000 },
  );
  if (result.error !== undefined) fail(`GIT_UNAVAILABLE: ${result.error.message}`);
  if (result.status !== 0) fail(`GIT_FAILED: could not list test sources in ${workspace}`);
  return new TextDecoder('utf-8', { fatal: true })
    .decode(result.stdout)
    .split('\0')
    .filter((path) => path.endsWith('.ts'))
    .sort()
    .map((path) => join(workspace, path));
}

function toCompilerFlags(options) {
  const flags = [];
  for (const [name, value] of Object.entries(options)) {
    if (EMIT_OPTIONS.has(name)) continue;
    if (typeof value === 'boolean') {
      flags.push(`--${name}`, value ? 'true' : 'false');
      continue;
    }
    if (typeof value === 'string') {
      flags.push(`--${name}`, value);
      continue;
    }
    if (Array.isArray(value) && value.every((entry) => typeof entry === 'string')) {
      flags.push(`--${name}`, value.join(','));
      continue;
    }
    fail(`CONFIG_UNSUPPORTED: compilerOptions.${name} is not a string, boolean, or string array`);
  }
  return flags;
}

function resolveTypeScriptEntry(workspace) {
  // Resolved from the workspace so the guard uses the same compiler the workspace builds with, and
  // spawned through its JavaScript entry with the current Node binary: the bare name `tsc` resolves
  // only to a .CMD shim on Windows and fails with ENOENT under `shell: false`.
  const require = createRequire(join(workspace, 'package.json'));
  let manifest;
  try {
    manifest = require.resolve('typescript/package.json');
  } catch {
    fail(`TYPESCRIPT_UNAVAILABLE: ${workspace} cannot resolve typescript`);
  }
  const entry = join(dirname(manifest), 'lib', 'tsc.js');
  if (!existsSync(entry)) fail(`TYPESCRIPT_UNAVAILABLE: ${entry} is absent`);
  return entry;
}

function collectWorkspaces() {
  const workspaces = [];
  for (const parent of WORKSPACE_PARENTS) {
    const absoluteParent = join(ROOT, parent);
    if (!existsSync(absoluteParent)) continue;
    for (const entry of readdirSync(absoluteParent, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const workspace = join(absoluteParent, entry.name);
      if (!existsSync(join(workspace, 'tsconfig.json'))) continue;
      if (!existsSync(join(workspace, 'tests'))) continue;
      workspaces.push(workspace);
    }
  }
  return workspaces;
}

const workspaces = collectWorkspaces();
if (workspaces.length === 0) {
  fail('NO_WORKSPACES: no workspace has both a tsconfig.json and a tests directory');
}

let checkedFiles = 0;
for (const workspace of workspaces) {
  const files = listTrackedTestSources(workspace);
  if (files.length === 0) fail(`NO_TEST_SOURCES: ${workspace}/tests contains no .ts file`);

  const config = readJsonc(join(workspace, 'tsconfig.json'));
  const options = { ...(config.compilerOptions ?? {}) };
  if (Object.keys(options).length === 0) {
    fail(`CONFIG_EMPTY: ${workspace}/tsconfig.json declares no compilerOptions`);
  }

  const flags = toCompilerFlags(options);
  // `allowJs` is the one option added rather than inherited. Two specs import the repository's own
  // `scripts/*.mjs` guards directly; without it every such import is an implicit `any` (TS7016) and
  // the assertions written against them would check nothing. `checkJs` stays off, so those JavaScript
  // files are read for inference but never themselves reported on.
  const entry = resolveTypeScriptEntry(workspace);
  const result = spawnSync(
    process.execPath,
    [
      entry,
      '--ignoreConfig',
      '--noEmit',
      'true',
      '--allowJs',
      'true',
      '--pretty',
      'false',
      ...flags,
      ...files,
    ],
    { cwd: workspace, shell: false, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );
  if (result.error !== undefined) fail(`TYPESCRIPT_FAILED: ${result.error.message}`);
  if (result.status !== 0) {
    stderr.write(result.stdout);
    stderr.write(result.stderr);
    fail(`TYPE_ERRORS: ${workspace}`);
  }
  checkedFiles += files.length;
}

stdout.write(
  `check-test-types ok (${workspaces.length} workspaces, ${checkedFiles} test sources)\n`,
);
