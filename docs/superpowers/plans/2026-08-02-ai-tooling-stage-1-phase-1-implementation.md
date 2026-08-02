# AI Tooling Stage 1 Phase 1: Contracts and Instruction-Only Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the Stage 1 package and test boundaries, strict standard-JSON and offline-schema contracts, deterministic configuration and generated-JSON bytes, a fail-closed phase/artifact gate, and the independently reviewed instruction-only core pack.

**Architecture:** `configs/ai/**` is the sole canonical EVK content source and `packages/ai-tooling/**` owns parsing, schemas, deterministic bytes, CLI/package boundaries, and validation. Phase 1 deliberately stops before real repository source discovery, project adapters, generated project outputs, or mutation: pack validation/building operates through injected read-only inputs and an explicit trusted temporary destination.

**Tech Stack:** Node.js 24 or later, pnpm 10.28.0 workspace, TypeScript 6.0.3 ESM, Vitest 4.1.10, `@vitest/coverage-v8` 4.1.10, `@types/node` 24.13.3, Ajv 8.20.0 through `ajv/dist/2020.js`, `jsonc-parser` 3.3.1, `json-canonicalize` 2.0.0, JSON Schema draft 2020-12, SHA-256, Biome 2.5.6, and Git 2.45.0 or later for the plan-phase object-reading gates.

## Global Constraints

- **Status:** Awaiting owner approval. This plan does not authorize implementation.
- Implement only approved Stage 1 Phase 1. Do not implement remote acquisition, cache, preview activation, adoption, hooks, plugins, capability installation, project adapters, generated root outputs, mutation, publication, source-code intelligence, or umbrella Stages 2-5.
- Do not start until the owner explicitly says `approve Stage 1 implementation plan and start Phase 1`. Approval authorizes Phase 1 only.
- Work in a clean isolated worktree based on the owner-approved baseline. Do not use `git stash`. Preserve unrelated owner changes.
- Produce exactly one Phase 1 implementation commit. Do not create intermediate commits. Stop after reporting the exact Phase 1 candidate SHA and evidence.
- Keep canonical metadata and schemas in strict standard JSON, instructions in Markdown, and generated JSON in UTF-8 with LF, two spaces, stable key order, and exactly one final LF.
- Never copy a byte from the private UNLICENSED prototype. Tests use only synthetic markers, credentials, paths, and names. Tests never read or write real Codex, Claude Code, or other user configuration.
- `/.ai-tooling/` is a human-owned root `.gitignore` rule. AI Tooling verifies it in later phases and never edits `.gitignore` or formatter configuration itself. `ai-tooling.lock.json` must remain unignored.
- Phase 1 accepts no real repository filesystem implementation. Pack validate/build functions consume the injected `ReadOnlySourceContext`; their production CLI remains capability-unavailable until Phase 2 supplies the repository context.
- Every behavioral packet follows literal test -> exact RED -> minimal implementation -> exact GREEN. A no-tests, import-filter, configuration, network, or fixture-discovery failure is not a behavioral RED.
- Each focused GREEN must name the intended test, show it was neither skipped nor retried, and prove its no-write or exact-byte postcondition.
- Before the sole commit, run the complete phase gate, the hook-equivalent formatter command without its broad `git add -A`, exact manifest comparison, artifact scan, and staged-byte checks.

---

## Phase Entry Snapshot

- [ ] **Step 1: bind the exact owner-approved baseline in the PowerShell session used for this phase**

Run these commands in one PowerShell session and retain `$approvedBaseSha` through the final committed-delta gate:

```powershell
$approvedBaseSha = (git rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0 -or $approvedBaseSha -cnotmatch '^[0-9a-f]{40}$') {
  throw 'owner-approved baseline is not one full lowercase SHA-1'
}
git branch --show-current
git rev-parse HEAD
git status --short --branch
git log --oneline main..HEAD
pnpm install --frozen-lockfile --ignore-scripts
if ($LASTEXITCODE -ne 0) { throw 'Phase 1 entry snapshot failed' }
git status --short --branch
```

Expected GREEN: every command exits `0`; `git rev-parse HEAD` equals `$approvedBaseSha`; the value is one full lowercase 40-hex object ID; install executes no lifecycle script; and the final status is identical to the initial status. Stop instead of editing if any assertion fails.

- [ ] **Step 2: prove the approved baseline carries the exact Tech Stack toolchain**

The owner tooling baseline required by master section 0.2 is a separate commit from the plan-bundle commit, and only it raises the checkout to TypeScript 6.0.3 and Biome 2.5.6. Binding `$approvedBaseSha` alone cannot detect a baseline taken before that commit, so run these assertions in the same PowerShell session, after the Step 1 install:

```powershell
$nodeVersion = (node --version).Trim()
if ($LASTEXITCODE -ne 0 -or $nodeVersion -cnotmatch '^v(2[4-9]|[3-9][0-9])\.') {
  throw "baseline Node is '$nodeVersion', not >=24.0.0"
}
$pnpmVersion = (pnpm --version).Trim()
if ($LASTEXITCODE -ne 0 -or $pnpmVersion -cne '10.28.0') {
  throw "baseline pnpm is '$pnpmVersion', not 10.28.0"
}
$typescriptVersion = (pnpm -s exec tsc --version).Trim()
if ($LASTEXITCODE -ne 0 -or $typescriptVersion -cne 'Version 6.0.3') {
  throw "baseline TypeScript is '$typescriptVersion', not 6.0.3"
}
$biomeVersion = (pnpm -s exec biome --version).Trim()
if ($LASTEXITCODE -ne 0 -or $biomeVersion -cne 'Version: 2.5.6') {
  throw "baseline Biome is '$biomeVersion', not 2.5.6"
}
```

Expected GREEN: every command exits `0` and all four assertions pass, proving the baseline is the owner tooling baseline rather than an earlier commit. Any mismatch is a stop with zero edits: obtain the owner tooling baseline commit, or return this plan for a Tech Stack amendment, before Task 1.

## Phase Inputs and Closed File Set

The approved design input is `docs/superpowers/specs/2026-08-01-ai-tooling-stage-1-safe-core-design.md`, whose provenance approval commit is `2eb8e7e90991f73bde27fb62277670ca9646e9e4`. The sibling Stage 1 master plan is committed together with this packet in the same owner-approved plan-bundle commit; it has no earlier standalone commit claim. This packet is self-contained for Phase 1 execution; those documents are provenance, not missing implementation instructions.

The committed manifest `docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-1.txt` is the fail-closed staging authority. Its exact entries are:

```text
M 100644 .gitignore
A 100644 configs/ai/LICENSE
M 100644 configs/ai/README.md
A 100644 configs/ai/pack.json
A 100644 configs/ai/package.json
A 100644 configs/ai/rules/evk-grounding/instructions.md
A 100644 configs/ai/rules/evk-grounding/rule.json
A 100644 configs/ai/skills/evk-plan/instructions.md
A 100644 configs/ai/skills/evk-plan/skill.json
A 100644 docs/ai-tooling/EXTENDING-PACKS.md
A 100644 docs/ai-tooling/SECURITY.md
M 100644 docs/system-overview/ai-tooling.md
M 100644 package.json
A 100644 packages/ai-tooling/LICENSE
A 100644 packages/ai-tooling/README.md
A 100644 packages/ai-tooling/package.json
A 100644 packages/ai-tooling/schemas/config.schema.json
A 100644 packages/ai-tooling/schemas/lock.schema.json
A 100644 packages/ai-tooling/schemas/override.schema.json
A 100644 packages/ai-tooling/schemas/pack.schema.json
A 100644 packages/ai-tooling/schemas/rule.schema.json
A 100644 packages/ai-tooling/schemas/skill.schema.json
A 100644 packages/ai-tooling/schemas/state.schema.json
A 100644 packages/ai-tooling/scripts/check-package-contents.mjs
A 100644 packages/ai-tooling/scripts/check-stage1-artifacts.mjs
A 100644 packages/ai-tooling/scripts/verify-phase-delta.mjs
A 100644 packages/ai-tooling/src/cli.ts
A 100644 packages/ai-tooling/src/commands/pack.ts
A 100644 packages/ai-tooling/src/config/git-url-v1.ts
A 100644 packages/ai-tooling/src/config/projection.ts
A 100644 packages/ai-tooling/src/config/types.ts
A 100644 packages/ai-tooling/src/diagnostics/codes.ts
A 100644 packages/ai-tooling/src/diagnostics/error.ts
A 100644 packages/ai-tooling/src/diagnostics/json.ts
A 100644 packages/ai-tooling/src/diagnostics/terminal-safe.ts
A 100644 packages/ai-tooling/src/index.ts
A 100644 packages/ai-tooling/src/json/jcs.ts
A 100644 packages/ai-tooling/src/json/render-json.ts
A 100644 packages/ai-tooling/src/json/schema-registry.ts
A 100644 packages/ai-tooling/src/json/strict-json.ts
A 100644 packages/ai-tooling/src/model/types.ts
A 100644 packages/ai-tooling/src/pack/build.ts
A 100644 packages/ai-tooling/src/pack/types.ts
A 100644 packages/ai-tooling/tests/fixtures/artifact-scan/vectors.json
A 100644 packages/ai-tooling/tests/fixtures/config-digest/vectors.json
A 100644 packages/ai-tooling/tests/fixtures/json/comment.json
A 100644 packages/ai-tooling/tests/fixtures/json/duplicate-key.json
A 100644 packages/ai-tooling/tests/fixtures/json/lone-surrogate.json
A 100644 packages/ai-tooling/tests/fixtures/json/non-roundtrip-integer.json
A 100644 packages/ai-tooling/tests/fixtures/json/non-roundtrip-number.json
A 100644 packages/ai-tooling/tests/fixtures/json/trailing-comma.json
A 100644 packages/ai-tooling/tests/fixtures/json/valid.json
A 100644 packages/ai-tooling/tests/fixtures/render-json/expected.json
A 100644 packages/ai-tooling/tests/fixtures/render-json/vectors.json
A 100644 packages/ai-tooling/tests/fixtures/rfc8785/vectors.json
A 100644 packages/ai-tooling/tests/fixtures/schemas/unresolved-ref.schema.json
A 100644 packages/ai-tooling/tests/fixtures/schemas/vectors.json
A 100644 packages/ai-tooling/tests/fixtures/stage1-artifact-policy.json
A 100644 packages/ai-tooling/tests/helpers/temp-repository.ts
A 100644 packages/ai-tooling/tests/integration/core-pack.spec.ts
A 100644 packages/ai-tooling/tests/integration/pack-build.spec.ts
A 100644 packages/ai-tooling/tests/integration/repository-ignore.spec.ts
A 100644 packages/ai-tooling/tests/package/package-contract.spec.ts
A 100644 packages/ai-tooling/tests/package/schema-bytes.spec.ts
A 100644 packages/ai-tooling/tests/security/artifact-scan.spec.ts
A 100644 packages/ai-tooling/tests/unit/configuration-digest.spec.ts
A 100644 packages/ai-tooling/tests/unit/git-url-v1.spec.ts
A 100644 packages/ai-tooling/tests/unit/render-json.spec.ts
A 100644 packages/ai-tooling/tests/unit/schema-registry.spec.ts
A 100644 packages/ai-tooling/tests/unit/strict-json.spec.ts
A 100644 packages/ai-tooling/tests/unit/terminal-safe.spec.ts
A 100644 packages/ai-tooling/tests/unit/verify-phase-delta.spec.ts
A 100644 packages/ai-tooling/tsconfig.json
A 100644 packages/ai-tooling/vitest.config.ts
M 100644 pnpm-lock.yaml
```

