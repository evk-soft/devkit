# AI Tooling Stage 1 Phase 2: Pure Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the mutation-free Stage 1 resolution engine: pinned Unicode portable paths, frozen read-only Git/index proof, exact tracked-local `configs/ai` loading, integrity and override resolution, declaration-independent instruction-only enforcement, and a deterministic adapter-neutral candidate/diff with measurable bounds.

**Architecture:** One read-only repository context owns a frozen Git provider, containment-aware filesystem, and one monotonic command budget. The pure pipeline strict-loads the Phase 1 config, rejects unavailable source/lifecycle capabilities, proves and hashes the exact tracked local pack, loads contained committed overrides, resolves one effective catalog, inventories actual assets independently of declarations, negotiates instruction-only capabilities, calls an injected adapter-neutral renderer, and returns a deterministic candidate plus proposed diff without a write-capable port.

**Tech Stack:** Node.js 24 or later, pnpm 11.20.0 workspace, TypeScript 6.0.3 ESM, Vitest 4.1.10, Phase 1 Ajv/jsonc-parser/json-canonicalize contracts, `@unicode/unicode-17.0.0` 1.6.17 as a development-only cross-check, vendored Unicode 17.0.0 normative data, Git 2.36.0 or later for closed runtime reads and Git 2.45.0 or later for approved-base verifier/object modes, SHA-256 and RFC 8785 JCS, one internal Win32 C++ identity helper built with MSVC, and Node's `performance`, `v8`, and `--expose-gc` APIs for the standalone resolver budget.

## Global Constraints

- **Status:** Awaiting owner approval. This plan does not authorize implementation.
- Start only after the owner approves the exact Phase 1 commit. This file and Phase 1 approval do not authorize Phase 2 implementation by themselves.
- Implement only approved Stage 1 Phase 2. Do not add project adapters, project output rendering, ownership locks, mutation, recovery, formatter execution, hooks, plugins, remote acquisition, cache, preview activation, publication, or umbrella Stages 2-5.
- Use a clean isolated worktree based on the owner-approved Phase 1 commit. Do not use `git stash`; preserve unrelated owner files.
- Produce exactly one Phase 2 implementation commit. No intermediate commit is permitted. Stop after reporting the exact candidate SHA/evidence.
- Treat the Phase 1 schemas, `StateV1`, strict JSON/JCS/rendering, diagnostic registry, artifact scanner, package parser, and phase-delta verifier as approved-base bytes. The Phase 2 manifest does not permit modifying the verifier or any schema.
- Run only the approved-base `packages/ai-tooling/scripts/verify-phase-delta.mjs`; first require `git diff --exit-code HEAD -- packages/ai-tooling/scripts/verify-phase-delta.mjs`.
- Stage 1 accepts only the exact tracked repository-relative `configs/ai` identity. npm, Git, URL, outside, untracked, link/reparse, workspace alias, identity mismatch, and preview inputs fail before acquisition, cache, or rendering.
- All production resolution remains read-only. Every fixture wraps the pipeline in a filesystem whose create/write/rename/delete methods throw and verifies an empty write log on success and failure.
- Unicode/path identity is OS-independent and locale-independent: `NFC(Default_Case_Folding(NFC(component)))` from pinned Unicode 17 tables; runtime ICU normalization/casing and locale operations are forbidden.
- Runtime Git is a closed command capability with fixed argv, isolated environment/config, frozen executable/anchors/admin-state, bounded NUL-delimited streaming, no shell, no filters/helpers/network/lazy fetch, and no caller-provided command/pathspec/config bytes.
- Only these native support tuples may claim Phase 2 identity behavior: `linux-x64`, `darwin-arm64`, and `win32-x64`. Every other tuple fails before native operation with `EVK_CONFIG_CAPABILITY_UNAVAILABLE` reason `unsupported-native-platform`.
- The one network exception is the separately authorized first retrieval of five exact Unicode 17 URLs. The verified source manifest, checked-in vendored bytes, generator, runtime, tests, and all engine commands are offline.
- Every behavioral packet uses literal failing fixture/test code, the exact focused command, a behavior-specific RED, minimal production code, and the same command for GREEN. A skipped/no-tests/config/import/network failure is invalid evidence.
- Durable documentation contains no reverse link to this packet, the master delivery plan, or the child design specification.

---

## Phase Entry Snapshot

- [ ] **Step 1: bind the exact owner-approved Phase 1 base in the PowerShell session used for this phase**

Run these commands in one PowerShell session and retain `$approvedBaseSha` through the final committed-delta gate:

```powershell
$approvedBaseSha = (git rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0 -or $approvedBaseSha -cnotmatch '^[0-9a-f]{40}$') {
  throw 'owner-approved Phase 1 base is not one full lowercase SHA-1'
}
git branch --show-current
git rev-parse HEAD
git status --short --branch
git log --oneline main..HEAD
git diff --exit-code HEAD -- packages/ai-tooling/scripts/verify-phase-delta.mjs
pnpm install --frozen-lockfile --ignore-scripts
if ($LASTEXITCODE -ne 0) { throw 'Phase 2 entry snapshot failed' }
git status --short --branch
```

Expected GREEN: every command exits `0`; `git rev-parse HEAD` equals `$approvedBaseSha`; the value is one full lowercase 40-hex object ID; the owner-approved Phase 1 tree and verifier are byte-clean; install executes no lifecycle script; and the final status is identical to the initial status. Stop instead of editing if any assertion fails.

## Phase Inputs and Closed File Set

The approved Phase 1 commit supplied by the owner is the sole implementation base. The approved design has provenance approval commit `2eb8e7e90991f73bde27fb62277670ca9646e9e4`; the sibling master and phase packets are committed together in the same owner-approved plan-bundle commit and have no fabricated earlier standalone SHA. Those artifacts are provenance; all Phase 2 behavior and gates needed for execution are repeated here.

The committed `docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-2.txt` is the exact staging authority:

```text
M 100644 docs/ai-tooling/EXTENDING-PACKS.md
M 100644 docs/ai-tooling/SECURITY.md
M 100644 docs/system-overview/ai-tooling.md
A 100644 packages/ai-tooling/native/win32-helper/CMakeLists.txt
A 100644 packages/ai-tooling/native/win32-helper/main.cc
A 100644 packages/ai-tooling/native/win32-helper/protocol.h
M 100644 packages/ai-tooling/package.json
A 100644 packages/ai-tooling/scripts/build-native.mjs
A 100644 packages/ai-tooling/scripts/fetch-unicode-data.mjs
A 100644 packages/ai-tooling/scripts/generate-unicode-case-fold.mjs
M 100644 packages/ai-tooling/src/cli.ts
M 100644 packages/ai-tooling/src/commands/pack.ts
A 100644 packages/ai-tooling/src/config/load-config.ts
A 100644 packages/ai-tooling/src/fs/read-only-repository-filesystem.ts
A 100644 packages/ai-tooling/src/git/discovery.ts
A 100644 packages/ai-tooling/src/git/index.ts
A 100644 packages/ai-tooling/src/git/provider.ts
A 100644 packages/ai-tooling/src/native/win32-helper.ts
A 100644 packages/ai-tooling/src/pack/assets.ts
A 100644 packages/ai-tooling/src/pack/integrity.ts
A 100644 packages/ai-tooling/src/pack/load-local.ts
A 100644 packages/ai-tooling/src/path/lexical.ts
A 100644 packages/ai-tooling/src/path/portable-key.ts
A 100644 packages/ai-tooling/src/path/unicode-case-fold-17.ts
A 100644 packages/ai-tooling/src/path/unicode-nfc-17.ts
A 100644 packages/ai-tooling/src/performance/resolver-budget.ts
A 100644 packages/ai-tooling/src/repository/context.ts
A 100644 packages/ai-tooling/src/resolve/candidate.ts
A 100644 packages/ai-tooling/src/resolve/capabilities.ts
A 100644 packages/ai-tooling/src/resolve/catalog.ts
A 100644 packages/ai-tooling/src/resolve/diff.ts
A 100644 packages/ai-tooling/src/resolve/graph.ts
A 100644 packages/ai-tooling/src/resolve/overrides.ts
A 100644 packages/ai-tooling/src/resolve/pipeline.ts
A 100644 packages/ai-tooling/tests/fixtures/capabilities/vectors.json
A 100644 packages/ai-tooling/tests/fixtures/config-sources/vectors.json
A 100644 packages/ai-tooling/tests/fixtures/fake-git/provider.mjs
A 100644 packages/ai-tooling/tests/fixtures/fake-git/swapped-provider.mjs
A 100644 packages/ai-tooling/tests/fixtures/overrides/vectors.json
A 100644 packages/ai-tooling/tests/fixtures/unicode-case-fold-v17.json
A 100644 packages/ai-tooling/tests/fixtures/unicode-sources/invalid.json
A 100644 packages/ai-tooling/tests/helpers/no-write-filesystem.ts
A 100644 packages/ai-tooling/tests/integration/git-index.spec.ts
A 100644 packages/ai-tooling/tests/integration/local-pack-source.spec.ts
A 100644 packages/ai-tooling/tests/integration/pure-pipeline.spec.ts
A 100644 packages/ai-tooling/tests/native/win32-helper.native.spec.ts
M 100644 packages/ai-tooling/tests/package/package-contract.spec.ts
A 100644 packages/ai-tooling/tests/package/unicode-table.spec.ts
A 100644 packages/ai-tooling/tests/performance/resolver-budget.spec.ts
A 100644 packages/ai-tooling/tests/unit/candidate.spec.ts
A 100644 packages/ai-tooling/tests/unit/capabilities.spec.ts
A 100644 packages/ai-tooling/tests/unit/catalog.spec.ts
A 100644 packages/ai-tooling/tests/unit/git-discovery.spec.ts
A 100644 packages/ai-tooling/tests/unit/git-provider.spec.ts
A 100644 packages/ai-tooling/tests/unit/overrides.spec.ts
A 100644 packages/ai-tooling/tests/unit/portable-key.spec.ts
A 100644 packages/ai-tooling/tests/unit/source-capability.spec.ts
A 100644 packages/ai-tooling/tests/unit/unicode-sources.spec.ts
A 100644 packages/ai-tooling/tests/unit/win32-protocol.spec.ts
A 100644 packages/ai-tooling/vendor/unicode-17/CaseFolding.txt
A 100644 packages/ai-tooling/vendor/unicode-17/CompositionExclusions.txt
A 100644 packages/ai-tooling/vendor/unicode-17/LICENSE.md
A 100644 packages/ai-tooling/vendor/unicode-17/NormalizationTest.txt
A 100644 packages/ai-tooling/vendor/unicode-17/SOURCES.json
A 100644 packages/ai-tooling/vendor/unicode-17/SOURCES.schema.json
A 100644 packages/ai-tooling/vendor/unicode-17/UnicodeData.txt
M 100644 pnpm-lock.yaml
```

No path outside that set may change, be staged, or enter the Phase 2 commit.

## Shared Phase 2 Contracts

### Immutable Phase 1 value and containment types

Phase 2 consumes these Phase 1 exports unchanged. They are repeated here so the packet is executable without another delivery document:

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

