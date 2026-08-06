import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { argv, cwd, exit, stderr } from 'node:process';
import { fileURLToPath } from 'node:url';

const LINE = /^(A|M) 100644 ([A-Za-z0-9._/-]+)$|^D - ([A-Za-z0-9._/-]+)$/u;
const OBJECT_ID = /^[0-9a-f]{40}$/u;
const MAX_OBJECT_BYTES = 16 * 1024 * 1024;

export function parseManifest(bytes) {
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('manifest is not valid UTF-8');
  }
  if (text.includes('\r')) throw new Error('manifest contains CR');
  const lines = text.endsWith('\n') ? text.slice(0, -1).split('\n') : text.split('\n');
  if (lines.length === 0 || lines.some((line) => line.length === 0)) {
    throw new Error('manifest contains a blank line');
  }
  const records = lines.map((line) => {
    const match = LINE.exec(line);
    if (!match) throw new Error(`invalid manifest record: ${line}`);
    const status = match[1] ?? 'D';
    const path = match[2] ?? match[3];
    const parts = path.split('/');
    if (parts.some((part) => part === '' || part === '.' || part === '..')) {
      throw new Error(`invalid manifest path: ${path}`);
    }
    return { status, mode: status === 'D' ? null : '100644', path };
  });
  for (let index = 1; index < records.length; index += 1) {
    if (
      Buffer.compare(Buffer.from(records[index - 1].path), Buffer.from(records[index].path)) >= 0
    ) {
      throw new Error('manifest paths are duplicate or unsorted');
    }
  }
  return records;
}

export function compareDelta(expected, actual) {
  const expectedByPath = new Map(expected.map((entry) => [entry.path, entry]));
  for (const entry of actual) {
    const contract = expectedByPath.get(entry.path);
    if (!contract) throw new Error(`unexpected path: ${entry.path}`);
    if (entry.status === 'D' && contract.status !== 'D') {
      throw new Error(`unexpected deletion: ${entry.path}`);
    }
    if (entry.status !== contract.status || entry.mode !== contract.mode) {
      throw new Error(`status or mode mismatch: ${entry.path}`);
    }
    expectedByPath.delete(entry.path);
  }
  if (expectedByPath.size > 0) {
    throw new Error(`missing path: ${[...expectedByPath.keys()].sort()[0]}`);
  }
}

const DELTA_LINE = /^([A-Z]) (100644|100755|120000|160000|-) ([A-Za-z0-9._/-]+)$/u;
const SUPPORTED_DELTA_STATUS = new Set(['A', 'M', 'D']);

export function parseDeltaRecords(lines) {
  return lines.map((line) => {
    const match = DELTA_LINE.exec(line);
    if (!match) throw new Error(`invalid delta record: ${line}`);
    const status = match[1];
    const mode = match[2];
    const path = match[3];
    if (!SUPPORTED_DELTA_STATUS.has(status)) {
      throw new Error(`unsupported delta status: ${status}`);
    }
    if (status === 'D' ? mode !== '-' : mode === '-') {
      throw new Error(`invalid delta record: ${line}`);
    }
    return { status, mode: status === 'D' ? null : mode, path };
  });
}

function assertSupportedStatus(status) {
  if (!SUPPORTED_DELTA_STATUS.has(status)) {
    throw new Error(`unsupported delta status: ${status}`);
  }
}

// ---------------------------------------------------------------------------
// Frozen Git provider
// ---------------------------------------------------------------------------

const GLOBAL_ARGS = Object.freeze([
  '--no-replace-objects',
  '--no-lazy-fetch',
  '--literal-pathspecs',
]);

function frozenConfigArgs(frozen) {
  return [
    '-c',
    `core.excludesFile=${frozen.excludes}`,
    '-c',
    `core.attributesFile=${frozen.attributes}`,
    '-c',
    'core.fsmonitor=false',
    '-c',
    'core.untrackedCache=false',
  ];
}

export function createFrozenConfigRoot() {
  const root = mkdtempSync(join(tmpdir(), 'evk-git-frozen-'));
  const frozen = {
    root,
    config: join(root, 'config'),
    excludes: join(root, 'excludes'),
    attributes: join(root, 'attributes'),
  };
  for (const file of [frozen.config, frozen.excludes, frozen.attributes]) {
    writeFileSync(file, '');
  }
  return frozen;
}

