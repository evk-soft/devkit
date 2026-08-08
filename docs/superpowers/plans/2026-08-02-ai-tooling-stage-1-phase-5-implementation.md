# AI Tooling Stage 1 Phase 5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Self-host the approved Stage 1 safe core in devkit, harden committed-artifact inspection,
prove the complete lifecycle, and finish durable user and security documentation.

**Architecture:** Phase 5 extends the Phase 4 read-only Git provider with closed commit/tree/blob
requests, scans bounded streamed artifact manifests, then exercises the already-delivered mutation
engine against a disposable self-host repository before touching devkit. Real devkit generation uses
only the reviewed tracked local pack and one reviewed override; generated leaves and the repository
lock are created by the workspace CLI and never hand-edited.

**Tech Stack:** Node.js 24+, TypeScript 7.0.2 ESM, pnpm 11.20.0, Vitest 4.1.10, Git 2.45.0+ for
artifact-object reads, JSON Schema draft 2020-12, Biome 2.5.7, and the Phase 4 journaled mutation
engine.

## Global Constraints

- **Status:** Awaiting owner approval. This file does not authorize implementation.
- Start only after the owner approves the exact Phase 4 commit and this phase plan.
- Implement only Stage 1; do not add remote acquisition, publication, plugins, hooks, preview,
  adoption, source-code intelligence, or umbrella Stages 2-5.
- Preserve the clean-room boundary: do not copy any byte from the private UNLICENSED prototype.
- Treat `configs/ai/**` as canonical EVK content and `ai/overrides/**` as the only user-editable
  customization tree.
- Do not hand-edit `AGENTS.md`, `CLAUDE.md`, `.agents/**`, `.claude/**`, or
  `ai-tooling.lock.json`; only accepted CLI plans may create or update them.
- The phase manifest is the exact write authority. It contains 29 unique raw-byte-sorted paths.
- `.gitignore`, `biome.json`, `configs/biome-config/**`, `.husky/**`, `.idea/**`, and
  `.ai-tooling/**` are outside the Phase 5 tracked delta.
- Use one implementation commit for the whole phase. Individual tasks end in reviewable green
  evidence, not commits.
- A failing Phase 4 behavior blocks Phase 5 and requires an owner-reviewed plan amendment; do not
  repair earlier behavior under a Phase 5 path.
- No push, pull request, package publication, tag, or later phase is authorized by this plan.

---

## Phase Entry Snapshot

**Entry gate:** Record the owner-approved Phase 4 base before any edit.

Run:

```powershell
$approvedBaseSha = (git rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0 -or $approvedBaseSha -cnotmatch '^[0-9a-f]{40}$') { throw 'approved base is not one full lowercase object ID' }
git branch --show-current
git rev-parse HEAD
git status --short --branch
git log --oneline main..HEAD
git diff --exit-code HEAD -- packages/ai-tooling/scripts/verify-phase-delta.mjs
pnpm install --frozen-lockfile --ignore-scripts
git status --short --branch
```

Expected: every command exits `0`; `$approvedBaseSha` is one full lowercase object ID; the
approved-base verifier is byte-clean; installation runs no lifecycle script, including Husky; and the
final status is identical to the initial status. `node_modules/` is not committed, so this install is
the master section 0.3 prerequisite for every later Phase 5 command. Retain `$approvedBaseSha`; the
Task 11 gate rebinds the same value from `HEAD` immediately before the sole Phase 5 commit.

## Master traceability

Task numbers in this packet are sequential and do not coincide with master section numbers. When
reconciling this packet with the master contract, use exactly this correspondence:

| Master section | Phase 5 task |
|---|---|
| 5.1 Make artifact scanning fail closed before real self-hosting | Task 1, Task 2, Task 3, Task 4 |
| 5.2 Prove the full lifecycle in a temporary self-host fixture | Task 5 |
| 5.3 Add the reviewed devkit source configuration and override | Task 6 |
| 5.4 Perform clean devkit initialization through the workspace CLI | Task 7 |
| 5.5 Exercise canonical edit → refresh-local → sync in devkit | Task 8 |
| 5.6 Run the exact formatter audit and finalize check-only native CI | Task 9 |
| 5.7 Complete all durable documentation | Task 10 |
| 5.8 Phase 5 gate and commit | Task 11 |

---

### Task 1: Reject the Phase 1 bootstrap body as a streamed artifact token

**Files:**

- Modify: `packages/ai-tooling/scripts/check-stage1-artifacts.mjs`
- Modify: `packages/ai-tooling/tests/security/artifact-scan.spec.ts`
- Modify: `packages/ai-tooling/tests/fixtures/artifact-scan/vectors.json`

**Interfaces:**

- Consumes: `ArtifactManifestEntry`, `ArtifactScanPolicy`, `ArtifactScanBudget`,
  `scanArtifactManifest(...)`, and `ArtifactFinding` from the Phase 1 scanner.
- Produces: cross-chunk `forbidden-literal` detection mapped to finding class `private-marker` and a
  Phase 5 policy that contains no contiguous copy of its own forbidden printable body.

- [ ] **Step 1: Add the failing cross-chunk security test**

Add this test exactly; the numeric bytes form the unique printable bootstrap message body without its
terminal LF, so this plan and the committed test never contain that body contiguously:

```ts
it('rejects the Phase 1 bootstrap body across stream chunks', async () => {
  const body = Uint8Array.from([
    65, 73, 32, 84, 111, 111, 108, 105, 110, 103, 32, 99, 111, 109, 109, 97, 110,
    100, 32, 100, 105, 115, 112, 97, 116, 99, 104, 32, 105, 115, 32, 117, 110, 97,
    118, 97, 105, 108, 97, 98, 108, 101, 32, 105, 110, 32, 116, 104, 101, 32, 80,
    104, 97, 115, 101, 32, 49, 32, 98, 111, 111, 116, 115, 116, 114, 97, 112, 46,
  ]);
  async function* chunks(): AsyncIterable<Uint8Array> {
    yield body.subarray(0, 17);
    yield body.subarray(17, 43);
    yield body.subarray(43);
  }
  const result = await scanArtifactManifest(
    [{
      path: portableRelativePath('packages/ai-tooling/src/cli.ts'),
      mode: '100644',
      byteLength: body.byteLength,
      chunks: chunks(),
      expectedDigest: null,
    }],
    createStage1ArtifactPolicy(),
    createArtifactScanBudget(() => 0n),
  );
  expect(result.findings).toStrictEqual([{
    path: 'packages/ai-tooling/src/cli.ts',
    findingClass: 'private-marker',
  }]);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/security/artifact-scan.spec.ts -t "rejects the Phase 1 bootstrap body across stream chunks" --passWithNoTests=false --reporter=verbose
```

Expected: exit `1`; the named test runs and the finding array is empty because the Phase 4 policy does
not recognize the printable body. A missing test, import error, or fixture-discovery failure is not an
accepted RED.

- [ ] **Step 3: Register the numeric policy bytes in the existing Phase 1 matcher**

Phase 1 already supplies the complete cross-chunk `PrivateMarkerStream`; do not add a second matcher
or change its state machine. Extend only `createStage1ArtifactPolicy()` by fatal-decoding this numeric
constant at runtime and appending the decoded value to its `forbiddenLiteralTokens`. Do not place the
complete printable token in source, tests, fixtures, plans, or durable docs.

```js
const PHASE_1_BOOTSTRAP_BODY = Uint8Array.from([
  65, 73, 32, 84, 111, 111, 108, 105, 110, 103, 32, 99, 111, 109, 109, 97, 110,
  100, 32, 100, 105, 115, 112, 97, 116, 99, 104, 32, 105, 115, 32, 117, 110, 97,
  118, 97, 105, 108, 97, 98, 108, 101, 32, 105, 110, 32, 116, 104, 101, 32, 80,
  104, 97, 115, 101, 32, 49, 32, 98, 111, 111, 116, 115, 116, 114, 97, 112, 46,
]);

const phase1BootstrapToken = new TextDecoder('utf-8', { fatal: true })
  .decode(PHASE_1_BOOTSTRAP_BODY);

function withPhase1BootstrapToken(base) {
  return Object.freeze({
    ...base,
    forbiddenLiteralTokens: Object.freeze([
      ...base.forbiddenLiteralTokens,
      phase1BootstrapToken,
    ]),
  });
}
```

Wrap the already strict-parsed result at the single existing return site of
`createStage1ArtifactPolicy()` with `withPhase1BootstrapToken(...)`; do not add a second policy loader
or change the JSON policy schema.

