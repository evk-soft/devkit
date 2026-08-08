import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, it } from 'vitest';

import {
  createArtifactScanBudget,
  createStage1ArtifactPolicy,
  PrivateMarkerStream,
  scanArtifactManifest,
} from '../../scripts/check-stage1-artifacts.mjs';
import vectors from '../fixtures/artifact-scan/vectors.json' with { type: 'json' };

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCANNER = join(PACKAGE_ROOT, 'scripts', 'check-stage1-artifacts.mjs');
const POLICY_PATH = 'packages/ai-tooling/tests/fixtures/stage1-artifact-policy.json';
const MANIFEST_PATH = (phase: number) =>
  `docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-${phase}.txt`;

const roots: string[] = [];

afterEach(async () => {
  while (roots.length > 0) {
    const root = roots.pop();
    if (root !== undefined) await rm(root, { recursive: true, force: true, maxRetries: 5 });
  }
});

interface ScanFixtureResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

async function scanFixture(options: {
  readonly phase: 1 | 2 | 3 | 4 | 5;
  readonly mode: 'tree' | 'cached';
  readonly files: Readonly<Record<string, string>>;
  readonly manifest?: readonly string[];
}): Promise<ScanFixtureResult> {
  const root = await mkdtemp(join(tmpdir(), 'evk-artifact-scan-'));
  roots.push(root);

  const write = async (relativePath: string, contents: string): Promise<void> => {
    const absolute = join(root, relativePath);
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, contents);
  };

  const declared = options.manifest ?? ['A 100644 packages/ai-tooling/declared.txt'];
  await write(MANIFEST_PATH(options.phase), declared.map((line) => `${line}\n`).join(''));
  await write(POLICY_PATH, await readPolicySource());
  await write('packages/ai-tooling/declared.txt', 'declared\n');
  for (const [relativePath, contents] of Object.entries(options.files)) {
    await write(relativePath, contents);
  }

  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [SCANNER, '--phase', String(options.phase), `--${options.mode}`],
      { cwd: root, shell: false },
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
    child.on('close', (code) => resolve({ exitCode: code ?? 1, stdout, stderr }));
  });
}

async function readPolicySource(): Promise<string> {
  const { readFile } = await import('node:fs/promises');
  return readFile(join(PACKAGE_ROOT, 'tests', 'fixtures', 'stage1-artifact-policy.json'), 'utf8');
}

it('rejects an unlisted artifact without echoing its bytes', async () => {
  const secret = ['synthetic_', 'private_', 'marker_', '7f31'].join('');
  const result = await scanFixture({
    phase: 1,
    mode: 'tree',
    files: { 'packages/ai-tooling/unlisted.txt': secret },
  });
  expect(result.exitCode).toBe(1);
  expect(result.stderr).toContain('packages/ai-tooling/unlisted.txt:undeclared-entry');
  expect(result.stderr).not.toContain(secret);
});

it('rejects a forgotten transient implementation stub across stream chunks', async () => {
  const body = Uint8Array.from([
    69, 86, 75, 95, 73, 78, 84, 69, 82, 78, 65, 76, 95, 78, 79, 84, 95, 73, 77, 80, 76, 69, 77, 69,
    78, 84, 69, 68,
  ]);
  async function* chunks(): AsyncIterable<Uint8Array> {
    yield body.subarray(0, 7);
    yield body.subarray(7, 19);
    yield body.subarray(19);
  }
  const result = await scanArtifactManifest(
    [
      {
        path: 'packages/ai-tooling/src/json/strict-json.ts',
        mode: '100644',
        byteLength: body.byteLength,
        chunks: chunks(),
        expectedDigest: null,
      },
    ],
    createStage1ArtifactPolicy(),
    createArtifactScanBudget(() => 0n),
  );
  expect(result.findings).toStrictEqual([
    {
      path: 'packages/ai-tooling/src/json/strict-json.ts',
      findingClass: 'private-marker',
    },
  ]);
});

// The sentinel is assembled from bytes here too: no committed fixture or test source may contain
// its printable form contiguously.
const SENTINEL = Uint8Array.from([
  69, 86, 75, 95, 73, 78, 84, 69, 82, 78, 65, 76, 95, 78, 79, 84, 95, 73, 77, 80, 76, 69, 77, 69,
  78, 84, 69, 68,
]);

function mutate(mutation: string): Uint8Array {
  const base = [...SENTINEL];
  switch (mutation) {
    case 'none':
      return Uint8Array.from(base);
    case 'drop-last':
      return Uint8Array.from(base.slice(0, -1));
    case 'drop-first':
      return Uint8Array.from(base.slice(1));
    case 'alter-first': {
      const first = base[0];
      if (first === undefined) throw new Error('cannot alter the first byte of an empty body');
      return Uint8Array.from([first ^ 0x20, ...base.slice(1)]);
    }
    case 'alter-last': {
      const last = base[base.length - 1];
      if (last === undefined) throw new Error('cannot alter the last byte of an empty body');
      return Uint8Array.from([...base.slice(0, -1), last ^ 0x20]);
    }
    case 'duplicate':
      return Uint8Array.from([...base, ...base]);
    case 'append-lf':
      return Uint8Array.from([...base, 0x0a]);
    case 'append-backslash-n':
      return Uint8Array.from([...base, 0x5c, 0x6e]);
    case 'empty':
      return Uint8Array.from([]);
    default:
      throw new Error(`unknown mutation: ${mutation}`);
  }
}

function matchesAcrossSplits(body: Uint8Array, splits: readonly number[]): boolean {
  const matcher = new PrivateMarkerStream(SENTINEL);
  let previous = 0;
  let matched = false;
  for (const split of [...splits, body.byteLength]) {
    if (matcher.push(body.subarray(previous, split))) matched = true;
    previous = split;
  }
  return matched;
}

it.each(vectors.cases)('matcher vector: $name', (testCase) => {
  const body = mutate(testCase.mutation);
  if (testCase.allSplits === true) {
    for (let split = 0; split <= body.byteLength; split += 1) {
      expect(matchesAcrossSplits(body, [split])).toBe(testCase.expectMatch);
    }
    return;
  }
  expect(matchesAcrossSplits(body, [])).toBe(testCase.expectMatch);
});
