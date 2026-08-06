import { spawn } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface TempGitResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

export interface TempRepository {
  readonly root: string;
  git(...args: readonly string[]): Promise<TempGitResult>;
  dispose(): Promise<void>;
}

const HELPER_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = join(HELPER_DIRECTORY, '..', '..', '..', '..');

function runFrozenGit(
  cwd: string,
  environment: NodeJS.ProcessEnv,
  args: readonly string[],
): Promise<TempGitResult> {
  return new Promise((resolve, reject) => {
    const child = spawn('git', [...args], { cwd, env: environment, shell: false });
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
      resolve({ exitCode: code ?? 1, stdout, stderr });
    });
  });
}

async function detectSupportsNoLazyFetch(environment: NodeJS.ProcessEnv): Promise<boolean> {
  const result = await runFrozenGit(REPOSITORY_ROOT, environment, ['--version']);
  const match = /git version (\d+)\.(\d+)\.(\d+)/u.exec(result.stdout);
  if (match === null) return false;
  const major = Number(match[1]);
  const minor = Number(match[2]);
  return major > 2 || (major === 2 && minor >= 45);
}

/**
 * Creates a disposable Git repository seeded with an exact copy of the named repository files.
 *
 * Every Git invocation is frozen: the environment carries no inherited Git routing or configuration,
 * the global config and the excludes file both point at explicit zero-byte temporary files, and Git
 * is always called with an argv array and `shell: false`.
 */
export async function createTempRepository(fixture: {
  readonly copy: readonly string[];
}): Promise<TempRepository> {
  const root = await mkdtemp(join(tmpdir(), 'evk-temp-repository-'));
  const frozenRoot = await mkdtemp(join(tmpdir(), 'evk-temp-frozen-'));
  const globalConfig = join(frozenRoot, 'config');
  const excludesFile = join(frozenRoot, 'excludes');
  await writeFile(globalConfig, '');
  await writeFile(excludesFile, '');

  const environment: NodeJS.ProcessEnv = {
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: globalConfig,
    GIT_ATTR_NOSYSTEM: '1',
    GIT_OPTIONAL_LOCKS: '0',
    GIT_NO_REPLACE_OBJECTS: '1',
    GIT_NO_LAZY_FETCH: '1',
  };
  for (const name of ['PATH', 'SystemRoot', 'SYSTEMROOT', 'windir', 'TEMP', 'TMP']) {
    const value = process.env[name];
    if (value !== undefined) environment[name] = value;
  }

  const supportsNoLazyFetch = await detectSupportsNoLazyFetch(environment);
  // `--literal-pathspecs` and `GIT_LITERAL_PATHSPECS` are deliberately absent: `git check-ignore`
  // rejects them with "pathspec magic not supported by this command", and the probes this helper
  // serves are exactly check-ignore probes over fixed literal paths.
  const globalArgs = [
    '--no-replace-objects',
    ...(supportsNoLazyFetch ? ['--no-lazy-fetch'] : []),
    '-c',
    `core.excludesFile=${excludesFile}`,
    '-c',
    'core.fsmonitor=false',
    '-c',
    'core.untrackedCache=false',
  ];

  for (const relativePath of fixture.copy) {
    const destination = join(root, relativePath);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(join(REPOSITORY_ROOT, relativePath), destination);
  }

  const git = (...args: readonly string[]): Promise<TempGitResult> =>
    runFrozenGit(root, environment, [...globalArgs, ...args]);

  const initialized = await git('init', '--initial-branch=main');
  if (initialized.exitCode !== 0) {
    throw new Error(`temporary repository init failed: ${initialized.stderr}`);
  }

  return {
    root,
    git,
    async dispose(): Promise<void> {
      await rm(root, { recursive: true, force: true, maxRetries: 5 });
      await rm(frozenRoot, { recursive: true, force: true, maxRetries: 5 });
    },
  };
}