The existing scanner instantiates one matcher per token per manifest entry and calls `push` once for
every awaited chunk. A match adds one `private-marker` finding for that path; content bytes never enter
the diagnostic.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/security/artifact-scan.spec.ts -t "rejects the Phase 1 bootstrap body across stream chunks" --passWithNoTests=false --reporter=verbose
```

Expected: exit `0`; the named test reports one redacted `private-marker` finding.

- [ ] **Step 5: Add exact-at-boundary and no-self-match rows**

Add this local helper and table-driven test to the same test file:

```ts
async function scanBodyChunks(chunks: readonly Uint8Array[]): Promise<readonly ArtifactFinding[]> {
  const byteLength = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
  async function* source(): AsyncIterable<Uint8Array> {
    for (const chunk of chunks) yield chunk;
  }
  const result = await scanArtifactManifest(
    [{
      path: portableRelativePath('packages/ai-tooling/src/cli.ts'),
      mode: '100644',
      byteLength,
      chunks: source(),
      expectedDigest: null,
    }],
    createStage1ArtifactPolicy(),
    createArtifactScanBudget(() => 0n),
  );
  return result.findings;
}

it('matches the bootstrap body at every chunk boundary and not at prefixes', async () => {
  const body = Uint8Array.from([
    65, 73, 32, 84, 111, 111, 108, 105, 110, 103, 32, 99, 111, 109, 109, 97, 110,
    100, 32, 100, 105, 115, 112, 97, 116, 99, 104, 32, 105, 115, 32, 117, 110, 97,
    118, 97, 105, 108, 97, 98, 108, 101, 32, 105, 110, 32, 116, 104, 101, 32, 80,
    104, 97, 115, 101, 32, 49, 32, 98, 111, 111, 116, 115, 116, 114, 97, 112, 46,
  ]);
  for (let split = 1; split < body.byteLength; split += 1) {
    expect(await scanBodyChunks([body.subarray(0, split), body.subarray(split)]), `split ${split}`)
      .toHaveLength(1);
  }
  expect(await scanBodyChunks([body])).toHaveLength(1);
  expect(await scanBodyChunks([body.subarray(0, body.byteLength - 1)])).toStrictEqual([]);
  expect(await scanBodyChunks([Uint8Array.of(0), body.subarray(1)])).toStrictEqual([]);
  expect(await scanBodyChunks([body, body])).toHaveLength(1);
  expect(await scanBodyChunks([body, Uint8Array.of(0x5c, 0x6e)])).toHaveLength(1);
  expect(await scanBodyChunks([body, Uint8Array.of(0x0a)])).toHaveLength(1);
});
```

Also scan the policy, test, all six delivery plans and durable docs as clean manifest entries; none may
contain the contiguous printable body.

- [ ] **Step 6: Run the complete artifact security suite**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/security/artifact-scan.spec.ts --passWithNoTests=false --reporter=verbose
```

Expected: exit `0`; credentials, private markers, absolute user paths, undeclared entries,
unexpected executables, missing licenses, schema drift, unregistered generated outputs, and dependency
license conflicts all retain their existing findings.

### Task 2: Add closed Git commit, tree, and batch-object transports

**Files:**

- Modify: `packages/ai-tooling/src/git/provider.ts`
- Modify: `packages/ai-tooling/tests/unit/git-provider.spec.ts`
- Modify: `packages/ai-tooling/tests/fixtures/fake-git/provider.mjs`

**Interfaces:**

- Consumes: the frozen Phase 2 provider, `GitCommandResult`, `AsyncByteSink`, `GitCommitish`,
  `GitObjectId`, the IC-6 isolated environment, and one caller-supplied `ArtifactScanBudget`.
- Produces: `runArtifactReadOnly(request)` for `resolve-commit | list-tree` and
  `runObjectBatchReadOnly(request)` for `check | contents`; callers cannot supply argv or raw stdin.

- [ ] **Step 1: Add a failing closed-request transport test**

```ts
it('owns exact artifact argv and object input framing', async () => {
  const budget = createArtifactScanBudget(() => 0n);
  const sink = new CollectingAsyncByteSink();
  await provider.runArtifactReadOnly({
    mode: 'resolve-commit',
    commitish: gitCommitish('HEAD'),
    stdoutSink: sink,
    budget,
  });
  await provider.runObjectBatchReadOnly({
    mode: 'check',
    objectIds: asAsync(['0123456789abcdef0123456789abcdef01234567'].map(gitObjectId)),
    stdoutSink: sink,
    budget,
  });
  expect(fakeGit.requests).toStrictEqual([
    {
      argv: ['--no-replace-objects', '--no-lazy-fetch', '--literal-pathspecs',
        '-c', expect.stringMatching(/^core\.excludesFile=/u),
        '-c', expect.stringMatching(/^core\.attributesFile=/u),
        '-c', 'core.fsmonitor=false', '-c', 'core.untrackedCache=false',
        'rev-parse', '--verify', '--end-of-options', 'HEAD^{commit}'],
      stdinHex: '',
    },
    {
      argv: ['--no-replace-objects', '--no-lazy-fetch', '--literal-pathspecs',
        '-c', expect.stringMatching(/^core\.excludesFile=/u),
        '-c', expect.stringMatching(/^core\.attributesFile=/u),
        '-c', 'core.fsmonitor=false', '-c', 'core.untrackedCache=false',
        'cat-file', '--batch-check'],
      stdinHex: '303132333435363738396162636465663031323334353637383961626364656630313233343536370a',
    },
  ]);
});
```

- [ ] **Step 2: Run the provider test and verify RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/git-provider.spec.ts -t "owns exact artifact argv and object input framing" --passWithNoTests=false --reporter=verbose
```

Expected: exit `1` because `runArtifactReadOnly` is absent; the fake provider test itself is
discovered.

- [ ] **Step 3: Implement the closed request-to-transport mapping**

```ts
function artifactArgv(request: GitArtifactReadRequest): readonly string[] {
  if (request.mode === 'resolve-commit') {
    return ['rev-parse', '--verify', '--end-of-options', `${request.commitish}^{commit}`];
  }
  return ['ls-tree', '-rz', '--full-tree', '--end-of-options', request.commit];
}

function objectBatchArgv(request: GitObjectBatchRequest): readonly string[] {
  return request.mode === 'check' ? ['cat-file', '--batch-check'] : ['cat-file', '--batch'];
}

async function writeObjectIds(
  writable: AsyncByteSink,
  objectIds: AsyncIterable<GitObjectId>,
  budget: ArtifactScanBudget,
): Promise<void> {
  const encoder = new TextEncoder();
  for await (const objectId of objectIds) {
    budget.assertLive();
    await writable.write(encoder.encode(`${objectId}\n`));
  }
  await writable.end();
}
```

Route these arrays through the existing frozen provider process primitive. That primitive prepends the
three global flags and four closed `-c` pairs asserted above, uses `shell: false`, runs the complete
config/include/filter/info/alternate
preflight before every process, brackets identities, closes stdin, awaits each sink write, limits
stderr to 64 KiB, and terminates/reaps on deadline or protocol failure.

- [ ] **Step 4: Run the focused provider test and verify GREEN**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/git-provider.spec.ts -t "owns exact artifact argv and object input framing" --passWithNoTests=false --reporter=verbose
```

Expected: exit `0`; captured argv/stdin equals the literal expectation.

- [ ] **Step 5: Add the hostile transport matrix**

Add this explicit case table to the existing Phase 2 fake-provider harness:

```ts
const artifactProviderFailures = [
  ['option-looking-ref', { commitish: '--help' }, 'git-provider-invalid'],
  ['nul-ref', { commitishBytes: [0x48, 0x00] }, 'git-provider-invalid'],
  ['control-ref', { commitishBytes: [0x48, 0x0a] }, 'git-provider-invalid'],
  ['caller-format', { injectedFormat: '%(objectname)' }, 'protocol-invalid'],
  ['malformed-object-id', { objectIds: ['abc'] }, 'protocol-invalid'],
  ['provider-swap-before', { swapAt: 'before-spawn' }, 'provider-identity-changed'],
  ['provider-swap-during', { swapAt: 'during-spawn' }, 'provider-identity-changed'],
  ['provider-swap-after', { swapAt: 'after-spawn' }, 'provider-identity-changed'],
  ['config-drift', { mutateAdmin: 'config' }, 'repository-admin-state-changed'],
  ['worktree-config-drift', { mutateAdmin: 'config.worktree' }, 'repository-admin-state-changed'],
  ['filter-command', { localConfig: ['filter.bad.clean=marker'] }, 'repository-filter-unsafe'],
  ['attributes-drift', { mutateAdmin: '.gitattributes' }, 'repository-filter-unsafe'],
  ['external-include', { localConfig: ['include.path=../outside'] }, 'repository-config-include'],
  ['alternates', { adminFile: 'objects/info/alternates' }, 'repository-alternates-unsupported'],
  ['http-alternates', { adminFile: 'objects/info/http-alternates' }, 'repository-alternates-unsupported'],
  ['info-exclude-drift', { mutateAdmin: 'info/exclude' }, 'repository-admin-state-changed'],
  ['info-attributes-drift', { mutateAdmin: 'info/attributes' }, 'repository-admin-state-changed'],
  ['promisor-missing', { missingPromisorObject: true }, 'object-unavailable'],
  ['truncated-batch', { batchProtocol: 'truncated' }, 'protocol-error'],
  ['extra-batch', { batchProtocol: 'extra' }, 'protocol-error'],
  ['nonzero', { childExitCode: 2 }, 'exited'],
  ['signal', { childSignal: 'SIGTERM' }, 'signaled'],
  ['timeout', { advanceMs: 300001 }, 'timeout'],
  ['termination-unverified', { treeQuiescence: false }, 'termination-unverified'],
] as const;

it.each(artifactProviderFailures)('%s fails closed', async (_name, setup, expected) => {
  const result = await runArtifactProviderCase(setup);
  expect(result.reason ?? result.kind).toBe(expected);
  expect(result.helperStarts).toBe(0);
  expect(result.networkStarts).toBe(0);
  expect(result.repositoryWrites).toStrictEqual([]);
});
```

