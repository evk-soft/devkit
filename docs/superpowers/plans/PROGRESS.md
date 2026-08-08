# Stage 1 execution progress

Working log for the Stage 1 implementation plan. Everything below is delivered; update this file in
the same pull request as the work it describes, never inside a phase execution worktree.

## Current position

**Stage 1 Phase 1 and both foundation phases are delivered and merged into `main`.** The next
product work is Stage 1 Phase 2.

`main` history, two squash commits over the pre-existing baseline:

| `main` commit | Contents |
|---|---|
| `bb7ba9e` | `feat: establish the Stage 1 safe core and the pnpm 11 repository foundation` |
| `879cedd` | `chore: upgrade to TypeScript 7 and record the F1 execution findings` |

### The approved phase commits live in tags, not in `main`'s ancestry

Merging is squash-only, so the gated per-phase commits are **not** ancestors of `main`, and their
branches were deleted on merge. They remain reachable forever through annotated tags. Any SHA this
file quotes resolves through them:

| Tag | Commit | What it is |
|---|---|---|
| `stage-1/phase-1` | `ec88ca3` | Stage 1 Phase 1 — 76 files, sole parent `b3ec1b2`, 128 tests |
| `foundation/f1` | `9b4d455` | Foundation F1 — 40 files, sole parent `8c1ee90` |
| `foundation/f2` | `73712d9` | Foundation F2 — 9 files, sole parent `1202160` |

Tagging happened deliberately **before** the first squash. Without it the squash plus
delete-on-merge would have made every approved commit unreachable on the remote, and this file would
be quoting SHAs that no longer resolve.

### Working shape from here

The plan branch and the phase worktrees are gone; their content is all in `main`. GitHub now enforces
what the phase protocol used to enforce by hand: `main` requires a pull request, three green checks
on Linux and Windows, linear history, and no force-push or deletion. So the rhythm is a branch off
`main`, one gated phase, one pull request, squash.

The per-phase manifest discipline still applies to Stage 1 phases, because it is what guarantees a
phase changed exactly the paths it declared.

### Branch reconciliation (F0) — done

`b3ec1b2` had two children: `ec88ca3` and the plan-branch documentation line. Rebasing the plan
branch onto `ec88ca3` linearized them with no conflict; the eight replayed commits touched only
`docs/**` and reproduced byte-identically.

### Push, PR and merge — a deliberate owner override of the plan

The foundation plan forbids pushing. The owner overrode that on 2026-08-06 after being shown that the
repository is **public** and that 33 commits existed on a single disk. Recorded so the divergence
between the written protocol and reality is not a mystery later.

- remote identity verified for fetch and push separately before every push: exactly
  `https://github.com/evk-soft/devkit.git`, one URL each.
- **CI validated the only parts of F1 no local check could reach** — the new Windows leg,
  pnpm 11.20.0 provisioned by corepack on a clean runner, `pack:check` under a network-disabled
  corepack resolution, and the four guard scripts on both platforms. That also closed the design's
  open question about the Bun job surviving the pnpm upgrade.
- merged as two pull requests rather than one, so `main` gained two coherent commits instead of a
  single 36-commit squash. Everything before F1 could not have been merged under the current
  protection: its workflow produced neither `Node 24 (pnpm) - ubuntu-latest` nor
  `- windows-latest`, and used mutable action tags, both of which F1 itself introduced. Splitting
  further would have required weakening the protection that had just been enabled.
- after each squash, the remaining branch was rebased with `git rebase --onto origin/main <old-base>`.
  A plain `git rebase` picks the wrong merge base once a squash commit exists and tries to replay the
  entire history — that happened once and was aborted with the tree verified intact.

### Repository settings, applied 2026-08-06

Merge methods reduced to squash only with delete-on-merge; Dependabot alerts and automatic security
updates enabled; Actions restricted to GitHub-owned, verified publishers and `oven-sh/setup-bun@*`,
with **SHA pinning required**, which turns F1's hand-pinning into a rule a future edit cannot undo;
`main` protected. Secret scanning, push protection and a read-only default workflow token were
already on. CI was re-run afterwards and stayed green, confirming the Actions restriction did not
lock out the repository's own workflow.

`enforce_admins` is deliberately off: the protection guards against accident, not against the owner.
Turn it on when a second maintainer exists.

### Known issue introduced by F1 — decided, documented, left in place

