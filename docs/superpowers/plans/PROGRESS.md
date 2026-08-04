# Stage 1 execution progress

Working log for the Stage 1 implementation plan. Update this file **only on the plan branch**
(`codex/ai-tooling-design`), never inside a phase execution worktree: phase manifests list the exact
paths a phase may change, and this file is not one of them, so editing it inside the worktree would
fail the manifest gate.

## Current position

- **Phase:** 1 (contracts and instruction-only pack)
- **Task:** 1 and 2 of 9 complete; next is Task 3 (package, export, tarball, artifact boundaries,
  master 1.2)
- **Execution worktree:** `D:/disk.w/Projects/evk-soft/devkit-worktrees/ai-tooling-stage-1-phase-1`
- **Worktree branch:** `ai-tooling/stage-1-phase-1`
- **Approved base for Phase 1:** `7230c03` (`docs(ai): amend Phase 1 packet 1A/1B literals`)
- **Phase commit:** not created yet. Phase 1 makes exactly one commit, in Task 9.

The worktree intentionally stays on the approved base while this file moves ahead on the plan branch.
Do not fast-forward the worktree onto later documentation commits; the Phase 1 commit must keep
`7230c03` as its only parent.

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
| 3 | Package, export, tarball, artifact boundaries (master 1.2) | not started |
| 4 | Diagnostics, strict I-JSON, terminal-safe output (master 1.3) | not started |
| 5 | Byte-stable schemas and offline registry (master 1.4) | not started |
| 6 | Config projection, Git URL v1, JCS, digests (master 1.5) | not started |
| 7 | Generated JSON and pack build bytes (master 1.6) | not started |
| 8 | Minimal public pack (master 1.7) | not started |
| 9 | Final gate, exact staging, sole commit, owner stop | not started |

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
4. Continue at Task 3 (master 1.2): package/export/tarball boundaries, `check-package-contents.mjs`,
   `check-stage1-artifacts.mjs`, and the artifact-scan security spec with its fixtures.