Add a separate slow-sink row that releases each awaited write explicitly and asserts the fake provider
never has more than one fixed-size stdout chunk queued.

- [ ] **Step 6: Run the complete provider suite**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/git-provider.spec.ts --passWithNoTests=false --reporter=verbose
```

Expected: exit `0`; both batch sessions share one opaque budget and one 300-second monotonic deadline.

### Task 3: Scan an exact committed tree without worktree reads

**Files:**

- Modify: `packages/ai-tooling/scripts/check-stage1-artifacts.mjs`
- Modify: `packages/ai-tooling/tests/security/artifact-scan.spec.ts`
- Modify: `packages/ai-tooling/tests/fixtures/artifact-scan/vectors.json`

**Interfaces:**

- Consumes: Task 2 provider methods, `validatePortableRelativePath`, portable-key uniqueness,
  `ArtifactScanBudgetFactory`, `scanArtifactManifest`, and fixed limits 100,000 entries, 16 MiB tree,
  16 MiB/blob, 256 MiB aggregate, 30-second no-progress, and 300-second whole scan.
- Produces: resolution of the validated `GitCommitish` argument supplied to `--repository` into one immutable full commit ID, one NUL tree
  listing, one batch-check session, one batch-content session, and one ordered content digest.

- [ ] **Step 1: Add the failing replacement-object isolation test**

```ts
it('scans the resolved exact commit without replacement objects or worktree reads', async () => {
  const fixture = await createArtifactRepositoryFixture({ replaceHead: true, dirtyWorktree: true });
  const clean = await runArtifactCli(['--repository', fixture.head]);
  const poisoned = await runArtifactCli(['--repository', 'HEAD'], {
    cwd: fixture.root,
    env: { GIT_REPLACE_REF_BASE: 'refs/replace/' },
  });
  expect(clean.exitCode).toBe(0);
  expect(poisoned.exitCode).toBe(0);
  expect(JSON.parse(poisoned.stdout).contentDigest).toBe(JSON.parse(clean.stdout).contentDigest);
  expect(fixture.worktreeReadCount).toBe(0);
  expect(fixture.remoteHelperStarts).toBe(0);
});
```

- [ ] **Step 2: Run the repository-mode test and verify RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/security/artifact-scan.spec.ts -t "scans the resolved exact commit without replacement objects or worktree reads" --passWithNoTests=false --reporter=verbose
```

Expected: exit `1` because repository mode is absent; the test is discovered and its fixture builds.

- [ ] **Step 3: Implement strict ref, tree, and batch parsing**

```js
export function parseResolvedCommit(bytes) {
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  if (!/^[0-9a-f]{40}\n$/.test(text)) throw new Error('artifact-commit-invalid');
  return text.slice(0, 40);
}

export function parseTreeRecord(record) {
  const separator = record.indexOf(0x09);
  if (separator < 0) throw new Error('artifact-tree-record-invalid');
  const header = new TextDecoder('ascii', { fatal: true }).decode(record.subarray(0, separator));
  const match = /^(100644|100755|120000|160000) (blob|commit) ([0-9a-f]{40})$/.exec(header);
  if (match === null) throw new Error('artifact-tree-record-invalid');
  const path = new TextDecoder('utf-8', { fatal: true }).decode(record.subarray(separator + 1));
  return { mode: match[1], type: match[2], objectId: match[3], path };
}
```

Resolve once with the exact `artifactArgv` request mapping from Task 2, require the returned full ID,
then list with the same provider using that bound ID. Validate every path and the complete
portable-key set before starting contents, then validate type/size in one batch-check session and
stream all accepted blobs in one contents session. Hash each blob during that only content pass and
hash the ordered path/mode/length/blob-digest projection for `contentDigest`.

- [ ] **Step 4: Run the repository-mode test and verify GREEN**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/security/artifact-scan.spec.ts -t "scans the resolved exact commit without replacement objects or worktree reads" --passWithNoTests=false --reporter=verbose
```

Expected: exit `0`; ambient replacement refs and dirty worktree bytes do not affect the digest.

- [ ] **Step 5: Add exact bounded and malformed protocol rows**

Add this explicit repository-scan case table to the same security test file:

```ts
const repositoryScanFailures = [
  ['empty-ref', { refBytes: 0 }, 'commitish-invalid'],
  ['ref-over-limit', { refBytes: 4097 }, 'commitish-invalid'],
  ['merge', { objectKind: 'merge' }, 'commit-shape-invalid'],
  ['non-commit', { objectKind: 'tree' }, 'commit-invalid'],
  ['link', { treeMode: '120000' }, 'unexpected-executable'],
  ['submodule', { treeMode: '160000' }, 'undeclared-entry'],
  ['executable', { treeMode: '100755' }, 'unexpected-executable'],
  ['duplicate-tree-entry', { treeProtocol: 'duplicate' }, 'tree-invalid'],
  ['missing-nul', { treeProtocol: 'missing-nul' }, 'tree-invalid'],
  ['invalid-utf8', { pathBytes: [0xff] }, 'path-invalid'],
  ['absolute-path', { path: '/tmp/x' }, 'absolute-path'],
  ['dot-path', { path: 'a/./b' }, 'path-invalid'],
  ['parent-path', { path: 'a/../b' }, 'path-invalid'],
  ['win32-path', { path: 'CON' }, 'path-invalid'],
  ['case-collision', { paths: ['A.md', 'a.md'] }, 'path-collision'],
  ['nfc-collision', { paths: ['é.md', 'é.md'] }, 'path-collision'],
  ['missing-blob', { missingBlob: true }, 'object-unavailable'],
  ['entries-over', { entries: 100001 }, 'resource-limit'],
  ['tree-bytes-over', { treeBytes: 16777217 }, 'resource-limit'],
  ['blob-over', { blobBytes: 16777217 }, 'resource-limit'],
  ['aggregate-over', { aggregateBytes: 268435457 }, 'resource-limit'],
  ['stalled-output', { noProgressMs: 30001 }, 'timeout'],
  ['truncated-batch', { batchProtocol: 'truncated' }, 'protocol-error'],
  ['extra-batch', { batchProtocol: 'extra' }, 'protocol-error'],
  ['whole-deadline', { perCallMs: [70000, 70000, 70000, 90001] }, 'timeout'],
] as const;

it.each(repositoryScanFailures)('%s rejects before an unsafe content read', async (_name, setup, expected) => {
  const result = await runRepositoryScanCase(setup);
  expect(result.findingClass ?? result.reason).toBe(expected);
  if (expected === 'path-invalid' || expected === 'path-collision' || expected === 'tree-invalid') {
    expect(result.contentsBatchStarts).toBe(0);
  }
});
```

Add exact-limit green companions for 100,000 entries, 16,777,216 tree/blob bytes, and 268,435,456
aggregate bytes using sparse streamed fixtures that never allocate the declared total.

- [ ] **Step 6: Run the full scanner suite**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/security/artifact-scan.spec.ts --passWithNoTests=false --reporter=verbose
```

Expected: exit `0`; findings expose only artifact-relative paths and finding classes.

### Task 4: Prove publishable package contents and coverage ownership

**Files:**

- Modify: `packages/ai-tooling/scripts/check-package-contents.mjs`
- Modify: `packages/ai-tooling/package.json`
- Create: `packages/ai-tooling/tests/fixtures/stage1-coverage.json`
- Modify: `packages/ai-tooling/tests/security/artifact-scan.spec.ts`

**Interfaces:**

- Consumes: the Phase 1 bounded gzip/ustar/PAX reader and Task 3 artifact manifest scanner.
- Produces: `check-package-contents.mjs --publishable --json` and a strict coverage manifest whose
  records bind one capability to production code, focused/native evidence, and a durable heading.

- [ ] **Step 1: Add the failing publishable-package test**

```ts
it('accepts only the complete publishable Windows package shape', async () => {
  const result = await runPackageContentsCheck(['--publishable', '--json'], {
    platform: 'win32',
    arch: 'x64',
  });
  expect(result.exitCode).toBe(0);
  expect(JSON.parse(result.stdout)).toStrictEqual({
    schemaVersion: 1,
    packageName: '@evk-soft/ai-tooling',
    nativeTarget: 'win32-x64',
    publishable: true,
    archive: expect.objectContaining({
      filename: expect.stringMatching(/^evk-soft-ai-tooling-0\.1\.0\.tgz$/),
      byteLength: expect.any(Number),
      sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
    }),
  });
  expect(result.stderr).toBe('');
});
```