`.husky/post-merge` fires correctly on the first pull that carries the pnpm 11 change, then **fails**
with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`: pnpm 11 wants to purge a `node_modules` laid out
by pnpm 10 and cannot prompt without a TTY. Observed for real when the plan branch was
fast-forwarded. The merge itself completes and pnpm's message states the remedy, so the impact is one
confusing hook failure per machine, exactly once, at the 10 -> 11 transition.

Owner decision, 2026-08-06: leave the hook as it is and document the one-time step, which `README.md`
now does. Suppressing the prompt with `confirmModulesPurge` or `CI=true` would remove a real safety
check on every future install in order to smooth a single transition.

### Biome 2.5.7 — the deferred half of F2, delivered 2026-08-07

F2 shipped TypeScript 7 alone because `minimumReleaseAge: 4320` still rejected Biome 2.5.7 at the
time. The delay expired on 2026-08-07 and the bump landed as its own pull request off `main`: one
catalog line in `pnpm-workspace.yaml`, the resulting `pnpm-lock.yaml`, and the nine `2.5.6` pins in
**four** of the six Stage 1 plan documents — the Phase 2 and Phase 4 plans never named a Biome
version, so listing all six would have been wrong. The squash SHA is recorded in the table above only
after the merge, as it was for F1 and F2.

Three things were measured rather than assumed.

- **The binding publish time is 13:28 UTC, not the 13:23 this file previously quoted.**
  `minimumReleaseAge` applies to all nine `@biomejs/*` lockfile entries, not to the meta-package
  alone, and the last platform binary — `@biomejs/cli-linux-arm64@2.5.7` — was published
  2026-08-04 13:28:24 UTC. The earlier clearance moment was therefore five minutes optimistic.
- **The delay is enforced live, not from a cache.** `pnpm install` prints
  `Lockfile passes supply-chain policies (verified 23h ago)`, which invites the assumption that a
  recent pass short-circuits the check — and 23 hours earlier 2.5.7 was still too young. It does not
  short-circuit: raising the threshold to 5000 minutes made the very same lockfile fail with
  `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`, naming all nine entries and printing the computed cutoff.
  The failed run left `pnpm-lock.yaml` byte-identical, SHA-256
  `85876dbc5c4d6aa630bad8bef6ebc036fc0a7ec4633b27dc2a65dcca44d4b26a`.
- **Biome 2.5.7 rewrites nothing.** Read-only first, as F2 Task 2 Step 2 requires:
  `biome check packages/ai-tooling configs/ai` exits 0 over 56 files, and `biome check --write .`
  over the whole repository reports `No fixes applied` for all 85 — so no formatter-driven change
  reached the approved Phase 1 tree.

The `minimumReleaseAge` comment in `pnpm-workspace.yaml` read "Re-check this value at the F2 entry
snapshot", an instruction that had expired. It now records the outcome of that re-check instead.

### The catalog was not actually single-sourcing anything — found and fixed here

Raising the catalog alone produced a lockfile carrying **both** Biome 2.5.6 and 2.5.7. The cause is
`autoInstallPeers`, which is pnpm 11's default and appears in the lockfile's `settings:` block, not in
any file this repository wrote. Each config workspace declares its tool as a peer dependency with a
wide range, so pnpm satisfied that peer by resolving it **separately** from the catalog — and having
already found a satisfying version, it had no reason to move:

| workspace | declared peer | what pnpm actually installed |
|---|---|---|
| `configs/biome-config` | `^2.3.11` | Biome 2.5.6, while the root ran 2.5.7 |
| `configs/typescript-config` | `^6.0.0 \|\| ^7.0.0` | TypeScript 6.0.3, while the root ran 7.0.2 |

**The second row was already on `main`.** F2 was titled "upgrade to TypeScript 7", but
`pnpm -C configs/typescript-config exec tsc --version` still answered `Version 6.0.3`, and 24 MB of
the old compiler stayed in the virtual store. Neither workspace defines a script, so nothing executed
the stale tool — which is exactly why it went unnoticed, and exactly the trap the first script added
in either directory would have fallen into.

Fixed by declaring each peer as an explicit `catalog:` devDependency in the same `package.json`, so
pnpm satisfies the peer from the catalog instead of resolving a second copy. `pnpm install` reports
`Packages: -3`, all four `exec` probes (root and both configs, Biome and tsc) now answer 2.5.7 and
7.0.2, and the lockfile holds exactly one version of each. `autoInstallPeers: false` was rejected as
the alternative: it would change resolution for every dependency in the workspace to fix two known
declarations.

A devDependency is invisible to consumers of a published package, so widening these two manifests
carries no public-contract change — unlike F2's peer-range widening, which did.

### `check-licenses.mjs` counts orphans in the virtual store

While reconciling the package count above, the licence guard reported 89 packages where the lockfile
implied 86. `scripts/check-licenses.mjs:57` enumerates `node_modules/.pnpm` — the physical virtual
store — rather than the lockfile, and an incremental `pnpm install` unlinked the superseded
`@biomejs/biome@2.5.6`, `@biomejs/cli-win32-x64@2.5.6` and `typescript@6.0.3` without deleting their
directories. So the guard licence-checked three packages that nothing referenced.

Consequences, not yet addressed: the printed count drifts upward across incremental installs, a local
run and a CI run of the same commit disagree, and a package long removed from the lockfile can still
fail the build on its licence. A clean reinstall gives the honest figure — 86 on this branch, against
87 for `main`, the difference being exactly the removed `typescript@6.0.3`. Left as a finding rather
than fixed here, because changing what a supply-chain guard reads is its own decision.

### `packages/ai-tooling/README.md` — first deliberate edit to the approved Phase 1 tree

Line 27 claimed "The workspace pins pnpm `10.28.0`, TypeScript `6.0.3`, Biome `2.5.6`" — all three
already false. It went stale precisely because F1 and F2 were forbidden to touch
`packages/ai-tooling`, and the Phase 2 manifest does not list the file either, so no scheduled work
would ever have corrected it. `README.md` is in the package's `files` array, so a publish would have
shipped the wrong claim.

Rather than restate the three current versions and set up the same drift again, the line now points at
the `catalog` block in `pnpm-workspace.yaml` as the single source and keeps only the two facts that do
not drift: `engines.node` and this package's own literal pins. This is the same reasoning F1 applied
when it removed the Biome version from twelve `$schema` URLs.

**This is the first change to the approved Phase 1 tree made outside a Stage 1 phase**, authorised by
the owner on 2026-08-07. It is safe against the gates for reasons that were checked, not assumed: the
`--phase 1 --tree` content digest is pinned nowhere in the repository, no test asserts README bytes
(only its presence in `files` and in the tarball), and the Phase 2 plan asserts nothing about it.
A future phase-delta comparison is unaffected, because a manifest is compared against its own base.

### GHSA-2v37-7h3g-55p8 — the first advisory the guard actually caught, 2026-08-08

`check-audit.mjs` went from `0 advisories` to a blocking failure between two runs an hour apart:
`nanoid < 3.3.17` loops indefinitely when a custom generator is called with size 0, rated high.

It reaches the tree only through `vitest -> vite -> postcss`, so it is dev-only and can never be
shipped — `packages/ai-tooling` declares just `ajv`, `json-canonicalize` and `jsonc-parser`, and
`files` carries no test tooling. It is fixed rather than ignored anyway, because `check-audit.mjs`
fails on any high advisory by design, CI runs `check:supply-chain`, and adding the first entry to an
empty `IGNORED_ADVISORIES` list would spend the repository's one clean exception record on a
dependency that had a patched version available the same day.

Pinned through a `pnpm-workspace.yaml` override to exactly `3.3.17`, and the exactness is the point.
The first attempt used `>=3.3.17`, which resolved to **`nanoid@6.0.1`** — a major jump across an API
`postcss` does not expect, adopted silently by a one-line override. Caught by reading the resulting
lockfile rather than by any check. `3.3.18` exists, published 2026-08-07 16:41 UTC, and is still
inside `minimumReleaseAge`; `3.3.17` cleared it on 2026-08-06. The delay steering the choice of
patch version is the second time it has done real work.

Drop the override once `vite` ships a `postcss` that depends on a patched `nanoid` — an override that
outlives its cause silently pins a transitive dependency forever.

### The phase gate had a real bypass — found and closed 2026-08-08

Closing the Phase 1 deferred fixtures was expected to be characterisation work: this file recorded
that "the code rejects all of these; no test asserts it". For four of the six that was true. For two
it was not, and writing the tests is what proved it.

**Worktree-scoped configuration was invisible to the preflight.** `assertCleanAdminState` read
`git config --list --local`. Worktree-scoped configuration lives in
`.git/worktrees/<name>/config.worktree`, which `--local` cannot see -- and section 0.3 executes every
phase **in a linked worktree**. So the guard was blind in exactly the place the protocol operates.
Demonstrated end to end before any fix: a hostile `filter.*` written with `git config --worktree`
made `verifyPhaseDelta` **resolve successfully**, while the identical key in local scope was rejected
with `hostile repository configuration: filter`. The same held for `include.path`. A clean/smudge
filter makes working-tree content differ from object content, so this was a way to falsify the very
delta a phase is gated on.

Fixed by dropping `--local`. Under the frozen environment the system config is off and the global
config is a zero-byte file, so an unscoped `git config --list` is exactly local plus worktree plus
the `-c core.*` options the module passes itself, none of which match a rejected prefix.

**Partial-clone markers were not checked at all.** `extensions.partialClone`,
`remote.*.promisor` and `remote.*.partialclonefilter` all passed, because the loop only rejected the
`filter.` and `include.`/`includeif.` prefixes. Stated precisely: this is a missing check, **not** a
demonstrated bypass. The verifier's queries compare object IDs and never read blob contents, and
`--no-lazy-fetch` makes a genuinely absent object fail the query rather than be fetched. It is now
rejected as defence in depth.

CI caught a platform difference that the Windows-only local run could not. The tilde fixture
(`include.path = ~/evil/config`) fails on Linux with `git query failed: rev-parse`, not with the
include guard: the frozen environment is built from an empty map and carries no `HOME`, so Linux Git
has nothing to expand `~` into and fails while loading the configuration -- during the preflight's
first `rev-parse`, before the guard reads a single key. On Windows the same fixture reaches the guard
and is rejected by key. Both outcomes are fail-closed, so the test asserts that verification never
succeeds rather than asserting one platform's message. This is exactly what the Windows CI leg
introduced in F1 exists for, running in the opposite direction.

The four that behaved as recorded, now covered: the `include.*` rejection is by key and independent
of path shape (absolute, relative, tilde, UNC, and conditional `includeIf.gitdir` all rejected); and
gitfile/commondir routing does reach the common directory from a linked worktree (alternates,
`info/grafts`, `shallow` and a nonempty `info/exclude` all rejected there). The raw `parent` header
cases are now asserted directly against the exported `parseRawCommit`: repeated parent, non-hex,
uppercase, truncated, duplicate `tree`, missing `tree`, and an unknown header, plus the zero-, one-
and two-parent shapes.

**Executable swap and config-root cleanup race were replaced with deterministic properties**, by
owner decision: both are races, and a racing test is a flaky test on two CI platforms. What those
fixtures were meant to establish is asserted without timing -- every spawn uses the injected
`runtime.gitPath` and no other file, with `shell: false` and one fixed cwd; the frozen config root
holds exactly three distinct zero-byte regular files inside itself; and `buildFrozenEnvironment`
exposes exactly seven `GIT_*` variables even when `GIT_DIR`, `GIT_ALTERNATE_OBJECT_DIRECTORIES`,
`GIT_CONFIG_COUNT` and `GIT_REPLACE_REF_BASE` are set in the ambient environment.

The suite went from 31 to 57 tests in `tests/unit/verify-phase-delta.spec.ts`. RED was observed before
GREEN: with the verifier reverted to its previous bytes, both worktree-scoped cases and all three
partial-clone cases fail; with the fix they pass. A positive control -- an exact delta verified from
a linked worktree with nothing hostile present -- is deliberately part of the set, because without it
a rejection could come from the linked worktree breaking the fixture rather than from the guard.

**`verify-phase-delta.mjs` changed bytes for the first time since `ec88ca3`.** The Phase 2-5 rule is
`git diff --exit-code HEAD -- <the verifier>`, which forbids an *uncommitted* edit at phase time; a
committed change between phases satisfies it. Phases must be gated with the new bytes from here on.

### Still outstanding after that work

- **The test suite is not typechecked at all.** `packages/ai-tooling/tsconfig.json` has
  `include: ["src/**/*.ts"]`, and Vitest transpiles without checking types, so no `.spec.ts` file has
  ever been typechecked. That makes the last two deferred items -- packet 4B step 5 and packet 5B
  step 5, both of which are `@ts-expect-error` and type-identity assertions -- impossible to close
  honestly: written today they would be inert decoration. The plan assumed otherwise; its expected
  result is "every `@ts-expect-error` is exercised", which requires a compiler that sees them.
  Extending the existing `tsconfig.json` is not the fix: `rootDir: src` with `composite` and
  `outDir: dist` means including tests would emit them into `dist`, and `pack:check` asserts the
  tarball contents exactly. A new `tsconfig.test.json` under `packages/ai-tooling` would be reported
  as `undeclared-entry` by the artifact scanner, whose `OWNED_ROOTS` are `packages/ai-tooling` and
  `configs/ai`. The repository-root `scripts/` directory is outside those roots and already holds the
  four guard scripts, so the intended shape is a root-level guard with its own script and CI step --
  deliberately **not** inside `pnpm check`, which Stage 1 phase gates invoke literally and which must
  not acquire new failure modes. Planned as its own pull request.
- `tsc` 7 rejects command-line file arguments while a `tsconfig.json` is present (`TS5112`, new in 7)
  and does not expand globs in file arguments (`TS6053`). Both were measured. So the guard has to
  enumerate files itself and pass `--ignoreConfig`.


### Phase 1 gate evidence

All exit 0 against the committed tree `ec88ca3`: `typecheck`, `test:unit`, `test:integration`,
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

The fixtures deferred from master 1.0 lines 2086-2104 were closed on 2026-08-08 -- see
"The phase gate had a real bypass" below. Two of the six turned out not to be missing tests at all.

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
