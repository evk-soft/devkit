import { spawn } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, it } from 'vitest';

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

interface PackageCheckResult {
  readonly exitCode: number;
  readonly entries: readonly string[];
  readonly stderr: string;
}

const staleArtifacts = [
  join(PACKAGE_ROOT, 'dist', 'stale.js'),
  join(PACKAGE_ROOT, 'dist', 'native', 'win32-x64', 'ai-tooling-win32-helper.exe'),
];

afterEach(async () => {
  for (const path of staleArtifacts) {
    await rm(path, { force: true });
  }
  await rm(join(PACKAGE_ROOT, 'dist', 'native'), { recursive: true, force: true });
});

function runPackageCheck(): Promise<PackageCheckResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [join(PACKAGE_ROOT, 'scripts', 'check-package-contents.mjs'), '--json'],
      { cwd: PACKAGE_ROOT, shell: false },
    );
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      let entries: readonly string[] = [];
      try {
        entries = JSON.parse(stdout).entries ?? [];
      } catch {
        entries = [];
      }
      resolve({ exitCode: code ?? 1, entries, stderr });
    });
  });
}

it('exports only the public root and schemas', async () => {
  const manifest = JSON.parse(
    await readFile(new URL('../../package.json', import.meta.url), 'utf8'),
  );
  expect(manifest.version).toBe('0.1.0');
  expect(manifest.type).toBe('module');
  expect(manifest.exports).toStrictEqual({
    '.': { types: './dist/index.d.ts', import: './dist/index.js' },
    './schemas/*.json': './schemas/*.json',
    './package.json': './package.json',
  });
  expect(manifest.bin).toStrictEqual({ 'ai-tooling': './dist/cli.js' });
  expect(manifest.files).toStrictEqual(['dist', 'schemas', 'README.md', 'LICENSE']);
  expect(manifest.engines).toStrictEqual({ node: '>=24.0.0' });
  expect(manifest.publishConfig).toStrictEqual({ access: 'public' });
});

it('packs a fresh isolated build and never working dist', async () => {
  await mkdir(join(PACKAGE_ROOT, 'dist', 'native', 'win32-x64'), { recursive: true });
  await writeFile(
    join(PACKAGE_ROOT, 'dist', 'native', 'win32-x64', 'ai-tooling-win32-helper.exe'),
    'STALE-NATIVE',
  );
  await writeFile(join(PACKAGE_ROOT, 'dist', 'stale.js'), 'STALE-PORTABLE');
  const result = await runPackageCheck();
  expect(result.exitCode).toBe(0);
  expect(result.entries).not.toContain('package/dist/stale.js');
  expect(result.entries).not.toContain('package/dist/native/win32-x64/ai-tooling-win32-helper.exe');
  expect(result.entries).toStrictEqual([...result.entries].sort());
}, 300_000);