- [ ] **Step 2: Run the package test and verify RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/security/artifact-scan.spec.ts -t "accepts only the complete publishable Windows package shape" --passWithNoTests=false --reporter=verbose
```

Expected: exit `1`; the Phase 4 checker rejects or does not recognize `--publishable`.

- [ ] **Step 3: Implement the closed publishable result and coverage schema**

Use this exact coverage-file record shape; fill the array with one record for each shipped capability
listed after the code block.

```json
{
  "schemaVersion": 1,
  "capabilities": [
    {
      "id": "strict-json",
      "production": "packages/ai-tooling/src/json/strict-json.ts",
      "test": "packages/ai-tooling/tests/unit/strict-json.spec.ts",
      "document": "docs/ai-tooling/SECURITY.md#strict-json-and-schema-validation"
    }
  ]
}
```

Required IDs are exactly: `strict-json`, `local-pack`, `overrides`, `codex-project`,
`claude-code-project`, `ownership`, `check`, `diff`, `doctor`, `formatter-check`, `init`, `sync`,
`refresh-local`, `restore-generated`, `repair`, `artifact-scan`, `package-scan`, and `docs-links`.
Reject unknown/missing/duplicate keys or IDs, absent production/test/document targets, temporary plan/
spec paths, and non-durable anchors.

For `--publishable`, require the already-built Windows helper plus hash manifest under the isolated
staging dist, exact tar entries/exports/schema bytes/licenses/native metadata, and the task scanner's
clean result. Output only the fixed JSON object; never expose a publish command.

- [ ] **Step 4: Run the package test and verify GREEN**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/security/artifact-scan.spec.ts -t "accepts only the complete publishable Windows package shape" --passWithNoTests=false --reporter=verbose
```

Expected: exit `0` on `win32-x64`; non-Windows targets return the exact stable not-applicable result
without pretending that a publishable archive was checked.

- [ ] **Step 5: Run native build and the real publishable check on Windows**

Run:

```text
pnpm --filter @evk-soft/ai-tooling run build:native
node packages/ai-tooling/scripts/check-package-contents.mjs --publishable --json
```

Expected: both exit `0`; stdout contains only filename, byte length, SHA-256, target, and fixed schema
fields. No archive is uploaded or published.

### Task 5: Validate the complete lifecycle in a disposable self-host repository

**Files:**

- Create: `packages/ai-tooling/tests/integration/self-hosting.spec.ts`
- Create: `packages/ai-tooling/tests/fixtures/self-host/expected-manifest.json`

**Interfaces:**

- Consumes: the complete Phase 4 CLI, `createTempRepository`, the tracked local pack, Codex/Claude
  adapters, transaction/recovery services, and formatter audit.
- Produces: one cross-feature fixture that must be immediately green; it does not authorize a Phase 5
  behavior fix.

- [ ] **Step 1: Write the exact expected manifest fixture**

```json
{
  "schemaVersion": 1,
  "directories": [
    ".agents",
    ".agents/skills",
    ".agents/skills/evk-plan",
    ".claude",
    ".claude/rules",
    ".claude/skills",
    ".claude/skills/evk-plan"
  ],
  "files": [
    ".agents/skills/evk-plan/SKILL.md",
    ".claude/rules/evk-grounding.md",
    ".claude/skills/evk-plan/SKILL.md",
    "AGENTS.md",
    "CLAUDE.md",
    "ai-tooling.lock.json"
  ]
}
```

- [ ] **Step 2: Write the lifecycle integration test**

```ts
it('self-hosts the safe core without global or unregistered writes', async () => {
  const fixture = await createSelfHostFixture({
    canonicalPack: 'configs/ai',
    platforms: ['codex', 'claude-code'],
    overrideMode: 'extend',
  });
  const dryRun = await fixture.cli(['init', '--config', 'ai-tooling.config.json', '--dry-run', '--json']);
  const plan = parseMutationPlan(dryRun.stdout);
  expect(plan.operation).toBe('init');
  expect(plan.operationId).toBeNull();
  expect(plan.summary).toStrictEqual({ creates: 6, replaces: 0, deletes: 0, directoryCreates: 7 });
  expect(await fixture.changedPaths()).toStrictEqual([]);
  expect((await fixture.cli([
    'init', '--config', 'ai-tooling.config.json', '--accept-plan', plan.planDigest,
  ])).exitCode).toBe(0);
  expect(await fixture.generatedManifest()).toStrictEqual(await fixture.expectedManifest());
  expect((await fixture.cli(['sync', '--config', 'ai-tooling.config.json', '--dry-run', '--json'])).stdout)
    .toMatch(/"entries":\[\]/);
  expect(await fixture.globalAccesses()).toStrictEqual([]);
  expect(await fixture.unregisteredWrites()).toStrictEqual([]);
});
```

`createSelfHostFixture` is defined in this test file. It creates one private temp root/home, initializes
Git with isolated zero-byte config/excludes/attributes files, copies the real Phase 1 ignore rule,
Phase 3 Biome exclusions and tracked pack, writes the reviewed config/override bytes, records every
filesystem/provider access, and removes the root only after handle quiescence and identity verification.

- [ ] **Step 3: Run the focused integration test**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/self-hosting.spec.ts --passWithNoTests=false --reporter=verbose
```

Expected: immediate exit `0` on the Phase 4 implementation. Any behavioral failure stops Phase 5;
record the failing assertion and obtain an owner-reviewed plan/manifest amendment before editing
production code.

- [ ] **Step 4: Add the complete green-only lifecycle matrix**

Add this table in the integration test:

```ts
const lifecycleScenarios = [
  ['unchanged-sync-twice', 'clean'],
  ['check-ci', 'clean'],
  ['diff', 'clean'],
  ['doctor', 'clean'],
  ['docs-links', 'clean'],
  ['pack-validate', 'clean'],
  ['biome-node-entry', 'clean'],
  ['canonical-skill-refresh-sync', 'committed'],
  ['handled-rollback', 'rolled-back'],
  ['interrupted-completion', 'recoverable-complete'],
  ['interrupted-rollback', 'recoverable-rollback'],
  ['modified-output', 'blocked-output-modified'],
  ['compare-and-swap-restore', 'committed'],
  ['evidence-missing', 'blocked-evidence-missing'],
] as const;

it.each(lifecycleScenarios)('%s preserves the self-host boundary', async (scenario, expected) => {
  const fixture = await createSelfHostFixture({ canonicalPack: 'configs/ai', platforms: ['codex', 'claude-code'], overrideMode: 'extend' });
  const before = await fixture.snapshotBoundary();
  const result = await fixture.runScenario(scenario);
  expect(result.outcome).toBe(expected);
  expect(await fixture.globalAccesses()).toStrictEqual([]);
  expect(await fixture.unregisteredWrites()).toStrictEqual([]);
  expect(await fixture.assertBoundaryPreserved(before, scenario)).toBe(true);
});
```

`runScenario` is a closed switch in the local test helper with one literal CLI argv sequence per
union member; its default branch is `assertNever(scenario)` and cannot execute arbitrary commands.

- [ ] **Step 5: Run the complete lifecycle fixture on the current OS**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/self-hosting.spec.ts --passWithNoTests=false --reporter=verbose
```

Expected: exit `0`; native workflow later repeats it on Windows, Linux, and macOS.

### Task 6: Add the reviewed devkit configuration and grounding override

**Files:**

- Create: `ai-tooling.config.json`
- Create: `ai/overrides/rules/evk-grounding/override.json`
- Create: `ai/overrides/rules/evk-grounding/instructions.md`

**Interfaces:**

- Consumes: config/override schemas, `pack validate --json`, and the current validated digest of
  resource ID `evk-soft/rules/grounding`.
- Produces: the exact tracked local Stage 1 config and one `extend` override.

- [ ] **Step 1: Verify the canonical README is already final**

Run:

```text
pnpm --filter @evk-soft/ai-tooling run build
node packages/ai-tooling/dist/cli.js pack validate --json
```

`dist/` is a build output and is never committed, so this first Phase 5 use of the CLI must build it;
the earlier `build:native` step produces only the Win32 helper.

Then inspect `configs/ai/README.md` for publisher purpose, canonical edit rules, and the generated-file
warning. Expected: all three are already present from Phase 1. If any is missing, stop and request an
owner amendment that adds `configs/ai/README.md` to the Phase 5 Files list and manifest; do not edit it
under the current authority.

- [ ] **Step 2: Write the exact configuration JSON**

