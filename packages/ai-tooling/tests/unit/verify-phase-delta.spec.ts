import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, expect, it } from 'vitest';

import {
  compareDelta,
  parseDeltaRecords,
  parseManifest,
  verifyPhaseDelta,
} from '../../scripts/verify-phase-delta.mjs';

interface SpawnRecord {
  readonly file: string;
  readonly args: readonly string[];
  readonly shell: boolean;
  readonly cwd: string;
}

type FileChanges = Readonly<Record<string, string | null>>;

interface MakeRepositoryOptions {
  readonly manifest?: readonly string[];
  readonly manifestBytes?: Uint8Array;
  readonly baseline?: FileChanges;
  readonly worktree?: FileChanges;
  readonly index?: FileChanges;
  readonly candidate?: FileChanges;
  readonly extraCommit?: FileChanges;
  readonly mergeCandidate?: boolean;
  readonly orphanCandidate?: boolean;
  readonly gitFiles?: FileChanges;
  readonly localConfig?: readonly (readonly [string, string])[];
  readonly replaceBase?: boolean;
  readonly phase?: 1 | 2 | 3 | 4 | 5;
}

const roots: string[] = [];

afterEach(async () => {
  while (roots.length > 0) {
    const root = roots.pop();
    if (root !== undefined) {
      await rm(root, { recursive: true, force: true, maxRetries: 5 });
    }
  }
});

async function makeRepository(options: MakeRepositoryOptions) {
  const phase = options.phase ?? 1;
  const root = await mkdtemp(join(tmpdir(), 'evk-phase-delta-'));
  roots.push(root);

  const setup = (args: readonly string[]): string => {
    const result = spawnSync('git', args, { cwd: root, shell: false, encoding: 'buffer' });
    if (result.status !== 0) {
      throw new Error(
        `fixture git failed: ${args.join(' ')}\n${result.stderr?.toString('utf8') ?? ''}`,
      );
    }
    return result.stdout.toString('utf8').trim();
  };

  const write = async (relativePath: string, contents: string | Uint8Array): Promise<void> => {
    const absolute = join(root, relativePath);
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, contents);
  };

  const apply = async (changes: FileChanges | undefined): Promise<void> => {
    for (const [relativePath, contents] of Object.entries(changes ?? {})) {
      if (contents === null) {
        await rm(join(root, relativePath), { force: true });
      } else {
        await write(relativePath, contents);
      }
    }
  };

  setup(['init', '--initial-branch=main']);
  setup(['config', 'user.name', 'EVK Fixture']);
  setup(['config', 'user.email', 'fixture@example.invalid']);
  setup(['config', 'commit.gpgsign', 'false']);
  setup(['config', 'core.autocrlf', 'false']);

  const manifestPath = `docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-${phase}.txt`;
  const manifestBytes =
    options.manifestBytes ??
    new TextEncoder().encode((options.manifest ?? []).map((line) => `${line}\n`).join(''));
  await write(manifestPath, manifestBytes);

  await apply(options.baseline);
  setup(['add', '--all', '--']);
  setup(['commit', '--no-verify', '--allow-empty', '-m', 'baseline']);
  const baseSha = setup(['rev-parse', 'HEAD']);

  let candidateSha = baseSha;

  if (options.extraCommit !== undefined) {
    await apply(options.extraCommit);
    setup(['add', '--all', '--']);
    setup(['commit', '--no-verify', '--allow-empty', '-m', 'intermediate']);
    candidateSha = setup(['rev-parse', 'HEAD']);
  }

  if (options.mergeCandidate === true) {
    setup(['checkout', '-b', 'side', baseSha]);
    await write('side.txt', 'side\n');
    setup(['add', '--all', '--']);
    setup(['commit', '--no-verify', '-m', 'side']);
    setup(['checkout', 'main']);
    setup(['merge', '--no-ff', '--no-verify', '-m', 'merge', 'side']);
    candidateSha = setup(['rev-parse', 'HEAD']);
  }

  if (options.candidate !== undefined) {
    await apply(options.candidate);
    setup(['add', '--all', '--']);
    setup(['commit', '--no-verify', '--allow-empty', '-m', 'candidate']);
    candidateSha = setup(['rev-parse', 'HEAD']);
  }

  if (options.index !== undefined) {
    await apply(options.index);
    setup(['add', '--all', '--']);
  }

  if (options.orphanCandidate === true) {
    setup(['checkout', '--orphan', 'orphan']);
    await write('orphan.txt', 'orphan\n');
    setup(['add', '--all', '--']);
    setup(['commit', '--no-verify', '-m', 'orphan']);
    candidateSha = setup(['rev-parse', 'HEAD']);
  }

  if (options.replaceBase === true) {
    await write('replacement.txt', 'replacement\n');
    setup(['add', '--all', '--']);
    setup(['commit', '--no-verify', '-m', 'replacement']);
    const replacement = setup(['rev-parse', 'HEAD']);
    setup(['replace', '--force', baseSha, replacement]);
  }

  for (const [key, value] of options.localConfig ?? []) {
    setup(['config', key, value]);
  }

  const gitDir = setup(['rev-parse', '--absolute-git-dir']);
  for (const [relativePath, contents] of Object.entries(options.gitFiles ?? {})) {
    const absolute = join(gitDir, relativePath);
    if (contents === null) {
      await rm(absolute, { force: true });
    } else {
      await mkdir(dirname(absolute), { recursive: true });
      await writeFile(absolute, contents);
    }
  }

  await apply(options.worktree);

  const spawns: SpawnRecord[] = [];
  const runtime = {
    gitPath: 'git',
    repositoryRoot: root,
    spawns,
    spawn(
      file: string,
      args: readonly string[],
      spawnOptions: { shell: boolean; cwd: string; env?: NodeJS.ProcessEnv },
    ) {
      spawns.push({ file, args, shell: spawnOptions.shell, cwd: spawnOptions.cwd });
      return spawnSync(file, [...args], {
        cwd: spawnOptions.cwd,
        shell: spawnOptions.shell,
        env: spawnOptions.env,
        encoding: 'buffer',
        maxBuffer: 64 * 1024 * 1024,
      });
    },
  };

  return { root, manifestPath, runtime, baseSha, candidateSha };
}

