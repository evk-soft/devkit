import { spawnSync } from 'node:child_process';
import { lstatSync, rmSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, expect, it } from 'vitest';

import {
  buildFrozenEnvironment,
  compareDelta,
  createFrozenConfigRoot,
  parseDeltaRecords,
  parseManifest,
  parseRawCommit,
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
  /**
   * Run the verifier from a linked worktree instead of the main one. This is not an exotic
   * option: section 0.3 executes every phase in a linked worktree, so it is the configuration
   * the gate actually runs in.
   */
  readonly linkedWorktree?: boolean;
  /** Configuration written with `--worktree`, which lands in `.git/worktrees/<name>/config.worktree`. */
  readonly worktreeConfig?: readonly (readonly [string, string])[];
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

  const setupIn = (cwd: string, args: readonly string[]): string => {
    const result = spawnSync('git', args, { cwd, shell: false, encoding: 'buffer' });
    if (result.status !== 0) {
      throw new Error(
        `fixture git failed: ${args.join(' ')}\n${result.stderr?.toString('utf8') ?? ''}`,
      );
    }
    return result.stdout.toString('utf8').trim();
  };

  const setup = (args: readonly string[]): string => setupIn(root, args);

  const write = async (
    relativePath: string,
    contents: string | Uint8Array,
    base: string = root,
  ): Promise<void> => {
    const absolute = join(base, relativePath);
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, contents);
  };

  const apply = async (changes: FileChanges | undefined, base: string = root): Promise<void> => {
    for (const [relativePath, contents] of Object.entries(changes ?? {})) {
      if (contents === null) {
        await rm(join(base, relativePath), { force: true });
      } else {
        await write(relativePath, contents, base);
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

  // The linked worktree is created before any hostile marker is written, because `git worktree
  // add` would itself trip over a bogus `shallow` file or a checkout filter. `gitFiles` then
  // lands in the common directory, which is what the routing cases must reach from here.
  let workRoot = root;
  if (options.linkedWorktree === true) {
    const linkedParent = await mkdtemp(join(tmpdir(), 'evk-phase-delta-linked-'));
    roots.push(linkedParent);
    workRoot = join(linkedParent, 'worktree');
    setup(['worktree', 'add', workRoot, '-b', 'phase-worktree']);
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

  if ((options.worktreeConfig ?? []).length > 0) {
    setup(['config', 'extensions.worktreeConfig', 'true']);
    for (const [key, value] of options.worktreeConfig ?? []) {
      setupIn(workRoot, ['config', '--worktree', key, value]);
    }
  }

  await apply(options.worktree, workRoot);

  const spawns: SpawnRecord[] = [];
  const runtime = {
    gitPath: 'git',
    repositoryRoot: workRoot,
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

  return { root, workRoot, manifestPath, runtime, baseSha, candidateSha };
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
  // `candidate` is simply omitted. Passing it explicitly as `undefined` is a different thing under
  // `exactOptionalPropertyTypes`, and the fixture treats absence and explicit undefined alike.
  const fixture = await makeRepository({
    manifest: ['A 100644 side.txt'],
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

// ---------------------------------------------------------------------------
// Linked worktrees
//
// Section 0.3 executes every phase in a linked worktree, so that is the configuration the gate
// actually runs in. Worktree-scoped configuration lives in `.git/worktrees/<name>/config.worktree`,
// which `git config --list --local` cannot see; the preflight read `--local`, so a hostile filter
// or include placed there passed the gate. The positive case below is load-bearing: without it a
// rejection could come from the linked worktree breaking the fixture rather than from the guard.
// ---------------------------------------------------------------------------

it('verifies an exact delta when run from a linked worktree', async () => {
  const fixture = await makeRepository({
    manifest: ['A 100644 added.txt'],
    worktree: { 'added.txt': 'new\n' },
    linkedWorktree: true,
  });
  await expect(
    verifyPhaseDelta({ phase: 1, mode: 'worktree' }, fixture.runtime),
  ).resolves.toBeUndefined();
});

const WORKTREE_SCOPED_CONFIG_CASES = [
  {
    name: 'filter directive',
    entry: ['filter.evil.clean', 'cat'] as const,
    message: 'hostile repository configuration: filter',
  },
  {
    name: 'config include',
    entry: ['include.path', '/tmp/evil'] as const,
    message: 'hostile repository configuration: include',
  },
] as const;

it.each(WORKTREE_SCOPED_CONFIG_CASES)(
  'rejects a $name hidden in worktree-scoped configuration',
  async (testCase) => {
    const fixture = await makeRepository({
      manifest: ['A 100644 added.txt'],
      worktree: { 'added.txt': 'new\n' },
      linkedWorktree: true,
      worktreeConfig: [testCase.entry],
    });
    await expect(
      verifyPhaseDelta({ phase: 1, mode: 'worktree' }, fixture.runtime),
    ).rejects.toThrowError(testCase.message);
  },
);

const COMMON_DIRECTORY_CASES = [
  {
    name: 'object alternates file',
    gitFiles: { 'objects/info/alternates': '/elsewhere/objects\n' },
    message: 'hostile repository admin state: object alternates',
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
  {
    name: 'nonempty info/exclude',
    gitFiles: { 'info/exclude': 'secret.txt\n' },
    message: 'hostile repository admin state: info/exclude',
  },
] as const;

it.each(COMMON_DIRECTORY_CASES)(
  'reaches the common directory for a $name when run from a linked worktree',
  async (testCase) => {
    const fixture = await makeRepository({
      manifest: ['A 100644 added.txt'],
      worktree: { 'added.txt': 'new\n' },
      linkedWorktree: true,
      gitFiles: testCase.gitFiles,
    });
    await expect(
      verifyPhaseDelta({ phase: 1, mode: 'worktree' }, fixture.runtime),
    ).rejects.toThrowError(testCase.message);
  },
);

// ---------------------------------------------------------------------------
// Config includes and partial clones
// ---------------------------------------------------------------------------

// The rejection is by configuration key, never by path shape. These shapes exist so that a later
// refactor cannot quietly start parsing the path and admit one of them.
//
// The tilde case is the exception, and the reason is worth keeping. The frozen environment is built
// from an empty map and so carries no HOME. On Linux that leaves Git nothing to expand `~` into, and
// it fails while loading the configuration -- during the preflight's very first `rev-parse`, before
// the guard reads a single key. On Windows the same fixture reaches the guard and is rejected by
// key. Both outcomes are fail-closed, which is the property that actually matters, so this case
// asserts that verification never succeeds rather than asserting one platform's message.
const CONFIG_INCLUDE_SHAPES = [
  {
    name: 'absolute',
    entry: ['include.path', 'D:/evil/config'] as const,
    message: /hostile repository configuration: include/u,
  },
  {
    name: 'relative',
    entry: ['include.path', '../evil/config'] as const,
    message: /hostile repository configuration: include/u,
  },
  {
    name: 'tilde',
    entry: ['include.path', '~/evil/config'] as const,
    message: /hostile repository configuration: include|git query failed/u,
  },
  {
    name: 'UNC',
    entry: ['include.path', '//server/share/evil/config'] as const,
    message: /hostile repository configuration: include/u,
  },
  {
    name: 'conditional gitdir',
    entry: ['includeIf.gitdir:/.path', 'D:/evil/config'] as const,
    message: /hostile repository configuration: include/u,
  },
] as const;

it.each(CONFIG_INCLUDE_SHAPES)('rejects a $name config include', async (testCase) => {
  const fixture = await makeRepository({
    manifest: ['A 100644 added.txt'],
    worktree: { 'added.txt': 'new\n' },
    localConfig: [testCase.entry],
  });
  await expect(
    verifyPhaseDelta({ phase: 1, mode: 'worktree' }, fixture.runtime),
  ).rejects.toThrowError(testCase.message);
});

const PARTIAL_CLONE_CASES = [
  { name: 'partial clone extension', entry: ['extensions.partialClone', 'origin'] as const },
  { name: 'promisor remote', entry: ['remote.origin.promisor', 'true'] as const },
  {
    name: 'partial clone filter',
    entry: ['remote.origin.partialclonefilter', 'blob:none'] as const,
  },
] as const;

it.each(PARTIAL_CLONE_CASES)('rejects a $name marker', async (testCase) => {
  const fixture = await makeRepository({
    manifest: ['A 100644 added.txt'],
    worktree: { 'added.txt': 'new\n' },
    localConfig: [testCase.entry],
  });
  await expect(
    verifyPhaseDelta({ phase: 1, mode: 'worktree' }, fixture.runtime),
  ).rejects.toThrowError('hostile repository configuration: partial clone');
});

// ---------------------------------------------------------------------------
// Raw commit headers
//
// Commit mode reads the candidate object with `cat-file commit` and parses the raw bytes itself,
// so the parser is the only thing standing between a doctored header and a wrong parent decision.
// ---------------------------------------------------------------------------

const TREE_ID = 'a'.repeat(40);
const PARENT_ID = 'b'.repeat(40);
const OTHER_PARENT_ID = 'c'.repeat(40);
const IDENTITY = 'EVK Fixture <fixture@example.invalid> 1750000000 +0000';

function rawCommit(headers: readonly string[]): Uint8Array {
  return new TextEncoder().encode(`${headers.join('\n')}\n\nmessage\n`);
}

const RAW_COMMIT_REJECTIONS = [
  {
    name: 'a repeated parent header',
    headers: [`tree ${TREE_ID}`, `parent ${PARENT_ID}`, `parent ${PARENT_ID}`],
    message: 'malformed commit object: duplicate parent header',
  },
  {
    name: 'a parent that is not a 40-hex object ID',
    headers: [`tree ${TREE_ID}`, 'parent HEAD~1'],
    message: 'malformed commit object: invalid parent header',
  },
  {
    name: 'an uppercase parent object ID',
    headers: [`tree ${TREE_ID}`, `parent ${'B'.repeat(40)}`],
    message: 'malformed commit object: invalid parent header',
  },
  {
    name: 'a truncated parent object ID',
    headers: [`tree ${TREE_ID}`, `parent ${'b'.repeat(39)}`],
    message: 'malformed commit object: invalid parent header',
  },
  {
    name: 'a repeated tree header',
    headers: [`tree ${TREE_ID}`, `tree ${TREE_ID}`],
    message: 'malformed commit object: duplicate tree header',
  },
  {
    name: 'a missing tree header',
    headers: [`parent ${PARENT_ID}`, `author ${IDENTITY}`],
    message: 'malformed commit object: missing tree header',
  },
  {
    name: 'an unknown header',
    headers: [`tree ${TREE_ID}`, `parent ${PARENT_ID}`, 'evil something'],
    message: 'malformed commit object: unknown header',
  },
] as const;

it.each(RAW_COMMIT_REJECTIONS)('rejects $name in a raw commit object', (testCase) => {
  expect(() => parseRawCommit(rawCommit(testCase.headers))).toThrowError(testCase.message);
});

it('reads exactly the parents a raw commit object declares', () => {
  expect(
    parseRawCommit(rawCommit([`tree ${TREE_ID}`, `author ${IDENTITY}`])).parents,
  ).toStrictEqual([]);
  expect(
    parseRawCommit(rawCommit([`tree ${TREE_ID}`, `parent ${PARENT_ID}`, `committer ${IDENTITY}`]))
      .parents,
  ).toStrictEqual([PARENT_ID]);
  // Two distinct parents parse cleanly; rejecting a merge is the caller's rule, not the parser's.
  expect(
    parseRawCommit(
      rawCommit([`tree ${TREE_ID}`, `parent ${PARENT_ID}`, `parent ${OTHER_PARENT_ID}`]),
    ).parents,
  ).toStrictEqual([PARENT_ID, OTHER_PARENT_ID]);
});

// ---------------------------------------------------------------------------
// Frozen provider invariants
//
// These stand in for the executable-swap and config-root cleanup-race fixtures the master plan
// sketched. Both of those are races, and a racing test is a flaky test on two CI platforms. The
// properties asserted here are what those fixtures were meant to establish, and they hold
// deterministically: the binary is the one the caller injected, never a name re-resolved through
// PATH mid-run, and the config root is private, complete, and self-contained.
// ---------------------------------------------------------------------------

it('spawns only the injected Git path, without a shell, from the repository root', async () => {
  const fixture = await makeRepository({
    manifest: ['A 100644 added.txt'],
    worktree: { 'added.txt': 'new\n' },
    linkedWorktree: true,
  });
  await expect(
    verifyPhaseDelta({ phase: 1, mode: 'worktree' }, fixture.runtime),
  ).resolves.toBeUndefined();
  expect(fixture.runtime.spawns.length).toBeGreaterThan(0);
  expect(new Set(fixture.runtime.spawns.map((spawn) => spawn.file))).toStrictEqual(
    new Set([fixture.runtime.gitPath]),
  );
  expect(fixture.runtime.spawns.every((spawn) => spawn.shell === false)).toBe(true);
  expect(new Set(fixture.runtime.spawns.map((spawn) => spawn.cwd))).toStrictEqual(
    new Set([fixture.workRoot]),
  );
});

it('builds a private frozen config root of three zero-byte regular files', () => {
  const frozen = createFrozenConfigRoot();
  try {
    const files = [frozen.config, frozen.excludes, frozen.attributes];
    expect(new Set(files).size).toBe(3);
    for (const file of files) {
      const stats = lstatSync(file);
      expect(stats.isFile()).toBe(true);
      expect(stats.size).toBe(0);
      expect(file.startsWith(frozen.root)).toBe(true);
    }
  } finally {
    rmSync(frozen.root, { recursive: true, force: true });
  }
});

it('builds the frozen environment from an empty map, so no inherited Git variable survives', () => {
  const frozen = createFrozenConfigRoot();
  const saved = { ...process.env };
  process.env.GIT_DIR = '/inherited/git-dir';
  process.env.GIT_ALTERNATE_OBJECT_DIRECTORIES = '/inherited/objects';
  process.env.GIT_CONFIG_COUNT = '1';
  process.env.GIT_REPLACE_REF_BASE = 'refs/evil';
  try {
    const environment = buildFrozenEnvironment(frozen);
    expect(
      Object.keys(environment)
        .filter((name) => name.startsWith('GIT_'))
        .sort(),
    ).toStrictEqual([
      'GIT_ATTR_NOSYSTEM',
      'GIT_CONFIG_GLOBAL',
      'GIT_CONFIG_NOSYSTEM',
      'GIT_LITERAL_PATHSPECS',
      'GIT_NO_LAZY_FETCH',
      'GIT_NO_REPLACE_OBJECTS',
      'GIT_OPTIONAL_LOCKS',
    ]);
    expect(environment.GIT_CONFIG_GLOBAL).toBe(frozen.config);
    expect(environment.GIT_CONFIG_NOSYSTEM).toBe('1');
    expect(environment.GIT_NO_LAZY_FETCH).toBe('1');
  } finally {
    process.env = saved;
    rmSync(frozen.root, { recursive: true, force: true });
  }
});