export function buildFrozenEnvironment(frozen) {
  // Built from an empty map: no inherited GIT_* routing, config, object, replace,
  // or alternate variables survive. Only the few host variables Git needs to start.
  const environment = {
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: frozen.config,
    GIT_ATTR_NOSYSTEM: '1',
    GIT_OPTIONAL_LOCKS: '0',
    GIT_NO_REPLACE_OBJECTS: '1',
    GIT_NO_LAZY_FETCH: '1',
    GIT_LITERAL_PATHSPECS: '1',
  };
  for (const name of ['PATH', 'SystemRoot', 'SYSTEMROOT', 'windir', 'TEMP', 'TMP']) {
    const value = process.env[name];
    if (value !== undefined) environment[name] = value;
  }
  return environment;
}

function runGit(context, args) {
  const full = [...GLOBAL_ARGS, ...frozenConfigArgs(context.frozen), ...args];
  const result = context.runtime.spawn(context.runtime.gitPath, full, {
    shell: false,
    cwd: context.runtime.repositoryRoot,
    env: context.environment,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`git query failed: ${args[0]}`);
  }
  if (result.stdout.byteLength > MAX_OBJECT_BYTES) {
    throw new Error(`git output exceeds the bounded read limit: ${args[0]}`);
  }
  return result.stdout;
}

function decode(bytes) {
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

// ---------------------------------------------------------------------------
// Hostile admin-state preflight
// ---------------------------------------------------------------------------

function adminStateError(label) {
  return new Error(`hostile repository admin state: ${label}`);
}

function assertAbsent(path, label) {
  if (existsSync(path)) throw adminStateError(label);
}

// `git init` seeds info/exclude with a comment header, so emptiness is the wrong
// test. What must be absent is any effective rule, and any symlink indirection.
function assertNoEffectiveRules(path, label) {
  if (!existsSync(path)) return;
  const stats = lstatSync(path);
  if (!stats.isFile()) throw adminStateError(label);
  if (stats.size > MAX_OBJECT_BYTES) throw adminStateError(label);
  const text = readFileSync(path, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed !== '' && !trimmed.startsWith('#')) throw adminStateError(label);
  }
}

function assertCleanAdminState(context) {
  const gitDir = decode(runGit(context, ['rev-parse', '--absolute-git-dir'])).trim();
  const commonRaw = decode(runGit(context, ['rev-parse', '--git-common-dir'])).trim();
  const commonDir = isAbsolute(commonRaw)
    ? commonRaw
    : join(context.runtime.repositoryRoot, commonRaw);

  for (const directory of new Set([gitDir, commonDir])) {
    assertAbsent(join(directory, 'objects', 'info', 'alternates'), 'object alternates');
    assertAbsent(join(directory, 'objects', 'info', 'http-alternates'), 'object alternates');
    assertAbsent(join(directory, 'info', 'grafts'), 'info/grafts');
    assertAbsent(join(directory, 'shallow'), 'shallow');
    assertNoEffectiveRules(join(directory, 'info', 'exclude'), 'info/exclude');
    assertNoEffectiveRules(join(directory, 'info', 'attributes'), 'info/attributes');
  }

  const replaceRefs = decode(
    runGit(context, ['for-each-ref', '--format=%(refname)', 'refs/replace']),
  ).trim();
  if (replaceRefs !== '') throw adminStateError('replace ref');

  const config = decode(runGit(context, ['config', '--list', '--local', '-z']));
  for (const entry of config.split('\0')) {
    if (entry === '') continue;
    const newline = entry.indexOf('\n');
    const key = (newline === -1 ? entry : entry.slice(0, newline)).toLowerCase();
    if (key.startsWith('filter.')) {
      throw new Error('hostile repository configuration: filter');
    }
    if (key.startsWith('include.') || key.startsWith('includeif.')) {
      throw new Error('hostile repository configuration: include');
    }
  }
}

// ---------------------------------------------------------------------------
// Mode sources
// ---------------------------------------------------------------------------

function classifyWorktreeCode(code) {
  if (code === '??') return { status: 'A', mode: '100644' };
  const index = code[0];
  const worktree = code[1];
  for (const flag of [index, worktree]) {
    if (flag === 'T' || flag === 'U' || flag === 'X' || flag === 'B') {
      assertSupportedStatus(flag);
    }
    if (flag === 'R' || flag === 'C') {
      assertSupportedStatus(flag);
    }
  }
  if (index === 'D' || worktree === 'D') return { status: 'D', mode: null };
  if (index === 'A') return { status: 'A', mode: '100644' };
  return { status: 'M', mode: '100644' };
}

export function parseWorktreeStatus(stdout) {
  const fields = decode(stdout).split('\0');
  const records = [];
  for (const field of fields) {
    if (field === '') continue;
    const code = field.slice(0, 2);
    const path = field.slice(3);
    records.push({ ...classifyWorktreeCode(code), path });
  }
  return records;
}