it('rejects an unexpected deletion', async () => {
  const fixture = await makeRepository({
    manifest: ['A 100644 expected.txt', 'M 100644 kept.txt'],
    baseline: { 'kept.txt': 'before\n' },
    worktree: { 'kept.txt': null, 'expected.txt': 'new\n' },
  });
  await expect(
    verifyPhaseDelta({ phase: 1, mode: 'worktree' }, fixture.runtime),
  ).rejects.toThrowError(/unexpected deletion: kept\.txt/);
  expect(fixture.runtime.spawns.every((spawn) => spawn.shell === false)).toBe(true);
});

const VERIFIER_CASES = [
  {
    name: 'extra untracked',
    manifest: ['M 100644 a.txt'],
    delta: ['M 100644 a.txt', 'A 100644 b.txt'],
    message: 'unexpected path: b.txt',
  },
  {
    name: 'missing expected',
    manifest: ['M 100644 a.txt', 'A 100644 b.txt'],
    delta: ['M 100644 a.txt'],
    message: 'missing path: b.txt',
  },
  {
    name: 'wrong status',
    manifest: ['A 100644 a.txt'],
    delta: ['M 100644 a.txt'],
    message: 'status or mode mismatch: a.txt',
  },
  {
    name: 'wrong mode',
    manifest: ['A 100644 a.txt'],
    delta: ['A 100755 a.txt'],
    message: 'status or mode mismatch: a.txt',
  },
  {
    name: 'type change',
    manifest: ['M 100644 a.txt'],
    delta: ['T 120000 a.txt'],
    message: 'unsupported delta status: T',
  },
  {
    name: 'conflict',
    manifest: ['M 100644 a.txt'],
    delta: ['U 100644 a.txt'],
    message: 'unsupported delta status: U',
  },
  {
    name: 'duplicate manifest',
    manifest: ['A 100644 a.txt', 'A 100644 a.txt'],
    delta: [],
    message: 'manifest paths are duplicate or unsorted',
  },
  {
    name: 'unsorted manifest',
    manifest: ['A 100644 b.txt', 'A 100644 a.txt'],
    delta: [],
    message: 'manifest paths are duplicate or unsorted',
  },
  {
    name: 'CRLF manifest',
    manifestBytes: new TextEncoder().encode('A 100644 a.txt\r\n'),
    delta: [],
    message: 'manifest contains CR',
  },
  {
    name: 'non-ASCII path',
    manifest: ['A 100644 café.txt'],
    delta: [],
    message: 'invalid manifest record',
  },
  {
    name: 'dot component',
    manifest: ['A 100644 a/../b.txt'],
    delta: [],
    message: 'invalid manifest path',
  },
] as const;

