# Stage 1 execution progress

Working log for the Stage 1 implementation plan. Update this file **only on the plan branch**
(`codex/ai-tooling-design`), never inside a phase execution worktree: phase manifests list the exact
paths a phase may change, and this file is not one of them, so editing it inside the worktree would
fail the manifest gate.

## Current position

- **Phase:** 1 (contracts and instruction-only pack)
- **Task:** 1 of 9 — bootstrap the isolated harness and phase-delta verifier (master 1.0)
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
| 1 | Bootstrap harness and phase-delta verifier (master 1.0) | in progress |
| 2 | Repository-local state boundary (master 1.1) | not started |
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
| 1C step 3 three verifier modes | 1 | core done, hostile fixtures outstanding — see below |
| 1C step 5 README and bootstrap CLI | 1 | not started |

`tests/unit/verify-phase-delta.spec.ts` currently holds 19 passing tests.

Packet 1C step 3, core (done):

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

Packet 1C step 3, still outstanding (master 1.0 lines 2086-2104) — roughly 30 hostile fixtures:

- `info/grafts` making a real merge look single-parent; shallow metadata hiding a real parent
- zero / two / duplicate / malformed / different raw `parent` headers; HEAD-versus-ref swap
- active replace ref for the approved base or manifest
- partial-clone promisor missing-object marker
- hostile system/global config and global ignore; inherited Git routing variables
- absolute / relative / tilde / UNC repository-config includes
- local and worktree `filter.*` plus a stat-dirty filtered-path helper marker
- linked-worktree gitfile/commondir routing; both object-alternates files
- linked or changed `info/exclude` and `info/attributes`
- Git executable swap; config-root cleanup-race
- invalid UTF-8 manifest; renamed-path fixture

Files created so far in the worktree (uncommitted):

- `packages/ai-tooling/package.json`, `tsconfig.json`, `vitest.config.ts`
- `packages/ai-tooling/scripts/verify-phase-delta.mjs`
- `packages/ai-tooling/tests/unit/verify-phase-delta.spec.ts`
- modified root `package.json` (adds `check:ai-tooling`) and `pnpm-lock.yaml`

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
4. Continue at Task 1, packet 1C step 3: add the outstanding hostile-fixture tests listed above, then
   packet 1C step 5 (`README.md` and the bootstrap CLI), then Task 2.
