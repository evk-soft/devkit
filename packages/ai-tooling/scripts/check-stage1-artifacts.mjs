/**
 * Fail-closed artifact scanner for the Stage 1 phases.
 *
 * It streams every scanned file once, never buffering a whole body, and reports only a relative path
 * and a closed finding class. Matched bytes never reach the output, so a leaked credential or a
 * private marker is named by location and never echoed.
 *
 * The forgotten-stub sentinel is assembled from bytes at runtime and decoded with fatal UTF-8. Its
 * printable form appears nowhere in this file, in the JSON policy, or in any diagnostic, because the
 * scanner treats that literal as forbidden input in committed sources.
 */

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { argv, cwd, exit, hrtime, stderr, stdout } from 'node:process';

const LIMITS = Object.freeze({
  maxEntries: 100_000,
  maxTreeBytes: 16_777_216,
  maxBlobBytes: 16_777_216,
  maxAggregateBytes: 268_435_456,
  noProgressTimeoutMs: 30_000,
  wholeScanTimeoutMs: 300_000,
});

const OWNED_ROOTS = Object.freeze(['packages/ai-tooling', 'configs/ai']);
const SKIPPED_DIRECTORIES = new Set(['.git', 'node_modules', 'dist', 'coverage']);
const POLICY_RELATIVE_PATH = 'packages/ai-tooling/tests/fixtures/stage1-artifact-policy.json';

const FORGOTTEN_STUB_SENTINEL = Uint8Array.from([
  69, 86, 75, 95, 73, 78, 84, 69, 82, 78, 65, 76, 95, 78, 79, 84, 95, 73, 77, 80, 76, 69, 77, 69,
  78, 84, 69, 68,
]);

/** Streaming Knuth-Morris-Pratt matcher: finds a needle spanning arbitrary chunk boundaries. */
export class PrivateMarkerStream {
  #matched = 0;
  #failure;
  #needle;

  constructor(needle) {
    if (!(needle instanceof Uint8Array) || needle.byteLength === 0) {
      throw new TypeError('needle must be a non-empty Uint8Array');
    }
    this.#needle = needle.slice();
    this.#failure = new Uint32Array(needle.byteLength);
    for (let index = 1, prefix = 0; index < needle.byteLength; index += 1) {
      while (prefix > 0 && needle[index] !== needle[prefix]) prefix = this.#failure[prefix - 1];
      if (needle[index] === needle[prefix]) prefix += 1;
      this.#failure[index] = prefix;
    }
  }