function encodeManifest(lines: readonly string[]): Uint8Array {
  return new TextEncoder().encode(lines.map((line) => `${line}\n`).join(''));
}

it.each(VERIFIER_CASES)('$name', (testCase) => {
  const bytes =
    'manifestBytes' in testCase ? testCase.manifestBytes : encodeManifest(testCase.manifest);
  const run = (): void => {
    compareDelta(parseManifest(bytes), parseDeltaRecords(testCase.delta));
  };
  expect(run).toThrowError(testCase.message);
});

it('accepts an exact worktree delta', async () => {
  const fixture = await makeRepository({
    manifest: ['A 100644 added.txt', 'M 100644 changed.txt'],
    baseline: { 'changed.txt': 'before\n' },
    worktree: { 'changed.txt': 'after\n', 'added.txt': 'new\n' },
  });
  await expect(
    verifyPhaseDelta({ phase: 1, mode: 'worktree' }, fixture.runtime),
  ).resolves.toBeUndefined();
});

it('rejects a nonempty index in worktree mode', async () => {
  const fixture = await makeRepository({
    manifest: ['A 100644 added.txt'],
    index: { 'added.txt': 'new\n' },
  });
  await expect(
    verifyPhaseDelta({ phase: 1, mode: 'worktree' }, fixture.runtime),
  ).rejects.toThrowError(/index is not empty/);
});

it('accepts an exact cached delta', async () => {
  const fixture = await makeRepository({
    manifest: ['A 100644 added.txt', 'M 100644 changed.txt'],
    baseline: { 'changed.txt': 'before\n' },
    index: { 'changed.txt': 'after\n', 'added.txt': 'new\n' },
  });
  await expect(
    verifyPhaseDelta({ phase: 1, mode: 'cached' }, fixture.runtime),
  ).resolves.toBeUndefined();
});

it('accepts an exact one-parent commit delta', async () => {
  const fixture = await makeRepository({
    manifest: ['A 100644 added.txt', 'M 100644 changed.txt'],
    baseline: { 'changed.txt': 'before\n' },
    candidate: { 'changed.txt': 'after\n', 'added.txt': 'new\n' },
  });
  await expect(
    verifyPhaseDelta(
      { phase: 1, mode: 'commit', base: fixture.baseSha, commit: fixture.candidateSha },
      fixture.runtime,
    ),
  ).resolves.toBeUndefined();
  expect(
    fixture.runtime.spawns.some(
      (spawn) => spawn.args.includes('rev-list') || spawn.args.some((arg) => arg.endsWith('^')),
    ),
  ).toBe(false);
});

it('rejects a merge candidate in commit mode', async () => {
  const fixture = await makeRepository({
    manifest: ['A 100644 side.txt'],
    candidate: undefined,
    mergeCandidate: true,
  });
  await expect(
    verifyPhaseDelta(
      { phase: 1, mode: 'commit', base: fixture.baseSha, commit: fixture.candidateSha },
      fixture.runtime,
    ),
  ).rejects.toThrowError(/candidate must have exactly one parent/);
});

it('rejects a candidate whose parent is not the approved base', async () => {
  const fixture = await makeRepository({
    manifest: ['A 100644 first.txt'],
    extraCommit: { 'first.txt': 'one\n' },
    candidate: { 'second.txt': 'two\n' },
  });
  await expect(
    verifyPhaseDelta(
      { phase: 1, mode: 'commit', base: fixture.baseSha, commit: fixture.candidateSha },
      fixture.runtime,
    ),
  ).rejects.toThrowError(/candidate parent is not the approved base/);
});

it('rejects a symbolic revision in commit mode', async () => {
  const fixture = await makeRepository({ manifest: ['A 100644 a.txt'] });
  await expect(
    verifyPhaseDelta(
      { phase: 1, mode: 'commit', base: 'HEAD', commit: fixture.candidateSha },
      fixture.runtime,
    ),
  ).rejects.toThrowError(/base and commit must be full lowercase 40-hex object IDs/);
});

it('rejects a zero-parent candidate in commit mode', async () => {
  const fixture = await makeRepository({
    manifest: ['A 100644 orphan.txt'],
    orphanCandidate: true,
  });
  await expect(
    verifyPhaseDelta(
      { phase: 1, mode: 'commit', base: fixture.baseSha, commit: fixture.candidateSha },
      fixture.runtime,
    ),
  ).rejects.toThrowError(/candidate must have exactly one parent, found 0/);
});