No path outside that set may change, be staged, or enter the Phase 1 commit.

## Shared Phase 1 Contracts

The implementation uses these exact trust-boundary types; later tasks consume them without changing their names or shapes:

```ts
export type AbsolutePath = string & { readonly __absolutePath: unique symbol };
export type PortableRelativePath = string & { readonly __portablePath: unique symbol };
export type PortablePathSegment = string & { readonly __portablePathSegment: unique symbol };
export type Sha256Hex = string & { readonly __sha256Hex: unique symbol };
export type ResourceId = string & { readonly __resourceId: unique symbol };
export type PackId = string & { readonly __packId: unique symbol };
export type PlatformId = 'codex' | 'claude-code';
export type PlatformSelection = readonly [PlatformId, ...PlatformId[]];
export type AdapterId = 'codex-project' | 'claude-code-project';
export interface AdapterIdentity {
  readonly id: AdapterId;
  readonly version: '1';
}
export type JsonPrimitive = null | boolean | number | string;
export type JsonValue = JsonPrimitive | JsonObject | readonly JsonValue[];
export interface JsonObject { readonly [key: string]: JsonValue }

export type RedactedSourceKind =
  | 'config'
  | 'pack'
  | 'rule'
  | 'skill'
  | 'override'
  | 'lock'
  | 'state'
  | 'fixture';
export interface RedactedSource {
  readonly kind: RedactedSourceKind;
  readonly label: string | null;
}
export interface NumberToken {
  readonly raw: string;
  readonly offset: number;
  readonly length: number;
  readonly parsed: number;
}
declare const strictJsonDocumentBrand: unique symbol;
export interface StrictJsonDocument {
  readonly [strictJsonDocumentBrand]: true;
  readonly value: unknown;
  readonly sourceBytes: Uint8Array;
  readonly numberTokens: readonly NumberToken[];
}

export type NodeKind = 'file' | 'directory' | 'link' | 'other';
export type ObjectLocatorIdentity<K extends NodeKind = NodeKind> =
  | {
      readonly os: 'posix';
      readonly nodeKind: K;
      readonly dev: bigint;
      readonly ino: bigint;
    }
  | {
      readonly os: 'win32';
      readonly nodeKind: K;
      readonly volumeSerial: bigint;
      readonly fileId128: string;
    };
export type ObjectIdentity<K extends NodeKind = NodeKind> =
  | {
      readonly os: 'posix';
      readonly nodeKind: K;
      readonly dev: bigint;
      readonly ino: bigint;
      readonly mode: number;
      readonly size: bigint;
      readonly ctimeNs: bigint;
      readonly mtimeNs: bigint;
    }
  | {
      readonly os: 'win32';
      readonly nodeKind: K;
      readonly volumeSerial: bigint;
      readonly fileId128: string;
      readonly attributes: number;
      readonly size: bigint;
      readonly creationTime: bigint;
      readonly lastWriteTime: bigint;
    };
export type ObservedPathState =
  | { readonly kind: 'absent' }
  | { readonly kind: 'file'; readonly digest: Sha256Hex; readonly identity: ObjectIdentity<'file'> }
  | { readonly kind: 'link'; readonly target: string; readonly identity: ObjectIdentity<'link'> }
  | { readonly kind: 'directory'; readonly identity: ObjectIdentity<'directory'> };
export type InspectedPathState =
  | { readonly kind: 'absent' }
  | { readonly kind: 'file'; readonly identity: ObjectIdentity<'file'> }
  | { readonly kind: 'link'; readonly identity: ObjectIdentity<'link'> }
  | { readonly kind: 'directory'; readonly identity: ObjectIdentity<'directory'> };
export interface ContainedPathRef {
  readonly relativePath: PortableRelativePath;
  readonly ancestors: readonly ObjectLocatorIdentity<'directory'>[];
}

export interface ValidatedResource {
  readonly id: ResourceId;
  readonly kind: 'rule' | 'skill';
  readonly metadata: Readonly<JsonObject>;
  readonly instructions: Uint8Array;
  readonly baseDigest: Sha256Hex;
}
export interface ValidatedPack {
  readonly id: PackId;
  readonly version: string;
  readonly rootDigest: Sha256Hex;
  readonly resources: readonly ValidatedResource[];
}
export type Contributor =
  | {
      readonly kind: 'pack';
      readonly packId: PackId;
      readonly resourceId: ResourceId;
      readonly digest: Sha256Hex;
    }
  | {
      readonly kind: 'override';
      readonly path: PortableRelativePath;
      readonly mode: 'extend' | 'replace' | 'disable';
      readonly target: ResourceId;
      readonly digest: Sha256Hex;
    };

export interface AsyncByteSink {
  write(chunk: Uint8Array): Promise<void>;
  end(): Promise<void>;
}
export interface CliOutputSink extends AsyncByteSink {
  flush(): Promise<void>;
}
export interface ConfirmationInput {
  readDigestFrame(): Promise<Uint8Array>;
}
export interface CliIo {
  readonly confirmationInput: ConfirmationInput;
  readonly stdout: CliOutputSink;
  readonly stderr: CliOutputSink;
  readonly cwd: AbsolutePath;
  readonly env: Readonly<Record<string, string | undefined>>;
}

export type RepositorySourceClass =
  | 'repository-config'
  | 'pack'
  | 'override'
  | 'actual-source'
  | 'checkout'
  | 'managed'
  | 'report'
  | 'journal'
  | 'recovery-evidence';
declare const repositoryReadBudgetBrand: unique symbol;
export interface RepositoryReadBudget {
  readonly [repositoryReadBudgetBrand]: true;
  readonly scopeId: string;
  claimEntry(
    sourceClass: RepositorySourceClass,
    nodeKind: NodeKind,
    encodedPathBytes: number,
    reportedBytes: number,
  ): void;
  progress(sourceClass: RepositorySourceClass, bytes: number): void;
  assertLive(): void;
}
export interface ReadOnlyRepositoryFilesystem {
  resolve(path: PortableRelativePath): Promise<ContainedPathRef>;
  inspectPath(ref: ContainedPathRef, budget: RepositoryReadBudget): Promise<InspectedPathState>;
  scanFile(
    ref: ContainedPathRef,
    expected: Extract<InspectedPathState, { readonly kind: 'file' }>,
    budget: RepositoryReadBudget,
    sink: AsyncByteSink,
  ): Promise<Extract<ObservedPathState, { readonly kind: 'file' }>>;
  readFileBounded(
    ref: ContainedPathRef,
    expected: Extract<InspectedPathState, { readonly kind: 'file' }>,
    budget: RepositoryReadBudget,
  ): Promise<{
    readonly bytes: Uint8Array;
    readonly observed: Extract<ObservedPathState, { readonly kind: 'file' }>;
  }>;
  readLink(
    ref: ContainedPathRef,
    expected: Extract<InspectedPathState, { readonly kind: 'link' }>,
    budget: RepositoryReadBudget,
  ): Promise<Extract<ObservedPathState, { readonly kind: 'link' }>>;
  listDirectory(
    ref: ContainedPathRef,
    expected: Extract<InspectedPathState, { readonly kind: 'directory' }>,
    budget: RepositoryReadBudget,
  ): Promise<readonly {
    readonly name: PortablePathSegment;
    readonly kind: NodeKind;
  }[]>;
}
export interface ReadOnlySourceContext {
  readonly filesystem: ReadOnlyRepositoryFilesystem;
  readonly readBudget: RepositoryReadBudget;
}
```

`RedactedSource.label` is `null` or a prevalidated logical package/resource ID of at most 256 UTF-8 bytes. It is never a path, URL, token, source fragment, or free-text message. JSON metadata is bounded before allocation: 16 MiB per file, depth 128, 1,000,000 tokens, 100,000 members/items in one container, 4 KiB per decoded string, and 256 bytes per number token. A breach emits `EVK_SECURITY_RESOURCE_LIMIT` without source bytes or absolute paths.

The exact Phase 1 package scripts are:

```json
{
  "build": "tsc --build tsconfig.json",
  "typecheck": "tsc --project tsconfig.json --noEmit --pretty false",
  "test:unit": "vitest run tests/unit tests/package tests/security",
  "test:integration": "vitest run tests/integration",
  "test": "pnpm run test:unit && pnpm run test:integration",
  "pack:check": "pnpm run build && node scripts/check-package-contents.mjs",
  "check": "pnpm run typecheck && pnpm run test && pnpm run pack:check"
}
```

The exact root script changes are:

```json
{
  "check:ai-tooling": "pnpm --filter @evk-soft/ai-tooling run check",
  "check": "pnpm run check:biome && pnpm run check:runtime && pnpm run check:ai-tooling"
}
```

## Mandatory RED/GREEN and Microstep Protocol

For every behavior packet, add only the literal test or fixture shown and run the exact focused command. If the planned module/export does not exist, the first run is only a structural RED: Vitest must discover the exact test file and fail solely on that missing module/export. Add the smallest typed stub satisfying the packet's declared interface; it throws the temporary working-tree-only sentinel formed by the adjacent fragments `EVK_INTERNAL_` and `NOT_IMPLEMENTED`. The transient stub source must contain the assembled sentinel as one contiguous ASCII literal so the artifact scanner can catch a forgotten stub, but this committed plan/test/policy must never contain that assembled token. Rerun immediately and require exit `1` with the named assertion failing for the stated missing behavior. Every packet statement that says RED because a module/export is absent abbreviates this mandatory structural-RED -> typed-stub -> named behavioral-RED sequence. Skipped/no tests, wrong filters, unrelated imports, configuration, network, or fixture discovery are invalid behavioral RED evidence. Remove the entire stub branch and sentinel, add only the named production branch, rerun the same command, and require exit `0` with the named test executed exactly once. When a step contains a literal case table, process one row at a time as four 2-5 minute actions: append that row, run and record its behavior-specific RED, add only the branch needed by that row using the packet's production contract, then rerun and record GREEN before appending the next row. Do not batch rows behind one unobserved implementation.

Every fixture helper named in a snippet is test-only and is created in the same first test step, not deferred to production work. `makeRepository` is local to `verify-phase-delta.spec.ts`; `runPackageCheck` is local to `package-contract.spec.ts`; `scanFixture` is local to `artifact-scan.spec.ts`; `validDocument` is the closed seven-name fixture map in `schema-registry.spec.ts`; `memoryDestination`, `sourceContext`, `sourceRoot`, `repositoryWriteSpy`, and `networkSpy` are local to `pack-build.spec.ts`; and `validateCorePackFixture` is local to `core-pack.spec.ts`. Each helper accepts exactly the fields visible at its call sites, uses only a newly created temporary root or in-memory injected port, exposes captured argv/environment/write/network logs, and registers cleanup in `afterEach`. A helper may not synthesize the assertion under test, touch the real checkout outside the declared read-only fixture, access the network, or hide a write. Production snippets may call only imported Node/library functions or production functions whose complete contract appears in the same packet; no implementer-defined production helper is implied.

### Task 1: Bootstrap the Isolated Harness and Phase-Delta Verifier (master 1.0)

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `packages/ai-tooling/package.json`
- Create: `packages/ai-tooling/tsconfig.json`
- Create: `packages/ai-tooling/vitest.config.ts`
- Create: `packages/ai-tooling/README.md`
- Create: `packages/ai-tooling/src/index.ts`
- Create: `packages/ai-tooling/src/cli.ts`
- Create: `packages/ai-tooling/scripts/verify-phase-delta.mjs`
- Create: `packages/ai-tooling/tests/unit/verify-phase-delta.spec.ts`