```json
{
  "$schema": "https://raw.githubusercontent.com/evk-soft/devkit/v0.1.0/packages/ai-tooling/schemas/config.schema.json",
  "schemaVersion": 1,
  "sources": [
    {
      "kind": "local",
      "package": "@evk-soft/ai-pack-core",
      "path": "configs/ai",
      "integrity": "required"
    }
  ],
  "outputMode": "managed",
  "platforms": ["codex", "claude-code"],
  "overrides": ["ai/overrides/rules/evk-grounding"],
  "hooks": { "enabled": false },
  "plugins": { "profile": "default", "recommendations": [] }
}
```

- [ ] **Step 3: Capture and validate the current grounding digest**

Run in PowerShell:

```powershell
$packOutput = (& node packages/ai-tooling/dist/cli.js pack validate --json) -join "`n"
if ($LASTEXITCODE -ne 0) { throw 'pack validation failed' }
$pack = $packOutput | ConvertFrom-Json -Depth 128
$grounding = @($pack.resources | Where-Object { $_.id -eq 'evk-soft/rules/grounding' })
if ($grounding.Count -ne 1 -or $grounding[0].digest -notmatch '^[0-9a-f]{64}$') {
  throw 'grounding digest missing or noncanonical'
}
$groundingDigest = [string]$grounding[0].digest
$groundingDigest
```

Expected: one lowercase 64-hex line. Keep it in the current PowerShell session.

- [ ] **Step 4: Write and strict-validate the override JSON with the captured digest**

Use `apply_patch` to write this exact JSON shape, substituting the already printed value of
`$groundingDigest` as the `baseDigest` string. Then validate equality with the still-bound variable;
there is no unbound placeholder in the written file.

```powershell
$override = Get-Content -LiteralPath 'ai/overrides/rules/evk-grounding/override.json' -Raw |
  ConvertFrom-Json -Depth 128
if ($override.schemaVersion -ne 1 -or $override.mode -ne 'extend' -or
    $override.target -ne 'evk-soft/rules/grounding' -or
    $override.baseDigest -cne $groundingDigest -or
    $override.instructions -ne 'instructions.md') {
  throw 'override bytes do not bind the captured grounding digest'
}
```

The JSON object keys and values other than the captured digest are exactly:
`schemaVersion: 1`, `mode: "extend"`, `target: "evk-soft/rules/grounding"`, and
`instructions: "instructions.md"`.

- [ ] **Step 5: Write the exact override instruction**

```markdown
Keep repository documentation, code, generated artifacts, and commit messages in English.
```

- [ ] **Step 6: Validate config, override, and effective content**

Run:

```text
node packages/ai-tooling/dist/cli.js pack validate
node packages/ai-tooling/dist/cli.js check --config ai-tooling.config.json --dry-run --json
node packages/ai-tooling/scripts/check-stage1-artifacts.mjs --phase 5 --tree
```

Expected: all exit `0`; output names only local `configs/ai`, platforms in Codex-then-Claude order,
one override, disabled hooks, default plugin profile, and no recommendation or unavailable capability.

### Task 7: Initialize devkit only through an accepted CLI plan

**Files:**

- Create by command: `ai-tooling.lock.json`
- Create by command: `AGENTS.md`
- Create by command: `CLAUDE.md`
- Create by command: `.agents/skills/evk-plan/SKILL.md`
- Create by command: `.claude/rules/evk-grounding.md`
- Create by command: `.claude/skills/evk-plan/SKILL.md`

**Interfaces:**

- Consumes: accepted `init` mutation plan and the Phase 4 transaction engine.
- Produces: repository lock plus five registered leaves and seven structural directories; local
  transaction infrastructure is ignored and empty after success.

- [ ] **Step 1: Freeze the pre-init status, census, and protected hashes**

Run in PowerShell and keep the values in the same session:

```powershell
$preStatus = [Convert]::ToHexString([Text.Encoding]::UTF8.GetBytes((git status --porcelain=v2 -z --ignore-submodules=all) -join "`0"))
$canonicalFiles = @(git ls-files -- configs/ai)
$biomePresetFiles = @(git ls-files -- configs/biome-config)
if ($LASTEXITCODE -ne 0 -or $canonicalFiles.Count -eq 0 -or $biomePresetFiles.Count -eq 0) {
  throw 'protected tracked-file census failed'
}
$protected = @('.gitignore', 'biome.json', '.husky/pre-commit', 'ai-tooling.config.json',
  'ai/overrides/rules/evk-grounding/override.json',
  'ai/overrides/rules/evk-grounding/instructions.md') + $canonicalFiles + $biomePresetFiles