const HOSTILE_ADMIN_CASES = [
  {
    name: 'object alternates file',
    gitFiles: { 'objects/info/alternates': '/elsewhere/objects\n' },
    message: 'hostile repository admin state: object alternates',
  },
  {
    name: 'nonempty info/exclude',
    gitFiles: { 'info/exclude': 'secret.txt\n' },
    message: 'hostile repository admin state: info/exclude',
  },
  {
    name: 'nonempty info/attributes',
    gitFiles: { 'info/attributes': '* filter=evil\n' },
    message: 'hostile repository admin state: info/attributes',
  },
  {
    name: 'grafts file',
    gitFiles: { 'info/grafts': `${'0'.repeat(40)}\n` },
    message: 'hostile repository admin state: info/grafts',
  },
  {
    name: 'shallow marker',
    gitFiles: { shallow: `${'0'.repeat(40)}\n` },
    message: 'hostile repository admin state: shallow',
  },
] as const;

it.each(HOSTILE_ADMIN_CASES)('rejects a $name before any delta query', async (testCase) => {
  const fixture = await makeRepository({
    manifest: ['A 100644 added.txt'],
    worktree: { 'added.txt': 'new\n' },
    gitFiles: testCase.gitFiles,
  });
  await expect(
    verifyPhaseDelta({ phase: 1, mode: 'worktree' }, fixture.runtime),
  ).rejects.toThrowError(testCase.message);
});

it('rejects an active replace ref', async () => {
  const fixture = await makeRepository({
    manifest: ['A 100644 added.txt'],
    worktree: { 'added.txt': 'new\n' },
    replaceBase: true,
  });
  await expect(
    verifyPhaseDelta({ phase: 1, mode: 'worktree' }, fixture.runtime),
  ).rejects.toThrowError(/hostile repository admin state: replace ref/);
});

const HOSTILE_CONFIG_CASES = [
  {
    name: 'local filter',
    entry: ['filter.evil.clean', 'cat'] as const,
    message: 'hostile repository configuration: filter',
  },
  {
    name: 'config include',
    entry: ['include.path', '/tmp/evil'] as const,
    message: 'hostile repository configuration: include',
  },
] as const;

it.each(HOSTILE_CONFIG_CASES)('rejects a $name directive', async (testCase) => {
  const fixture = await makeRepository({
    manifest: ['A 100644 added.txt'],
    worktree: { 'added.txt': 'new\n' },
    localConfig: [testCase.entry],
  });
  await expect(
    verifyPhaseDelta({ phase: 1, mode: 'worktree' }, fixture.runtime),
  ).rejects.toThrowError(testCase.message);
});

it('rejects a manifest that is not valid UTF-8', async () => {
  const fixture = await makeRepository({
    manifestBytes: Uint8Array.from([0x41, 0x20, 0xff, 0xfe, 0x0a]),
  });
  await expect(
    verifyPhaseDelta({ phase: 1, mode: 'worktree' }, fixture.runtime),
  ).rejects.toThrowError(/manifest is not valid UTF-8/);
});

it('reports a rename as a delete plus an add', async () => {
  const fixture = await makeRepository({
    manifest: ['A 100644 new.txt', 'D - old.txt'],
    baseline: { 'old.txt': 'same\n' },
    worktree: { 'old.txt': null, 'new.txt': 'same\n' },
  });
  await expect(
    verifyPhaseDelta({ phase: 1, mode: 'worktree' }, fixture.runtime),
  ).resolves.toBeUndefined();
});

it('ignores inherited Git routing variables', async () => {
  const fixture = await makeRepository({
    manifest: ['A 100644 added.txt'],
    worktree: { 'added.txt': 'new\n' },
  });
  const saved = { ...process.env };
  process.env.GIT_DIR = join(fixture.root, 'nonexistent-git-dir');
  process.env.GIT_WORK_TREE = join(fixture.root, 'nonexistent-work-tree');
  process.env.GIT_INDEX_FILE = join(fixture.root, 'nonexistent-index');
  try {
    await expect(
      verifyPhaseDelta({ phase: 1, mode: 'worktree' }, fixture.runtime),
    ).resolves.toBeUndefined();
  } finally {
    process.env = saved;
  }
});