**Interfaces:**

- Consumes: the five committed manifest files; a caller-resolved no-link Git executable version 2.45.0 or later; full lowercase 40-hex base/candidate object IDs in commit mode.
- Produces: `verifyPhaseDelta(options: PhaseDeltaOptions): Promise<void>` and CLI `main(argv: readonly string[], io: CliIo): Promise<number>`.

```ts
export interface PhaseDeltaOptions {
  readonly phase: 1 | 2 | 3 | 4 | 5;
  readonly mode: 'worktree' | 'cached' | 'commit';
  readonly base?: string;
  readonly commit?: string;
}
```

#### Packet 1A: package discovery and exact runner

- [ ] **Step 1: create the literal package and runner files**

Create `packages/ai-tooling/package.json` with name `@evk-soft/ai-tooling`, version `0.1.0`, `private: true`, `type: module`, Node `>=24.0.0`, and only `typecheck` plus a focused `test:unit` script. Create this exact Vitest configuration:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.spec.ts'],
    passWithNoTests: false,
    retry: 0,
    pool: 'forks',
    maxWorkers: 1,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
```

Vitest 4 removed `test.poolOptions`; the pinned 4.1.10 ignores it and only prints a deprecation
notice, so the former `poolOptions.forks.singleFork` would silently not apply. `maxWorkers: 1` is the
supported replacement for serial execution. `isolate` deliberately keeps its default `true`: the
migration guide's literal `singleFork` equivalent also sets `isolate: false`, but Stage 1 tests create
real temporary repositories and assert containment, so per-file isolation is retained on purpose. Do
not reintroduce `poolOptions` or add `isolate: false`.

- [ ] **Step 2: install only the approved dependency graph**

Run: `pnpm install --lockfile-only`

Expected: exit `0`; only `package.json`, `packages/ai-tooling/package.json`, and `pnpm-lock.yaml` may reflect dependency/script changes permitted by the Phase 1 manifest.

- [ ] **Step 3: install without lifecycle scripts**

Run: `pnpm install --frozen-lockfile --ignore-scripts`

Expected: exit `0`; no Husky or package lifecycle script runs and `git status --short` contains only Phase 1 manifest paths.

- [ ] **Step 4: prove the exact runner version**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest --version`

Expected: exit `0`; stdout names Vitest `4.1.10`.

#### Packet 1B: fail closed on an unexpected deletion

- [ ] **Step 1: write the literal failing test**

Add this test body to `tests/unit/verify-phase-delta.spec.ts`; the local `makeRepository` helper in the same file creates a temporary repository, writes the supplied manifest, commits the baseline, applies the named index/worktree changes with argv-array Git calls, and returns its root plus frozen provider environment.

```ts
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
```

The fixture manifest is raw-byte sorted (`expected.txt` before `kept.txt`) because `parseManifest` in
Step 3 rejects an unsorted manifest before any delta comparison runs. Listing `kept.txt` first makes
this test fail with `manifest paths are duplicate or unsorted` instead of the deletion message, so the
order is load-bearing, not cosmetic. The scenario is unchanged: `kept.txt` is expected `M` but deleted.

- [ ] **Step 2: run the exact RED command**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/verify-phase-delta.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: exit `1`; Vitest names `rejects an unexpected deletion` and fails because `verifyPhaseDelta` does not exist. A missing test file or runner/filter error is invalid evidence.

- [ ] **Step 3: add the minimal complete parser/comparison implementation**

Implement the manifest decoder and comparison with this concrete logic; the production module defines every helper it calls:

```js
const LINE = /^(A|M) 100644 ([A-Za-z0-9._/-]+)$|^D - ([A-Za-z0-9._/-]+)$/u;

export function parseManifest(bytes) {
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
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
    if (Buffer.compare(Buffer.from(records[index - 1].path), Buffer.from(records[index].path)) >= 0) {
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
```

- [ ] **Step 4: rerun the exact GREEN command**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/verify-phase-delta.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; the named test passes and every captured Git spawn has `shell: false`.

#### Packet 1C: exhaustive verifier trust boundary

- [ ] **Step 1: add the literal closed matrix**

Add this executable matrix and an `it.each(VERIFIER_CASES)` test that asserts `ok` or the exact `message`:

```ts
const VERIFIER_CASES = [
  { name: 'extra untracked', manifest: ['M 100644 a.txt'], delta: ['M 100644 a.txt', 'A 100644 b.txt'], message: 'unexpected path: b.txt' },
  { name: 'missing expected', manifest: ['M 100644 a.txt', 'A 100644 b.txt'], delta: ['M 100644 a.txt'], message: 'missing path: b.txt' },
  { name: 'wrong status', manifest: ['A 100644 a.txt'], delta: ['M 100644 a.txt'], message: 'status or mode mismatch: a.txt' },
  { name: 'wrong mode', manifest: ['A 100644 a.txt'], delta: ['A 100755 a.txt'], message: 'status or mode mismatch: a.txt' },
  { name: 'type change', manifest: ['M 100644 a.txt'], delta: ['T 120000 a.txt'], message: 'unsupported delta status: T' },
  { name: 'conflict', manifest: ['M 100644 a.txt'], delta: ['U 100644 a.txt'], message: 'unsupported delta status: U' },
  { name: 'duplicate manifest', manifest: ['A 100644 a.txt', 'A 100644 a.txt'], delta: [], message: 'manifest paths are duplicate or unsorted' },
  { name: 'unsorted manifest', manifest: ['A 100644 b.txt', 'A 100644 a.txt'], delta: [], message: 'manifest paths are duplicate or unsorted' },
  { name: 'CRLF manifest', manifestBytes: new TextEncoder().encode('A 100644 a.txt\r\n'), delta: [], message: 'manifest contains CR' },
  { name: 'non-ASCII path', manifest: ['A 100644 café.txt'], delta: [], message: 'invalid manifest record' },
  { name: 'dot component', manifest: ['A 100644 a/../b.txt'], delta: [], message: 'invalid manifest path' },
] as const;
```

- [ ] **Step 2: run the verifier matrix for RED**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/verify-phase-delta.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: exit `1`; the first new named row fails because worktree/cached parsing does not yet reject its exact state.

- [ ] **Step 3: implement all three closed verifier modes**

Use only the frozen absolute Git file. Build the environment from an empty map; remove inherited Git routing/config/object/replace/alternate variables; set `GIT_CONFIG_NOSYSTEM=1`, private zero-byte `GIT_CONFIG_GLOBAL`, `GIT_ATTR_NOSYSTEM=1`, `GIT_OPTIONAL_LOCKS=0`, `GIT_NO_REPLACE_OBJECTS=1`, `GIT_NO_LAZY_FETCH=1`, and `GIT_LITERAL_PATHSPECS=1`. Every query passes `--no-replace-objects --no-lazy-fetch --literal-pathspecs`, private empty excludes/attributes, `core.fsmonitor=false`, `core.untrackedCache=false`, `--no-ext-diff`, `--no-textconv`, and `--no-renames` where accepted. Implement these exact mode rules:

```ts
const MODE_RULES = {
  worktree: { requireEmptyIndex: true, source: 'status --porcelain=v1 -z --untracked-files=all --ignore-submodules=all' },
  cached: { requireEmptyIndex: false, source: 'diff --cached --name-status --no-renames -z' },
  commit: { requireFullOids: true, requireExactlyOneLiteralParent: true, source: 'cat-file commit + exact tree diff' },
} as const;
```

In commit mode, strict-parse bounded raw commit objects, require exactly one parent header whose object ID equals the caller-bound approved base, compare the two exact tree IDs, and reject grafts, shallow metadata, replace refs, missing/promisor objects, merge/zero-parent/different-parent candidates, malformed headers, HEAD/ref swaps, and any use of `HEAD^` or `rev-list`. Bracket the frozen executable, repository anchors, common config, optional `config.worktree`, `info/exclude`, `info/attributes`, alternate-path absence, and the private three-file root by identity/digest/length before and after every spawn. Reject `include*`, `filter.*`, noncanonical `extensions.worktreeConfig`, alternates, link/reparse config/info files, provider swap, timeout, unverified termination, or cleanup uncertainty before trusting output.

- [ ] **Step 4: rerun the verifier matrix for GREEN**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/verify-phase-delta.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; worktree, cached, and one-parent commit success rows pass; every extra/missing/status/mode/manifest/admin-state/provider/object-race row fails with its closed redacted reason; no helper, filter, remote, shell, pager, editor, or external diff runs.

- [ ] **Step 5: document the bootstrap boundary**

Write `packages/ai-tooling/README.md` with package purpose, source-build/unpublished status, Node 24 floor, intended root/schema/package exports, and the explicit statement that project outputs and mutation commands do not exist yet. The bootstrap CLI exports only `main(argv, io)` and returns exit `2` after writing exactly `Uint8Array.of(65, 73, 32, 84, 111, 111, 108, 105, 110, 103, 32, 99, 111, 109, 109, 97, 110, 100, 32, 100, 105, 115, 112, 97, 116, 99, 104, 32, 105, 115, 32, 117, 110, 97, 118, 97, 105, 108, 97, 98, 108, 101, 32, 105, 110, 32, 116, 104, 101, 32, 80, 104, 97, 115, 101, 32, 49, 32, 98, 111, 111, 116, 115, 116, 114, 97, 112, 46, 10)` to the injected stderr sink and flushing it. The implementation and test may decode or assemble those exact bytes at runtime, but this plan must not contain the contiguous printable diagnostic because the later full-tree artifact scanner treats that bootstrap marker as forbidden input.

### Task 2: Add the Repository-Local State Boundary (master 1.1)

**Files:**

- Modify: `.gitignore`
- Create: `packages/ai-tooling/tests/integration/repository-ignore.spec.ts`
- Create: `packages/ai-tooling/tests/helpers/temp-repository.ts`

**Interfaces:**

- Consumes: the frozen Git-provider discipline from Task 1 and the real Phase 1 `.gitignore` bytes copied into a temporary repository.
- Produces: `createTempRepository(fixture): Promise<TempRepository>` and the exact human-owned `/.ai-tooling/` rule; no production CLI writer.

```ts
export interface TempGitResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}
export interface TempRepository {
  readonly root: AbsolutePath;
  git(...args: readonly string[]): Promise<TempGitResult>;
  dispose(): Promise<void>;
}
export function createTempRepository(
  fixture: { readonly copy: readonly string[] },
): Promise<TempRepository>;
```

- [ ] **Step 1: write the literal failing integration test**

```ts
it('ignores local state but not the repository lock', async () => {
  const repo = await createTempRepository({ copy: ['.gitignore'] });
  try {
    for (const path of [
      '.ai-tooling/state.json',
      '.ai-tooling/backups/probe',
      '.ai-tooling/run.lock',
      '.ai-tooling/reports/probe.json',
    ]) {
      const result = await repo.git('check-ignore', '-v', '--no-index', path);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/\.gitignore:.*:\/\.ai-tooling\//u);
    }
    expect(await repo.git('check-ignore', '-v', '--no-index', 'ai-tooling.lock.json')).toStrictEqual({
      exitCode: 1,
      stdout: '',
      stderr: '',
    });
  } finally {
    await repo.dispose();
  }
});
```