export type NodeKind = 'file' | 'directory' | 'link' | 'other';
export type ObjectLocatorIdentity<K extends NodeKind = NodeKind> =
  | { readonly os: 'posix'; readonly nodeKind: K; readonly dev: bigint; readonly ino: bigint }
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
export type ValidatedOverride =
  | {
      readonly path: PortableRelativePath;
      readonly mode: 'extend' | 'replace';
      readonly target: ResourceId;
      readonly expectedBaseDigest: Sha256Hex;
      readonly metadataPatch: Readonly<JsonObject>;
      readonly instructions: Uint8Array | null;
      readonly digest: Sha256Hex;
    }
  | {
      readonly path: PortableRelativePath;
      readonly mode: 'disable';
      readonly target: ResourceId;
      readonly expectedBaseDigest: Sha256Hex;
      readonly digest: Sha256Hex;
    };
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
      readonly mode: ValidatedOverride['mode'];
      readonly target: ResourceId;
      readonly digest: Sha256Hex;
    };
export type AssetObservation =
  | {
      readonly path: PortableRelativePath;
      readonly fsKind: 'file';
      readonly indexMode: string | null;
      readonly filesystemExecutable: boolean | null;
      readonly declaredKind: 'metadata.json' | 'instructions.markdown' | null;
      readonly byteLength: number;
      readonly digest: Sha256Hex;
      readonly securitySignals: readonly (
        | 'binary-content'
        | 'executable-extension'
        | 'executable-mode'
        | 'hook'
        | 'mcp-server'
        | 'connector'
        | 'browser-capability'
        | 'shebang'
      )[];
    }
  | {
      readonly path: PortableRelativePath;
      readonly fsKind: 'link' | 'directory' | 'other' | 'missing' | 'conflicted';
      readonly indexMode: string | null;
    };
export interface ActualAssetInventory {
  readonly entries: readonly AssetObservation[];
}
export interface AsyncByteSink {
  write(chunk: Uint8Array): Promise<void>;
  end(): Promise<void>;
}
export interface ProjectDiff {
  readonly entries: readonly {
    readonly path: PortableRelativePath;
    readonly state: 'create' | 'replace' | 'delete' | 'unchanged';
    readonly beforeDigest: Sha256Hex | null;
    readonly afterDigest: Sha256Hex | null;
  }[];
}
```

### Read-only context and one monotonic budget

```ts
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
    nodeKind: 'file' | 'directory' | 'link' | 'other',
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
    readonly kind: 'file' | 'directory' | 'link' | 'other';
  }[]>;
}
export interface ReadOnlySourceContext {
  readonly filesystem: ReadOnlyRepositoryFilesystem;
  readonly readBudget: RepositoryReadBudget;
}
export interface ReadOnlyRepositoryContext extends ReadOnlySourceContext {
  readonly git: FrozenGitProvider;
  readonly index: GitIndex;
}
export interface ReadOnlyProjectContext extends ReadOnlyRepositoryContext {
  readonly configPath: PortableRelativePath;
}
```

One command owns one opaque budget. Production loaders cannot construct or replace it. Phase 2 uses: repository-config 16 entries/16 MiB per file/64 MiB aggregate/64 KiB paths; pack and actual-source 100,000 entries/16 MiB per file/512 MiB aggregate/16 MiB paths; override 100,000 entries/16 MiB per file/64 MiB aggregate/16 MiB paths. Every path is at most 4 KiB, walk depth is 64, each inventory has a 30-second no-progress deadline inside one 300-second monotonic whole-inventory deadline. Reject reported one-over size, including sparse files, before body allocation; stream with awaited backpressure, exact length/hash, and post-read identity verification.

### Pure engine values

```ts
export interface PackFile {
  readonly path: PortableRelativePath;
  readonly bytes: Uint8Array;
  readonly mode: '100644';
}
export interface ResolvedLocalPack {
  readonly root: PortableRelativePath;
  readonly pack: ValidatedPack;
  readonly files: readonly PackFile[];
  readonly integrityDigest: Sha256Hex;
}
export interface EffectiveResource {
  readonly id: ResourceId;
  readonly kind: 'rule' | 'skill';
  readonly metadata: Readonly<JsonObject>;
  readonly instructions: Uint8Array;
  readonly contributors: readonly Contributor[];
  readonly effectiveDigest: Sha256Hex;
}
export interface CandidateLeaf {
  readonly path: PortableRelativePath;
  readonly bytes: Uint8Array;
  readonly generator: AdapterIdentity;
  readonly contributors: readonly Contributor[];
  readonly digest: Sha256Hex;
}
export interface CandidateTree {
  readonly configurationDigest: Sha256Hex;
  readonly packSelectionDigest: Sha256Hex;
  readonly packDigests: Readonly<Record<string, Sha256Hex>>;
  readonly resources: readonly EffectiveResource[];
  readonly leaves: readonly CandidateLeaf[];
}
```

### Exact Phase 2 package scripts

Phase 2 retains every Phase 1 script and adds:

```json
{
  "build:native": "node scripts/build-native.mjs",
  "test:native": "pnpm run build:native && vitest run tests/native",
  "test": "pnpm run test:unit && pnpm run test:integration && pnpm run test:native",
  "test:performance": "vitest run tests/performance",
  "performance:check": "pnpm run test:performance && pnpm run build && node --expose-gc dist/performance/resolver-budget.js --json",
  "pack:check": "pnpm run build && node scripts/check-package-contents.mjs",
  "check": "pnpm run typecheck && pnpm run test && pnpm run performance:check && pnpm run pack:check"
}
```

Phase 2 packaging remains source-only: a working `dist/native` helper is used by tests but never copied into the isolated package stage or tarball. Native-aware tarball building starts in Phase 3.

## Mandatory RED/GREEN and Microstep Protocol

For every behavior packet, add only the literal test or fixture shown and run the exact focused command. If the planned module/export does not exist, the first run is only a structural RED: Vitest must discover the exact test file and fail solely on that missing module/export. Add the smallest typed stub satisfying the packet's declared interface; it throws the temporary working-tree-only sentinel formed by the adjacent fragments `EVK_INTERNAL_` and `NOT_IMPLEMENTED`. The transient stub source must contain the assembled sentinel as one contiguous ASCII literal so the artifact scanner can catch a forgotten stub, but this committed plan/test/policy must never contain that assembled token. Rerun immediately and require exit `1` with the named assertion failing for the stated missing behavior. Every packet statement that says RED because a module/export is absent abbreviates this mandatory structural-RED -> typed-stub -> named behavioral-RED sequence. Skipped/no tests, wrong filters, unrelated imports, configuration, network, or fixture discovery are invalid behavioral RED evidence. Remove the entire stub branch and sentinel, add only the named production branch, rerun the same command, and require exit `0` with the named test executed exactly once. When a step contains a literal case table, process one row at a time as four 2-5 minute actions: append that row, run and record its behavior-specific RED, add only the branch needed by that row using the packet's production contract, then rerun and record GREEN before appending the next row. Do not batch rows behind one unobserved implementation.

Every fixture helper named in a snippet is test-only and is created in that packet's first test step, not deferred to production work. `fixtureManifest`, `unicodeFetchFixture`, `nativeFixtureFile`, `fakeGitFixture`, `trackedCorePackRepository`, `resolveSourceFixture`, `resolveLocalFixture`, `groundingPack`, `extendOverride`, `inventoryFixture`, `catalogFixture`, `pureFixture`, `runResolverBudgetFixture`, and their adjacent spies/log readers are local to the test file that calls them. Each accepts exactly the visible call-site fields, uses only a fresh temporary root or the Phase 1 in-memory/read-only injected ports, exposes all provider/filesystem/network/acquisition/render/copy/write calls, and registers cleanup in `afterEach`. `expectedStressResultDigest` is a literal 64-lowercase-hex constant generated and reviewed with the fixed seed, never computed by the production resolver under test. A helper may not synthesize the assertion under test, access a real user configuration, perform an undeclared network request, or hide a write. Production snippets may call only imported Node/library functions or production functions whose complete contract appears in the same packet; no implementer-defined production helper is implied.

### Task 1: Generate and Verify the Pinned Portable Path Key (master 2.1)

**Files:**

- Modify: `packages/ai-tooling/package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `packages/ai-tooling/tests/package/package-contract.spec.ts`
- Create: `packages/ai-tooling/scripts/generate-unicode-case-fold.mjs`
- Create: `packages/ai-tooling/scripts/fetch-unicode-data.mjs`
- Create: `packages/ai-tooling/src/path/unicode-case-fold-17.ts`
- Create: `packages/ai-tooling/src/path/unicode-nfc-17.ts`
- Create: `packages/ai-tooling/src/path/lexical.ts`
- Create: `packages/ai-tooling/src/path/portable-key.ts`
- Create: `packages/ai-tooling/tests/unit/portable-key.spec.ts`
- Create: `packages/ai-tooling/tests/package/unicode-table.spec.ts`
- Create: `packages/ai-tooling/tests/unit/unicode-sources.spec.ts`
- Create: `packages/ai-tooling/tests/fixtures/unicode-case-fold-v17.json`
- Create: `packages/ai-tooling/tests/fixtures/unicode-sources/invalid.json`
- Create: `packages/ai-tooling/vendor/unicode-17/UnicodeData.txt`
- Create: `packages/ai-tooling/vendor/unicode-17/CompositionExclusions.txt`
- Create: `packages/ai-tooling/vendor/unicode-17/NormalizationTest.txt`
- Create: `packages/ai-tooling/vendor/unicode-17/CaseFolding.txt`
- Create: `packages/ai-tooling/vendor/unicode-17/LICENSE.md`
- Create: `packages/ai-tooling/vendor/unicode-17/SOURCES.json`
- Create: `packages/ai-tooling/vendor/unicode-17/SOURCES.schema.json`

**Interfaces:**

- Consumes: strict standard JSON, exact five-source manifest schema, Unicode 17 normative bytes, and installed `@unicode/unicode-17.0.0@1.6.17` only as a generator cross-check.
- Produces: script-internal `fetchUnicodeSources`, `validatePortableRelativePath`, `portableComponentKey`, `portablePathKey`, `isPortableAncestor`, generated `nfc17`/`fullDefaultCaseFold17`, and `UNICODE_CASE_FOLD_VERSION = '17.0.0'`; runtime imports no Unicode package or ICU normalization/casing.

#### Packet 1A: dependency and closed Unicode source manifest

- [ ] **Step 1: add and lock the exact development dependency**

Add `@unicode/unicode-17.0.0: 1.6.17` to tooling dev dependencies.

Run: `pnpm install --lockfile-only`

Expected GREEN: exit `0`; only the tooling importer plus deterministic resolution entries change.

- [ ] **Step 2: install without scripts and prove the package version**

Run: `pnpm install --frozen-lockfile --ignore-scripts && pnpm --filter @evk-soft/ai-tooling list @unicode/unicode-17.0.0 --depth 0`

Expected GREEN: exit `0`; output identifies exactly `1.6.17` and no lifecycle marker exists.

- [ ] **Step 3: write the literal source-manifest rejection test**

```ts
it.each([
  ['reordered', ['CaseFolding.txt', 'UnicodeData.txt', 'CompositionExclusions.txt', 'NormalizationTest.txt', 'LICENSE.md']],
  ['duplicate', ['UnicodeData.txt', 'UnicodeData.txt', 'CompositionExclusions.txt', 'NormalizationTest.txt', 'LICENSE.md']],
  ['redirected', ['UnicodeData.txt', 'CompositionExclusions.txt', 'NormalizationTest.txt', 'CaseFolding.txt', 'LICENSE.md'], 'https://example.invalid/UnicodeData.txt'],
] as const)('rejects %s Unicode source manifest', async (_name, names, url) => {
  await expect(validateUnicodeSources(fixtureManifest(names, url))).rejects.toThrow();
});
```

