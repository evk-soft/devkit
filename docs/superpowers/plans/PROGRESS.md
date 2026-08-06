# Stage 1 execution progress

Working log for the Stage 1 implementation plan. Update this file **only on the plan branch**
(`codex/ai-tooling-design`), never inside a phase execution worktree.

## Current position

**Phase 1 is complete and owner-approved.**

- **Phase 1 commit:** `ec88ca3` `feat(ai): establish Stage 1 contracts` — 76 files, sole parent
  `b3ec1b2`
- **Execution worktree:** `D:/disk.w/Projects/evk-soft/devkit-worktrees/ai-tooling-stage-1-phase-1`,
  branch `ai-tooling/stage-1-phase-1`, clean
- **Approved base:** `b3ec1b2`
- **Owner approval:** granted 2026-08-06 for `ec88ca3` exactly as committed. The deferred hostile
  fixtures and the two type-level assertions listed below were explicitly **not** required first, so
  `ec88ca3` is final and must not be amended.
**Foundation phase F1 is complete and owner-approved.** Next action is F2, not Stage 1 Phase 2.

- **F1 commit:** `9b4d455` `chore(repo): establish the repository foundation on pnpm 11` — 40 files,
  sole parent `8c1ee90`
- **Approved base:** `8c1ee90` (= `ec88ca3` plus the rebased documentation commits)
- **Owner approval:** granted 2026-08-06
- **Execution worktree:** `D:/disk.w/Projects/evk-soft/devkit-worktrees/repository-foundation-f1`,
  branch `repository-foundation/f1`, clean
- The plan branch was fast-forwarded to `9b4d455`, so the line stays linear:
  `b3ec1b2 -> ec88ca3 -> <docs> -> 9b4d455`.

### Branch reconciliation (F0) — done

`b3ec1b2` had two children: `ec88ca3` and the plan-branch documentation line. Rebasing
`codex/ai-tooling-design` onto `ec88ca3` linearized them with no conflict; the eight replayed commits
touched only `docs/**` and reproduced byte-identically.

### Push and PR — a deliberate owner override

The F1 plan forbids pushing. The owner overrode that on 2026-08-06 after being shown that the
repository is **public** and that 33 commits existed on a single disk. Recorded here so the divergence
between the written protocol and reality is not a mystery later.

- pushed branches: `repository-foundation/f1` and `codex/ai-tooling-design`. **`main` was not
  touched** and is still `550a56e`, verified in sync before and after.
- remote identity verified for fetch and push separately: exactly
  `https://github.com/evk-soft/devkit.git`, one URL each.
- draft PR https://github.com/evk-soft/devkit/pull/2, opened for CI validation only, explicitly not
  for merge. A branch push alone runs nothing: the workflow triggers are `push` on `main` and
  `pull_request`.
- **CI run 31106182051 is green on all three jobs**: `windows-latest` 92 s, `ubuntu-latest` 39 s,
  Bun 9 s. This validated the only parts of F1 that no local check could reach — the new Windows
  leg, pnpm 11.20.0 provisioned by corepack on a clean runner, `pack:check` under a
  network-disabled corepack resolution, and the four guard scripts on both platforms. It also closes
  the design's open question about the Bun job surviving the pnpm upgrade.

### Known issue introduced by F1 — decide before F2