function collectWorktreeDelta(context) {
  const staged = runGit(context, ['diff', '--cached', '--name-only', '-z', '--no-renames']);
  if (staged.byteLength !== 0) {
    throw new Error('index is not empty');
  }
  const stdout = runGit(context, [
    'status',
    '--porcelain=v1',
    '-z',
    '--untracked-files=all',
    '--ignore-submodules=all',
  ]);
  return parseWorktreeStatus(stdout);
}

export function parseNameStatus(stdout) {
  const fields = decode(stdout)
    .split('\0')
    .filter((field) => field !== '');
  const records = [];
  for (let index = 0; index < fields.length; index += 2) {
    const status = fields[index][0];
    const path = fields[index + 1];
    if (path === undefined) throw new Error('malformed name-status output');
    assertSupportedStatus(status);
    records.push({ status, path });
  }
  return records;
}

function readIndexModes(context) {
  const stdout = runGit(context, ['ls-files', '--stage', '-z']);
  const modes = new Map();
  for (const entry of decode(stdout).split('\0')) {
    if (entry === '') continue;
    const tab = entry.indexOf('\t');
    if (tab === -1) throw new Error('malformed index entry');
    const meta = entry.slice(0, tab).split(' ');
    const stage = meta[2];
    if (stage !== '0') throw new Error('unsupported delta status: U');
    modes.set(entry.slice(tab + 1), meta[0]);
  }
  return modes;
}

function collectCachedDelta(context) {
  const stdout = runGit(context, [
    'diff',
    '--cached',
    '--name-status',
    '--no-renames',
    '-z',
    '--no-ext-diff',
    '--no-textconv',
  ]);
  const modes = readIndexModes(context);
  return parseNameStatus(stdout).map((record) => {
    if (record.status === 'D') return { status: 'D', mode: null, path: record.path };
    const mode = modes.get(record.path);
    if (mode === undefined) throw new Error(`missing index mode: ${record.path}`);
    if (mode !== '100644' && mode !== '100755') {
      throw new Error(`unsupported delta status: T`);
    }
    return { status: record.status, mode, path: record.path };
  });
}

// ---------------------------------------------------------------------------
// Commit mode
// ---------------------------------------------------------------------------

export function parseRawCommit(bytes) {
  const text = decode(bytes);
  const separator = text.indexOf('\n\n');
  const headerText = separator === -1 ? text : text.slice(0, separator);
  const headers = headerText.split('\n');
  let tree;
  const parents = [];
  for (const header of headers) {
    if (header.startsWith('tree ')) {
      if (tree !== undefined) throw new Error('malformed commit object: duplicate tree header');
      tree = header.slice(5);
      if (!OBJECT_ID.test(tree)) throw new Error('malformed commit object: invalid tree header');
      continue;
    }
    if (header.startsWith('parent ')) {
      const parent = header.slice(7);
      if (!OBJECT_ID.test(parent))
        throw new Error('malformed commit object: invalid parent header');
      if (parents.includes(parent))
        throw new Error('malformed commit object: duplicate parent header');
      parents.push(parent);
      continue;
    }
    if (
      header.startsWith('author ') ||
      header.startsWith('committer ') ||
      header.startsWith('gpgsig') ||
      header.startsWith('encoding ') ||
      header.startsWith('mergetag ') ||
      header.startsWith(' ')
    ) {
      continue;
    }
    if (header === '') continue;
    throw new Error('malformed commit object: unknown header');
  }
  if (tree === undefined) throw new Error('malformed commit object: missing tree header');
  return { tree, parents };
}

export function parseRawTreeDiff(stdout) {
  const text = decode(stdout);
  const fields = text.split('\0').filter((field) => field !== '');
  const records = [];
  for (let index = 0; index < fields.length; index += 2) {
    const meta = fields[index];
    const path = fields[index + 1];
    if (path === undefined) throw new Error('malformed raw diff output');
    if (!meta.startsWith(':')) throw new Error('malformed raw diff output');
    const parts = meta.slice(1).split(' ');
    const destinationMode = parts[1];
    const status = parts[4];
    assertSupportedStatus(status);
    if (status === 'D') {
      records.push({ status, mode: null, path });
      continue;
    }
    if (destinationMode !== '100644' && destinationMode !== '100755') {
      throw new Error(`unsupported delta status: T`);
    }
    records.push({ status, mode: destinationMode, path });
  }
  return records;
}

function readCommitObject(context, objectId) {
  return parseRawCommit(runGit(context, ['cat-file', 'commit', objectId]));
}