- [ ] **Step 4: run the source-manifest test for RED**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/unicode-sources.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: exit `1`; the first new row fails because the validator/schema is absent.

- [ ] **Step 5: implement the exact source schema**

`SOURCES.schema.json` is strict draft 2020-12 JSON with exactly `schemaVersion: 1` and an ordered five-entry `sources` array. Each entry contains only `name`, the exact approved HTTPS URL, nonnegative safe-integer `byteLength`, and a digest string consisting of literal `sha256:` followed by exactly 64 lowercase hexadecimal digits. The exact URL order is `UnicodeData.txt`, `CompositionExclusions.txt`, `NormalizationTest.txt`, `CaseFolding.txt` under `https://www.unicode.org/Public/17.0.0/ucd/`, then `LICENSE.md` from `https://www.unicode.org/license.txt`. Reject missing/extra/reordered/duplicate/redirected/wrong URL/length/digest entries.

- [ ] **Step 6: rerun the source-manifest test for GREEN**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/unicode-sources.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; every malformed/redirected/reordered vector rejects locally.

#### Packet 1B: exact Unicode retrieval and offline verification

- [ ] **Step 1: write the literal redirected-response test**

```ts
it('rejects a redirected Unicode source without installing a partial tree', async () => {
  const fixture = await unicodeFetchFixture({
    firstResponse: {
      url: 'https://www.unicode.org/Public/17.0.0/ucd/UnicodeData.txt',
      status: 302,
      location: 'https://example.invalid/UnicodeData.txt',
      chunks: [],
    },
  });
  await expect(fetchUnicodeSources({
    mode: 'retrieve',
    destination: fixture.destination,
    transport: fixture.transport,
    filesystem: fixture.filesystem,
  })).rejects.toThrowError(/unicode-source-response-invalid/u);
  expect(fixture.requestedUrls).toStrictEqual([
    'https://www.unicode.org/Public/17.0.0/ucd/UnicodeData.txt',
  ]);
  expect(fixture.installedEntries).toStrictEqual([]);
});
```

- [ ] **Step 2: run the exact fetcher test for RED**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/unicode-sources.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: after the mandatory structural RED/stub cycle, exit `1`; `rejects a redirected Unicode source without installing a partial tree` reaches installation or lacks the closed redirect rejection.

- [ ] **Step 3: implement the single-purpose fetcher**

The script accepts only `--destination packages/ai-tooling/vendor/unicode-17` or `--verify --destination packages/ai-tooling/vendor/unicode-17`. Retrieval mode requests only the five exact URLs, rejects redirects/non-200/unrequested host/path, streams each response into a fresh contained temporary directory with a 16 MiB per-file cap and SHA-256/length counters, writes deterministic `SOURCES.json`, verifies all five files, and atomically installs the complete set. Verify mode performs no network call and checks schema/order/URL/length/digest/license bytes.

- [ ] **Step 4: rerun the fetcher test for GREEN**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/unicode-sources.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; the named redirect test requests only the first exact Unicode URL, rejects before a second request or install, and leaves the destination empty.

- [ ] **Step 5: retrieve the exact upstream bytes under separate network authorization**

Run: `node packages/ai-tooling/scripts/fetch-unicode-data.mjs --destination packages/ai-tooling/vendor/unicode-17`

Expected GREEN: exit `0`; exactly five files plus `SOURCES.json` are installed; no redirect or other host is contacted. Record locally computed length and SHA-256; Unicode publishes no companion checksum, so do not claim upstream hash provenance.

- [ ] **Step 6: review the retrieved source/license bytes**

Inspect the first identifying lines of all four UCD inputs and the complete Unicode license. Confirm version `17.0.0`, expected filenames, no HTML/error body, and exact `SOURCES.json` length/hash match.

- [ ] **Step 7: prove offline verification**

Run with network APIs blocked: `node packages/ai-tooling/scripts/fetch-unicode-data.mjs --verify --destination packages/ai-tooling/vendor/unicode-17`

Expected GREEN: exit `0`; exact schema/order/URLs/lengths/hashes pass and no network function is called.

#### Packet 1C: lexical Win32-safe grammar and portable key

- [ ] **Step 1: write the literal lexical matrix**