`.husky/post-merge` fires correctly on the first pull that carries the pnpm 11 change, then **fails**
with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`: pnpm 11 wants to purge a `node_modules` laid out
by pnpm 10 and cannot prompt without a TTY. Observed for real when the plan branch was
fast-forwarded. The merge itself completes and pnpm's message states the remedy, so the impact is one
confusing hook failure per machine, exactly once, at the 10 -> 11 transition.

Deliberately **not** fixed by amending `9b4d455`: that commit is approved, pushed and CI-green. The
options are to leave it and document the one-time step, or to add `.husky/post-merge` to the F2
manifest and make the hook report rather than fail. Owner decision.

Gate evidence, all exit 0 against the committed tree: `typecheck`, `test:unit`, `test:integration`,
`build`, `pack:check`, `check-stage1-artifacts.mjs --phase 1 --tree`, `pnpm check`,
`git diff --check`, and `verify-phase-delta.mjs --phase 1 --base b3ec1b2 --commit ec88ca3`.
128 tests pass.

## Preparation commits (plan branch)

| Commit | Contents |
|---|---|
| `2d5eef2` | `docs(ai): add Stage 1 implementation plan` — 11 files (master, 5 phase plans, 5 manifests) |
| `a4f8e45` | `chore: raise the toolchain baseline to Biome 2.5.6 and TypeScript 6.0.3` — 15 files |
| `7230c03` | `docs(ai): amend Phase 1 packet 1A/1B literals` — 2 defect fixes, see below |

## Phase 1 task status

| Task | Title | Status |
|---|---|---|
| Entry snapshot | baseline binding + toolchain assertions | done |
| 1 | Bootstrap harness and phase-delta verifier (master 1.0) | done — 31 tests green, typecheck clean |
| 2 | Repository-local state boundary (master 1.1) | done — 5 real-root probes verified |
| 3 | Package, export, tarball, artifact boundaries (master 1.2) | done — all three packets |
| 4 | Diagnostics, strict I-JSON, terminal-safe output (master 1.3) | done — all three packets |
| 5 | Byte-stable schemas and offline registry (master 1.4) | done — 22 schema tests green |
| 6 | Config projection, Git URL v1, JCS, digests (master 1.5) | done — 26 tests green |
| 7 | Generated JSON and pack build bytes (master 1.6) | done — 9 tests green |
| 8 | Minimal public pack (master 1.7) | done — 3 core-pack tests green |
| 9 | Final gate, exact staging, sole commit, owner stop | done — commit `ec88ca3`, stopped for approval |

### Task 1 packet detail

| Packet | Steps | Status |
|---|---|---|
| 1A package discovery and exact runner | 4 | done — Vitest 4.1.10 confirmed |
| 1B fail closed on an unexpected deletion | 4 | done — RED then GREEN observed |
| 1C step 1, 2, 4 closed verifier matrix | 3 | done — 12 tests green |
| 1C step 3 three verifier modes | 1 | done |
| 1C step 5 README and bootstrap CLI | 1 | done |

`tests/unit/verify-phase-delta.spec.ts` holds 31 passing tests. `pnpm --filter @evk-soft/ai-tooling
run typecheck` exits 0.

Packet 1C step 3, core:

- frozen Git provider: environment built from an empty map, private zero-byte
  config/excludes/attributes root, `GIT_CONFIG_NOSYSTEM`, `GIT_ATTR_NOSYSTEM`, `GIT_OPTIONAL_LOCKS=0`,
  `GIT_NO_REPLACE_OBJECTS`, `GIT_NO_LAZY_FETCH`, `GIT_LITERAL_PATHSPECS`, plus
  `--no-replace-objects --no-lazy-fetch --literal-pathspecs` and `core.fsmonitor/untrackedCache=false`
  on every query; argv arrays only, `shell: false` asserted by test
- `worktree` mode, including the nonempty-index rejection
- `cached` mode via `diff --cached --name-status --no-renames -z` plus `ls-files --stage` for modes
- `commit` mode: raw `cat-file commit` parse, exactly-one-parent rule, parent must equal the approved
  base, exact tree-to-tree raw diff; asserted to use neither `rev-list` nor `HEAD^`
- full lowercase 40-hex enforcement for `base`/`commit`, rejected before any object read

Hostile admin-state preflight (done). `assertCleanAdminState` runs before the manifest read and
before any delta query, over both the git dir and the common dir, and rejects:

- object alternates and http-alternates files
- `info/grafts`, and a `shallow` marker
- `info/exclude` / `info/attributes` carrying any effective rule, or replaced by a non-regular file
  (`git init` seeds a comment header, so emptiness is the wrong test — effective rules are)
- any ref under `refs/replace`
- local `filter.*`, `include.*`, `includeIf.*` configuration

Covered by tests: all of the above, plus zero-parent and merge candidates, a parent that is not the
approved base, symbolic revisions, invalid UTF-8 manifests, rename reported as delete plus add, and
inherited `GIT_DIR`/`GIT_WORK_TREE`/`GIT_INDEX_FILE` being ignored.

Still outstanding from master 1.0 lines 2086-2104, deferred as lower-value or Windows-awkward:

- partial-clone promisor missing-object marker
- absolute / relative / tilde / UNC repository-config includes as distinct fixtures (the `include.*`
  rejection already covers them by key, not by path shape)
- worktree-scoped `filter.*` and a stat-dirty filtered-path helper marker
- linked-worktree gitfile/commondir routing fixture (the code reads both dirs; no test asserts it)
- Git executable swap and config-root cleanup-race
- duplicate / malformed / different raw `parent` header fixtures (the parser rejects them; no test)

`scripts/verify-phase-delta.mjs` also gained the command-line entry point the section 0.3 protocol
invokes (`--phase N --worktree|--cached`, or `--phase N --base <sha> --commit <sha>`). Verified
against the real checkout: it currently exits 1 with `missing path: .gitignore`, which is correct
while Task 2 is still outstanding.

Files created so far in the worktree (uncommitted):

- `packages/ai-tooling/package.json`, `tsconfig.json`, `vitest.config.ts`, `README.md`
- `packages/ai-tooling/src/index.ts`, `src/cli.ts`
- `packages/ai-tooling/scripts/verify-phase-delta.mjs`
- `packages/ai-tooling/tests/unit/verify-phase-delta.spec.ts`
- `packages/ai-tooling/tests/helpers/temp-repository.ts`
- `packages/ai-tooling/tests/integration/repository-ignore.spec.ts`
- modified root `package.json` (adds `check:ai-tooling`), `pnpm-lock.yaml`, and `.gitignore`

32 tests pass across 2 files; `typecheck` exits 0. `node packages/ai-tooling/scripts/verify-phase-delta.mjs
--phase 1 --worktree` now reports `missing path: configs/ai/LICENSE`, which is Task 8 work — correct
for this position.

### Task 2 notes

`.gitignore` gained exactly the two planned LF-terminated lines; the file has no CR and ends with LF.
All five real-root probes behave as specified: the four `.ai-tooling/**` paths are ignored and cite
`.gitignore:142:/.ai-tooling/`, and `ai-tooling.lock.json` exits 1 with empty output.

`tests/helpers/temp-repository.ts` deliberately omits `--literal-pathspecs` and
`GIT_LITERAL_PATHSPECS`, even though section 0.3 applies them to verifier queries: `git check-ignore`
fails with `pathspec magic not supported by this command: 'literal'` under either. Task 2 step 3 does
not require them for this helper, and the probes use fixed literal paths.

## Plan defects found and amended

Fixed during the pre-execution audit, before any implementation (commit `2d5eef2` contents):

1. Phase 4 Task 4.3.3 — `transaction-manager.spec.ts` first declared `Modify`, manifest says `A`.
2. Phase 4 — `transaction-recovery.native.spec.ts` created in Task 4.3.9 but run from Task 4.1.7.
3. Phase 4 — `dist/cli.js` invoked before any build.
4. Phase 5 — same, in Task 6.
5. Master Task 6 — same, plus no install, in a possibly fresh worktree.
6. Phase 4 — no dependency install anywhere in the phase.
7. Phase 5 — no phase entry snapshot at all.
8. Phase 1 — baseline toolchain check existed only as master prose; added as an executable assertion.
9. Phase 3 / Phase 5 — missing master traceability, including the `Task 3.11` vs master `3.11` trap.

Found during execution and amended in `7230c03`:

10. Phase 1 packet 1B — fixture manifest was unsorted, which `parseManifest` rejects before the delta
    comparison, so the test could never reach its assertion.
11. Phase 1 packet 1A — `vitest.config.ts` used `poolOptions.forks.singleFork`, removed in the pinned
    Vitest 4.1.10 and silently ignored. Replaced with `maxWorkers: 1`, keeping `isolate` at its
    default `true` on purpose.

## Resuming

1. Read this file, then the Phase 1 plan.
2. `cd` into the worktree above; do not `cd` into the main checkout.
3. Confirm `git rev-parse HEAD` equals the approved base and `git status` shows only the files listed
   above.
4. Continue at Task 9 (the phase gate). Read its steps in full before acting: it runs the complete
   local gate, then the exact hook formatter command (`pnpm -s exec biome check --write .`) followed
   by a manifest-scoped worktree check, stages exactly the 75 manifest paths with one explicit
   `git add --` per path, runs the cached verifier and artifact scan, creates the single commit
   `feat(ai): establish Stage 1 contracts` with `--no-verify`, re-verifies the committed delta
   against `$approvedBaseSha`, and then **stops for owner approval**. Never run the hook's
   `git add -A`.

### Task 8 notes

The canonical pack ships exactly two instruction-only resources: the `evk-grounding` rule
(`evk-soft/rules/grounding`) and the `evk-plan` skill (`evk-soft/skills/plan`). Instruction bodies are
the plan's literal text. `tests/integration/core-pack.spec.ts` validates the real pack through the
offline registry, asserts the exact resource list and that every `requiredCapabilities` entry is
`instructions.markdown`, inventories every shipped file for executable-surface signals (shebang,
scripts, hooks, MCP servers, bin, plugins) and requires the signal list to be empty, and checks that
each resource directory contains only its declared files.

One contract correction: Task 5 left the capability field name unspecified, so the schemas initially
used `capabilities` with the value `instructions`. Task 8 fixes both — the field is
`requiredCapabilities` and the value is `instructions.markdown`. The rule and skill schemas and
`PackCapability` were updated to match.

Documentation written: `docs/ai-tooling/SECURITY.md` (what a pack may contain, the trust boundaries,
and the explicit statement that Stage 1 protects integrity and containment but makes no
confidentiality claim against a principal who can already read the checkout),
`docs/ai-tooling/EXTENDING-PACKS.md` (how to add a resource and how to customize through
`ai/overrides/**` rather than forking, including why `baseDigest` exists), a rewritten
`configs/ai/README.md`, and a delivery-status section in `docs/system-overview/ai-tooling.md` that
separates delivered guarantees from planned ones.

Also created the four fixture files the manifest requires but earlier tasks had not written:
`tests/fixtures/rfc8785/vectors.json`, `tests/fixtures/config-digest/vectors.json`, and
`tests/fixtures/render-json/{vectors,expected}.json`.

124 tests pass; `typecheck`, `pnpm run test`, the artifact scan, and the phase-delta verifier all
exit 0.

### Task 7 notes

`src/json/render-json.ts` renders validated JSON as the exact bytes a generated file will hold: keys
in the supplied schema order rather than alphabetically, two-space indent, LF, no BOM, exactly one
final LF, and no line folding. A key missing from the order is an error, never an append — otherwise
a field could reach output that no ordering accounts for, and the bytes would depend on object
construction order. It is not the canonicalizer and never calls JCS or a formatter.

`src/pack/build.ts` exposes `validatePack` and `buildPack`. Reads go only through the injected
`ReadOnlySourceContext` and its shared budget, and writes go only through an explicit
`PackBuildDestination` whose methods are exclusive-create. The function holds no handle that could
reach the repository, so "no repository writes" is structural rather than a rule to remember.
Undeclared files in a resource directory and executable instruction files are rejected before any
destination write. Instruction bytes are copied unchanged; metadata is re-rendered in schema order
with the version-tagged `$schema`.

`src/model/types.ts` gained the access contracts: branded `ContainedPathRef` (producible only by a
gateway, so a raw absolute path is not representable), `RepositoryReadBudget`,
`ReadOnlyRepositoryFilesystem`, and `ReadOnlySourceContext`.

`src/commands/pack.ts` parses `validate` and `build` but returns
`EVK_PACK_CAPABILITY_UNAVAILABLE` before any repository access, because the real source context
arrives with Phase 2. Both functions stay fully usable through dependency injection.

121 tests pass; `typecheck` and `pnpm run test` exit 0.

### Task 6 notes

`src/config/git-url-v1.ts` lexes ASCII bytes directly. The runtime `URL` parser, `URLSearchParams`,
IDNA/UTS-46, and Unicode normalization are all unused on purpose: their behaviour varies between
runtime versions, and this output feeds a digest that must be identical everywhere. It rejects
non-https schemes, userinfo, query, fragment, non-ASCII or percent-encoded hosts, bracketed IPs,
numeric-only hosts, non-canonical ports, backslashes, and surrounding whitespace; it folds scheme and
host to lower case, drops only port 443, decodes only RFC 3986 unreserved triplets, uppercases every
retained triplet, and removes dot segments. Proven idempotent.

`src/json/jcs.ts` wraps `canonicalizeEx` exactly as the plan specifies and hashes only those bytes.
A regression test asserts that a decomposed `e` plus combining acute and a precomposed acute produce
**different** bytes: canonicalization orders and spells, it must never fold Unicode, or two distinct
documents would collapse into one digest.

`src/config/projection.ts` materializes every literal default, so an omitted property and an
explicitly written default hash identically. `packSelectionProjectionV1` deliberately excludes
platforms, output mode, hooks and plugins — that is what later lets `EVK_CONFIG_REQUIRES_UPDATE`
distinguish "same packs, rendered differently" from "different packs". A test asserts exactly that
asymmetry.

One correction worth remembering: RFC 8785 numbers use the ES6 shortest round-trip form, so
`0.000001` stays decimal and exponential spelling only begins at `1e-7`. An early expectation of
`1e-6` was my error, not the library's.

### Task 5 notes

Authored (packet 5A): all seven schema documents under `packages/ai-tooling/schemas/`. Each carries
`$schema` draft 2020-12 and the exact tagged `$id`, is `type: object` with
`additionalProperties: false`, ends with LF, contains no CR, and uses only local or sibling `$ref`
values so validation resolves entirely offline. `tests/package/schema-bytes.spec.ts` asserts all of
this plus the exact seven-document directory listing — 15 tests green.

Design points worth keeping:

- `config.schema.json` recognises exactly the local, npm and git source kinds. Its `gitUrl` pattern
  admits only https `.git`, ssh `.git`, and scp-style `git@host:path.git`; a bare content URL such as
  `https://example.invalid/pack.md` is rejected by the schema, before any provider or acquisition
  call. `overrideDirectory` requires a strict descendant of the literal `ai/overrides` root, so the
  root itself, absolute paths, dot and parent components, backslashes, drive letters, and UNC
  prefixes all fail lexically.
- `override.schema.json` allows only `extend`, `replace`, `disable`, and uses `if`/`then` so
  `disable` may not carry an instructions file while the other two must.
- `state.schema.json` is the frozen one: run lock with typed process owner and liveness provider,
  journal header at sequence 0 whose digest covers the whole frame, frame types, the three terminal
  outcomes, six-digit step spelling, backup and retained-preimage records, recovery handoff and
  archive, and reports. Phases 2 through 5 consume it and must not modify it.

Verified: the tarball now carries `package/schemas/*.json`, and the artifact scan still exits 0.

Packet 5B (done): `src/json/schema-registry.ts` exports `createOfflineSchemaRegistry`,
`SchemaTypeMap`, and `SchemaName`. Ajv2020 is constructed exactly as the plan specifies
(`strict: true`, `allErrors: true`, `validateFormats: false`, `useDefaults: false`,
`coerceTypes: false`, `removeAdditional: false`); all seven schemas are registered before any root is
compiled and `loadSchema` is never defined, so an unresolved reference fails locally. Errors are
mapped to instance path, schema path and keyword, sorted in that order, and never carry the document
body. Handwritten types live in `src/config/types.ts` (`ConfigV1`, `OverrideV1`, `LockV1`, `StateV1`
and the frozen state sub-types) and `src/pack/types.ts` (`PackV1`, `RuleV1`, `SkillV1`).

Three traps found while wiring it up:

- Ajv strict mode rejects a `required` naming a property the same subschema does not declare in
  `properties`. The `if`/`then` branches in `override.schema.json` had to declare `instructions`
  inside each branch, not only at the document root.
- the first path patterns admitted `..` as a component, because `.` is in the allowed character
  class. `ai/overrides/../escape` passed validation — a real escape from the permitted root. Every
  path pattern in all seven schemas now carries a `(?!\.\.?(?:/|$))` guard per component.
- `ajv/dist/2020.js` is CommonJS; under ESM interop the constructor arrives on `.default` in some
  resolutions and as the namespace in others, so the import accepts either shape.

Outstanding in Task 5: packet 5B step 5's compile-time assertions (`validate('lock', …)` is `LockV1`
and not `ConfigV1`, no caller-selected generic) and packet 4B step 5's `@ts-expect-error` cases. Both
are type-level only; `ConfigV1` now exists, so they can be written at any time.

90 tests pass across the unit, package and security suites, plus the integration suite; `typecheck`,
`pnpm run test`, and the artifact scan all exit 0.

### Task 4 notes

Packet 4A (done): `src/diagnostics/codes.ts` holds the closed nineteen-member `DIAGNOSTIC_CODES`
literal plus `ENCODING_INVALID_REASONS`; `src/diagnostics/error.ts` holds `Diagnostic`,
`ToolingError`, and the `toolingError` factory; `src/model/types.ts` holds `JsonValue` and
`RedactedSource`. No code is synthesized at runtime.

Packet 4B (done): `src/json/strict-json.ts` exports `parseStrictJson(bytes, source)` returning a
branded `StrictJsonDocument` that cannot be constructed outside the module. It rejects a UTF-8 BOM,
malformed UTF-8, empty input, comments, trailing commas, trailing tokens, decoded duplicate keys,
lone surrogates in keys and strings, and numbers that do not round-trip through IEEE-754 (verified by
the plan's `decimalIdentity` canonicalizer, not by `Number.isSafeInteger`). Seven fixtures cover the
rejection cases; `9007199254740992`, `1.0` and `0.1` are accepted.

Two implementation traps worth remembering:

- `jsonc-parser`'s `visit` takes ParseOptions as its **third** argument and has no errors-array
  parameter. Passing an errors array third silently discards `disallowComments`, so comments were
  accepted until every fault was routed through the `onError` callback instead.
- the visitor's failure record is held in an object, not a bare `let`. TypeScript does not track
  assignments made inside closures, so a bare binding narrows to `null` and the post-visit check
  becomes unreachable — it failed the build with `Property 'reason' does not exist on type 'never'`.

Packet 4C (done): `src/diagnostics/terminal-safe.ts` exports `streamHumanTerminalSafeUtf8`,
`streamJsonTerminalSafeString`, and the two scalar encoders; `src/diagnostics/json.ts` exports
`renderMachineDiagnostic`, which sorts object keys by raw bytes so one diagnostic always renders the
same bytes.

- human mode: backslash doubled first, quote escaped, every C0 plus DEL and C1 as uppercase `\xHH`,
  and the separator and bidi scalars as uppercase `\u{HHHH}`
- JSON mode: preserves the logical scalar, so `JSON.parse` returns the exact original string, while
  emitting no hazardous scalar raw
- both are injective: a user-typed literal backslash sequence and a real control byte cannot collapse
  into the same output
- incremental fatal `TextDecoder` with `stream: true`, so a sequence split across chunks is buffered
  rather than silently replaced; the final flush rejects an incomplete tail
- encoded bytes are counted before every write, so a one-over result never reaches the sink

The test source builds every hazardous scalar from code points rather than writing it literally.
An earlier draft embedded raw ESC and BEL bytes, which made the committed test a binary file to Git
and would have tripped the artifact scanner.

Outstanding in packet 4B: step 5's `@ts-expect-error` assertions need `ConfigV1`, which Task 6
creates. Do them when `src/config/types.ts` exists.

68 tests pass across the unit, package and security suites, plus the integration suite; `typecheck`,
the full `pnpm run test`, and `check-stage1-artifacts.mjs --phase 1 --tree` all exit 0.

### Task 3 notes

Packet 3A (done):

- `packages/ai-tooling/package.json` now carries the exact public surface asserted by
  `tests/package/package-contract.spec.ts`: `exports` (root, `./schemas/*.json`, `./package.json`),
  `bin.ai-tooling` -> `./dist/cli.js`, `files` `['dist','schemas','README.md','LICENSE']`,
  `engines.node >=24.0.0`, `publishConfig.access public`, `license MIT`, and the exact Phase 1 scripts
- exact dependency pins resolved and verified via `pnpm list --depth 0`: `ajv 8.20.0`,
  `json-canonicalize 2.0.0`, `jsonc-parser 3.3.1`, `@types/node 24.13.3`, `@vitest/coverage-v8 4.1.10`,
  `vitest 4.1.10`
- `TOOLING_VERSION = '0.1.0'` exported from `src/index.ts`
- `configs/ai/package.json` created as public `@evk-soft/ai-pack-core@0.1.0`, ESM, MIT, `files`
  `['pack.json','rules','skills','README.md','LICENSE']`, no bin, dependency, script, or code export
- root `LICENSE` copied byte-identically to `packages/ai-tooling/LICENSE` and `configs/ai/LICENSE`
  (all three SHA-256 `35d8a4e9e51206c6f19d1c3ce906115c1927386ad25e700d9e17362ab3a0fb6d`)

Packet 3B (done) — `scripts/check-package-contents.mjs`:

- private owner-only staging root; TypeScript compiled into it with an explicit `--outDir`, so the
  working `dist/` is never an input
- only `package.json`, `README.md`, `LICENSE`, and schema bytes copied in
- `pnpm pack` launched as `process.execPath <corepack pnpm.cjs> pack --json --pack-destination <dir>`,
  `shell: false`, no stdin, staging cwd, 300 s deadline, 64 MiB stdout cap, private HOME/cache/store,
  `npm_config_ignore_scripts` and `npm_config_ignore_pnpmfile`
- pnpm entry resolved from the corepack cache for the exact version pinned in root `packageManager`
- bounded gzip reader: single member, flag validation, 4 KiB optional-header cap, data CRC and ISIZE
  verified, 64 MiB compressed / 256 MiB inflated caps
- bounded tar reader: octal-only numeric fields, header checksum verified, zero-filled padding
  required, exact two-block end marker with no trailing data, and rejection of links, devices, FIFOs,
  global and GNU headers, chained PAX overrides, absolute or `..` paths, and duplicate paths

Verified: the archive contains exactly `package/LICENSE`, `package/README.md`, `package/package.json`,
and the four `package/dist/*` build outputs. The stale-artifact test writes `dist/stale.js` and a fake
native helper into the working tree and confirms neither reaches the tarball.

Plan defect 12, amended in `db67234`: packet 3B specified argv
`--ignore-scripts --ignore-pnpmfile pack ...`, but `pnpm pack` 10.28.0 rejects both with
`Unknown options`. The frozen environment carries the suppression instead.

Packet 3C (done) — `scripts/check-stage1-artifacts.mjs`:

- streaming Knuth-Morris-Pratt matcher (`PrivateMarkerStream`) finds a token that spans arbitrary
  chunk boundaries; counting and hashing continue after a match so size and digest checks still fail
  closed
- the forgotten-stub sentinel is assembled from bytes and decoded with fatal UTF-8 at runtime; its
  printable form is absent from the scanner source, the JSON policy, the test source, and every
  diagnostic
- findings carry only a relative path and a closed finding class, never matched bytes
- `--tree` mode prefers `git ls-files --cached --others --exclude-standard`, so ignored build caches
  such as `*.tsbuildinfo` are never scanned; it falls back to a filesystem walk for non-repository
  fixtures
- the policy document is exempt from its own `credentialPrefixes` matching, since it necessarily
  contains every prefix it declares; literal-token matching still applies to it
- vectors cover exact body, every split position, prefix-only, suffix-only, altered first and last
  byte, duplicate body, LF suffix, literal backslash-n suffix, and empty body

Verified on the real tree: `--phase 1 --tree` exits 0 and prints a content digest.

45 tests pass across the unit, package and security suites, plus the integration suite; `typecheck`
and the full `pnpm run test` both exit 0. The verifier reports `missing path: configs/ai/README.md`,
which is Task 8 work.