function assertCommitObjectIds(options) {
  const base = options.base;
  const commit = options.commit;
  if (
    typeof base !== 'string' ||
    typeof commit !== 'string' ||
    !OBJECT_ID.test(base) ||
    !OBJECT_ID.test(commit)
  ) {
    throw new Error('base and commit must be full lowercase 40-hex object IDs');
  }
}

function collectCommitDelta(context, options) {
  const base = options.base;
  const commit = options.commit;
  const candidate = readCommitObject(context, commit);
  if (candidate.parents.length !== 1) {
    throw new Error(`candidate must have exactly one parent, found ${candidate.parents.length}`);
  }
  if (candidate.parents[0] !== base) {
    throw new Error('candidate parent is not the approved base');
  }
  const approved = readCommitObject(context, base);
  const stdout = runGit(context, [
    'diff',
    '--raw',
    '-z',
    '--no-renames',
    '--no-ext-diff',
    '--no-textconv',
    approved.tree,
    candidate.tree,
  ]);
  return parseRawTreeDiff(stdout);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function manifestPathForPhase(phase) {
  return `docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-${phase}.txt`;
}

const MODE_SOURCES = {
  worktree: collectWorktreeDelta,
  cached: collectCachedDelta,
  commit: collectCommitDelta,
};

export async function verifyPhaseDelta(options, runtime) {
  const collect = MODE_SOURCES[options.mode];
  if (collect === undefined) throw new Error(`unsupported verifier mode: ${options.mode}`);
  if (options.mode === 'commit') {
    assertCommitObjectIds(options);
  } else if (options.base !== undefined || options.commit !== undefined) {
    throw new Error('base and commit are forbidden outside commit mode');
  }

  const frozen = createFrozenConfigRoot();
  try {
    const context = { runtime, frozen, environment: buildFrozenEnvironment(frozen) };
    assertCleanAdminState(context);
    const manifestSource = options.mode === 'commit' ? options.base : 'HEAD';
    const manifestBytes = runGit(context, [
      'show',
      `${manifestSource}:${manifestPathForPhase(options.phase)}`,
    ]);
    const expected = parseManifest(manifestBytes);
    const actual = collect(context, options);
    compareDelta(expected, actual);
  } finally {
    rmSync(frozen.root, { recursive: true, force: true, maxRetries: 5 });
  }
}

// ---------------------------------------------------------------------------
// Command line entry point (invoked by the §0.3 per-phase protocol)
// ---------------------------------------------------------------------------

export function createDefaultRuntime(repositoryRoot) {
  return {
    gitPath: 'git',
    repositoryRoot,
    spawn(file, args, options) {
      return spawnSync(file, [...args], {
        cwd: options.cwd,
        shell: options.shell,
        env: options.env,
        encoding: 'buffer',
        maxBuffer: MAX_OBJECT_BYTES,
      });
    },
  };
}

function nextArgument(args, index) {
  const value = args[index];
  if (value === undefined) throw new Error('missing argument value');
  return value;
}

export function parseCommandLine(args) {
  let phase;
  let mode;
  let base;
  let commit;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--phase') {
      const value = Number(nextArgument(args, ++index));
      if (!Number.isInteger(value) || value < 1 || value > 5) {
        throw new Error('--phase must be an integer 1 through 5');
      }
      phase = value;
      continue;
    }
    if (argument === '--worktree' || argument === '--cached') {
      if (mode !== undefined) throw new Error('exactly one verifier mode is allowed');
      mode = argument.slice(2);
      continue;
    }
    if (argument === '--base') {
      base = nextArgument(args, ++index);
      continue;
    }
    if (argument === '--commit') {
      commit = nextArgument(args, ++index);
      continue;
    }
    throw new Error(`unsupported argument: ${argument}`);
  }
  if (base !== undefined || commit !== undefined) {
    if (mode !== undefined) throw new Error('exactly one verifier mode is allowed');
    mode = 'commit';
  }
  if (phase === undefined) throw new Error('--phase is required');
  if (mode === undefined)
    throw new Error('one of --worktree, --cached, or --base/--commit is required');
  return mode === 'commit' ? { phase, mode, base, commit } : { phase, mode };
}

if (argv[1] !== undefined && fileURLToPath(import.meta.url) === argv[1]) {
  try {
    await verifyPhaseDelta(parseCommandLine(argv.slice(2)), createDefaultRuntime(cwd()));
  } catch (error) {
    stderr.write(`phase-delta verification failed: ${error.message}\n`);
    exit(1);
  }
}