```ts
const INVALID_COMPONENTS = [
  '', '.', '..', 'a\\b', 'C:', 'C:relative', '\\\\server\\share', '%2e',
  'tail.', 'tail ', 'a:b', 'a<b', 'a>b', 'a"b', 'a|b', 'a?b', 'a*b',
  '\u0000', '\u0001', '\u001f',
  'CON', 'con.txt', 'PRN', 'AUX.md', 'NUL', 'COM1', 'com9.log', 'LPT1', 'lpt9.txt',
  'COM¹', 'com².txt', 'COM³', 'LPT¹', 'lpt².txt', 'LPT³',
] as const;

it.each(INVALID_COMPONENTS)('rejects portable component %j before keying', (component) => {
  expect(() => validatePortableComponent(component)).toThrow();
  expect(nfcSpy).not.toHaveBeenCalled();
  expect(filesystemSpy).not.toHaveBeenCalled();
  expect(providerSpy).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: run portable-key tests for RED**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/portable-key.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: exit `1`; the first literal invalid component is accepted or the module is absent.

- [ ] **Step 3: implement the lexical validator**

```ts
const FORBIDDEN = /[\u0000-\u001f<>:"|?*]/u;
const DEVICE = /^(?:CON|PRN|AUX|NUL|COM[1-9¹²³]|LPT[1-9¹²³])(?:\..*)?$/iu;

export function validatePortableComponent(component: string): PortablePathSegment {
  if (component === '' || component === '.' || component === '..') throw invalid('empty-or-dot');
  if (component.includes('/') || component.includes('\\')) throw invalid('separator');
  if (/^[A-Za-z]:/u.test(component) || component.startsWith('\\\\')) throw invalid('drive-or-unc');
  if (component.includes('%')) throw invalid('percent-encoded');
  if (FORBIDDEN.test(component)) throw invalid('win32-forbidden-character');
  if (component.endsWith(' ') || component.endsWith('.')) throw invalid('win32-trailing-character');
  if (DEVICE.test(component)) throw invalid('win32-device-name');
  return component as PortablePathSegment;
}
```

`invalid` is the module-local constructor returning the closed path-validation `ToolingError`; define it in `lexical.ts` with no free-text input. `validatePortableRelativePath` fatal-decodes/validates every `/`-separated component, rejects absolute/empty/dot/parent/backslash/drive/UNC/percent spelling, enforces 4 KiB UTF-8, and returns a branded path.

- [ ] **Step 4: rerun lexical tests for GREEN**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/portable-key.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; every exact invalid component fails before normalization/provider/filesystem calls.

- [ ] **Step 5: write the literal Unicode equivalence test**

```ts
it.each([
  ['ASCII', 'ReadMe', 'README'],
  ['sharp s', 'straße', 'STRASSE'],
  ['Greek sigma', 'Σ', 'ς'],
  ['NFC', 'é', 'e\u0301'],
  ['Cherokee', 'Ꭰ', 'ꭰ'],
] as const)('%s has one portable key', (_name, left, right) => {
  expect(portableComponentKey(left)).toBe(portableComponentKey(right));
});
```

- [ ] **Step 6: run Unicode key tests for RED**

Run: `pnpm --filter @evk-soft/ai-tooling run build && pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/portable-key.spec.ts tests/package/unicode-table.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: exit `1`; `sharp s has one portable key` or the normalization-corpus test fails because the generated tables/runtime are absent.

- [ ] **Step 7: implement the deterministic generator**

Parse vendored `CaseFolding.txt`, accept only statuses `C` and `F`, reject duplicate source code points, sort numerically, and cross-check exact maps against installed `Case_Folding/C` and `Case_Folding/F`. Parse `UnicodeData.txt` canonical decompositions/combining classes, `CompositionExclusions.txt`, Hangul algorithm constants, and every applicable `NormalizationTest.txt` row. Generate checked-in TypeScript tables with Unicode/package versions plus all five input hashes. Runtime imports the generated tables only; Turkic `T` and simple `S` mappings are excluded.

- [ ] **Step 8: implement the exact runtime composition**

```ts
export const UNICODE_CASE_FOLD_VERSION = '17.0.0' as const;

export function portableComponentKey(component: string): string {
  validatePortableComponent(component);
  return nfc17(fullDefaultCaseFold17(nfc17(component)));
}

export function portablePathKey(path: PortableRelativePath): string {
  return path.split('/').map(portableComponentKey).join('/');
}

export function isPortableAncestor(parent: PortableRelativePath, child: PortableRelativePath): boolean {
  const parentKey = portablePathKey(parent);
  const childKey = portablePathKey(child);
  return childKey.length > parentKey.length && childKey.startsWith(`${parentKey}/`);
}
```

`nfc17` implements recursive canonical decomposition, stable combining-class ordering, Hangul decomposition/composition, composition exclusions, and canonical composition. Do not call `String.normalize`, `toLowerCase`, `toLocaleLowerCase`, `path.resolve`, or an OS comparison.

- [ ] **Step 9: rerun the complete portable-key command for GREEN**

Run: `pnpm --filter @evk-soft/ai-tooling run build && pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/portable-key.spec.ts tests/unit/unicode-sources.spec.ts tests/package/unicode-table.spec.ts tests/package/package-contract.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; the complete Unicode 17 normalization corpus, package/source cross-check, source hashes, ASCII/ß/sigma/Cherokee/NFC equivalence, slash-boundary ancestry, config-override portable duplicates, invalid components, and Phase 2 dependency/script contract pass.

- [ ] **Step 10: prove locale independence**

Run the focused portable-key tests under fixture environments `LANG=C`, `tr-TR`, and `lt-LT`.

Expected GREEN: all three runs exit `0` with identical keys and table digests.

### Task 2: Build the Phase 2 Win32 File-Identity Helper (first half of master 2.2)

**Files:**

- Create: `packages/ai-tooling/native/win32-helper/CMakeLists.txt`
- Create: `packages/ai-tooling/native/win32-helper/protocol.h`
- Create: `packages/ai-tooling/native/win32-helper/main.cc`
- Create: `packages/ai-tooling/scripts/build-native.mjs`
- Create: `packages/ai-tooling/src/native/win32-helper.ts`
- Create: `packages/ai-tooling/tests/unit/win32-protocol.spec.ts`
- Create: `packages/ai-tooling/tests/native/win32-helper.native.spec.ts`
- Modify: `packages/ai-tooling/package.json`
- Modify: `packages/ai-tooling/tests/package/package-contract.spec.ts`

**Interfaces:**

- Consumes: only validated UTF-8 path requests, the installed tooling-module-relative helper location, and the IC-8 supported tuple decision.
- Produces: private version-1 binary `file-identity` protocol and exact Win32 `ObjectIdentity<K>`; it exports nothing from the package root and cannot launch providers in Phase 2.

```ts
export type NodeKind = 'file' | 'directory' | 'link' | 'other';
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
```

#### Packet 2A: binary protocol framing

- [ ] **Step 1: write the literal golden-frame test**

```ts
it('encodes one bounded file-identity request', () => {
  const request = encodeFileIdentityRequest('C:\\work\\repo\\file.txt');
  expect(request.subarray(0, 4)).toStrictEqual(Uint8Array.of(0x45, 0x56, 0x4b, 0x31));
  expect(request[4]).toBe(1);
  expect(request[5]).toBe(1);
  expect(decodeFileIdentityRequest(request)).toStrictEqual({
    kind: 'file-identity',
    path: 'C:\\work\\repo\\file.txt',
  });
});
```

- [ ] **Step 2: run protocol tests for RED**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/win32-protocol.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: exit `1`; the named request-frame assertion fails because encoder/decoder modules are absent.

- [ ] **Step 3: implement the exact frame grammar**

Use ASCII magic `EVK1`, protocol version byte `1`, operation byte `1` for `file-identity`, unsigned little-endian 32-bit payload lengths, strict UTF-8 path bytes, and a 4 KiB scalar/64 KiB total request/response ceiling. Decode with checked additions and exact EOF; reject unknown magic/version/tag, overlong length, embedded NUL, invalid UTF-8, truncated or extra byte, negative/overflow integer, wrong node kind, and impossible field combination.

- [ ] **Step 4: rerun protocol tests for GREEN**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/win32-protocol.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; golden, truncation, overflow, unknown-tag/version, invalid UTF-8/NUL, impossible identity, and trailing-byte cases pass.

#### Packet 2B: native no-follow identity and deterministic build

- [ ] **Step 1: write the native file-identity assertion before build support**

```ts
it.runIf(process.platform === 'win32' && process.arch === 'x64')(
  'uses exact native identity for a handle-opened regular file',
  async () => {
    const file = await nativeFixtureFile('payload');
    const first = await win32FileIdentity(file.path, 'file');
    await file.replaceWithNewObject('payload');
    const second = await win32FileIdentity(file.path, 'file');
    expect(first.volumeSerial).toBe(second.volumeSerial);
    expect(first.fileId128).not.toBe(second.fileId128);
    expect(first.size).toBe(7n);
  },
);
```

- [ ] **Step 2: run the exact native RED command**

Run: `pnpm --filter @evk-soft/ai-tooling run build && pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/win32-protocol.spec.ts tests/native/win32-helper.native.spec.ts tests/package/package-contract.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: on `win32-x64`, exit `1` after Vitest discovers the named native assertion and reports missing `build:native`/helper support. On `linux-x64` or `darwin-arm64`, the native file has one declared not-applicable skip and the package-contract assertion still fails on the missing script graph. No pass-before-discovery is valid.

- [ ] **Step 3: implement the private C++ operation**

Open the requested object with Win32 no-follow/reparse-safe flags and retain the handle across observation. Use `GetFileInformationByHandleEx(FileIdInfo)` plus `GetFileInformationByHandle` to return exact `volumeSerial`, 128-bit file ID, attributes, size, creation time, and last-write time. Reject link/junction/reparse objects, deleted/replaced handles, wrong kind, malformed request, path conversion error, and any identity inconsistency. Use Unicode Win32 APIs, checked arithmetic, no shell or command line containing a provider path.

- [ ] **Step 4: implement the exact native build policy**

`CMakeLists.txt` builds Release `win32-x64` only with `CMAKE_MSVC_RUNTIME_LIBRARY=MultiThreaded`, `/MT`, `/W4 /WX`, CFG, DEP, and ASLR. `build-native.mjs` writes `dist/native/win32-x64/ai-tooling-win32-helper.exe` plus a SHA-256 manifest by default; its only other form is a package-checker-owned `--output-root` followed by the checker-validated absolute staging `dist/native` path. Reject a pre-existing/link/reparse/outside root. `linux-x64` and `darwin-arm64` emit stable not-applicable JSON and create no artifact; every other tuple exits nonzero with `unsupported-native-platform`.

- [ ] **Step 5: extend the exact package script contract**

Add the Phase 2 `build:native` and `test:native` scripts, append native testing to `test`, and keep `pack:check` source-only. Leave a valid helper/hash under working `dist/native`, run package check, and require the tarball to contain neither file and to make no publishability claim.

- [ ] **Step 6: rerun native/package tests for GREEN**

Run: `pnpm --filter @evk-soft/ai-tooling run build && pnpm --filter @evk-soft/ai-tooling run build:native && pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/win32-protocol.spec.ts tests/native/win32-helper.native.spec.ts tests/package/package-contract.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; `win32-x64` executes regular/directory/reparse/wrong-kind/replacement/timeout/substitution/protocol assertions against the freshly built helper; supported non-Windows tuples record exact not-applicable evidence; unsupported tuples fail closed; source-only tarball excludes native bytes.

### Task 3: Freeze Git, Discover Anchors, and Prove the Complete Tracked Set (second half of master 2.2)

**Files:**

- Create: `packages/ai-tooling/src/git/provider.ts`
- Create: `packages/ai-tooling/src/git/discovery.ts`
- Create: `packages/ai-tooling/src/git/index.ts`
- Create: `packages/ai-tooling/src/repository/context.ts`
- Create: `packages/ai-tooling/tests/unit/git-provider.spec.ts`
- Create: `packages/ai-tooling/tests/unit/git-discovery.spec.ts`
- Create: `packages/ai-tooling/tests/integration/git-index.spec.ts`
- Create: `packages/ai-tooling/tests/fixtures/fake-git/provider.mjs`
- Create: `packages/ai-tooling/tests/fixtures/fake-git/swapped-provider.mjs`

**Interfaces:**

- Consumes: deterministic direct executable lookup, native/Posix object identities, portable paths, one private config root, fixed repository anchors, and the command budget.
- Produces: a closed `FrozenGitProvider`, `RepositoryAnchors`, and `GitIndex`; callers cannot supply an arbitrary argv, pathspec, stdin, config, environment, alias, or subcommand.

```ts
export type RepositoryGitReadRequest =
  | { readonly kind: 'list-index'; readonly scope: 'pack-core' | 'local-state' | 'repository'; readonly stdoutSink: ByteSink }
  | { readonly kind: 'status'; readonly scope: 'pack-core' | 'local-state' | 'repository'; readonly stdoutSink: ByteSink }
  | { readonly kind: 'list-untracked'; readonly stdoutSink: ByteSink }
  | { readonly kind: 'check-stage-1-local-state-ignore'; readonly stdoutSink: ByteSink };

export interface FrozenGitProvider {
  readonly executable: AbsolutePath;
  readonly version: `${number}.${number}.${number}`;
  assertIdentity(): Promise<void>;
  runRepositoryReadOnly(request: RepositoryGitReadRequest): Promise<GitCommandResult>;
}
export interface RepositoryAnchors {
  readonly workTree: AbsolutePath;
  readonly gitDir: AbsolutePath;
  readonly commonDir: AbsolutePath | null;
  assertIdentity(): Promise<void>;
}
export interface GitIndexEntry {
  readonly path: PortableRelativePath;
  readonly mode: '100644' | '100755';
  readonly objectId: GitObjectId;
}
export interface GitIndex {
  assertTracked(paths: readonly PortableRelativePath[]): Promise<void>;
  listTrackedUnder(root: PortableRelativePath): Promise<readonly GitIndexEntry[]>;
}
```

#### Packet 3A: one frozen executable and closed transport result

- [ ] **Step 1: write the literal provider-capture test**

```ts
it('uses one frozen Git file, fixed argv, empty-base environment, and no shell', async () => {
  const fixture = await fakeGitFixture('2.45.0');
  const provider = await createFrozenGitProvider(fixture.request);
  await provider.runRepositoryReadOnly({ kind: 'list-index', scope: 'pack-core', stdoutSink: fixture.sink });
  expect(fixture.calls).toHaveLength(1);
  expect(fixture.calls[0]).toMatchObject({
    executable: fixture.realExecutable,
    shell: false,
    argv: expect.arrayContaining([
      '--no-replace-objects', '--no-lazy-fetch', '--literal-pathspecs',
      '-c', expect.stringMatching(/^core\.excludesFile=/u),
      '-c', expect.stringMatching(/^core\.attributesFile=/u),
      '-c', 'core.fsmonitor=false', '-c', 'core.untrackedCache=false',
      'ls-files', '-z', '--full-name', '--cached', '--stage', '--', 'configs/ai',
    ]),
  });
  expect(Object.keys(fixture.calls[0].env).sort()).toStrictEqual(fixture.expectedEnvironmentKeys);
});
```

- [ ] **Step 2: run provider tests for RED**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/git-provider.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: exit `1`; the named test fails because the frozen provider is absent.

- [ ] **Step 3: implement deterministic lookup, environment, and private files**

Walk the caller's initial `PATH` directly; POSIX requires a regular executable file; Windows accepts an exact path-like `.com`/`.exe` or tries literal name, `.COM`, `.EXE` for an extensionless bare token. Never call `which`, `where`, a shell, package manager, or caller `PATHEXT`. Realpath, capture native identity plus SHA-256, require Git version at least 2.36.0, and revalidate before/after every command.

Create one randomized exclusive owner-only config root at repository-context construction with exactly three no-follow zero-byte regular files: global config, excludes, attributes. Build the environment from an empty map, omit every inherited `GIT_*`, and set only `GIT_CONFIG_NOSYSTEM=1`, `GIT_CONFIG_GLOBAL` to the validated private zero-byte config path, `GIT_ATTR_NOSYSTEM=1`, `GIT_OPTIONAL_LOCKS=0`, `GIT_NO_REPLACE_OBJECTS=1`, `GIT_NO_LAZY_FETCH=1`, and `GIT_LITERAL_PATHSPECS=1` plus required fixed OS values. Bracket root/files by identity, length, digest, containment before/after every spawn; clean only after all children/streams are quiescent; preserve with a redacted basename on uncertainty.

- [ ] **Step 4: implement the closed result decoder**

Return only the approved `GitCommandResult` discriminants: exited, signaled, spawn-error, timeout, termination-unverified, or protocol-error, with valid exit/signal/timedOut/tree-state combinations and stderr byte count/truncation metadata. Git stderr remains inside a 64 KiB ring; raw child/OS text, paths, URLs, config text, and secrets never enter the result/diagnostic. Each command has a 30-second deadline and five-second terminate/reap deadline; timeout or uncertain termination fails closed.

- [ ] **Step 5: rerun provider tests for GREEN**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/git-provider.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; exact executable/argv/environment/anchor capture passes; wrappers/version drift/identity swap, poisoned/private-file races, all closed transport states, stderr redaction, helper/filter/network markers, and cleanup races fail closed.

#### Packet 3B: repository anchors and hostile admin-state preflight

- [ ] **Step 1: add the literal discovery rejection matrix**

```ts
const DISCOVERY_REJECTIONS = [
  'bare-repository', 'git-marker-link', 'ancestor-reparse', 'malformed-gitfile',
  'gitfile-extra-line', 'url-gitdir', 'tilde-gitdir', 'drive-relative-gitdir',
  'unc-gitdir', 'device-gitdir', 'posix-double-root', 'foreign-path-form',
  'missing-linked-admin', 'wrong-gitdir-back-reference', 'changed-marker',
  'changed-common-config', 'include-path', 'includeif-path', 'filter-clean',
  'filter-process', 'filter-smudge', 'worktree-config-duplicate',
  'worktree-config-noncanonical', 'missing-config-worktree', 'unexpected-config-worktree',
  'objects-info-alternates', 'objects-info-http-alternates',
  'linked-info-exclude', 'changed-info-attributes',
] as const;
```

- [ ] **Step 2: run discovery tests for RED**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/git-discovery.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: exit `1`; the first new matrix row reaches an external path/helper or is accepted because anchor discovery/preflight is absent.

- [ ] **Step 3: implement filesystem-first anchor discovery**

Walk existing ancestors from exact startup directory with no-follow identity checks to the first `.git`. Accept a real directory or a regular gitfile containing exactly one LF-terminated line whose first eight ASCII bytes are `gitdir: ` and whose remaining bytes are the validated path field. Resolve only validated same-host local absolute or Git-defined relative linked-worktree paths; reject URL/scheme/tilde/NUL/control/UNC/device/root-relative/drive-relative/foreign forms and POSIX `//`. Apply the same grammar to exactly one LF-terminated `commondir`. Require linked admin `HEAD`, `commondir`, `gitdir` regular files, exact back-reference to the worktree `.git`, and common no-follow `objects`/`refs` directories. Reject bare repositories and identity changes.

- [ ] **Step 4: implement fixed config/admin-state preflight**

Freeze common `config` and conditionally `config.worktree`; for each frozen file invoke only the argv array `['config', '--file', frozenConfigPath, '--no-includes', '-z', '--list']` without repository discovery, where `frozenConfigPath` is the already validated absolute path captured by discovery and is never caller input. Strict-parse complete NUL records. Reject case-insensitive `include.path`, `includeIf.*.path`, every `filter.*`, duplicate/noncanonical `extensions.worktreeConfig`, missing required or unexpected `config.worktree`. Require both alternates files absent. Accept optional `info/exclude`/`info/attributes` only as bounded contained no-follow regular files. Bracket all config/info observations and alternate absences before/after every repository command.

- [ ] **Step 5: rerun discovery tests for GREEN**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/git-discovery.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; valid root/subdirectory/directory/linked-worktree forms pass per OS; every matrix case blocks before normal Git/helper/filter/external-file access.

#### Packet 3C: constant-size NUL-delimited tracked proof

- [ ] **Step 1: write the literal tracked-set test**

```ts
it('uses exact native identity and literal NUL-delimited tracked paths', async () => {
  const repo = await trackedCorePackRepository();
  const before = await repo.byteInventory();
  const entries = await repo.context.index.listTrackedUnder('configs/ai' as PortableRelativePath);
  expect(entries.every((entry) => entry.mode === '100644')).toBe(true);
  expect(entries.map((entry) => entry.path)).toStrictEqual(repo.declaredPaths);
  expect(repo.gitArgv).toStrictEqual([
    ['ls-files', '-z', '--full-name', '--cached', '--stage', '--', 'configs/ai'],
    ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--no-renames', '--ignore-submodules=all', '--', 'configs/ai'],
  ]);
  expect(await repo.byteInventory()).toStrictEqual(before);
});
```

- [ ] **Step 2: run index integration tests for RED**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/git-index.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: exit `1`; the named NUL-delimited tracked-set assertion fails because `GitIndex` is absent.

- [ ] **Step 3: implement exact request serialization and parsers**

Map `pack-core`, `local-state`, and `repository` to literal `configs/ai`, `.ai-tooling`, and repository-root pathspecs. `list-untracked` has fixed `ls-files -z --full-name --others --exclude-standard --`; ignore checking owns the exact five fixed probes. Status always includes `--ignore-submodules=all`. Callers cannot provide a pathspec or argv byte.

Strict-stream the complete stage/status maps with fatal UTF-8, 4 KiB per path, 100,000 paths, bounded stderr, exact NUL framing, and portable validation. Require one ordinary stage-0 `100644` nonzero object ID for each accepted declared pack file. Reject `100755`, symlink, gitlink/submodule, intent-to-add from real `git add -N`, conflict stages, missing/extra/renamed/deleted/untracked/ignored declarations, invalid paths, duplicate status, truncated/extra records, and index/filesystem identity mismatch. The provider still transports tabs/newlines/`*`/`?`/`[`/`:(` raw; portable validation rejects all but `[` before a source read or later provider call.

- [ ] **Step 4: add hostile Git and command-capability fixtures**

Cover global excludes, hostile fsmonitor, worktree/index routing variables, gitlinks with hostile nested repositories, partial clone/promisor missing HEAD object, remote-helper markers, missing objects under Git 2.36-2.44 and 2.45+, option-looking/unknown request fields, attempted `clean`, `reset`, `config`, `update-index`, `clone`, alias, arbitrary stdin, and caller-selected config. Require `GIT_NO_LAZY_FETCH=1` everywhere and global `--no-lazy-fetch` at 2.45+; no helper, nested process, filter, network, cache, ref, index, or worktree write may occur.

- [ ] **Step 5: add command-line-length stress fixture**

Create exactly 100,000 valid declared paths within aggregate limits such that passing paths individually would exceed Windows and POSIX argv limits. Assert the same two constant-size command vectors, streamed parsing, exact set equality, and zero write.

- [ ] **Step 6: rerun the full Git/native command for GREEN**

Run: `pnpm --filter @evk-soft/ai-tooling run build && pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/win32-protocol.spec.ts tests/native/win32-helper.native.spec.ts tests/unit/git-provider.spec.ts tests/unit/git-discovery.spec.ts tests/integration/git-index.spec.ts tests/package/package-contract.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; fresh native identity, frozen provider/admin state, anchor grammar, exact constant-size NUL requests, hostile config/helper/network cases, 100,000-path stress, package script graph, and zero-write inventories pass. On Windows every provider/anchor/index/source identity comes from the native helper; POSIX uses no-follow native stat identity.

### Task 4: Load Only the Exact Tracked `configs/ai` Source (master 2.3)

**Files:**

- Modify: `packages/ai-tooling/src/cli.ts`
- Modify: `packages/ai-tooling/src/commands/pack.ts`
- Create: `packages/ai-tooling/src/config/load-config.ts`
- Create: `packages/ai-tooling/src/pack/load-local.ts`
- Create: `packages/ai-tooling/src/pack/integrity.ts`
- Create: `packages/ai-tooling/src/fs/read-only-repository-filesystem.ts`
- Create: `packages/ai-tooling/tests/unit/source-capability.spec.ts`
- Create: `packages/ai-tooling/tests/integration/local-pack-source.spec.ts`
- Create: `packages/ai-tooling/tests/fixtures/config-sources/vectors.json`

**Interfaces:**

- Consumes: Phase 1 strict config/schema validation, frozen repository context/index, portable paths, one shared command budget, and injected Phase 1 pack validator/builder.
- Produces: `loadConfig`, `resolveSafeCoreSource`, `hashPackTree`, concrete read-only repository filesystem, and real read-only `pack validate`/`pack build` CLI wiring.

```ts
export function loadConfig(bytes: Uint8Array): ConfigV1;
export function resolveSafeCoreSource(
  config: ConfigV1,
  context: ReadOnlyProjectContext,
): Promise<ResolvedLocalPack>;
export function hashPackTree(files: readonly PackFile[]): Sha256Hex;
```

#### Packet 4A: distinguish unavailable kind, unavailable lifecycle, and invalid selector

- [ ] **Step 1: write the literal diagnostic table**

```ts
it.each([
  ['npm', 'EVK_PACK_CAPABILITY_UNAVAILABLE', 'pack-source.acquire'],
  ['git', 'EVK_PACK_CAPABILITY_UNAVAILABLE', 'pack-source.acquire'],
] as const)('rejects %s before acquisition', async (sourceKind, code, capability) => {
  await expect(resolveSourceFixture({ sourceKind })).rejects.toMatchObject({
    diagnostic: {
      code,
      fields: { capability, activeProfile: 'safe-core', sourceKind },
      recoveryActions: ['Use the tracked local configs/ai pack source.'],
    },
  });
  expect(acquisitionSpies()).toStrictEqual([]);
});

it('rejects preview before source work', async () => {
  await expect(resolveSourceFixture({ sourceKind: 'local', outputMode: 'preview' })).rejects.toMatchObject({
    diagnostic: {
      code: 'EVK_CONFIG_CAPABILITY_UNAVAILABLE',
      fields: { capability: 'output.preview', activeProfile: 'safe-core' },
      recoveryActions: ['Use managed output mode.'],
    },
  });
  expect(repositorySpies()).toStrictEqual([]);
});
```

- [ ] **Step 2: run capability tests for RED**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/source-capability.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: exit `1`; `rejects npm before acquisition` fails because the resolver is absent.

- [ ] **Step 3: implement the gate order**

Strict-load/schema-validate config first. Reject preview with the exact config diagnostic before source selection. Reject recognized npm/git with the exact pack diagnostic before provider acquisition, network, package manager, cache, clone, fetch, or recursive source calls. A supported local selector reaches separate validation and uses `EVK_PACK_SOURCE_INVALID` with a closed reason; it is never mislabeled unavailable. The Phase 1 bare Markdown URL fixture fails schema validation before any source gate.

- [ ] **Step 4: rerun capability tests for GREEN**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/source-capability.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; npm/git/preview/bare URL produce exact distinct diagnostics and all acquisition/repository spies obey the gate order.

#### Packet 4B: exact contained tracked identity and integrity bytes

- [ ] **Step 1: write the literal local-source matrix**

```ts
const LOCAL_SOURCE_CASES = [
  { name: 'outside', path: '../configs/ai', reason: 'outside-repository' },
  { name: 'absolute', path: '/configs/ai', reason: 'noncanonical-selector' },
  { name: 'wrong identity', path: 'configs/other', reason: 'identity-mismatch' },
  { name: 'workspace alias', path: 'node_modules/@evk-soft/ai-pack-core', reason: 'workspace-alias' },
  { name: 'untracked', path: 'configs/ai', mutate: 'untrack-one', reason: 'untracked-entry' },
  { name: 'symlink', path: 'configs/ai', mutate: 'symlink-root', reason: 'reparse-or-link' },
  { name: 'identity swap', path: 'configs/ai', mutate: 'swap-before-read', reason: 'identity-changed' },
] as const;

it.each(LOCAL_SOURCE_CASES)('rejects $name local source', async (row) => {
  await expect(resolveLocalFixture(row)).rejects.toMatchObject({
    diagnostic: { code: 'EVK_PACK_SOURCE_INVALID', reason: row.reason },
  });
  expect(writeLog()).toStrictEqual([]);
});
```

- [ ] **Step 2: run local-source tests for RED**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/local-pack-source.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: exit `1`; the first local-source row fails because real contained loading is absent.

- [ ] **Step 3: implement the read-only filesystem and exact selector**

Accept only literal canonical `configs/ai`. Resolve from frozen Git root; no-follow inspect every existing ancestor and reject link/reparse/UNC/portable collision; validate the absent tail lexically; capture identities; immediately revalidate root/file ancestors before each read. Require the complete Git index/status maps to equal the declared pack tree and every accepted file to be stage-0 `100644`. A second spelling, realpath alias, workspace junction, executable index mode, extra/missing/untracked/ignored/conflicted entry, or identity race fails before content acceptance.

`inspectPath` returns kind/identity/reported size only. `scanFile` rejects one-over reported size before opening/allocating, streams with one fixed unread chunk to an awaited sink, counts/hash bytes, applies the shared `pack` budget, and revalidates exact length/identity afterward. `readFileBounded` is only `scanFile` plus a bounded collector. Directory enumeration is identity-bracketed iterator-based, validates one segment at a time, claims each entry before retaining it, closes promptly on one-over/no-progress, and never uses an unbounded recursive read.

- [ ] **Step 4: implement exact pack-tree hashing**

Sort accepted files by portable path key then original UTF-8 path bytes. Hash each raw file with SHA-256 and compute SHA-256 over RFC 8785 JCS bytes of:

```ts
export interface PackIntegrityV1 {
  readonly schemaVersion: 1;
  readonly files: readonly {
    readonly path: PortableRelativePath;
    readonly byteLength: number;
    readonly contentDigest: `sha256:${Sha256Hex}`;
  }[];
}
```

Inventory includes `package.json`, `pack.json`, `README.md`, `LICENSE`, and every declared metadata/instruction file. Do not normalize line endings, Markdown, JSON, or Unicode. A resource base digest is JCS over validated metadata with only `$schema` omitted plus the exact `sha256:` instruction digest.

- [ ] **Step 5: add exact resource-limit/race fixtures**

Cover 16 MiB accepted and one-over regular/sparse file, 512 MiB accepted/one-over aggregate, 100,000/100,001 files, 4 KiB/one-over path, 64/65 levels, 16 MiB/one-over path bytes, truncated/extra stream, 30-second no-progress and 300-second whole-load deadlines, link/junction/reparse, changed identity, and duplicate physical identity. Every failure occurs before whole-body allocation and leaves Git/worktree/cache/write logs empty.

- [ ] **Step 6: wire Phase 1 pack handlers through the one context**

`pack validate` and `pack build` now construct one `ReadOnlyRepositoryContext`, resolve the exact source, and pass its exact `ContainedPathRef`, filesystem, and shared budget to Phase 1 functions. Build accepts only an explicit caller-selected trusted temporary `PackBuildDestination`. Compile-time/runtime tests reject raw `AbsolutePath`, a second filesystem/budget, and a repository destination before source read or destination write.

- [ ] **Step 7: rerun local-source tests for GREEN**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/source-capability.spec.ts tests/integration/local-pack-source.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; exact tracked `configs/ai` succeeds twice with identical integrity digest; every invalid selector/identity/tracking/limit/race case emits the closed reason and zero writes/network/acquisition/cache activity.

### Task 5: Resolve Pack Integrity, Precedence, and Overrides (master 2.4)

**Files:**

- Create: `packages/ai-tooling/src/resolve/catalog.ts`
- Create: `packages/ai-tooling/src/resolve/overrides.ts`
- Create: `packages/ai-tooling/src/resolve/graph.ts`
- Create: `packages/ai-tooling/tests/unit/catalog.spec.ts`
- Create: `packages/ai-tooling/tests/unit/overrides.spec.ts`
- Create: `packages/ai-tooling/tests/fixtures/overrides/vectors.json`

**Interfaces:**

- Consumes: one validated local pack, strict config-selected override resource directories, the exact shared context/budget, stable IDs/base digests, and raw bounded instruction bytes.
- Produces: typed `ValidatedOverride[]`, one deterministic `EffectiveResource` per enabled stable ID, ordered contributor provenance, and effective digests.

```ts
export function resolveCatalog(
  packs: readonly ValidatedPack[],
  overrides: readonly ValidatedOverride[],
): readonly EffectiveResource[];
export function loadValidatedOverrides(
  config: ConfigV1,
  packs: readonly [ValidatedPack],
  context: ReadOnlyProjectContext,
): Promise<readonly ValidatedOverride[]>;
```

#### Packet 5A: deterministic graph and complete provenance

- [ ] **Step 1: write the literal incompatible-base test**

```ts
it('rejects incompatible override base digest', () => {
  expect(() => resolveCatalog([groundingPack()], [
    extendOverride({ target: 'evk-soft/rules/grounding', expectedBaseDigest: '0'.repeat(64) }),
  ])).toThrowError(expect.objectContaining({
    diagnostic: expect.objectContaining({ reason: 'incompatible-base-digest' }),
  }));
});
```

- [ ] **Step 2: run catalog/override tests for RED**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/catalog.spec.ts tests/unit/overrides.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: exit `1`; `rejects incompatible override base digest` fails because the graph is absent.

- [ ] **Step 3: implement the stable-ID graph**

Apply declared pack precedence and resource order, then config `overrides[]` order. `extend` may add only schema-compatible fields and instruction sections; `replace` and `disable` are terminal at their level. Reject missing target, same-level collision, orphan, incompatible base digest, cycle, kind mismatch, and contradictory same-level intent. Produce one enabled resource per stable ID with contributors in exact application order. Sort diagnostics by portable resource ID and source order, never object enumeration order. Compute `effectiveDigest` over validated metadata projection plus exact instruction bytes.

- [ ] **Step 4: rerun graph tests for GREEN**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/catalog.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; deterministic pack order, extend/replace/disable, every rejection, one effective resource, exact contributor order, and two-resolution byte identity pass.

#### Packet 5B: contained committed override loading

- [ ] **Step 1: write the literal override-path table**

```ts
const OVERRIDE_PATH_CASES = [
  ['root itself', 'ai/overrides'],
  ['wrong root', 'configs/ai/rules/evk-grounding'],
  ['generated root', '.agents/skills/evk-plan'],
  ['git root', '.git/config'],
  ['parent', 'ai/overrides/../outside'],
  ['wrong case', 'AI/overrides/rules/evk-grounding'],
  ['case alias', 'ai/overrides/rules/Name'],
  ['NFC alias', 'ai/overrides/rules/é'],
  ['Win32 invalid', 'ai/overrides/rules/CON'],
] as const;
```

Use separate fixtures for the two alias rows so each config contains one prior selected path whose portable key collides with the row.

- [ ] **Step 2: run override-loader tests for RED**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/overrides.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: exit `1`; the first invalid selected resource directory reaches a descriptor read or is accepted because the loader is absent.

- [ ] **Step 3: implement exact loader containment and bounds**

For each config-declared path in config order, repeat portable lexical validation, require a strict descendant of literal `ai/overrides` under the frozen root, and reject portable-key or physical-identity duplicates before reading `override.json`. Resolve a descriptor-referenced instruction only inside that selected resource directory; reject absolute/parent/cross-resource/link/reparse references. Revalidate root, resource directory, descriptor, and instruction identities immediately before reads. Strict-parse/schema-validate metadata, bind stable target and exact base digest, and make this loader the only typed producer of `ValidatedOverride[]`.

Use the shared budget: 100,000 override files, 16 MiB per metadata/instruction file, 64 MiB aggregate across selected roots, 16 MiB path bytes, 30-second no-progress and 300-second whole-load deadlines. Reject one-over/sparse/truncated/extra/stalled inputs before schema/graph work; stream/hash exact length and revalidate identity.

- [ ] **Step 4: rerun override-loader tests for GREEN**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/catalog.spec.ts tests/unit/overrides.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; strict schemas, path/root/case/NFC/Win32/physical collisions, instruction containment, identity races, all exact limits, contributor order, and redacted graph diagnostics pass.

### Task 6: Enforce Instruction-Only Capabilities Independently of Declarations (master 2.5)

**Files:**

- Modify: `packages/ai-tooling/src/fs/read-only-repository-filesystem.ts`
- Create: `packages/ai-tooling/src/resolve/capabilities.ts`
- Create: `packages/ai-tooling/src/pack/assets.ts`
- Create: `packages/ai-tooling/tests/unit/capabilities.spec.ts`
- Create: `packages/ai-tooling/tests/fixtures/capabilities/vectors.json`

**Interfaces:**

- Consumes: contained source root, declared portable paths, complete Git index map, shared read-only context/budget, and resolved catalog.
- Produces: metadata-only `ActualAssetInventory` and fail-closed `assertSafeCoreCapabilities`; no file body survives inventory.

```ts
export function inspectActualAssets(
  sourceRoot: ContainedPathRef,
  declaredPaths: readonly PortableRelativePath[],
  context: ReadOnlyProjectContext,
): Promise<ActualAssetInventory>;
export function assertSafeCoreCapabilities(
  catalog: readonly EffectiveResource[],
  inventory: ActualAssetInventory,
): void;
```

#### Packet 6A: declaration-independent executable rejection

- [ ] **Step 1: write the literal undeclared-executable test**

```ts
it('rejects undeclared executable bytes before rendering', async () => {
  const inventory = await inventoryFixture({
    declared: ['pack.json'],
    actual: {
      'pack.json': { mode: '100644', bytes: '{"schemaVersion":1}\n' },
      'hidden/run.sh': { mode: null, bytes: '#!/bin/sh\necho no\n', ignored: true },
    },
  });
  expect(() => assertSafeCoreCapabilities(catalogFixture(), inventory)).toThrowError(
    expect.objectContaining({
      diagnostic: expect.objectContaining({ code: 'EVK_SECURITY_EXECUTABLE_CONSENT_REQUIRED' }),
    }),
  );
  expect(inventory.entries.find((entry) => entry.path === 'hidden/run.sh')).toMatchObject({
    indexMode: null,
    securitySignals: expect.arrayContaining(['shebang', 'executable-extension']),
  });
  expect(rendererSpy).not.toHaveBeenCalled();
  expect(copySpy).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: run capability tests for RED**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/capabilities.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: exit `1`; `rejects undeclared executable bytes before rendering` fails because actual-tree inspection/capability enforcement is absent.

- [ ] **Step 3: add the exact adversarial asset matrix**

Add literal rows for declared script, undeclared executable extension, tracked `100755`, untracked/null index mode plus executable filesystem bit, shebang split across chunks, hook, MCP server, connector, browser capability, nested binary/NUL content, symlink, hidden file, ignored untracked executable, and instruction reference escaping its resource directory. Add a positive strict-JSON/Markdown-only row containing inert `https://example.invalid/reference` text and a normal Markdown link. Formatter provider trust is absent from pack capabilities.

- [ ] **Step 4: implement independent bounded tree inventory**

Recursively enumerate only with identity-bracketed `listDirectory`; fatal-decode and validate each segment; do not follow a link/reparse object. Apply depth 64, entries 100,000, path 4 KiB, aggregate path 16 MiB, file 16 MiB, aggregate file 512 MiB, no-progress 30 seconds, and whole inventory 300 seconds. Reject reported one-over/sparse size before content. Stream accepted regular files once through exact length/SHA-256 and cross-chunk signal scanners; retain only path, fs kind, index mode/null, filesystem-executable/null, declared kind/null, byte length, digest, and sorted signals. Re-list each directory after scanning its subtree and require exact stable kind/identity/set. Include tracked, untracked, and ignored entries; Git remains the separate proof for declared files.

- [ ] **Step 5: enforce the independent capability gate**

Compare declared and observed assets; independently inspect actual bytes and metadata so an omitted declaration cannot hide an executable. Any declared/actual script, hook, MCP, connector, browser, executable, binary, shebang, unexpected link/other, escaping reference, or other activatable asset emits `EVK_SECURITY_EXECUTABLE_CONSENT_REQUIRED` before candidate rendering/copy. A URL in instruction bytes remains inert.

- [ ] **Step 6: prove one shared budget**

Add compile-time/runtime tests that `inspectActualAssets` accepts no bare filesystem/Git port or newly constructed budget. Exhaust the shared pack/override counters before actual-tree scan and require the next content read to fail with `EVK_SECURITY_RESOURCE_LIMIT`; no counter or whole-deadline reset is possible.

- [ ] **Step 7: rerun capability tests for GREEN**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/capabilities.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; every activatable/hidden/undeclared/index-mode/symlink/binary/race/limit case rejects before rendering/copy, the inert Markdown URL passes without acquisition, and no inventory retains source bodies.

### Task 7: Build the Deterministic Adapter-Neutral Candidate and Proposed Diff (master 2.6)

**Files:**

- Modify: `packages/ai-tooling/package.json`
- Modify: `packages/ai-tooling/tests/package/package-contract.spec.ts`
- Create: `packages/ai-tooling/src/resolve/candidate.ts`
- Create: `packages/ai-tooling/src/resolve/diff.ts`
- Create: `packages/ai-tooling/src/resolve/pipeline.ts`
- Create: `packages/ai-tooling/src/performance/resolver-budget.ts`
- Create: `packages/ai-tooling/tests/unit/candidate.spec.ts`
- Create: `packages/ai-tooling/tests/integration/pure-pipeline.spec.ts`
- Create: `packages/ai-tooling/tests/performance/resolver-budget.spec.ts`
- Create: `packages/ai-tooling/tests/helpers/no-write-filesystem.ts`

**Interfaces:**

- Consumes: strict config bytes, one read-only project context/budget, resolved local pack, validated overrides/catalog, actual inventory/capability gate, and injected renderer.
- Produces: exact `PurePipelineResult`, deterministic candidate/diff, no mutation port, and standalone JSON performance evidence.

```ts
export interface CandidateRenderer {
  render(
    catalog: readonly EffectiveResource[],
    context: ReadOnlyProjectContext,
    platforms: PlatformSelection,
  ): Promise<readonly CandidateLeaf[]>;
}
export interface PurePipelineRequest {
  readonly context: ReadOnlyProjectContext;
  readonly configBytes: Uint8Array;
  readonly renderer: CandidateRenderer;
}
export interface PurePipelineResult {
  readonly config: ConfigV1;
  readonly packs: readonly [ValidatedPack];
  readonly overrides: readonly ValidatedOverride[];
  readonly catalog: readonly EffectiveResource[];
  readonly inventory: ActualAssetInventory;
  readonly candidate: CandidateTree;
  readonly diff: ProjectDiff;
}
export function resolvePurePipeline(request: PurePipelineRequest): Promise<PurePipelineResult>;
```

#### Packet 7A: exact pipeline order, platform identity, and repeatability

- [ ] **Step 1: write the literal two-run test**

```ts
it('renders the same candidate twice', async () => {
  const request = pureFixture({ platforms: ['claude-code', 'codex'] });
  const first = await resolvePurePipeline(request);
  const second = await resolvePurePipeline(request);
  expect(first.candidate).toStrictEqual(second.candidate);
  expect(first.diff).toStrictEqual(second.diff);
  expect(request.renderer.calls.map((call) => call.platforms)).toStrictEqual([
    ['claude-code', 'codex'],
    ['claude-code', 'codex'],
  ]);
  expect(request.filesystem.writeLog).toStrictEqual([]);
});
```

- [ ] **Step 2: run candidate/pipeline tests for RED**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/candidate.spec.ts tests/integration/pure-pipeline.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: exit `1`; `renders the same candidate twice` fails because the pipeline is absent.

- [ ] **Step 3: implement the exact pipeline order**

Implement: strict config load; preview/source capability gate; exact tracked local pack validation into `ValidatedPack`; validated override load; catalog resolution; actual-asset inventory; safe-core capability gate; renderer called with the validated ordered `config.platforms`; candidate digest; proposed diff. No raw `PackV1`/`OverrideV1` enters resolution. No renderer call occurs before capability acceptance. Do not import transaction, recovery, ownership, adapter, or project command modules.

Validate every returned leaf path, SHA-256 byte digest, closed generator identity, contributor provenance, and stable portable order. Reject duplicate/colliding leaves. Candidate records full configuration digest, pack-selection digest, one frozen pack-digest map, effective resources, and leaves. Diff classifies create/replace/delete/unchanged with before/after digest; it never writes.

- [ ] **Step 4: add complete candidate/diff vectors**

Cover stable leaf order, digest/provenance completeness, add/change/delete/unchanged, duplicate/case/NFC leaves, formatting-only config identity, every semantic config field, pack selection changes, both platform orders, renderer-selected/extra/missing/reordered platforms, source/capability failures, and two byte-identical runs. Wrap every row in `NoWriteFilesystem`; its create/write/rename/delete methods throw and its log must remain empty on success/failure.

- [ ] **Step 5: rerun candidate/pipeline tests for GREEN**

Run: `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/candidate.spec.ts tests/integration/pure-pipeline.spec.ts --passWithNoTests=false --reporter=verbose`

Expected GREEN: exit `0`; order, exact platform selection, digests, provenance, diff states, semantic/formatting identity, failure-gate call order, two-run equality, and zero writes pass.

#### Packet 7B: measurable standalone resolver budget

- [ ] **Step 1: write the literal harness contract test**

```ts
it('consumes and verifies the complete stress result', async () => {
  const output = await runResolverBudgetFixture({ exposeGc: true, seed: 0x45564b31 });
  expect(output).toStrictEqual({
    schemaVersion: 1,
    fixtureDigest: expect.stringMatching(/^[0-9a-f]{64}$/u),
    resultDigest: expect.stringMatching(/^[0-9a-f]{64}$/u),
    calibrationMsA: expect.arrayContaining([expect.any(Number)]),
    calibrationMsB: expect.arrayContaining([expect.any(Number)]),
    durationsMs: expect.arrayContaining([expect.any(Number)]),
    medianMs: expect.any(Number),
    maxMs: expect.any(Number),
    peakHeapGrowthBytes: expect.any(Number),
  });
  expect(output.resultDigest).toBe(expectedStressResultDigest());
});
```

- [ ] **Step 2: run performance tests for RED**

Run: `pnpm --filter @evk-soft/ai-tooling run build && pnpm --filter @evk-soft/ai-tooling exec vitest run tests/performance/resolver-budget.spec.ts tests/package/package-contract.spec.ts --passWithNoTests=false --reporter=verbose`

Expected RED: exit `1`; the named result-consumption or exact Phase 2 script-contract assertion fails because the harness/scripts are absent.

- [ ] **Step 3: implement fixed fixture and measurement**

One isolated child validates the fixed-seed fixture SHA-256 for 5,000 resources, 1,000 overrides, and 10,000 adapter leaves; performs one unmeasured warm-up; then five measured runs. Before each run drop the prior result, call `global.gc()` twice, record `v8.getHeapStatistics().used_heap_size`, resolve while sampling at every 256-item checkpoint, hash/assert the complete result, then record peak minus baseline. The fixture stays allocated, making the reported increase resolver-owned by definition.

Before product timing, run two identical seven-sample SHA-256 calibrations over the same 64 MiB seeded buffer. Reject `environment-unstable` unless hashes agree, larger/smaller medians ratio is at most 1.20, and every sample is at most 1.30 times its own median. Missing `--expose-gc`, wrong fixture/result digest, removed result consumption, unstable calibration, missing checkpoints, nonfinite/negative values, and limit exceedance fail.

- [ ] **Step 4: implement exact budgets and script graph**

JSON key set/order is exactly the test object. On native CI, require median below 2,000 ms, every run below 3,000 ms, and peak growth below 268,435,456 bytes. Timing is informational on developer machines; correctness, digest consumption, byte repeatability, and stable environment are blocking everywhere. Add `test:performance` and `performance:check`; insert performance before source-only package check; retain native test graph; update exact package-contract assertions.

- [ ] **Step 5: rerun performance and complete pipeline for GREEN**

Run: `pnpm --filter @evk-soft/ai-tooling run build && pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/candidate.spec.ts tests/integration/pure-pipeline.spec.ts tests/performance/resolver-budget.spec.ts tests/package/package-contract.spec.ts --passWithNoTests=false --reporter=verbose && pnpm --filter @evk-soft/ai-tooling run performance:check`

Expected GREEN: exit `0`; fresh build, script graph, fixed fixture/result digests, A/A calibration, five consumed runs, checkpoint/heap accounting, repeatability, CI/local budget classification, and zero report/repository writes pass.

### Task 8: Synchronize Durable Phase 2 Documentation

**Files:**

- Modify: `docs/ai-tooling/EXTENDING-PACKS.md`
- Modify: `docs/ai-tooling/SECURITY.md`
- Modify: `docs/system-overview/ai-tooling.md`

**Interfaces:**

- Consumes: only behavior proved GREEN in Tasks 1-7.
- Produces: durable descriptions of delivered Phase 2 contracts; no runtime/public API and no reverse delivery-document link.

- [ ] **Step 1: update `EXTENDING-PACKS.md` with exact delivered boundaries**

Document: Stage 1 accepts only the exact tracked local `configs/ai` source; recognized npm/git kinds are schema-valid but unavailable; invalid local selectors are a separate error; pack integrity hashes exact raw files and JCS inventory; ordered pack/override graph and stable IDs; `extend`/`replace`/`disable`; complete contributor provenance; committed override paths strictly under `ai/overrides`; no acquisition/cache/network; instruction-only resources; and canonical/source bytes remain authoritative.

- [ ] **Step 2: update `SECURITY.md` with exact trust/containment boundaries**

Document: Unicode 17 portable keys and Win32-invalid names; fixed native identity tuples; frozen Git executable/anchors/config/info/alternate state; no shell/filter/helper/lazy-fetch/remote call; exact NUL-delimited tracked proof; independent actual-tree inventory including ignored/untracked files; source/override/actual-tree size/count/path/deadline limits; declaration-independent executable rejection; and zero-write pure pipeline. Do not claim OS sandboxing, remote-source support, project output, mutation, or publication.

- [ ] **Step 3: update system overview with exact pipeline and performance evidence**

Document the exact read-only context/budget ownership, source capability order, contained tracked pack load, integrity, override graph, actual-asset gate, injected renderer boundary, candidate/diff identities, and 5,000/1,000/10,000 fixed stress fixture with calibration and CI budgets.

- [ ] **Step 4: run the documentation byte gate**

Run: `git diff --check -- docs/ai-tooling/EXTENDING-PACKS.md docs/ai-tooling/SECURITY.md docs/system-overview/ai-tooling.md`

Expected GREEN: exit `0`; documentation has LF and no trailing whitespace.

- [ ] **Step 5: prove no reverse delivery-document reference**

Run: `rg -n "2026-08-02-ai-tooling-stage-1|2026-08-01-ai-tooling-stage-1-safe-core-design" docs/ai-tooling/EXTENDING-PACKS.md docs/ai-tooling/SECURITY.md docs/system-overview/ai-tooling.md`

Expected GREEN: exit `1` with empty stdout.

- [ ] **Step 6: perform semantic documentation review**

Confirm every documented behavior has a named passing Task 1-7 test, unsupported acquisition/platform/mutation remains explicitly unavailable, public package/schema facts match package bytes, and no future Phase 3-5 behavior is described as delivered.

### Task 9: Phase 2 Final Gate, Exact Staging, Sole Commit, and Owner Stop

**Files:**

- Modify/Create: every path in the closed Phase 2 manifest and no other path.

**Interfaces:**

- Consumes: owner-approved Phase 1 base, all GREEN Task 1-8 outputs, immutable approved-base verifier, and committed Phase 2 manifest.
- Produces: one Phase 2 candidate commit and evidence; it does not authorize Phase 3, a push, PR, merge, tag, or publication.

- [ ] **Step 1: revalidate the bound base and prove the verifier is unchanged approved-base code**

Run in the same PowerShell session as the entry snapshot:

```powershell
if ($approvedBaseSha -cnotmatch '^[0-9a-f]{40}$') { throw 'approved base binding is absent or invalid' }
if ((git rev-parse HEAD).Trim() -cne $approvedBaseSha) { throw 'HEAD moved after the Phase 2 entry snapshot' }
git diff --exit-code $approvedBaseSha -- packages/ai-tooling/scripts/verify-phase-delta.mjs
if ($LASTEXITCODE -ne 0) { throw 'approved-base verifier bytes changed' }
```

Expected GREEN: exit `0` with empty stdout; `$approvedBaseSha` remains the full lowercase Phase 1 object ID and `HEAD` has not moved.

- [ ] **Step 2: run the complete pre-format gate**

Run each command separately:

```text
pnpm --filter @evk-soft/ai-tooling run typecheck
pnpm --filter @evk-soft/ai-tooling run test:unit
pnpm --filter @evk-soft/ai-tooling run test:integration
pnpm --filter @evk-soft/ai-tooling run build:native
pnpm --filter @evk-soft/ai-tooling run test:native
pnpm --filter @evk-soft/ai-tooling run performance:check
pnpm --filter @evk-soft/ai-tooling run build
pnpm --filter @evk-soft/ai-tooling run pack:check
node packages/ai-tooling/scripts/check-stage1-artifacts.mjs --phase 2 --tree
pnpm check
git diff --check
```

Expected GREEN: every command exits `0`; no suite passes with zero discovered tests; source-only tarball excludes the helper; artifact scan finds no private/absolute/executable/network/cache/license conflict.

- [ ] **Step 3: rerun every load-bearing regression family**

Rerun: Unicode source/license/table/corpus/locale vectors; unavailable npm/git/preview/bare URL; exact tracked/outside/untracked/workspace-alias/link/reparse/identity-race/limit source cases; frozen Git hostile config/filter/alternate/info/lazy-fetch/helper/timeout/100,000-path cases; override collision/orphan/base-digest/path/identity/limit cases; actual-asset executable/hidden/ignored/untracked/symlink/binary/limit cases; candidate semantic/ordering/repeatability/no-write cases; and resolver calibration/result-consumption/budget cases.

Expected GREEN: all named assertions pass, renderer/copy/write/network/acquisition/cache spies remain untouched on every preceding failure, and two complete pure resolutions are byte-identical.

- [ ] **Step 4: prove the index is empty before formatter write**

Run: `git diff --cached --quiet`

Expected GREEN: exit `0`.

- [ ] **Step 5: run only the hook-equivalent formatter**

Run: `pnpm -s exec biome check --write .`

Expected GREEN: exit `0`; do not run the hook's `git add -A`.

- [ ] **Step 6: verify exact worktree delta before staging**

Run: `node packages/ai-tooling/scripts/verify-phase-delta.mjs --phase 2 --worktree`

Expected GREEN: exit `0`; exact status/path/mode equals the committed Phase 2 manifest, the index is empty, and the approved-base verifier rejects any extra/missing/type/link/submodule/deletion/conflict/manifest drift.

- [ ] **Step 7: rerun the complete gate after formatter writes**

Run the exact Step 2 block again.

Expected GREEN: every command exits `0` against formatted working bytes.

- [ ] **Step 8: stage only exact Phase 2 manifest paths**

Run exactly:

```text
git add -- docs/ai-tooling/EXTENDING-PACKS.md
git add -- docs/ai-tooling/SECURITY.md
git add -- docs/system-overview/ai-tooling.md
git add -- packages/ai-tooling/native/win32-helper/CMakeLists.txt
git add -- packages/ai-tooling/native/win32-helper/main.cc
git add -- packages/ai-tooling/native/win32-helper/protocol.h
git add -- packages/ai-tooling/package.json
git add -- packages/ai-tooling/scripts/build-native.mjs
git add -- packages/ai-tooling/scripts/fetch-unicode-data.mjs
git add -- packages/ai-tooling/scripts/generate-unicode-case-fold.mjs
git add -- packages/ai-tooling/src/cli.ts
git add -- packages/ai-tooling/src/commands/pack.ts
git add -- packages/ai-tooling/src/config/load-config.ts
git add -- packages/ai-tooling/src/fs/read-only-repository-filesystem.ts
git add -- packages/ai-tooling/src/git/discovery.ts
git add -- packages/ai-tooling/src/git/index.ts
git add -- packages/ai-tooling/src/git/provider.ts
git add -- packages/ai-tooling/src/native/win32-helper.ts
git add -- packages/ai-tooling/src/pack/assets.ts
git add -- packages/ai-tooling/src/pack/integrity.ts
git add -- packages/ai-tooling/src/pack/load-local.ts
git add -- packages/ai-tooling/src/path/lexical.ts
git add -- packages/ai-tooling/src/path/portable-key.ts
git add -- packages/ai-tooling/src/path/unicode-case-fold-17.ts
git add -- packages/ai-tooling/src/path/unicode-nfc-17.ts
git add -- packages/ai-tooling/src/performance/resolver-budget.ts
git add -- packages/ai-tooling/src/repository/context.ts
git add -- packages/ai-tooling/src/resolve/candidate.ts
git add -- packages/ai-tooling/src/resolve/capabilities.ts
git add -- packages/ai-tooling/src/resolve/catalog.ts
git add -- packages/ai-tooling/src/resolve/diff.ts
git add -- packages/ai-tooling/src/resolve/graph.ts
git add -- packages/ai-tooling/src/resolve/overrides.ts
git add -- packages/ai-tooling/src/resolve/pipeline.ts
git add -- packages/ai-tooling/tests/fixtures/capabilities/vectors.json
git add -- packages/ai-tooling/tests/fixtures/config-sources/vectors.json
git add -- packages/ai-tooling/tests/fixtures/fake-git/provider.mjs
git add -- packages/ai-tooling/tests/fixtures/fake-git/swapped-provider.mjs
git add -- packages/ai-tooling/tests/fixtures/overrides/vectors.json
git add -- packages/ai-tooling/tests/fixtures/unicode-case-fold-v17.json
git add -- packages/ai-tooling/tests/fixtures/unicode-sources/invalid.json
git add -- packages/ai-tooling/tests/helpers/no-write-filesystem.ts
git add -- packages/ai-tooling/tests/integration/git-index.spec.ts
git add -- packages/ai-tooling/tests/integration/local-pack-source.spec.ts
git add -- packages/ai-tooling/tests/integration/pure-pipeline.spec.ts
git add -- packages/ai-tooling/tests/native/win32-helper.native.spec.ts
git add -- packages/ai-tooling/tests/package/package-contract.spec.ts
git add -- packages/ai-tooling/tests/package/unicode-table.spec.ts
git add -- packages/ai-tooling/tests/performance/resolver-budget.spec.ts
git add -- packages/ai-tooling/tests/unit/candidate.spec.ts
git add -- packages/ai-tooling/tests/unit/capabilities.spec.ts
git add -- packages/ai-tooling/tests/unit/catalog.spec.ts
git add -- packages/ai-tooling/tests/unit/git-discovery.spec.ts
git add -- packages/ai-tooling/tests/unit/git-provider.spec.ts
git add -- packages/ai-tooling/tests/unit/overrides.spec.ts
git add -- packages/ai-tooling/tests/unit/portable-key.spec.ts
git add -- packages/ai-tooling/tests/unit/source-capability.spec.ts
git add -- packages/ai-tooling/tests/unit/unicode-sources.spec.ts
git add -- packages/ai-tooling/tests/unit/win32-protocol.spec.ts
git add -- packages/ai-tooling/vendor/unicode-17/CaseFolding.txt
git add -- packages/ai-tooling/vendor/unicode-17/CompositionExclusions.txt
git add -- packages/ai-tooling/vendor/unicode-17/LICENSE.md
git add -- packages/ai-tooling/vendor/unicode-17/NormalizationTest.txt
git add -- packages/ai-tooling/vendor/unicode-17/SOURCES.json
git add -- packages/ai-tooling/vendor/unicode-17/SOURCES.schema.json
git add -- packages/ai-tooling/vendor/unicode-17/UnicodeData.txt
git add -- pnpm-lock.yaml
```

Expected GREEN: every manifest path has the exact expected status and mode and no other path is staged.

- [ ] **Step 9: run cached verifier and artifact gates**

Run exactly:

```text
git diff --cached --check
node packages/ai-tooling/scripts/verify-phase-delta.mjs --phase 2 --cached
node packages/ai-tooling/scripts/check-stage1-artifacts.mjs --phase 2 --cached
```

Expected GREEN: all exit `0`; the approved-base verifier loads the manifest from committed `HEAD`, rejects working/index manifest drift, and proves exact NUL status/path/mode equality with no link/submodule/extra/missing path.

- [ ] **Step 10: revalidate the immutable base and create the sole Phase 2 commit**

Run in the same PowerShell session:

```powershell
if ((git rev-parse HEAD).Trim() -cne $approvedBaseSha) { throw 'HEAD moved before the Phase 2 commit' }
git commit --no-verify -m "feat(ai): add the pure Stage 1 resolver"
$candidateSha = (git rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0 -or $candidateSha -cnotmatch '^[0-9a-f]{40}$') {
  throw 'Phase 2 candidate is not one full lowercase SHA-1'
}
if ($candidateSha -ceq $approvedBaseSha) { throw 'Phase 2 commit did not advance HEAD' }
$candidateSha
```

Expected GREEN: exactly one candidate commit is created; `$candidateSha` is the new full lowercase object ID and differs from `$approvedBaseSha`. `--no-verify` bypasses only the already-reproduced formatter plus unsafe broad staging and bypasses no other gate.

- [ ] **Step 11: verify the exact one-parent committed delta**

Run in the same PowerShell session with the two bound full lowercase IDs:

```powershell
if ((git rev-parse HEAD).Trim() -cne $candidateSha) { throw 'HEAD does not equal the Phase 2 candidate' }
node packages/ai-tooling/scripts/verify-phase-delta.mjs --phase 2 --base $approvedBaseSha --commit $candidateSha
if ($LASTEXITCODE -ne 0) { throw 'Phase 2 committed-delta verification failed' }
```

Expected GREEN: exit `0`; `HEAD` resolves to the candidate, raw commit has exactly one literal parent equal to the approved base, exact parsed tree diff equals the Phase 2 manifest, and no revision traversal/graft/shallow/replace/lazy-fetch behavior changes the result.

- [ ] **Step 12: rerun committed-byte evidence**

Run the complete Step 2 gate against committed `HEAD`; require `git status --short --branch` clean. Record branch, full candidate SHA, base SHA, `git log --oneline main..HEAD`, all exact test counts, Unicode source lengths/hashes/license review, generated-table digest, native helper/hash result, Git/provider hostile-fixture counts, performance JSON, package tarball digest, and artifact scan result.

- [ ] **Step 13: report and stop**

Report the exact candidate SHA and evidence to the owner. Stop. Do not begin Phase 3, push a branch, open a PR, merge, tag, or publish until separately authorized.