$protected = @($protected | Sort-Object -Unique)
$preHashes = @{}
foreach ($path in $protected) { $preHashes[$path] = (Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash }
if ($preStatus.Length -eq 0) { throw 'status capture failed' }
```

- [ ] **Step 2: Capture and validate the dry-run plan**

```powershell
$initJson = (& node packages/ai-tooling/dist/cli.js init --config ai-tooling.config.json --dry-run --json) -join "`n"
if ($LASTEXITCODE -ne 0) { throw 'init dry-run failed' }
$initPlan = $initJson | ConvertFrom-Json -Depth 128
if ($initPlan.schemaVersion -ne 1 -or $initPlan.kind -ne 'mutation-plan' -or
    $initPlan.operation -ne 'init' -or $null -ne $initPlan.operationId -or
    $initPlan.planDigest -notmatch '^[0-9a-f]{64}$') { throw 'unexpected init plan identity' }
if ($initPlan.entries.Count -ne 13 -or $initPlan.summary.creates -ne 6 -or
    $initPlan.summary.replaces -ne 0 -or $initPlan.summary.deletes -ne 0 -or
    $initPlan.summary.directoryCreates -ne 7) { throw 'unexpected init plan summary' }
$expectedDirectories = @('.agents', '.agents/skills', '.agents/skills/evk-plan', '.claude',
  '.claude/rules', '.claude/skills', '.claude/skills/evk-plan')
$actualDirectories = @($initPlan.entries | Where-Object { $_.action -eq 'create-directory' } |
  ForEach-Object { $_.path })
if (($actualDirectories -join "`n") -cne ($expectedDirectories -join "`n")) {
  throw 'unexpected structural directories'
}
```

Expected: no repository byte changes. Review every entry, contributor, and unified diff.

- [ ] **Step 3: Apply the exact accepted digest**

```powershell
& node packages/ai-tooling/dist/cli.js init --config ai-tooling.config.json --accept-plan $initPlan.planDigest
if ($LASTEXITCODE -ne 0) { throw 'accepted init failed' }
```

- [ ] **Step 4: Verify generated and local-state outcomes**

Run in the same PowerShell session:

```powershell
$expectedGenerated = @(
  '.agents/skills/evk-plan/SKILL.md',
  '.claude/rules/evk-grounding.md',
  '.claude/skills/evk-plan/SKILL.md',
  'AGENTS.md',
  'CLAUDE.md',
  'ai-tooling.lock.json'
)
foreach ($path in $expectedGenerated) {
  $item = Get-Item -LiteralPath $path -Force
  if (-not $item.PSIsContainer -and $item.LinkType -eq $null -and $item.Length -gt 0) { continue }
  throw "generated leaf is not a nonempty regular file: $path"
}
$unexpectedGenerated = @(git status --porcelain=v1 --untracked-files=all -- AGENTS.md CLAUDE.md ai-tooling.lock.json .agents .claude |
  ForEach-Object { $_.Substring(3) } | Where-Object { $_ -notin $expectedGenerated })
if ($unexpectedGenerated.Count -ne 0) { throw "unexpected generated path: $($unexpectedGenerated -join ', ')" }
foreach ($directory in @('.ai-tooling/transactions', '.ai-tooling/backups', '.ai-tooling/stale-locks')) {
  if (-not (Test-Path -LiteralPath $directory -PathType Container)) { throw "missing state directory: $directory" }
  if (@(Get-ChildItem -LiteralPath $directory -Force).Count -ne 0) { throw "nonempty state directory: $directory" }
}
if (Test-Path -LiteralPath '.ai-tooling/run.lock') { throw 'run lock remained after init' }
foreach ($path in $protected) {
  if ((Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash -cne $preHashes[$path]) {
    throw "protected path changed: $path"
  }
}
```

Expected: no output and exit `0`.

- [ ] **Step 5: Prove the second render is empty and read-only commands agree**

Run:

```text
node packages/ai-tooling/dist/cli.js sync --config ai-tooling.config.json --dry-run --json
node packages/ai-tooling/dist/cli.js check --ci
node packages/ai-tooling/dist/cli.js diff
node packages/ai-tooling/dist/cli.js doctor
node packages/ai-tooling/dist/cli.js docs check-links
node packages/ai-tooling/dist/cli.js pack validate
```

Expected: every command exits `0`; sync JSON has zero entries and all-zero summary, diff is empty,
and all six registered artifacts remain byte-identical.

### Task 8: Exercise canonical edit, refresh-local, and sync

**Files:**

- Modify: `configs/ai/skills/evk-plan/instructions.md`
- Modify by command: `ai-tooling.lock.json`
- Modify by command: `.agents/skills/evk-plan/SKILL.md`
- Modify by command: `.claude/skills/evk-plan/SKILL.md`

**Interfaces:**

- Consumes: `pack refresh-local`, `sync`, accepted mutation plans, and locked local-pack provenance.
- Produces: one reviewed public instruction, refreshed local digest/provenance, and regenerated plan
skill leaves with no grounding or repository-config drift.

- [ ] **Step 1: Add the exact public instruction with apply_patch**

First capture the human-owned inputs in the current PowerShell session:

```powershell
$sequenceProtected = @(
  'ai-tooling.config.json',
  'ai/overrides/rules/evk-grounding/override.json',
  'ai/overrides/rules/evk-grounding/instructions.md'
)
$sequenceHashes = @{}
foreach ($path in $sequenceProtected) {
  $sequenceHashes[$path] = (Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash
}
```

Add one Markdown paragraph exactly:

```markdown
When reporting completion, distinguish checks that ran from behavior that remains unverified.
```

Run the clean-room/public-content review and record that the sentence contains no project-specific
architecture, secret, private prototype byte, or unsupported capability.

- [ ] **Step 2: Verify stale-source behavior before refresh**

Run:

```text
node packages/ai-tooling/dist/cli.js check --ci
node packages/ai-tooling/dist/cli.js sync --config ai-tooling.config.json --dry-run --json
```

Expected: both report stale locked local-pack input; sync performs zero write and does not bless the
new digest.

- [ ] **Step 3: Capture and apply refresh-local**

```powershell
$refreshJson = (& node packages/ai-tooling/dist/cli.js pack refresh-local '@evk-soft/ai-pack-core' --config ai-tooling.config.json --dry-run --json) -join "`n"
if ($LASTEXITCODE -ne 0) { throw 'refresh dry-run failed' }
$refreshPlan = $refreshJson | ConvertFrom-Json -Depth 128
if ($refreshPlan.schemaVersion -ne 1 -or $refreshPlan.kind -ne 'mutation-plan' -or
    $refreshPlan.operation -ne 'refresh-local' -or $null -ne $refreshPlan.operationId -or
    $refreshPlan.planDigest -notmatch '^[0-9a-f]{64}$' -or
    $refreshPlan.refresh.pack -ne '@evk-soft/ai-pack-core' -or
    $refreshPlan.refresh.newPackDigest -notmatch '^[0-9a-f]{64}$') {
  throw 'unexpected refresh identity'
}
& node packages/ai-tooling/dist/cli.js pack refresh-local '@evk-soft/ai-pack-core' --config ai-tooling.config.json --new-digest $refreshPlan.refresh.newPackDigest --accept-plan $refreshPlan.planDigest
if ($LASTEXITCODE -ne 0) { throw 'accepted refresh failed' }
```

Expected: only frozen local digest/provenance fields in the repository lock change; outputs remain
stale.

- [ ] **Step 4: Capture and apply sync**

```powershell
$syncJson = (& node packages/ai-tooling/dist/cli.js sync --config ai-tooling.config.json --dry-run --json) -join "`n"
if ($LASTEXITCODE -ne 0) { throw 'sync dry-run failed' }
$syncPlan = $syncJson | ConvertFrom-Json -Depth 128
if ($syncPlan.schemaVersion -ne 1 -or $syncPlan.kind -ne 'mutation-plan' -or
    $syncPlan.operation -ne 'sync' -or $null -ne $syncPlan.operationId -or
    $syncPlan.planDigest -notmatch '^[0-9a-f]{64}$' -or $syncPlan.entries.Count -ne 3) {
  throw 'unexpected sync identity'
}
& node packages/ai-tooling/dist/cli.js sync --config ai-tooling.config.json --accept-plan $syncPlan.planDigest
if ($LASTEXITCODE -ne 0) { throw 'accepted sync failed' }
$finalJson = (& node packages/ai-tooling/dist/cli.js sync --config ai-tooling.config.json --dry-run --json) -join "`n"
if ($LASTEXITCODE -ne 0) { throw 'second sync dry-run failed' }
$finalPlan = $finalJson | ConvertFrom-Json -Depth 128
if ($finalPlan.entries.Count -ne 0) { throw 'second sync is not empty' }
```

Expected: the two plan-skill leaves and their lock ownership records update; grounding leaves remain
byte-identical.

- [ ] **Step 5: Re-run content and protected-file verification**

Run:

```text
node packages/ai-tooling/dist/cli.js pack validate
pnpm --filter @evk-soft/ai-tooling run pack:check
node packages/ai-tooling/scripts/check-stage1-artifacts.mjs --phase 5 --tree
```

Then run this PowerShell comparison for every human-owned protected path:

```powershell
$phase4Protected = @('.gitignore', 'biome.json', '.husky/pre-commit') +
  @(git ls-tree -r --name-only HEAD -- configs/biome-config)
foreach ($path in $phase4Protected) {
  $baseObject = (git rev-parse "HEAD:$path").Trim()
  $worktreeObject = (git hash-object -- $path).Trim()
  if ($baseObject -notmatch '^[0-9a-f]{40}$' -or $worktreeObject -cne $baseObject) {
    throw "Phase 4 protected path changed: $path"
  }
}
foreach ($path in $sequenceProtected) {
  if ((Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash -cne $sequenceHashes[$path]) {
    throw "sequence input changed: $path"
  }
}
```

Expected: all commands exit `0`; config and override still strict-validate, and no protected path
differs from the approved Phase 4 object.

### Task 9: Finalize check-only three-OS workflow and formatter audit

**Files:**

- Modify: `.github/workflows/ai-tooling.yml`

**Interfaces:**

- Consumes: Phase 3 workflow contract test, native matrix, Node-entry formatter audit, and publishable
  Windows package check.
- Produces: exact Windows/Linux/macOS read-only validation for the final committed SHA.

- [ ] **Step 1: Add the failing final workflow-contract assertions**

```ts
it('keeps final native CI check-only and action-pin closed', () => {
  const workflow = loadWorkflow('.github/workflows/ai-tooling.yml');
  expect(workflow.permissions).toStrictEqual({ contents: 'read' });
  expect(collectUses(workflow)).toStrictEqual([
    'actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683',
    'actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020',
  ]);
  expect(collectRunSteps(workflow)).toContain(
    'node packages/ai-tooling/dist/cli.js doctor --formatter-check --node-entry @biomejs/biome/bin/biome -- check --write .',
  );
  expect(collectUses(workflow).some((value) => value.includes('upload-artifact'))).toBe(false);
});
```

- [ ] **Step 2: Run the workflow-contract test and verify RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/biome-exclusions.spec.ts --passWithNoTests=false --reporter=verbose
```

Expected: exit `1`; the final command sequence or Phase 5 package step is missing.

- [ ] **Step 3: Write the exact final workflow command sequence**

Retain the existing matrix rows `ubuntu-24.04/linux/x64`, `windows-2025/win32/x64`, and
`macos-15/darwin/arm64`, Node 24 and pnpm 11.20.0. The real-checkout run block is exactly:

```yaml
- run: node packages/ai-tooling/dist/cli.js check --ci
- run: node packages/ai-tooling/dist/cli.js docs check-links
- run: node packages/ai-tooling/dist/cli.js pack validate
- run: node packages/ai-tooling/dist/cli.js doctor --formatter-check --node-entry @biomejs/biome/bin/biome -- check --write .
- run: pnpm --filter @evk-soft/ai-tooling run typecheck
- run: pnpm --filter @evk-soft/ai-tooling run test
- run: pnpm --filter @evk-soft/ai-tooling run build
- run: pnpm check
```

The install step remains exactly `env: { HUSKY: '0' }` and
`run: pnpm install --frozen-lockfile --ignore-scripts`. Capture status before install and require
byte-identical porcelain-v2 NUL output after install and at job end. Windows additionally runs native
build plus `check-package-contents.mjs --publishable --json`, emits only filename/length/SHA, and does
not upload or publish it.

- [ ] **Step 4: Run the workflow-contract test and verify GREEN**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/biome-exclusions.spec.ts --passWithNoTests=false --reporter=verbose
```

Expected: exit `0`; the only `uses:` values are the two exact pins and the workflow has no write
permission or artifact action.

- [ ] **Step 5: Run the formatter audit locally**

Run:

```text
node packages/ai-tooling/dist/cli.js doctor --formatter-check --node-entry @biomejs/biome/bin/biome -- check --write .
```

Expected: exit `0`, trusted Node-entry proof, exact argv/environment/cwd, quiescent tree, zero changed
registered bytes, identical checkout census, and no raw/absolute path in machine output.

### Task 10: Complete durable documentation and exact coverage links

**Files:**

- Modify: `packages/ai-tooling/README.md`
- Modify: `docs/ai-tooling/USER-GUIDE.md`
- Modify: `docs/ai-tooling/AI-AUTHORING-GUIDE.md`
- Modify: `docs/ai-tooling/EXTENDING-PACKS.md`
- Modify: `docs/ai-tooling/SECURITY.md`
- Modify: `docs/system-overview/ai-tooling.md`
- Modify: `README.md`
- Modify: `packages/ai-tooling/tests/fixtures/stage1-coverage.json`
- Modify: `packages/ai-tooling/tests/security/artifact-scan.spec.ts`

**Interfaces:**

- Consumes: Task 4 coverage schema and shipped Phase 1-5 command/capability set.
- Produces: durable headings for every coverage record and no reverse link to temporary delivery docs.

- [ ] **Step 1: Add the failing durable-heading test**

```ts
it('resolves every final capability to production, test, and durable documentation', async () => {
  const coverage = await loadStage1Coverage();
  expect(coverage.capabilities.map((entry) => entry.id)).toStrictEqual([
    'strict-json', 'local-pack', 'overrides', 'codex-project', 'claude-code-project',
    'ownership', 'check', 'diff', 'doctor', 'formatter-check', 'init', 'sync',
    'refresh-local', 'restore-generated', 'repair', 'artifact-scan', 'package-scan',
    'docs-links',
  ]);
  for (const entry of coverage.capabilities) {
    await expect(resolveCoverageEntry(entry)).resolves.toStrictEqual({
      production: true,
      test: true,
      durableHeading: true,
    });
  }
});
```

- [ ] **Step 2: Run the heading test and verify RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/security/artifact-scan.spec.ts -t "resolves every final capability" --passWithNoTests=false --reporter=verbose
```

Expected: exit `1`; the named first missing final heading is reported.

- [ ] **Step 3: Write the exact durable section set**

Use these exact durable headings and opening claims; extend each with command examples and recovery
actions already exercised by the tests, but do not change the claims:

```markdown
## Strict JSON and schema validation

AI Tooling rejects duplicate object keys, non-I-JSON values, noncanonical JSON where canonical bytes
are required, schema-invalid metadata, and any schema resolution that is not satisfied by the closed
offline registry.

## Package boundaries

`@evk-soft/ai-pack-core` contains public instruction content. `@evk-soft/ai-tooling` contains schemas,
rendering, adapters, verification, installation, update, and recovery mechanics.
`@evk-soft/code-intelligence` is a separate product and is not delivered by Stage 1.

## Tracked local pack

Stage 1 reads only the tracked repository-relative `configs/ai` pack. It performs no registry, Git,
HTTP, DNS, cache, or other remote acquisition.

## Generated-file ownership and drift

Generated EVK files and `ai-tooling.lock.json` are tool-owned and must not be edited directly. Project
customization belongs only under `ai/overrides/**`; a digest mismatch blocks overwrite or deletion.

## Formatter trust boundary

Formatter audit runs an explicitly selected trusted provider in a disposable repository copy. It is
not an operating-system sandbox and it never opens the real checkout for write.

## Recovery and repair

Mutation is journaled, backup-before-replace, lock-last, and preserve-first. `doctor --repair` writes
only after an exact reviewed plan and confirmation; third-state evidence blocks without mutation.

## Stage 1 limits

Stage 1 delivers `evk-grounding`, `evk-plan`, the safe core, Codex and Claude Code project adapters,
and devkit self-hosting. Remote sources, preview, hooks, plugins, publication, code intelligence, and
umbrella Stages 2-5 remain unavailable.
```

The destination map is exact:

- `packages/ai-tooling/README.md`: `## Package boundaries`, plus the Node 24 floor, exact package
  exports, and unpublished source-build status.
- `docs/ai-tooling/USER-GUIDE.md`: `## Tracked local pack`, `## Generated-file ownership and drift`,
  `## Codex project adapter`, `## Claude Code project adapter`, `## Initialization`,
  `## Synchronization`, `## Refreshing a local pack`, `## Restoring a generated file`, `## Check`,
  `## Diff`, and `## Doctor`.
- `docs/ai-tooling/AI-AUTHORING-GUIDE.md`: `## Project overrides` and
  `## Documentation links`.
- `docs/ai-tooling/SECURITY.md`: `## Strict JSON and schema validation`,
  `## Formatter trust boundary`, `## Recovery and repair`, `## Artifact scanning`, and
  `## Package content scanning`.
- `docs/system-overview/ai-tooling.md`: `## Stage 1 limits`.

Update root `README.md` with links to the package README, user guide, authoring guide, extension guide,
security guide, and system overview. Update `docs/ai-tooling/EXTENDING-PACKS.md` only where its
existing public pack/override workflow must link to the new authoring and security headings. Document
the unchanged write-and-`git add -A` pre-commit hook in `docs/system-overview/ai-tooling.md` as a
noncompliant Stage 1 legacy deviation owned by Stage 2.

- [ ] **Step 4: Update every coverage record to the exact new anchor**

Write exactly:

```json
{
  "schemaVersion": 1,
  "capabilities": [
    {
      "id": "strict-json",
      "production": "packages/ai-tooling/src/json/strict-json.ts",
      "test": "packages/ai-tooling/tests/unit/strict-json.spec.ts",
      "document": "docs/ai-tooling/SECURITY.md#strict-json-and-schema-validation"
    },
    {
      "id": "local-pack",
      "production": "packages/ai-tooling/src/pack/load-local.ts",
      "test": "packages/ai-tooling/tests/integration/local-pack-source.spec.ts",
      "document": "docs/ai-tooling/USER-GUIDE.md#tracked-local-pack"
    },
    {
      "id": "overrides",
      "production": "packages/ai-tooling/src/resolve/overrides.ts",
      "test": "packages/ai-tooling/tests/unit/overrides.spec.ts",
      "document": "docs/ai-tooling/AI-AUTHORING-GUIDE.md#project-overrides"
    },
    {
      "id": "codex-project",
      "production": "packages/ai-tooling/src/adapters/codex.ts",
      "test": "packages/ai-tooling/tests/unit/codex-adapter.spec.ts",
      "document": "docs/ai-tooling/USER-GUIDE.md#codex-project-adapter"
    },
    {
      "id": "claude-code-project",
      "production": "packages/ai-tooling/src/adapters/claude-code.ts",
      "test": "packages/ai-tooling/tests/unit/claude-code-adapter.spec.ts",
      "document": "docs/ai-tooling/USER-GUIDE.md#claude-code-project-adapter"
    },
    {
      "id": "ownership",
      "production": "packages/ai-tooling/src/ownership/check.ts",
      "test": "packages/ai-tooling/tests/unit/ownership-check.spec.ts",
      "document": "docs/ai-tooling/SECURITY.md#generated-file-ownership-and-drift"
    },
    {
      "id": "check",
      "production": "packages/ai-tooling/src/commands/check.ts",
      "test": "packages/ai-tooling/tests/integration/read-only-commands.spec.ts",
      "document": "docs/ai-tooling/USER-GUIDE.md#check"
    },
    {
      "id": "diff",
      "production": "packages/ai-tooling/src/commands/diff.ts",
      "test": "packages/ai-tooling/tests/integration/read-only-commands.spec.ts",
      "document": "docs/ai-tooling/USER-GUIDE.md#diff"
    },
    {
      "id": "doctor",
      "production": "packages/ai-tooling/src/commands/doctor.ts",
      "test": "packages/ai-tooling/tests/integration/doctor-report.spec.ts",
      "document": "docs/ai-tooling/USER-GUIDE.md#doctor"
    },
    {
      "id": "formatter-check",
      "production": "packages/ai-tooling/src/formatter/runner.ts",
      "test": "packages/ai-tooling/tests/integration/formatter-runner.spec.ts",
      "document": "docs/ai-tooling/SECURITY.md#formatter-trust-boundary"
    },
    {
      "id": "init",
      "production": "packages/ai-tooling/src/commands/init.ts",
      "test": "packages/ai-tooling/tests/integration/init.spec.ts",
      "document": "docs/ai-tooling/USER-GUIDE.md#initialization"
    },
    {
      "id": "sync",
      "production": "packages/ai-tooling/src/commands/sync.ts",
      "test": "packages/ai-tooling/tests/integration/sync.spec.ts",
      "document": "docs/ai-tooling/USER-GUIDE.md#synchronization"
    },
    {
      "id": "refresh-local",
      "production": "packages/ai-tooling/src/commands/refresh-local.ts",
      "test": "packages/ai-tooling/tests/integration/refresh-local.spec.ts",
      "document": "docs/ai-tooling/USER-GUIDE.md#refreshing-a-local-pack"
    },
    {
      "id": "restore-generated",
      "production": "packages/ai-tooling/src/commands/restore-generated.ts",
      "test": "packages/ai-tooling/tests/integration/restore-generated.spec.ts",
      "document": "docs/ai-tooling/USER-GUIDE.md#restoring-a-generated-file"
    },
    {
      "id": "repair",
      "production": "packages/ai-tooling/src/recovery/repair.ts",
      "test": "packages/ai-tooling/tests/integration/doctor-repair.spec.ts",
      "document": "docs/ai-tooling/SECURITY.md#recovery-and-repair"
    },
    {
      "id": "artifact-scan",
      "production": "packages/ai-tooling/scripts/check-stage1-artifacts.mjs",
      "test": "packages/ai-tooling/tests/security/artifact-scan.spec.ts",
      "document": "docs/ai-tooling/SECURITY.md#artifact-scanning"
    },
    {
      "id": "package-scan",
      "production": "packages/ai-tooling/scripts/check-package-contents.mjs",
      "test": "packages/ai-tooling/tests/package/package-contract.spec.ts",
      "document": "docs/ai-tooling/SECURITY.md#package-content-scanning"
    },
    {
      "id": "docs-links",
      "production": "packages/ai-tooling/src/docs/link-checker.ts",
      "test": "packages/ai-tooling/tests/unit/link-checker.spec.ts",
      "document": "docs/ai-tooling/AI-AUTHORING-GUIDE.md#documentation-links"
    }
  ]
}
```

Every path must exist in the committed candidate and every anchor must resolve with exact case and
percent decoding. No record names a temporary spec or plan.

- [ ] **Step 5: Run coverage and link checks for GREEN**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/security/artifact-scan.spec.ts --passWithNoTests=false --reporter=verbose
node packages/ai-tooling/dist/cli.js docs check-links
```

Expected: both exit `0`; links, anchors, images, encodings, percent paths and exact case are closed,
and no durable file links to a temporary delivery document.

### Task 11: Verify, stage, commit, and stop at the Phase 5 owner gate

**Files:**

- Reference: `docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-5.txt`

**Interfaces:**

- Consumes: all Phase 5 task evidence and the frozen Phase 4 approved-base object.
- Produces: one exact Phase 5 candidate commit and no push/publication.

- [ ] **Step 1: Run the complete current-OS gate**

Run each command separately and require exit `0`:

```text
node packages/ai-tooling/dist/cli.js check --ci
node packages/ai-tooling/dist/cli.js docs check-links
node packages/ai-tooling/dist/cli.js pack validate
node packages/ai-tooling/dist/cli.js doctor --formatter-check --node-entry @biomejs/biome/bin/biome -- check --write .
pnpm --filter @evk-soft/ai-tooling run typecheck
pnpm --filter @evk-soft/ai-tooling run test:unit
pnpm --filter @evk-soft/ai-tooling run test:integration
pnpm --filter @evk-soft/ai-tooling run test:native
pnpm --filter @evk-soft/ai-tooling run build
pnpm --filter @evk-soft/ai-tooling run pack:check
node packages/ai-tooling/scripts/check-stage1-artifacts.mjs --phase 5 --tree
pnpm check
git diff --check
```

- [ ] **Step 2: Revalidate protected paths and local-state cleanliness**

Run:

```powershell
$protected = @('.gitignore', 'biome.json', '.husky/pre-commit') +
  @(git ls-tree -r --name-only HEAD -- configs/biome-config)
foreach ($path in $protected) {
  $baseObject = (git rev-parse "HEAD:$path").Trim()
  $worktreeObject = (git hash-object -- $path).Trim()
  if ($baseObject -notmatch '^[0-9a-f]{40}$' -or $worktreeObject -cne $baseObject) {
    throw "protected path changed: $path"
  }
}
$stagedLocal = @(git diff --cached --name-only -- .ai-tooling)
if ($stagedLocal.Count -ne 0) { throw '.ai-tooling path is staged' }
if (Test-Path -LiteralPath '.ai-tooling/run.lock') { throw 'run lock is present' }
$transactionChildren = @(Get-ChildItem -LiteralPath '.ai-tooling/transactions' -Force -ErrorAction Stop)
$backupChildren = @(Get-ChildItem -LiteralPath '.ai-tooling/backups' -Force -ErrorAction Stop)
if ($transactionChildren.Count -ne 0 -or $backupChildren.Count -ne 0) {
  throw 'transaction or backup remnant is present'
}
```

Expected: no output and exit `0`.

- [ ] **Step 3: Stage exactly the Phase 5 manifest**

Run exactly these 29 explicit staging commands:

```text
git add -- .agents/skills/evk-plan/SKILL.md
git add -- .claude/rules/evk-grounding.md
git add -- .claude/skills/evk-plan/SKILL.md
git add -- .github/workflows/ai-tooling.yml
git add -- AGENTS.md
git add -- CLAUDE.md
git add -- README.md
git add -- ai-tooling.config.json
git add -- ai-tooling.lock.json
git add -- ai/overrides/rules/evk-grounding/instructions.md
git add -- ai/overrides/rules/evk-grounding/override.json
git add -- configs/ai/skills/evk-plan/instructions.md
git add -- docs/ai-tooling/AI-AUTHORING-GUIDE.md
git add -- docs/ai-tooling/EXTENDING-PACKS.md
git add -- docs/ai-tooling/SECURITY.md
git add -- docs/ai-tooling/USER-GUIDE.md
git add -- docs/system-overview/ai-tooling.md
git add -- packages/ai-tooling/README.md
git add -- packages/ai-tooling/package.json
git add -- packages/ai-tooling/scripts/check-package-contents.mjs
git add -- packages/ai-tooling/scripts/check-stage1-artifacts.mjs
git add -- packages/ai-tooling/src/git/provider.ts
git add -- packages/ai-tooling/tests/fixtures/artifact-scan/vectors.json
git add -- packages/ai-tooling/tests/fixtures/fake-git/provider.mjs
git add -- packages/ai-tooling/tests/fixtures/self-host/expected-manifest.json
git add -- packages/ai-tooling/tests/fixtures/stage1-coverage.json
git add -- packages/ai-tooling/tests/integration/self-hosting.spec.ts
git add -- packages/ai-tooling/tests/security/artifact-scan.spec.ts
git add -- packages/ai-tooling/tests/unit/git-provider.spec.ts
```

Then run:

```text
git diff --cached --check
node packages/ai-tooling/scripts/verify-phase-delta.mjs --phase 5 --cached
node packages/ai-tooling/scripts/check-stage1-artifacts.mjs --phase 5 --cached
```

Expected: all exit `0`; cached status/path/mode equals the committed manifest and every generated
staged byte equals the repository lock.

- [ ] **Step 4: Capture the approved base, create the sole phase commit, and bind the candidate**

Run in PowerShell:

```powershell
$approvedBaseSha = (git rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0 -or $approvedBaseSha -notmatch '^[0-9a-f]{40}$') {
  throw 'approved base SHA is invalid'
}
git commit --no-verify -m "feat(ai): self-host the Stage 1 safe core"
if ($LASTEXITCODE -ne 0) { throw 'Phase 5 commit failed' }
$candidateSha = (git rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0 -or $candidateSha -notmatch '^[0-9a-f]{40}$' -or
    $candidateSha -ceq $approvedBaseSha) { throw 'candidate SHA is invalid' }
node packages/ai-tooling/scripts/verify-phase-delta.mjs --phase 5 --base $approvedBaseSha --commit $candidateSha
if ($LASTEXITCODE -ne 0) { throw 'committed phase delta is invalid' }
node packages/ai-tooling/scripts/check-stage1-artifacts.mjs --repository $candidateSha
if ($LASTEXITCODE -ne 0) { throw 'committed full-tree artifact scan failed' }
```

Expected: one new single-parent commit; exact manifest delta; green full-tree scan with no plan/docs
whitelist.

- [ ] **Step 5: Re-run the complete gate against committed HEAD**

Run each command again against committed `HEAD`:

```text
node packages/ai-tooling/dist/cli.js check --ci
node packages/ai-tooling/dist/cli.js docs check-links
node packages/ai-tooling/dist/cli.js pack validate
node packages/ai-tooling/dist/cli.js doctor --formatter-check --node-entry @biomejs/biome/bin/biome -- check --write .
pnpm --filter @evk-soft/ai-tooling run typecheck
pnpm --filter @evk-soft/ai-tooling run test:unit
pnpm --filter @evk-soft/ai-tooling run test:integration
pnpm --filter @evk-soft/ai-tooling run test:native
pnpm --filter @evk-soft/ai-tooling run build
pnpm --filter @evk-soft/ai-tooling run pack:check
node packages/ai-tooling/scripts/check-stage1-artifacts.mjs --repository $candidateSha
pnpm check
git diff --check
git status --short --branch
```

Expected: every check exits `0`, status is clean, and `(git rev-parse HEAD).Trim()` remains exactly
`$candidateSha`.

- [ ] **Step 6: Stop for validation-push and decommission approval**

Report `$approvedBaseSha`, `$candidateSha`, local test evidence, native applicability, and package
archive filename/length/SHA. Do not push unless the owner separately authorizes the exact temporary
validation branch. Even after green exact-SHA Windows/Linux/macOS validation, do not publish, open a
pull request, or start decommissioning until the owner explicitly approves this exact commit.