- [ ] **Step 2: run the exact RED command**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/repository-ignore.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: exit `1`; the named test fails because `.ai-tooling/state.json` is not ignored by the copied repository `.gitignore`.

- [ ] **Step 3: make the one permitted repository-config change**

Append exactly these two LF-terminated lines to root `.gitignore`:

```gitignore
# AI Tooling local state
/.ai-tooling/
```

The helper sets `GIT_CONFIG_NOSYSTEM=1`, points `GIT_CONFIG_GLOBAL` and `core.excludesFile` to explicit zero-byte temporary files, sets `GIT_NO_LAZY_FETCH=1`, and passes global `--no-lazy-fetch` when the frozen Git is 2.45.0 or later. It invokes Git with argv arrays and `shell: false`.

- [ ] **Step 4: run the exact GREEN command**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/repository-ignore.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; four probes cite only the temporary repository `.gitignore`, and the lock probe exits `1` with empty stdout/stderr.

- [ ] **Step 5: repeat the five probes at the real repository root**

Run each command separately:

```text
git check-ignore -v --no-index .ai-tooling/state.json
git check-ignore -v --no-index .ai-tooling/backups/probe
git check-ignore -v --no-index .ai-tooling/run.lock
git check-ignore -v --no-index .ai-tooling/reports/probe.json
git check-ignore -v --no-index ai-tooling.lock.json
```

Expected: the first four exit `0` and cite root `.gitignore`; the final command exits `1` and emits no path.

### Task 3: Establish Package, Export, Tarball, and Artifact Boundaries (master 1.2)

**Files:**