  push(chunk) {
    for (const byte of chunk) {
      while (this.#matched > 0 && byte !== this.#needle[this.#matched]) {
        this.#matched = this.#failure[this.#matched - 1];
      }
      if (byte === this.#needle[this.#matched]) this.#matched += 1;
      if (this.#matched === this.#needle.byteLength) {
        this.#matched = this.#failure[this.#matched - 1];
        return true;
      }
    }
    return false;
  }
}

export function createStage1ArtifactPolicy(overrides = {}) {
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const builtinToken = decoder.decode(FORGOTTEN_STUB_SENTINEL);
  return Object.freeze({
    credentialPrefixes: Object.freeze([...(overrides.credentialPrefixes ?? [])]),
    forbiddenLiteralTokens: Object.freeze([
      builtinToken,
      ...(overrides.forbiddenLiteralTokens ?? []),
    ]),
    allowedExecutablePaths: Object.freeze([...(overrides.allowedExecutablePaths ?? [])]),
    requiredLicenseDigests: Object.freeze([...(overrides.requiredLicenseDigests ?? [])]),
  });
}

export function createArtifactScanBudget(now = () => hrtime.bigint()) {
  const started = now();
  let lastProgress = started;
  let treeBytes = 0;
  let aggregateBytes = 0;

  const elapsedMs = (from) => Number((now() - from) / 1_000_000n);

  return Object.freeze({
    claimTreeBytes(bytes) {
      treeBytes += bytes;
      if (treeBytes > LIMITS.maxTreeBytes) throw new Error('tree byte budget exceeded');
    },
    claimBlob(bytes) {
      if (bytes > LIMITS.maxBlobBytes) throw new Error('blob byte budget exceeded');
      aggregateBytes += bytes;
      if (aggregateBytes > LIMITS.maxAggregateBytes) {
        throw new Error('aggregate byte budget exceeded');
      }
    },
    progress(bytes) {
      aggregateBytes += bytes;
      if (aggregateBytes > LIMITS.maxAggregateBytes) {
        throw new Error('aggregate byte budget exceeded');
      }
      lastProgress = now();
    },
    assertLive() {
      if (elapsedMs(started) > LIMITS.wholeScanTimeoutMs) throw new Error('whole scan deadline');
      if (elapsedMs(lastProgress) > LIMITS.noProgressTimeoutMs) throw new Error('no progress');
    },
  });
}

export async function scanArtifactManifest(manifest, policy, budget) {
  if (manifest.length > LIMITS.maxEntries)
    throw new Error('manifest entry count exceeds the limit');
  const findings = [];
  const contentHash = createHash('sha256');

  for (const entry of manifest) {
    budget.assertLive();
    budget.claimBlob(entry.byteLength);

    const tokenMatchers = policy.forbiddenLiteralTokens.map(
      (token) => new PrivateMarkerStream(new TextEncoder().encode(token)),
    );
    // The policy document necessarily contains every credential prefix it declares, so scanning it
    // for those prefixes would always report itself. Its literal-token matching still applies.
    const credentialMatchers =
      entry.path === POLICY_RELATIVE_PATH
        ? []
        : policy.credentialPrefixes.map(
            (prefix) => new PrivateMarkerStream(new TextEncoder().encode(prefix)),
          );

    let markerFound = false;
    let credentialFound = false;
    let observed = 0;
    const entryHash = createHash('sha256');

    for await (const chunk of entry.chunks) {
      observed += chunk.byteLength;
      // Counting and hashing continue after a match so size and digest checks still fail closed.
      entryHash.update(chunk);
      budget.progress(chunk.byteLength);
      budget.assertLive();
      for (const matcher of tokenMatchers) {
        if (matcher.push(chunk)) markerFound = true;
      }
      for (const matcher of credentialMatchers) {
        if (matcher.push(chunk)) credentialFound = true;
      }
    }

    const digest = entryHash.digest('hex');
    contentHash.update(`${entry.path}\0${digest}\0`);

    if (markerFound) findings.push({ path: entry.path, findingClass: 'private-marker' });
    if (credentialFound) findings.push({ path: entry.path, findingClass: 'credential-pattern' });
    if (observed !== entry.byteLength) {
      findings.push({ path: entry.path, findingClass: 'schema-byte-mismatch' });
    }
    if (entry.expectedDigest !== null && entry.expectedDigest !== digest) {
      findings.push({ path: entry.path, findingClass: 'schema-byte-mismatch' });
    }
    if (entry.mode === '100755' && !policy.allowedExecutablePaths.includes(entry.path)) {
      findings.push({ path: entry.path, findingClass: 'unexpected-executable' });
    }
  }

  return { findings, contentDigest: contentHash.digest('hex') };
}

// ---------------------------------------------------------------------------
// Command line
// ---------------------------------------------------------------------------

function nextArgument(args, index) {
  const value = args[index];
  if (value === undefined) throw new Error('missing argument value');
  return value;
}

function parseCommandLine(args) {
  let phase;
  let mode;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--phase') {
      phase = Number(nextArgument(args, ++index));
      if (!Number.isInteger(phase) || phase < 1 || phase > 5) {
        throw new Error('--phase must be an integer 1 through 5');
      }
      continue;
    }
    if (argument === '--tree' || argument === '--cached') {
      if (mode !== undefined) throw new Error('exactly one scan mode is allowed');
      mode = argument.slice(2);
      continue;
    }
    throw new Error(`unsupported argument: ${argument}`);
  }
  if (phase === undefined) throw new Error('--phase is required');
  if (mode === undefined) throw new Error('one of --tree or --cached is required');
  return { phase, mode };
}

