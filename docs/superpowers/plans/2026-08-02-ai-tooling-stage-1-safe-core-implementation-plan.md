# AI Tooling Stage 1 Safe Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and self-host the approved Stage 1 safe core: a public instruction-only
`@evk-soft/ai-pack-core`, a public `@evk-soft/ai-tooling` engine, deterministic Codex and Claude
Code project outputs, read-only verification, and journaled safe mutation and recovery.

**Architecture:** `configs/ai/**` is the only canonical EVK content source. The tooling package
strict-parses and validates canonical metadata, resolves a tracked local pack plus project overrides
into one effective catalog, renders an adapter-neutral candidate, then either reports it read-only or
applies it through one containment and transaction boundary. Platform outputs and
`ai-tooling.lock.json` are generated, integrity-recorded artifacts; user edits live only under
`ai/overrides/**`. First creation of the ignored `.ai-tooling` root plus its exact `transactions`,
`backups`, and `stale-locks` infrastructure children is an idempotent structural prerequisite after
plan acceptance, not a new recovery protocol or an extra root-level lock; the approved
`.ai-tooling/run.lock` remains the sole transaction authority.

**Tech Stack:** Node.js 24+, TypeScript 6.0.3 ESM, pnpm 11.20.0, Vitest 4.1.10, Ajv 8.20.0,
`jsonc-parser` 3.3.1, `json-canonicalize` 2.0.0, JSON Schema draft 2020-12, Unicode 17.0.0 data,
Biome 2.5.6, Git 2.36.0+ for runtime index/census queries, Git 2.45.0+ for plan-phase and artifact
object-reading gates, and one internal Win32 C++ helper built with the GitHub Windows runner's
MSVC toolchain.

## Global Constraints

**Status:** Awaiting owner approval. This plan does not authorize implementation.

This file is the Stage 1 master contract and execution index. Its non-checkbox lists are normative
requirements, not executable steps. The five self-contained phase plans named below contain every
2-5 minute checkbox step, literal test and fixture code, exact RED/GREEN command, minimal production
code, phase gate, and owner stop required for implementation by `superpowers:writing-plans`; this
master contains only the separately gated documentation-decommission checkbox task.

Implement only approved Stage 1. Do not add remote acquisition, cache,
preview activation, adoption, hooks, plugins, capability installation, extra platform adapters,
publication, source-code intelligence, or umbrella Stages 2-5. Keep schemas and metadata in strict
standard JSON and instructions in Markdown. Do not copy any byte from the private UNLICENSED
prototype. Do not write real user platform configuration in tests. Preserve one implementation
commit per phase and require owner approval before the next phase.

---

## 0. Approval, baseline, and execution protocol

### 0.1 Approved design input

This plan implements the written design approved on 2026-08-02 and committed as
`2eb8e7e90991f73bde27fb62277670ca9646e9e4` (`docs(ai): approve R4 tooling design`). The approved
child specification remains the requirement source until the final decommission task.

The plan itself must receive the exact owner approval `approve Stage 1 implementation plan and start
Phase 1` before any package, source, schema, generated output, hook, dependency, or workflow change
is made. Approval of this plan authorizes Phase 1 only. Each later phase requires its own explicit
owner approval.

### 0.1a Executable phase plans

Execute only the plan for the currently approved phase:

- Phase 1: `docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-1-implementation.md`
- Phase 2: `docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-2-implementation.md`
- Phase 3: `docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-3-implementation.md`
- Phase 4: `docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-4-implementation.md`
- Phase 5: `docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-5-implementation.md`

Each phase plan repeats its own Files, Interfaces, test code, implementation code, commands, expected
results, manifest authority, and owner stop. This master remains the shared cross-phase contract; if a
phase plan and this master differ, stop and obtain a written amendment rather than choosing one.

### 0.2 Dirty-worktree prerequisite

The current checkout is intentionally not an execution worktree. It contains owner changes to root
tooling versions and Biome presets plus `.idea/**`. They are not part of this plan and must not enter
any Stage 1 phase commit accidentally.

- After plan approval, commit this master, its five executable phase plans, and its five plan-owned
  phase manifests with message
  `docs(ai): add Stage 1 implementation plan`. Use exactly:

```text
git add -- docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-safe-core-implementation-plan.md
git add -- docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-1-implementation.md
git add -- docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-2-implementation.md
git add -- docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-3-implementation.md
git add -- docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-4-implementation.md
git add -- docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-5-implementation.md
git add -- docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-1.txt
git add -- docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-2.txt
git add -- docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-3.txt
git add -- docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-4.txt
git add -- docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-5.txt
git diff --cached --name-only
git diff --cached --check
git commit --no-verify -m "docs(ai): add Stage 1 implementation plan"
```

  The name-only command must print exactly those eleven sorted paths and nothing else. `--no-verify` is
  required because the current hook formats and stages unrelated owner files; it does not waive
  either diff check. The manifests are review data, not implementation.
- Then place the owner tooling changes in a separate owner-approved baseline
  commit. Any authorized `.idea/**` commit is also an owner baseline decision, never a Stage 1 phase
  change. Do not use `git stash` and do not mix either set into a Stage 1 phase commit.
- Re-freeze `branch`, `HEAD`, `main`, `git status --short --branch`, and `git log --oneline
  main..HEAD` after that decision.
- Confirm that the execution baseline contains Node `>=24.0.0`, pnpm `11.20.0`, TypeScript
  `6.0.3`, and Biome `2.5.6`. If the owner baseline differs, stop and update this plan before coding.

### 0.3 Per-phase worktree and commit protocol

For each of Phases 1-5:

- Use `superpowers:using-git-worktrees` to create a new clean worktree from the owner-approved
  preceding phase commit.
- Before the first phase snapshot, resolve `git` once from the caller's initial `PATH` to an
  absolute no-link regular file, require version `>=2.45.0`, freeze/revalidate its native identity around every phase-delta query,
  and invoke only that path with `shell: false`. Create one exclusive private temporary config root
  containing exact zero-byte global-config, excludes, and attributes files. Remove inherited `GIT_CONFIG_*`,
  repository/worktree/index/object/replace-ref routing variables, then set `GIT_CONFIG_NOSYSTEM=1`,
  `GIT_CONFIG_GLOBAL=<private-empty-config>`, `GIT_ATTR_NOSYSTEM=1`, `GIT_OPTIONAL_LOCKS=0`,
  `GIT_NO_REPLACE_OBJECTS=1`, `GIT_NO_LAZY_FETCH=1`, and `GIT_LITERAL_PATHSPECS=1`; every query also passes global
  `--no-replace-objects --no-lazy-fetch --literal-pathspecs`, `-c core.excludesFile=<private-empty-excludes>`,
  `-c core.attributesFile=<private-empty-attributes>`, `-c core.fsmonitor=false`, and
  `-c core.untrackedCache=false`. Remove `GIT_EXTERNAL_DIFF` and pass
  `--no-ext-diff --no-textconv` to every diff-family query.
  Revalidate and verified-clean the private root only after all child processes/streams are quiescent.
  In Phase 1, use this exact operator-visible provider contract for the direct comparison; in Phases
  2-5 the approved-base verifier enforces it itself.
- Record `git branch --show-current`, `git rev-parse HEAD`, `git status --short --branch`, and
  `git log --oneline main..HEAD` before edits.
- Run `pnpm install --frozen-lockfile --ignore-scripts` in the isolated worktree before tests.
  Require a clean status afterward; lifecycle scripts, including Husky, must not run during setup.
- Run the phase-specific red test before each implementation unit and retain the failure reason.
- Run the focused green test after the smallest implementation change.
- Run every phase check executable on the current OS, `pnpm check`, `git diff --check`, and the
  artifact scan before staging.
- Require `git diff --cached --quiet`, then run the first real hook command exactly as committed:
  `pnpm -s exec biome check --write .`.
  Never run the hook's `git add -A`. Immediately require every tracked and untracked change reported
  by `git status --porcelain=v1 -z --untracked-files=all --ignore-submodules=all` to be an exact path/status/type permitted by
  the phase manifest. In Phase 1, retain `git status` plus `git ls-files --stage` and have the owner
  compare them directly with the committed Phase 1 manifest. In Phases 2-5, run
  `node packages/ai-tooling/scripts/verify-phase-delta.mjs --phase N --worktree` from the unchanged
  approved-base verifier. If Biome changes any path outside the manifest, stop without staging or
  committing and repair the phase scope. Re-run the current-OS checks and artifact scan after the
  formatter write.
- Stage only the exact paths named by the plan-owned
  `docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-N.txt`, using an explicit `git add --`
  argument for each path. Each LF line is `A 100644 path`, `M 100644 path`, or `D - path`; paths use a
  strict ASCII grammar `[A-Za-z0-9._/-]+`, contain no empty/dot components, and are sorted by raw byte.
- Run `git diff --cached --check`,
  `node packages/ai-tooling/scripts/verify-phase-delta.mjs --phase N --cached`, and
  `node packages/ai-tooling/scripts/check-stage1-artifacts.mjs --phase N --cached`. The verifier strict-
  decodes the manifest as UTF-8, rejects CR, blank/duplicate/unsorted/non-ASCII paths, loads its bytes
  from committed `HEAD` with `git show HEAD:<manifest-path>`, and rejects any working/index copy drift.
  It compares the NUL-delimited `git diff --cached --name-status --no-renames -z` result plus Git index
  mode/type for exact status/path/kind equality, rejects `T/U/X/B`, symlinks, submodules, unexpected
  deletions, and every extra or missing path. The prose allowlist is explanatory; this committed
  manifest is the fail-closed authority. Every Git call made by the verifier uses the frozen provider
  above; `show`, raw commit/tree reads, tree diff, status, and index reads cannot use replacement objects or ambient
  system/global configuration.
- Because `.husky/pre-commit` would repeat the now-proven formatter write and then execute the
  unsafe broad staging command `git add -A`, use `git commit --no-verify` only after the exact hook-
  formatter command, manifest-scoped worktree check, explicit staging, cached verifier, and all other
  gates above pass in the isolated worktree. Do not disable any other check.
- Before the phase's single candidate commit, bind `$approvedBaseSha = (git rev-parse HEAD).Trim()`
  and reject anything except one lowercase 40-hex object ID. Run the exact literal commit command in
  the executable phase plan, then bind `$candidateSha = (git rev-parse HEAD).Trim()` and apply the same
  validation. The phase plan invokes `verify-phase-delta.mjs` with its literal phase number and those
  two bound variables. Commit mode re-resolves `HEAD` to the exact candidate ID, loads the manifest from the
  exact approved-base object, and never treats `HEAD^`, revision traversal, `rev-list`, grafts, or
  shallow metadata as ancestry authority. It reads both exact commit objects with fixed
  `cat-file commit <full-oid>` under no-replace/no-lazy-fetch, strict-parses their bounded raw headers,
  and requires the candidate to contain exactly one literal `parent $approvedBaseSha` line. It then
  compares the two exact parsed tree object IDs directly with fixed no-renames NUL-delimited tree-diff
  and mode queries. Zero/multiple/different parents, malformed raw headers, or an object/ref race blocks.
  Re-run every current-OS check against committed `HEAD` and verify the worktree is clean.
- For Phases 3-5, stop and request separate owner authorization to push the candidate commit to
  exactly `codex/ai-tooling-stage1-validation`. Before any authorized push, require both
  `git remote get-url --all origin` and `git remote get-url --all --push origin` to each return exactly
  `https://github.com/evk-soft/devkit.git`; any absent, additional, or different fetch/push identity
  blocks. Then push with
  `git push origin HEAD:refs/heads/codex/ai-tooling-stage1-validation`. Plan/phase approval never
  authorizes a push, PR, or publication. Run `node
  packages/ai-tooling/scripts/await-native-validation.mjs --host github.com --repo
  github.com/evk-soft/devkit --workflow ai-tooling.yml --branch
  codex/ai-tooling-stage1-validation --timeout-seconds 2700`. The script freezes the exact local
  repository/`HEAD` and operator-trusted Git/GitHub CLI executable identities, polls bounded
  repository-scoped `gh run list/view --json` calls, requires exactly one upstream push run for that
  branch/SHA and exactly the three expected matrix jobs, and exits only when all succeed. If it fails,
  repair in the same
  worktree, rerun local gates, amend the sole phase commit with `git commit --amend --no-edit
  --no-verify`, and—only under the same explicit validation authorization—update the temporary branch
  by first running `git fetch --no-tags origin
  refs/heads/codex/ai-tooling-stage1-validation:refs/remotes/origin/codex/ai-tooling-stage1-validation` and
  then `git push --force-with-lease=refs/heads/codex/ai-tooling-stage1-validation origin
  HEAD:refs/heads/codex/ai-tooling-stage1-validation`. The phase SHA is final only when the
  workflow run for that exact SHA has green Windows, Linux, and macOS jobs.
- Publish the final exact commit SHA and local/native evidence to the owner.
- Stop. Do not start the next phase until the owner approves that exact phase commit.

No intermediate implementation commit is permitted inside a phase. If a phase must be split, stop
and obtain a written design amendment first; do not silently create a sixth implementation phase.
For Phase 1 only, the verifier does not yet exist in the approved base: use the committed plan-owned
manifest plus direct frozen-provider `git diff --cached --name-status --no-renames` and
`git ls-files --stage` output with the exact isolation/options above, and have the owner independently
compare the literal set before the candidate commit. For Phases 2-5,
first require `git diff --exit-code HEAD -- packages/ai-tooling/scripts/verify-phase-delta.mjs`; execute
only those approved-base bytes. The verifier path is absent from all Phase 2-5 manifests.

The temporary validation branch is evidence transport only; do not open a PR, merge, tag, publish, or
start the next phase from it without the separate owner gate.

## 1. Recorded implementation choices

Owner approval of this plan approves the following implementation choices. Choices that add a
fail-closed operational limit or harden an under-specified platform boundary are explicit here and are
not silently inferred during coding.

### IC-1: strict JSON and duplicate detection

Use `jsonc-parser@3.3.1` only as a lexical parser. Call `visit` with
`disallowComments: true` and `allowTrailingComma: false`, collect every parser error, and maintain an
object-scope stack of raw decoded property names to reject duplicates before `JSON.parse` can discard
them. Reject a UTF-8 BOM before visiting. Then walk the parsed value to reject lone surrogates,
non-finite numbers, and only numbers whose mathematical decimal value does not survive the
source-token → IEEE-754 parse → ECMAScript shortest-number serialization round trip. Parse both the
source token and `JSON.stringify(parsedNumber)` into a sign, integer significand, and base-10 exponent;
strip insignificant zeros and compare those exact `bigint` decimal representations. Thus `1.0`,
`0.1`, and exactly representable `9007199254740992` are accepted, while `9007199254740993`,
`333333333.33333329`, finite-to-zero underflow, and overflow are rejected. `Number.isSafeInteger` is
never an acceptance rule. The standalone JCS wrapper still runs every official RFC 8785 vector over
already-parsed IEEE-754 values. No JSONC recovery result enters schema validation.

```ts
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

export function parseStrictJson(
  bytes: Uint8Array,
  source: RedactedSource,
): StrictJsonDocument;
```

`RedactedSource.label` is either `null` or a prevalidated logical package/resource ID of at most 256
UTF-8 bytes; it is never a filesystem path, URL, token, source fragment, or caller-supplied free text.
`NumberToken.offset` and `length` are UTF-8 byte positions in `sourceBytes`, not JavaScript UTF-16
indices. The fatal decoder builds and bounds an explicit UTF-16-to-UTF-8 offset map; multibyte and
surrogate-pair fixtures lock the conversion.

### IC-2: offline JSON Schema validation

Use `ajv@8.20.0` through `ajv/dist/2020.js`. Construct one `Ajv2020` instance with
`strict: true`, `allErrors: true`, `validateFormats: false`, `useDefaults: false`,
`coerceTypes: false`, `removeAdditional: false`, and no `loadSchema` function. Add the
seven source schema objects under their exact absolute `$id` values before compiling any root.
Ajv's bundled draft 2020-12 metaschema and vocabularies are the only non-product schemas. A test
blocks `http`, `https`, DNS, and proxy access while compiling every root from an empty application
registry.

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

### IC-3: RFC 8785 JCS

Use `json-canonicalize@2.0.0` only after the strict JSON-domain walk. Call
`canonicalizeEx(value, { allowCircular: false, filterUndefined: false,
undefinedInArrayToNull: false })`; treat a non-string result as an internal error. Lock the wrapper to
the RFC 8785 published vectors plus the approved config equal/non-equal vectors. JCS never renders a
human-readable file and never normalizes Unicode.

```ts
export function jcsBytes(value: JsonValue): Uint8Array {
  const text = canonicalizeEx(value, {
    allowCircular: false,
    filterUndefined: false,
    undefinedInArrayToNull: false,
  });
  if (typeof text !== 'string') throw internal('JCS serializer returned no text');
  return new TextEncoder().encode(text);
}
```

### IC-4: test and build runner

Use `vitest@4.1.10` and `@vitest/coverage-v8@4.1.10` with one fork and explicit per-suite timeouts;
pin `@types/node@24.13.3` so compilation cannot accidentally use Node 26-only APIs. Use
`tsc --build` for production ESM and declaration output. Final package scripts are exactly:

```json
{
  "build": "tsc --build tsconfig.json",
  "build:native": "node scripts/build-native.mjs",
  "typecheck": "tsc --project tsconfig.json --noEmit --pretty false",
  "test:unit": "vitest run tests/unit tests/package tests/security",
  "test:integration": "vitest run tests/integration",
  "test:native": "pnpm run build:native && vitest run tests/native",
  "test": "pnpm run test:unit && pnpm run test:integration && pnpm run test:native",
  "test:performance": "vitest run tests/performance",
  "performance:check": "pnpm run test:performance && pnpm run build && node --expose-gc dist/performance/resolver-budget.js --json",
  "pack:check": "pnpm run build && pnpm run build:native && node scripts/check-package-contents.mjs",
  "check": "pnpm run typecheck && pnpm run test && pnpm run performance:check && pnpm run pack:check"
}
```

Do not install that final script graph before its suites exist. Phase 1 omits `test:native`,
`test:performance`, `performance:check`, and `build:native`; its `test` is
`pnpm run test:unit && pnpm run test:integration`, and its `check` is
`pnpm run typecheck && pnpm run test && pnpm run pack:check`. Phase 2 adds `build:native`,
`test:native`, `test:performance`, and `performance:check`; native testing is appended to `test`, and
performance is inserted before the still source-only `pack:check`. This is required before the
Windows read-only filesystem can claim the shared identity contract. Phase 3 keeps those scripts and
replaces `pack:check` with the final native-aware command, reaching the exact object above.
Package-contract tests assert the exact phase-local shape
so a nonexistent suite can never pass through a pass-with-no-tests option.

`pack:check` is a source-build/package-contract gate, not a publication claim. It always creates a
private exclusive staging root, performs a fresh portable TypeScript build directly into that root,
copies only the explicit manifest/static allowlist, and runs the frozen workspace-pinned pnpm launcher
there with exact argv `--ignore-scripts --ignore-pnpmfile pack --json --pack-destination
<private-contained-destination>`. It never packs,
walks, or copies the working package's `dist` directory. The Phase 2 native test builds the minimal
identity helper into working `dist/native` for source/native tests, but the Phase 2 source-only staging
path cannot include it. Starting in Phase 3, the checker invokes `build-native.mjs` again with the
validated staging output root; its `win32-x64` tarball requires that newly built helper and hash manifest.
Linux x64 and macOS arm64 runs require no foreign executable and report the tarball as non-publishable
while still validating all portable entries. Phase 5 runs
`node scripts/check-package-contents.mjs --publishable --json` only on `win32-x64`; that mode rejects
every other tuple, requires the helper, and is the sole canonical tarball evidence. No mode invokes a
registry or publish command.

Root scripts are exactly `"check:ai-tooling": "pnpm --filter @evk-soft/ai-tooling run check"` and
`"check": "pnpm run check:biome && pnpm run check:runtime && pnpm run check:ai-tooling"`. Tests
import source modules; package-contract tests import the built package.

### IC-5: Unicode portable keys

Pin `@unicode/unicode-17.0.0@1.6.17` as a development-only dependency. During Phase 2, download
`UnicodeData.txt`, `CompositionExclusions.txt`, `NormalizationTest.txt`, and `CaseFolding.txt` from their exact
`https://www.unicode.org/Public/17.0.0/ucd/` URLs and the license from
`https://www.unicode.org/license.txt`; compute SHA-256 locally, record URL/length/hash in
`vendor/unicode-17/SOURCES.json`, and vendor the bytes. Unicode does not publish companion hashes, so
the plan does not claim an upstream checksum. A generator parses the vendored normative
`CaseFolding.txt`, selects only statuses `C` and `F`, cross-checks those mappings against the package's
`Case_Folding/C` and `Case_Folding/F` exports, and combines them with the vendored canonical
decomposition, combining-class, composition-exclusion, and Hangul rules. It rejects duplicate source
code points, sorts by code point, and writes checked-in TypeScript case-fold and NFC tables with all
input versions and hashes. Runtime uses neither ICU normalization nor ICU case conversion and no
locale. For each path component:

```ts
export function portableComponentKey(component: string): string {
  validatePortableComponent(component);
  return nfc17(fullDefaultCaseFold17(nfc17(component)));
}
```

`validatePortableComponent` runs before portable keying and before any provider or filesystem
operation. It enforces the approved empty/dot/separator/drive/UNC/percent rules and the following
OS-independent Win32-safe component grammar: reject U+0000 through U+001F, `<`, `>`, `:`, `"`, `|`,
`?`, `*`, a trailing U+0020 space or U+002E full stop, and a case-insensitive DOS-device basename
`CON`, `PRN`, `AUX`, `NUL`, `COM1` through `COM9`, `LPT1` through `LPT9`, or the Win32-equivalent
ISO-8859-1 superscript forms `COM¹`/`COM²`/`COM³` and `LPT¹`/`LPT²`/`LPT³`, including when followed by
an extension. These are validation failures, never alternate spellings. Turkic `T` and simple `S`
mappings are excluded. `/` joins component keys only after every component passes this lexical
validation. The complete official Unicode 17 normalization corpus must pass;
`String.prototype.normalize` is forbidden in the portable-key module.

### IC-6: fixed Git provider and index query

Resolve and freeze `git` once through the caller's initial `PATH`, require version `>=2.36.0`, and
invoke only the absolute executable with `shell: false`. Build an empty-base OS environment; inherit
no `GIT_*` name, including `GIT_DIR`, `GIT_WORK_TREE`, `GIT_COMMON_DIR`, `GIT_INDEX_FILE`,
`GIT_OBJECT_DIRECTORY`, `GIT_ALTERNATE_OBJECT_DIRECTORIES`, replace-ref routing, or
`GIT_CONFIG_COUNT`/`GIT_CONFIG_KEY_*`/`GIT_CONFIG_VALUE_*`. Set only the provider-owned fixed Git
variables: `GIT_CONFIG_NOSYSTEM=1`, an empty `GIT_CONFIG_GLOBAL`, `GIT_ATTR_NOSYSTEM=1`,
`GIT_OPTIONAL_LOCKS=0`, `GIT_NO_REPLACE_OBJECTS=1`, `GIT_NO_LAZY_FETCH=1`, and
`GIT_LITERAL_PATHSPECS=1`. Every repository
query passes global `--no-replace-objects` and
`--literal-pathspecs`, validated absolute `--git-dir`
and `--work-tree` arguments, and:

```text
-c core.excludesFile=<tool-empty-file>
-c core.attributesFile=<tool-empty-attributes-file>
-c core.fsmonitor=false
-c core.untrackedCache=false
```

At context construction, create one randomized private owner-only directory exclusively below a
caller-trusted temporary parent. Direct-create exactly three zero-byte regular files inside it—global
config, excludes, and attributes—without following links; capture root/file identities and zero-byte
SHA-256. Set `GIT_CONFIG_GLOBAL`, `core.excludesFile`, and `core.attributesFile` only to those respective
canonical paths. Before and after every Git spawn, revalidate the root and all three file identities,
length, digest, and containment;
a pre-existing path, link/reparse, nonzero byte, identity swap, or unreadable observation fails before
Git code is launched. After every Git child/tree and stream is quiescent, verified-delete only those
files and same-identity empty root. Cleanup/termination uncertainty preserves the directory and reports
only a redacted basename/recovery action. Fixtures poison all three names, swap them before/during a
query, inject cleanup races, and prove no ambient global excludes/attributes bytes influence results.

Tracked-pack proof uses fixed-argv `ls-files -z --full-name --cached --stage -- configs/ai` plus stable
`status --porcelain=v1 -z --untracked-files=all --no-renames --ignore-submodules=all -- configs/ai`; it never places declared
paths on argv and never parses `ls-files --debug` (whose format is non-normative). Fatal-parse the
complete closed stage/status maps, compare them with the validated declaration and filesystem
tree, and require one ordinary stage-0 `100644` nonzero object ID for every accepted declared file.
Reject the stable porcelain-v1 intent-to-add shape produced by real `git add -N`, plus submodule,
symlink, executable, conflict, missing, or extra entries. Include a valid 100,000-path/maximum-aggregate fixture
whose declared argv would exceed both Windows and POSIX limits and require the same two constant-size
Git argument vectors. Except for IC-16's two bounded repository-artifact batch
sessions, every Git discovery/version/query process has a 30-second
deadline, 64 KiB stderr ring, no stdin/pager/editor, and a five-second reap deadline after termination;
timeout or unverified exit fails closed.
The provider never permits Git to obtain a missing promisor object. Closed runtime requests available
on Git 2.36.0-2.44.x (`ls-files`, `status`, and `check-ignore`) do not intentionally stream arbitrary
blob bodies but may require local index/commit/tree objects; they still set `GIT_NO_LAZY_FETCH=1`, and
any required missing object fails locally. A hostile status fixture removes an object actually needed
for its HEAD/index comparison, while all three request kinds retain a remote-helper marker; none may
start that helper. Every phase-
verifier or artifact mode that may resolve/read object contents first requires Git `>=2.45.0` and then
passes both global `--no-lazy-fetch` and `GIT_NO_LAZY_FETCH=1`. On an older Git that mode returns a
capability-unavailable result before spawn. A missing object is a local blocking error, never a fetch
opportunity.

Discover anchors without an ambient Git query. Starting from the exact startup directory, walk
existing ancestors with no-follow identity checks until the first `.git` entry. A `.git` directory is
the Git dir; a regular gitfile must contain exactly one LF-terminated `gitdir: <path>` line. Version 1
accepts only a same-host local path: on Windows, either an ordinary fully qualified drive path or a
validated relative linked-worktree path; on POSIX, either one ordinary single-root absolute path or a
validated relative linked-worktree path. Before lookup, reject URL/scheme, tilde, NUL/control,
Win32 UNC/device/root-relative/drive-relative, POSIX `//`, and foreign path forms. Apply the same
grammar to the one LF-terminated `commondir` payload. Resolve relative values only against their
Git-defined frozen base and preserve absolute values exactly. Reject bare repos, links/reparse points,
malformed/extra lines, missing/non-directory targets, and ambiguous roots. Open and freeze the
worktree root, `.git` marker, resolved Git dir, common Git dir, common `config`, and—only when the
common config strictly enables `extensions.worktreeConfig`—the exact per-worktree `config.worktree`.
A linked admin dir must contain regular `HEAD`, `commondir`, and `gitdir` files; its `gitdir` back-
reference must resolve exactly to the discovered worktree `.git` file, and the common dir must contain
no-follow `objects` and `refs` directories.

Before the first normal repository command, run one fixed, bounded preflight for each frozen config:
the same isolated executable invokes `config --file <provider-owned-frozen-path> --no-includes -z
--list`, with no repository discovery. Strict-parse the complete NUL records and reject any
case-insensitive `include.path`, `includeIf.*.path`, or `filter.*` key, including clean/process/smudge/
required fields; an include is forbidden whether its value is absolute, relative, tilde-based,
URL-like, or currently missing. Permit zero or exactly one case-insensitive
`extensions.worktreeConfig` record, with value exactly canonical ASCII `true` or `false`; reject
duplicates and every empty/numeric/yes/on/other spelling instead of inheriting Git's last-value Boolean
semantics. The common-config result alone selects the next file: exact `true` requires one frozen
`config.worktree`, while false or absence requires that path to be absent. A missing required,
unexpected present, changed, malformed, or unbounded config blocks.
Identity/digest/length-bracket every config preflight and revalidate the same config identities before
and after each later Git command.

Also require both `objects/info/alternates` and `objects/info/http-alternates` to be absent under the
frozen common Git dir; any file, directory, link/reparse, unreadable state, or identity race blocks.
Together with the exact environment's absence of `GIT_ALTERNATE_OBJECT_DIRECTORIES`, this means Stage 1
does not support alternate object stores. Treat optional common-dir `info/exclude` as the approved
repository-owner ignore source and optional `info/attributes` as repository-owner metadata: each must
be absent or one bounded no-follow regular file contained in the frozen common dir, and each present
file's identity/digest/length is bracketed. A link/reparse, other kind, external resolution, or change
blocks. Revalidate both alternate absences and both optional info-file observations before and after
every normal Git command and at both ends of each IC-16 object-batch session. Then pass the frozen
absolute `--git-dir` and `--work-tree`, so `core.worktree`, Git routing variables, parent discovery, a
changed gitfile, external config includes, configured filter commands, global attributes, and alternate
object databases cannot redirect a query, execute helper code, or redirect an object read. Ordinary
contained Git admin storage—index, refs, and the primary object database—remains repository-owner
operational input rather than an OS sandbox boundary; Stage 1's claim here is closed command/config/
helper/network routing, not exhaustive validation of every internal Git storage byte.

Checkout census uses four queries. Listing A is the union of stage-aware tracked
`ls-files -z --full-name --cached --stage --` and untracked
`ls-files -z --full-name --others --exclude-standard --`; after all bracketed reads, listing B repeats
those same two commands. Parse raw NUL-delimited bytes, reject absolute/invalid/duplicate paths, and
sort by portable key plus original bytes. Each entry records only kind and SHA-256 or exact link target,
as required by the approved contract. Open/lstat identity is checked before and after each read/link
query and again after the second listing; both path sets, identities, content observations, and the
complete A/B unions must agree. Any hybrid snapshot, list change, read failure, timeout, or bound
breach is an unverified census, never an unchanged result.

### IC-7: measurable performance budgets

Use the standalone built harness command
`node --expose-gc packages/ai-tooling/dist/performance/resolver-budget.js --json`. One isolated child
loads a fixed-seed fixture with 5,000 resources, 1,000 overrides, and 10,000 adapter leaves, validates
its fixture SHA-256, performs one unmeasured warm-up, then five measured runs using
`performance.now()`. Before each run it drops the prior result, calls `global.gc()` twice, records
`v8.getHeapStatistics().used_heap_size`, resolves while sampling the same counter at each 256-item
pipeline checkpoint, hashes and asserts the complete candidate result, then records peak minus the
baseline. The fixture remains allocated, so the reported increase is resolver-owned by definition.

Before product timing, two identical seven-run SHA-256 calibration samples consume the same 64 MiB
seeded buffer. Reject the runner as `environment-unstable` unless both result hashes agree, the ratio
of larger/smaller sample medians is at most 1.20, and every sample is at most 1.30 times its own median.
This is an infrastructure failure, not a product pass. The JSON output has exact fields
`schemaVersion`, `fixtureDigest`, `resultDigest`, `calibrationMsA`, `calibrationMsB`, `durationsMs`,
`medianMs`, `maxMs`, and `peakHeapGrowthBytes`; all numeric arrays contain finite nonnegative numbers.
On each native CI runner, median must be below 2,000 ms, every run below 3,000 ms, and peak growth below
268,435,456 bytes. Timing is informational on developer machines but blocking in native CI. Graph
correctness, digest consumption, and byte-repeatability are blocking everywhere.

### IC-8: Biome exclusions and native workflow

The Phase 3 human-authored root `biome.json` change adds this exact Biome 2.5 shape after `extends`:

```json
"files": {
  "includes": ["**", "!!ai-tooling.lock.json", "!!AGENTS.md", "!!CLAUDE.md", "!!.agents", "!!.claude"]
}
```

The list deliberately uses ordered force-ignore exclusions because these instruction/lock artifacts
provide no source-type information and must be excluded from scanning as well as check, format, lint,
and assist actions. The Phase 3 workflow uses an explicit matrix for `ubuntu-24.04` x64,
`windows-2025` x64, and `macos-15` arm64, Node 24, pnpm 11.20.0, `HUSKY=0`, frozen install, package
build, unit/integration/native tests, and read-only CLI fixtures. It never executes a real self-host
mutation.

Those three OS/architecture tuples are the complete Stage 1 native support claim. The package ships
only `win32-x64` helper bytes. On every other tuple, a command that requires native filesystem,
formatter, process-liveness, or mutation support fails before the operation begins with
`EVK_CONFIG_CAPABILITY_UNAVAILABLE` and reason `unsupported-native-platform`; it does not fall back to
an unchecked implementation. Pure pack parsing/building remains architecture-independent.

### IC-9: executable lookup, identity, and process trees

Direct lookup is an internal deterministic PATH walk; it never calls `which`, `where`, a shell, or a
package manager. POSIX joins each caller-PATH directory to the exact bare token and requires a regular
`X_OK` file. Windows uses the exact path-like `.com`/`.exe` token or, for a bare extensionless token,
tries only the literal name, `.COM`, then `.EXE` in each caller-PATH directory; caller `PATHEXT` and
all wrapper extensions are ignored. POSIX identity is
`{dev, ino, mode, size, ctimeNs, mtimeNs, sha256}` from an open
file descriptor with `fstat({ bigint: true })` before and after hashing. Windows identity is
`{volumeSerial, fileId128, attributes, size, creationTime, lastWriteTime, sha256}` from
`GetFileInformationByHandleEx(FileIdInfo)` and `GetFileInformationByHandle` through the internal
helper plus a hash bracketed by handle-identity checks. Every identity and containment relation is
revalidated immediately before spawn.

POSIX launches with Node `spawn(frozenExecutable, exactArgv, { detached: true, shell: false,
cwd, env })`, making the child a process-group leader. It signals `-pid`, probes the group with
`kill(-pid, 0)`, and drains stdout/stderr into
separate 65,536-byte ring buffers until EOF.

Both formatter modes receive an environment constructed from an empty map. Common keys are
disposable `HOME`, `XDG_CONFIG_HOME`, `XDG_CACHE_HOME`, `XDG_DATA_HOME`, `TMPDIR`, `TMP`, `TEMP`, and
`NO_COLOR=1`. POSIX adds exactly `PATH=/usr/bin:/bin`, `LANG=C`, and `LC_ALL=C`. Windows adds
disposable `USERPROFILE`, `APPDATA`, and `LOCALAPPDATA`; sets both `SystemRoot` and `WINDIR` to the
same canonical value returned by `GetSystemWindowsDirectoryW`; sets `PATH` to exactly that directory,
its `System32` child, and `System32\Wbem`, joined with `;`; and sets `PATHEXT=.COM;.EXE`. No caller key
is inherited or may override these values.

Windows uses one internal, non-exported `ai-tooling-win32-helper.exe`. The helper protocol is a
versioned length-prefixed binary request/response; no command line contains provider paths or argv.
The helper obtains the canonical Windows directory with `GetSystemWindowsDirectoryW`, creates a Job
Object with `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`, and creates only the required pipe handles. It uses
`STARTUPINFOEXW` with `PROC_THREAD_ATTRIBUTE_HANDLE_LIST` and
`PROC_THREAD_ATTRIBUTE_JOB_LIST`, then calls `CreateProcessW` with
`EXTENDED_STARTUPINFO_PRESENT | CREATE_SUSPENDED | CREATE_UNICODE_ENVIRONMENT`; the process therefore
belongs to the Job Object from creation and cannot be orphaned in a pre-assignment crash window. It
verifies job membership before `ResumeThread`. It drains both pipes, counts all bytes, retains only two
65,536-byte rings, waits for zero active job processes through an I/O completion port, and uses
`TerminateJobObject` at the 300-second deadline. Any inability to establish control occurs before
`ResumeThread` and returns `process-tree-control-unavailable`. The TypeScript parent accepts at most a
64 KiB helper response, enforces a 315-second helper deadline, terminates and reaps a late helper, and
otherwise returns `termination-unverified`; no handle beyond the protocol pipes and provider stdio
allowlist is inheritable.

The helper source lives inside `@evk-soft/ai-tooling`; it is not a third package or public export.
Phase 3 builds it with MSVC on Windows. Phase 5 creates the canonical audited package tarball on the
Windows runner so the tarball contains the helper; publication remains out of scope.

### IC-10: formatter result transport

`FormatterOutcome` contains every required field and no raw child bytes. Provider runners return a
closed discriminated transport reason plus exit/signal metadata, timeout state, byte counts, truncation
flags, and tree-control state; no failure is an untyped throw. The TypeScript orchestrator
performs registered-byte comparison and pre/post Git census, then applies the approved precedence.

```ts
export interface FormatterOutcome {
  readonly providerMode: 'direct' | 'node-entry';
  readonly requestedProvider: string | null;
  readonly code: DiagnosticCode | null;
  readonly reason: FormatterReason | null;
  readonly formatterExitStatus: number | null;
  readonly formatterSignal: string | null;
  readonly affectedPaths: readonly string[];
  readonly stdoutBytes: number;
  readonly stderrBytes: number;
  readonly stdoutTruncated: boolean;
  readonly stderrTruncated: boolean;
}
```

### IC-11: run-lock liveness

Windows reuses the internal helper: `OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION)` and
`GetProcessTimes` produce a decimal unsigned 64-bit creation-time marker. Linux reads
`/proc/<pid>/stat` without following links, parses field 22 after the final `)` delimiter, and combines
it with `process.kill(pid, 0)`. macOS invokes the fixed `/bin/ps` directly with
`['-o', 'lstart=', '-p', decimalPid]`, `shell: false`, no stdin, and an empty-base environment containing
only `LC_ALL=C`. Capture `/bin/ps` as a no-link regular executable by native identity and executable mode,
and revalidate it before and after each spawn. Bound stdout and stderr independently to counted 4 KiB
rings, use a five-second monotonic deadline plus five-second terminate/reap deadline, and accept exactly
one bounded normalized ASCII timestamp line. Spawn error, stall, flood, signal, termination uncertainty,
identity change, or extra/malformed output returns `ambiguous` and permits zero writes. Poisoned
`PATH`/locale/environment, executable substitution, stall, flood, and unreaped-child fixtures enforce
this boundary. Absent process proves dead; access denial, malformed output, foreign host,
different marker, or any uncertainty blocks reclamation. A reused PID is never treated as stale.

```ts
export interface ProcessLivenessProvider {
  currentIdentity(): Promise<RunLockOwner>;
  probe(record: RunLockOwner): Promise<'live' | 'dead' | 'reused' | 'ambiguous'>;
}
```

### IC-12: retention and recovery constants

Keep all active/interrupted evidence. Successful ordinary transactions delete their own transient
backup only after prior/final verification. Manual restore retains the newest verified preimage per
managed path. It stages the next frame durably but keeps the preceding completed frame at its fixed path
through target replacement, final-tree verification, and the flushed terminal `committed` frame; only
then may an atomic verified publish replace the preceding frame.
Bound every metadata string at 4 KiB, each diagnostic at 64 KiB, the managed-path count at 100,000,
and a transaction journal at 64 MiB. Limit PID to a positive safe integer and the target OS maximum.

The Stage 1 local-state layout is closed:

```text
.ai-tooling/run.lock
.ai-tooling/.run-lock-advance-<operation-uuid>-<43-char-nonce>.stage
.ai-tooling/transactions/<operation-uuid>.journal
.ai-tooling/transactions/.journal-prefix-<operation-uuid>-g<generation>-<expected-sha256>-<prefix-sha256>.stage
.ai-tooling/backups/<operation-uuid>-<six-digit-step>.bak
.ai-tooling/backups/retained-<portable-path-key-sha256>.preimage
.ai-tooling/backups/.retained-<portable-path-key-sha256>-<operation-uuid>-<43-char-nonce>.stage
.ai-tooling/stale-locks/<operation-uuid>.run-lock
.ai-tooling/stale-locks/<operation-uuid>.recovery-handoff
.ai-tooling/stale-locks/.handoff-<operation-uuid>-<43-char-nonce>.stage
.ai-tooling/stale-locks/.terminal-archive-<operation-uuid>-g<generation>-<expected-sha256>-<candidate-sha256>.stage
.ai-tooling/reports/<portable-name>.json
.ai-tooling/reports/.evk-ai-tooling-tmp-<operation-uuid>-<43-char-nonce>-<six-digit-step>
```

After acceptance and the ignore prerequisite, the real `.ai-tooling`, `transactions`, `backups`, and
`stale-locks` directories are the only idempotent transaction-infrastructure directory exceptions;
they are never mutation-plan entries or `directoryCreates`. The first three child roots are created
exclusively under freshly rebound identities before the direct `run.lock` create. `reports` is instead
an ordinary confirmed plan directory. There are no per-operation subdirectories. A mutation step is a
canonical one-based integer from `1` through `100000`, assigned once in deterministic forward execution
order: structural directories shallow-first (portable key plus original UTF-8 tie-break within a depth),
then ordinary entries in portable-key/original-byte order, and `ai-tooling.lock.json` last when present.
Its filename spelling is exactly six decimal digits `000001` through `100000`; rollback reuses the
original step and executes in reverse. Journal frame `sequence` is a separate contiguous unsigned
32-bit counter. Transaction backup names come only from the accepted operation ID and that step
spelling. A forward file candidate stage uses exact same-parent basename
`.evk-ai-tooling-tmp-<operation-uuid>-<43-char-nonce>-<six-digit-step>`. For every prior regular file,
the header independently reserves exact same-parent rollback basename
`.evk-ai-tooling-rollback-<operation-uuid>-<43-char-nonce>-<six-digit-step>`, prior digest, and length;
all three rollback fields are null/null/zero for a prior absent/directory state. These two grammars and
authorities are not interchangeable. A retained preimage JSON
header strict-binds the managed portable path/key, byte length, SHA-256, and source operation to raw
bytes in one bounded `EVKP` version-1 length/digest-framed `.preimage` file. Before commit, the complete
new frame exists only at its operation/nonce-derived journaled stage and the fixed retained path remains
exactly old or absent. After target/final-tree/terminal-frame verification, atomic verified publication
puts the new frame at the fixed name or leaves the complete old frame plus attributable stage.
The run-lock-advance, retained-preimage, and report staging names above are exact closed grammars bound
to their typed journal authority. Journal-prefix and terminal-archive rewrite stages are deterministic
from the already observed operation UUID, canonical decimal recovery generation with no leading zero,
purpose, and full expected/candidate SHA-256 values; they are rederived before use and introduce no
random value or accepted-digest cycle. Their exact paths appear in the accepted recovery projection and
recovery run lock. Unknown names or grammar-valid names without the matching authority are blocking.

```ts
export type MutationStep = number & { readonly __mutationStep: unique symbol };
```

The one fixed recovery-handoff leaf is authoritative only when it is a complete strict
`RecoveryHandoffV1`. Its randomized `.stage` leaves are bounded, non-authoritative tooling scratch:
they never permit target/predecessor mutation, and fixed-path no-overwrite publication is the only way
their bytes become authority. At most 64 such leaves of 64 KiB each/4 MiB aggregate may coexist; a
link/reparse, bad name, oversize, or limit breach blocks. The full verified successor must delete every
exact observed tool-owned scratch leaf by identity without interpreting its bytes before recovery may
terminalize its archive or release its run lock. Before publishing a new handoff, an accepted repair may
also revalidate/delete the bounded scratch set only while the exact dead predecessor is unchanged and the
fixed handoff is absent; a race/failure retains the predecessor and performs no target mutation.
A committed transaction is successful after its candidate tree and terminal frame verify and its exact
run lock is released. A handled rollback is terminal only after its complete prior tree/lock and
`rolled-back` frame verify and its exact run lock is released. Either outcome eagerly attempts terminal-evidence cleanup, but a crash or cleanup failure may
leave only bounded, strictly validated terminal journals/archives for that operation; those inert
remnants do not change the committed outcome. A **fully cleaned** state has empty `transactions` and
`stale-locks`, while `backups` is empty or contains only complete validated retained frames. Any unknown
name, changed retained frame, transient backup without matching journal intent, link/reparse, or limit
breach blocks and is preserved.

Stage 1 protects the integrity and containment of local state, but does not claim confidentiality from
another operating-system principal that already has read access to the checkout. `.ai-tooling/**`
inherits the repository's filesystem access policy and may retain prior user bytes; the security guide
must require operators of shared machines to protect the checkout with suitable OS permissions/ACLs.
The tooling never broadens an existing repository or `.ai-tooling` permission/ACL. Owner-only temporary
roots used to run untrusted providers remain a separate mandatory boundary.

### IC-13: mutation confirmation

Every mutation plan has a `sha256-jcs-rfc8785` digest over the JSON-safe
`MutationPlanDigestProjectionV1`: operation kind, repository-relative paths, projected observed
states, candidate digests/lengths/modes, exact contributor projections, operation-discriminated local-
refresh metadata, and the complete recovery action. A repair projection binds
every pre-existing evidence path and every deterministic journal/archive rewrite, including the
archive-only restore descriptor when present. A randomized non-authoritative recovery-handoff staging
leaf is allocated only after acceptance; its path is instead bound by the canonical handoff and branded
gateway authority before publication, exactly as an ordinary post-acceptance operation nonce is. Native integer identity fields use
canonical unsigned decimal strings in that projection; candidate bytes and absolute paths are never
included. Interactive mode prints the complete diff and digest and accepts that exact digest through injected prompt I/O.
Non-interactive mode requires `--accept-plan <64-lowercase-hex>` matching the immediately revalidated
plan. `--dry-run` performs the same resolution/revalidation and prints the digest but creates no run
lock, journal, backup, report, directory, config, lock, or output. There is no generic `--force` or
bare `--yes` flag. `doctor --repair` additionally requires exact `--operation <uuid>` and
`--action complete|rollback`; `pack refresh-local` names the selected pack and new digest.

Every mutating `--dry-run --json` renders this exact key order with the ordinary generated-JSON byte
rules. Entries are sorted by path portable key plus original UTF-8 bytes. Each contributors array
preserves the resolver's canonical application order—declared pack precedence and resource order,
followed by matching overrides in config `overrides[]` order—and is never re-sorted by the candidate or
mutation renderer:

```ts
export interface MutationPlanJsonV1 extends JsonObject {
  readonly schemaVersion: 1;
  readonly kind: 'mutation-plan';
  readonly operationId: string | null;
  readonly operation: MutationOperation | 'repair';
  readonly planDigest: Sha256Hex;
  readonly entries: readonly (JsonObject & {
    readonly path: PortableRelativePath;
    readonly action: 'create-directory' | 'create' | 'replace' | 'delete';
    readonly beforeDigest: Sha256Hex | null;
    readonly afterDigest: Sha256Hex | null;
    readonly byteLength: number;
    readonly unifiedDiff: string;
    readonly contributors: readonly (
      | (JsonObject & {
          readonly kind: 'pack';
          readonly packId: PackId;
          readonly resourceId: ResourceId;
          readonly digest: Sha256Hex;
        })
      | (JsonObject & {
          readonly kind: 'override';
          readonly path: PortableRelativePath;
          readonly mode: 'extend' | 'replace' | 'disable';
          readonly target: ResourceId;
          readonly digest: Sha256Hex;
        })
    )[];
  })[];
  readonly summary: JsonObject & {
    readonly creates: number;
    readonly replaces: number;
    readonly deletes: number;
    readonly directoryCreates: number;
  };
  readonly recovery: RecoveryEvidencePlanV1 | null;
  readonly refresh: LocalRefreshMetadataV1 | null;
}

export interface MutationPlanOutputLimits {
  readonly maxEntries: 100000;
  readonly maxEntryUnifiedDiffBytes: 33554432;
  readonly maxAggregateUnifiedDiffBytes: 50331648;
  readonly maxRenderedBytes: 67108864;
  readonly maxConfirmationFrameBytes: 65;
}

export function streamMutationPlanOutput(
  plan: MutationPlan | RecoveryPlan | RestorePlan,
  format: 'human' | 'json',
  sink: CliOutputSink,
  limits: MutationPlanOutputLimits,
): Promise<{ readonly byteLength: number }>;
```

The renderer consumes only each entry's branded `BoundedMutationReviewSource` values and contributor
projection; it has no filesystem, repository context, or raw-path input. The brand is module-private.
The plan builder may obtain a `before` source only from the containment gateway bound to that entry's
exact `ContainedPathRef` and observed identity; opening it repeats the bounded no-follow identity/
length/digest bracket. It may obtain an `after` source only from the already-bounded immutable candidate
bytes. Each source's declared hash/length must equal its entry state before rendering and its stream is
rechecked while consumed. Diff construction, fatal UTF-8 validation, IC-17 human display encoding or
logical-value-preserving JSON string serialization, and rendering are one bounded incremental pass;
they never build an unbounded complete diff, JSON string, or `Uint8Array`. Apply the 32/48 MiB
per-entry/aggregate diff ceilings to the selected mode's IC-17-encoded or JSON-string-escaped UTF-8
bytes before retention; a separate raw-source counter may also claim bytes under IC-16 but cannot
replace the encoded limits. Count the complete escaped/rendered bytes before each awaited sink write.
At 32 MiB for one unified diff, 48 MiB for all unified diffs, or 64 MiB for the complete human/JSON plan
including digest and prompt, stop before materialization/confirmation and emit
`EVK_SECURITY_RESOURCE_LIMIT` with zero writes. Exact-at/one-over, many-entry, newline/control escape-
amplification, split-code-point, terminal-control/bidi, slow-sink, and 512 MiB-class candidate fixtures
prove the counters, parsed JSON value identity, and bounded memory.

The command emits no additional stdout. Tests strict-parse the bytes, assert the closed shape and
lowercase 64-hex digest fields, recompute the projection digest, and prove the apply command accepts
only that immediately revalidated digest. Human review covers the complete `unifiedDiff`; diagnostics
remain separate and do not echo source bodies. A `create-directory` entry has null before/after
digests, byte length `0`, empty unified diff, and empty contributors; its path and directory candidate
state still participate in the accepted plan digest.
`summary.creates` counts regular-file creates only; `summary.directoryCreates` counts directory
creates. Replaces and deletes remain regular-file/managed-leaf actions in Stage 1.
Interactive apply must finish every awaited plan/prompt write and receive a successful `stdout.flush()`
acknowledgement before calling `confirmationInput.readDigestFrame()`. That adapter incrementally frames
at the first LF with a hard 65-byte cap and returns only a complete frame; the parser accepts exactly
`[0-9a-f]{64}\n` equal to the revalidated plan digest. It rejects EOF, CR, NUL, uppercase, whitespace,
short/long input, an extra byte before/after LF in the delivered frame, a second delivered frame, and
one-over input. Output write/flush/end failure, EPIPE, input error, or framing error produces zero
run-lock/journal/backup/temp/target writes. Add one-byte and adversarial split-chunk, slow-backpressure,
flush-failure, EPIPE, 64/65/66-byte, CRLF, extra-line, and noninteractive argv fixtures.
The contributors array is the exact closed JSON projection bound into the plan digest. A generated-leaf
create or replace uses the candidate leaf's contributors and restore uses the verified expected leaf.
Deletes use an empty array: after an explicit local-pack refresh the removed resource may no longer
exist in the current catalog, while the approved lock intentionally stores IDs rather than the complete
prior contributor projection. Non-generated config/lock/directory/report entries, every delete, and
every entry in a `RecoveryPlan` use an empty array; recovery therefore remains independent of changed
or removed canonical source after a crash. Adapter identity is carried separately by `CandidateLeaf.generator` and
the ownership record and is never synthesized as a contributor with an invented digest.

`refresh` is non-null exactly for `operation: 'refresh-local'` and is the same
`LocalRefreshMetadataV1` object in the typed plan, digest projection, and rendered JSON. Its old digest
comes from the validated current lock and its new digest from the selected, validated local pack. Every
other operation, including repair and restore, has literal `refresh: null`; a tag/value mismatch is
rejected before digest comparison, output, confirmation, or writes.

For every ordinary operation, `recovery` is exactly `null`. For `repair`, it is non-null, its `action`
equals the requested action, and its sorted `observations` contain every coordination/evidence path the
repair may inspect, retain, hand off, create, delete, truncate/replace, or terminalize: current run lock,
original archive, fixed recovery handoff, journal, every backup/staging leaf, and every independently
cleaned terminal remnant. Each observation binds portable path, closed role/disposition, full observed
identity/digest or absence, and exact byte length. The same object appears byte-for-byte in
`RecoveryPlan`, `MutationPlanDigestProjectionV1`, and `MutationPlanJsonV1`; exact prefix and archive-
rewrite descriptors are nested in it. Thus two different journal/archive/temp states cannot share an
accepted digest. `JournalPrefixRepairV1` and `TerminalArchiveRewriteV1` are derived only from these
observations and their deterministic staging paths, then copied unchanged into the recovery run lock.
An action/evidence/projection mismatch fails before any handoff or write.

For `init`, `sync`, `refresh-local`, `restore-generated`, and `report`, `operationId` is exactly `null`: the
transaction manager generates the UUID/nonce only after it has revalidated an accepted plan, so two
unchanged dry runs have the same digest and a later apply can match it. For `repair`, `operationId` is
the existing interrupted operation UUID supplied by the caller and is part of the accepted digest.

### IC-14: local-pack and resource integrity bytes

Hash each accepted tracked regular file's raw bytes with SHA-256. The local-pack integrity digest is
SHA-256 over RFC 8785 JCS bytes of this exact value, with files sorted by portable path key and then
original UTF-8 path bytes:

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

The inventory includes `package.json`, `pack.json`, `README.md`, `LICENSE`, and every declared
metadata and instruction file; an extra, missing, link, reparse, non-regular, conflicted, or
executable-index file fails before hashing completes. A resource base digest uses JCS over validated
resource metadata with only `$schema` omitted plus the exact `sha256:` instruction digest. No line-
ending, Markdown, JSON, or Unicode normalization occurs in integrity hashing.

### IC-15: shared internal types and the single writer

Use branded strings at trust boundaries and closed state unions. These definitions are internal and
do not add public deep exports:

```ts
export type AbsolutePath = string & { readonly __absolutePath: unique symbol };
export type PortableRelativePath = string & { readonly __portablePath: unique symbol };
export type PortablePathSegment = string & { readonly __portablePathSegment: unique symbol };
export type Sha256Hex = string & { readonly __sha256Hex: unique symbol };
export type GitObjectId = string & { readonly __gitObjectId: unique symbol };
export type GitCommitish = string & { readonly __gitCommitish: unique symbol };
export type UnsignedDecimal = string & { readonly __unsignedDecimal: unique symbol };
export type MonotonicDeadlineNs = bigint & { readonly __monotonicDeadlineNs: unique symbol };
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
export type DiagnosticCode = keyof typeof DIAGNOSTIC_CODES;

export type FormatterReason =
  | 'provider-token-missing'
  | 'unsupported-direct-wrapper'
  | 'invalid-direct-location'
  | 'direct-entry-not-file'
  | 'direct-entry-not-launchable'
  | 'direct-containment-failed'
  | 'invalid-node-specifier'
  | 'root-manifest-invalid'
  | 'root-manifest-containment-failed'
  | 'undeclared-node-package'
  | 'node-modules-anchor-invalid'
  | 'installed-package-outside-root'
  | 'parent-or-global-resolution'
  | 'cross-package-resolution'
  | 'resolved-entry-not-file'
  | 'provider-identity-changed'
  | 'provider-trust-changed'
  | 'installed-tree-identity-changed'
  | 'direct-executable-missing'
  | 'root-manifest-missing'
  | 'repository-local-package-missing'
  | 'node-entry-resolution-failed'
  | 'environment-unavailable'
  | 'process-tree-control-unavailable'
  | 'spawn-error'
  | 'terminated-by-signal'
  | 'timeout'
  | 'termination-unverified'
  | 'exit-nonzero'
  | 'registered-bytes-changed'
  | 'checkout-census-changed'
  | 'git-provider-unavailable'
  | 'git-provider-invalid'
  | 'git-provider-identity-changed-before-spawn'
  | 'git-version-unsupported'
  | 'pre-census-failed'
  | 'git-provider-identity-changed-after-spawn'
  | 'post-census-failed';

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

export function objectLocator<K extends NodeKind>(identity: ObjectIdentity<K>): ObjectLocatorIdentity<K>;
export function sameObject(
  left: ObjectLocatorIdentity | ObjectIdentity,
  right: ObjectLocatorIdentity | ObjectIdentity,
): boolean;
export function sameObservation(left: ObjectIdentity, right: ObjectIdentity): boolean;

export interface FrozenRegularFile {
  readonly path: AbsolutePath;
  readonly identity: ObjectIdentity<'file'>;
  readonly digest: Sha256Hex;
}

declare const frozenWindowsDirectoryBrand: unique symbol;
export interface FrozenWindowsDirectory {
  readonly [frozenWindowsDirectoryBrand]: true;
  readonly path: AbsolutePath;
  readonly identity: Extract<ObjectIdentity<'directory'>, { readonly os: 'win32' }>;
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
      readonly indexMode: '100644' | '100755' | null;
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

export interface AdapterTargetPlan {
  readonly path: PortableRelativePath;
  readonly resourceIds: readonly ResourceId[];
  readonly adapter: AdapterIdentity;
  readonly role: 'root' | 'rule' | 'skill';
}

export interface Diagnostic {
  readonly code: DiagnosticCode;
  readonly reason: string | null;
  readonly fields: Readonly<Record<string, JsonValue>>;
  readonly recoveryActions: readonly string[];
}

export interface RunLockOwner {
  readonly providerId: 'linux-procfs-v1' | 'macos-ps-v1' | 'windows-native-v1';
  readonly host: string;
  readonly pid: number;
  readonly startMarker: string;
}

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

export type DesiredPathState =
  | { readonly kind: 'absent' }
  | { readonly kind: 'directory'; readonly mode: 'directory' }
  | {
      readonly kind: 'file';
      readonly bytes: Uint8Array;
      readonly digest: Sha256Hex;
      readonly byteLength: number;
      readonly mode: '100644';
    };

export type RestorePreimageState = Extract<DesiredPathState, { readonly kind: 'absent' | 'file' }>;

export type ObjectIdentityDigestProjectionV1<K extends NodeKind = NodeKind> =
  | (JsonObject & {
      readonly os: 'posix';
      readonly nodeKind: K;
      readonly dev: UnsignedDecimal;
      readonly ino: UnsignedDecimal;
      readonly mode: number;
      readonly ctimeNs: UnsignedDecimal;
      readonly mtimeNs: UnsignedDecimal;
      readonly size: UnsignedDecimal;
    })
  | (JsonObject & {
      readonly os: 'win32';
      readonly nodeKind: K;
      readonly volumeSerial: UnsignedDecimal;
      readonly fileId128: string;
      readonly attributes: number;
      readonly creationTime: UnsignedDecimal;
      readonly lastWriteTime: UnsignedDecimal;
      readonly size: UnsignedDecimal;
    });

export type ObjectLocatorDigestProjectionV1<K extends NodeKind = NodeKind> =
  | (JsonObject & {
      readonly os: 'posix';
      readonly nodeKind: K;
      readonly dev: UnsignedDecimal;
      readonly ino: UnsignedDecimal;
    })
  | (JsonObject & {
      readonly os: 'win32';
      readonly nodeKind: K;
      readonly volumeSerial: UnsignedDecimal;
      readonly fileId128: string;
    });

export type ObservedPathDigestProjectionV1 =
  | (JsonObject & { readonly kind: 'absent' })
  | (JsonObject & {
      readonly kind: 'file';
      readonly digest: Sha256Hex;
      readonly identity: ObjectIdentityDigestProjectionV1<'file'>;
    })
  | (JsonObject & {
      readonly kind: 'link';
      readonly target: string;
      readonly identity: ObjectIdentityDigestProjectionV1<'link'>;
    })
  | (JsonObject & {
      readonly kind: 'directory';
      readonly identity: ObjectIdentityDigestProjectionV1<'directory'>;
    });

export type DesiredPathDigestProjectionV1 =
  | (JsonObject & { readonly kind: 'absent' })
  | (JsonObject & { readonly kind: 'directory'; readonly mode: 'directory' })
  | (JsonObject & {
      readonly kind: 'file';
      readonly digest: Sha256Hex;
      readonly byteLength: number;
      readonly mode: '100644';
    });

export interface ContainedPathRef {
  readonly relativePath: PortableRelativePath;
  readonly ancestors: readonly ObjectLocatorIdentity<'directory'>[];
}

declare const durableStagingIntentBrand: unique symbol;
export interface DurableStagingIntent {
  readonly [durableStagingIntentBrand]: true;
  readonly operationId: string;
  readonly nonce: string;
  readonly step: MutationStep;
  readonly targetPath: PortableRelativePath;
  readonly stagingPath: PortableRelativePath;
  readonly candidateDigest: Sha256Hex;
  readonly byteLength: number;
}
declare const durableRollbackStagingIntentBrand: unique symbol;
export interface DurableRollbackStagingIntent {
  readonly [durableRollbackStagingIntentBrand]: true;
  readonly operationId: string;
  readonly nonce: string;
  readonly step: MutationStep;
  readonly targetPath: PortableRelativePath;
  readonly backupPath: PortableRelativePath;
  readonly stagingPath: PortableRelativePath;
  readonly priorDigest: Sha256Hex;
  readonly byteLength: number;
}
declare const durableBackupIntentBrand: unique symbol;
export interface DurableBackupIntent {
  readonly [durableBackupIntentBrand]: true;
  readonly operationId: string;
  readonly nonce: string;
  readonly step: MutationStep;
  readonly backupPath: PortableRelativePath;
  readonly backupDigest: Sha256Hex;
  readonly byteLength: number;
}
export interface RetainedPreimageRotationV1 extends JsonObject {
  readonly managedPath: PortableRelativePath;
  readonly retainedPath: PortableRelativePath;
  readonly observed:
    | Extract<ObservedPathDigestProjectionV1, { readonly kind: 'absent' }>
    | Extract<ObservedPathDigestProjectionV1, { readonly kind: 'file' }>;
  readonly stagingPath: PortableRelativePath;
  readonly candidateDigest: Sha256Hex;
  readonly candidateByteLength: number;
}
declare const retainedPreimageAuthorityBrand: unique symbol;
export interface RetainedPreimageAuthority {
  readonly [retainedPreimageAuthorityBrand]: true;
  readonly operationId: string;
  readonly nonce: string;
  readonly step: MutationStep;
  readonly descriptor: RetainedPreimageRotationV1;
  readonly expectedRetained:
    | Extract<ObservedPathState, { readonly kind: 'absent' }>
      | Extract<ObservedPathState, { readonly kind: 'file' }>;
}
declare const committedRetainedPreimageAuthorityBrand: unique symbol;
declare const confirmedJournalActionBrand: unique symbol;
export type JournalHeaderDigest = Sha256Hex;
export interface ConfirmedJournalAction {
  readonly [confirmedJournalActionBrand]: true;
  readonly source: 'ordinary' | 'repair';
  readonly action: 'complete' | 'rollback';
  readonly operationId: string;
  readonly journalPlanDigest: Sha256Hex;
  readonly acceptedPlanDigest: Sha256Hex;
  readonly headerDigest: JournalHeaderDigest;
}
export interface CommittedRetainedPreimageAuthority {
  readonly [committedRetainedPreimageAuthorityBrand]: true;
  readonly operationId: string;
  readonly step: MutationStep;
  readonly planDigest: Sha256Hex;
  readonly finalTreeDigest: Sha256Hex;
  readonly descriptor: RetainedPreimageRotationV1;
}
declare const runLockAdvanceAuthorityBrand: unique symbol;
export interface RunLockAdvanceAuthority {
  readonly [runLockAdvanceAuthorityBrand]: true;
  readonly operationId: string;
  readonly nonce: string;
  readonly headerDigest: JournalHeaderDigest;
  readonly stagingPath: PortableRelativePath;
  readonly candidateDigest: Sha256Hex;
  readonly byteLength: number;
}
declare const recoveryRewriteAuthorityBrand: unique symbol;
export interface RecoveryRewriteAuthority {
  readonly [recoveryRewriteAuthorityBrand]: true;
  readonly operationId: string;
  readonly generation: number;
  readonly purpose: 'journal-prefix' | 'terminal-archive';
  readonly sourcePath: PortableRelativePath;
  readonly expectedSourceDigest: Sha256Hex;
  readonly expectedSourceByteLength: number;
  readonly stagingPath: PortableRelativePath;
  readonly candidateDigest: Sha256Hex;
  readonly byteLength: number;
}
declare const recoveryHandoffAuthorityBrand: unique symbol;
export interface RecoveryHandoffAuthority {
  readonly [recoveryHandoffAuthorityBrand]: true;
  readonly operationId: string;
  readonly generation: number;
  readonly acceptedPlanDigest: Sha256Hex;
  readonly predecessorDisposition: 'archive-original' | 'retire-recovery';
  readonly predecessorPath: PortableRelativePath;
  readonly predecessorDigest: Sha256Hex;
  readonly predecessorByteLength: number;
  readonly predecessorLocator: ObjectLocatorIdentity<'file'>;
  readonly originalArchivePath: PortableRelativePath;
  readonly originalArchiveDigest: Sha256Hex;
  readonly originalArchiveByteLength: number;
  readonly originalArchiveLocator: ObjectLocatorIdentity<'file'>;
  readonly successorPath: PortableRelativePath;
  readonly handoffPath: PortableRelativePath;
  readonly publicationStagingPath: PortableRelativePath;
  readonly handoffDigest: Sha256Hex;
  readonly handoffByteLength: number;
  readonly successorDigest: Sha256Hex;
  readonly successorByteLength: number;
}
declare const recoveryArchiveRestoreAuthorityBrand: unique symbol;
export interface RecoveryArchiveRestoreAuthority {
  readonly [recoveryArchiveRestoreAuthorityBrand]: true;
  readonly operationId: string;
  readonly acceptedPlanDigest: Sha256Hex;
  readonly runLockPath: PortableRelativePath;
  readonly archivePath: PortableRelativePath;
  readonly archiveDigest: Sha256Hex;
  readonly archiveByteLength: number;
  readonly archiveLocator: ObjectLocatorIdentity<'file'>;
}

declare const boundedMutationReviewSourceBrand: unique symbol;
export interface BoundedMutationReviewSource {
  readonly [boundedMutationReviewSourceBrand]: true;
  readonly digest: Sha256Hex;
  readonly byteLength: number;
  open(): AsyncIterable<Uint8Array>;
}
export interface PlannedPathReview {
  readonly before: BoundedMutationReviewSource | null;
  readonly after: BoundedMutationReviewSource | null;
  readonly contributors: readonly Contributor[];
}
export interface PlannedPathMutation {
  readonly path: ContainedPathRef;
  readonly observed: ObservedPathState;
  readonly candidate: DesiredPathState;
  readonly review: PlannedPathReview;
}

export type RecoveryPredecessorRetirement =
  | {
      readonly kind: 'archive-original';
      readonly originalArchive: ContainedPathRef;
      readonly expectedOriginalArchive: Extract<ObservedPathState, { readonly kind: 'absent' }>;
    }
  | {
      readonly kind: 'retire-recovery';
      readonly originalArchive: ContainedPathRef;
      readonly expectedOriginalArchive: Extract<ObservedPathState, { readonly kind: 'file' }>;
    };

export type MutationOperation = 'init' | 'sync' | 'refresh-local' | 'restore-generated' | 'report';
export interface LocalRefreshMetadataV1 extends JsonObject {
  readonly pack: PackId;
  readonly oldPackDigest: Sha256Hex;
  readonly newPackDigest: Sha256Hex;
}
export interface MutationPlanBase<O extends MutationOperation> {
  readonly operation: O;
  readonly entries: readonly PlannedPathMutation[];
  readonly planDigest: Sha256Hex;
}
export type MutationPlan<O extends MutationOperation = MutationOperation> =
  O extends 'refresh-local'
    ? MutationPlanBase<'refresh-local'> & { readonly refresh: LocalRefreshMetadataV1 }
    : MutationPlanBase<Exclude<O, 'refresh-local'>> & { readonly refresh: null };

export type ContributorDigestProjectionV1 =
  | (JsonObject & {
      readonly kind: 'pack';
      readonly packId: PackId;
      readonly resourceId: ResourceId;
      readonly digest: Sha256Hex;
    })
  | (JsonObject & {
      readonly kind: 'override';
      readonly path: PortableRelativePath;
      readonly mode: ValidatedOverride['mode'];
      readonly target: ResourceId;
      readonly digest: Sha256Hex;
    });

export interface MutationPlanDigestEntryV1 extends JsonObject {
  readonly path: PortableRelativePath;
  readonly observed: ObservedPathDigestProjectionV1;
  readonly candidate: DesiredPathDigestProjectionV1;
  readonly contributors: readonly ContributorDigestProjectionV1[];
}

export type RecoveryEvidenceRole =
  | 'current-run-lock'
  | 'original-run-lock-archive'
  | 'recovery-handoff'
  | 'journal'
  | 'backup'
  | 'staging'
  | 'terminal-remnant';
export type RecoveryEvidenceDisposition =
  | 'retain'
  | 'handoff'
  | 'restore-original-archive'
  | 'create-successor'
  | 'delete'
  | 'replace-prefix'
  | 'terminalize';
export interface RecoveryEvidenceObservationV1 extends JsonObject {
  readonly path: PortableRelativePath;
  readonly role: RecoveryEvidenceRole;
  readonly observed: ObservedPathDigestProjectionV1;
  readonly byteLength: number;
  readonly disposition: RecoveryEvidenceDisposition;
}
export interface RecoveryArchiveRestoreV1 extends JsonObject {
  readonly kind: 'restore-original-archive';
  readonly runLockPath: PortableRelativePath;
  readonly expectedRunLock: JsonObject & { readonly kind: 'absent' };
  readonly archivePath: PortableRelativePath;
  readonly expectedArchiveDigest: Sha256Hex;
  readonly expectedArchiveByteLength: number;
  readonly expectedArchiveLocator: ObjectLocatorDigestProjectionV1<'file'>;
}
export interface RecoveryEvidencePlanV1 extends JsonObject {
  readonly action: 'complete' | 'rollback';
  readonly generation: number;
  readonly observations: readonly RecoveryEvidenceObservationV1[];
  readonly archiveRestore: RecoveryArchiveRestoreV1 | null;
  readonly journalPrefixRepair: JournalPrefixRepairV1 | null;
  readonly terminalArchiveRewrite: TerminalArchiveRewriteV1;
}

export interface MutationPlanDigestProjectionV1 extends JsonObject {
  readonly schemaVersion: 1;
  readonly operationId: string | null;
  readonly operation: MutationOperation | 'repair';
  readonly entries: readonly MutationPlanDigestEntryV1[];
  readonly recovery: RecoveryEvidencePlanV1 | null;
  readonly refresh: LocalRefreshMetadataV1 | null;
}

export function mutationPlanDigestProjection(
  plan: MutationPlan | RecoveryPlan | RestorePlan,
): MutationPlanDigestProjectionV1;

export type ConfirmedMutationPlan<O extends MutationOperation = MutationOperation> = MutationPlan<O> & {
  readonly acceptedDigest: Sha256Hex;
};

export type TransactionOutcome =
  | { readonly kind: 'committed'; readonly operationId: string }
  | { readonly kind: 'rolled-back'; readonly operationId: string }
  | { readonly kind: 'interrupted'; readonly operationId: string; readonly evidencePath: PortableRelativePath };

export type RecoveryStatus =
  | { readonly kind: 'clean' }
  | { readonly kind: 'active'; readonly owner: RunLockOwner }
  | { readonly kind: 'recoverable'; readonly operationId: string; readonly actions: readonly ('complete' | 'rollback')[] }
  | { readonly kind: 'blocked'; readonly diagnostic: Diagnostic };

export interface RecoveryPlan {
  readonly operationId: string;
  readonly operation: 'repair';
  readonly entries: readonly PlannedPathMutation[];
  readonly planDigest: Sha256Hex;
  readonly action: 'complete' | 'rollback';
  readonly recovery: RecoveryEvidencePlanV1;
  readonly refresh: null;
}

export type RecoveryOutcome = TransactionOutcome;
export interface ConfirmedRecoveryPlan extends RecoveryPlan {
  readonly acceptedDigest: Sha256Hex;
}
export type RestorePlan = MutationPlan<'restore-generated'> & {
  readonly path: PortableRelativePath;
  readonly preimage: RestorePreimageState;
};
export type ConfirmedRestorePlan = RestorePlan & {
  readonly acceptedDigest: Sha256Hex;
};

export interface ByteSink { write(chunk: Uint8Array): void; end(): void }
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
export interface GitCommandMetadata {
  readonly stderrBytes: number;
  readonly stderrTruncated: boolean;
}
export type GitCommandResult =
  | (GitCommandMetadata & {
      readonly kind: 'exited';
      readonly exitCode: number;
      readonly signal: null;
      readonly timedOut: false;
      readonly treeState: 'quiescent';
    })
  | (GitCommandMetadata & {
      readonly kind: 'signaled';
      readonly exitCode: null;
      readonly signal: string;
      readonly timedOut: false;
      readonly treeState: 'quiescent';
    })
  | (GitCommandMetadata & {
      readonly kind: 'spawn-error';
      readonly exitCode: null;
      readonly signal: null;
      readonly timedOut: false;
      readonly treeState: 'not-started';
    })
  | (GitCommandMetadata & {
      readonly kind: 'timeout';
      readonly exitCode: null;
      readonly signal: null;
      readonly timedOut: true;
      readonly treeState: 'quiescent';
    })
  | (GitCommandMetadata & {
      readonly kind: 'termination-unverified';
      readonly exitCode: null;
      readonly signal: null;
      readonly timedOut: boolean;
      readonly treeState: 'termination-unverified';
    })
  | (GitCommandMetadata & {
      readonly kind: 'protocol-error';
      readonly exitCode: 0;
      readonly signal: null;
      readonly timedOut: false;
      readonly treeState: 'quiescent';
    });
export interface CliIo {
  readonly confirmationInput: ConfirmationInput;
  readonly stdout: CliOutputSink;
  readonly stderr: CliOutputSink;
  readonly cwd: AbsolutePath;
  readonly env: Readonly<Record<string, string | undefined>>;
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

declare const repositoryReadBudgetBrand: unique symbol;
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

export interface RepositoryReadBudgetFactory {
  createForCommand(scopeId: string, now: () => bigint): RepositoryReadBudget;
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

export interface CheckResult {
  readonly ok: boolean;
  readonly candidateDigest: Sha256Hex | null;
  readonly diagnostics: readonly Diagnostic[];
}

export interface ProjectDiff {
  readonly entries: readonly {
    readonly path: PortableRelativePath;
    readonly state: 'create' | 'replace' | 'delete' | 'unchanged';
    readonly beforeDigest: Sha256Hex | null;
    readonly afterDigest: Sha256Hex | null;
  }[];
}

export interface DoctorReport {
  readonly check: CheckResult;
  readonly recovery: RecoveryStatus;
  readonly formatter: FormatterOutcome | null;
}

export interface DiagnosticJsonV1 extends JsonObject {
  readonly code: DiagnosticCode;
  readonly reason: string | null;
  readonly fields: JsonObject;
  readonly recoveryActions: readonly string[];
}
export type RecoveryReportJsonV1 =
  | (JsonObject & { readonly kind: 'clean' })
  | (JsonObject & { readonly kind: 'active'; readonly providerId: RunLockOwner['providerId'] })
  | (JsonObject & {
      readonly kind: 'recoverable';
      readonly operationId: string;
      readonly actions: readonly ('complete' | 'rollback')[];
    })
  | (JsonObject & { readonly kind: 'blocked'; readonly diagnostic: DiagnosticJsonV1 });
export interface FormatterOutcomeJsonV1 extends JsonObject {
  readonly providerMode: FormatterOutcome['providerMode'];
  readonly requestedProvider: string | null;
  readonly code: DiagnosticCode | null;
  readonly reason: FormatterReason | null;
  readonly formatterExitStatus: number | null;
  readonly formatterSignal: string | null;
  readonly affectedPaths: readonly string[];
  readonly stdoutBytes: number;
  readonly stderrBytes: number;
  readonly stdoutTruncated: boolean;
  readonly stderrTruncated: boolean;
}
export interface DoctorReportJsonV1 extends JsonObject {
  readonly schemaVersion: 1;
  readonly kind: 'doctor-report';
  readonly toolingVersion: string;
  readonly check: JsonObject & {
    readonly ok: boolean;
    readonly candidateDigest: Sha256Hex | null;
    readonly diagnostics: readonly DiagnosticJsonV1[];
  };
  readonly recovery: RecoveryReportJsonV1;
  readonly formatter: FormatterOutcomeJsonV1 | null;
}

export interface LinkCheckResult {
  readonly ok: boolean;
  readonly findings: readonly {
    readonly source: PortableRelativePath;
    readonly target: string;
    readonly reason: 'invalid-syntax' | 'outside-root' | 'missing' | 'case-mismatch' | 'anchor-missing';
  }[];
}

export type InitRequest =
  | {
      readonly context: ReadOnlyRepositoryContext;
      readonly selection: { readonly kind: 'config'; readonly path: PortableRelativePath };
    }
  | {
      readonly context: ReadOnlyRepositoryContext;
      readonly selection: {
        readonly kind: 'pack';
        readonly path: PortableRelativePath;
        readonly platforms: readonly [PlatformId, ...PlatformId[]];
      };
    };
export interface SyncRequest { readonly context: ReadOnlyProjectContext }
export interface RefreshLocalRequest {
  readonly context: ReadOnlyProjectContext;
  readonly packId: PackId;
}
export interface ReportRequest {
  readonly context: ReadOnlyProjectContext;
  readonly path: PortableRelativePath;
}
```

`RedactedSource` and `NumberToken` live in `src/json/strict-json.ts`; the branded identifiers,
validated pack/override/resource shapes, and `Contributor` live in `src/model/types.ts` and
`src/pack/types.ts`; `ActualAssetInventory` lives in `src/pack/assets.ts`; and `AdapterTargetPlan` lives
in `src/adapters/types.ts`. The config CLI parser constructs exactly one `InitRequest` variant and
rejects `--platform` with `--config`, duplicate platforms, and an empty `--pack` platform list.
Refresh planning resolves the selected tracked source by `packId`; expected/new digests are derived
into the mutation plan and are never caller-selected planner inputs.

`RepositoryFilesystem` is the sole low-level component with mutation methods and is constructed only
inside `TransactionManager`. `RecoveryService`, `RestoreGeneratedService`, and command handlers own
read-only planners; they submit confirmed typed plans to `TransactionManager` and never receive or
call create/replace/rename/delete primitives directly. Before any write, the manager recomputes every
file candidate byte length and SHA-256 and verifies them against the entry and accepted plan digest;
for a directory candidate it instead verifies the exact closed kind/mode/path projection and absence
of byte/digest fields. It then revalidates the observed leaf plus every captured ancestor identity.
Candidate bytes are never reconstructed from a digest.

For an ordinary confirmed plan, `TransactionManager` creates a fresh lowercase UUID v4 operation ID
and random nonce only after accepted-digest revalidation and uses them for run-lock/journal evidence;
neither value changes the already accepted candidate. A recovery plan instead retains and digests the
interrupted operation ID.

`mutationPlanDigestProjection` converts every nonnegative native `bigint` to canonical decimal
`UnsignedDecimal` (`0` or a nonzero digit followed by digits), requires POSIX `mode` and Win32
`attributes` to be unsigned 32-bit JSON integers, and requires `fileId128` to be 32 lowercase hex
digits. It omits candidate bytes, sorts entries by portable path key and then original UTF-8 path
bytes, and rejects duplicate/colliding paths before returning the exact shape above. Unit vectors in
Phase 4 hash that projected object only and prove that byte changes alter the candidate digest while
native numeric width, insertion order, and locale do not alter serialization.

### IC-16: bounded untrusted local input

Before decoding or allocating a syntax tree, reject a JSON metadata file above 16 MiB. The lexical
visitor is iterative and rejects depth above 128, more than 1,000,000 total tokens, more than 100,000
members in one object or items in one array, a decoded metadata string above 4 KiB, and a number token
above 256 bytes. These checks run before `JSON.parse`, decimal-`bigint` comparison, Ajv, or JCS.

A pack has at most 100,000 declared regular files, 100,000 resources, 16 MiB per metadata/instruction
file, and 512 MiB total declared bytes. The independent actual-source inventory applies the same
100,000-file, 16 MiB-per-file, and 512 MiB aggregate limits to every declared, undeclared, untracked,
or ignored regular file below the source root. Config-selected overrides have at most 100,000 files,
16 MiB per metadata/instruction file, and 64 MiB aggregate bytes across all selected override roots.
The real-checkout census and disposable formatter copy have at most 100,000 entries, 16 MiB per
regular file, 512 MiB aggregate regular-file bytes, 64 levels, 4 KiB per portable path, and 16 MiB
aggregate encoded path bytes. Each local inventory has a 30-second no-progress deadline inside one
300-second monotonic whole-inventory deadline.

Every `RepositorySourceClass` has this closed profile; all byte/count/path counters are monotonic for
the one command budget and use binary MiB values:

| Source class | Maximum entries | Per regular file | Aggregate content | Aggregate encoded paths |
|---|---:|---:|---:|---:|
| `repository-config` | 16 | 16 MiB | 64 MiB | 64 KiB |
| `pack` | 100,000 | 16 MiB | 512 MiB | 16 MiB |
| `override` | 100,000 | 16 MiB | 64 MiB | 16 MiB |
| `actual-source` | 100,000 | 16 MiB | 512 MiB | 16 MiB |
| `checkout` | 100,000 | 16 MiB | 512 MiB | 16 MiB |
| `managed` | 100,000 | 16 MiB | 512 MiB | 16 MiB |
| `report` | 100,000 | 16 MiB | 512 MiB | 16 MiB |
| `journal` | 100,000 | 64 MiB | 512 MiB | 16 MiB |
| `recovery-evidence` | 100,000 | 16 MiB | 512 MiB | 16 MiB |

In addition, the union of `report`, `journal`, and `recovery-evidence` is one closed local-state
envelope of 100,000 entries, 16 MiB encoded paths, and 512 MiB content per command. It covers reports,
journals, ordinary/transient backups, retained preimages, run-lock archives/handoffs/stages, and terminal
remnants; tighter IC-12 per-kind limits still apply. A limit breach preserves evidence and blocks—it
never triggers deletion or a counter reset.

Reject a regular file whose already-open no-follow identity reports a one-over size before allocating
or copying its contents, including a sparse file. Stream every accepted file through incremental
length/hash/content checks, verify the exact streamed length and identity afterward, and collect a
whole `Uint8Array` only for an already-bounded metadata or instruction consumer. Never retain file
bodies in an actual-tree or checkout-census result and never copy from an unbounded read API. A
repository-relative path is at most 4 KiB of UTF-8. Git, formatter, journal, output-ring, diagnostic,
and transaction bounds remain the tighter values stated elsewhere. Exceeding any limit emits
`EVK_SECURITY_RESOURCE_LIMIT` with only limit kind, configured maximum, and redacted source class; no
source bytes or absolute path. Exact-at-limit, one-over, sparse-file, truncated-read, extra-byte, and
no-progress fixtures must prove rejection happens before recursive walk, schema compilation,
rendering, provider spawn, or write as applicable.

No gateway `inspectPath`, `scanFile`, hash, read, backup, or copy call has an implicit/unbounded file
mode: it receives the one opaque monotonic `RepositoryReadBudget` held by the command context, rejects
the captured size first, and cannot reset its stateful aggregate counters or whole-operation deadline
per file. `inspectPath` reads only no-follow kind/identity/size; `scanFile` performs the sole content pass,
feeds the caller's bounded sink while independently hashing/counting, revalidates identity, and returns
the final digest-bearing observation. `readFileBounded` is only that scan plus a bounded collecting sink.
`scanFile` awaits every `AsyncByteSink.write`/`end` and retains at most one fixed-size unread chunk, so
a slow copy/content scanner applies backpressure instead of creating an unbounded queue.
`listDirectory` uses an identity-bracketed `opendir`-style iterator, not a whole-directory `readdir` or
recursive collection. It validates one bounded segment, calls `claimEntry` for that child's kind,
encoded path bytes, and reported size, and stops/closes the iterator at the first one-over condition
before appending that child or opening/collecting any body. Exact-limit, one-over-first, one-over-last,
and no-progress directory fixtures prove bounded memory and prompt handle closure.
Repository config, pack/override input, discovery
shadows, managed current/output candidates, report input, and restore preimages use a 16 MiB per-file
ceiling and the exact table/source-class plus shared-envelope ceilings above. Only the strictly typed transaction journal may
raise the per-file ceiling to IC-12's 64 MiB, never for a repository output or backup preimage. Add
one-over sparse fixtures for an intended managed output, a discovery shadow, and a restore preimage;
each must return the resource-limit/blocking diagnostic with zero backup, temporary, journal, or target
write.

Only the composition root owns `RepositoryReadBudgetFactory`; it creates one branded capability per CLI
or test-fixture command and installs it in `ReadOnlyRepositoryContext`. Fixed source-class profiles map
to the exact table above (`override` uses 64 MiB aggregate; `journal` alone permits 64 MiB per file),
and production loaders may neither construct nor replace the budget. Multi-file tests exhaust a shared
aggregate across consecutive `inspectPath`/`scanFile` calls and prove a fresh per-file budget cannot be
injected.

The committed-repository artifact scanner separately caps the tree at 100,000 entries/16 MiB encoded
tree bytes, each blob at 16 MiB, and aggregate streamed blob bytes at 256 MiB. Its `cat-file` batch
sessions use a 30-second no-progress deadline inside one 300-second monotonic whole-scan deadline; all
other Git processes retain IC-6's 30-second whole-process deadline.

### IC-17: injective terminal-safe output

No untrusted or caller-controlled free text reaches stdout or stderr directly, in either human or JSON
mode. The Phase 1 `terminal-safe-v1` module fatal-decodes incremental UTF-8 and exposes two closed
streaming encoders. Human mode produces an injective display spelling: literal backslash becomes `\\`,
double quote becomes `\"`, every C0 code point including LF becomes `\xHH`, DEL and every C1
code point become `\xHH`, and Unicode line separators U+2028/U+2029 plus bidi controls
U+061C, U+200E, U+200F, U+202A through U+202E, and U+2066 through U+2069 become uppercase
`\u{HHHH}`. The scalar/free-text API always escapes LF. Only the trusted record/diff parser may consume
a source LF outside that API; the renderer emits its own structural LF after a fixed field or diff-line
prefix, so payload bytes cannot create an unprefixed line;
raw CR, tab, backspace, ESC, BEL, CSI, OSC, and other control bytes are never emitted. Literal text that
already looks like an escape remains distinguishable because its backslash is escaped.

Human unified-diff markers and fixed prompts are closed ASCII emitted by the renderer; every payload
line, header path, contributor display, and free-text diagnostic field passes through the human encoder
first. JSON mode does not substitute the human display spelling. Its string serializer preserves the
original Unicode scalar value for `JSON.parse` while emitting quote/backslash with normal JSON escapes,
every C0/DEL/C1 code point as uppercase-hex `\u00XX`, and every listed line separator/bidi control as
uppercase-hex `\uXXXX`; those code points therefore never occur raw in JSON bytes. A literal backslash that begins
text resembling either escape is itself escaped, so the serialized bytes remain injective. This
boundary covers Unicode
`PortableRelativePath` values, Markdown link targets, headings and source snippets, requested formatter
tokens/basenames, errors, and all other non-enum strings. Only closed ASCII enums, fixed messages,
lowercase hex digests, canonical decimal integers, and renderer punctuation may bypass it.

Encoding is a bounded streaming transform with fatal split-code-point handling and no normalization.
Every diagnostic, diff, aggregate-plan, report, and output limit counts encoded UTF-8 bytes before each
awaited sink write. Overflow or malformed UTF-8 returns `EVK_SECURITY_RESOURCE_LIMIT` or
`EVK_SECURITY_OUTPUT_ENCODING_INVALID` with closed reason `malformed-utf8` or `non-scalar-value` and
zero prompt/confirmation/write. Interactive confirmation starts only after the
complete terminal-safe plan and fixed ASCII prompt have been written and `stdout.flush()` succeeds.
Fixtures split ESC/CSI/OSC-52, CR/backspace, LF, DEL/C1, U+2028/U+2029, and every bidi control across input chunks and prove
the output contains only the specified safe spelling. In human mode, an ESC byte and literal characters
`\x1B`, and a bidi code point and literal characters `\u{202E}`, produce different bytes. In JSON mode,
assert both that the raw output has no unescaped terminal/bidi code point and that `JSON.parse` returns
the exact original scalar string; a real bidi value and literal characters `\u202E` serialize to
different bytes and round-trip to their distinct originals. A diagnostic reason containing
`x\nPlan digest: <fake>` and a diff line with the same payload must never create a raw unprefixed prompt,
digest, or record line.

## 2. Planned repository shape

This is a responsibility map, not a staging wildcard. Exact paths, expected statuses, and Git modes
are frozen in the five plan-owned manifests and repeated in each subsection's **Files** block.

| Area | Responsibility | First phase |
|---|---|---:|
| Root config/workflow | Local-state ignore, human Biome exclusions, native CI | 1 / 3 |
| `configs/ai` | Public instruction-only pack and sole canonical EVK content | 1 |
| `packages/ai-tooling/schemas` | Seven versioned public schemas | 1 |
| `packages/ai-tooling/src/json`, `config`, `pack` | Strict JSON, projections, rendering, pack contracts | 1 |
| `packages/ai-tooling/src/path`, `git`, `repository`, `resolve`, `performance` | Pure tracked-local resolver | 2 |
| `packages/ai-tooling/src/adapters`, `ownership`, `docs`, `formatter` | Project outputs and read-only audits | 3 |
| `packages/ai-tooling/native/win32-helper` | Private Windows identity then process-tree helper | 2 / 3 |
| `packages/ai-tooling/src/fs` | Read-only containment, then the single mutation gateway | 2 / 4 |
| `packages/ai-tooling/src/transaction`, `recovery`, `commands` | Contained mutation and recovery | 4 |
| `packages/ai-tooling/tests` and `scripts` | Unit/integration/native/package/security/performance evidence | 1-5 |
| `docs/ai-tooling`, system overview, root README | Durable user/author/security/product docs | 1-5 |
| Root config, lock, overrides, Codex/Claude outputs | Real devkit self-host state | 5 |

The generated self-host files are absent until Phase 5. No root `AGENTS.md` or `CLAUDE.md` is
hand-authored.

## 3. Mandatory 2-5 minute TDD microcycle

Every behavior bullet below is executed one fixture row at a time. One checkbox action writes one
literal test row, the next runs the exact focused command, the next adds only the production branch
needed by that row, and the next reruns the same command. Do not batch a table of cases behind an
untested implementation.

When a task's planned module/export does not exist yet, the first command may produce one structural
RED only if Vitest discovers the exact intended test file and fails solely on that exact missing
module/export. Add the smallest typed stub at the task's declared interface; it must throw the stable
internal not-implemented diagnostic and contain no product branch. Rerun immediately and require the
named test/assertion to fail for the missing behavior. Only this second, behavioral RED authorizes the
implementation. A config/filter/no-tests/network/fixture-discovery failure never counts. Matrix text
such as `RED missing module` abbreviates this mandatory structural-RED → typed-stub → named-behavioral-
RED sequence. Every such stub satisfies the declared TypeScript interface but throws the exact string
described here by zero-separator concatenation of fragments `EVK_INTERNAL_` and `NOT_IMPLEMENTED` as a
temporary working-tree-only sentinel. The transient stub source must encode the resulting value as one
contiguous ASCII string literal, never as a source/runtime concatenation, so the artifact scanner can
detect a forgotten stub. It never enters
`DIAGNOSTIC_CODES`, a committed test fixture, or a package. Remove the sentinel branch and literal
before that row's GREEN command. The Phase 1 production policy and adversarial test reconstruct the
forbidden value from separated numeric byte fragments at runtime; no committed scanner/test/fixture
contains it contiguously. The artifact gate rejects the resulting code or message from every candidate commit.
For every behavioral RED/GREEN command below:

- **Expected RED:** exit `1`; the verbose output names at least one intended test and its assertion
  fails for the missing behavior stated in that task—not filter, import, config, runner, network, or
  fixture discovery.
- **Expected GREEN:** exit `0`; verbose output names the same intended test, it is not skipped or
  retried, and the task's before/after no-write or byte assertion also passes. A native file may skip
  only when its declared target differs from the current IC-8 tuple; the workflow asserts the exact
  skip/run counts and a complementary matrix job must execute that file's intended assertions.

The exact first-test style is:

```ts
it('rejects duplicate decoded keys before schema validation', () => {
  const bytes = new TextEncoder().encode('{"name":1,"\\u006eame":2}');
  expect(() => parseStrictJson(bytes, { kind: 'fixture', label: 'duplicate-key' })).toThrowError(
    expect.objectContaining({ diagnostic: expect.objectContaining({ code: 'EVK_CONFIG_JSON_INVALID' }) }),
  );
  expect(schemaValidateSpy).not.toHaveBeenCalled();
});
```

The corresponding smallest production seam is the exact IC-1 signature and a decoded-key set in the
current object frame; later rows extend that same implementation. Other tasks use their own exact
interface block and literal fixture/output named below, not generic mocks or snapshot-only assertions.

| Task | Exact focused command | First named behavioral RED assertion / GREEN result |
|---|---|---|
| 1.0 | `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/verify-phase-delta.spec.ts --passWithNoTests=false --reporter=verbose` | `rejects an unexpected deletion`; RED missing verifier, GREEN exact status/mode rejection |
| 1.1 | `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/repository-ignore.spec.ts --passWithNoTests=false --reporter=verbose` | `ignores local state but not the repository lock`; RED missing rule, GREEN five exact probes |
| 1.2 | `pnpm --filter @evk-soft/ai-tooling run build && pnpm --filter @evk-soft/ai-tooling exec vitest run tests/package/package-contract.spec.ts tests/security/artifact-scan.spec.ts --passWithNoTests=false --reporter=verbose` | `exports only the public root and schemas` and `rejects an unlisted artifact`; RED incomplete manifest/missing scanner, GREEN fresh-build tar entries plus closed phase scan |
| 1.3 | `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/strict-json.spec.ts tests/unit/terminal-safe.spec.ts --passWithNoTests=false --reporter=verbose` | `rejects duplicate decoded keys before schema validation` and `never emits a raw terminal control`; RED accepted/missing parser/encoder, GREEN exact diagnostic and injective bytes |
| 1.4 | `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/schema-registry.spec.ts tests/package/schema-bytes.spec.ts --passWithNoTests=false --reporter=verbose` | `compiles every root with network disabled`; RED missing schema, GREEN seven offline roots |
| 1.5 | `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/git-url-v1.spec.ts tests/unit/configuration-digest.spec.ts --passWithNoTests=false --reporter=verbose` | `rejects Unicode host without runtime URL parsing`; RED missing normalizer, GREEN exact vector bytes |
| 1.6 | `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/render-json.spec.ts tests/integration/pack-build.spec.ts --passWithNoTests=false --reporter=verbose` | `renders one final LF without formatter`; RED missing renderer, GREEN byte-identical trees |
| 1.7 | `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/core-pack.spec.ts --passWithNoTests=false --reporter=verbose` | `ships exactly grounding and plan resources`; RED missing metadata, GREEN reviewed six-file pack |
| 2.1 | `pnpm --filter @evk-soft/ai-tooling run build && pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/portable-key.spec.ts tests/unit/unicode-sources.spec.ts tests/package/unicode-table.spec.ts tests/package/package-contract.spec.ts --passWithNoTests=false --reporter=verbose` | `passes Unicode 17 normalization corpus`; RED missing table/dependency contract, GREEN fresh-build package/vendor cross-check |
| 2.2 | `pnpm --filter @evk-soft/ai-tooling run build && pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/win32-protocol.spec.ts tests/native/win32-helper.native.spec.ts tests/unit/git-provider.spec.ts tests/unit/git-discovery.spec.ts tests/integration/git-index.spec.ts tests/package/package-contract.spec.ts --passWithNoTests=false --reporter=verbose` | `uses exact native identity and literal NUL-delimited tracked paths`; RED discovered test reports missing helper/provider/script contract, GREEN test-owned fresh native build plus frozen identity/anchored query |
| 2.3 | `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/source-capability.spec.ts tests/integration/local-pack-source.spec.ts --passWithNoTests=false --reporter=verbose` | `rejects npm before acquisition`; RED missing resolver, GREEN exact safe-core diagnostic |
| 2.4 | `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/catalog.spec.ts tests/unit/overrides.spec.ts --passWithNoTests=false --reporter=verbose` | `rejects incompatible override base digest`; RED missing graph, GREEN deterministic contributors |
| 2.5 | `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/capabilities.spec.ts --passWithNoTests=false --reporter=verbose` | `rejects undeclared executable bytes`; RED missing inventory, GREEN render/copy spies untouched |
| 2.6 | `pnpm --filter @evk-soft/ai-tooling run build && pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/candidate.spec.ts tests/integration/pure-pipeline.spec.ts tests/performance/resolver-budget.spec.ts tests/package/package-contract.spec.ts --passWithNoTests=false --reporter=verbose` | `renders the same candidate twice`; RED missing pipeline/script contract, GREEN fresh-build digests/zero-write plus harness contract |
| 3.1 | `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/platform-discovery-fixture.spec.ts --passWithNoTests=false --reporter=verbose` | `matches the dated source hashes`; RED absent evidence, GREEN exact official-path fixture |
| 3.2 | `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/codex-adapter.spec.ts tests/unit/claude-code-adapter.spec.ts tests/unit/target-registry.spec.ts --passWithNoTests=false --reporter=verbose` | `registers every byte-free target before rendering five exact leaves`; RED missing adapter/registry, GREEN target snapshot plus golden second render |
| 3.3 | `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/discovery-shadows.spec.ts tests/integration/registered-adapter-pipeline.spec.ts --passWithNoTests=false --reporter=verbose` | `rejects an unmanaged discovery shadow before rendering`; RED missing census/registered renderer, GREEN config-selected order and zero writes |
| 3.4 | `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/ownership-check.spec.ts tests/integration/read-only-commands.spec.ts --passWithNoTests=false --reporter=verbose` | `reports modified generated output without writing`; RED missing command, GREEN stable result/census |
| 3.5 | `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/link-checker.spec.ts --passWithNoTests=false --reporter=verbose` | `rejects exact-case mismatch offline`; RED missing checker, GREEN no network/write calls |
| 3.6 | `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/direct-provider.spec.ts tests/integration/node-entry-provider.spec.ts --passWithNoTests=false --reporter=verbose` | `rejects parent/global Node resolution`; RED missing resolver, GREEN both frozen file identities |
| 3.7 | `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/ring-buffer.spec.ts tests/unit/formatter-environment.spec.ts tests/native/posix-process-group.native.spec.ts --passWithNoTests=false --reporter=verbose` | `waits for a lingering same-group descendant`; RED missing runner, GREEN bounded quiescent tree |
| 3.8 | `pnpm --filter @evk-soft/ai-tooling run build && pnpm --filter @evk-soft/ai-tooling run build:native && pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/win32-protocol.spec.ts tests/native/win32-helper.native.spec.ts tests/package/package-contract.spec.ts --passWithNoTests=false --reporter=verbose` | `starts no code when Job setup fails`; RED missing helper/native packaging contract, GREEN fresh-build exact protocol/tree/package result |
| 3.9 | `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/formatter-outcome.spec.ts tests/integration/checkout-census.spec.ts tests/integration/formatter-runner.spec.ts --passWithNoTests=false --reporter=verbose` | `forbids unchanged after post-census failure`; RED missing orchestrator, GREEN exhaustive precedence |
| 3.10 | `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/biome-exclusions.spec.ts tests/unit/await-native-validation.spec.ts --passWithNoTests=false --reporter=verbose` | `preserves registered bytes under Biome`; RED missing exclusion, GREEN exact config/workflow contract |
| 4.1 | `pnpm --filter @evk-soft/ai-tooling run build:native && pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/local-state-prerequisite.spec.ts tests/unit/repository-filesystem-mutation.spec.ts tests/native/repository-filesystem.native.spec.ts --passWithNoTests=false --reporter=verbose` | `rejects ignore drift and ancestor swap before replace`; RED freshly built old helper lacks mutation protocol, GREEN fresh helper/gateway blocks |
| 4.2 | `pnpm --filter @evk-soft/ai-tooling run build:native && pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/run-lock.spec.ts tests/unit/liveness.spec.ts tests/native/run-lock-liveness.native.spec.ts --passWithNoTests=false --reporter=verbose` | `does not reclaim a reused PID`; RED freshly built helper lacks process identity/provider, GREEN only exact dead owner proceeds |
| 4.3 | `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/journal.spec.ts tests/unit/mutation-plan-digest.spec.ts tests/unit/transaction-manager.spec.ts tests/native/transaction-recovery.native.spec.ts --passWithNoTests=false --reporter=verbose` | `keeps first init recoverable after every flush`; RED missing manager, GREEN prior/candidate/recoverable only |
| 4.4 | `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/recovery-inspect.spec.ts tests/unit/recovery-repair.spec.ts tests/integration/doctor-repair.spec.ts tests/integration/doctor-report.spec.ts --passWithNoTests=false --reporter=verbose` | `preserves evidence when journal is missing`; RED missing classifier, GREEN confirmed repair/report boundary |
| 4.5 | `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/init.spec.ts --passWithNoTests=false --reporter=verbose` | `rolls back a target race during first init`; RED init unavailable, GREEN no adopted/unmanaged bytes |
| 4.6 | `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/sync.spec.ts tests/integration/refresh-local.spec.ts --passWithNoTests=false --reporter=verbose` | `refreshes only a selected local digest`; RED commands absent, GREEN lock-only then stale output |
| 4.7 | `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/restore-generated.spec.ts tests/integration/restore-generated.spec.ts --passWithNoTests=false --reporter=verbose` | `rejects a leaf changed after confirmation`; RED command absent, GREEN preimage retained |
| 4.8 | `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/biome-exclusions.spec.ts --passWithNoTests=false --reporter=verbose` | `runs every Phase 4 native suite without real-checkout mutation`; RED workflow contract lacks Phase 4 paths, GREEN exact matrix steps |
| 5.1 | `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/git-provider.spec.ts tests/security/artifact-scan.spec.ts --passWithNoTests=false --reporter=verbose` | `opens only closed object batch sessions` and `rejects private prototype bytes without echoing them`; RED missing provider seam/hardening, GREEN fixed batch transport and finding class only |
| 5.7 | `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/security/artifact-scan.spec.ts --passWithNoTests=false --reporter=verbose && node packages/ai-tooling/dist/cli.js docs check-links` | `requires every final durable section anchor`; RED missing final anchor, GREEN coverage plus offline link closure |

Documentation-only edits use the named checker as RED/GREEN evidence; phase gates and commits are
review boundaries, not new production behavior, so they use their complete command blocks below.
Task 2.7 is a documentation-only review before the link checker exists. Task 5.2 is a cross-feature
contract validation of already-green Phase 4 behavior, not a new behavior implementation. Tasks
5.3-5.6 likewise add no product behavior: they author/review the real devkit inputs and run
ordered operational validation against the already-green Phase 4 lifecycle and Phase 5.2 disposable
self-host fixture. They use the exact validation, capture, postcondition, and formatter commands in
their task blocks and must not manufacture a synthetic RED. If any command exposes missing behavior,
stop, add a named failing test and its exact path to the relevant **Files** block/phase manifest
through owner-reviewed plan amendment, then resume TDD.

## Phase 1 normative contract — contracts and instruction-only pack

**Phase owner gate:** The owner-approved plan/start phrase authorizes this phase. Stop after the
Phase 1 commit.

**Phase allowlist:** `.gitignore`, `package.json`, `pnpm-lock.yaml`, `configs/ai/**`,
`packages/ai-tooling/**`, `docs/ai-tooling/EXTENDING-PACKS.md`, `docs/ai-tooling/SECURITY.md`, and
`docs/system-overview/ai-tooling.md`.

### 1.0 Bootstrap the isolated test harness and exact phase-delta verifier

This is build scaffolding, not production behavior; it exists so every later red test fails for the
named missing contract rather than for package or test-runner discovery.

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

```ts
export interface PhaseDeltaOptions {
  readonly phase: 1 | 2 | 3 | 4 | 5;
  readonly mode: 'worktree' | 'cached' | 'commit';
  readonly base?: string;
  readonly commit?: string;
}

export function verifyPhaseDelta(options: PhaseDeltaOptions): Promise<void>;
```

`base` and `commit` are forbidden outside `commit` mode and both required inside it as full lowercase
40-hex object IDs for this repository; symbolic revision expressions are rejected. The bootstrap
CLI exports only `main(argv: readonly string[], io: CliIo): Promise<number>` and rejects every product
command.

- Create the minimal private workspace package with ESM, Node `>=24.0.0`, Vitest `4.1.10`,
  `@types/node@24.13.3`, and only the scripts needed to run one focused test. Add root
  `check:ai-tooling` and append it to the existing `check` chain without changing the existing Biome
  or runtime commands, then run
  `pnpm install --lockfile-only` followed by `pnpm install --frozen-lockfile --ignore-scripts` in the
  clean Phase 1 worktree.
- Create a test config that discovers only explicit `tests/**/*.spec.ts` files and has no network,
  home-directory, retry, or pass-with-no-tests fallback. Run
  `pnpm --filter @evk-soft/ai-tooling exec vitest --version`; require `4.1.10`.
- Write verifier tests using temporary Git repositories: exact worktree, cached, and one-commit
  equality succeeds; one extra untracked or tracked path, missing path, unexpectedly deleted path,
  wrong expected status, wrong mode/type, duplicate, unsorted, CRLF, invalid UTF-8, non-ASCII/invalid-
  component, or renamed path fails closed. Prove worktree mode rejects a nonempty index. Add two-
  commit and merge-commit histories. Add `info/grafts` that makes a real merge appear single-parent and
  shallow metadata that hides a real parent; commit mode must still parse the raw exact candidate
  object, reject both merge/parent mismatch cases, and never call `HEAD^` or `rev-list`. Cover zero,
  one, two, duplicate, malformed, and different raw `parent` headers plus a HEAD/ref swap. Disable Git
  rename detection and include additions, modifications, type changes, conflicts, and deletions. Add an
  active replace ref for the approved base/manifest, a partial-clone/promisor missing-object remote-helper marker, hostile system/global
  config and global ignore, inherited Git routing variables, absolute/relative/tilde/UNC repository-
  config includes, local/worktree `filter.*` plus a stat-dirty filtered-path helper marker,
  linked-worktree gitfile/commondir routing, both object-alternates files, linked or changed
  `info/exclude`/`info/attributes`,
  executable swap, and config-root cleanup-race fixtures; require all hostile admin-state cases to
  fail before the phase-delta query or object read and require the frozen absolute Git,
  `--no-replace-objects --no-lazy-fetch --literal-pathspecs`, `GIT_NO_LAZY_FETCH=1`, isolated zero-byte
  config/excludes/attributes files, shared IC-6 config/filter/admin-state preflight, and redacted
  preserve-first failure. Run
  `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/verify-phase-delta.spec.ts`; first
  require failure because the verifier is absent, then implement it and require exit `0`.
- Parse the already committed plan-owned Phase 1-5 manifests; do not generate or modify them.
  The verifier calls only the §0.3 frozen Git with an argv array, passes all isolation options plus
  `--no-renames`, parses NUL-delimited status output, and rejects a manifest or verifier byte change
  before trusting either.
- Write the initial package README with the package purpose, unpublished/source-build status,
  Node floor, intended root/schema/package exports, and statement that project outputs do not exist
  until later phases. It must not claim a registry release or delivered mutation command.

### 1.1 Add and prove the repository-local state boundary

**Files:**

- Modify: `.gitignore`
- Create: `packages/ai-tooling/tests/integration/repository-ignore.spec.ts`
- Create: `packages/ai-tooling/tests/helpers/temp-repository.ts`

**Interfaces:**

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

No production CLI write exists yet.

- Add a failing integration test that initializes a temporary Git repository with the real
  `.gitignore`, runs the five required `git check-ignore -v --no-index` probes, asserts that the first
  four resolve to the temporary repository's `.gitignore`, and asserts exit `1` plus empty stdout for
  `ai-tooling.lock.json`.
- Make the helper set `GIT_CONFIG_NOSYSTEM=1`, point `GIT_CONFIG_GLOBAL` at an explicit empty
  temporary file, set `GIT_NO_LAZY_FETCH=1`, and, when the frozen provider is Git 2.45.0+, also pass global `--no-lazy-fetch`; always pass
  `-c core.excludesFile=<empty-file>` before every probe. Assert the output's
  ignore provenance is the temporary repository file, never ambient system/global configuration.

```ts
it('ignores local state but not the repository lock', async () => {
  const repo = await createTempRepository({ copy: ['.gitignore'] });
  for (const path of [
    '.ai-tooling/state.json',
    '.ai-tooling/backups/probe',
    '.ai-tooling/run.lock',
    '.ai-tooling/reports/probe.json',
  ]) {
    const result = await repo.git('check-ignore', '-v', '--no-index', path);
    expect(result).toMatchObject({ exitCode: 0 });
    expect(result.stdout).toMatch(/\/\.ai-tooling\//);
  }
  expect(await repo.git('check-ignore', '-v', '--no-index', 'ai-tooling.lock.json')).toMatchObject({
    exitCode: 1,
    stdout: '',
  });
});
```

- Run `pnpm --filter @evk-soft/ai-tooling exec vitest run
  tests/integration/repository-ignore.spec.ts --passWithNoTests=false --reporter=verbose`; verify the
  named test executes and fails specifically because the repository rule is absent.
- Append the exact root-anchored line `/.ai-tooling/` under a new `# AI Tooling local state`
  comment in `.gitignore`; add no root-level coordination exception.
- Re-run the focused test and the five commands manually from the repository root. Verify only
  the expected paths are ignored.

### 1.2 Establish package, compiler, test, export, and publication boundaries

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

**Interfaces:** public root export `TOOLING_VERSION`, public schema subpath pattern, CLI
`main(argv: readonly string[], io: CliIo): Promise<number>`; no deep source export.

- Add a package-contract test that loads `packages/ai-tooling/package.json`, asserts version
  `0.1.0`, ESM type, exact `exports`, `bin`, and `files`, and rejects every key other than `.`,
  `./schemas/*.json`, and `./package.json`. Require `README.md` as an exact tar entry and verify its
  package-purpose, Node-floor, export-boundary, and not-yet-published statements.

```ts
expect(manifest.exports).toStrictEqual({
  '.': { types: './dist/index.d.ts', import: './dist/index.js' },
  './schemas/*.json': './schemas/*.json',
  './package.json': './package.json',
});
expect(manifest.bin).toStrictEqual({ 'ai-tooling': './dist/cli.js' });
expect(manifest.files).toStrictEqual(['dist', 'schemas', 'README.md', 'LICENSE']);
```

- Run the focused test; verify the bootstrap manifest fails because the public exports, bin,
  package contents, and publication metadata are intentionally incomplete.
- Create the package manifest with exact pinned runtime dependencies `ajv@8.20.0`,
  `json-canonicalize@2.0.0`, and `jsonc-parser@3.3.1`; exact dev dependencies Vitest and coverage
  `4.1.10` plus `@types/node@24.13.3`; Node `>=24.0.0`; `publishConfig.access: public`; and the
  Phase 1 script subset from IC-4.
- Immediately after that manifest change, run `pnpm install --lockfile-only` and then
  `pnpm install --frozen-lockfile --ignore-scripts`. Require the lockfile to record those exact direct
  versions, `pnpm --filter @evk-soft/ai-tooling list --depth 0` to resolve each one from the clean
  worktree, and `git status --short` to contain only Phase 1 manifest paths. No lifecycle script may
  run, and no later Task 1 import/build/test command may start before this second install succeeds.
- Copy the tracked root MIT `LICENSE` bytes unchanged to both package roots. Set both package
  manifests' `license` field to `MIT`; package tests compare both copies byte-for-byte with the root
  license and require both tarballs to contain exactly one `LICENSE` entry.
- Verify the bootstrap already installed these exact root scripts:

```json
"check:ai-tooling": "pnpm --filter @evk-soft/ai-tooling run check",
"check": "pnpm run check:biome && pnpm run check:runtime && pnpm run check:ai-tooling"
```

- Implement `src/index.ts` with only stable library types/constants intended for public use and
  implement `src/cli.ts` with a Node shebang and an injected `main` that, for every argv, writes the
  zero-separator concatenation of `AI Tooling command dispatch is unavailable` and
  ` in the Phase 1 bootstrap.\n` to the injected stderr sink, where `\n` denotes one LF byte, flushes
  it, and returns exit `2`. The Phase 1 `src/cli.ts` source must encode the resulting bytes as one
  contiguous ASCII string literal, never as a source/runtime concatenation, so the later artifact
  scanner detects any leftover branch. This fixed ASCII scaffolding response is not a `Diagnostic` or
  `ToolingError` and carries no `EVK_*` code. Replace its branches only as typed command handlers land;
  do not add product behavior early, and remove the literal completely before the final Phase 5 gate.
- Create `configs/ai/package.json` as public `@evk-soft/ai-pack-core@0.1.0`, ESM, with `files`
  limited to `pack.json`, `rules`, `skills`, `README.md`, and `LICENSE`; it has no executable,
  lifecycle script, dependency, or code export.
- Implement `check-package-contents.mjs` to create a private exclusive no-follow staging root,
  invoke the pinned TypeScript compiler with explicit output/declaration/build-info paths below that
  root, copy only the closed manifest/static allowlist, and create one exclusive empty `packed`
  destination below it. The staged package manifest must contain no lifecycle script, pnpm hook, or
  config-file entry. Resolve the already installed workspace-pinned pnpm launcher without Corepack or
  network acquisition to the already-running frozen `process.execPath` plus the pnpm package's real
  JavaScript CLI entrypoint; native pnpm executables and command wrappers are not Phase 1 providers.
  Require its exact `packageManager` version and revalidate every launcher identity before/after use.
  Invoke that closed tuple directly with `shell: false`, no stdin, the staging root as `cwd`,
  exact argv `--ignore-scripts --ignore-pnpmfile pack --json --pack-destination <packed>`, and an
  empty-base Phase 1 package-check environment. Its common keys are private owner-only `HOME`,
  `XDG_CONFIG_HOME`, `XDG_CACHE_HOME`, `XDG_DATA_HOME`, `TMPDIR`, `TMP`, `TEMP`, and `PNPM_HOME`; on
  Windows add only private `USERPROFILE`, `APPDATA`, and `LOCALAPPDATA` and deliberately omit
  `SystemRoot`, `WINDIR`, `PATH`, and `PATHEXT`; on POSIX add only the fixed system `PATH`, `LANG=C`, and
  `LC_ALL=C`. IC-9's fuller Windows environment is unavailable until Phase 3 obtains and verifies
  `FrozenWindowsDirectory`; Phase 1 must never substitute caller environment values. All private
  directories and the zero-byte `NPM_CONFIG_USERCONFIG` are below separately
  identity-bracketed config/cache/temp roots. Inherit no `NODE_OPTIONS`, `npm_config_*`, `pnpm_*`, shell, hook, store,
  registry, proxy, or lifecycle setting; pass only those exact keys plus explicit
  `npm_config_ignore_scripts=true` and `npm_config_ignore_pnpmfile=true` defense in depth.
  Stream stdout into a 64 MiB incremental JSON limit, count stderr while retaining only a 64 KiB
  internal ring, and enforce a 300-second monotonic deadline plus five-second direct-child terminate/
  reap deadline. No child bytes enter diagnostics. A timeout, overflow, signal, launcher identity drift,
  or unverified termination preserves the private roots and returns only a closed redacted failure;
  because the frozen trusted pnpm has lifecycle/hooks disabled, this boundary does not claim to sandbox
  an arbitrary replacement executable or permit provider-selected descendants.
  Never read or copy the working package's `dist` directory. Strict-parse bounded JSON as exactly one
  result and require its reported tar path to resolve to the one direct regular `.tgz` child of `packed`;
  reject an absolute/outside/nested/link/reparse/missing/extra child, identity change, or size above the
  compressed limit before opening content. Stream the same open no-follow identity through the parser
  and revalidate length/digest/identity afterward. Parse the reported gzip/tar bytes
  with a small bounded read-only ustar/PAX parser built from `node:zlib`, and fail on an undeclared path,
  duplicate tar entry, unsafe PAX path, schema byte mismatch, absolute path, credential fixture pattern,
  or supplied forbidden-token policy. Revalidate the staging-root identity before each operation and
  clean it through a no-follow verified walk after all children/streams are quiescent; preserve it with
  only a redacted diagnostic if termination or cleanup safety is uncertain.
- Add hostile package-process fixtures: staged `prepack`/`prepare`/`postpack`, parent/global
  `.pnpmfile.cjs` `beforePacking`, project/user config, environment output/store/registry redirection,
  caller/user config/cache/temp markers for every platform key, a forged JSON outside path,
  symlink/reparse tar, extra tar, launcher swap, stalled/flooded child, and
  network/helper marker. Require zero script/hook/network execution, output only in the contained
  destination, bounded redacted diagnostics, and preserve-first cleanup on identity/termination doubt.
  On Windows, assert the child receives no `SystemRoot`, `WINDIR`, `PATH`, or `PATHEXT` and the real
  pinned pnpm pack completes through absolute Node/CLI paths. If that exact environment is not viable,
  stop and amend the approved plan; do not inherit a caller value or add an unreviewed lookup fallback.
- Freeze package-parser limits: 64 MiB compressed bytes; exactly one gzip member with valid reserved
  flags/header CRC/data CRC/ISIZE, at most 4 KiB optional-header bytes, and exact EOF with no trailing
  member/byte; 256 MiB inflated tar bytes; 100,000 entries; 16 MiB per regular file; 4 KiB per fatal-
  UTF-8 portable path and 16 MiB aggregate path bytes; 100,000 per-file PAX records, 16 KiB per record,
  and 16 MiB aggregate PAX bytes. Parse tar checksum and nonnegative size/mode only as checked canonical
  ASCII octal or POSIX base-256 safe integers. Accept only regular file, zero-size directory, and a
  per-file PAX header with unique canonical `path`/`size` keys; reject global/GNU headers, duplicate or
  chained overrides, links, sparse files, devices, FIFO, unknown types/keys, nonzero padding, missing two
  zero end blocks, and decompressed trailing bytes. Add exact-at/one-over fixtures for every count/size,
  gzip multi-member/bomb/CRC/ISIZE, PAX override ambiguity, base-256 overflow/negative, and every rejected
  tar type; no failing fixture may allocate its declared size or echo payload bytes.
- In the package-contract fixture, leave a sentinel executable and hash manifest under working
  `dist/native/win32-x64`, plus a stale portable file elsewhere in working `dist`; require Phase 1/2
  source-only packaging to contain neither byte. This proves the isolated staging build, not filename
  filtering of a live output tree, is the package input.
- Write the artifact-scan test first and require failure because its script is absent. Implement a
  fail-closed scanner whose `--phase N --tree|--cached` input set comes only from the frozen phase
  manifest/verifier. Phase 5 later adds the independent committed-tree mode
  `--repository <commit-ish>`. In `--tree`, scan only identity-bracketed worktree regular-file bytes and
  revalidate each file/ancestor before and after its one bounded stream. In `--cached`, take the exact
  index object ID/mode map, revalidate the index before/after, and stream those Git blobs through the
  frozen isolated no-replace provider; this object-reading mode requires Git `>=2.45.0` before spawn and
  passes global `--no-lazy-fetch` plus `GIT_NO_LAZY_FETCH=1`. An older Git returns capability-unavailable;
  never read worktree bytes for a cached result. Add staged-hostile/
  clean-worktree and staged-clean/hostile-worktree fixtures and require the two modes to report only
  their selected source. It strict-parses the explicit policy, rejects unreadable/unlisted paths,
  credentials, synthetic prototype markers, absolute user paths, forbidden executable/package entries,
  missing license notices, and dependency-license conflicts, and emits only relative path plus finding
  class. Run `node packages/ai-tooling/scripts/check-stage1-artifacts.mjs --phase 1 --tree`.
- Run `pnpm --filter @evk-soft/ai-tooling run build` and the focused package-contract test; verify
  both pass.

### 1.3 Implement stable diagnostics and strict I-JSON parsing

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

**Interfaces:** `JsonValue`, `DiagnosticCode`, `ToolingError`, `parseStrictJson`,
`streamHumanTerminalSafeUtf8`, `streamJsonTerminalSafeString`, and `renderMachineDiagnostic`.

- Write table tests that demand exact offset-bearing standard-JSON diagnostics for a UTF-8 BOM,
  comments, trailing commas, duplicate decoded keys (including escape-equivalent keys), invalid
  UTF-8, lone surrogates, overflow, underflow, decimal/integer non-roundtripping numbers, empty input,
  and trailing tokens. Include accepted `0.1` and `2^53` boundary cases. Add a compile-time fixture that
  rejects `parseStrictJson<ConfigV1>(...)` and direct construction of the branded document; parsing alone
  never manufactures a domain type.
- Add a machine-output test that asserts a stable object with every field and no source body,
  token, credential, or absolute fixture path.
- Add IC-17 adversarial tests before implementation: human and JSON quote/backslash injectivity,
  every hazardous control range and bidi code point, literal-escape collisions, split UTF-8, malformed
  UTF-8, exact/one-over encoded limits, slow sink, and write/flush failure. For JSON assert raw bytes
  contain no hazardous scalar and `JSON.parse` returns the exact original logical strings.
- Run `pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/strict-json.spec.ts
  tests/unit/terminal-safe.spec.ts --passWithNoTests=false --reporter=verbose`; require both named
  behavioral failures after their typed stubs, not a missing-test/config failure.
- Implement exactly the following final closed `as const` registry. No dynamically synthesized
  code and no member named by zero-separator concatenation of `EVK_INTERNAL_` and `NOT_IMPLEMENTED` is
  permitted. The temporary RED sentinel described in §3 must be absent before this task's GREEN
  command and from every Phase 1-5 candidate/package.

```ts
export const DIAGNOSTIC_CODES = {
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
} as const;
```

  Encoding-invalid reasons are exactly `malformed-utf8` and `non-scalar-value`; formatter reasons are
  exactly `FormatterReason`. Source kind, parser/schema detail, containment/resource detail, and
  recovery state remain closed machine-readable fields/reasons rather than new codes.

```ts
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
  }
}
```

- Implement the IC-1 lexical visitor, duplicate stack, UTF-8 decoder with `fatal: true`, and
  recursive I-JSON walk. Preserve number token offsets and implement the exact decimal-rational
  comparison from IC-1; do not use `Number.isSafeInteger` as a proxy.
- Implement IC-17 as the only free-text human/JSON output boundary and route stable diagnostics
  through it now; later command renderers must reuse this module rather than adding their own terminal
  sanitizer.
- Re-run the exact two-file focused command and snapshot machine diagnostics; verify all invalid
  inputs fail before schema validation and every valid JSON value round-trips unchanged.

### 1.4 Define byte-stable schemas and the offline registry

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

**Interfaces:** IC-2 `OfflineSchemaRegistry`; handwritten closed `ConfigV1`, `PackV1`, `RuleV1`,
`SkillV1`, `OverrideV1`, `LockV1`, and `StateV1` TypeScript domain types coupled to schema names by
`SchemaTypeMap`.

- Write tests that assert every schema has draft 2020-12 `$schema`, the exact version-tagged
  `$id`, relative `$ref` only, `additionalProperties: false` on every closed object, literal defaults
  on every optional config property, and no executable asset accepted as an instruction file. Add
  compile-time fixtures proving `validate('lock', document)` is `LockV1`, cannot be assigned to
  `ConfigV1`, and cannot accept a caller generic or mismatched schema-name/result pair; runtime forged
  names or document brands fail before validation output.
- Keep source schemas as authored JSON and the closed `*V1` types as reviewed TypeScript; do not add
  an undeclared schema-to-TypeScript generator or claim generated types. For every object/union branch,
  make typed valid fixtures `satisfies` the corresponding `*V1`, validate their exact JSON bytes through
  the mapped schema, and add unknown/missing/wrong-type/cross-branch negative fixtures. Compile-time
  tests cover both domain-to-`JsonValue` serialization and exact mapped validator return types; runtime
  schema validation remains the authority for untrusted bytes.
- Add cold-cache tests that monkeypatch `http.request`, `https.request`, `fetch`, DNS lookup, and
  proxy environment variables to throw; instantiate and compile each schema root and validate every
  valid fixture.
- Add unresolved `$id`, metaschema, and vocabulary negative fixtures and verify compilation fails
  without a network attempt.
- Add a config negative fixture whose source is the bare Markdown URL string
  `https://example.invalid/pack.md`. Require config-schema rejection before source-provider selection,
  recursive source inspection, or any acquisition-capable call; a URL in instruction bytes remains a
  separate inert-content case in Task 2.5.
- Make every config `overrides[]` item a canonical portable repository-relative resource-directory
  path that is a strict lexical descendant of literal `ai/overrides`; the root itself is not a resource
  selection. Add schema fixtures for `ai/overrides/rules/evk-grounding` and reject `ai/overrides`, an
  absolute path, `configs/ai`, `.git`, generated-output roots, empty/dot/parent components, wrong case,
  and exact duplicate strings. This Phase 1 gate is structural and lexical only; it must not use a
  runtime Unicode normalizer or attempt portable-key equivalence before Task 2.1 provides the pinned
  Unicode 17 implementation. Schema rejection must precede source selection, repository/provider
  access, override discovery, or rendering.
- Run the focused schema tests; verify they fail for missing schemas.
- Write the seven complete schemas. Config v1 must recognize exactly `local`, `npm`, and `git`
  sources; managed/preview output; ordered platforms and override paths; fully defaulted hooks and
  plugin profile. Pack/resource schemas reserve declared capability and asset kinds without making
  them available. Lock records semantic selection digests and per-leaf ownership; state covers run
  lock, both journal directions and terminal outcomes, forward/rollback/retained staging, backup,
  recovery handoff/archive, and report metadata as separate closed version-1 definitions. Freeze the
  complete final Stage 1 `StateV1`, `SchemaTypeMap['state']` assignability, and positive/negative vectors
  in Phase 1; Phases 2-5 consume this schema and must not modify it.
- Implement the Ajv registry from IC-2 and map Ajv errors to deterministic redacted diagnostics
  sorted by instance path, schema path, and keyword.
- Build the package, pack it, extract it under a temporary directory, and assert each published
  schema byte-for-byte equals its source and retains its exact `$id`, `$schema`, and `$ref`.

### 1.5 Implement configuration projection, Git URL v1, JCS, and digests

**Files:**

- Create: `packages/ai-tooling/src/config/git-url-v1.ts`
- Create: `packages/ai-tooling/src/config/projection.ts`
- Create: `packages/ai-tooling/src/json/jcs.ts`
- Create: `packages/ai-tooling/tests/unit/git-url-v1.spec.ts`
- Create: `packages/ai-tooling/tests/unit/configuration-digest.spec.ts`
- Create: `packages/ai-tooling/tests/fixtures/config-digest/vectors.json`
- Create: `packages/ai-tooling/tests/fixtures/rfc8785/vectors.json`

**Interfaces:**

```ts
export function normalizeGitUrlV1(input: string): string;
export function configurationProjectionV1(config: ConfigV1): JsonObject;
export function packSelectionProjectionV1(config: ConfigV1): JsonObject;
export function sha256Jcs(value: JsonValue): Sha256Hex;
```

- Write approved equal-vector tests for member order, whitespace, escapes, explicit defaults, and
  equivalent ASCII Git URL spellings; write non-equal tests for every projected field and ordered
  array; write invalid tests for paths, IDs, duplicate arrays, Unicode hosts, userinfo, bracketed and
  numeric hosts, leading-zero ports, query, fragment, percent-encoded host, backslashes, and invalid
  percent triplets.
- Add RFC 8785 primitive, property-order, Unicode, and IEEE-754 fixtures; assert exact UTF-8 bytes,
  not parsed equality.
- Run both focused suites; verify imports fail.
- Implement Git URL v1 with a hand-written ASCII lexer and RFC 3986 transformations. Do not call
  `URL`, `URLSearchParams`, an IDNA function, or runtime host normalization.
- Implement the complete field-by-field version-1 projections. Omit only `$schema`; materialize
  every literal default; preserve ordered arrays and accepted string code points.
- Wrap `json-canonicalize` exactly as IC-3 and hash its UTF-8 bytes with `node:crypto` SHA-256.
- Re-run the focused suites twice under different `LANG`/`LC_ALL` values and assert identical
  bytes and digests.

### 1.6 Lock generated JSON and pack build bytes

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

```ts
export interface PackBuildResult {
  readonly pack: ValidatedPack;
  readonly destinationRoot: AbsolutePath;
  readonly files: readonly {
    readonly path: PortableRelativePath;
    readonly byteLength: number;
    readonly digest: Sha256Hex;
  }[];
}

export interface PackBuildDestination {
  readonly root: AbsolutePath;
  createDirectoryExclusive(path: PortableRelativePath): Promise<void>;
  writeFileExclusive(path: PortableRelativePath, bytes: Uint8Array): Promise<void>;
}

export interface ReadOnlySourceContext {
  readonly filesystem: ReadOnlyRepositoryFilesystem;
  readonly readBudget: RepositoryReadBudget;
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

- Write byte snapshots for nested metadata, long strings, Unicode, empty arrays/objects, and lock
  records. Assert UTF-8 without BOM, LF only, two spaces, stable per-schema key order, and exactly one
  final newline independent of Biome line width.
- Write `pack validate`/`pack build` tests that run with network APIs disabled, reject executable
  or undeclared assets, rewrite only non-schema metadata `$schema` to the version-tag URL, and copy
  schema/instruction bytes without changes.
- Run the focused suites; verify missing implementation failures.
- Implement a schema-key-order renderer over already validated `JsonValue`; never pass generated
  JSON through Biome or JCS.
- Implement pack validation/build as pure read/validate/render functions over injected
  `context.filesystem` reads with the exact shared `context.readBudget`, a gateway-created contained
  source reference, and an explicit trusted temporary destination writer. No source `AbsolutePath` or
  bare filesystem read is accepted. Phase 1 tests use only fake contexts/destinations; production CLI
  pack validate/build remains capability-unavailable until Task 2.3 wires the one real read-only
  repository context. It has no project mutation command.
- Re-run both suites and compare two independent build trees byte-for-byte.

### 1.7 Author and independently review the minimal public pack

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

**Interfaces:** stable resource IDs `evk-soft/rules/grounding` and `evk-soft/skills/plan`, with display
names `evk-grounding` and `evk-plan`; both require only the `instructions.markdown` capability.

- Write a failing integration test that validates the source pack, asserts exactly one rule and
  one skill, asserts all referenced files are declared, asserts no hidden file or executable-kind
  asset exists, and snapshots normalized contributor metadata.
- Run the focused test; verify missing pack metadata fails.
- Write `evk-grounding` as concise repository-grounding instructions: inspect repository rules
  and current state, distinguish evidence from assumption, preserve user changes, and verify claims.
  It must contain no devkit-specific command, branch policy, credential, organization name other than
  EVK package identity, or private-project wording.
- Write `evk-plan` as an instruction-only planning workflow: read requirements, map exact files
  and interfaces, produce small verifiable steps, state gates and exclusions, and stop before
  implementation. It must not contain executable scripts or tool-specific plugin metadata.
- Update durable docs for publisher edit rules, schema IDs, precedence vocabulary, package trust,
  strict JSON, and Phase 1 architecture. Do not link durable docs back to this plan or child spec.
- Run the core-pack test and a separate independent content/provenance review. Record reviewer
  conclusion and SHA-256 for all six canonical pack files in the phase evidence.

### 1.8 Phase 1 gate and commit

- Run:

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

- Re-run the five ignore probes, offline/cold-cache schema suite, duplicate/I-JSON suite, JCS and
  Git URL vectors, byte-copy package fixtures, and core-content review.
- Scan the full allowlist and both package tarballs for credentials, synthetic forbidden markers,
  absolute Windows/POSIX paths, undeclared files, lifecycle scripts, and license conflicts. No real
  private token or prototype byte is used as a fixture or policy value; the separate clean-room
  provenance review verifies process isolation rather than importing private bytes for comparison.
- Stage only the exact Phase 1 manifest paths and verify exact status/path/mode equality.
- Commit with `git commit --no-verify -m "feat(ai): establish Stage 1 contracts"`.
- Re-run the gate against committed `HEAD`, report the exact SHA and evidence, and stop for owner
  approval of Phase 2.

## Phase 2 normative contract — pure engine

**Phase owner gate:** Start only after the owner approves the exact Phase 1 commit.

**Phase allowlist:** `package.json`, `pnpm-lock.yaml`, `packages/ai-tooling/**`,
`docs/ai-tooling/EXTENDING-PACKS.md`, `docs/ai-tooling/SECURITY.md`, and
`docs/system-overview/ai-tooling.md`.

### 2.1 Generate and verify the pinned portable path key

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

**Interfaces:** `validatePortableRelativePath`, `portableComponentKey`, `portablePathKey`,
`isPortableAncestor`, and `UNICODE_CASE_FOLD_VERSION`.

- Add exact development dependency `@unicode/unicode-17.0.0@1.6.17`, run
  `pnpm install --lockfile-only`, review that only the tooling importer and deterministic resolution
  entries changed, then run `pnpm install --frozen-lockfile --ignore-scripts` and require the exact
  installed package version before writing its cross-check fixture. Update the package-contract test
  to require this exact Phase 2 dependency and reject every other dependency/script drift.
- Write tests for ASCII case, `ß`/`SS`, Greek sigma variants, Cherokee, composed/decomposed NFC,
  locale changes, slash boundaries, file-ancestor checks, and invalid empty/dot/backslash/drive/UNC/
  percent-encoded components. Add an exact rejection table for trailing dot and space, colon/ADS,
  `<`, `>`, `"`, `|`, `?`, `*`, U+0000/U+0001/U+001F, and case/extension variants of `CON`, `PRN`,
  `AUX`, `NUL`, `COM1`/`COM9`, and `LPT1`/`LPT9`. Assert every vector fails before portable keying and
  Add case/extension variants of `COM¹`/`COM²`/`COM³` and `LPT¹`/`LPT²`/`LPT³` to the same table.
  Assert every vector fails before a provider or filesystem spy is called. Feed schema-valid config override arrays through this
  validator and reject case/NFC-equivalent or otherwise duplicate portable keys before provider or
  filesystem access; exact string duplicates remain the earlier schema responsibility. Assert Turkish
  tailoring is not used. Parse and pass every applicable row of the official Unicode 17
  `NormalizationTest.txt` corpus.
- Define a closed strict-JSON source-manifest schema with exactly `schemaVersion: 1` and an ordered
  five-entry `sources` array. Each entry has only `name`, exact HTTPS `url`, nonnegative safe-integer
  `byteLength`, and `sha256:<64-lowercase-hex>`. Test missing, extra, reordered, duplicate, redirected,
  wrong URL, wrong length, and wrong digest cases with `unicode-sources.spec.ts`.
- Write a generator test that hashes the normative C/F input, cross-checks both installed package
  maps, runs twice, and compares its complete output to the checked-in file. Add adversarial duplicate
  and npm/package mismatch inputs and require failure.
- Run both focused suites; verify missing modules fail.
- With network permission, run exactly
  `node packages/ai-tooling/scripts/fetch-unicode-data.mjs --destination
  packages/ai-tooling/vendor/unicode-17`. The script requests only the four exact IC-5 UCD URLs plus
  `https://www.unicode.org/license.txt`, rejects redirects/non-200 responses and any unrequested host,
  writes through a fresh temporary directory, records locally computed byte length/SHA-256 in
  `SOURCES.json`, and atomically installs the five files only after all succeed. Review the first
  downloaded bytes/license, then run exactly `node packages/ai-tooling/scripts/fetch-unicode-data.mjs
  --verify --destination packages/ai-tooling/vendor/unicode-17` with network disabled; require exact
  manifest schema, URL, length, and digest matches. Before emitting tables, require the installed npm
  package's C/F maps to equal the normative `CaseFolding.txt` selection.
- Verify the vendored official files against the now-recorded SHA-256 values and Unicode's data license.
  Implement the generator and commit sorted case-fold, canonical-decomposition, combining-class, and
  composition tables with Unicode/package versions and input hashes. Runtime code must not import the
  Unicode package.
- Implement Unicode 17 canonical decomposition, stable combining-class ordering, Hangul
  decomposition/composition, and canonical composition; then implement
  `NFC(Default_Case_Folding(NFC(component)))` exactly as IC-5. Do not use `String.normalize`,
  `toLowerCase`, `toLocaleLowerCase`, `path.resolve`, or OS-specific comparison.
- Run under `LANG=C`, `tr-TR`, and `lt-LT` fixture environments and verify identical keys.

### 2.2 Freeze Git and prove tracked local input

**Files:**

- Create: `packages/ai-tooling/src/git/provider.ts`
- Create: `packages/ai-tooling/src/git/discovery.ts`
- Create: `packages/ai-tooling/src/git/index.ts`
- Create: `packages/ai-tooling/native/win32-helper/CMakeLists.txt`
- Create: `packages/ai-tooling/native/win32-helper/protocol.h`
- Create: `packages/ai-tooling/native/win32-helper/main.cc`
- Create: `packages/ai-tooling/scripts/build-native.mjs`
- Create: `packages/ai-tooling/src/native/win32-helper.ts`
- Create: `packages/ai-tooling/src/repository/context.ts`
- Create: `packages/ai-tooling/tests/unit/win32-protocol.spec.ts`
- Create: `packages/ai-tooling/tests/native/win32-helper.native.spec.ts`
- Modify: `packages/ai-tooling/package.json`
- Modify: `packages/ai-tooling/tests/package/package-contract.spec.ts`
- Create: `packages/ai-tooling/tests/unit/git-provider.spec.ts`
- Create: `packages/ai-tooling/tests/unit/git-discovery.spec.ts`
- Create: `packages/ai-tooling/tests/integration/git-index.spec.ts`
- Create: `packages/ai-tooling/tests/fixtures/fake-git/provider.mjs`
- Create: `packages/ai-tooling/tests/fixtures/fake-git/swapped-provider.mjs`

**Interfaces:**

```ts
export type RepositoryGitReadRequest =
  | {
      readonly kind: 'list-index';
      readonly scope: 'pack-core' | 'local-state' | 'repository';
      readonly stdoutSink: ByteSink;
    }
  | {
      readonly kind: 'status';
      readonly scope: 'pack-core' | 'local-state' | 'repository';
      readonly stdoutSink: ByteSink;
    }
  | {
      readonly kind: 'list-untracked';
      readonly stdoutSink: ByteSink;
    }
  | {
      readonly kind: 'check-stage-1-local-state-ignore';
      readonly stdoutSink: ByteSink;
    };

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

export function discoverRepositoryAnchors(startDirectory: AbsolutePath): Promise<RepositoryAnchors>;

export interface GitIndexEntry {
  readonly path: PortableRelativePath;
  readonly mode: '100644' | '100755';
  readonly objectId: GitObjectId;
}
export interface GitIndex {
  assertTracked(paths: readonly PortableRelativePath[]): Promise<void>;
  listTrackedUnder(root: PortableRelativePath): Promise<readonly GitIndexEntry[]>;
}

export interface ReadOnlyRepositoryContext extends ReadOnlySourceContext {
  readonly git: FrozenGitProvider;
  readonly index: GitIndex;
}

export interface ReadOnlyProjectContext extends ReadOnlyRepositoryContext {
  readonly configPath: PortableRelativePath;
}
```

The Phase 2 internal Win32 protocol exposes only `file-identity`. It returns the exact IC-15 Win32
`ObjectIdentity<K>` fields for a handle-opened no-follow object; it is not exported from the package
root. On POSIX, the same shared identity type is filled from no-follow native `stat` fields without the
helper.

- First write binary protocol unit vectors and Windows-native fixtures for regular file,
  directory, symlink/junction/reparse rejection, deleted/replaced object, wrong kind, identity swap,
  non-UTF-8/overlong path input, malformed/truncated/extra response, helper substitution, and helper
  timeout. Require exact `volumeSerial`, 128-bit file ID, attributes, size, creation time, and last-write
  time from a handle that remains open across observation.
- Make the named native fixture discover/register its assertion first, remove/reject any stale
  working helper, and invoke the package's `build:native` script as test setup through an argv-array
  child. Run the Task 2.2 focused command; before implementation, require the discovered assertion to
  report the missing script/helper on `win32-x64` rather than short-circuiting before Vitest. On GREEN,
  the same fixture must consume only the helper freshly built by that invocation. Implement only
  protocol framing plus `file-identity`
  using checked arithmetic, strict UTF-8, Unicode Win32 APIs, no-follow handle flags, Release mode,
  `CMAKE_MSVC_RUNTIME_LIBRARY=MultiThreaded` (`/MT`), `/W4 /WX`, CFG, DEP, and ASLR so the shipped helper
  needs no separately installed Visual C++ runtime. Build only `win32-x64`; `linux-x64` and `darwin-arm64` return stable not-applicable
  without an artifact, and every other tuple fails closed. By default, write the test helper and its
  hash manifest below working `dist/native/win32-x64`; also accept only the package checker's internal
  validated `--output-root <absolute-staging-dist/native>` form so Phase 3 can rebuild directly into an
  isolated package stage. Resolve/hash/revalidate the helper only relative to the installed tooling
  module and never use a shell.
- Add the exact Phase 2 `build:native`/`test:native` script graph from IC-4 and package-contract
  assertions before any Git/source implementation consumes `ObjectIdentity`. Leave a valid built
  helper in working `dist/native`, run the Phase 2 source-only `pack:check`, and assert its isolated
  tarball excludes both helper and manifest and makes no publishability claim.

- Write a fake-provider unit test that captures absolute executable, `shell: false`, exact argv,
  empty-base environment, explicit Git anchors, and all IC-6 config flags. Cover exclusive private
  config-root creation, all three exact zero-byte files, poisoned preexistence, symlink/reparse, nonzero
  bytes, pre/during/post-spawn swap, successful verified cleanup, cleanup uncertainty/preservation, and
  redacted diagnostics. Reject wrappers, unsupported version, identity change, quoted-line parsing, and
  newline-delimited output.
- Add compile-time impossible `GitCommandResult` cross-pairs and runtime forged-result decoding for
  every kind/code/signal/timedOut/tree-state combination. Exercise normal zero/nonzero exit, signal,
  spawn failure, verified timeout, timeout/control uncertainty, non-timeout termination uncertainty, and
  malformed protocol after exit 0; no branch may throw or expose raw child errors. Reuse the same closed
  decoder in Phase 5 object/artifact modes.
- Write discovery tests for repository root/subdirectory startup, `.git` directory, linked-worktree
  gitfile (relative and valid absolute admin-dir forms) plus `commondir`, bare repository,
  symlink/reparse marker or ancestor, malformed or fake-admin gitfile, hostile `core.worktree`, and
  marker/Git-dir identity change after discovery. On Windows reject UNC, device, root-relative, drive-
  relative, URL-like, tilde, foreign-POSIX, and malformed gitfile/commondir payloads before lookup; on
  POSIX reject `//`, URL-like, tilde, foreign-Windows, and malformed payloads. Keep valid same-host
  absolute and validated relative linked-worktree fixtures on each OS.
- Freeze and bracket the common `config` and conditionally required `config.worktree`; use only the
  fixed isolated `git config --file <frozen-path> --no-includes -z --list` preflight before any normal
  repository command. Add case-varied `include.path` and `includeIf.*.path` values that are absolute,
  relative, tilde-based, UNC/device, URL-like, or missing, plus config/config.worktree swap races; every
  case must block before a normal Git request, helper marker, or external-file open. Add canonical
  worktreeConfig true/false/absent cases, true->false and false->true duplicates, empty/yes/on/1/malformed
  values, missing-required and unexpected-present `config.worktree`; only the exact single canonical
  state may pass. Add every local/
  worktree `filter.*` field plus a stat-dirty `.gitattributes` filter whose command writes a marker;
  require zero filter/helper starts. Add absent/file/
  directory/link/raced `objects/info/alternates` and `objects/info/http-alternates` fixtures and hostile
  `GIT_ALTERNATE_OBJECT_DIRECTORIES`; Stage 1 rejects all before object lookup and never opens the named
  alternate. Cover absent/regular/link/changed common-dir `info/exclude` and `info/attributes`; only a
  bounded contained regular file is accepted and bracketed. Revalidate config identities, both info-
  file observations, and both alternate-path absences around every command.
- Write native temporary-repository tests for fully tracked `configs/ai`, one untracked file,
  renamed/deleted files, real `git add -N` intent-to-add, `.gitignore`,
  global excludes, hostile fsmonitor, worktree/index redirection,
  and filenames containing tabs, newlines, `*`, `?`, `[`, and `:(`. Assert global
  `--literal-pathspecs`, exact argv entries, no write, and raw NUL boundaries. The frozen provider may
  return those raw NUL-delimited names only to prove transport parsing: tabs, newlines, `*`, `?`, and
  colon-containing names must then fail IC-5 portable validation before any source-filesystem read,
  copy, or later provider call; `[` remains an accepted portable-name control.
- Require every closed `status` serialization to include literal `--ignore-submodules=all`. Add an
  initialized gitlink whose nested repository has hostile fsmonitor/helper/stall markers; prove no
  nested helper/process/read occurs and the superproject gitlink is still rejected from the complete
  index map.
- Prove the provider API is a closed command capability, not an argv pass-through. Strictly reject an
  unknown request kind/field, option-looking scope, caller-supplied stdin/config/command, and attempted
  `clean`, `reset`, `config`, `update-index`, `clone`, alias, or external-helper route before spawn. For
  each accepted request, assert the provider alone emits its one fixed subcommand/argv/stdin shape and
  that no repository/index/config/ref/cache byte changes and no network/helper process starts.
- Keep Git stderr only in the provider's bounded internal 64 KiB ring for classification; never
  return raw stderr bytes. Test absolute worktree/gitdir paths, remote URLs, config text, and synthetic
  secrets in child stderr and prove every public result/diagnostic contains only closed outcome,
  exit/signal, total-byte, and truncation metadata.
- Add a partial-clone/promisor fixture with an intentionally missing object and a remote-helper
  marker. Under Git 2.36.0 and 2.44.x, exercise every closed index/status/ignore request with
  `GIT_NO_LAZY_FETCH=1`; remove the exact HEAD tree required by a stat-dirty status comparison and
  require a local blocking status result with zero helper starts, while object-independent index/ignore
  requests likewise leave the marker untouched. Under Git
  2.45.0+, additionally require global `--no-lazy-fetch`. A forged object-reading request is outside the
  Phase 2 union and fails before spawn; the object database, refs, index, worktree, and marker stay
  unchanged.
- Run the focused suites; verify missing provider fails.
- Implement deterministic direct PATH lookup and provider identity capture without a shell. Keep
  provider construction injected so formatter census can reuse it in Phase 3. Construct, freeze, share,
  and finally clean the one IC-6 private config root at repository-context scope; never create a new
  config/excludes/attributes path per query.
- Implement `runRepositoryReadOnly` as an exhaustive serializer for only the four request variants
  above. `pack-core` maps to the one literal `configs/ai` pathspec, `local-state` maps to the one literal
  `.ai-tooling` pathspec, `repository` maps to the one literal repository-root pathspec, and
  repository-only `list-untracked` maps to fixed
  `ls-files -z --full-name --others --exclude-standard --`; `check-stage-1-local-state-ignore` owns the
  exact five fixed probe paths;
  no caller byte becomes a command, option, config key, environment value, or arbitrary stdin byte.
  Every `status` variant owns `--ignore-submodules=all`. Implement the exact IC-6 fixed-root `ls-files`
  stage plus porcelain-v1 status calls with streaming bounded parsers, a
  4 KiB path limit, 100,000-path limit, and bounded stderr tail. Decode paths with fatal UTF-8 for
  Stage 1 portable metadata, validate each result/object ID/status record, return only ordinary stage-0
  `100644`/`100755` entries from `listTrackedUnder`, reject conflicts/other modes/intent-to-add, and
  require every declared pack file to be tracked `100644` in the complete closed `configs/ai` map.
- Re-run focused tests and compare `git status --porcelain=v2 -z --ignore-submodules=all` before/after to prove zero
  repository mutation. On Windows, assert every provider, anchor, index, and source identity came from
  the already-green `file-identity` helper rather than Node's weaker path/stat identity.

### 2.3 Load only the exact tracked `configs/ai` source

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

**Interfaces:** `loadConfig(bytes: Uint8Array): ConfigV1`,
`resolveSafeCoreSource(config: ConfigV1, context: ReadOnlyProjectContext): Promise<ResolvedLocalPack>`,
`hashPackTree(files: readonly PackFile[]): Sha256Hex`, and IC-15
`ReadOnlyRepositoryFilesystem`.

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
```

- Write table tests requiring `npm` and `git` to fail with
  `EVK_PACK_CAPABILITY_UNAVAILABLE`, preview with `EVK_CONFIG_CAPABILITY_UNAVAILABLE`, and malformed
  local selectors with `EVK_PACK_SOURCE_INVALID` plus exact reasons. Pack failures must expose only
  `fields: { capability: 'pack-source.acquire', activeProfile: 'safe-core', sourceKind: 'npm' | 'git' }`
  and `recoveryActions: ['Use the tracked local configs/ai pack source.']`; preview failures use
  `fields: { capability: 'output.preview', activeProfile: 'safe-core' }` and
  `recoveryActions: ['Use managed output mode.']`. Assert capability failures occur before any provider
  method that could acquire content.
- Include the Task 1.4 bare Markdown URL config-source vector and assert `loadConfig` rejects it at
  schema validation before `FrozenGitProvider`, repository traversal, network/package-manager spies,
  or any acquisition abstraction is called.
- Write temporary-repository tests for exact tracked `configs/ai`, outside path, absolute path,
  untracked file, symlink, Windows junction/reparse fixture when native, `node_modules` workspace alias,
  changed identity between validation and read, and same real tree through a second spelling. Add exact
  16 MiB-per-file and 512 MiB aggregate boundaries, one-over regular and sparse files, truncated/extra
  streams, and a no-progress source read; require a limit diagnostic before whole-body allocation.
- Add network/package-manager spies that throw if `fetch`, HTTP, DNS, `pnpm`, `npm`, `git clone`,
  `git fetch`, or cache paths are reached.
- Run focused suites; verify source resolution is absent.
- Implement source-kind capability selection before local resolution. Accept only literal canonical
  `configs/ai`; validate existing ancestors without accepting a link/reparse alias; require the Git
  index list to equal the declared pack tree; reject the captured identity size before reading; stream
  each accepted file through exact-length/incremental hashing under IC-16; and only then collect an
  already-bounded declared metadata/instruction body. Hash sorted relative path, kind, and bytes.
- Wire the Phase 1 dependency-injected `pack validate`/`pack build` handlers only now: resolve the
  source through this task's one `ReadOnlyRepositoryContext`, pass its exact `ContainedPathRef` and
  shared budget to `validatePack`/`buildPack`, and pass only an explicit caller-selected trusted
  temporary `PackBuildDestination`. Add compile/runtime negative tests for a raw source `AbsolutePath`,
  a second budget/filesystem, and a repository destination; all fail before source read or write.
- Revalidate the selected root and each file identity immediately before every Phase 2 read using
  the read-only identity abstraction; Phase 4 will replace this abstraction with the complete gateway.
- Re-run focused suites twice and assert identical pack digest and zero writes.

### 2.4 Resolve pack integrity, precedence, and overrides

**Files:**

- Create: `packages/ai-tooling/src/resolve/catalog.ts`
- Create: `packages/ai-tooling/src/resolve/overrides.ts`
- Create: `packages/ai-tooling/src/resolve/graph.ts`
- Create: `packages/ai-tooling/tests/unit/catalog.spec.ts`
- Create: `packages/ai-tooling/tests/unit/overrides.spec.ts`
- Create: `packages/ai-tooling/tests/fixtures/overrides/vectors.json`

**Interfaces:**

```ts
export interface EffectiveResource {
  readonly id: ResourceId;
  readonly kind: 'rule' | 'skill';
  readonly metadata: Readonly<JsonObject>;
  readonly instructions: Uint8Array;
  readonly contributors: readonly Contributor[];
  readonly effectiveDigest: Sha256Hex;
}

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

- Write fixtures for deterministic pack order, one effective resource, valid `extend`, `replace`,
  and `disable`, plus missing target, same-level collision, orphan, incompatible base digest, cycle,
  kind mismatch, and contradictory same-level intent. Assert complete ordered contributor provenance.
- Write loader tests for sorted config-declared override paths, strict schema validation, stable
  resource IDs, exact base-digest binding, duplicate physical identity, link/reparse containment, and
  identity change before read. For every selected resource directory, repeat the IC-5 portable lexical
  check and require a strict descendant of literal `ai/overrides` under the same frozen repository
  root; reject the root itself, absolute or wrong-root paths (`configs/ai`, generated outputs, `.git`),
  dot/parent components, case/NFC aliases, Win32-invalid components, and duplicate portable or physical
  identity before reading `override.json` or any instruction byte. Resolve the descriptor's referenced
  instruction only within that same selected resource directory, reject absolute/parent/cross-resource
  references and links/reparse points, and revalidate the frozen root, directory, descriptor, and
  instruction identities immediately before each read. Add exact 16 MiB-per-file and 64 MiB aggregate
  override boundaries, one-over sparse files, and stalled/truncated streams; require rejection before
  schema/graph work and assert the loader is the only typed producer of `ValidatedOverride[]`.
- Run focused suites; verify missing resolver fails.
- Implement a stable-ID graph with explicit precedence levels. `extend` may add only schema-
  compatible fields/instruction sections; `replace` and `disable` are terminal at their level. Sort
  diagnostics by portable resource ID and source order, never object enumeration order.
- In `loadValidatedOverrides`, apply IC-16 before allocation: inspect/reject reported size first,
  stream and incrementally hash under the 30-second no-progress/300-second whole-load deadlines, enforce
  the 64 MiB cross-root aggregate, revalidate identity and exact length, and collect only the bounded
  metadata/instruction body needed by the typed validator.
- Hash each effective resource from validated metadata projection plus exact instruction bytes;
  assert two resolutions return byte-identical metadata and contributor arrays.
- Re-run focused suites and inspect the graph error snapshots for source-body/path leakage.

### 2.5 Enforce instruction-only capabilities independently of declarations

**Files:**

- Modify: `packages/ai-tooling/src/fs/read-only-repository-filesystem.ts`
- Create: `packages/ai-tooling/src/resolve/capabilities.ts`
- Create: `packages/ai-tooling/src/pack/assets.ts`
- Create: `packages/ai-tooling/tests/unit/capabilities.spec.ts`
- Create: `packages/ai-tooling/tests/fixtures/capabilities/vectors.json`

**Interfaces:**

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

- Write adversarial fixtures for a declared script, undeclared script extension, executable bit,
  shebang, hook, MCP server, connector, browser capability, nested binary, symlink, hidden file,
  ignored untracked executable, and an instruction file that points outside its resource directory. Require
  `EVK_SECURITY_EXECUTABLE_CONSENT_REQUIRED` before adapter rendering/copy. For the ignored untracked
  executable, require `indexMode: null` and the explicit filesystem-mode/content signal and reason; do
  not pass it merely because the path is undeclared or fabricate index mode `100644`. In the same
  fixture, require a tracked `100755` entry from `context.index.listTrackedUnder` to remain distinct
  from an untracked/null entry; no ad hoc Git argv is permitted in the asset inspector.
- Add a positive fixture for only strict JSON metadata and Markdown instructions. Formatter trust
  must not appear as a pack capability. Include a bare `https://example.invalid/reference` line and a
  normal Markdown link; assert both remain inert instruction bytes and trigger neither acquisition nor
  executable-capability detection.
- Add a compile/runtime capability fixture proving `inspectActualAssets` cannot be called with bare
  filesystem/Git ports or a newly constructed budget and that its reads consume the same branded
  `context.readBudget` counters/deadline already used by config, pack, and override loading. Exhaust the
  aggregate across those stages and require the actual-tree scan to fail before its next content read.
- Run the focused suite; verify missing inspection fails.
- Implement actual tree inventory independently from `requiredCapabilities` and independently from
  the Git tracked set. Recursively enumerate the contained source root only through the gateway's
  identity-bracketed `listDirectory`; fatal-decode and validate every single path segment, never follow
  a link/reparse entry, and apply exact bounds of 64 levels, 100,000 entries, 4 KiB per portable path,
  16 MiB total encoded path bytes, 16 MiB per regular file, and 512 MiB aggregate regular-file bytes.
  Reject one-over reported/sparse size before content read; stream accepted files through exact-length,
  incremental digest, and cross-chunk security-signal inspection under the IC-16 deadlines. Store only
  path/kind/mode/length/digest/signals in `ActualAssetInventory`, never file bodies. Revalidate each
  directory before and after listing, compare a second sorted listing after its subtree scan, and fail
  on list error, kind/identity change, addition, removal, or reorder-normalized content change. This
  enumeration therefore sees tracked, untracked, and ignored entries under `configs/ai`; Git remains
  the separate proof that every accepted declared pack file is tracked. Compare declared and observed
  assets, derive POSIX filesystem-executable evidence from the captured no-follow mode (and `null` on
  systems without that semantic), and reject every non-instruction asset before returning the effective
  catalog.
- Re-run the suite with renderer/copy spies and assert they remain uncalled on every rejection.

### 2.6 Build a deterministic adapter-neutral candidate and proposed diff

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

```ts
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

export function resolvePurePipeline(
  request: PurePipelineRequest,
): Promise<PurePipelineResult>;
```

- Add a fake adapter that maps resources to fixed leaves. Write tests for stable leaf ordering,
  digest/provenance completeness, add/change/delete proposed diffs, duplicate leaves, formatting-only
  config changes, every semantic config field, pack-selection changes, ordered platform selection, and
  two byte-identical runs. Capture the renderer arguments and require the validated config's exact
  `PlatformSelection`, rather than caller- or renderer-selected platforms.
- Wrap every pipeline fixture in `NoWriteFilesystem`, whose create/write/rename/delete methods
  throw, and assert the call log is empty on success and failure.
- Run focused suites; verify missing pipeline fails.
- Implement `resolvePurePipeline` in this exact order: strict config load; source-capability gate;
  tracked local-pack load and validation into `ValidatedPack`; validated override load; catalog
  resolution; actual-asset inventory and safe-core capability gate; injected renderer called with the
  validated ordered `config.platforms`; candidate
  digest; proposed diff. No raw `PackV1` or `OverrideV1` crosses into resolution, and no renderer call
  occurs before the capability gate. Do not import transaction, recovery, or project command modules.
- Implement the fixed-seed IC-7 standalone harness and output schema. Add negative fixtures for
  missing `--expose-gc`, wrong fixture/result digest, removed result consumption, unstable A/A
  calibration, missing checkpoint samples, and exceeded time/heap limits; write no report file.
- Add the exact Phase 2 `performance:check` script and insert it into package `check` as specified
  by IC-4; retain the already-green `build:native`/`test:native` identity-helper graph and update the
  package-contract test to the exact Phase 2 graph.
- Run the pure integration suite and exactly
  `pnpm --filter @evk-soft/ai-tooling run performance:check`; verify correctness, repeatability, exact
  measured output, the CI-only budget decision, and zero repository writes.

### 2.7 Sync durable Phase 2 documentation

**Files:**

- Modify: `docs/ai-tooling/EXTENDING-PACKS.md`
- Modify: `docs/ai-tooling/SECURITY.md`
- Modify: `docs/system-overview/ai-tooling.md`

- Document the exact tracked-local Stage 1 source, error distinction, digest/integrity model,
  override graph, instruction-only rejection, Unicode 17 portable key, fixed Git-index proof, and
  performance fixture. Do not describe future acquisition as available.
- This is a documentation-only operational gate, not a behavior RED. Review the complete rendered
  Markdown/diff, then run:

```text
git diff --check -- docs/ai-tooling/EXTENDING-PACKS.md docs/ai-tooling/SECURITY.md docs/system-overview/ai-tooling.md
rg -n "2026-08-02-ai-tooling-stage-1-safe-core-implementation-plan|2026-08-01-ai-tooling-stage-1-safe-core-design" docs/ai-tooling/EXTENDING-PACKS.md docs/ai-tooling/SECURITY.md docs/system-overview/ai-tooling.md
```

  Require the first command to exit `0`; require the reference census to exit `1` with empty stdout.
  Phase 3 adds and then runs the full offline exact-case/anchor checker.

### 2.8 Phase 2 gate and commit

- Run:

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

- Re-run unavailable-source, outside/untracked/workspace-alias, collision, orphan, base-digest,
  executable-rejection, Unicode/locale, Git hostile-config, stress, repeatability, and zero-write
  fixtures.
- Scan staged/package bytes for private material, absolute paths, executable assets, network/cache
  calls, undeclared files, and license conflicts.
- Stage only the exact Phase 2 manifest paths and verify exact status/path/mode equality.
- Commit with `git commit --no-verify -m "feat(ai): add the pure Stage 1 resolver"`.
- Re-run the gate against committed `HEAD`, report exact SHA/evidence, and stop for owner approval
  of Phase 3.

## Phase 3 normative contract — project adapters, formatter boundary, and native read-only CI

**Phase owner gate:** Start only after the owner approves the exact Phase 2 commit.

**Phase allowlist:** `biome.json`, `.github/workflows/ai-tooling.yml`, `package.json`,
`pnpm-lock.yaml`, `packages/ai-tooling/**`, `docs/ai-tooling/AI-AUTHORING-GUIDE.md`,
`docs/ai-tooling/SECURITY.md`, `packages/ai-tooling/README.md`, and
`docs/system-overview/ai-tooling.md`. The allowlist explicitly excludes
`configs/biome-config/**`, `.husky/**`, generated root outputs, and `ai-tooling.lock.json`.

### 3.1 Refresh and freeze official project-discovery evidence

**Files:**

- Create: `packages/ai-tooling/tests/fixtures/platform-discovery/current.json`
- Create: `packages/ai-tooling/tests/unit/platform-discovery-fixture.spec.ts`

**Interfaces:**

```ts
export interface PlatformDiscoveryFixtureV1 {
  readonly schemaVersion: 1;
  readonly retrievedAt: string;
  readonly sources: readonly {
    readonly platform: PlatformId;
    readonly url: string;
    readonly title: string;
    readonly contentSha256: Sha256Hex;
  }[];
  readonly claims: readonly {
    readonly platform: PlatformId;
    readonly role: 'root' | 'root-shadow' | 'alternate-root' | 'rule' | 'skill';
    readonly pathPattern: string;
    readonly discovery: 'exact-root' | 'recursive';
    readonly precedence: string;
    readonly importRequired: false;
  }[];
}
```

This fixture is used by adapter and shadow tests but not shipped as a runtime network client. Its
strict schema permits only the exact dated HTTPS sources and path/role rows listed below; free-form
precedence text is bounded and retained as evidence, never consumed as runtime policy.

- Immediately before any adapter implementation, read the current official Codex and Claude Code
  documentation. Record retrieval date, direct URL, page title, content SHA-256, exact project path,
  recursive-discovery statement, alternative path, shadow/precedence behavior, and confirmation that
  no import step is required. Keep excerpts below copyright limits.
- Write a fixture-contract test requiring Codex root `AGENTS.md`, root
  `AGENTS.override.md` shadow, `.agents/skills/<name>/SKILL.md`; and Claude root `CLAUDE.md`,
  `.claude/CLAUDE.md` alternative, `.claude/rules/**/*.md`, and
  `.claude/skills/<name>/SKILL.md`.
- Run the focused test; verify it fails until the new dated evidence is complete.
- Include the exact evidence fixture in the sole Phase 3 candidate commit and make the test reject missing, duplicate, malformed, or
  non-HTTPS sources. The Phase 3 gate separately proves that the recorded retrieval is no more than
  24 hours old when adapter work starts. `current.json` carries the immutable retrieval timestamp and
  source hashes; its stable filename does not imply live runtime lookup. No runtime command may browse
  these URLs.

### 3.2 Declare, register, then render Codex and Claude Code targets

**Files:**

- Create: `packages/ai-tooling/src/adapters/types.ts`
- Create: `packages/ai-tooling/src/adapters/registry.ts`
- Create: `packages/ai-tooling/src/adapters/render-markdown.ts`
- Create: `packages/ai-tooling/src/adapters/codex.ts`
- Create: `packages/ai-tooling/src/adapters/claude-code.ts`
- Create: `packages/ai-tooling/src/ownership/target-registry.ts`
- Create: `packages/ai-tooling/tests/unit/codex-adapter.spec.ts`
- Create: `packages/ai-tooling/tests/unit/claude-code-adapter.spec.ts`
- Create: `packages/ai-tooling/tests/unit/target-registry.spec.ts`
- Create: `packages/ai-tooling/tests/fixtures/adapters/codex/AGENTS.md`
- Create: `packages/ai-tooling/tests/fixtures/adapters/codex/evk-plan.SKILL.md`
- Create: `packages/ai-tooling/tests/fixtures/adapters/claude-code/CLAUDE.md`
- Create: `packages/ai-tooling/tests/fixtures/adapters/claude-code/evk-grounding.md`
- Create: `packages/ai-tooling/tests/fixtures/adapters/claude-code/evk-plan.SKILL.md`

**Interfaces:**

```ts
export interface TargetRecord {
  readonly path: PortableRelativePath;
  readonly adapter: AdapterIdentity;
  readonly resourceIds: readonly ResourceId[];
  readonly role: 'root' | 'rule' | 'skill';
}

export interface TargetRegistrySnapshot {
  readonly records: readonly TargetRecord[];
  readonly digest: Sha256Hex;
}

export interface TargetRegistry {
  register(plans: readonly AdapterTargetPlan[]): TargetRegistrySnapshot;
}

export interface ProjectAdapter {
  readonly id: AdapterId;
  readonly version: AdapterIdentity['version'];
  readonly supportedKinds: readonly ('rule' | 'skill')[];
  readonly capabilities: readonly ['instructions.markdown'];
  planTargets(catalog: readonly EffectiveResource[]): readonly AdapterTargetPlan[];
  render(
    registry: TargetRegistrySnapshot,
    catalog: readonly EffectiveResource[],
  ): readonly CandidateLeaf[];
  validate(leaf: CandidateLeaf): void;
}

export interface ProjectAdapterRegistry {
  resolveOrdered(platforms: PlatformSelection): readonly ProjectAdapter[];
}

export function createProjectAdapterRegistry(
  adapters: readonly ProjectAdapter[],
): ProjectAdapterRegistry;
```

The registry maps canonical config platform `codex` to `codex-project` and `claude-code` to
`claude-code-project`; config identity keeps platform IDs while ownership records keep adapter IDs.

- Write byte-free target-plan tests requiring exactly Codex `AGENTS.md` and
  `.agents/skills/evk-plan/SKILL.md`, and Claude `CLAUDE.md`, `.claude/rules/evk-grounding.md`, and
  `.claude/skills/evk-plan/SKILL.md`. Assert path, closed adapter identity, role, stable resource IDs,
  sorted order, and absence of output bytes or full contributor objects.
- Write pure cross-adapter registry tests for equal portable leaves, ASCII case, NFC equivalence,
  managed-file ancestor, overlapping independent trees, safe shared structural parents, and adapter-
  local structural directories. Run them under all locale fixtures and require a stable snapshot digest.
- Write adapter-registry tests requiring exactly one implementation for each Stage 1 platform,
  config-order-preserving lookup, and exact `codex`/`claude-code` mapping. Reject a missing, duplicate,
  or unsupported adapter registration before any adapter's `planTargets` method is called.
- Obtain the registry snapshot only by aggregating every selected adapter's complete byte-free
  target plan and calling `TargetRegistry.register` once. Write renderer-spy tests proving no adapter
  can render before that call succeeds and that render rejects a snapshot with a missing, extra, or
  mismatched target.
- After registration, write Codex and Claude golden render tests for those exact leaves. Assert
  sorted leaf lists, contributor provenance, LF bytes, one final newline, and a byte-identical second
  render on every OS. Reject any candidate whose closed generator identity differs from its registered
  target adapter identity before candidate-tree or ownership construction.
- Add negative tests for unsupported resource kind/capability, missing token, path escape,
  duplicate leaf, unexpected frontmatter field, malformed generated header, and lost instruction
  paragraph.
- Run all three focused suites; verify missing adapters and registry fail.
- Implement the exact generated header:

```md
<!-- GENERATED BY @evk-soft/ai-tooling — DO NOT EDIT. -->
<!-- Customize through ai/overrides/** and run ai-tooling sync. -->
```

  Codex `AGENTS.md` contains that header plus the effective grounding instructions. Codex and Claude
  skill files contain fixed `name`/`description` YAML frontmatter plus effective plan instructions.
  Claude's rule file contains grounding instructions; root `CLAUDE.md` contains only the header and a
  stable explanation that EVK rules and skills use Claude's native project directories, so no import
  directive duplicates rule content.
- Re-run goldens twice and validate every generated leaf through the adapter's own parser.

### 3.3 Enforce registered ownership and native discovery interference

**Files:**

- Create: `packages/ai-tooling/src/adapters/shadows.ts`
- Create: `packages/ai-tooling/src/adapters/project-renderer.ts`
- Create: `packages/ai-tooling/src/ownership/records.ts`
- Create: `packages/ai-tooling/src/fs/repository-filesystem.ts`
- Modify: `packages/ai-tooling/src/resolve/pipeline.ts`
- Create: `packages/ai-tooling/tests/integration/discovery-shadows.spec.ts`
- Create: `packages/ai-tooling/tests/integration/registered-adapter-pipeline.spec.ts`
- Create: `packages/ai-tooling/tests/fixtures/targets/vectors.json`

**Interfaces:**

```ts
export interface DiscoveryShadow {
  readonly platform: PlatformId;
  readonly path: PortableRelativePath;
  readonly reason:
    | 'higher-precedence-root'
    | 'alternate-root'
    | 'colliding-rule'
    | 'colliding-skill'
    | 'structural-parent';
}

export interface DiscoveryCensusResult {
  readonly shadows: readonly DiscoveryShadow[];
}

export interface DiscoveryCensus {
  inspect(
    context: ReadOnlyProjectContext,
    registry: TargetRegistrySnapshot,
  ): Promise<DiscoveryCensusResult>;
}

export function createRegisteredProjectRenderer(dependencies: {
  readonly adapters: ProjectAdapterRegistry;
  readonly registry: TargetRegistry;
  readonly census: DiscoveryCensus;
}): CandidateRenderer;
```

All reads use `ReadOnlyRepositoryFilesystem`.

```ts
export interface ManagedPathRecord {
  readonly path: PortableRelativePath;
  readonly digest: Sha256Hex;
  readonly generator: { package: '@evk-soft/ai-tooling'; version: string };
  readonly adapter: AdapterIdentity;
  readonly contributors: readonly ResourceId[];
  readonly adoptionState: 'clean-init';
}
```

- Write temporary-repository shadow tests before and after a synthetic lock: root
  `AGENTS.override.md`, `.claude/CLAUDE.md`, missing/modified/equal leaves, and a link/reparse
  ancestor. Require exact `EVK_OUTPUT_SHADOWED` fields and zero writes.
- Write a registered-pipeline integration test with plan/register/census/render spies. Require all
  and only the validated config-selected adapters, in config order, to finish `planTargets`; then require
  one aggregate registry success and one clean census before the first renderer call. Exercise Codex-
  only, Claude-only, and both platform orders. Before `planTargets`, verify that the resolved adapter
  IDs are neither missing, extra, reordered relative to the validated `PlatformSelection`, nor
  unsupported. On that mismatch or any plan, registry, or shadow failure, require every
  `planTargets`/renderer spy that follows the failing gate to stay untouched and the Phase 2 pipeline
  to return no candidate or diff.
- Run focused suites; verify the Task 3.3 RED is the missing census/registered renderer while the
  Task 3.2 registry remains green.
- Implement exact-leaf expansion through the shared portable key. Structural directories are
  never ownership records. In the production pipeline, aggregate and register all byte-free adapter
  targets, run the discovery census against that immutable snapshot, and only then call any adapter
  renderer. Persist ownership only from the same snapshot and rendered leaves.
- Implement the Phase 3 read-only repository gateway: anchored Git root, no-follow existing-
  ancestor inspection, lexical absent-tail validation, portable-key collision checks, identity capture,
  and immediate revalidation before each read. Phase 4 extends this same object with mutation methods.
- Implement the discovery census for only the two frozen shadow/alternative paths and rerun it in
  every read-only lifecycle operation.
- Re-run focused suites and assert render/read providers are not called after a registry or shadow
  failure.

### 3.4 Implement ownership-aware `check`, `diff`, and read-only `doctor`

**Files:**

- Create: `packages/ai-tooling/src/ownership/check.ts`
- Create: `packages/ai-tooling/src/ownership/diff.ts`
- Create: `packages/ai-tooling/src/commands/check.ts`
- Create: `packages/ai-tooling/src/commands/diff.ts`
- Create: `packages/ai-tooling/src/commands/doctor.ts`
- Create: `packages/ai-tooling/tests/unit/ownership-check.spec.ts`
- Create: `packages/ai-tooling/tests/integration/read-only-commands.spec.ts`
- Modify: `packages/ai-tooling/src/cli.ts`

**Interfaces:** `checkProject(context: ReadOnlyProjectContext): Promise<CheckResult>`,
`diffProject(context: ReadOnlyProjectContext): Promise<ProjectDiff>`, and
`doctorProject(context: ReadOnlyProjectContext): Promise<DoctorReport>`; each accepts only read ports
in Phase 3.

- Write lock-fixture tests for clean, missing, modified, stale, orphaned, conflicting,
  unsupported, noncanonical-lock, config drift, pack-selection drift, and shadowed outputs. Assert
  `check --ci` also fails closed on preview mode.
- Write CLI tests for stable human and `--json` output, exact exit code classes, sorted paths,
  redacted roots/override bodies, no implicit report file, explicit stdout report, and an explicit
  report path rejected as capability-unavailable until the Phase 4 gateway exists. Feed hostile
  ESC/OSC/bidi free-text fields plus literal escape lookalikes through both modes: human output must use
  the IC-17 display spelling, raw JSON must be terminal-safe, and parsed JSON must retain the exact
  original logical value.
- Run focused suites; verify commands are absent.
- Implement locked-input re-resolution and candidate comparison without repository writes. Keep
  `EVK_CONFIG_REQUIRES_UPDATE` exclusive to pack selection and
  `EVK_CONFIG_CAPABILITY_UNAVAILABLE` for other semantic changes.
- Implement diff explanations for native shadows and ownership states. Modified-output recovery
  actions may mention manual preservation and `restore-generated`; never mention `import-edits`.
- Implement read-only doctor aggregation; leave `--repair` recognized but capability-unavailable
  until Phase 4.
- Re-run commands under `NoWriteFilesystem` and compare repository census before/after.

### 3.5 Implement offline documentation link checking

**Files:**

- Create: `packages/ai-tooling/src/docs/link-checker.ts`
- Create: `packages/ai-tooling/src/commands/docs.ts`
- Create: `packages/ai-tooling/tests/unit/link-checker.spec.ts`
- Create: `packages/ai-tooling/tests/fixtures/docs-links/vectors.json`
- Modify: `packages/ai-tooling/src/cli.ts`

**Interfaces:** `checkDocumentationLinks(files: readonly PortableRelativePath[], context:
ReadOnlyRepositoryContext): Promise<LinkCheckResult>`.

- Write fixtures for valid relative links, headings/duplicate slugs, images, percent-encoded
  paths, fragments, exact path case, missing files, malformed UTF-8, root escape, symlink ancestor,
  HTTP(S) link, Windows/UNC path, and link/heading text containing ESC/OSC/bidi plus literal escape
  lookalikes. External links are syntax-checked but never fetched; diagnostics prove IC-17-safe human
  bytes and terminal-safe JSON whose parsed values remain exact.
- Run the focused suite; verify missing checker fails.
- Implement a deterministic Markdown link/image scanner and repository-relative resolver through
  `context.filesystem`, passing the exact shared `context.readBudget` to every inspection/read. It may
  neither construct nor replace a budget; multi-file fixtures exhaust the one command aggregate before
  the next body read. Do not add a general Markdown renderer or network client.
- Wire `ai-tooling docs check-links`, rerun fixtures, and assert zero network/write calls.

### 3.6 Resolve and freeze direct and Node-entry formatter providers

**Files:**

- Create: `packages/ai-tooling/src/formatter/types.ts`
- Create: `packages/ai-tooling/src/formatter/direct-provider.ts`
- Create: `packages/ai-tooling/src/formatter/node-entry-provider.ts`
- Create: `packages/ai-tooling/src/formatter/redaction.ts`
- Create: `packages/ai-tooling/tests/unit/direct-provider.spec.ts`
- Create: `packages/ai-tooling/tests/integration/node-entry-provider.spec.ts`
- Create: `packages/ai-tooling/tests/fixtures/formatter-packages/cases.json`
- Create: `packages/ai-tooling/tests/fixtures/formatter-packages/entry.mjs`

**Interfaces:**

```ts
export type FrozenFormatterProvider =
  | {
      readonly mode: 'direct';
      readonly executable: FrozenRegularFile;
      readonly requested: string;
    }
  | {
      readonly mode: 'node-entry';
      readonly executable: FrozenRegularFile;
      readonly entry: FrozenRegularFile;
      readonly packageRoot: AbsolutePath;
      readonly manifestDigest: Sha256Hex;
      readonly requested: string;
    };
```

- Write direct tests for missing token, exact path, repository-relative path, bare PATH token,
  PATH order, missing/unlaunchable/non-file candidate, Windows `.cmd`/`.bat`/`.ps1`/`.psm1`, drive-
  relative/UNC/device/URL inputs, in-repository containment, outside explicit trust, candidate
  redaction, and identity swap immediately before launch. Rejected requested tokens/basenames include
  ESC/OSC/bidi and literal escape lookalikes; every human/JSON diagnostic must cross IC-17 while parsed
  JSON preserves the logical token selected by the redaction policy.
- Write Node-entry tests for canonical scoped/unscoped names and subpaths, exact root dependency
  declaration, missing/invalid manifest, built-in, `#imports`, relative/absolute/URL/backslash/
  percent/dot inputs, absent/link/reparse `node_modules` anchor, undeclared/missing package, pnpm
  junction inside the anchored tree, parent/global/cross-package resolution, non-file entry,
  `process.execPath`, manifest/declaration change, identity swap, and installed-tree trust swap.
- Add spies proving no acquisition, package-manager, network, or fallback resolver is called.
- Run focused suites; verify provider modules are absent.
- Implement IC-9 deterministic lookup, root manifest strict parsing, `createRequire` resolution,
  real package-root/entry containment, identity capture, redaction set construction, and one final
  revalidation method. In Node-entry mode capture and revalidate `process.execPath` as a separate
  `FrozenRegularFile` as well as the package entry. Never normalize the requested Node specifier.
- Re-run both suites and assert launch descriptors contain frozen absolute files and exact caller
  argv only.

### 3.7 Implement bounded output and POSIX process-group execution

**Files:**

- Create: `packages/ai-tooling/src/formatter/ring-buffer.ts`
- Create: `packages/ai-tooling/src/formatter/environment.ts`
- Create: `packages/ai-tooling/src/formatter/posix-process-group.ts`
- Create: `packages/ai-tooling/tests/unit/ring-buffer.spec.ts`
- Create: `packages/ai-tooling/tests/unit/formatter-environment.spec.ts`
- Create: `packages/ai-tooling/tests/native/posix-process-group.native.spec.ts`
- Create: `packages/ai-tooling/tests/fixtures/process-tree/exit-nonzero.mjs`
- Create: `packages/ai-tooling/tests/fixtures/process-tree/flood-output.mjs`
- Create: `packages/ai-tooling/tests/fixtures/process-tree/hang.mjs`
- Create: `packages/ai-tooling/tests/fixtures/process-tree/spawn-grandchild.mjs`

**Interfaces:**

```ts
export interface ByteRingSummary {
  readonly totalBytes: number;
  readonly retainedBytes: number;
  readonly truncated: boolean;
}

export interface ByteRingBuffer {
  append(chunk: Uint8Array): void;
  summary(): ByteRingSummary;
}

export interface ProcessTransportMetadata {
  readonly exitStatus: number | null;
  readonly signal: string | null;
  readonly timedOut: boolean;
  readonly stdout: ByteRingSummary;
  readonly stderr: ByteRingSummary;
  readonly treeState: 'not-started' | 'quiescent' | 'termination-unverified';
}

export type ProcessTransportResult =
  | (ProcessTransportMetadata & {
      readonly kind: 'completed';
      readonly reason: null;
      readonly exitStatus: number;
      readonly signal: null;
      readonly timedOut: false;
      readonly treeState: 'quiescent';
    })
  | (ProcessTransportMetadata & {
      readonly kind: 'signaled';
      readonly reason: 'terminated-by-signal';
      readonly exitStatus: null;
      readonly signal: string;
      readonly timedOut: false;
      readonly treeState: 'quiescent';
    })
  | (ProcessTransportMetadata & {
      readonly kind: 'spawn-error';
      readonly reason: 'spawn-error';
      readonly exitStatus: null;
      readonly signal: null;
      readonly timedOut: false;
      readonly treeState: 'not-started';
    })
  | (ProcessTransportMetadata & {
      readonly kind: 'control-error';
      readonly reason: 'process-tree-control-unavailable';
      readonly exitStatus: null;
      readonly signal: null;
      readonly timedOut: false;
      readonly treeState: 'not-started';
    })
  | (ProcessTransportMetadata & {
      readonly kind: 'timeout';
      readonly reason: 'timeout';
      readonly timedOut: true;
      readonly treeState: 'quiescent';
    })
  | (ProcessTransportMetadata & {
      readonly kind: 'termination-unverified';
      readonly reason: 'termination-unverified';
      readonly treeState: 'termination-unverified';
    });

export interface PosixProcessGroupRunner {
  run(request: {
    readonly executable: FrozenRegularFile;
    readonly argv: readonly string[];
    readonly cwd: AbsolutePath;
    readonly env: Readonly<Record<string, string>>;
    readonly timeoutMs: 300000;
  }): Promise<ProcessTransportResult>;
}

export type FormatterEnvironmentRequest =
  | {
      readonly platform: 'linux' | 'darwin';
      readonly disposableRoot: AbsolutePath;
    }
  | {
      readonly platform: 'win32';
      readonly disposableRoot: AbsolutePath;
      readonly windowsDirectory: FrozenWindowsDirectory;
    };

export function buildFormatterEnvironment(
  request: FormatterEnvironmentRequest,
): Readonly<Record<string, string>>;
```

- Write ring tests for zero bytes, exactly 65,536 bytes, overflow, split multibyte data, separate
  streams, total safe-integer counts, EOF-after-exit, and no raw-byte exposure.
- Write exact-key environment tests starting from hostile caller variables. POSIX must contain
  only disposable `HOME`, `XDG_CONFIG_HOME`, `XDG_CACHE_HOME`, `XDG_DATA_HOME`, `TMPDIR`, `TMP`,
  `TEMP`, `NO_COLOR=1`, `PATH=/usr/bin:/bin`, `LANG=C`, and `LC_ALL=C`. Windows must contain the same
  common disposable keys plus disposable `USERPROFILE`, `APPDATA`, `LOCALAPPDATA`, identical trusted
  `SystemRoot`/`WINDIR`, exact three-entry system `PATH`, and `PATHEXT=.COM;.EXE`. Assert exact key-set
  equality and absence of `NODE_OPTIONS`, `NODE_PATH`, proxy, package-manager, credential, and every
  hostile caller key. The Windows case must derive all three system `PATH` entries only from the
  injected `FrozenWindowsDirectory`; reject a relative, mismatched-kind, or unverified value and never
  read `SystemRoot`, `WINDIR`, or `PATH` from the caller environment.
- On Linux/macOS, write native fixtures for exact argv, `shell:false`, provider nonzero, signal,
  root exit with lingering same-group descendant, timeout, group termination, pipe drain, and an
  injected group-query/termination uncertainty that yields `termination-unverified` rather than
  success. State explicitly that a caller-trusted provider which changes process group/session or
  otherwise escapes the inherited PGID is outside the non-sandboxed contract and is not claimed
  detectable.
- Assert every runner branch returns the exact closed `ProcessTransportResult` without throwing raw
  child/process errors. Cover timeout followed by a signal, timeout followed by an exit status, timeout
  plus unverified termination, spawn/control failure before start, nonzero completion, ordinary signal,
  and all stdout/stderr count/truncation combinations. Impossible discriminant/status/signal/timeout/
  tree-state pairs fail decoding before formatter-outcome precedence.
- Run focused/native suites; verify implementations are absent.
- Implement the fixed-capacity ring and empty-base environment. Use `spawn` with
  `detached: true`, exact executable/argv/cwd/env, and `shell: false`; record the process group before
  treating provider code as started.
- Drain both streams continuously, wait for group quiescence and EOF, signal the negative PID on
  deadline, and return only transport metadata. Do not log child bytes.
- Re-run native tests on Linux and macOS through the Phase 3 workflow.

### 3.8 Build and verify the internal Win32 Job Object helper

**Files:**

- Modify: `packages/ai-tooling/native/win32-helper/CMakeLists.txt`
- Modify: `packages/ai-tooling/native/win32-helper/protocol.h`
- Modify: `packages/ai-tooling/native/win32-helper/main.cc`
- Modify: `packages/ai-tooling/scripts/build-native.mjs`
- Modify: `packages/ai-tooling/src/native/win32-helper.ts`
- Modify: `packages/ai-tooling/tests/unit/win32-protocol.spec.ts`
- Modify: `packages/ai-tooling/tests/native/win32-helper.native.spec.ts`
- Modify: `packages/ai-tooling/package.json`
- Modify: `packages/ai-tooling/tests/package/package-contract.spec.ts`

**Interfaces:** Phase 3 extends the already-green internal `file-identity` protocol with
`windows-directory` and `spawn-job`; none is exported from the package root. `windows-directory` returns the absolute path
and directory identity as `FrozenWindowsDirectory`; `file-identity` revalidates that exact directory
identity as well as regular files. Phase 4 adds `process-identity` before liveness uses it.

- Extend the Phase 2 golden binary frames with operation tags and payloads for `windows-directory`
  and `spawn-job`, retaining magic `EVK1`, protocol version `1`, unsigned
  little-endian lengths/counts, strict UTF-8 strings, and a maximum 4 KiB per scalar/64 KiB total
  request. Write TypeScript encode/decode tests for truncation, overflow, unknown tag/version,
  embedded NUL, invalid UTF-8, and trailing bytes. Decode `spawn-job` only into the exact shared
  `ProcessTransportResult` union, including timeout secondary exit/signal and termination uncertainty;
  reject every impossible discriminant/status/count/tree-state combination.
- Run the unit suite; verify the new operation frames/handlers fail while Phase 2 `file-identity`
  remains green.
- Extend the C++ decoder with checked integer arithmetic and no third-party parser. Implement
  `GetSystemWindowsDirectoryW`, return its handle-bracketed directory identity with the path, and
  support immediate identity revalidation before formatter spawn; retain Release `/MT`, `/W4 /WX`,
  CFG, DEP, ASLR, and Unicode APIs only.
- On Windows, make the environment builder consume only that verified response, derive identical
  `SystemRoot`/`WINDIR` plus the exact three-entry system `PATH`, and revalidate the directory identity
  immediately before provider spawn. A failed or changed lookup returns `environment-unavailable`
  without spawning provider code.
- On Windows, make the build reject every architecture except x64 and write
  `dist/native/win32-x64/ai-tooling-win32-helper.exe` plus a SHA-256 manifest by default. Its only
  alternate output is the package checker's already-frozen private staging `dist/native` root passed
  through the internal `--output-root` form; reject every other output root and any pre-existing/link/
  reparse destination. Resolve the runtime helper only for the IC-8 `win32-x64` tuple and only relative
  to the installed tooling module; every other tuple returns the exact unsupported-native-platform
  diagnostic before resolution. Reject links/reparse points, verify the manifest, and revalidate
  immediately before launching the helper. The helper rechecks the requested provider's expected
  Win32 identity before `CreateProcessW`.
- On `linux-x64` and `darwin-arm64`, make `build-native.mjs` verify the supported tuple, emit a
  stable not-applicable result, create no native artifact, and exit `0`; reject every other tuple.
  Retain the Phase 2 `build:native`/`test:native` graph and add the final native-aware `pack:check` plus
  its package-contract assertions before running native tests. The checker must rebuild directly into
  its isolated stage and must not copy the working `dist/native`; leave a different valid helper there
  and prove the staged tar digest follows the fresh build, while a staged-build failure produces no
  tarball and never falls back to the working artifact.
- Parse the staged PE import table in native/package tests and reject `VCRUNTIME*`, `MSVCP*`,
  `ucrtbase.dll`, or any dependency outside the exact reviewed Windows system-DLL allowlist. Assert the
  Release `/MT` CMake property and fail the canonical package check on a dynamically linked helper.
- Add native job tests for exact executable/argv/environment/cwd, creation-time Job membership,
  attribute-list failure with no child, membership failure with no resume, helper crash immediately
  after process creation, root plus grandchild, nonzero exit, large separate stdout/stderr, oversized
  helper response, parent/helper deadline, handle-inheritance probes, kill-on-close, quiescence, and
  injected completion-port failure. Add a unit fixture for every non-`win32-x64` tuple and assert the
  exact capability-unavailable diagnostic with no helper lookup or provider spawn.
- Implement `CreateProcessW` with explicit application name and Windows command-line quoting from
  an argv array; test empty, space, quote, backslash-before-quote, trailing-backslash, metacharacter,
  and Unicode arguments. Use an inherited pipe allowlist,
  `EXTENDED_STARTUPINFO_PRESENT | CREATE_SUSPENDED | CREATE_UNICODE_ENVIRONMENT`, one exact
  `STARTUPINFOEXW` attribute list containing the handle-list and Job-list attributes, job-membership
  verification before `ResumeThread`, completion-port
  active-process accounting, 300-second whole-tree deadline, bounded rings, bounded parent protocol,
  and stable response reasons. Never launch `cmd.exe` or PowerShell.
- Run `pnpm --filter @evk-soft/ai-tooling run build:native`, then run the Win32 native suite on
  `windows-2025`; use a provider-side marker inside the temporary
  test workspace to assert no provider code ran when control setup failed.

### 3.9 Freeze the disposable checkout, census, and outcome precedence

**Files:**

- Create: `packages/ai-tooling/src/git/census.ts`
- Create: `packages/ai-tooling/src/formatter/disposable-checkout.ts`
- Create: `packages/ai-tooling/src/formatter/outcome.ts`
- Create: `packages/ai-tooling/src/formatter/runner.ts`
- Create: `packages/ai-tooling/tests/unit/formatter-outcome.spec.ts`
- Create: `packages/ai-tooling/tests/integration/checkout-census.spec.ts`
- Create: `packages/ai-tooling/tests/integration/formatter-runner.spec.ts`
- Modify: `packages/ai-tooling/src/commands/doctor.ts`
- Modify: `packages/ai-tooling/src/cli.ts`

**Interfaces:**

```ts
export type CheckoutCensusEntry =
  | { readonly path: PortableRelativePath; readonly kind: 'file'; readonly digest: Sha256Hex }
  | { readonly path: PortableRelativePath; readonly kind: 'link'; readonly target: string };

export interface CheckoutCensusSnapshot {
  readonly entries: readonly CheckoutCensusEntry[];
  readonly digest: Sha256Hex;
}

export interface CheckoutCensus {
  capture(context: ReadOnlyProjectContext): Promise<CheckoutCensusSnapshot>;
}

export interface FormatterCheckRequest {
  readonly context: ReadOnlyProjectContext;
  readonly provider: FrozenFormatterProvider;
  readonly argv: readonly string[];
  readonly registeredLeaves: readonly CandidateLeaf[];
}

export function runFormatterCheck(request: FormatterCheckRequest): Promise<FormatterOutcome>;
```

`FormatterOutcome` is the exact IC-10 shape. A private `DisposableGitBuilder` may mutate only its
freshly created disposable root and cannot address the real worktree.

- Write census fixtures for file bytes, symlink target, add/remove/kind change, NUL-sensitive
  names, ignored/dependency/.git exclusion, failed read/hash, first/second-list mismatch, hostile Git
  config, Git timeout, frozen provider substitution, pre-spawn swap, post-spawn swap, unsupported Git,
  and pre/post query failure. Add exact 100,000-entry, 16 MiB-per-file, 512 MiB aggregate-file,
  64-level, 4 KiB-path, and 16 MiB aggregate-path boundaries plus one-over regular/sparse files,
  truncated/extra reads, a 30-second no-progress case, and the 300-second whole-census deadline.
- Write disposable-copy tests proving there is no link to real `node_modules`, the selected Node
  entry still resolves from the original trusted graph, the child `cwd` is disposable, and only
  Git-visible source plus registered output/config prerequisites are copied. Reject absolute,
  drive/UNC, backslash, and escaping-`..` symlink targets; require every accepted relative symlink
  chain to resolve to another censused path inside the disposable root, recreate it only there, and
  fail before spawn if safe recreation is unavailable. In the successful copy/staging fixture, include
  tracked/untracked names containing the valid metacharacters `[`, `&`, and `(` plus a tracked regular
  `100755` file on every host. In separate rejection fixtures, let the raw A-census contain tabs,
  newlines, `*`, `?`, or `:` and require IC-5 rejection before any disposable-root copy, Git mutation,
  formatter spawn, or real-root write.
- Create a known-empty template directory, then initialize with the frozen executable and isolated
  environment using exact argv `--literal-pathspecs -C <disposable> init --template=<empty-template>
  --initial-branch=ai-tooling-formatter`. Copy the A-census bytes, then run fixed argv
  `--literal-pathspecs -C <disposable> add -f --pathspec-from-file=- --pathspec-file-nul` and stream the
  portable-byte-sorted tracked A paths as exact UTF-8 plus NUL through bounded stdin; leave A-census
  untracked paths untracked. Reapply every tracked regular-file index mode with at most two fixed argv
  calls, `--literal-pathspecs -C <disposable> update-index --chmod=+x -z --stdin` and the corresponding
  `--chmod=-x` form, streaming each sorted mode group as UTF-8/NUL. No repository path is an argv token,
  and the builder owns/limits/closes stdin under the one whole-operation deadline. Verify the disposable tracked/untracked sets, modes,
  kinds, and bytes equal A before
  provider spawn. This mutation-only disposable builder is separate from
  `FrozenGitProvider.runRepositoryReadOnly`, inherits no templates/hooks/config, and cannot receive a real-root
  path.
- Add exact-at-limit/one-over path-stream fixtures plus a synthetic set that exceeds Windows command-
  line length and POSIX `ARG_MAX` while remaining within IC-16. Capture argv and stdin separately;
  require the three fixed command shapes, exact NUL framing/no trailing ambiguity, backpressure, early-
  exit pipe handling, and identical final staged sets/modes on all three systems.
- Create the randomized disposable root exclusively under an already-frozen trusted temporary
  parent with owner-only permissions/ACL and no-follow checks; capture its directory identity and
  revalidate it before every child operation. For each census file, reject the captured size before
  copy, stream from the no-follow source into an exclusive destination under the IC-16 per-file,
  aggregate, no-progress, and whole-operation bounds, and verify source/destination length, digest, and
  identity. Never buffer or hard-link the checkout body. After provider-tree quiescence and all stream
  handles close, clean success and ordinary failure by a verified no-follow leaf walk plus empty-
  directory removal rooted in that same captured identity. If provider termination, root identity, or
  cleanup completion is uncertain, preserve the disposable tree and emit only a redacted basename and
  stable recovery action; never race a live child with recursive deletion.
- Write an exhaustive Cartesian outcome test. Apply this primary precedence exactly:

```ts
const precedence = [
  'termination-unverified',
  'git-provider-identity-changed-after-spawn',
  'post-census-failed',
  'checkout-census-changed',
  'registered-bytes-changed',
  'timeout',
  'exit-nonzero',
  'terminated-by-signal',
  'process-tree-control-unavailable',
  'spawn-error',
] as const;
```

  Include pairwise and multi-failure rows for both post-spawn Git reasons so their order relative to
  termination uncertainty, checkout drift, and transport failures is executable rather than inferred.
  Derive transport reasons only from the closed `ProcessTransportResult.kind`; a timeout's secondary
  exit/signal never downgrades it, while `termination-unverified` outranks its `timedOut` value and all
  downstream observations. Assert exit `2` for provider syntax/trust, `4` for unavailable/pre-spawn/tree/spawn/signal/timeout/
  termination uncertainty, `1` for completed nonzero or registered conflict, and `3` for post-spawn
  census uncertainty or checkout change.
- Run focused suites; verify orchestrator is absent.
- Implement the exact IC-6/IC-16 streaming real census before disposable work, create a fresh
  independent Git repository in the frozen disposable root, run the frozen provider, validate
  registered disposable bytes, recapture the real census, and apply precedence without an unchanged
  claim after uncertainty.
- Populate every outcome field in every branch; redact requested path-like tokens as
  `<redacted>/<basename>` and retain bare tokens/specifiers as logical values only. Route both through
  IC-17 and add hostile basename/bare-token terminal and bidi fixtures. Never place raw provider output,
  raw terminal controls, or absolute paths in JSON/human diagnostics; parsed JSON retains the exact
  redacted logical value.
- Wire both exact CLI forms and rerun partial-write, poisoning, acquisition-spy, redaction,
  timeout, process-tree, Git-swap, census, and outcome tests on all three native systems.

### 3.10 Add human-owned Biome exclusions and native read-only workflow

**Files:**

- Modify: `biome.json`
- Create: `.github/workflows/ai-tooling.yml`
- Create: `packages/ai-tooling/scripts/await-native-validation.mjs`
- Create: `packages/ai-tooling/tests/unit/await-native-validation.spec.ts`
- Create: `packages/ai-tooling/tests/integration/biome-exclusions.spec.ts`
- Create: `docs/ai-tooling/AI-AUTHORING-GUIDE.md`
- Modify: `packages/ai-tooling/README.md`
- Modify: `docs/ai-tooling/SECURITY.md`
- Modify: `docs/system-overview/ai-tooling.md`

- Add a failing config test requiring the exact IC-8 `files.includes` value and proving the
  public `configs/biome-config/**` preset is byte-identical to Phase 2.
- In a temporary repository, create all registered generated paths and lock bytes, run actual
  Biome 2.5.6 `check --write .` through the Node-entry formatter checker, and assert registered bytes
  plus real census are unchanged. Add a control human JSON file and prove Biome still checks it.
- Run the focused test; verify root exclusions are absent.
- Add only the exact IC-8 root property. Do not edit the public preset or `.husky/pre-commit`.
- Create the native workflow with read-only permissions, `fail-fast: false`, an explicit
  `matrix.include` containing `ubuntu-24.04`/`linux`/`x64`, `windows-2025`/`win32`/`x64`, and
  `macos-15`/`darwin`/`arm64`, Node/pnpm versions, and a portable install step whose YAML has exact
  `env: { HUSKY: '0' }` with exact `run: pnpm install --frozen-lockfile --ignore-scripts`; Windows helper
  build, typecheck, build, package tests, and native read-only fixtures. Immediately after Node setup,
  compare `process.platform` and `process.arch` with the matrix values and fail on drift. The only
  trigger is a push to
  `codex/ai-tooling-stage1-validation`; there is no pull-request, schedule, or dispatch trigger. Use
  only `actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683` (reviewed v4.2.2) and
  `actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020` (reviewed v4.4.0), with
  `persist-credentials: false`, no action cache, `corepack enable`, and
  `corepack install --global pnpm@11.20.0`. Record the official reviewed commit URLs
  `https://github.com/actions/checkout/commit/11bd71901bbe5b1630ceea73d27597364c9af683` and
  `https://github.com/actions/setup-node/commit/49933ea5288caeca8642d1e84afbd3f7d6820020`
  plus `https://docs.github.com/en/actions/reference/runners/github-hosted-runners` and the workflow
  SHA-256 in Phase 3 evidence. Capture the complete Git-visible checkout baseline before install and
  require the same baseline after install and after all checks; tests use temporary repositories/homes
  only. The workflow-contract test rejects a missing/reordered `--ignore-scripts`, inline POSIX-only
  environment assignment, missing/wrong step-level `HUSKY: '0'`, or a baseline first captured after
  installation.
- Test `await-native-validation.mjs` with fake `git`/`gh` executables: zero runs then one run,
  duplicate exact-SHA runs, wrong host/repository/origin/event/branch/SHA/run URL, a fork response with
  the same SHA/job names, malformed JSON, missing/extra matrix job, failed/cancelled job, hostile
  `GH_HOST`/`GH_REPO`, executable substitution after initial resolution, command timeout, overall
  2,700-second timeout, and green three-job completion. Require exact `--host github.com` and
  `--repo github.com/evk-soft/devkit`; reject every other or missing value. From the caller's initial
  `PATH`, resolve each operator-trusted CLI once to an absolute no-link regular file, freeze its native
  identity, invoke only that absolute path with argv arrays, `shell: false`, and 30-second per-call
  deadlines, and revalidate identity before every spawn and after completion. Through that frozen Git,
  require both `remote get-url --all origin` and `remote get-url --all --push origin` to return one
  effective URL for `origin`, exactly
  `https://github.com/evk-soft/devkit.git`, then capture exact local `HEAD`. Override
  `GH_HOST=github.com`, remove `GH_REPO`, and pass `--repo github.com/evk-soft/devkit` on every
  `gh run list` and `gh run view`; additionally require every accepted run URL to begin with
  `https://github.com/evk-soft/devkit/actions/runs/`. Poll at ten-second intervals, emit no token,
  authentication environment value, or child output, and never push or rerun a workflow.
- Update durable docs for generated-vs-source editing, native project discovery, ownership,
  shadows, formatter operational trust, fixed environment, non-sandbox limitation, census, and the
  fact that AI Tooling verifies but never edits `.gitignore`/Biome config. Do not link back to this
  plan or child spec.
- Validate workflow YAML structurally and run the exact Biome fixture locally on the available OS.

### 3.11 Phase 3 gate and commit

- Run:

```text
pnpm --filter @evk-soft/ai-tooling run typecheck
pnpm --filter @evk-soft/ai-tooling run test:unit
pnpm --filter @evk-soft/ai-tooling run test:integration
pnpm --filter @evk-soft/ai-tooling run test:native
pnpm --filter @evk-soft/ai-tooling run build
pnpm --filter @evk-soft/ai-tooling run pack:check
node packages/ai-tooling/scripts/check-stage1-artifacts.mjs --phase 3 --tree
pnpm check
git diff --check
```

- Before staging, require every current-OS native fixture to pass. Cross-OS evidence is explicitly
  post-candidate: after the one Phase 3 commit, follow §0.3's separately authorized validation push
  and require green Windows, Linux, and macOS jobs for discovery, target registry, Codex/Claude
  goldens, shadows, read-only commands, formatter provider/runner, process tree, census, Biome
  exclusions, and byte-identical second render.
- Re-run the complete hostile provider/Git/environment/output/path fixture list from the approved
  Phase 3 gate and inspect outcome snapshots for raw bytes, secrets, or absolute paths.
- Verify `git diff -- configs/biome-config .husky` is empty and no generated root output/lock was
  created.
- Stage only the exact Phase 3 manifest paths and verify exact status/path/mode equality.
- Commit with `git commit --no-verify -m "feat(ai): add project adapters and read-only audits"`.
- Re-run the complete local gate against committed `HEAD`; after the §0.3 exact-SHA workflow is
  green, report the final SHA/native run links/evidence and stop for owner approval of Phase 4.

## Phase 4 normative contract — safe mutation and recovery

**Phase owner gate:** Start only after the owner approves the exact Phase 3 commit. IC-11's native
Windows/Linux/macOS liveness providers are the approved implementation choice; do not replace them
with PowerShell, `tasklist`, WMIC, an inferred shell, or a new dependency.

**Phase allowlist:** `.github/workflows/ai-tooling.yml`, `packages/ai-tooling/**`,
`docs/ai-tooling/USER-GUIDE.md`, `docs/ai-tooling/SECURITY.md`, and
`docs/system-overview/ai-tooling.md`. The allowlist excludes real root config, lock, generated
outputs, `.gitignore`, `biome.json`, public Biome presets, and hooks.
The complete version-1 state schema, `StateV1`, registry map, and assignability tests were frozen in
Phase 1; Phase 4 implements against those unchanged bytes. Any discovered schema/type mismatch stops
for an owner-reviewed plan amendment instead of silently evolving one side.

### 4.1 Extend the one repository-filesystem gateway to every mutation

**Files:**

- Modify: `packages/ai-tooling/src/fs/repository-filesystem.ts`
- Create: `packages/ai-tooling/src/fs/path-identity.ts`
- Create: `packages/ai-tooling/tests/unit/repository-filesystem-mutation.spec.ts`
- Create: `packages/ai-tooling/tests/native/repository-filesystem.native.spec.ts`
- Modify: `packages/ai-tooling/native/win32-helper/protocol.h`
- Modify: `packages/ai-tooling/native/win32-helper/main.cc`
- Modify: `packages/ai-tooling/src/native/win32-helper.ts`
- Create: `packages/ai-tooling/src/fs/local-state-prerequisite.ts`
- Create: `packages/ai-tooling/tests/unit/local-state-prerequisite.spec.ts`

**Interfaces:**

```ts
export interface RepositoryFilesystem extends ReadOnlyRepositoryFilesystem {
  readVerified(
    ref: ContainedPathRef,
    expected: Extract<ObservedPathState, { readonly kind: 'file' }>,
    budget: RepositoryReadBudget,
  ): Promise<{
    readonly bytes: Uint8Array;
    readonly observed: Extract<ObservedPathState, { readonly kind: 'file' }>;
  }>;
  inspectVerified(
    ref: ContainedPathRef,
    expected: ObservedPathState,
    budget: RepositoryReadBudget,
  ): Promise<ObservedPathState>;
  createExclusive(
    ref: ContainedPathRef,
    expected: { kind: 'absent' },
    bytes: Uint8Array,
    staging: DurableStagingIntent,
  ): Promise<Extract<ObservedPathState, { readonly kind: 'file' }>>;
  createRunLockExclusive(
    stateRoot: ContainedPathRef,
    expectedRoot: ObjectLocatorIdentity<'directory'>,
    expectedLock: Extract<ObservedPathState, { readonly kind: 'absent' }>,
    bytes: Uint8Array,
  ): Promise<Extract<ObservedPathState, { readonly kind: 'file' }>>;
  restoreOriginalArchiveVerified(
    stateRoot: ContainedPathRef,
    expectedRoot: ObjectLocatorIdentity<'directory'>,
    expectedLock: Extract<ObservedPathState, { readonly kind: 'absent' }>,
    archive: ContainedPathRef,
    expectedArchive: Extract<ObservedPathState, { readonly kind: 'file' }>,
    authority: RecoveryArchiveRestoreAuthority,
  ): Promise<{
    readonly currentRunLock: Extract<ObservedPathState, { readonly kind: 'file' }>;
    readonly originalArchive: Extract<ObservedPathState, { readonly kind: 'absent' }>;
  }>;
  publishRecoveryHandoffVerified(
    staleLocksRoot: ContainedPathRef,
    expectedRoot: ObjectLocatorIdentity<'directory'>,
    currentRunLock: ContainedPathRef,
    expectedRunLock: Extract<ObservedPathState, { readonly kind: 'file' }>,
    expectedHandoff: Extract<ObservedPathState, { readonly kind: 'absent' }>,
    bytes: Uint8Array,
    authority: RecoveryHandoffAuthority,
  ): Promise<Extract<ObservedPathState, { readonly kind: 'file' }>>;
  retireRecoveryPredecessorVerified(
    currentRunLock: ContainedPathRef,
    expectedRunLock: Extract<ObservedPathState, { readonly kind: 'file' }>,
    handoff: ContainedPathRef,
    expectedHandoff: Extract<ObservedPathState, { readonly kind: 'file' }>,
    retirement: RecoveryPredecessorRetirement,
    authority: RecoveryHandoffAuthority,
  ): Promise<{
    readonly currentRunLock: Extract<ObservedPathState, { readonly kind: 'absent' }>;
    readonly originalArchive: Extract<ObservedPathState, { readonly kind: 'file' }>;
  }>;
  createRecoveryRunLockExclusive(
    stateRoot: ContainedPathRef,
    expectedRoot: ObjectLocatorIdentity<'directory'>,
    expectedLock:
      | Extract<ObservedPathState, { readonly kind: 'absent' }>
      | Extract<ObservedPathState, { readonly kind: 'file' }>,
    handoff: ContainedPathRef,
    expectedHandoff: Extract<ObservedPathState, { readonly kind: 'file' }>,
    originalArchive: ContainedPathRef,
    expectedOriginalArchive: Extract<ObservedPathState, { readonly kind: 'file' }>,
    bytes: Uint8Array,
    authority: RecoveryHandoffAuthority,
  ): Promise<{
    readonly runLock: Extract<ObservedPathState, { readonly kind: 'file' }>;
    readonly journalPrefix: RecoveryRewriteAuthority | null;
    readonly terminalArchive: RecoveryRewriteAuthority;
  }>;
  deleteRecoveryHandoffVerified(
    handoff: ContainedPathRef,
    expectedHandoff: Extract<ObservedPathState, { readonly kind: 'file' }>,
    successorRunLock: ContainedPathRef,
    expectedSuccessor: Extract<ObservedPathState, { readonly kind: 'file' }>,
    originalArchive: ContainedPathRef,
    expectedOriginalArchive: Extract<ObservedPathState, { readonly kind: 'file' }>,
    authority: RecoveryHandoffAuthority,
  ): Promise<void>;
  createJournalHeaderExclusive(
    transactionsRoot: ContainedPathRef,
    expectedRoot: ObjectLocatorIdentity<'directory'>,
    operationId: string,
    expectedJournal: Extract<ObservedPathState, { readonly kind: 'absent' }>,
    bytes: Uint8Array,
  ): Promise<{
    readonly journal: Extract<ObservedPathState, { readonly kind: 'file' }>;
    readonly advanceRunLock: RunLockAdvanceAuthority;
  }>;
  verifyJournalHeaderForRunLockAdvance(
    runLock: ContainedPathRef,
    expectedPreJournalRunLock: Extract<ObservedPathState, { readonly kind: 'file' }>,
    journal: ContainedPathRef,
    expectedHeader: Extract<ObservedPathState, { readonly kind: 'file' }>,
    advanceStaging: ContainedPathRef,
    expectedAdvanceStaging:
      | Extract<ObservedPathState, { readonly kind: 'absent' }>
      | Extract<ObservedPathState, { readonly kind: 'file' }>,
    action: ConfirmedJournalAction & { readonly action: 'complete' },
  ): Promise<RunLockAdvanceAuthority>;
  appendJournalFrameVerified(
    journal: ContainedPathRef,
    expectedJournal: Extract<ObservedPathState, { readonly kind: 'file' }>,
    expectedSequence: number,
    frameBytes: Uint8Array,
  ): Promise<Extract<ObservedPathState, { readonly kind: 'file' }>>;
  appendTerminalFrameVerified(
    journal: ContainedPathRef,
    expectedJournal: Extract<ObservedPathState, { readonly kind: 'file' }>,
    expectedSequence: number,
    frame: Extract<JournalFrameV1, { readonly type: 'committed' | 'rolled-back' }>,
    action: ConfirmedJournalAction,
    header: JournalHeaderPayloadV1,
  ): Promise<
    | {
        readonly outcome: 'candidate';
        readonly journal: Extract<ObservedPathState, { readonly kind: 'file' }>;
        readonly retainedPreimages: readonly CommittedRetainedPreimageAuthority[];
      }
    | {
        readonly outcome: 'prior';
        readonly journal: Extract<ObservedPathState, { readonly kind: 'file' }>;
        readonly retainedPreimages: readonly [];
      }
  >;
  reissueCommittedRetainedPreimageAuthorities(
    journal: ContainedPathRef,
    expectedTerminalJournal: Extract<ObservedPathState, { readonly kind: 'file' }>,
    plan: ConfirmedRecoveryPlan,
    header: JournalHeaderPayloadV1,
  ): Promise<readonly CommittedRetainedPreimageAuthority[]>;
  createBackupExclusive(
    backupsRoot: ContainedPathRef,
    expectedRoot: ObjectLocatorIdentity<'directory'>,
    expectedBackup: Extract<ObservedPathState, { readonly kind: 'absent' }>,
    bytes: Uint8Array,
    authority: DurableBackupIntent,
  ): Promise<Extract<ObservedPathState, { readonly kind: 'file' }>>;
  stageRetainedPreimageVerified(
    backupsRoot: ContainedPathRef,
    expectedRoot: ObjectLocatorIdentity<'directory'>,
    retained: ContainedPathRef,
    expectedRetained:
      | Extract<ObservedPathState, { readonly kind: 'absent' }>
      | Extract<ObservedPathState, { readonly kind: 'file' }>,
    staging: ContainedPathRef,
    expectedStaging: Extract<ObservedPathState, { readonly kind: 'absent' }>,
    bytes: Uint8Array,
    authority: RetainedPreimageAuthority,
  ): Promise<{
    readonly retained:
      | Extract<ObservedPathState, { readonly kind: 'absent' }>
      | Extract<ObservedPathState, { readonly kind: 'file' }>;
    readonly staging: Extract<ObservedPathState, { readonly kind: 'file' }>;
  }>;
  commitRetainedPreimageRotationVerified(
    backupsRoot: ContainedPathRef,
    expectedRoot: ObjectLocatorIdentity<'directory'>,
    retained: ContainedPathRef,
    expectedRetained:
      | Extract<ObservedPathState, { readonly kind: 'absent' }>
      | Extract<ObservedPathState, { readonly kind: 'file' }>,
    staging: ContainedPathRef,
    expectedStaging: Extract<ObservedPathState, { readonly kind: 'file' }>,
    authority: CommittedRetainedPreimageAuthority,
  ): Promise<{
    readonly retained: Extract<ObservedPathState, { readonly kind: 'file' }>;
    readonly staging: Extract<ObservedPathState, { readonly kind: 'absent' }>;
  }>;
  advanceRunLockVerified(
    runLock: ContainedPathRef,
    expectedRunLock: Extract<ObservedPathState, { readonly kind: 'file' }>,
    journalHeader: ContainedPathRef,
    expectedHeader: Extract<ObservedPathState, { readonly kind: 'file' }>,
    bytes: Uint8Array,
    action: ConfirmedJournalAction & { readonly action: 'complete' },
    authority: RunLockAdvanceAuthority,
  ): Promise<Extract<ObservedPathState, { readonly kind: 'file' }>>;
  replaceJournalPrefixVerified(
    journal: ContainedPathRef,
    expectedJournal: Extract<ObservedPathState, { readonly kind: 'file' }>,
    recoveryRunLock: ContainedPathRef,
    expectedRecoveryRunLock: Extract<ObservedPathState, { readonly kind: 'file' }>,
    bytes: Uint8Array,
    authority: RecoveryRewriteAuthority,
  ): Promise<Extract<ObservedPathState, { readonly kind: 'file' }>>;
  terminalizeRecoveryArchiveVerified(
    archive: ContainedPathRef,
    expectedArchive: Extract<ObservedPathState, { readonly kind: 'file' }>,
    recoveryRunLock: ContainedPathRef,
    expectedRecoveryRunLock: Extract<ObservedPathState, { readonly kind: 'file' }>,
    bytes: Uint8Array,
    authority: RecoveryRewriteAuthority,
  ): Promise<Extract<ObservedPathState, { readonly kind: 'file' }>>;
  createDirectoryExclusive(
    ref: ContainedPathRef,
    expected: { readonly kind: 'absent' },
  ): Promise<Extract<ObservedPathState, { readonly kind: 'directory' }>>;
  replaceVerified(
    ref: ContainedPathRef,
    expected: ObservedPathState,
    bytes: Uint8Array,
    staging: DurableStagingIntent,
  ): Promise<Extract<ObservedPathState, { readonly kind: 'file' }>>;
  restorePriorFileVerified(
    ref: ContainedPathRef,
    expected: ObservedPathState,
    backup: ContainedPathRef,
    expectedBackup: Extract<ObservedPathState, { readonly kind: 'file' }>,
    staging: DurableRollbackStagingIntent,
    budget: RepositoryReadBudget,
  ): Promise<Extract<ObservedPathState, { readonly kind: 'file' }>>;
  renameVerified(
    from: ContainedPathRef,
    expectedFrom: ObservedPathState,
    to: ContainedPathRef,
    expectedTo: ObservedPathState,
  ): Promise<ObservedPathState>;
  deleteVerified(
    ref: ContainedPathRef,
    expected: Extract<ObservedPathState, { readonly kind: 'file' | 'link' }>,
  ): Promise<void>;
  removeEmptyDirectoryVerified(
    ref: ContainedPathRef,
    expected: Extract<ObservedPathState, { readonly kind: 'directory' }>,
  ): Promise<void>;
  flushParent(ref: ContainedPathRef): Promise<void>;
}

export interface LocalStatePrerequisiteVerifier {
  assertReady(context: ReadOnlyRepositoryContext): Promise<void>;
}
```

Only `TransactionManager` receives this mutating capability. Recovery, restore, resolution,
rendering, `check`, `diff`, and ordinary `doctor` keep a read-only view and submit typed plans to the
transaction manager.

- Write failing tests for all five Phase 1 probe results, global/system-exclude poisoning, changed
  `.gitignore` identity/bytes between probes and create, and reuse by init/sync/refresh/restore/report
  plus recovery whenever it creates new coordination state. No command may carry a private duplicate
  of this verifier.
- Write one red/green test at a time for absent-leaf exclusive file create, exclusive one-level
  directory create with returned identity, same-directory temporary file, durable file/directory and
  parent flush, atomic replace, rename, leaf delete, and verified empty-directory removal. Require
  shallow-first creation and reverse-depth removal; reject recursive creation, nonempty removal,
  wrong identity/kind, and a directory populated after confirmation. Before each system call, inject an
  ancestor or target identity swap and require containment failure with no target mutation.
- Distinguish `sameObject` from `sameObservation` everywhere. Ancestor/root continuity compares
  only the stable locator (`dev`+`ino`+kind on POSIX; volume serial+128-bit file ID+kind on Win32,
  derived from the no-follow observation and rechecked immediately before the final syscall). Leaf
  compare-and-swap and an exact
  census compare the full observation including mutable mode/attributes/size/timestamps. Creating or
  deleting a sibling must leave an existing directory reference valid while refreshing its full
  observation; replacing that directory object must fail. Add native sibling-create/delete and
  directory-replacement fixtures on all three systems.
- Require `createExclusive` to stage exact bytes in an exclusive same-directory temporary file,
  flush it, and publish atomically without overwrite: POSIX links the staged inode to the absent target
  then unlinks the temporary name; Win32 uses the helper's no-replace move. Reject unsupported
  filesystem semantics rather than falling back to a partially written final path. Inject crashes and
  target races before/after staging, flush, publish, unlink, and parent flush; the target is absent or
  exact candidate bytes, never partial.
- Permit generic create/replace staging only with a branded `DurableStagingIntent` returned after
  the corresponding journal intent frame is flushed. Derive its exact same-parent basename as
  `.evk-ai-tooling-tmp-<operation-uuid>-<43-char-nonce>-<six-digit-step>`; the journal binds target,
  staging path, candidate digest, and length before exclusive staging create. Reject a pre-existing
  staging leaf, wrong parent/name/operation/nonce/step, link/reparse, or candidate mismatch. Recovery
  may classify an intent-owned staging file as full candidate or as an exact byte prefix of the
  rederived, accepted candidate while the target still equals the journaled prior state. It binds the
  current staging identity/digest/length into the confirmed recovery plan, revalidates, deletes the
  unchanged prefix/full temp, and retries; a target already at candidate permits only a full candidate
  hard-link temp cleanup. An absent path is already clean; a non-prefix, changed target/temp, or any
  other combination is preserved/blocking. Cover every candidate byte boundary and POSIX post-link/
  pre-unlink state for both create and replace.
- Permit prior-file restoration only through `restorePriorFileVerified` with a
  `DurableRollbackStagingIntent` returned after the complete reverse marker barrier. It revalidates the
  exact target, backup identity/digest/length, and header-derived same-parent rollback stage; streams a
  verified copy from backup to an exclusive stage under the shared budget, flushes it, atomically
  publishes the prior bytes, and flushes the parent without renaming, truncating, or deleting the
  backup. Cover rollback of both forward replace and forward delete, every rollback-stage byte/publish/
  unlink/parent-flush boundary, prefix/full stage recovery, target races, and backup drift. The transient
  backup remains unchanged until the complete prior tree and explicit prior lock state are reverified;
  only then may cleanup delete it. Forward and rollback authority types, basenames, and writer methods
  are compile-time and runtime non-interchangeable.
- Test the one fixed `.ai-tooling/run.lock` exception separately. `createRunLockExclusive` accepts
  only the exact captured `.ai-tooling` directory observation plus absent fixed child, revalidates both,
  and writes the bounded record directly with POSIX `O_EXCL` or Win32 `CREATE_NEW`, followed by file and
  state-root flush; it creates no companion name and returns the opened file observation. Inject every
  short-write/flush boundary: the only possible child is absent, exact `run.lock`, or partial/malformed
  `run.lock`. Partial/malformed bytes are preserve-first blocking evidence and are never used for
  liveness or auto-removed. The only later exception is a recovery-successor prefix that a complete
  unchanged `RecoveryHandoffV1` binds byte-for-byte; it uses `createRecoveryRunLockExclusive`, not this
  ordinary method.
- Test the recovery-critical journal-header exception separately. `createJournalHeaderExclusive`
  accepts only the exact captured `.ai-tooling/transactions` directory observation, a validated
  lowercase UUID v4 operation ID that deterministically names its one journal, and an absent child. It
  uses the same direct no-companion create/write/flush contract. A successful return is the closed
  `{ journal, advanceRunLock }` pair: the gateway parses/cross-checks
  the exact flushed header and is the only issuer of its branded `RunLockAdvanceAuthority`; no caller
  constructor exists. That authority alone cannot write: the initial `advanceRunLockVerified` call also
  requires a confirmed complete action bound to the same header, operation, nonce, and plan. After a
  process restart, `verifyJournalHeaderForRunLockAdvance` is the only
  reissuer: it revalidates the exact pre-journal run lock, complete header identity/digest/bytes,
  operation/nonce, a confirmed complete action whose `headerDigest` equals the recomputed sequence-0
  frame digest, and header-derived advance-stage
  absence or full exact candidate. A prefix stage is
  classified but mints nothing until a confirmed recovery plan removes the unchanged prefix and the
  issuer is rerun; any third state blocks. Fresh-process crashes before/after header flush and at every
  advance stage/write/publish/flush boundary must reach journal-ready without a cast or duplicate header.
  For both the initial and reissued paths, omit the confirmed action and forge or swap each action
  digest, operation, action tag, header digest, authority, and run-lock observation; every case must
  fail before the advance staging file or run lock changes.
  A
  partial/malformed header is preserved as corrupt journal evidence; no ordinary staged temp may exist
  before the durable header. Test `appendJournalFrameVerified` with the complete prior file observation:
  it must revalidate identity/digest/length, the caller's expected next sequence, and exact EOF, append only one bounded canonical frame,
  flush, and return the post-append observation. Short/crashed append leaves only the prefix semantics
  defined in Task 4.3; no journal writer exists outside this gateway. It rejects both terminal types;
  only `appendTerminalFrameVerified` accepts `committed` or `rolled-back`. It independently re-resolves
  every header path against respectively the candidate or prior projection, verifies actual lock state
  equals explicit `candidateLockState` or `priorLockState`, recomputes the final-tree digest, and requires
  exact operation ID plus `action.journalPlanDigest === header.planDigest === frame.planDigest`, final-
  tree digest, and final-lock equality before append; `complete` permits only `committed`, and
  `rollback` permits only `rolled-back`. Only a flushed `committed` frame returns candidate outcome and mints the per-step
  `CommittedRetainedPreimageAuthority` values; `rolled-back` returns prior outcome and an exact empty
  authority array. No caller-constructible final-tree token, cast, or alternate authority issuer exists;
  compile-time and forged-runtime tests prove the chain.
- Test direct `createBackupExclusive` separately. A flushed journal intent mints the exact branded
  backup authority for `.ai-tooling/backups/<operation-uuid>-<six-digit-step>.bak`; the method revalidates
  the backups root/absence and uses direct no-companion exclusive write+flush. Absent/exact/partial are
  attributable states only while the source remains the exact identity-bracketed journaled prior file.
  Only an exact verified backup permits target mutation. Confirmed recovery may delete an unchanged
  partial backup and retry or roll back only when its bytes are an exact prefix of those journal-bound
  prior source bytes; a non-prefix, hybrid, changed source/backup, or third state is preserved/blocking.
- Test retained-preimage staging and post-commit publication separately. Before its stage exists, a
  flushed intent marker plus its complete header entry mints only `RetainedPreimageAuthority`.
  `stageRetainedPreimageVerified` revalidates the backups-root locator, absent-or-exact-old fixed
  retained observation, managed-path binding, exact IC-12 stage name, candidate EVKP digest/length, and
  stage absence; it direct-stages and flushes the candidate but leaves the fixed old/absent observation
  byte-for-byte unchanged. It returns both observations, and only the exact staged frame permits target
  mutation. After target/final-tree verification and a flushed `committed` frame,
  `commitRetainedPreimageRotationVerified` requires its separately branded committed authority,
  revalidates old fixed plus full stage, atomically publishes with no-overwrite for absent or replacement
  for exact old, flushes the parent, and verifies full new fixed plus absent stage. Before commit,
  rollback removes only an unchanged prefix/full stage and preserves the fixed old frame; after commit,
  recovery must finish or verify this publication and cannot roll the target back. Preserve every
  collision, link, non-prefix, identity drift, or unbound leaf. Inject every byte and flush/publish
  boundary for absent and existing retained states, and prove the old fixed frame survives every
  pre-commit crash and handled rollback. In a fresh recovery process after terminal-candidate flush,
  `reissueCommittedRetainedPreimageAuthorities` is the only issuer: it independently verifies the exact
  accepted `complete` repair plan/evidence, header and existing committed frame, candidate tree/lock,
  and each old-fixed/full-stage or already-new-fixed/absent-stage state. It returns authorities only for
  still-pending exact pairs, returns none for already published pairs, and rejects rollback action,
  terminal prior, third state, or digest confusion without a token or write.
- Test the coordination/evidence rewrite methods separately. A flushed matching journal
  header mints only `advanceRunLockVerified` authority for deterministic same-parent
  `.ai-tooling/.run-lock-advance-<uuid>-<nonce>.stage`. A direct-created recovery run lock mints only the exact
  `journal-prefix` and/or `terminal-archive` authorities recorded in its closed fields, with deterministic
  IC-12 same-parent staging paths rederived from operation/generation/purpose and full source/candidate
  digests. Each method revalidates authority record, source/target/staging absence,
  bytes/digest/length and ancestor identities; stages+flushes, atomically replaces, flushes parent, and
  returns the new observation. Crash-prefix fixtures cover every candidate byte before/after stage
  create/write/flush, replace, unlink, and parent flush. With the authoritative source still at prior,
  an exact candidate prefix is identity-bound, revalidated, removed, and retried; after target publish,
  only an absent/full-candidate hard-link temp is cleanable. A non-prefix or any third source/temp/target
  state is preserved and blocks.
- Assert authority issuance is structurally closed. `createJournalHeaderExclusive` returns exactly
  one advance authority only with its exact flushed header. `createRecoveryRunLockExclusive` returns
  `{ runLock, journalPrefix, terminalArchive }`: `journalPrefix` is non-null iff the canonical recovery
  record has its non-null descriptor, while terminal archive is always the one exact record-bound
  authority. Reject every null/non-null mismatch, purpose swap, path/digest/length/generation mismatch,
  forged brand, replay with another observation, and attempted caller-side construction before any
  rewrite or target write.
- Test the four recovery-handoff methods as one closed protocol. Handoff publication uses a unique
  reserved stage, file+parent flush, and POSIX hard-link/Win32 no-replace move to make the fixed target
  absent-or-full while the exact dead predecessor run lock remains authoritative. Partial randomized
  staging is non-authoritative and permits no predecessor/target write. Retirement atomically moves an
  ordinary predecessor to its absent original archive or verified-deletes a recovery predecessor only
  under the full handoff, flushes the parent, and returns exact absent-current/full-archive observations.
  Successor creation accepts absent or an unchanged exact prefix of the one
  handoff-bound canonical successor, deletes/retries that prefix, and direct-creates/flushes the exact
  record. Both successor creation and handoff deletion immediately revalidate the same original archive
  identity/digest/length passed from retirement; handoff deletion also requires the full exact successor.
  Any non-prefix, changed predecessor/
  handoff/successor, wrong generation/plan/action, or archive collision preserves and blocks.
  After full handoff publication, only a caller whose `currentIdentity()` exactly equals the embedded
  successor owner may advance it while that owner is live; every other caller writes nothing. A foreign
  caller may restore an absent/prefix successor only after exact same-host liveness proves the embedded
  owner dead, and may then only finish coordination/delete the handoff—not execute completion/rollback
  under that dead identity. Add owner-A-paused-after-publish versus caller-B and live-owner/partial-
  successor races.
- Test the archive-only normalization separately. After confirmation over the exact archive-only
  evidence, its observation has disposition `restore-original-archive` and its non-null
  `archiveRestore` descriptor binds the archive path, exact digest/length/stable locator, current
  `run.lock` path, and expected absence. `restoreOriginalArchiveVerified` accepts only that descriptor's
  strict ordinary run-lock archive plus absent
  current run lock, atomically moves it back to `run.lock` without overwrite, flushes the state root,
  and returns full-current/absent-archive observations. It rejects a terminal/recovery record, changed
  archive/root, current collision, or crash/race without inventing bytes; the normal handoff protocol
  then rearchives it only after a full handoff is durable.
- Write native fixtures for config, override, pack, lock, output, report, journal, backup, run-lock,
  temporary, `.gitignore`, root manifest, and Biome paths. Cover symlink on all systems; Windows
  junction/reparse/UNC; case-fold/NFC collisions; file ancestor; absent lexical tail; and a swap at
  every injected pre-operation boundary.
- Run `pnpm --filter @evk-soft/ai-tooling exec vitest run
  tests/unit/local-state-prerequisite.spec.ts tests/unit/repository-filesystem-mutation.spec.ts
  tests/native/repository-filesystem.native.spec.ts
  --passWithNoTests=false --reporter=verbose`; verify the named ignore-drift assertion and missing
  mutation methods fail before production implementation.
- Implement one shared production prerequisite verifier before any state-root/run-lock/report/
  journal directory or file create. Through the frozen Git provider and isolated Git configuration,
  require exact repository `.gitignore` provenance for `/.ai-tooling/` and require
  `ai-tooling.lock.json` to remain unignored. Independently run the closed fixed-root `list-index` request
  for `local-state`, equivalent only to `ls-files -z --full-name --cached --stage -- .ai-tooling`, and
  require its complete strict-parsed map to be empty; `--no-index` ignore provenance never substitutes
  for this tracked-state proof. Also require the closed `status` request for `local-state`—the exact
  porcelain-v1/no-renames/all-untracked/`--ignore-submodules=all` fixed-root query—to return an empty map, which catches a
  HEAD-tracked path staged for deletion even when the cached map is empty. Freeze and revalidate the `.gitignore` file identity/bytes
  around the probes. Run once before planning local-state creation and again immediately before the
  first create; missing/global-only/changed rules or any probe uncertainty returns the approved
  prerequisite diagnostic with zero writes.
- Add prerequisite fixtures for a force-tracked `.ai-tooling` regular file, an index-only tracked
  entry whose worktree path is absent, a HEAD-tracked entry staged for deletion, real intent-to-add,
  conflict stages, gitlink, symlink mode, and a
  race that inserts an entry between the two checks. Every case blocks with zero state-root, run-lock,
  report, journal, backup, temporary, target, or index write.
- Implement all paths as validated repository-relative references bound to captured ancestor
  identities. Do not implement mutation as a manager-side `inspect` followed by an unchecked write:
  each gateway method accepts the expected observation, revalidates leaf and ancestors immediately
  before its final system call, and fails closed on mismatch. POSIX writes use exclusive same-directory
  files, atomic link/no-replace publication for creates, atomic rename for replacement, and file plus
  parent-directory `fsync`. Win32 extends the helper with no-follow identity and `MoveFileExW` without
  replacement for creates or with `MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH` for replacement;
  paths remain in the
  versioned binary protocol, never a command line. This is the approved immediate-revalidation and
  recoverable-transaction contract; it does not claim an operating-system atomic multi-file CAS or
  sandbox a hostile external writer racing after the final check.
- Implement no generic `mkdir -p` or recursive removal. Except for the four exact post-acceptance
  `.ai-tooling`, `.ai-tooling/transactions`, `.ai-tooling/backups`, and `.ai-tooling/stale-locks`
  structural prerequisites defined in Task 4.3, every absent directory is a separate
  `PlannedPathMutation` with candidate `{ kind: 'directory', mode: 'directory' }`; create it only after
  its own expected-state check, return/capture the created identity, flush its parent, and on rollback
  remove only that same-identity directory after proving it empty. The exception is never emitted in
  mutation-plan JSON or counted in `directoryCreates`.
- After each shallow directory create, discard every previously resolved descendant
  `ContainedPathRef`, resolve each next child/leaf again through the gateway, and require the newly
  returned directory identity at the exact ancestor position before proceeding. Never splice an
  identity into an old absent-tail ref. Test replacement of the new parent by a different real
  directory as well as a link/reparse swap; both must fail before descendant creation, and rollback may
  remove neither substitute.
- Run the unit and three-OS native suites. Assert no caller can construct a raw absolute target or
  obtain a mutation method without the internal capability token.

### 4.2 Strict-validate run locks and prove process liveness

**Files:**

- Create: `packages/ai-tooling/src/recovery/run-lock.ts`
- Create: `packages/ai-tooling/src/recovery/liveness.ts`
- Create: `packages/ai-tooling/src/recovery/linux-procfs.ts`
- Create: `packages/ai-tooling/src/recovery/macos-ps.ts`
- Create: `packages/ai-tooling/src/recovery/windows-native.ts`
- Create: `packages/ai-tooling/tests/unit/run-lock.spec.ts`
- Create: `packages/ai-tooling/tests/unit/liveness.spec.ts`
- Create: `packages/ai-tooling/tests/native/run-lock-liveness.native.spec.ts`
- Modify: `packages/ai-tooling/native/win32-helper/protocol.h`
- Modify: `packages/ai-tooling/native/win32-helper/main.cc`
- Modify: `packages/ai-tooling/src/native/win32-helper.ts`

**Interfaces:** IC-11 `ProcessLivenessProvider`, `RunLockOwner`, and:

```ts
export interface JournalPrefixRepairV1 extends JsonObject {
  readonly journalPath: PortableRelativePath;
  readonly expectedDigest: Sha256Hex;
  readonly expectedByteLength: number;
  readonly prefixDigest: Sha256Hex;
  readonly prefixByteLength: number;
  readonly stagingPath: PortableRelativePath;
}
export interface TerminalArchiveRewriteV1 extends JsonObject {
  readonly archivePath: PortableRelativePath;
  readonly expectedDigest: Sha256Hex;
  readonly expectedByteLength: number;
  readonly candidateDigest: Sha256Hex;
  readonly candidateByteLength: number;
  readonly stagingPath: PortableRelativePath;
}
export type LockStateJsonV1 =
  | (JsonObject & { readonly kind: 'absent' })
  | (JsonObject & { readonly kind: 'present'; readonly sha256: Sha256Hex });
export type OrdinaryRunLockRecordV1 = JsonObject & RunLockOwner & {
  readonly schemaVersion: 1;
  readonly operationId: string;
  readonly nonce: string;
  readonly operation: MutationOperation;
  readonly phase: 'pre-journal' | 'journal-ready';
};
export type RecoveryRunLockRecordV1 = JsonObject & RunLockOwner & {
  readonly schemaVersion: 1;
  readonly operationId: string;
  readonly nonce: string;
  readonly operation: 'repair';
  readonly phase: 'recovery';
  readonly generation: number;
  readonly acceptedPlanDigest: Sha256Hex;
  readonly targetOperation: MutationOperation;
  readonly action: 'complete' | 'rollback';
  readonly archivedRunLockPath: PortableRelativePath;
  readonly archivedRunLockDigest: Sha256Hex;
  readonly archivedRunLockByteLength: number;
  readonly journalPrefixRepair: JournalPrefixRepairV1 | null;
  readonly terminalArchiveRewrite: TerminalArchiveRewriteV1;
};
export type RunLockRecordV1 = OrdinaryRunLockRecordV1 | RecoveryRunLockRecordV1;

export interface RecoveryHandoffV1 extends JsonObject {
  readonly schemaVersion: 1;
  readonly kind: 'recovery-handoff';
  readonly operationId: string;
  readonly generation: number;
  readonly action: 'complete' | 'rollback';
  readonly acceptedPlanDigest: Sha256Hex;
  readonly predecessorDisposition: 'archive-original' | 'retire-recovery';
  readonly predecessorPath: PortableRelativePath;
  readonly predecessor: RunLockRecordV1;
  readonly predecessorDigest: Sha256Hex;
  readonly predecessorByteLength: number;
  readonly predecessorLocator: ObjectLocatorDigestProjectionV1<'file'>;
  readonly originalArchivePath: PortableRelativePath;
  readonly originalArchiveDigest: Sha256Hex;
  readonly originalArchiveByteLength: number;
  readonly originalArchiveLocator: ObjectLocatorDigestProjectionV1<'file'>;
  readonly successorPath: PortableRelativePath;
  readonly successor: RecoveryRunLockRecordV1;
  readonly successorDigest: Sha256Hex;
  readonly successorByteLength: number;
  readonly publicationStagingPath: PortableRelativePath;
}

export interface RecoveryArchiveTerminalV1 extends JsonObject {
  readonly schemaVersion: 1;
  readonly kind: 'recovery-completed';
  readonly operationId: string;
  readonly originalRunLockDigest: Sha256Hex;
  readonly action: 'complete' | 'rollback';
  readonly outcome: 'prior' | 'candidate';
  readonly finalTreeDigest: Sha256Hex;
  readonly finalLockState: LockStateJsonV1;
}
```

- Write strict parser tests for duplicate/unknown fields, wrong types, overlong strings, malformed
  UUID/nonce/host/start marker, zero/negative/fractional/unsafe/out-of-OS-range PID, injected shell
  punctuation, changed provider ID, every normal/recovery type-field cross-pair, wrong fixed archive
  path, archive-digest mismatch, and every handoff/predecessor/successor cross-field mismatch. Assert
  provider methods are not called on invalid data. Add a one-pass construction vector that serializes
  the successor first and then the enclosing handoff exactly once; the successor must not contain the
  enclosing handoff path/digest/length or require iterative/fixed-point hashing.
- Require ordinary/recovery run locks, recovery handoffs, and terminal archive records to equal the
  deterministic generated-JSON bytes for their parsed value, including key order and one final LF.
  Noncanonical whitespace/order/newline remains changed blocking evidence and is never normalized before
  liveness or handoff decisions.
- Fix exact encodings: lowercase RFC 4122 UUID v4 operation ID; 32 random nonce bytes encoded as
  43-character unpadded base64url; host equal to the exact current `os.hostname()` UTF-8 string with
  1-255 bytes and no NUL/control character; provider-specific ASCII start marker; and closed operation,
  phase, and provider-ID enums. Recovery generation starts at `1`, increments by exactly one from a
  recovery predecessor, and is bounded at `1,000,000`; overflow is preserve-first blocking.
- Write verdict tests for current live, dead, reused PID, foreign host, permission denied,
  malformed native result, missing process, same-second macOS ambiguity, and provider failure. Only
  exact same-host `dead` may enter stale recovery; reused and ambiguous block.
- Run focused tests; verify missing implementations fail.
- Implement Linux `/proc/<pid>/stat` field 22 parsing after the final `)` and direct
  `process.kill(pid, 0)`; macOS fixed `/bin/ps` argv/environment from IC-11; and Win32
  `OpenProcess`/`GetProcessTimes` through the internal helper. Metadata selects no executable, flag,
  script, or syntax.
- Run the native suite on all three systems with a live child and a terminated child, and inject
  a recorded marker from a different process to prove PID reuse is blocking.

### 4.3 Build the durable journal, backup store, and transaction manager

**Files:**

- Create: `packages/ai-tooling/src/transaction/types.ts`
- Create: `packages/ai-tooling/src/transaction/journal.ts`
- Create: `packages/ai-tooling/src/transaction/backup-store.ts`
- Create: `packages/ai-tooling/src/transaction/transaction-manager.ts`
- Create: `packages/ai-tooling/src/transaction/rollback.ts`
- Create: `packages/ai-tooling/src/transaction/mutation-plan.ts`
- Modify: `packages/ai-tooling/src/recovery/run-lock.ts`
- Create: `packages/ai-tooling/tests/unit/journal.spec.ts`
- Create: `packages/ai-tooling/tests/unit/mutation-plan-digest.spec.ts`
- Create: `packages/ai-tooling/tests/unit/transaction-manager.spec.ts`
- Create: `packages/ai-tooling/tests/native/transaction-recovery.native.spec.ts`
- Create: `packages/ai-tooling/tests/fixtures/mutation-plan-digest/vectors.json`

**Interfaces:**

```ts
export type LockState =
  | { readonly kind: 'absent' }
  | { readonly kind: 'present'; readonly sha256: Sha256Hex };

export interface TransactionManager {
  apply(plan: ConfirmedMutationPlan<Exclude<MutationOperation, 'restore-generated'>>): Promise<TransactionOutcome>;
  recover(plan: ConfirmedRecoveryPlan): Promise<RecoveryOutcome>;
  restore(plan: ConfirmedRestorePlan): Promise<TransactionOutcome>;
}

export type JournalSequence = number & { readonly __journalSequence: unique symbol };
export interface JournalPlannedMutationV1 extends JsonObject {
  readonly step: MutationStep;
  readonly path: PortableRelativePath;
  readonly observed: ObservedPathDigestProjectionV1;
  readonly candidate: DesiredPathDigestProjectionV1;
  readonly backupPath: PortableRelativePath | null;
  readonly backupDigest: Sha256Hex | null;
  readonly backupByteLength: number;
  readonly stagingPath: PortableRelativePath | null;
  readonly stagingDigest: Sha256Hex | null;
  readonly stagingByteLength: number;
  readonly rollbackStagingPath: PortableRelativePath | null;
  readonly rollbackStagingDigest: Sha256Hex | null;
  readonly rollbackStagingByteLength: number;
  readonly retainedPreimage: RetainedPreimageRotationV1 | null;
}
export interface JournalIntentMarkerV1 extends JsonObject {
  readonly step: MutationStep;
  readonly mutationDigest: Sha256Hex;
}
export interface JournalHeaderPayloadV1 extends JsonObject {
  readonly operationId: string;
  readonly nonce: string;
  readonly operation: MutationOperation;
  readonly planDigest: Sha256Hex;
  readonly priorLockState: LockStateJsonV1;
  readonly candidateLockState: LockStateJsonV1;
  readonly plannedMutations: readonly JournalPlannedMutationV1[];
  readonly runLockAdvanceStagingPath: PortableRelativePath;
  readonly journalReadyRunLockDigest: Sha256Hex;
  readonly journalReadyRunLockByteLength: number;
}
export interface JournalCompletionPayloadV1 extends JsonObject {
  readonly step: MutationStep;
  readonly path: PortableRelativePath;
  readonly resulting: ObservedPathDigestProjectionV1;
}
export type FinalLogicalPathStateV1 =
  | (JsonObject & { readonly kind: 'absent' })
  | (JsonObject & { readonly kind: 'directory'; readonly mode: '040000' })
  | (JsonObject & {
      readonly kind: 'file';
      readonly mode: '100644';
      readonly digest: Sha256Hex;
      readonly byteLength: number;
    });
export interface FinalTreeDigestProjectionV1 extends JsonObject {
  readonly schemaVersion: 1;
  readonly scope: 'planned-mutations';
  readonly outcome: 'candidate' | 'prior';
  readonly entries: readonly (JsonObject & {
    readonly path: PortableRelativePath;
    readonly state: FinalLogicalPathStateV1;
  })[];
}
export function finalTreeDigestProjection(
  header: JournalHeaderPayloadV1,
  outcome: 'candidate' | 'prior',
): FinalTreeDigestProjectionV1;
export function finalTreeDigest(projection: FinalTreeDigestProjectionV1): Sha256Hex;
export interface JournalTerminalPayloadV1 extends JsonObject {
  readonly planDigest: Sha256Hex;
  readonly finalTreeDigest: Sha256Hex;
  readonly finalLockState: LockStateJsonV1;
}
export type JournalFrameV1 =
  | { readonly sequence: 0; readonly type: 'header'; readonly payload: JournalHeaderPayloadV1 }
  | { readonly sequence: JournalSequence; readonly type: 'intent'; readonly payload: JournalIntentMarkerV1 }
  | { readonly sequence: JournalSequence; readonly type: 'completed'; readonly payload: JournalCompletionPayloadV1 }
  | { readonly sequence: JournalSequence; readonly type: 'rollback-intent'; readonly payload: JournalIntentMarkerV1 }
  | { readonly sequence: JournalSequence; readonly type: 'rollback-completed'; readonly payload: JournalCompletionPayloadV1 }
  | { readonly sequence: JournalSequence; readonly type: 'committed'; readonly payload: JournalTerminalPayloadV1 }
  | { readonly sequence: JournalSequence; readonly type: 'rolled-back'; readonly payload: JournalTerminalPayloadV1 };
export interface JournalWriter {
  ensureAllForwardIntents(
    journal: ContainedPathRef,
    expectedJournal: Extract<ObservedPathState, { readonly kind: 'file' }>,
    header: JournalHeaderPayloadV1,
    action: ConfirmedJournalAction & { readonly action: 'complete' },
  ): Promise<{
    readonly journal: Extract<ObservedPathState, { readonly kind: 'file' }>;
    readonly steps: readonly {
      readonly step: MutationStep;
      readonly staging: DurableStagingIntent | null;
      readonly backup: DurableBackupIntent | null;
      readonly retainedPreimage: RetainedPreimageAuthority | null;
    }[];
  }>;
  ensureAllRollbackIntents(
    journal: ContainedPathRef,
    expectedJournal: Extract<ObservedPathState, { readonly kind: 'file' }>,
    header: JournalHeaderPayloadV1,
    action: ConfirmedJournalAction & { readonly action: 'rollback' },
  ): Promise<{
    readonly journal: Extract<ObservedPathState, { readonly kind: 'file' }>;
    readonly steps: readonly {
      readonly step: MutationStep;
      readonly rollbackStaging: DurableRollbackStagingIntent | null;
    }[];
  }>;
}
export interface JournalActionConfirmer {
  confirmOrdinary<A extends 'complete' | 'rollback'>(
    plan: ConfirmedMutationPlan<Exclude<MutationOperation, 'restore-generated'>> | ConfirmedRestorePlan,
    header: JournalHeaderPayloadV1,
    action: A,
  ): Promise<ConfirmedJournalAction & { readonly source: 'ordinary'; readonly action: A }>;
  confirmRecovery(
    plan: ConfirmedRecoveryPlan,
    header: JournalHeaderPayloadV1,
    journal: Extract<ObservedPathState, { readonly kind: 'file' }>,
  ): Promise<ConfirmedJournalAction & { readonly source: 'repair' }>;
}
```

`FinalTreeDigestProjectionV1` contains exactly one entry for every header planned path except
`ai-tooling.lock.json`, sorted by portable key plus original UTF-8 bytes. Candidate outcome uses each
desired logical state; prior outcome uses each observed logical state. A link/other state is never
terminal-valid. Locators, timestamps, filesystem object identities, backup/staging paths, and source
bytes are excluded, so recreation of the same logical file/directory does not change the digest. The
repository lock is intentionally excluded from this projection and bound once by the adjacent explicit
`finalLockState`. `finalTreeDigest` is SHA-256 over exact RFC 8785 UTF-8 bytes. This affected-path digest
does not replace the transaction's separate full candidate/prior-tree verification before terminal
append. Journal terminal frames, recovery terminal archives, no-run-lock inert verification, and
retained-authority issuance/reissuance all call this one function and no alternate tree hash.

Each append frame is exactly `EVKJ` magic, version byte `1`, closed type byte, unsigned 32-bit
little-endian sequence, unsigned 32-bit little-endian JCS-payload length, payload bytes, then SHA-256
over the preceding frame bytes. The journal header is sequence `0`; its complete ordered
`plannedMutations` array is cross-checked against the exact canonical projection of the accepted typed plan before run-lock
creation, and each marker's `mutationDigest` is SHA-256 over the exact RFC 8785 bytes of its one header
entry. Every next frame is therefore the one deterministic canonical record implied by the accepted
plan, header, and prior valid frames.
`JournalHeaderDigest` is SHA-256 over the exact complete serialized sequence-0 frame bytes, including
its trailing frame digest. It is never a digest of only the JCS payload or of a journal containing any
later frame. While the durable journal contains only that complete header, this value equals the
observed journal file digest. `createJournalHeaderExclusive` computes it from the exact flushed bytes;
`JournalActionConfirmer` recomputes it from the canonical sequence-0 frame; and
`verifyJournalHeaderForRunLockAdvance` plus `advanceRunLockVerified` require the action, authority,
observed header-only journal, operation, and nonce to carry that same value. Creation, fresh-process
reissue, confirmation, and advance mint no authority and write no byte on any mismatch.
`JournalActionConfirmer` is the sole issuer of its module-private brand. For an ordinary/restore plan,
it requires `acceptedDigest === planDigest === header.planDigest`; handled rollback changes only the
closed action. For repair, it independently recomputes the accepted repair digest, requires the repair
operation/action/entries/evidence to exact-bind the observed original journal/header, and keeps
`journalPlanDigest` equal to that original `header.planDigest` even though `acceptedPlanDigest` is the
repair plan digest. Swapping those two values or passing a repair digest as the terminal payload fails
before marker append or mutation.

Each `ensureAll*Intents` method strict-parses the exact durable journal. Complete action accepts only the
canonical forward-marker prefix, appends/flushes its missing suffix, and returns forward capabilities
only after that entire barrier is durable. Rollback action may begin at forward prefix length `0..N`:
with the barrier incomplete and therefore zero mutation evidence, it first appends/flushes the missing
forward-marker suffix in seal-only mode without minting any forward capability, then appends/flushes the
canonical reverse-order rollback-marker suffix and returns only rollback capabilities. Thus the sole
mixed-direction grammar is one full forward barrier followed by one reverse barrier; interleaving,
duplicate, extra, or mismatched markers mint nothing. If the required barrier already exists, the method
returns newly verified direction-specific capabilities without duplicate frames, including in a fresh
process. A partial final marker requires the separately confirmed canonical-prefix repair first.
Fresh-process rollback fixtures cover forward prefix lengths `0`, `1`, `N-1`, and `N` plus a partial
forward frame, and prove no target/backup/stage byte can exist unless the full forward barrier was
already durable. Other fixtures restart after every marker and mutation boundary and prove continuation
without casts or in-memory authority reuse.
`transaction/mutation-plan.ts` is the single shared IC-13 digest, JSON-rendering, strict-boundary, and
confirmation implementation used by report, init, sync, refresh, restore, and repair; later tasks only
extend callers/tests and never duplicate that logic.

- Before any state-root, run-lock, or journal write, derive the complete ordered
  `JournalPlannedMutationV1[]` from the immediately revalidated accepted plan and preflight the worst-
  case journal size: header, every forward marker/completion, either terminal frame, every possible rollback
  marker/completion, and all framing/hash overhead must fit the 64 MiB IC-12 ceiling. An over-limit,
  plan/header mismatch, duplicate/missing step, or digest mismatch produces zero local-state bytes.
- Write a first-init test with prior `LockState.absent` and no `.ai-tooling`. After accepted-plan
  revalidation and both shared local-state prerequisite checks, create the one-level `.ai-tooling`
  directory exclusively, flush the repository root, and retain the returned directory identity; then
  create/flush the one-level `.ai-tooling/transactions`, `.ai-tooling/backups`, and
  `.ai-tooling/stale-locks` directories in that fixed order under freshly rebound references and retain
  their identities. These ignored empty directories are idempotent structural prerequisites, not
  mutation-plan entries or recovery records. Discard every pre-create descendant reference, resolve
  `.ai-tooling/run.lock` under the exact state-root identity, direct-create/flush the approved
  `pre-journal` run lock with no companion name, direct-create/flush the matching operation-ID journal
  header under the exact transactions-root identity with no companion name; that header binds the
  complete canonical planned-mutation set, deterministic run-lock-advance staging path, and candidate
  digest and mints the typed authority used to
  atomically advance that same run lock to `journal-ready`. No journal child, backup, config, repository lock, or managed
  output may change before its preceding durable authority, and no managed path may change before both
  journal-ready records are durable.
- Immediately after every own infrastructure directory create/rebind, re-list the affected parent
  through the no-follow gateway; immediately before `createRunLockExclusive`, rerun the complete strict
  local-state census. Permit only the expected benign empty-prefix plus already validated report,
  retained-preimage, and terminal-remnant state; an injected unknown sibling or changed known entry at
  any create-to-rebind boundary blocks before run-lock or managed bytes.
- Write two-concurrent-first-init tests and inject a crash before/after each of the four infrastructure
  directory creates/flushes, run-lock direct write/flush, and journal-header direct write/flush.
  Both callers may observe an absent root, but only one exclusive directory create can win at each
  level and whichever caller exclusively creates `.ai-tooling/run.lock` is the sole transaction owner;
  every loser performs zero managed writes and never removes any shared prerequisite directory. A
  crash before the run lock may leave only an exact real prefix of the four empty infrastructure
  directories, which the next command may complete after fresh ignore/census/identity checks and needs
  no repair. A partial/malformed final `run.lock` blocks preserve-first. After an exact `pre-journal`
  lock, an absent journal is the approved stale pre-journal case, an exact matching header is the
  approved header/no-markers case; its absent/exact-candidate advance temp and prior/candidate run-lock
  combinations are classified from the header authority, while any third temp state blocks. A partial/
  malformed header is corrupt evidence that blocks. A
  link/reparse, identity change, unknown root content, or unexpected temp is preserved and blocks; no
  second root-level lock or marker exists.
- Write exact mutation-plan projection vectors for absent/file/link/directory observations,
  POSIX/Win32 identity fields, candidate directory/create/replace/delete states, restore preimages, and
  the complete closed recovery-evidence projection, including archive-only restore and non-archive
  null-descriptor vectors. Reject negative/noncanonical/out-of-range numeric projections, invalid file IDs,
  duplicate/colliding paths, file digest/byte-length mismatch or missing bytes, and directory candidates
  with missing/wrong kind/mode or any byte/digest field. Require `review.before` exactly for an observed
  file and `review.after` exactly for a file candidate; hash and length must equal the corresponding
  state, every emitted stream must finish at that exact hash/length, and link/directory/absent states
  cannot mint review bytes. Require contributor projections to equal the operation-specific rule in
  IC-13 and bind them into the entry projection. Add cross-field negatives for missing/extra/swapped
  sources, changed bytes after source creation, contributor omission/invention/reordering, a non-refresh
  operation with metadata, and refresh-local with null/mismatched pack or old/new digest. Assert exact
  RFC 8785 bytes and SHA-256. Include
  a compile-time call `jcsBytes(mutationPlanDigestProjection(plan))` with no cast. Add manager-level
  `@ts-expect-error` fixtures proving `ConfirmedRestorePlan` cannot reach generic `apply` and an
  ordinary confirmed plan cannot reach `restore`; a restore-tagged generic plan missing `path`/preimage
  cannot reach `confirmOrdinary`. Runtime forged operation/evidence tags fail before accepted-digest
  comparison, branded action issuance, or writes.
- Add header/JCS lock-state vectors for `absent -> present`, `present -> present` changed and
  unchanged, and every operation-specific permitted or forbidden `present -> absent` case. Cross-check
  `priorLockState` and `candidateLockState` independently from the canonical accepted-plan projection;
  completion's `finalLockState` must equal candidate, rollback's verified final state must equal prior,
  and a path entry can never substitute for either explicit header field.
- Add exact RFC 8785 `FinalTreeDigestProjectionV1` vectors for candidate and prior outcomes, exact
  header path-set closure/order, lock-path exclusion, absent/directory/file logical states, and the
  adjacent explicit lock state. Recreate every file/directory under different POSIX/Win32 identities and
  require the same digest; change one byte/digest/length/mode/kind/path/outcome or omit/add/duplicate a
  planned path and require a different digest or rejection. Assert journal terminal, terminal archive,
  inert verification, and retained reissue all call the same function.
- Write the IC-13 bounded renderer and confirmation-transport tests before apply logic: exact and
  one-over diff/aggregate/rendered ceilings, IC-17 human/JSON escape amplification, awaited chunk backpressure,
  stdout flush/EPIPE failure, every 65-byte digest-frame split, CRLF/NUL/uppercase/short/long/extra-line,
  and a valid exact digest. Give the renderer no repository/filesystem port and assert its only byte
  inputs are the branded review streams; before-source identity/digest drift and truncated/extra/stalled
  streams fail with a closed diagnostic. Split ESC/CSI/OSC-52/C1/U+2028/U+2029/bidi values across review chunks and
  pair each with a literal escape lookalike; assert no raw hazardous scalar in either output, distinct
  human spellings, and exact parsed JSON path/diff/contributor values. Assert no confirmation read
  before successful plan flush and zero filesystem mutation on every failure.
- Write append/read fixtures with a short write and crash after every byte of every journal frame.
  A complete frame is committed only after its file flush. At EOF, accept at most one incomplete final
  frame only when every present byte is the exact prefix of the single canonical next frame implied by
  the valid prefix; treat it as not committed and recover from the preceding durable intent plus current
  target observation. A second tail, wrong prefix/sequence/type/length/digest, corruption before EOF,
  full invalid frame, or bytes after a complete terminal frame is preserve-first corruption. A partial
  sequence-0 header has no prior valid authority and remains blocking corrupt evidence. Add compile-
  time/runtime fixtures for every type/payload cross-pair, unknown payload field, invalid/noncontiguous/
  overflowing sequence, and any frame after `committed` or `rolled-back`; reject all before recovery decisions.
  Add exact `JournalHeaderDigest` vectors proving header-only file-digest equality; mutate each framing,
  payload, and trailing-digest region, substitute a payload-only digest, and substitute the whole-file
  digest after one later frame. Every mismatch must block confirmation, advance-authority creation or
  reissue, and run-lock advancement before a write.
  Add mutation-step vectors for `0`, `100001`, fractional/unsafe values, duplicate/out-of-order steps,
  noncanonical `000000`/`00001`/`100001` names, and wrong directory/file/lock order; accept exactly
  `1..100000` with six-digit names and independent contiguous frame sequences.
  Require every file candidate create/replace to carry the exact non-null target-staging triple, while
  directory/delete candidates require its null path/digest and zero length. Independently, every prior
  regular file being replaced/deleted carries the exact non-null backup path/digest/length; an absent or
  directory prior state carries the null/null/zero backup triple. The same prior-file entry carries an
  independently named non-null rollback-staging path with digest/length equal to the backup; other prior
  kinds carry null/null/zero. `ensureAllForwardIntents` accepts only complete actions and may mint target-
  staging/backup/preimage capabilities; `ensureAllRollbackIntents` accepts only rollback actions, may
  seal an incomplete zero-mutation forward prefix without forward authority, and may mint only rollback-
  staging capabilities after both barriers. Caller-supplied mixed arrays or cross-direction authority reuse fail before
  append. A marker cross-checks its exact header entry and mints nothing until that complete frame is
  flushed. A restore step that preserves a
  current regular-file preimage also carries one non-null `retainedPreimage` descriptor whose observed
  retained state, exact stage path, and candidate digest/length cross-match the journal header/step;
  every other step carries `retainedPreimage: null`. Only the flushed forward intent may mint
  `RetainedPreimageAuthority`.
- Add a present-lock test and one failure injection after every durable step: state-root/run-lock
  create, directory intent/create/identity capture, header flush, phase advance, candidate revalidation,
  each forward intent marker, stage create/write/flush, publish, stage unlink, parent flush, target race,
  backup, output replacement, lock-last replacement, final verification, either terminal-frame
  append/flush, retained-preimage post-commit publish/flush/verify, each transient-backup cleanup,
  immediately before/after run-lock release, and terminal-journal cleanup.
- Add ordering assertions: repeat target/shadow/ownership census and rerender complete candidate
  after `journal-ready`; require its typed plan/header/plan digest to remain exact, then in a first pass
  append and flush every forward intent marker in canonical step order. No backup, target staging,
  retained-preimage staging, structural-directory, managed-path, or repository-lock mutation may begin
  until the complete marker set is durable. In the second pass, create directories
  before descendant files; after each directory create, re-resolve/rebind all descendant refs to the
  journaled returned identity; backup before path replace; append+flush completed step after replace;
  remove transaction-created empty directories only in reverse depth order; lock last; verify complete
  tree; append/flush one terminal `committed` frame carrying the verified candidate-state digest; use only
  its committed authorities to publish and verify staged retained preimages over their still-unchanged
  fixed predecessors; clean only matching transient backups; delete the exact run lock; then best-effort
  delete the terminal journal.
  The run lock is last among transaction authorities and managed/recovery mutations, but the already-
  terminal journal may remain after lock release. Front-load all rollback-intent markers in reverse
  original-step order before the first rollback mutation and reuse the original header entry/digest.
  Crash during either marker pass is reconstructible from the complete header; no partial marker mints
  authority. Crash after an early target replacement must still show every later forward marker durable,
  and both confirmed completion and rollback must validate the full header/marker set before writing.
  A terminal committed frame with an old-fixed/new-stage pair has only one legal continuation: finish
  the bound post-commit publication and cleanup; it can never enter rollback.
- Run the focused transaction suite; verify missing behavior fails.
- Implement strict canonical journal records containing prior/candidate lock state, every path's
  prior/candidate kind plus digest-or-absence, directory intent/completed identity, backup digest,
  deterministic target and retained-preimage staging descriptors or their required null forms,
  completed step, operation ID,
  and nonce. Encode/parse the exact length/digest framing above with
  checked arithmetic, incremental bounded reads, contiguous sequences, deterministic next-frame
  reconstruction from the complete header, and file flush after each append. Enforce IC-12 limits
  before allocation or writes. Recovery reuses the original steps and planned mutations; changed or
  removed source/catalog bytes cannot alter them, contributors stay empty in `RecoveryPlan`, and the
  accepted `planDigest` remains the opaque binding for contributor/refresh details not duplicated in
  the journal.
- After complete prior-tree and explicit prior-lock verification, append/flush terminal
  `rolled-back` with those final digests before deleting any transient backup or releasing the run lock.
  Then clean unchanged rollback stages/backups, delete the exact run lock, and best-effort delete the
  terminal journal. Inject crashes before/after terminal append, every evidence deletion, run-lock
  release, and journal cleanup; every state resumes without a run-lock-without-journal window.
- Treat a no-run-lock journal ending in a valid `committed` or `rolled-back` frame as inert completed evidence, never
  an interrupted operation. Verify its accepted-plan/final-lock/final-tree digests read-only; a later
  accepted mutating command may acquire its own run lock and remove that exact unchanged terminal
  journal, while read-only commands leave it. Changed/failing verification blocks and preserves it.
- Implement handled rollback to the entire prior tree and prior absent/present lock. Delete
  newly created structural directories only when their recorded identity is unchanged and they are
  empty, in reverse depth order. Retain the shared `.ai-tooling` root even when empty; clean transaction
  children and durable-intent staging leaves only after exact current identity/digest/length, complete
  prior-tree verification, and actual lock equality with header `priorLockState`. Never consume or rename
  a transient `.bak` into a target; rollback stages verified copies, and every `.bak` remains until that
  whole prior-state gate passes. Otherwise leave the existing journal-ready run lock, journal, and backups
  unchanged and return `TransactionOutcome.kind = 'interrupted'` with its evidence path; there is no
  separate on-disk `interrupted` mark or unjournaled coordination write.
- Run the focused suite and three-OS native durability/failure fixtures. Inspect every injected
  failure state and require it to be either fully prior, fully candidate, or a documented recoverable
  journal state—never an unrecorded mutation.

### 4.4 Implement read-only recovery inspection and confirmed repair

**Files:**

- Create: `packages/ai-tooling/src/recovery/inspect.ts`
- Create: `packages/ai-tooling/src/recovery/repair.ts`
- Create: `packages/ai-tooling/src/recovery/retention.ts`
- Modify: `packages/ai-tooling/src/recovery/run-lock.ts`
- Modify: `packages/ai-tooling/src/transaction/journal.ts`
- Modify: `packages/ai-tooling/src/transaction/transaction-manager.ts`
- Modify: `packages/ai-tooling/src/transaction/mutation-plan.ts`
- Create: `packages/ai-tooling/tests/unit/recovery-inspect.spec.ts`
- Create: `packages/ai-tooling/tests/unit/recovery-repair.spec.ts`
- Create: `packages/ai-tooling/tests/integration/doctor-repair.spec.ts`
- Create: `packages/ai-tooling/tests/integration/doctor-report.spec.ts`
- Modify: `packages/ai-tooling/src/commands/doctor.ts`

**Interfaces:**

```ts
export interface RecoveryService {
  inspect(): Promise<RecoveryStatus>;
  plan(operationId: string, action: 'complete' | 'rollback'): Promise<RecoveryPlan>;
  apply(plan: ConfirmedRecoveryPlan): Promise<RecoveryOutcome>;
}

export function planReport(request: ReportRequest): Promise<MutationPlan<'report'>>;
export function applyReport(plan: ConfirmedMutationPlan<'report'>): Promise<TransactionOutcome>;
```

- Write read-only inspection tests for no state, active live run, stale `pre-journal` without
  journal, stale `pre-journal` with header/no markers, stale `journal-ready` with exact journal,
  stale `journal-ready` with a terminal committed or rolled-back journal and partially cleaned transient backups,
  no-run-lock terminal journal, `journal-ready` without journal, corrupt/mismatched journal, unknown
  phase, changed lock metadata,
  prior/candidate/missing/third path states, and prior/candidate/absent/third lock states. Treat absent or
  exact empty real `.ai-tooling` as clean structural-prerequisite states, and reject a link/reparse,
  changed root identity, or unknown content without inventing a bootstrap recovery record.
- Assert `EVK_RECOVERY_EVIDENCE_MISSING` returns structured preserve-first actions: preserve the
  entire `.ai-tooling/` tree and current bytes; restore only exact matching evidence; or reconstruct a
  known-good checkout and reapply verified human source. It must never advise deleting a lock/tree or
  forcing in-place repair.
- Run inspection tests; verify missing classification fails.
- Add failing stale-handoff classification/crash tests for an ordinary or already-recovery
  predecessor: predecessor only; predecessor plus partial non-authoritative stage; predecessor plus full
  fixed handoff; original archive plus handoff and no current lock; archive/handoff plus absent/every
  exact-byte-prefix/full successor; full successor plus its still-bound handoff; dead recovery successor
  after handoff cleanup; terminal archive plus matching recovery lock; and terminal archive alone.
  Cover wrong action/plan/generation, non-prefix successor, changed predecessor/handoff/archive,
  malformed/extra/multiple fixed handoffs, scratch-limit breach, and generation overflow. Inject crashes
  before/after every pre-handoff scratch deletion, stage byte/flush, no-overwrite handoff publish/parent flush, predecessor archive or
  retirement/parent flush, every successor byte/flush, handoff cleanup, action completion, terminal-
  archive replace, recovery-lock delete, and terminal-archive cleanup. An original ordinary archive with
  absent current run lock is recoverable only through explicit `doctor --repair`, which first uses the
  separately tested atomic archive normalization. A complete handoff with absent current run lock is
  recoverable only together with its exact bound original archive; a verified terminal archive alone is
  inert cleanup evidence; every mismatch blocks preserve-first.
- Write and run repair tests for completion/rollback from every valid interrupted step, all third
  states, live/foreign/reused/ambiguous owners, a state change after confirmation, and failed repair
  verification. Include an exact canonical-next-frame prefix at every byte boundary, journal change
  after confirmation, truncation-replace failure, and post-truncation verification failure. Crash an
  existing-retained restore with old-fixed plus absent/prefix/full new stage at every pre-commit point:
  completion retains old until its committed frame and then publishes new, while rollback removes only
  the unchanged stage and preserves old byte-for-byte. With a terminal committed frame, permit only
  finish/verify of the bound new-fixed publication and cleanup; reject rollback before any write. Crash an
  ordinary mutation, then change or remove its canonical pack/resource before repair; confirmed rollback
  must still plan every entry with `contributors: []` and restore prior bytes from the journal-bound
  backup without loading old source provenance. Any uncertainty performs zero later repair writes and
  retains evidence.
- Write clean-repository report, concurrent init/report and report/report, target-already-exists,
  and crash-before/after state-root, reports-directory, temporary-file, publish, journal-step, and
  cleanup fixtures. Run the focused report suite and require the named clean-report assertion to fail
  because `planReport`/`applyReport` do not exist yet. The expected clean plan has exactly the reports
  directory plus report file, never the shared state root.
- Implement and validate the already-frozen Phase 1 `doctor-report` version-1 state-schema branch,
  and write projection/renderer/validator tests before implementation. Require the state schema,
  `StateV1`, registry-map, and assignability-test hashes to remain unchanged; require exact top-level and nested key order, strict unknown-
  field rejection, deterministic UTF-8/LF/final-LF bytes at or below 16 MiB, sorted diagnostics/paths,
  and byte identity between stdout and an explicitly planned report file. The redacted projection may
  retain provider ID and recovery operation ID but must omit host, PID, start marker, nonce, absolute
  path, source/instruction body, matched secret, and raw formatter output; a direct provider token is
  null or the approved redacted `<redacted>/<basename>` form. One-over output blocks before report
  planning or writing.
- Add compile-time negative fixtures (`@ts-expect-error`) for passing confirmed init/sync/refresh/
  restore plans to `applyReport` and reciprocal wrong-operation calls, plus runtime strict-boundary tests
  that reject a forged operation tag before accepted-digest comparison or any write.
- Implement stale recovery only after exact dead-owner proof and confirmation. With archive-only
  generation-`1` evidence, require the exact `restore-original-archive` observation plus non-null
  `RecoveryArchiveRestoreV1`; mint `RecoveryArchiveRestoreAuthority` only from that accepted descriptor,
  then use `restoreOriginalArchiveVerified` to atomically restore the exact
  ordinary record to absent `run.lock`, then continue the same accepted plan from returned observations.
  For initial generation `1` or exactly predecessor generation plus one (maximum `1,000,000`), construct canonical successor
  recovery-run-lock bytes and a canonical `RecoveryHandoffV1` binding the accepted plan/action, complete
  predecessor record plus identity/digest/length, original archive identity/digest/length, successor
  record/digest/length, and
  publication staging path. While the predecessor run lock is still unchanged, publish the fixed
  handoff absent-or-full through `publishRecoveryHandoffVerified`; first revalidate/delete any bounded
  prior scratch set under that unchanged dead predecessor plus absent fixed handoff and flush the parent.
  Partial randomized stages remain
  non-authoritative and permit no target/predecessor write. Revalidate both, then through
  `retireRecoveryPredecessorVerified` atomically archive an ordinary predecessor at its one operation-ID
  archive or delete a recovery predecessor, flush the parent, and consume the returned exact absent-
  current/full-archive observations. Through
  `createRecoveryRunLockExclusive`, accept only absent or an unchanged exact prefix of the handoff-bound
  successor, delete/retry an exact prefix, direct-create/flush the exact full successor, and finally
  delete the handoff only after successor, handoff, and original archive all immediately revalidate and
  the parent flush verifies. A full existing handoff
  always wins over a new attempt. Its exact successor owner alone may continue while live; every other
  caller performs zero writes. After same-host proof that the embedded owner is dead, another caller may
  only restore the absent/prefix coordination record and remove the handoff, with no managed completion/
  rollback action under the dead identity; it must then obtain a new confirmation and repeat at the next
  generation before recovery work.
  Two repairers race only on no-overwrite handoff publication or exact successor creation; one wins and
  every loser performs zero managed/recovery-target writes. Abandon a matching pre-journal header only
  with no backup/mutation step; require matching operation/nonce/journal for journal-ready. After the
  chosen outcome is fully verified and no predecessor handoff remains, revalidate/delete every bounded
  observed handoff scratch leaf under the full successor and flush `stale-locks`. A cleanup race/failure
  retains the recovery run lock, returns interrupted, and resumes safely after crashes before/after each
  deletion. Only after that set is empty, mint the recorded
  `terminal-archive` authority and publish `RecoveryArchiveTerminalV1` through
  `terminalizeRecoveryArchiveVerified`, delete the exact recovery lock, then best-effort delete the
  unchanged terminal archive. Every no-lock/current-lock/handoff/archive prefix is classified from these
  exact records; no step deletes the sole evidence before a durable successor exists.
- When a journal-ready journal already ends in `committed` or `rolled-back`, the only recovery action
  is to reverify respectively its candidate or prior final-tree/final-lock digests, finish the outcome-
  specific retained-preimage publication or matching transient-evidence deletion, terminalize the
  archive, and release the recovery lock. It never changes a terminal outcome and never rolls back
  committed managed bytes or re-completes a rolled-back operation. A missing journal
  while an original/recovery run lock exists remains evidence-missing because successful cleanup deletes
  the current run lock before a terminal journal/archive.
- Implement IC-13 `doctor --repair --operation <uuid> --action <complete|rollback>
  --accept-plan <digest>`; ordinary
  `doctor`, `doctor --report`, and every dry run stay read-only. An explicit
  `doctor --report-path .ai-tooling/reports/<portable-name>.json --dry-run --json` calls `planReport`;
  no other report path is accepted. On an otherwise clean repository, the plan contains only the exact
  `.ai-tooling/reports` directory candidate plus one atomic no-overwrite report-file candidate: two
  entries, `creates: 1`, `directoryCreates: 1`, and zero replaces/deletes. The `.ai-tooling` root is
  part of the exact four-directory infrastructure prerequisite chain created only after plan acceptance,
  before the run lock/journal; none of those four directories is a mutation-plan entry. If the reports parent already exists in the strict benign state, omit its one
  directory entry. Report bytes are a deterministic redacted function of the bracketed observations—no
  clock, UUID, nonce, or absolute path enters them—so a separate apply can recompute the same digest.
- When an accepted recovery plan identifies the one permitted incomplete canonical final frame,
  include the exact observed journal identity/digest/length and verified complete-prefix digest in that
  plan plus its deterministic staging path. Bind that complete `JournalPrefixRepairV1` into the direct-
  created recovery run lock, mint only its `RecoveryRewriteAuthority`, and atomically replace the exact
  unchanged journal with its complete-frame prefix through `replaceJournalPrefixVerified`. Consume and
  verify the returned observation before resuming completion or rollback. A race, replacement/flush failure, or wrong
  post-state leaves the original/replacement evidence in place and performs no target mutation; never
  append after a physical partial prefix.
- Require interactive acceptance of the shown report plan or exact noninteractive `--accept-plan
  <digest>`, then call `applyReport` through the shared state-root/run-lock/journal transaction with
  operation `report`. Publish the report with contained atomic `createExclusive`, return
  `TransactionOutcome`, and record no managed ownership. A committed report retains the report plus
  its required same-identity `.ai-tooling`, `transactions`, `backups`, `stale-locks`, and `reports`
  parents and leaves no run lock, nonterminal journal, transient backup, or temporary evidence. Normal
  eager cleanup leaves no operation journal; a crash or best-effort cleanup failure may leave only its
  bounded, revalidated terminal journal as inert evidence.
- After the infrastructure prerequisite creates or confirms the four fixed directories, discard the pre-create
  descendant reference, bind the report-directory/report-leaf resolution to the exact returned root
  identity, and revalidate it before journal creation and before each later write. Before a clean-
  repository report apply creates the state root, reports directory, or report file, run and
  immediately re-run the shared `LocalStatePrerequisiteVerifier`; an ignore/unignore provenance failure
  produces zero state-root, directory, report, or recovery bytes. A crash exposes either no report, the
  exact complete report, or matching ordinary run-lock/journal recovery evidence—never partial target
  bytes. Failed recovery retains evidence; handled rollback removes only same-identity empty child
  directories it created. Apply IC-12 retention exactly.
- Define a strict benign local-state census: `.ai-tooling` is a real contained directory and may be
  empty or contain any exact real empty-prefix subset of the shared `transactions`, `backups`, and
  `stale-locks` roots; a complete benign state has all three, with `backups` optionally containing only
  IC-12-validated retained preimage frames and `stale-locks` optionally containing only strictly valid
  terminal recovery archives whose final state revalidates. An original archived run lock is recoverable,
  not benign. A full fixed recovery handoff, or its bounded reserved scratch leaves alongside the exact
  predecessor/handoff state, is likewise recoverable and never benign; every other handoff-shaped leaf
  is blocking. Every other IC-12 staging leaf is active/recoverable only with its exact run-lock/journal/
  accepted-repair authority and exact absent/full/prefix crash state; it is never benign, and any
  unknown/lookalike/unbound/colliding/link state blocks. It may additionally contain a real `reports` directory whose
  children are bounded regular `<portable-name>.json` files that strict-validate as this tooling
  version's redacted reports. With no run lock, `transactions` may also contain only bounded journals
  ending in a valid `committed` or `rolled-back` frame whose final state revalidates exactly; these are benign completed
  cleanup remnants. The next accepted mutation first direct-creates its own run lock/header and advances
  to its own durable `journal-ready` authority; only then, and before any target mutation, may it remove
  the exact independently validated terminal journals/archives for different operation IDs under that
  new lock. Strict inspection therefore permits those terminal remnants alongside the one active or
  recovery operation, but never treats them as part of its journal. Revalidate each exact observation
  immediately before one-file deletion; a changed remnant blocks target mutation and is preserved.
  A crash before/after any deletion resumes the active operation while ignoring or retrying cleanup of
  the still-independent terminal set. Bound each terminal-evidence set and their combined total at
  1,000 files, 64 MiB each, and 512 MiB aggregate; read-only commands never delete them. Add zero/one/
  1,000/1,001 and 512 MiB boundary fixtures plus repeated crash-after-run-lock-release accumulation and
  crash before/after every remnant deletion, coexistence with pre-journal/journal-ready/recovery state,
  and an evidence file changed between plan, new-lock acquisition, and cleanup. No active/nonterminal
  journal, transient backup, marker, temporary, link/reparse, or unknown entry may exist. This state is benign for later `init`; all other pre-init
  local state remains blocking. Exercise every empty-prefix crash state plus both concurrent report/init
  completion orders, and require the subsequent init to preserve every valid report and retained
  preimage byte-for-byte.
- Re-run integration tests with before/after checkout and `.ai-tooling` byte inventories.

### 4.5 Implement clean `init` through the transaction manager

**Files:**

- Create: `packages/ai-tooling/src/commands/init.ts`
- Modify: `packages/ai-tooling/src/transaction/mutation-plan.ts`
- Create: `packages/ai-tooling/tests/integration/init.spec.ts`
- Create: `packages/ai-tooling/tests/fixtures/init/vectors.json`
- Modify: `packages/ai-tooling/src/cli.ts`

**Interfaces:** `planInit(request: InitRequest): Promise<MutationPlan<'init'>>` and
`applyInit(plan: ConfirmedMutationPlan<'init'>): Promise<TransactionOutcome>`.

- Write a clean-project test for `init --pack configs/ai --platform codex --platform
  claude-code`. The proposed transaction creates initial human-owned config, repository lock,
  exactly five managed leaves, and exactly seven absent structural directories: `.agents`,
  `.agents/skills`, `.agents/skills/evk-plan`, `.claude`, `.claude/rules`, `.claude/skills`, and
  `.claude/skills/evk-plan`. The dry-run therefore has seven file creates plus seven directory creates;
  only lock/leaves receive ownership records.
- Write zero-write preflight tests for failed ignore/unignore prerequisite, any unmanaged intended
  leaf, either discovery shadow, partial/recovery `.ai-tooling` evidence, invalid report-only state,
  preview, hook/plugin/
  executable capability, unsupported platform, untracked/aliased pack, and target collision.
- Add a race fixture that creates a target or shadow after `journal-ready` but before managed
  mutation. Require no config/lock/output change, successful handled rollback, verified removal of
  transient run-lock/journal/backups, and a blocking collision diagnostic.
- Add structural-directory races before each shallow-first create and reverse-depth rollback,
  including an external file added to a transaction-created directory. Require exact candidate/prior
  classification; never remove a pre-existing, changed-identity, or nonempty directory.
- Add dry-run and confirmation tests. Dry-run prints full config/lock/output diff and plan digest
  but creates no `.ai-tooling`; interactive confirmation is tied to the digest; noninteractive apply
  requires exact `--accept-plan` and revalidates it. Two unchanged dry runs must have
  `operationId: null` and byte-identical plan/digest output; accepted apply then creates one fresh
  transaction UUID without changing the reviewed entries.
- Run the focused suite; verify init remains unavailable.
- Reuse the shared local-state prerequisite verifier before any local state, then build the full
  pure candidate, shown diff, IC-13 plan,
  then repeat config/target/shadow/ownership/source validation inside the transaction after
  `journal-ready`. The initial config participates in rollback but remains human-owned and is never
  entered in managed-path ownership.
- Re-run init fixtures with injected failures at every transaction step and assert no adoption,
  merge, hook, plugin, remote, cache, or user-global action occurs.

### 4.6 Implement `sync`, canonical-lock repair, and explicit local refresh

**Files:**

- Create: `packages/ai-tooling/src/commands/sync.ts`
- Create: `packages/ai-tooling/src/commands/refresh-local.ts`
- Create: `packages/ai-tooling/tests/integration/sync.spec.ts`
- Create: `packages/ai-tooling/tests/integration/refresh-local.spec.ts`
- Create: `packages/ai-tooling/tests/fixtures/sync/vectors.json`
- Modify: `packages/ai-tooling/src/cli.ts`

**Interfaces:**

```ts
export function planSync(request: SyncRequest): Promise<MutationPlan<'sync'>>;
export function applySync(plan: ConfirmedMutationPlan<'sync'>): Promise<TransactionOutcome>;
export function planRefreshLocal(request: RefreshLocalRequest): Promise<MutationPlan<'refresh-local'>>;
export function applyRefreshLocal(plan: ConfirmedMutationPlan<'refresh-local'>): Promise<TransactionOutcome>;
```

All mutation flows use `TransactionManager` and IC-13 confirmation.

- Write sync tests for unchanged byte identity, formatting-only config change, every semantic
  non-selection change, pack add/remove/source/range/revision/integrity/resolution change, changed local
  pack digest, missing/modified/stale/orphan/conflicting/shadowed output, and an unmanaged new target.
  Assert correct distinction between `EVK_CONFIG_REQUIRES_UPDATE`,
  `EVK_CONFIG_CAPABILITY_UNAVAILABLE`, and output/source diagnostics.
- Write strict-valid noncanonical-lock tests: permit only a lock-only candidate after config,
  frozen selection/source, pack integrity, ownership, every output digest, and recovery state agree;
  reject invalid JSON/schema, semantic mismatch, changed output/input, or interrupted state.
- Write local-refresh tests for selected tracked local pack only, complete resource/digest diff,
  exact pack/digest acceptance, lock-only update through a transaction, and stale outputs until later
  sync. Require the typed plan, digest projection, and rendered JSON to carry the same non-null
  `LocalRefreshMetadataV1`; every other operation carries null. Reject npm/git, alias/untracked/outside,
  wrong pack name, changed old/new digest, a cross-operation refresh object, and changed plan. Include
  a refresh that removes a resource, then require the following sync to plan the old managed-leaf delete
  with `contributors: []` rather than requiring unavailable prior pack bytes or provenance.
- Run focused suites; verify commands are absent.
- Implement sync without blessing configuration or selection drift. Update only rendered output
  bytes/ownership records, or the narrow canonical lock-only state. Keep a second unchanged sync
  byte-identical.
- Implement explicit refresh as the only path that updates a locked local pack digest. It never
  writes generated output in the same operation.
- Re-run all suites with dry-run, noninteractive acceptance, failure injection, and zero-write
  assertions.

### 4.7 Implement compare-and-swap `restore-generated`

**Files:**

- Create: `packages/ai-tooling/src/recovery/restore-generated.ts`
- Create: `packages/ai-tooling/src/commands/restore-generated.ts`
- Create: `packages/ai-tooling/tests/unit/restore-generated.spec.ts`
- Create: `packages/ai-tooling/tests/integration/restore-generated.spec.ts`
- Modify: `packages/ai-tooling/src/cli.ts`

**Interfaces:**

```ts
export interface RestoreGeneratedService {
  plan(context: ReadOnlyProjectContext, path: PortableRelativePath): Promise<RestorePlan>;
  apply(plan: ConfirmedRestorePlan): Promise<TransactionOutcome>;
}
```

- Write tests for registered modified/missing leaf, unregistered/config/lock path, active or
  interrupted journal, invalid locked input, exact expected rerender, verified current-byte preimage,
  change after confirmation, backup mismatch, and newest-preimage retention. Add a compile-time
  rejection of a directory/link `RestorePreimageState` and a runtime forged directory/link preimage
  that fails before confirmation/digest comparison or any write.
- Freeze the retained-preimage format as one bounded `EVKP` version-1 frame whose canonical JSON
  header binds path/key, source operation, raw-byte length, and SHA-256. Inject a crash at every staging,
  publish, parent-flush, prior-frame cleanup, and transaction-cleanup boundary. Require either the full
  old fixed frame plus absent/prefix/full journal-bound new stage before commit, or the full new fixed
  frame after commit. The old fixed frame must survive byte-for-byte through every pre-commit crash and
  handled rollback. Confirmed pre-commit rollback may revalidate/remove only the unchanged new stage;
  terminal committed recovery may only finish/verify publication. Any non-prefix, hybrid, changed
  frame/temp, old-fixed loss before commit, or unbound leaf preserves all evidence and blocks.
- Run focused tests; verify command is absent.
- Implement one-path plan with observed digest-or-absence, expected digest, diff, preimage digest,
  and IC-13 confirmation. Immediately before backup and replace, compare-and-swap the complete
  observation and revalidate all identities.
- Preserve a verified exact preimage when current bytes exist; atomically install expected bytes
  only through the transaction manager. Journal the complete `RetainedPreimageRotationV1`, obtain its
  branded authority, and stage it only through `stageRetainedPreimageVerified` before changing the
  managed leaf. Keep any preceding fixed preimage untouched until the managed candidate, final tree,
  and `committed` frame verify; only then publish through
  `commitRetainedPreimageRotationVerified`. Reject every concurrent or uncertain state preserve-first.
- Re-run focused and transaction-failure fixtures.

### 4.8 Complete recovery documentation and native workflow coverage

**Files:**

- Create: `docs/ai-tooling/USER-GUIDE.md`
- Modify: `docs/ai-tooling/SECURITY.md`
- Modify: `docs/system-overview/ai-tooling.md`
- Modify: `.github/workflows/ai-tooling.yml`
- Modify: `packages/ai-tooling/tests/integration/biome-exclusions.spec.ts`

- Extend the workflow-contract fixture with a named failing assertion that all exact Phase 4
  native suites run in temporary roots and no real-checkout mutation command is present. Run the
  focused Task 4.8 command for behavioral RED before editing the workflow.
- Document exact clean init, dry-run/plan acceptance, sync drift behavior, explicit local refresh,
  modified-output preservation, compare-and-swap restore, read-only doctor, confirmed repair,
  evidence-missing actions, retention, the IC-12 repository-ACL confidentiality boundary, and absence
  of force/adoption/hook behavior.
- Document native liveness choices and the distinction between dead, reused, foreign, live, and
  ambiguous ownership without exposing raw host/process details in default diagnostics.
- Add Phase 4 native containment, mutation, liveness, durability, rollback, recovery, and restore
  suites to the existing three-OS workflow. Keep real repository jobs read-only and all mutation
  inside temporary roots.
- Rerun the workflow-contract test for GREEN, run
  `node packages/ai-tooling/dist/cli.js docs check-links`, and verify durable docs have no reverse link
  to the plan/spec. The post-candidate exact-SHA three-OS run in §0.3 is the native execution proof.

### 4.9 Phase 4 gate and commit

- Run:

```text
pnpm --filter @evk-soft/ai-tooling run typecheck
pnpm --filter @evk-soft/ai-tooling run test:unit
pnpm --filter @evk-soft/ai-tooling run test:integration
pnpm --filter @evk-soft/ai-tooling run test:native
pnpm --filter @evk-soft/ai-tooling run build
pnpm --filter @evk-soft/ai-tooling run pack:check
node packages/ai-tooling/scripts/check-stage1-artifacts.mjs --phase 4 --tree
pnpm check
git diff --check
```

- Before staging, require every current-OS native fixture to pass. After the candidate commit,
  follow §0.3 and require the exact-SHA Windows/Linux/macOS workflow to pass every approved Phase 4
  containment, ancestor-swap, lock-state, run-lock, missing-journal, rollback, repair, retention, and
  restore-race fixture.
- Run a command-surface test asserting every mutator supports `--dry-run`, noninteractive writes
  require exact acceptance, and `--force`, adoption, import, hook, plugin, update, remove, preview,
  remote, and cache commands remain unavailable.
- Verify the real worktree gained no config, lock, output, report, or `.ai-tooling` path.
- Stage only the exact Phase 4 manifest paths and verify exact status/path/mode equality.
- Commit with `git commit --no-verify -m "feat(ai): add safe mutation and recovery"`.
- Re-run the complete local gate against committed `HEAD`; after the §0.3 exact-SHA workflow is
  green, report the final SHA/native evidence and stop for owner approval of Phase 5.

## Phase 5 normative contract — self-hosting, durable docs, and hardening

**Phase owner gate:** Start only after the owner approves the exact Phase 4 commit.

**Phase allowlist:** `ai-tooling.config.json`, `ai-tooling.lock.json`, `AGENTS.md`, `CLAUDE.md`,
`.agents/skills/evk-plan/**`, `.claude/rules/evk-grounding.md`,
`.claude/skills/evk-plan/**`, `ai/overrides/rules/evk-grounding/**`,
`.github/workflows/ai-tooling.yml`, `configs/ai/**`, `packages/ai-tooling/**`,
`docs/ai-tooling/**`, `docs/system-overview/ai-tooling.md`, and `README.md`. The allowlist explicitly
excludes `.gitignore`, `biome.json`, `configs/biome-config/**`, `.husky/**`, `.idea/**`, and every
unregistered generated path.

### 5.1 Make artifact scanning fail closed before real self-hosting

**Files:**

- Modify: `packages/ai-tooling/scripts/check-stage1-artifacts.mjs`
- Modify: `packages/ai-tooling/tests/security/artifact-scan.spec.ts`
- Modify: `packages/ai-tooling/tests/fixtures/artifact-scan/vectors.json`
- Modify: `packages/ai-tooling/src/git/provider.ts`
- Modify: `packages/ai-tooling/tests/unit/git-provider.spec.ts`
- Modify: `packages/ai-tooling/tests/fixtures/fake-git/provider.mjs`
- Create: `packages/ai-tooling/tests/fixtures/stage1-coverage.json`
- Modify: `packages/ai-tooling/scripts/check-package-contents.mjs`
- Modify: `packages/ai-tooling/package.json`

**Interfaces:**

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
export interface ArtifactScanBudgetFactory {
  create(now: () => bigint): ArtifactScanBudget;
}

export type GitArtifactReadRequest =
  | {
      readonly mode: 'resolve-commit';
      readonly commitish: GitCommitish;
      readonly stdoutSink: AsyncByteSink;
      readonly budget: ArtifactScanBudget;
    }
  | {
      readonly mode: 'list-tree';
      readonly commit: GitObjectId;
      readonly stdoutSink: AsyncByteSink;
      readonly budget: ArtifactScanBudget;
    };

export interface GitObjectBatchRequest {
  readonly mode: 'check' | 'contents';
  readonly objectIds: AsyncIterable<GitObjectId>;
  readonly stdoutSink: AsyncByteSink;
  readonly budget: ArtifactScanBudget;
}

// Phase 5 extends the already-frozen Phase 2 provider with this closed scan transport only.
export interface FrozenGitProvider {
  runArtifactReadOnly(request: GitArtifactReadRequest): Promise<GitCommandResult>;
  runObjectBatchReadOnly(request: GitObjectBatchRequest): Promise<GitCommandResult>;
}

export function scanArtifactManifest(
  manifest: readonly ArtifactManifestEntry[],
  policy: ArtifactScanPolicy,
  budget: ArtifactScanBudget,
): Promise<ArtifactScanResult>;
```

This is script-only, not a new public CLI command.

- Write clean/hostile fixtures using only synthetic credentials, token-like values, organization/
  project names, and prototype markers, plus absolute Windows/POSIX/user paths and undeclared tar entries,
  unexpected executable/script assets, missing license notice, schema byte mismatch, generated output
  outside lock registry, and dependency license conflicts.
- Extend the artifact scan to reject the unique printable Phase 1 bootstrap message body, excluding
  its terminal LF, from source, compiled CLI bytes, and package tarballs. This body is a contiguous
  substring regardless of whether JavaScript source represents the runtime LF as an escape or template
  line break. The production policy and adversarial test assemble that body at runtime from separated
  numeric byte fragments; the test uses a private temporary root. No Phase 5-scanned production source,
  test, fixture, plan, or durable document contains the contiguous body, so the scanner cannot whitelist
  its own evidence. Separately retain the Phase 1 CLI byte test proving the bootstrap runtime response
  ended in exactly one LF. Prove all three final Phase 5 inputs are free of the body before the phase gate.
- Extend the provider/fake-provider tests first for fixed resolve-commit/list-tree calls plus one
  fixed `cat-file --batch-check` and one fixed `cat-file --batch` session. The API accepts only the
  branded validated commit-ish/full `GitObjectId` values and
  serializes each as ASCII plus LF itself; callers cannot supply stdin bytes, an option-looking token,
  an alternate subcommand, or a format string. Require streaming stdout, backpressure, bounded stderr,
  at most one fixed-size queued stdout chunk with every async sink write awaited, one shared opaque
  scan budget/no-progress/absolute whole-scan deadline, explicit stdin close, termination/reap, and
  frozen provider/anchor identity before and after each session. Advance a fake monotonic clock across
  ref resolution and tree listing so the first batch call exhausts the same 300-second deadline rather
  than receiving a reset timeout. Reuse the exact IC-6 config/include/filter/info-file/alternate
  preflight before every artifact command and bracket it across both batch sessions; hostile config,
  filter-marker, external include, info-file swap, or alternate state must fail before ref/object input
  or any helper/content process.
- Reuse the Phase 2 missing-promisor-object/remote-helper marker fixture for resolve, tree, check,
  and contents modes. Require Git `>=2.45.0` before any spawn, global `--no-lazy-fetch` plus
  `GIT_NO_LAZY_FETCH=1`, a local blocking
  result, zero helper/network process, and no new object/cache/ref/index/worktree byte.
- Add `--repository <commit-ish>` tests for invalid refs, active `refs/replace/<object>` poisoning,
  merge commits, non-commit objects, links/submodules/executable modes, duplicate/malformed NUL entries,
  fatal-invalid UTF-8, absolute/dot/parent/Win32-invalid paths, portable case/NFC collisions, missing
  blobs, and bounded full-tree success. Every path returned by `ls-tree -rz` must fatal-decode and pass
  `validatePortableRelativePath` plus complete portable-key uniqueness before the first contents-batch
  request; all hostile path fixtures prove that request remains untouched. Prove a synthetic replace ref that changes the apparent
  commit/tree under ambient Git cannot change scanner findings or the scanned-content digest. Add exact-
  at-limit and one-over fixtures for entries, raw tree bytes, individual blob bytes, and aggregate bytes,
  plus stalled/truncated/extra `cat-file` protocol and whole-scan deadline fixtures. Require the ref to
  be 1-4,096 UTF-8 bytes with no NUL/control character, then resolve it once through the IC-6 frozen
  provider—whose global argv starts with `--no-replace-objects --literal-pathspecs`—using
  `rev-parse --verify --end-of-options <commit-ish>^{commit}`; require one lowercase full commit SHA and
  use only that SHA afterward. List with provider payload
  `ls-tree -rz --full-tree --end-of-options <sha>`; never read worktree bytes or any plan manifest in
  this mode.
- Run the focused security suite against the Phase 4 scanner and require the first new hostile
  fixture's named assertion to fail because that finding class is not yet implemented; the existing
  scanner itself must load successfully. The focused provider assertion must also fail because the
  closed batch-session method is not implemented yet.
- Implement the fixed `ArtifactScanLimits` above. Bound the raw tree response before parsing, then
  use one bounded `git cat-file --batch-check` session to validate every ASCII object ID, type, and size
  before content, followed by one bounded `git cat-file --batch` session. Stream each accepted blob in
  chunks through incremental hash and cross-chunk scanners; never retain all blob contents or spawn one
  process per entry. Both batch sessions inherit the same global `--no-replace-objects` and isolated
  environment as ref resolution and tree listing; no command may consult replacement objects. Enforce
  the 64 KiB stderr tail, 30-second no-progress deadline, and one monotonic 300-second deadline across
  ref resolution, tree read, both batch sessions, hashing, and policy scan. On any overrun, malformed
  response, expected-digest/length mismatch, or deadline, terminate/reap the provider tree and return
  only a stable finding/diagnostic class. Repository entries set `expectedDigest: null`: compute each
  SHA-256 during that single content pass, then compute `contentDigest` from the ordered closed
  path/mode/byte-length/computed-digest projection. Package/tar callers may provide an independently
  known expected SHA-256, which the same pass verifies; no mode pre-reads a blob to manufacture it.
- Construct one `ArtifactScanBudget` at repository-scan entry from the fixed
  `ArtifactScanLimits`, then pass that exact branded object through `runArtifactReadOnly` for ref/tree,
  `runObjectBatchReadOnly` for both batches, and `scanArtifactManifest` for hashing/policy work. The two
  provider methods own the absolute executable, global flags, anchors, isolated environment, fixed argv/
  format, validated request serialization, pipe lifecycle, deadline, and reap semantics. The scanner
  never imports `node:child_process`, opens Git directly, constructs a second budget, or duplicates
  provider trust logic.
- Scan explicit bounded path/content manifests, not an unrestricted home/workspace walk. Denylists
  live in test policy data and diagnostics reveal only artifact-relative paths and finding classes,
  not matched secret bytes.
- Add a durable coverage manifest mapping every shipped Stage 1 capability to at least one
  production module, focused test/native fixture, and durable documentation section. It names
  capabilities, not temporary spec/plan paths.
- Build both packages into temporary directories; on Windows include and hash the Win32 helper.
  Inspect exact tar entry lists, schema bytes, package exports, licenses, and native binary metadata.
  Run `pnpm --filter @evk-soft/ai-tooling run build:native` followed by
  `node packages/ai-tooling/scripts/check-package-contents.mjs --publishable --json` on the Windows
  x64 candidate and require its exact entry/digest result. A successful scan must not expose a
  publish command or imply publication approval.

### 5.2 Prove the full lifecycle in a temporary self-host fixture

**Files:**

- Create: `packages/ai-tooling/tests/integration/self-hosting.spec.ts`
- Create: `packages/ai-tooling/tests/fixtures/self-host/expected-manifest.json`

- Treat this as cross-feature contract validation: write the complete fixture, then run its exact
  focused command and expect immediate GREEN from the approved Phase 4 implementation. If it fails,
  stop and amend this plan/Phase 5 manifest with a smaller named regression test and exact production
  path before changing behavior; do not call the integration failure a TDD RED.
- Create a temporary Git repository and temporary home with the one Phase 1 `/.ai-tooling/` ignore
  rule plus the explicit unignored repository-lock probe, Phase 3
  Biome exclusions, tracked `configs/ai`, a reviewed `ai-tooling.config.json`, and one committed
  `extend` override targeting `evk-soft/rules/grounding` and pinned to that current base digest. Start
  with no lock, output, shadow, or `.ai-tooling` state.
- Run init dry-run; assert six file creates, the exact seven structural-directory creates, complete
  diff, and no written bytes. Apply the accepted plan; assert exact lock and five leaves, ownership/
  provenance, no absolute/private/global state, and cleaned transient run-lock/transaction evidence.
- Run unchanged sync twice and require empty diff plus byte-identical lock/output. Run all read-
  only commands and the exact Biome Node-entry formatter check; require unchanged registered bytes
  and source census.
- Edit the canonical `evk-soft/skills/plan` instructions in the temporary pack without changing the
  grounding resource bound by the override, require stale source/output;
  run refresh dry-run and accepted refresh, require only the local pack digest/lock to change; then
  run accepted sync and require final empty diff.
- Repeat with injected handled rollback, interrupted completion, interrupted rollback, modified
  generated output, compare-and-swap restore, and evidence-missing states. Assert the approved
  recovery behavior and no user-global path access.
- Run `pnpm --filter @evk-soft/ai-tooling exec vitest run
  tests/integration/self-hosting.spec.ts`; require green on all three native workflow systems.

### 5.3 Add the reviewed devkit source configuration and override

**Files:**

- Create: `ai-tooling.config.json`
- Create: `ai/overrides/rules/evk-grounding/override.json`
- Create: `ai/overrides/rules/evk-grounding/instructions.md`

- Verify `configs/ai/README.md` already contains the final publisher purpose, edit rules, and
  generated-output warning from Phase 1. If verification finds a required correction, stop and obtain
  an owner-reviewed amendment that adds the path to the Phase 5 Files list and manifest. Do not edit it
  under the current authority or change a locked local-pack tree after the final refresh/sync sequence.
- Write the exact Stage 1 config: schema version 1, one local `configs/ai` pack, literal integrity
  defaults, managed output, ordered `codex` then `claude-code`, one override path,
  `ai/overrides/rules/evk-grounding`, disabled hooks, and default plugin profile with no
  recommendations. Strict-validate and print both semantic digests before any init.
- Write an `extend` override targeting the stable resource ID `evk-soft/rules/grounding` (whose
  display name remains `evk-grounding`), pinned to the current base resource digest,
  with the single devkit-specific instruction: `Keep repository documentation, code, generated
  artifacts, and commit messages in English.`
- Run `pack validate`, config validation, override resolution, capability checks, and artifact
  scan. Review the complete effective grounding/plan text before generation.

### 5.4 Perform clean devkit initialization through the workspace CLI

**Files generated by the command:**

- Create: `ai-tooling.lock.json`
- Create: `AGENTS.md`
- Create: `CLAUDE.md`
- Create: `.agents/skills/evk-plan/SKILL.md`
- Create: `.claude/rules/evk-grounding.md`
- Create: `.claude/skills/evk-plan/SKILL.md`

- Freeze `git status --porcelain=v2 -z --ignore-submodules=all`, the complete Git-visible census, and SHA-256 of
  `.gitignore`, `biome.json`, public Biome presets, `.husky/pre-commit`, config, override, and canonical
  pack files.
- In PowerShell, run this exact closed-shape capture and then review every entry, unified diff, and
  contributor before continuing:

```powershell
$initJson = (& node packages/ai-tooling/dist/cli.js init --config ai-tooling.config.json --dry-run --json) -join "`n"
if ($LASTEXITCODE -ne 0) { throw 'init dry-run failed' }
$initPlan = $initJson | ConvertFrom-Json -Depth 128
if ($initPlan.schemaVersion -ne 1 -or $initPlan.kind -ne 'mutation-plan' -or $initPlan.operation -ne 'init' -or $null -ne $initPlan.operationId) { throw 'unexpected init plan shape' }
if ($initPlan.planDigest -notmatch '^[0-9a-f]{64}$') { throw 'unexpected init plan digest' }
if ($initPlan.entries.Count -ne 13 -or $initPlan.summary.creates -ne 6 -or $initPlan.summary.replaces -ne 0 -or $initPlan.summary.deletes -ne 0 -or $initPlan.summary.directoryCreates -ne 7) { throw 'unexpected init plan summary' }
$expectedDirectories = @('.agents', '.agents/skills', '.agents/skills/evk-plan', '.claude', '.claude/rules', '.claude/skills', '.claude/skills/evk-plan')
$actualDirectories = @($initPlan.entries | Where-Object { $_.action -eq 'create-directory' } | ForEach-Object { $_.path })
if (($actualDirectories -join "`n") -ne ($expectedDirectories -join "`n")) { throw 'unexpected structural directories' }
& node packages/ai-tooling/dist/cli.js init --config ai-tooling.config.json --accept-plan $initPlan.planDigest
if ($LASTEXITCODE -ne 0) { throw 'accepted init failed' }
```

  The six file entries are the repository lock plus five generated leaves; the other seven entries are
  the exact structural directories shown above. Do not hand-edit any generated file.
- Verify exactly the tracked repository lock and five registered leaves were created. Separately
  verify the ignored real `.ai-tooling`, `transactions`, `backups`, and `stale-locks` infrastructure
  directories with empty child roots, no run lock/operation journal/transient backup/temp evidence, and
  unchanged config/override/repository-config hashes.
- Run unchanged `sync --config ai-tooling.config.json --dry-run --json`; require a valid plan with
  zero entries and all-zero file and directory summary. Then run `sync --config ai-tooling.config.json`, `check --ci`,
  `diff`, `doctor`, `docs check-links`, and `pack validate`. A zero-entry sync is read-only and requires
  no acceptance. Require empty diff and byte-identical registered artifacts.

### 5.5 Exercise canonical edit → refresh-local → sync in devkit

**Files:**

- Modify: `configs/ai/skills/evk-plan/instructions.md`
- Modify by commands only: `ai-tooling.lock.json`
- Modify by commands only: `.agents/skills/evk-plan/SKILL.md`
- Modify by commands only: `.claude/skills/evk-plan/SKILL.md`

- Make one clean, reviewed canonical public-content edit by adding:
  `When reporting completion, distinguish checks that ran from behavior that remains unverified.`
  Re-run independent public-content/provenance review.
- Run `check`; require the locked local pack/output to be stale. Run `sync --dry-run`; require it
  to refuse to bless the changed source.
- Capture and apply refresh with these exact PowerShell commands after reviewing its one lock entry
  and complete resource diff:

```powershell
$refreshJson = (& node packages/ai-tooling/dist/cli.js pack refresh-local '@evk-soft/ai-pack-core' --config ai-tooling.config.json --dry-run --json) -join "`n"
if ($LASTEXITCODE -ne 0) { throw 'refresh dry-run failed' }
$refreshPlan = $refreshJson | ConvertFrom-Json -Depth 128
if ($refreshPlan.schemaVersion -ne 1 -or $refreshPlan.kind -ne 'mutation-plan' -or $refreshPlan.operation -ne 'refresh-local' -or $null -ne $refreshPlan.operationId) { throw 'unexpected refresh plan shape' }
if ($refreshPlan.planDigest -notmatch '^[0-9a-f]{64}$' -or $refreshPlan.refresh.pack -ne '@evk-soft/ai-pack-core' -or $refreshPlan.refresh.newPackDigest -notmatch '^[0-9a-f]{64}$') { throw 'unexpected refresh identity' }
& node packages/ai-tooling/dist/cli.js pack refresh-local '@evk-soft/ai-pack-core' --config ai-tooling.config.json --new-digest $refreshPlan.refresh.newPackDigest --accept-plan $refreshPlan.planDigest
if ($LASTEXITCODE -ne 0) { throw 'accepted refresh failed' }
```

  Verify only the lock's frozen local digest/provenance changes and outputs remain stale.
- Capture and apply sync with these exact PowerShell commands after reviewing the two plan-skill
  leaves plus lock ownership diff:

```powershell
$syncJson = (& node packages/ai-tooling/dist/cli.js sync --config ai-tooling.config.json --dry-run --json) -join "`n"
if ($LASTEXITCODE -ne 0) { throw 'sync dry-run failed' }
$syncPlan = $syncJson | ConvertFrom-Json -Depth 128
if ($syncPlan.schemaVersion -ne 1 -or $syncPlan.kind -ne 'mutation-plan' -or $syncPlan.operation -ne 'sync' -or $null -ne $syncPlan.operationId) { throw 'unexpected sync plan shape' }
if ($syncPlan.planDigest -notmatch '^[0-9a-f]{64}$' -or $syncPlan.entries.Count -ne 3) { throw 'unexpected sync plan identity' }
& node packages/ai-tooling/dist/cli.js sync --config ai-tooling.config.json --accept-plan $syncPlan.planDigest
if ($LASTEXITCODE -ne 0) { throw 'accepted sync failed' }
& node packages/ai-tooling/dist/cli.js sync --config ai-tooling.config.json --dry-run --json
if ($LASTEXITCODE -ne 0) { throw 'second sync dry-run failed' }
```

  Strict-parse the final JSON and require zero entries/all-zero summary plus byte-identical outputs.
- Re-run pack/content/artifact scans and verify config/override plus repository-config hashes are
  unchanged.

### 5.6 Run the exact formatter audit and finalize check-only native CI

**Files:**

- Modify: `.github/workflows/ai-tooling.yml`

- Run exactly:

```text
node packages/ai-tooling/dist/cli.js doctor --formatter-check --node-entry @biomejs/biome/bin/biome -- check --write .
```

  Require Node-entry trust proof, exact argv, fixed environment, 300-second bound, tree quiescence,
  zero affected registered paths, and identical pre/post real checkout census. Inspect machine output
  for complete fields and no raw bytes/absolute paths.
- Update the three-OS workflow's real-checkout steps to exactly:

```text
node packages/ai-tooling/dist/cli.js check --ci
node packages/ai-tooling/dist/cli.js docs check-links
node packages/ai-tooling/dist/cli.js pack validate
node packages/ai-tooling/dist/cli.js doctor --formatter-check --node-entry @biomejs/biome/bin/biome -- check --write .
pnpm --filter @evk-soft/ai-tooling run typecheck
pnpm --filter @evk-soft/ai-tooling run test
pnpm --filter @evk-soft/ai-tooling run build
pnpm check
```

- Keep workflow permissions read-only, action SHA pins, exact native runner matrix, temporary
  homes, and the exact portable install-step YAML `env: { HUSKY: '0' }` plus
  `run: pnpm install --frozen-lockfile --ignore-scripts`. Retain the baseline taken
  before installation and require after-install plus final `git status --porcelain=v2 -z --ignore-submodules=all` equality so a green job is
  explicitly check-only. Extend the workflow-contract test to require that the only `uses:` entries
  remain the two exact Phase 3 `checkout`/`setup-node` SHA pins and that no artifact-upload or other
  action is introduced; it also rejects inline environment assignment or any install-step YAML drift.
- Require green Windows/Linux/macOS workflow evidence. Windows additionally creates the canonical
  audited tooling tarball containing the helper in runner-temporary storage, runs the publishable
  package/content scan, and emits only its filename, byte length, and SHA-256 as job evidence. The job
  neither uploads nor publishes the tarball; runner teardown removes it.

### 5.7 Complete all durable documentation

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

- Extend the coverage manifest/test first with the exact final headings required for every shipped
  capability and package boundary. Run the Task 5.7 focused command and require the named missing-
  anchor assertion to fail before editing durable docs.
- Document package purposes, install/build status without claiming publication, exact exports,
  runtime floor, CLI surface, tracked-local Stage 1 source, strict JSON/schema identity, public source
  editing, project overrides, generated-file immutability, adapters, ownership, drift, clean init,
  sync, refresh, checks, formatter trust, containment, transactions, restore, recovery, and artifacts.
- Clearly separate `@evk-soft/ai-pack-core`, `@evk-soft/ai-tooling`, and
  `@evk-soft/code-intelligence`; do not describe the latter or umbrella Stages 2-5 as delivered.
- Document `.husky/pre-commit` unchanged write-and-`git add -A` behavior as a noncompliant Stage 1
  legacy deviation. State that Stage 2 must replace it before managed hooks or consumer hook guidance.
- Ensure no durable file links to this implementation plan or child specification. Rerun the
  coverage test plus offline link, anchor, image, encoding, percent-path, and exact-case checks for
  GREEN, then perform an independent semantic review of the package separation, edit rules, Stage 1
  boundaries, and non-delivery claims.

### 5.8 Phase 5 gate and commit

- Run:

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

- Before staging, require the complete current-OS state-root/run-lock sequence,
  canonical-edit/refresh/sync sequence, second-render, read-only native workflow, recovery regression,
  two-package tarball scan, license scan, coverage manifest, and durable-link scan to pass. After the
  candidate commit, follow §0.3 and require the exact-SHA three-OS workflow to pass the same gate.
- Verify `.gitignore`, `biome.json`, public Biome presets, and `.husky/pre-commit` match their
  pre-self-host hashes; verify no `.ai-tooling/**` path is staged.
- Stage only the exact Phase 5 manifest paths, verify exact status/path/mode equality, and verify every generated
  staged byte matches the lock.
- Commit with `git commit --no-verify -m "feat(ai): self-host the Stage 1 safe core"`.
- Re-run the complete local gate against committed `HEAD`; the executable Phase 5 plan binds the full
  candidate object ID and runs the repository artifact scanner against that variable. Require a green
  full-tree result for the exact committed Phase 5 object with no plan/docs
  whitelist. After the separately authorized §0.3 validation push is green, report the final SHA/native
  workflow and tarball hashes, and stop for
  owner approval of the decommission task. Do not publish, open a PR, or push anywhere except that
  exact temporary validation branch under its separate authorization.

### Task 6: Decommission the temporary Stage 1 delivery documents

**Gate:** This is not an implementation phase. Start only after the owner approves the exact Phase 5
commit and explicitly authorizes decommission. It has one documentation-only commit.

**Files:**

- Modify: `docs/superpowers/specs/2026-08-01-ai-tooling-design.md`
- Delete: `docs/superpowers/specs/2026-08-01-ai-tooling-stage-1-safe-core-design.md`
- Delete: `docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-safe-core-implementation-plan.md`
- Delete: `docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-1-implementation.md`
- Delete: `docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-2-implementation.md`
- Delete: `docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-3-implementation.md`
- Delete: `docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-4-implementation.md`
- Delete: `docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-5-implementation.md`
- Delete: `docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-1.txt`
- Delete: `docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-2.txt`
- Delete: `docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-3.txt`
- Delete: `docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-4.txt`
- Delete: `docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-5.txt`

- [ ] **Step 1: Bind and revalidate the owner-approved Phase 5 commit**

The executor records the commit that the owner approved in the current shell; it is never represented
by a template token. Require `HEAD` to be that commit, require its parent to be the recorded Phase 4
commit from the completed Phase 5 report, and require an empty index before changing documentation.

```powershell
$approvedPhase5Sha = (git rev-parse HEAD).Trim()
$approvedPhase4Sha = (git rev-parse "$approvedPhase5Sha^").Trim()
if ((git diff --cached --name-only).Count -ne 0) {
  throw 'The index must be empty before decommission.'
}
git show --no-patch --format=fuller $approvedPhase5Sha
git diff-tree --no-commit-id --name-status -r $approvedPhase5Sha
```

Read `packages/ai-tooling/tests/fixtures/stage1-coverage.json` and verify that every record points to
existing production code, a passing focused or native test, and an existing durable-document heading.
Then run the exact Phase 5 gate against the bound object:

```powershell
pnpm install --frozen-lockfile --ignore-scripts
pnpm --filter @evk-soft/ai-tooling run build
node packages/ai-tooling/dist/cli.js check --ci
node packages/ai-tooling/dist/cli.js docs check-links
node packages/ai-tooling/scripts/check-stage1-artifacts.mjs --repository $approvedPhase5Sha
pnpm --filter @evk-soft/ai-tooling run test
pnpm --filter @evk-soft/ai-tooling run test:native
pnpm --filter @evk-soft/ai-tooling run pack:check
pnpm check
git diff --check
```

The install and build lead because `node_modules/` and `dist/` are never committed: this task may run
in a worktree freshly created at `$approvedPhase5Sha`, and revalidation must never accept a stale
build left over from the Phase 5 session.

Expected: every command exits `0`, the artifact scan reports the exact value of
`$approvedPhase5Sha`, and the coverage fixture has no missing code, test, or durable-document target.
Stop if the owner-approved object cannot be reproduced.

- [ ] **Step 2: Prove the complete pre-deletion reverse-reference census**

Run the following fixed-string census from the repository root. The expected map is exhaustive for all
twelve temporary delivery artifacts, including every executable phase plan. A different source set is
a contract change: stop and amend this task before deleting anything.

```powershell
$expectedSources = [ordered]@{
  'docs/superpowers/specs/2026-08-01-ai-tooling-stage-1-safe-core-design.md' = @(
    'docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-1-implementation.md'
    'docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-safe-core-implementation-plan.md'
    'docs/superpowers/specs/2026-08-01-ai-tooling-design.md'
  )
  'docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-safe-core-implementation-plan.md' = @(
    'docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-safe-core-implementation-plan.md'
  )
  'docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-1-implementation.md' = @(
    'docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-safe-core-implementation-plan.md'
  )
  'docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-2-implementation.md' = @(
    'docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-safe-core-implementation-plan.md'
  )
  'docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-3-implementation.md' = @(
    'docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-safe-core-implementation-plan.md'
  )
  'docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-4-implementation.md' = @(
    'docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-safe-core-implementation-plan.md'
  )
  'docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-5-implementation.md' = @(
    'docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-safe-core-implementation-plan.md'
  )
  'docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-1.txt' = @(
    'docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-1-implementation.md'
    'docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-safe-core-implementation-plan.md'
  )
  'docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-2.txt' = @(
    'docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-2-implementation.md'
    'docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-safe-core-implementation-plan.md'
  )
  'docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-3.txt' = @(
    'docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-3-implementation.md'
    'docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-safe-core-implementation-plan.md'
  )
  'docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-4.txt' = @(
    'docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-4-implementation.md'
    'docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-safe-core-implementation-plan.md'
  )
  'docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-5.txt' = @(
    'docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-5-implementation.md'
    'docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-safe-core-implementation-plan.md'
  )
}

foreach ($needle in $expectedSources.Keys) {
  $actual = @(& git grep -l -F -- $needle 2>$null | Sort-Object -Unique)
  if ($LASTEXITCODE -notin @(0, 1)) {
    throw "Reference census failed for $needle"
  }
  $expected = @($expectedSources[$needle] | Sort-Object -Unique)
  $difference = @(Compare-Object -ReferenceObject $expected -DifferenceObject $actual)
  if ($difference.Count -ne 0) {
    $difference | Format-Table | Out-String | Write-Host
    throw "Unexpected reverse-reference set for $needle"
  }
}
```

Expected: no exception and no diff table.

- [ ] **Step 3: Move durable ownership to the umbrella and remove all temporary artifacts**

Change only the Stage 1 row in
`docs/superpowers/specs/2026-08-01-ai-tooling-design.md` from:

```markdown
| 1. Safe core and self-hosting | `docs/superpowers/specs/2026-08-01-ai-tooling-stage-1-safe-core-design.md` | Approved; detailed implementation plan awaiting separate owner approval |
```

to:

```markdown
| 1. Safe core and self-hosting | — | Delivered; durable behavior is owned by the AI Tooling architecture and package/user/security documentation |
```

Do not change a later-stage row, scope, or status. Then remove the twelve tracked delivery artifacts:

```powershell
git rm -- docs/superpowers/specs/2026-08-01-ai-tooling-stage-1-safe-core-design.md
git rm -- docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-safe-core-implementation-plan.md
git rm -- docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-1-implementation.md
git rm -- docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-2-implementation.md
git rm -- docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-3-implementation.md
git rm -- docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-4-implementation.md
git rm -- docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-5-implementation.md
git rm -- docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-1.txt
git rm -- docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-2.txt
git rm -- docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-3.txt
git rm -- docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-4.txt
git rm -- docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-5.txt
git add -- docs/superpowers/specs/2026-08-01-ai-tooling-design.md
```

Expected: one modified umbrella specification and twelve Git-tracked deletions. These removals are
recoverable from the approved Phase 5 commit until the documentation commit is integrated.

- [ ] **Step 4: Prove the post-deletion census and durable documentation**

The twelve keys remain in `$expectedSources` from Step 2. Require every fixed string to be absent from
the resulting worktree and require all durable links to resolve:

```powershell
foreach ($needle in $expectedSources.Keys) {
  $actual = @(& git grep -l -F -- $needle 2>$null | Sort-Object -Unique)
  if ($LASTEXITCODE -notin @(0, 1)) {
    throw "Post-deletion reference census failed for $needle"
  }
  if ($actual.Count -ne 0) {
    $actual | Write-Host
    throw "Temporary delivery reference remains for $needle"
  }
}

node packages/ai-tooling/dist/cli.js check --ci
node packages/ai-tooling/dist/cli.js docs check-links
node packages/ai-tooling/scripts/check-stage1-artifacts.mjs --repository $approvedPhase5Sha
pnpm --filter @evk-soft/ai-tooling run test
pnpm check
git diff --check
```

Expected: both censuses are empty and every command exits `0`. The artifact scanner still targets the
approved Phase 5 object because the documentation-only candidate does not change product bytes.

- [ ] **Step 5: Verify the exact staged set and create the documentation-only commit**

```powershell
$expectedStaged = @(
  "D`tdocs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-1-implementation.md"
  "D`tdocs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-2-implementation.md"
  "D`tdocs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-3-implementation.md"
  "D`tdocs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-4-implementation.md"
  "D`tdocs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-5-implementation.md"
  "D`tdocs/superpowers/plans/2026-08-02-ai-tooling-stage-1-safe-core-implementation-plan.md"
  "D`tdocs/superpowers/plans/manifests/ai-tooling-stage-1-phase-1.txt"
  "D`tdocs/superpowers/plans/manifests/ai-tooling-stage-1-phase-2.txt"
  "D`tdocs/superpowers/plans/manifests/ai-tooling-stage-1-phase-3.txt"
  "D`tdocs/superpowers/plans/manifests/ai-tooling-stage-1-phase-4.txt"
  "D`tdocs/superpowers/plans/manifests/ai-tooling-stage-1-phase-5.txt"
  "D`tdocs/superpowers/specs/2026-08-01-ai-tooling-stage-1-safe-core-design.md"
  "M`tdocs/superpowers/specs/2026-08-01-ai-tooling-design.md"
) | Sort-Object
$actualStaged = @(git diff --cached --name-status | Sort-Object)
$difference = @(Compare-Object -ReferenceObject $expectedStaged -DifferenceObject $actualStaged)
if ($difference.Count -ne 0) {
  $difference | Format-Table | Out-String | Write-Host
  throw 'The decommission staged set is not exact.'
}
git diff --cached --check
git diff --cached --stat
git commit --no-verify -m "docs(ai): decommission Stage 1 delivery artifacts"
$decommissionCandidateSha = (git rev-parse HEAD).Trim()
if ((git rev-parse "$decommissionCandidateSha^").Trim() -ne $approvedPhase5Sha) {
  throw 'The decommission commit does not directly follow the approved Phase 5 commit.'
}
git show --check --stat $decommissionCandidateSha
```

Expected: the staged set is exactly thirteen paths, the commit succeeds with the stated message, and
its sole parent is `$approvedPhase5Sha`.

- [ ] **Step 6: Revalidate the committed documentation object and stop**

```powershell
node packages/ai-tooling/dist/cli.js check --ci
node packages/ai-tooling/dist/cli.js docs check-links
node packages/ai-tooling/scripts/check-stage1-artifacts.mjs --repository $decommissionCandidateSha
pnpm --filter @evk-soft/ai-tooling run test
pnpm check
git show --check $decommissionCandidateSha
git status --short --branch
```

Expected: every command exits `0`, the index and worktree are clean, and the report records both
`$approvedPhase5Sha` and `$decommissionCandidateSha`. Stop. Umbrella Stages 2-5 remain closed until
they are separately designed and approved.

## Acceptance-criteria traceability

| Approved criteria | Plan coverage |
|---|---|
| 1-5 | 1.1, 1.3-1.6, 4.5, 5.3-5.5 |
| 6-12 | 2.2-2.6, 3.4, 4.5-4.6, 5.2-5.6 |
| 13-19 | 4.1-4.7, 5.2, 5.8 |
| 20-25 | 1.3-1.7, 2.1-2.5, 3.1-3.3, 4.1 |
| 26-29 | 3.2-3.11, 4.8-4.9, 5.2-5.6 |
| 30-32 | 0.3, 5.1, 5.7-5.8, Task 6 |

## Plan approval gate

Review this plan as one contract, including IC-1 through IC-17, the five one-commit implementation
phases, owner stop points, exact public/native boundaries, and final decommission. Approval must be
explicit: `approve Stage 1 implementation plan and start Phase 1`. Any requested change is applied to
this plan and returned for review; no implementation starts meanwhile.