- Modify: `packages/ai-tooling/package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `packages/ai-tooling/README.md`
- Modify: `packages/ai-tooling/src/index.ts`
- Modify: `packages/ai-tooling/src/cli.ts`
- Create: `packages/ai-tooling/LICENSE`
- Create: `packages/ai-tooling/tests/package/package-contract.spec.ts`
- Create: `packages/ai-tooling/scripts/check-package-contents.mjs`
- Create: `packages/ai-tooling/scripts/check-stage1-artifacts.mjs`
- Create: `packages/ai-tooling/tests/security/artifact-scan.spec.ts`
- Create: `packages/ai-tooling/tests/fixtures/artifact-scan/vectors.json`
- Create: `packages/ai-tooling/tests/fixtures/stage1-artifact-policy.json`
- Create: `configs/ai/package.json`
- Create: `configs/ai/LICENSE`

**Interfaces:**

- Consumes: root `LICENSE`, exact workspace-pinned dependency graph, Phase 1 manifest bytes, frozen Git/provider and private staging-root primitives from Task 1.
- Produces: public root constant `TOOLING_VERSION`, exact root/schema/package exports, `ai-tooling` binary, source-built tarball inspection, and fail-closed `--phase N --tree|--cached` artifact scanning.

The scanner freezes these script-internal interfaces in Phase 1; later phases may extend transport without changing their shapes:

```ts
export interface ArtifactManifestEntry {
  readonly path: PortableRelativePath;
  readonly mode: '100644' | '100755';
  readonly byteLength: number;
  readonly chunks: AsyncIterable<Uint8Array>;
  readonly expectedDigest: Sha256Hex | null;
}
export interface ArtifactScanLimits {
  readonly maxEntries: 100000;
  readonly maxTreeBytes: 16777216;
  readonly maxBlobBytes: 16777216;
  readonly maxAggregateBytes: 268435456;
  readonly noProgressTimeoutMs: 30000;
  readonly wholeScanTimeoutMs: 300000;
}
export interface ArtifactScanPolicy {
  readonly credentialPrefixes: readonly string[];
  readonly forbiddenLiteralTokens: readonly string[];
  readonly allowedExecutablePaths: readonly PortableRelativePath[];
  readonly requiredLicenseDigests: readonly Sha256Hex[];
}
export interface ArtifactFinding {
  readonly path: PortableRelativePath;
  readonly findingClass:
    | 'credential-pattern'
    | 'private-marker'
    | 'absolute-path'
    | 'undeclared-entry'
    | 'unexpected-executable'
    | 'missing-license'
    | 'schema-byte-mismatch'
    | 'unregistered-generated-output'
    | 'dependency-license-conflict';
}
export interface ArtifactScanResult {
  readonly findings: readonly ArtifactFinding[];
  readonly contentDigest: Sha256Hex;
}
declare const artifactScanBudgetBrand: unique symbol;
export interface ArtifactScanBudget {
  readonly [artifactScanBudgetBrand]: true;
  claimTreeBytes(bytes: number): void;
  claimBlob(bytes: number): void;
  progress(bytes: number): void;
  assertLive(): void;
}
export function scanArtifactManifest(
  manifest: readonly ArtifactManifestEntry[],
  policy: ArtifactScanPolicy,
  budget: ArtifactScanBudget,
): Promise<ArtifactScanResult>;
export function createStage1ArtifactPolicy(): ArtifactScanPolicy;
export function createArtifactScanBudget(now: () => bigint): ArtifactScanBudget;
```

#### Packet 3A: exact package surface

- [ ] **Step 1: write the literal failing contract test**

```ts
it('exports only the public root and schemas', async () => {
  const manifest = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'));
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
```

- [ ] **Step 2: run the exact RED command**

Run: `pnpm --filter @evk-soft/ai-tooling run build && pnpm --filter @evk-soft/ai-tooling exec vitest run tests/package/package-contract.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: exit `1`; `exports only the public root and schemas` fails on the incomplete bootstrap manifest.

- [ ] **Step 3: write the exact package metadata and public constant**

Set exact runtime dependencies `ajv: 8.20.0`, `json-canonicalize: 2.0.0`, and `jsonc-parser: 3.3.1`; exact dev dependencies `vitest: 4.1.10`, `@vitest/coverage-v8: 4.1.10`, and `@types/node: 24.13.3`; exact Phase 1 scripts from this plan; `license: MIT`; `publishConfig.access: public`; and only the exports/files/bin asserted by the test. Implement:

```ts
export const TOOLING_VERSION = '0.1.0' as const;
```

Create `configs/ai/package.json` as public `@evk-soft/ai-pack-core@0.1.0`, ESM, MIT, with `files` exactly `['pack.json', 'rules', 'skills', 'README.md', 'LICENSE']`, no binary, dependency, lifecycle script, or code export. Copy root `LICENSE` bytes unchanged to both package roots.

- [ ] **Step 4: update and reinstall the lock graph**

Run: `pnpm install --lockfile-only`

Expected: exit `0`; the tooling importer records the exact direct versions.

- [ ] **Step 5: prove the installed graph without lifecycle execution**

Run: `pnpm install --frozen-lockfile --ignore-scripts`

Expected: exit `0`; `pnpm --filter @evk-soft/ai-tooling list --depth 0` resolves every exact version and no lifecycle marker exists.

- [ ] **Step 6: rerun the exact GREEN command**

Run: `pnpm --filter @evk-soft/ai-tooling run build && pnpm --filter @evk-soft/ai-tooling exec vitest run tests/package/package-contract.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; the exact exports/bin/files/license/runtime and both byte-identical license copies pass.

#### Packet 3B: source-only tarball boundary

- [ ] **Step 1: write the literal stale-dist rejection fixture**

```ts
it('packs a fresh isolated build and never working dist', async () => {
  await writeFile('dist/native/win32-x64/ai-tooling-win32-helper.exe', 'STALE-NATIVE');
  await writeFile('dist/stale.js', 'STALE-PORTABLE');
  const result = await runPackageCheck();
  expect(result.entries).not.toContain('package/dist/stale.js');
  expect(result.entries).not.toContain('package/dist/native/win32-x64/ai-tooling-win32-helper.exe');
  expect(result.entries).toStrictEqual([...result.entries].sort());
});
```

- [ ] **Step 2: run the package checker for RED**

Run: `pnpm --filter @evk-soft/ai-tooling run pack:check`

Expected RED: exit `1`; the named package test fails because `check-package-contents.mjs` is absent.

- [ ] **Step 3: implement the private staging and bounded tar parser**

The script creates an exclusive owner-only staging root; compiles TypeScript directly into its `dist`; copies only `package.json`, `README.md`, `LICENSE`, and source schema bytes; creates one contained empty `packed` destination; resolves the already installed pnpm JavaScript entry; launches `process.execPath` with exact argv `--ignore-scripts --ignore-pnpmfile pack --json --pack-destination` followed by the validated absolute `packed` child path, `shell: false`, no stdin, staging `cwd`, a 300-second monotonic deadline, a 64 MiB stdout JSON limit, and a 64 KiB stderr ring. The environment starts empty and contains only private config/cache/temp values, `npm_config_ignore_scripts=true`, `npm_config_ignore_pnpmfile=true`, and fixed POSIX locale/PATH values where required; Windows deliberately receives no caller `SystemRoot`, `WINDIR`, `PATH`, or `PATHEXT` in Phase 1.

The gzip/tar parser enforces: 64 MiB compressed; one gzip member; valid flags/header CRC/data CRC/ISIZE; 4 KiB optional header; exact EOF; 256 MiB inflated; 100,000 entries; 16 MiB per regular file; 4 KiB per path; 16 MiB aggregate path bytes; 100,000 per-file PAX records; 16 KiB per PAX record; and 16 MiB aggregate PAX bytes. It accepts regular files, zero-size directories, and unique canonical per-file PAX `path`/`size`; it rejects links, sparse/device/FIFO/unknown types, global/GNU headers, unsafe or duplicate paths, chained overrides, invalid octal/base-256, nonzero padding, absent end blocks, trailing data, and every size/count one-over case.

- [ ] **Step 4: rerun the package checker for GREEN**

Run: `pnpm --filter @evk-soft/ai-tooling run pack:check`

Expected GREEN: exit `0`; the tarball comes only from the fresh private build, contains the declared entries once, carries exact schemas/licenses, and contains no working `dist` sentinel.

#### Packet 3C: phase-scoped artifact scan

- [ ] **Step 1: write the literal failing scanner test**

```ts
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
    69, 86, 75, 95, 73, 78, 84, 69, 82, 78, 65, 76, 95, 78,
    79, 84, 95, 73, 77, 80, 76, 69, 77, 69, 78, 84, 69, 68,
  ]);
  async function* chunks(): AsyncIterable<Uint8Array> {
    yield body.subarray(0, 7);
    yield body.subarray(7, 19);
    yield body.subarray(19);
  }
  const result = await scanArtifactManifest(
    [{
      path: 'packages/ai-tooling/src/json/strict-json.ts' as PortableRelativePath,
      mode: '100644',
      byteLength: body.byteLength,
      chunks: chunks(),
      expectedDigest: null,
    }],
    createStage1ArtifactPolicy(),
    createArtifactScanBudget(() => 0n),
  );
  expect(result.findings).toStrictEqual([{
    path: 'packages/ai-tooling/src/json/strict-json.ts',
    findingClass: 'private-marker',
  }]);
});
```

- [ ] **Step 2: run the scanner test for RED**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/security/artifact-scan.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: after the mandatory structural RED/stub cycle, exit `1`; `rejects a forgotten transient implementation stub across stream chunks` is discovered and returns no `private-marker` finding because streaming forbidden-literal matching is absent.

- [ ] **Step 3: implement the closed scanner modes**

`--tree` identity-brackets each manifest-listed regular worktree file and streams its bytes once. `--cached` freezes the index identity, obtains exact object IDs/modes through the approved provider, requires Git 2.45.0+, passes global `--no-lazy-fetch`, streams staged blobs only, and never reads worktree bytes. Cap either selected tree at 100,000 entries and 16 MiB aggregate encoded path/tree bytes, each blob at 16 MiB, and aggregate streamed blob bytes at 256 MiB. A `cat-file` batch has a 30-second no-progress deadline inside one 300-second monotonic whole-scan deadline; every other Git process has a 30-second whole-process deadline. Exact-limit and one-over-first/last fixtures must close iterators/children promptly and allocate no whole over-limit body. Strict-parse `stage1-artifact-policy.json`; reject absent/unlisted/unreadable paths, credentials, synthetic private markers, absolute machine paths, executable/package entries, missing license notices, and dependency-license conflicts. Emit only relative path and finding class. Add staged-hostile/clean-worktree and staged-clean/hostile-worktree rows so source selection is executable.

Create the built-in forgotten-stub policy token only at runtime from `Uint8Array.from([69, 86, 75, 95, 73, 78, 84, 69, 82, 78, 65, 76, 95, 78, 79, 84, 95, 73, 77, 80, 76, 69, 77, 69, 78, 84, 69, 68])` and fatal UTF-8 decoding. Neither the JSON policy, source test, scanner source, this plan, nor a diagnostic may contain the decoded printable token contiguously. Feed every policy token into this complete per-entry streaming matcher; one match maps only to `private-marker`:

```js
class PrivateMarkerStream {
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
```

Instantiate one matcher per policy token per manifest entry, call `push` on every awaited chunk, and continue counting/hashing after a match so limits and expected digest still fail closed. Add all split positions, exact body, prefix-only, altered-first-byte, duplicate-body, LF suffix, and literal backslash-`n` suffix rows one at a time; no matched bytes enter output.

- [ ] **Step 4: rerun the scanner test for GREEN**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/security/artifact-scan.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; tree/cached modes inspect only their selected byte source; the forgotten-stub test reports exactly one redacted `private-marker`; every split/prefix/alteration row passes; and diagnostics contain no matched bytes or absolute paths.

### Task 4: Implement Stable Diagnostics, Strict I-JSON, and Terminal-Safe Output (master 1.3)

**Files:**

- Create: `packages/ai-tooling/src/model/types.ts`
- Create: `packages/ai-tooling/src/diagnostics/codes.ts`
- Create: `packages/ai-tooling/src/diagnostics/error.ts`
- Create: `packages/ai-tooling/src/diagnostics/json.ts`
- Create: `packages/ai-tooling/src/diagnostics/terminal-safe.ts`
- Create: `packages/ai-tooling/src/json/strict-json.ts`
- Create: `packages/ai-tooling/tests/unit/strict-json.spec.ts`
- Create: `packages/ai-tooling/tests/unit/terminal-safe.spec.ts`
- Create: `packages/ai-tooling/tests/fixtures/json/valid.json`
- Create: `packages/ai-tooling/tests/fixtures/json/duplicate-key.json`
- Create: `packages/ai-tooling/tests/fixtures/json/comment.json`
- Create: `packages/ai-tooling/tests/fixtures/json/trailing-comma.json`
- Create: `packages/ai-tooling/tests/fixtures/json/lone-surrogate.json`
- Create: `packages/ai-tooling/tests/fixtures/json/non-roundtrip-integer.json`
- Create: `packages/ai-tooling/tests/fixtures/json/non-roundtrip-number.json`

**Interfaces:**

- Consumes: `JsonValue`, `RedactedSource`, and the Phase 1 resource limits defined in this packet.
- Produces: closed `DiagnosticCode`, `ToolingError`, branded `StrictJsonDocument`, `parseStrictJson`, `streamHumanTerminalSafeUtf8`, `streamJsonTerminalSafeString`, and `renderMachineDiagnostic`.

#### Packet 4A: stable diagnostic registry

- [ ] **Step 1: write the exact registry test**

```ts
it('exposes only the Stage 1 diagnostic registry', () => {
  expect(DIAGNOSTIC_CODES).toStrictEqual({
    EVK_CONFIG_CAPABILITY_UNAVAILABLE: true,
    EVK_CONFIG_JSON_INVALID: true,
    EVK_CONFIG_REQUIRES_UPDATE: true,
    EVK_LOCK_NONCANONICAL: true,
    EVK_PACK_CAPABILITY_UNAVAILABLE: true,
    EVK_PACK_SOURCE_INVALID: true,
    EVK_OUTPUT_MODIFIED: true,
    EVK_OUTPUT_SHADOWED: true,
    EVK_OUTPUT_FORMATTER_REJECTED: true,
    EVK_OUTPUT_FORMATTER_CONFLICT: true,
    EVK_RECOVERY_EVIDENCE_MISSING: true,
    EVK_SECURITY_EXECUTABLE_CONSENT_REQUIRED: true,
    EVK_SECURITY_RESOURCE_LIMIT: true,
    EVK_SECURITY_OUTPUT_ENCODING_INVALID: true,
    EVK_SECURITY_FORMATTER_PROVIDER_INVALID: true,
    EVK_SECURITY_FORMATTER_PROVIDER_UNAVAILABLE: true,
    EVK_SECURITY_FORMATTER_EXECUTION_FAILED: true,
    EVK_SECURITY_FORMATTER_CHECKOUT_CHANGED: true,
    EVK_SECURITY_FORMATTER_CHECKOUT_UNVERIFIED: true,
  });
});
```

- [ ] **Step 2: run the registry test for RED**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/strict-json.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: exit `1`; the named registry assertion fails because `DIAGNOSTIC_CODES` is absent.

- [ ] **Step 3: implement the exact `as const` object and error class**

Use the literal object asserted by the test and this class:

```ts
export type DiagnosticCode = keyof typeof DIAGNOSTIC_CODES;

export class ToolingError extends Error {
  constructor(
    readonly diagnostic: Readonly<{
      code: DiagnosticCode;
      message: string;
      reason: string | null;
      fields: Readonly<Record<string, JsonValue>>;
      recoveryActions: readonly string[];
    }>,
  ) {
    super(diagnostic.message);
    this.name = 'ToolingError';
  }
}
```

No registry member is synthesized dynamically. Encoding-invalid reasons are exactly `malformed-utf8` and `non-scalar-value`; source/parser/schema/containment/recovery detail remains in closed fields and reasons.

- [ ] **Step 4: rerun the registry test for GREEN**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/strict-json.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; the registry has the exact nineteen members and the machine diagnostic contains every field without source body, token, credential, or absolute path.

#### Packet 4B: strict JSON before schema validation

- [ ] **Step 1: write the literal duplicate-key test and fixture bytes**

`tests/fixtures/json/duplicate-key.json` contains exactly `{"name":1,"\\u006eame":2}` plus one LF. Add:

```ts
it('rejects duplicate decoded keys before schema validation', () => {
  const bytes = new TextEncoder().encode('{"name":1,"\\u006eame":2}');
  expect(() => parseStrictJson(bytes, { kind: 'fixture', label: 'duplicate-key' })).toThrowError(
    expect.objectContaining({
      diagnostic: expect.objectContaining({ code: 'EVK_CONFIG_JSON_INVALID' }),
    }),
  );
  expect(schemaValidateSpy).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: run the strict parser for RED**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/strict-json.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: exit `1`; Vitest names `rejects duplicate decoded keys before schema validation` and the parser accepts the duplicate or is absent.

- [ ] **Step 3: implement lexical duplicate and decimal identity checks**

Use `jsonc-parser.visit` with `disallowComments: true` and `allowTrailingComma: false`. Reject a UTF-8 BOM before visiting; maintain one decoded-property `Set` for each object frame; collect every parser error; never admit a recovery result. Preserve number token byte offsets with an explicit UTF-16-to-UTF-8 map. Use this complete decimal canonicalizer for source-token versus `JSON.stringify(parsed)` equality:

```ts
function decimalIdentity(raw: string): string {
  const match = /^(-?)(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/u.exec(raw);
  if (!match) throw new Error('invalid JSON number token');
  const negative = match[1] === '-';
  const integer = match[2];
  const fraction = match[3] ?? '';
  let exponent = Number.parseInt(match[4] ?? '0', 10) - fraction.length;
  let digits = `${integer}${fraction}`.replace(/^0+/u, '');
  if (digits === '') return '0e0';
  while (digits.endsWith('0')) {
    digits = digits.slice(0, -1);
    exponent += 1;
  }
  return `${negative ? '-' : ''}${digits}e${exponent}`;
}

function assertNumberRoundTrip(token: string, parsed: number): void {
  if (!Number.isFinite(parsed)) throw new Error('number is not finite');
  if (decimalIdentity(token) !== decimalIdentity(JSON.stringify(parsed))) {
    throw new Error('number does not round-trip through IEEE-754');
  }
}
```

Walk the parsed value and reject lone surrogate code units in keys and strings. Accept `1.0`, `0.1`, and exactly representable `9007199254740992`; reject `9007199254740993`, `333333333.33333329`, finite-to-zero underflow, and overflow. `Number.isSafeInteger` is never the acceptance rule.

- [ ] **Step 4: rerun the strict parser for GREEN**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/strict-json.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; BOM, comments, trailing commas, decoded duplicates, invalid UTF-8, lone surrogates, non-roundtrip numbers, empty input, and trailing tokens fail before schema validation with byte offsets; valid I-JSON returns only a branded document.

- [ ] **Step 5: add compile-time brand and generic rejection fixtures**

Add `@ts-expect-error` calls proving `parseStrictJson<ConfigV1>(...)` is impossible, `StrictJsonDocument` cannot be directly constructed, and parser output is not assignable to `ConfigV1` without schema validation.

- [ ] **Step 6: typecheck the boundary**

Run: `pnpm --filter @evk-soft/ai-tooling run typecheck`

Expected GREEN: exit `0`; every `@ts-expect-error` is exercised and no unvalidated domain type crosses the parser boundary.

#### Packet 4C: injective terminal-safe streaming

- [ ] **Step 1: write the literal control/injectivity test**

```ts
it('never emits a raw terminal control', async () => {
  const logical = 'ESC:\u001b]52;c;payload\u0007 bidi:\u202e literal:\\x1B';
  const human = await encodeHuman(logical);
  const json = await encodeJsonString(logical);
  expect(human).not.toMatch(/[\u0000-\u001f\u007f-\u009f\u2028\u2029\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/u);
  expect(human).toContain('\\x1B]52;c;payload\\x07');
  expect(human).toContain('\\u{202E}');
  expect(JSON.parse(json)).toBe(logical);
  expect(json).not.toContain('\u202e');
});
```

- [ ] **Step 2: run the terminal encoder for RED**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/terminal-safe.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: exit `1`; `never emits a raw terminal control` fails because the encoder is absent or emits a hazardous scalar.

- [ ] **Step 3: implement the exact scalar encoders**

Human mode emits literal backslash as `\\`, quote as `\"`, every C0 including LF plus DEL/C1 as uppercase `\xHH`, and U+2028/U+2029 plus U+061C, U+200E, U+200F, U+202A-U+202E, and U+2066-U+2069 as uppercase `\u{HHHH}`. JSON mode preserves the logical scalar while rendering quote/backslash with JSON escapes, C0/DEL/C1 as uppercase `\u00XX`, and listed separators/bidi controls as uppercase `\uXXXX`. Implement an incremental fatal `TextDecoder`, await each sink write, count encoded bytes before writing, and reject malformed/split-incomplete UTF-8 or a one-over limit before confirmation/output continuation.

- [ ] **Step 4: rerun the terminal encoder for GREEN**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/terminal-safe.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; ESC/CSI/OSC-52, CR, tab, backspace, BEL, LF, DEL/C1, U+2028/U+2029, every bidi control, split code points, literal escape lookalikes, slow sinks, and write/flush failures satisfy injectivity, round-trip, byte-limit, and zero-follow-on-output assertions.

### Task 5: Define Byte-Stable Schemas and the Offline Registry (master 1.4)

**Files:**

- Create: `packages/ai-tooling/schemas/config.schema.json`
- Create: `packages/ai-tooling/schemas/pack.schema.json`
- Create: `packages/ai-tooling/schemas/rule.schema.json`
- Create: `packages/ai-tooling/schemas/skill.schema.json`
- Create: `packages/ai-tooling/schemas/override.schema.json`
- Create: `packages/ai-tooling/schemas/lock.schema.json`
- Create: `packages/ai-tooling/schemas/state.schema.json`
- Create: `packages/ai-tooling/src/json/schema-registry.ts`
- Create: `packages/ai-tooling/src/config/types.ts`
- Create: `packages/ai-tooling/src/pack/types.ts`
- Create: `packages/ai-tooling/tests/unit/schema-registry.spec.ts`
- Create: `packages/ai-tooling/tests/package/schema-bytes.spec.ts`
- Create: `packages/ai-tooling/tests/fixtures/schemas/vectors.json`
- Create: `packages/ai-tooling/tests/fixtures/schemas/unresolved-ref.schema.json`

**Interfaces:**

- Consumes: branded `StrictJsonDocument`, strict I-JSON, `JsonValue`, and exact schema source bytes.
- Produces: handwritten closed `ConfigV1`, `PackV1`, `RuleV1`, `SkillV1`, `OverrideV1`, `LockV1`, `StateV1`, `SchemaTypeMap`, and `OfflineSchemaRegistry`.

```ts
export interface SchemaTypeMap {
  readonly config: ConfigV1;
  readonly pack: PackV1;
  readonly rule: RuleV1;
  readonly skill: SkillV1;
  readonly override: OverrideV1;
  readonly lock: LockV1;
  readonly state: StateV1;
}
export type SchemaName = keyof SchemaTypeMap;
export interface OfflineSchemaRegistry {
  validate<N extends SchemaName>(name: N, document: StrictJsonDocument): SchemaTypeMap[N];
  schemaBytes<N extends SchemaName>(name: N): Uint8Array;
}
```

#### Packet 5A: exact schema identities and closed domain

- [ ] **Step 1: write the literal identity matrix**

```ts
const SCHEMA_FILES = [
  'config.schema.json',
  'pack.schema.json',
  'rule.schema.json',
  'skill.schema.json',
  'override.schema.json',
  'lock.schema.json',
  'state.schema.json',
] as const;

it.each(SCHEMA_FILES)('gives %s the exact public identity', async (file) => {
  const schema = JSON.parse(await readFile(new URL(`../../schemas/${file}`, import.meta.url), 'utf8'));
  expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
  expect(schema.$id).toBe(
    `https://raw.githubusercontent.com/evk-soft/devkit/refs/tags/ai-tooling-v0.1.0/packages/ai-tooling/schemas/${file}`,
  );
});
```

- [ ] **Step 2: run the schema identity test for RED**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/schema-registry.spec.ts tests/package/schema-bytes.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: exit `1`; the first exact public-identity assertion fails because the seven schemas do not exist.

- [ ] **Step 3: author the seven complete version-1 schemas and matching types**

Every closed object uses `additionalProperties: false`; every union branch is closed; every optional config property has a literal default. Config recognizes exactly local/npm/git source kinds, managed/preview output, ordered platform IDs, ordered override resource-directory paths, fully defaulted hooks, and plugin profile/recommendations. Pack/rule/skill reserve capability and asset declarations while instruction-only availability is enforced later. Override supports only `extend`, `replace`, and `disable` with stable target/base digest. Lock records semantic configuration/selection digests, frozen pack digests, and per-leaf ownership. State freezes the complete version-1 run-lock, journal directions/terminal outcomes, forward/rollback/retained staging, backup, recovery handoff/archive, and report definitions; Phase 2-5 may not modify its schema, `StateV1`, registry-map, or assignability-test bytes.

Override paths must lexically be strict descendants of literal `ai/overrides`; reject the root itself, absolute/wrong-case paths, `.git`, `configs/ai`, output roots, dot/parent/empty/backslash/drive/UNC/percent components, and exact duplicates before any provider or filesystem access. Portable Unicode equivalence remains Phase 2 work.

- [ ] **Step 4: rerun schema identity tests for GREEN**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/schema-registry.spec.ts tests/package/schema-bytes.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; all seven identities, relative `$ref` values, closed branches/defaults, positive/negative typed vectors, and source/package byte equality assertions pass.

#### Packet 5B: cold-cache offline registry

- [ ] **Step 1: write the literal no-network registry test**

```ts
it('compiles every root with network disabled', async () => {
  const network = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network forbidden'));
  const registry = createOfflineSchemaRegistry();
  for (const name of ['config', 'pack', 'rule', 'skill', 'override', 'lock', 'state'] as const) {
    expect(() => registry.validate(name, validDocument(name))).not.toThrow();
  }
  expect(network).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: run the offline registry for RED**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/schema-registry.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: exit `1`; `compiles every root with network disabled` fails because the registry is absent.

- [ ] **Step 3: implement the exact Ajv construction**

```ts
import Ajv2020 from 'ajv/dist/2020.js';

const ajv = new Ajv2020({
  strict: true,
  allErrors: true,
  validateFormats: false,
  useDefaults: false,
  coerceTypes: false,
  removeAdditional: false,
});
```

Load the seven strict-parsed source schema objects under their exact `$id` values before compiling any root. Do not define `loadSchema`. Use only Ajv's bundled draft 2020-12 metaschema/vocabularies plus the preloaded product registry. Sort mapped errors by instance path, schema path, then keyword; expose no schema/source body. An unresolved `$id`, metaschema, or vocabulary fails locally without HTTP, HTTPS, DNS, proxy, registry, or cache access.

- [ ] **Step 4: rerun the offline registry for GREEN**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/schema-registry.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; all seven roots compile and validate from a cold application cache; all monkeypatched network APIs remain untouched; the unresolved-ref fixture fails locally.

- [ ] **Step 5: prove typed mapping and bare URL rejection**

Add compile-time assertions that `validate('lock', document)` is `LockV1`, is not `ConfigV1`, and accepts no caller-selected generic. Add the config source `https://example.invalid/pack.md` and require schema rejection before provider, recursive source inspection, or acquisition-capable calls.

- [ ] **Step 6: run type and schema closure**

Run: `pnpm --filter @evk-soft/ai-tooling run typecheck && pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/schema-registry.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; mapped return types, forged names/brands, cross-branch negatives, and the bare Markdown URL boundary all pass.

### Task 6: Implement Configuration Projection, Git URL v1, JCS, and Digests (master 1.5)

**Files:**

- Create: `packages/ai-tooling/src/config/git-url-v1.ts`
- Create: `packages/ai-tooling/src/config/projection.ts`
- Create: `packages/ai-tooling/src/json/jcs.ts`
- Create: `packages/ai-tooling/tests/unit/git-url-v1.spec.ts`
- Create: `packages/ai-tooling/tests/unit/configuration-digest.spec.ts`
- Create: `packages/ai-tooling/tests/fixtures/config-digest/vectors.json`
- Create: `packages/ai-tooling/tests/fixtures/rfc8785/vectors.json`

**Interfaces:**

- Consumes: schema-validated `ConfigV1`, `JsonValue`, strict I-JSON, and exact ordered/defaulted config fields.
- Produces: `normalizeGitUrlV1`, `configurationProjectionV1`, `packSelectionProjectionV1`, `jcsBytes`, and `sha256Jcs`.

```ts
export function normalizeGitUrlV1(input: string): string;
export function configurationProjectionV1(config: ConfigV1): JsonObject;
export function packSelectionProjectionV1(config: ConfigV1): JsonObject;
export function jcsBytes(value: JsonValue): Uint8Array;
export function sha256Jcs(value: JsonValue): Sha256Hex;
```

#### Packet 6A: runtime-independent ASCII Git URL grammar

- [ ] **Step 1: write the literal rejection/equality vectors**

```ts
const INVALID_GIT_URLS = [
  'http://example.com/a',
  'https://user@example.com/a',
  'https://example.com/a?x=1',
  'https://example.com/a#x',
  'https://éxample.com/a',
  'https://%65xample.com/a',
  'https://[::1]/a',
  'https://127.0.0.1/a',
  'https://example.com:0443/a',
  'https://example.com/a\\b',
  ' https://example.com/a',
] as const;

it('rejects Unicode host without runtime URL parsing', () => {
  expect(() => normalizeGitUrlV1('https://éxample.com/repo.git')).toThrowError(/non-ASCII host/u);
});

it.each(INVALID_GIT_URLS)('rejects invalid Git URL %s', (value) => {
  expect(() => normalizeGitUrlV1(value)).toThrowError();
});

it.each([
  ['HTTPS://EXAMPLE.COM:443/a/./b/../repo.git', 'https://example.com/a/repo.git'],
  ['https://example.com/%7erepo.git', 'https://example.com/~repo.git'],
  ['https://example.com/%2frepo.git', 'https://example.com/%2Frepo.git'],
] as const)('normalizes %s', (input, output) => {
  expect(normalizeGitUrlV1(input)).toBe(output);
});
```

- [ ] **Step 2: run Git URL tests for RED**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/git-url-v1.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: exit `1`; the Unicode-host test fails because `normalizeGitUrlV1` is absent.

- [ ] **Step 3: implement the closed lexer and transformations**

Parse ASCII bytes directly: require literal `https` after ASCII case-folding, `//`, no userinfo/query/fragment, one valid ASCII DNS hostname with nonempty labels, no numeric-only host or bracketed IP, and optional canonical decimal port 1-65535 with no leading zero; omit port 443. Parse path percent triplets without implicit escaping: decode only RFC 3986 unreserved bytes, uppercase all retained triplets, and remove RFC 3986 dot segments. Preserve revision spelling and accepted Unicode only where the schema permits it. Do not trim, base-resolve, repair backslashes, call `URL`, `URLSearchParams`, IDNA/UTS-46, or Unicode normalization.

- [ ] **Step 4: rerun Git URL tests for GREEN**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/git-url-v1.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; every invalid reason and equivalent spelling has the exact deterministic result with no runtime URL/IDNA call.

#### Packet 6B: full config projection and RFC 8785 bytes

- [ ] **Step 1: write the literal JCS wrapper test**

```ts
it('emits exact RFC 8785 UTF-8 bytes without Unicode normalization', () => {
  expect(new TextDecoder().decode(jcsBytes({ z: 1, a: 'é', n: 0.000001 }))).toBe(
    '{"a":"é","n":0.000001,"z":1}',
  );
  expect(new TextDecoder().decode(jcsBytes({ value: 'e\u0301' }))).toBe('{"value":"é"}');
});
```

- [ ] **Step 2: run projection/JCS tests for RED**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/configuration-digest.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: exit `1`; the exact-byte JCS test or first full-projection vector fails because its implementation is absent.

- [ ] **Step 3: implement the exact JCS wrapper**

```ts
import { canonicalizeEx } from 'json-canonicalize';

export function jcsBytes(value: JsonValue): Uint8Array {
  const text = canonicalizeEx(value, {
    allowCircular: false,
    filterUndefined: false,
    undefinedInArrayToNull: false,
  });
  if (typeof text !== 'string') throw new Error('JCS serializer returned no text');
  return new TextEncoder().encode(text);
}
```

Hash only these UTF-8 bytes with `createHash('sha256')`. JCS never renders human-readable generated JSON and never normalizes Unicode.

- [ ] **Step 4: implement complete field-by-field projections**

The configuration projection contains `schemaVersion`; ordered packs with every source-specific selector/range/revision, integrity policy, resolution flag, and literal default; defaulted `outputMode`; ordered canonical platforms and override paths; fully defaulted `gitHooks`; and defaulted plugin profile plus ordered recommendation IDs. `$schema` is the only excluded property. The pack-selection projection contains only the normalized selection identity used to distinguish `EVK_CONFIG_REQUIRES_UPDATE` later. Preserve ordered arrays, reject duplicates, materialize every literal default, and preserve accepted string code points.

- [ ] **Step 5: rerun projection/JCS tests for GREEN**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/git-url-v1.spec.ts tests/unit/configuration-digest.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; whitespace/member order/equivalent escapes/explicit defaults/equivalent Git URLs produce equal digests; every semantic projected-field or ordered-array change differs; invalid path/ID/duplicate/I-JSON/URL inputs reject.

- [ ] **Step 6: prove locale-independent repeatability**

Run the same focused command once with `LANG=C`/`LC_ALL=C` and once with the test process configured for `tr-TR`; capture vector bytes.

Expected GREEN: both runs exit `0` and produce byte-identical JCS and digest fixtures.

### Task 7: Lock Generated JSON and Pack Build Bytes (master 1.6)

**Files:**

- Create: `packages/ai-tooling/src/json/render-json.ts`
- Create: `packages/ai-tooling/src/pack/build.ts`
- Create: `packages/ai-tooling/src/commands/pack.ts`
- Create: `packages/ai-tooling/tests/unit/render-json.spec.ts`
- Create: `packages/ai-tooling/tests/integration/pack-build.spec.ts`
- Create: `packages/ai-tooling/tests/fixtures/render-json/vectors.json`
- Create: `packages/ai-tooling/tests/fixtures/render-json/expected.json`
- Modify: `packages/ai-tooling/src/cli.ts`

**Interfaces:**

- Consumes: validated `JsonValue`, `ValidatedPack`, injected `ReadOnlySourceContext`, and explicit trusted `PackBuildDestination`.
- Produces: `renderGeneratedJson`, `validatePack`, `buildPack`, and typed `PackBuildResult`; no repository mutation command.

```ts
export interface PackBuildDestination {
  readonly root: AbsolutePath;
  createDirectoryExclusive(path: PortableRelativePath): Promise<void>;
  writeFileExclusive(path: PortableRelativePath, bytes: Uint8Array): Promise<void>;
}
export interface PackBuildResult {
  readonly pack: ValidatedPack;
  readonly destinationRoot: AbsolutePath;
  readonly files: readonly {
    readonly path: PortableRelativePath;
    readonly byteLength: number;
    readonly digest: Sha256Hex;
  }[];
}
export function renderGeneratedJson(value: JsonValue, keyOrder: readonly string[]): Uint8Array;
export function validatePack(
  context: ReadOnlySourceContext,
  sourceRoot: ContainedPathRef,
): Promise<ValidatedPack>;
export function buildPack(
  context: ReadOnlySourceContext,
  sourceRoot: ContainedPathRef,
  destination: PackBuildDestination,
): Promise<PackBuildResult>;
```

#### Packet 7A: renderer bytes

- [ ] **Step 1: write the literal renderer test**

```ts
it('renders one final LF without formatter', () => {
  const bytes = renderGeneratedJson(
    { schemaVersion: 1, long: 'x'.repeat(120), nested: { b: true, a: null } },
    ['schemaVersion', 'long', 'nested', 'a', 'b'],
  );
  expect(new TextDecoder().decode(bytes)).toBe(
    '{\n  "schemaVersion": 1,\n  "long": "' + 'x'.repeat(120) + '",\n  "nested": {\n    "a": null,\n    "b": true\n  }\n}\n',
  );
});
```

- [ ] **Step 2: run renderer tests for RED**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/render-json.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: exit `1`; the named test fails because `renderGeneratedJson` is absent.

- [ ] **Step 3: implement schema-order rendering**

Traverse only already validated `JsonValue`; for every object, emit keys in the supplied schema order and reject a key missing from that order; use two spaces, LF, JSON scalar escaping, no BOM, and one final LF. Never call Biome or JCS and never fold by line width.

- [ ] **Step 4: rerun renderer tests for GREEN**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/render-json.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; nested metadata, long strings, Unicode, empty arrays/objects, and lock records match exact bytes.

#### Packet 7B: pure pack validation/build

- [ ] **Step 1: write the literal two-build test**

```ts
it('builds two byte-identical trees without repository writes', async () => {
  const first = memoryDestination();
  const second = memoryDestination();
  const left = await buildPack(sourceContext(), sourceRoot(), first);
  const right = await buildPack(sourceContext(), sourceRoot(), second);
  expect([...first.files]).toStrictEqual([...second.files]);
  expect(left.files).toStrictEqual(right.files);
  expect(repositoryWriteSpy).not.toHaveBeenCalled();
  expect(networkSpy).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: run pack build tests for RED**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/pack-build.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: exit `1`; the named two-build test fails because `buildPack` is absent.

- [ ] **Step 3: implement the injected pure functions**

Read only through `context.filesystem` and the exact shared `context.readBudget`; accept only a gateway-created `ContainedPathRef`; strict-parse and offline-validate metadata; reject undeclared or executable assets before destination writes; rewrite only non-schema metadata `$schema` to the version-tagged URL; copy schema and Markdown instruction bytes unchanged; render generated metadata with `renderGeneratedJson`; and write only through the explicit destination's exclusive methods. A raw `AbsolutePath`, second filesystem/budget, or repository destination is not representable.

- [ ] **Step 4: rerun pack build tests for GREEN**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/render-json.spec.ts tests/integration/pack-build.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; two independent destinations are byte-identical, schema/instruction bytes are unchanged, executable/undeclared assets reject, and all network/repository-write spies remain untouched.

- [ ] **Step 5: expose only Phase 1 command behavior**

Wire parsing for `pack validate` and `pack build`, but return the stage-neutral capability-unavailable result before real repository access because Phase 2 has not supplied `ReadOnlyRepositoryContext`. Every other product command retains the fixed Phase 1 bootstrap exit `2` response.

- [ ] **Step 6: run CLI boundary tests**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/pack-build.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; dependency-injected calls work, production CLI source access stays unavailable, and no mutation/adapters are reachable.

### Task 8: Author and Independently Review the Minimal Public Pack (master 1.7)

**Files:**

- Modify: `configs/ai/README.md`
- Create: `configs/ai/pack.json`
- Create: `configs/ai/rules/evk-grounding/rule.json`
- Create: `configs/ai/rules/evk-grounding/instructions.md`
- Create: `configs/ai/skills/evk-plan/skill.json`
- Create: `configs/ai/skills/evk-plan/instructions.md`
- Create: `packages/ai-tooling/tests/integration/core-pack.spec.ts`
- Create: `docs/ai-tooling/EXTENDING-PACKS.md`
- Create: `docs/ai-tooling/SECURITY.md`
- Modify: `docs/system-overview/ai-tooling.md`

**Interfaces:**

- Consumes: Phase 1 pack/resource schemas, offline registry, deterministic pack validator/builder, and artifact scan.
- Produces: stable resource IDs `evk-soft/rules/grounding` and `evk-soft/skills/plan`, display names `evk-grounding` and `evk-plan`, each requiring only `instructions.markdown`.

#### Packet 8A: exact two-resource source pack

- [ ] **Step 1: write the literal failing integration test**

```ts
it('ships exactly grounding and plan resources', async () => {
  const { pack, assetInventory } = await validateCorePackFixture();
  expect(pack.resources.map(({ id, kind }) => ({ id, kind }))).toStrictEqual([
    { id: 'evk-soft/rules/grounding', kind: 'rule' },
    { id: 'evk-soft/skills/plan', kind: 'skill' },
  ]);
  expect(pack.resources.every((resource) =>
    resource.metadata.requiredCapabilities?.every((value: string) => value === 'instructions.markdown'),
  )).toBe(true);
  expect(assetInventory.filter((entry) => entry.securitySignals.length > 0)).toStrictEqual([]);
});
```

- [ ] **Step 2: run the core-pack test for RED**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/core-pack.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: exit `1`; `ships exactly grounding and plan resources` fails because canonical pack metadata is absent.

- [ ] **Step 3: write the exact public grounding instructions**

Create `configs/ai/rules/evk-grounding/instructions.md` with these LF bytes:

```md
# Repository grounding

Before changing a repository, read its applicable instructions and inspect the current files and version-control state.

Base conclusions on observed code, configuration, tests, and command output. Distinguish verified evidence from assumptions and identify material behavior that remains unverified.

Preserve user changes and unrelated work. Keep edits within the authorized scope, then run focused checks that can prove the claimed result.
```

- [ ] **Step 4: write the exact public planning instructions**

Create `configs/ai/skills/evk-plan/instructions.md` with these LF bytes:

```md
# Plan work

Read the approved requirements and repository rules before planning changes.

Map every task to exact files and define the interfaces each task consumes and produces. Break behavior into small test-first steps with literal commands, expected failures, minimal implementation, and expected passing evidence.

State scope exclusions, safety constraints, owner gates, staging boundaries, and stop points explicitly. Finish the plan and request approval before implementation begins.
```

- [ ] **Step 5: write exact closed metadata**

Author `pack.json`, `rule.json`, and `skill.json` as strict schema-valid JSON with schema version `1`, the stable IDs/display names above, deterministic source order rule then skill, one Markdown instruction path per resource, and `requiredCapabilities: ['instructions.markdown']`. Declare every one of `package.json`, `pack.json`, `README.md`, `LICENSE`, both metadata files, and both instruction files; declare no script, hook, MCP server, connector, executable, browser capability, binary, plugin field, or undeclared asset.

- [ ] **Step 6: rerun the core-pack test for GREEN**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/core-pack.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; exactly one rule and one skill validate, all eight package/source files are accounted for, all capabilities are instruction-only, and normalized contributor metadata matches the exact snapshot.

#### Packet 8B: durable documentation and clean-room review

- [ ] **Step 1: add exact durable headings and contracts**

`configs/ai/README.md` documents publisher purpose, canonical edit rules, instruction-only boundary, source-vs-generated warning, and the two stable resource IDs. `docs/ai-tooling/EXTENDING-PACKS.md` documents strict standard JSON, exact versioned schema IDs, relative `$ref`, stable IDs, ordered precedence vocabulary, overrides as future-resolved committed inputs, and no remote acquisition. `docs/ai-tooling/SECURITY.md` documents no private-byte copying, instruction-only trust, fail-closed artifact scanning, ignored local state, unignored lock, no real user configuration in tests, and no publication claim. `docs/system-overview/ai-tooling.md` records Phase 1 package/schema/parser/JCS/render/build boundaries without claiming adapters or mutation.

- [ ] **Step 2: run the documentation byte gate**

Run: `git diff --check -- configs/ai/README.md docs/ai-tooling/EXTENDING-PACKS.md docs/ai-tooling/SECURITY.md docs/system-overview/ai-tooling.md`

Expected GREEN: exit `0`; all edited documentation uses LF and has no trailing whitespace.

- [ ] **Step 3: prove durable docs do not reverse-link delivery artifacts**

Run: `rg -n "2026-08-02-ai-tooling-stage-1|2026-08-01-ai-tooling-stage-1-safe-core-design" configs/ai/README.md docs/ai-tooling/EXTENDING-PACKS.md docs/ai-tooling/SECURITY.md docs/system-overview/ai-tooling.md`

Expected GREEN: exit `1` with empty stdout.

- [ ] **Step 4: perform independent content/provenance review**

The reviewer reads the six canonical resource files—`pack.json`, both resource metadata files, both instruction files, and `configs/ai/README.md`—and records: public wording only; no devkit-specific command or branch policy; no credential/private organization/project/prototype phrase; no executable/plugin metadata; exact stable IDs; exact SHA-256 for each file; and a clear PASS/FAIL conclusion.

- [ ] **Step 5: run pack, package, and artifact closure**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/core-pack.spec.ts tests/integration/pack-build.spec.ts tests/package/package-contract.spec.ts tests/security/artifact-scan.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; both packages, both licenses, exact pack resources, source-only tarball, and clean-room artifact policy pass.

### Task 9: Phase 1 Final Gate, Exact Staging, Sole Commit, and Owner Stop

**Files:**

- Modify/Create: every path in the closed Phase 1 manifest and no other path.

**Interfaces:**

- Consumes: all GREEN Task 1-8 outputs and the committed Phase 1 manifest.
- Produces: one Phase 1 candidate commit and evidence; it produces no Phase 2 authorization.

- [ ] **Step 1: run the complete pre-format gate**

Run each command separately and require exit `0`:

```text
pnpm --filter @evk-soft/ai-tooling run typecheck
pnpm --filter @evk-soft/ai-tooling run test:unit
pnpm --filter @evk-soft/ai-tooling run test:integration
pnpm --filter @evk-soft/ai-tooling run build
pnpm --filter @evk-soft/ai-tooling run pack:check
node packages/ai-tooling/scripts/check-stage1-artifacts.mjs --phase 1 --tree
pnpm check
git diff --check
```

Expected GREEN: every test file is discovered; cold-cache schemas, duplicate/I-JSON, terminal-safe, Git URL/JCS, generated bytes, package tarballs, core pack, ignore probes, verifier, and artifact scan pass.

- [ ] **Step 2: re-run the security/contract regressions**

Run the five ignore probes, cold-cache/no-network schema suite, strict JSON/I-JSON suite, RFC 8785 and Git URL vectors, package schema-byte-copy fixtures, stale-working-dist fixture, artifact source-selection fixtures, and independent core-content review.

Expected GREEN: all contract families pass; tarballs contain no undeclared/lifecycle/private/absolute-path/license-conflict bytes.

- [ ] **Step 3: prove the index is empty before the hook-equivalent formatter**

Run: `git diff --cached --quiet`

Expected GREEN: exit `0`.

- [ ] **Step 4: run only the hook's formatter command**

Run: `pnpm -s exec biome check --write .`

Expected GREEN: exit `0`; do not run the hook's `git add -A`.

- [ ] **Step 5: rerun the complete gate after formatter writes**

Run the exact Step 1 command block again.

Expected GREEN: every command exits `0`; `git status --porcelain=v1 -z --untracked-files=all --ignore-submodules=all` contains only exact Phase 1 manifest status/path/type records.

- [ ] **Step 6: stage only exact manifest paths**

Run exactly:

```text
git add -- .gitignore
git add -- configs/ai/LICENSE
git add -- configs/ai/README.md
git add -- configs/ai/pack.json
git add -- configs/ai/package.json
git add -- configs/ai/rules/evk-grounding/instructions.md
git add -- configs/ai/rules/evk-grounding/rule.json
git add -- configs/ai/skills/evk-plan/instructions.md
git add -- configs/ai/skills/evk-plan/skill.json
git add -- docs/ai-tooling/EXTENDING-PACKS.md
git add -- docs/ai-tooling/SECURITY.md
git add -- docs/system-overview/ai-tooling.md
git add -- package.json
git add -- packages/ai-tooling/LICENSE
git add -- packages/ai-tooling/README.md
git add -- packages/ai-tooling/package.json
git add -- packages/ai-tooling/schemas/config.schema.json
git add -- packages/ai-tooling/schemas/lock.schema.json
git add -- packages/ai-tooling/schemas/override.schema.json
git add -- packages/ai-tooling/schemas/pack.schema.json
git add -- packages/ai-tooling/schemas/rule.schema.json
git add -- packages/ai-tooling/schemas/skill.schema.json
git add -- packages/ai-tooling/schemas/state.schema.json
git add -- packages/ai-tooling/scripts/check-package-contents.mjs
git add -- packages/ai-tooling/scripts/check-stage1-artifacts.mjs
git add -- packages/ai-tooling/scripts/verify-phase-delta.mjs
git add -- packages/ai-tooling/src/cli.ts
git add -- packages/ai-tooling/src/commands/pack.ts
git add -- packages/ai-tooling/src/config/git-url-v1.ts
git add -- packages/ai-tooling/src/config/projection.ts
git add -- packages/ai-tooling/src/config/types.ts
git add -- packages/ai-tooling/src/diagnostics/codes.ts
git add -- packages/ai-tooling/src/diagnostics/error.ts
git add -- packages/ai-tooling/src/diagnostics/json.ts
git add -- packages/ai-tooling/src/diagnostics/terminal-safe.ts
git add -- packages/ai-tooling/src/index.ts
git add -- packages/ai-tooling/src/json/jcs.ts
git add -- packages/ai-tooling/src/json/render-json.ts
git add -- packages/ai-tooling/src/json/schema-registry.ts
git add -- packages/ai-tooling/src/json/strict-json.ts
git add -- packages/ai-tooling/src/model/types.ts
git add -- packages/ai-tooling/src/pack/build.ts
git add -- packages/ai-tooling/src/pack/types.ts
git add -- packages/ai-tooling/tests/fixtures/artifact-scan/vectors.json
git add -- packages/ai-tooling/tests/fixtures/config-digest/vectors.json
git add -- packages/ai-tooling/tests/fixtures/json/comment.json
git add -- packages/ai-tooling/tests/fixtures/json/duplicate-key.json
git add -- packages/ai-tooling/tests/fixtures/json/lone-surrogate.json
git add -- packages/ai-tooling/tests/fixtures/json/non-roundtrip-integer.json
git add -- packages/ai-tooling/tests/fixtures/json/non-roundtrip-number.json
git add -- packages/ai-tooling/tests/fixtures/json/trailing-comma.json
git add -- packages/ai-tooling/tests/fixtures/json/valid.json
git add -- packages/ai-tooling/tests/fixtures/render-json/expected.json
git add -- packages/ai-tooling/tests/fixtures/render-json/vectors.json
git add -- packages/ai-tooling/tests/fixtures/rfc8785/vectors.json
git add -- packages/ai-tooling/tests/fixtures/schemas/unresolved-ref.schema.json
git add -- packages/ai-tooling/tests/fixtures/schemas/vectors.json
git add -- packages/ai-tooling/tests/fixtures/stage1-artifact-policy.json
git add -- packages/ai-tooling/tests/helpers/temp-repository.ts
git add -- packages/ai-tooling/tests/integration/core-pack.spec.ts
git add -- packages/ai-tooling/tests/integration/pack-build.spec.ts
git add -- packages/ai-tooling/tests/integration/repository-ignore.spec.ts
git add -- packages/ai-tooling/tests/package/package-contract.spec.ts
git add -- packages/ai-tooling/tests/package/schema-bytes.spec.ts
git add -- packages/ai-tooling/tests/security/artifact-scan.spec.ts
git add -- packages/ai-tooling/tests/unit/configuration-digest.spec.ts
git add -- packages/ai-tooling/tests/unit/git-url-v1.spec.ts
git add -- packages/ai-tooling/tests/unit/render-json.spec.ts
git add -- packages/ai-tooling/tests/unit/schema-registry.spec.ts
git add -- packages/ai-tooling/tests/unit/strict-json.spec.ts
git add -- packages/ai-tooling/tests/unit/terminal-safe.spec.ts
git add -- packages/ai-tooling/tests/unit/verify-phase-delta.spec.ts
git add -- packages/ai-tooling/tsconfig.json
git add -- packages/ai-tooling/vitest.config.ts
git add -- pnpm-lock.yaml
```

Expected GREEN: every named path exists with the manifest's expected Git status and mode; nothing else is staged.

- [ ] **Step 7: verify cached bytes and the direct Phase 1 manifest comparison**

Run exactly:

```text
git diff --cached --check
git diff --cached --name-status --no-renames -z
git ls-files --stage
node packages/ai-tooling/scripts/check-stage1-artifacts.mjs --phase 1 --cached
```

Expected GREEN: diff check and artifact scan exit `0`. Because the verifier did not exist in the approved base, the owner independently compares the literal NUL-delimited status/path set plus index modes with the committed Phase 1 manifest under the frozen Git 2.45+ isolation contract. The worktree verifier may run as supplemental evidence but is not the Phase 1 trust root.

- [ ] **Step 8: revalidate the immutable base and create the sole Phase 1 commit**

Run in the same PowerShell session:

```powershell
if ((git rev-parse HEAD).Trim() -cne $approvedBaseSha) { throw 'HEAD moved before the Phase 1 commit' }
git commit --no-verify -m "feat(ai): establish Stage 1 contracts"
$candidateSha = (git rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0 -or $candidateSha -cnotmatch '^[0-9a-f]{40}$') {
  throw 'Phase 1 candidate is not one full lowercase SHA-1'
}
if ($candidateSha -ceq $approvedBaseSha) { throw 'Phase 1 commit did not advance HEAD' }
$candidateSha
```

Expected GREEN: exactly one commit is created; `$candidateSha` is the new full lowercase object ID and differs from `$approvedBaseSha`. `--no-verify` bypasses only the already-reproduced formatter plus unsafe broad staging; it bypasses no other check.

- [ ] **Step 9: verify the exact one-parent committed delta, then rerun committed bytes**

Run in the same PowerShell session:

```powershell
if ((git rev-parse HEAD).Trim() -cne $candidateSha) { throw 'HEAD does not equal the Phase 1 candidate' }
node packages/ai-tooling/scripts/verify-phase-delta.mjs --phase 1 --base $approvedBaseSha --commit $candidateSha
if ($LASTEXITCODE -ne 0) { throw 'Phase 1 committed-delta verification failed' }
git branch --show-current
git rev-parse HEAD
git status --short --branch
git log --oneline main..HEAD
```

Then rerun the complete Step 1 pre-format gate and the committed-tree artifact scan; require a clean worktree. The independent pre-commit NUL manifest/index comparison remains the Phase 1 trust root because this verifier was introduced by the candidate itself; the post-commit verifier is supplemental defense-in-depth evidence.

Expected GREEN: all commands pass against committed bytes and the raw commit has exactly one parent equal to the approved baseline.

- [ ] **Step 10: report and stop**

Report the exact candidate SHA, baseline SHA, full staged path/mode comparison, checks/test counts, package tarball hashes, six canonical content hashes, clean-room review result, and any platform-limited evidence. Stop. Do not start Phase 2 until the owner approves this exact Phase 1 commit.