function readDeclaredPaths(root, phase) {
  const declared = new Set();
  for (let current = 1; current <= phase; current += 1) {
    const manifestPath = join(
      root,
      'docs',
      'superpowers',
      'plans',
      'manifests',
      `ai-tooling-stage-1-phase-${current}.txt`,
    );
    if (!existsSync(manifestPath)) continue;
    const text = new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(manifestPath));
    for (const line of text.split('\n')) {
      if (line === '') continue;
      const match = /^([AMD]) (?:100644|-) (.+)$/u.exec(line);
      if (match === null) throw new Error('manifest record is invalid');
      if (match[1] === 'D') declared.delete(match[2]);
      else declared.add(match[2]);
    }
  }
  return declared;
}

/**
 * Prefers Git's own view of what would be committed, so ignored build caches such as
 * `*.tsbuildinfo` are never scanned. Falls back to a filesystem walk when the tree is not a
 * repository, which is the case for the disposable scan fixtures.
 */
function collectOwnedFiles(root) {
  const tracked = collectOwnedFilesFromGit(root);
  if (tracked !== null) return tracked;
  const collected = [];
  const walk = (absolute) => {
    for (const child of readdirSync(absolute, { withFileTypes: true })) {
      if (SKIPPED_DIRECTORIES.has(child.name)) continue;
      const childPath = join(absolute, child.name);
      if (child.isDirectory()) {
        walk(childPath);
        continue;
      }
      if (!child.isFile()) continue;
      collected.push(relative(root, childPath).split(sep).join('/'));
    }
  };
  for (const owned of OWNED_ROOTS) {
    const absolute = join(root, owned);
    if (existsSync(absolute)) walk(absolute);
  }
  return collected.sort();
}

function collectOwnedFilesFromGit(root) {
  const result = spawnSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '-z', '--', ...OWNED_ROOTS],
    { cwd: root, shell: false, encoding: 'buffer', timeout: 30_000 },
  );
  if (result.error !== undefined || result.status !== 0) return null;
  return new TextDecoder('utf-8', { fatal: true })
    .decode(result.stdout)
    .split('\0')
    .filter((path) => path !== '')
    .sort();
}

async function* streamFile(absolute) {
  for await (const chunk of createReadStream(absolute)) {
    yield chunk;
  }
}

async function main() {
  const options = parseCommandLine(argv.slice(2));
  const root = resolve(cwd());

  const policyPath = join(root, POLICY_RELATIVE_PATH);
  if (!existsSync(policyPath)) throw new Error('artifact policy file is absent');
  const policySource = JSON.parse(
    new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(policyPath)),
  );
  const policy = createStage1ArtifactPolicy(policySource);

  const declared = readDeclaredPaths(root, options.phase);
  const present = collectOwnedFiles(root);
  const budget = createArtifactScanBudget();
  const findings = [];

  const scannable = [];
  for (const path of present) {
    if (!declared.has(path)) {
      findings.push({ path, findingClass: 'undeclared-entry' });
      continue;
    }
    const absolute = join(root, ...path.split('/'));
    const stats = statSync(absolute);
    budget.claimTreeBytes(Buffer.byteLength(path, 'utf8'));
    scannable.push({
      path,
      mode: '100644',
      byteLength: stats.size,
      chunks: streamFile(absolute),
      expectedDigest: null,
    });
  }

  const scanned = await scanArtifactManifest(scannable, policy, budget);
  findings.push(...scanned.findings);

  if (findings.length > 0) {
    for (const finding of findings.sort((left, right) => left.path.localeCompare(right.path))) {
      stderr.write(`${finding.path}:${finding.findingClass}\n`);
    }
    return 1;
  }
  stdout.write(`${scanned.contentDigest}\n`);
  return 0;
}

if (argv[1] !== undefined && import.meta.filename === argv[1]) {
  try {
    exit(await main());
  } catch (error) {
    stderr.write(`artifact scan failed: ${error.message}\n`);
    exit(1);
  }
}
