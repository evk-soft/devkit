# Repository Foundation Design

**Date:** 2026-08-06
**Status:** Draft — awaiting owner approval
**Profile:** infrastructure — repository configuration, guard scripts, and toolchain versions; no
product behaviour change and no edit to `@evk-soft/ai-tooling` source
**Scope:** `.editorconfig`, `.gitattributes`, `.npmrc`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, root
`package.json`, `.github/workflows/ci.yml`, `.husky/**`, `turbo.json`, `changelog.d/**`,
`CHANGELOG.md`, `scripts/**`, `.claude/**`, and the pinned Tech Stack lines of
`docs/superpowers/plans/**`
**Depends on:** Stage 1 Phase 1 commit `ec88ca3`, owner-approved 2026-08-06
**Reference implementation:** `D:\disk.w\Projects\Slotegrator\Projects\non-restrict-proxy`

## Goal

Bring devkit to the monorepo baseline the owner already operates in the reference project, without
disturbing the Stage 1 safe core. Two separately gated phases:

- **F1 — repository foundation and pnpm 11.** Editor and line-ending contracts, dependency-version
  single sourcing, supply-chain posture, structural guard scripts, changelog fragments, task
  orchestration, and the agent configuration. The pnpm 10 → 11 upgrade is included here because
  pnpm 11 changes *where and how every one of those settings is written*; deferring it would mean
  authoring the settings twice.
- **F2 — compiler upgrade.** TypeScript 6.0.3 → 7.0.2 and Biome 2.5.6 → 2.5.7, isolated behind their
  own gate because TypeScript 7 is a reimplemented compiler and Phase 1 code depends on strict
  inference flags.

Success is demonstrated when, after each phase, every literal command the Stage 1 Phase 2-5 plans
invoke still exits 0 against the Phase 1 tree, and the Phase 1 gate evidence reproduces.

## Non-goals

- No change to any file under `packages/ai-tooling/src/**`, `packages/ai-tooling/schemas/**`, or
  `configs/ai/**`. Foundation work is not permitted to alter product bytes.
- No amendment of `ec88ca3`. It is the approved Phase 1 commit and is final.
- No replacement of the existing `check`, `check:biome`, `check:runtime`, or `format` scripts.
  Turbo is added alongside them, never in front of them.
- No new CI provider, no GitLab CI, no Playwright, no Drizzle, no React tooling. The reference
  project is a source of patterns, not a template to mirror.
- No publication, no push, and no PR. Both phases stop at a local commit plus owner review.
- No dependency upgrade beyond the four named tools. `pnpm update --latest` is out of scope.
- No modification of `.husky/pre-commit`. Stage 1 explicitly leaves current hooks untouched, and the
  phase protocol depends on that file's exact current bytes.

## Grounding

Every row was verified against the working tree or the vendor documentation on 2026-08-06. None of
it is inherited from the previous session's summary.

| Current or external fact | Evidence |
|---|---|
| All text is already normalized to LF in repository and checkout | `.gitattributes:1` |
| `.npmrc` already carries three behavioural settings in pnpm-10 kebab-case | `.npmrc:1-3` |
| The workspace covers exactly `configs/*` and `packages/*` | `pnpm-workspace.yaml:1-3` |
| Root scripts are exactly `check`, `check:biome`, `check:runtime`, `format`, `prepare` | `package.json:21-27` |
| The declared baseline is pnpm 10.28.0, Node >=24, TypeScript ^6.0.3, Biome ^2.5.6 | `package.json:5-8`, `package.json:28-32` |
| CI pins pnpm 10.28.0, runs `pnpm check` on Ubuntu, plus a Bun runtime smoke job | `.github/workflows/ci.yml:20`, `:36`, `:38-47` |
| The pre-commit hook formats the tree and then stages everything | `.husky/pre-commit:1-2` |
| devkit has no `.editorconfig`, no `.claude/`, no `turbo.json`, no `changelog.d/`, and exactly one file in `scripts/` | directory listing, 2026-08-06 |
| pnpm restricts `.npmrc` to registry and auth settings; all other settings live in `pnpm-workspace.yaml` | https://pnpm.io/settings, https://pnpm.io/cli/config |
| pnpm 11 consolidates configuration into `pnpm-workspace.yaml` and merges build-dependency settings into one `allowBuilds` map | https://pnpm.io/migration, https://pnpm.io/blog/2025/12/29/pnpm-in-2025 |
| pnpm 11 ships an official codemod for the v10 → v11 migration | https://pnpm.io/migration |
| `minimumReleaseAge` delays adoption of freshly published versions as a supply-chain control | https://pnpm.io, reference `pnpm-workspace.yaml:179` |
| Current published versions: pnpm 11.20.0, TypeScript 7.0.2, Biome 2.5.7, Vitest 4.1.10 | npm `dist-tags`, 2026-08-06 |
| Vitest is already at the current release, so F2 has nothing to do for it | same |
| The toolchain versions are pinned 39 times across 7 plan documents | `rg` over `docs/superpowers/plans` |
| `pnpm pack` fails on a `catalog:` specifier outside a workspace, with `ERR_PNPM_CATALOG_ENTRY_NOT_FOUND_FOR_SPEC` | local probe, 2026-08-06 |
| Phase 1 packs from a private staging root that is outside the workspace | `packages/ai-tooling/scripts/check-package-contents.mjs` |
| `git worktree add` fires `post-checkout` with `$3=1` and an all-zero `$1` | local probe, 2026-08-06 |
| Inside a linked worktree `git rev-parse --git-dir` and `--git-common-dir` differ; in the main worktree they are equal | same probe |
| The reference project has `check-circular.mjs` and `check-workspace-boundaries.mjs`, but **no** `check-audit.mjs` or `check-licenses.mjs` | reference `scripts/` listing |
| The reference `check-circular.mjs` imports shared helpers from its own tooling package, so it is not a drop-in copy | reference `scripts/check-circular.mjs:1-18` |
| The reference `handoff` skill exists and is 3325 bytes | reference `.claude/skills/handoff/SKILL.md` |
| The artifact scanner already declares a `dependency-license-conflict` finding class that nothing currently produces | `packages/ai-tooling/scripts/check-stage1-artifacts.mjs` |
| `b3ec1b2` has two children — `ec88ca3` and `8fa9c76` — so the history is currently forked | `git log`, 2026-08-06 |

## Decisions

| Fork | Decision | Consequence |
|---|---|---|
| pnpm upgrade placement | Move pnpm 10 → 11 into F1, not F2 | Settings are authored once, in their final v11 shape; F2 carries only compiler risk |
| `.gitattributes` | Extend the existing file; do not rewrite it | The byte-determinism guarantee Phase 1 rests on is already in force and is not re-litigated |
| `.npmrc` | Keep the file, empty it of behavioural keys, and document the v11 rule in a comment | A future contributor who adds a behavioural key there is told why it will be ignored |
| Catalog reach | Catalogs cover the root and `configs/*` only; `packages/ai-tooling` keeps literal version pins | Verified: a `catalog:` specifier would break the Phase 1 `pack:check` gate |
| Build scripts | `allowBuilds: {}` — an empty allowlist, so no dependency may execute code at install time | Install-time code execution, the dominant npm supply-chain vector, is off by default |
| Supply-chain delay | Adopt `minimumReleaseAge` | A freshly published malicious version cannot be pulled in on the day it appears |
| New guard scripts | `check-audit.mjs` and `check-licenses.mjs` are written from scratch, not ported | Honest effort accounting; the reference has no such files |
| Ported guard scripts | `check-circular.mjs` and `check-workspace-boundaries.mjs` are adapted, not copied | They depend on reference-only helpers and a 49-workspace layout devkit does not have |
| Guard wiring | New guards get their own scripts and CI steps; `pnpm check` keeps its exact current meaning | Stage 1 phase gates invoke `pnpm check` literally and must not acquire new failure modes |
| Turbo | Added as an additive task graph over existing scripts | No Stage 1 command is rerouted through turbo |
| Hook safety | `post-checkout`/`post-merge` exit 0 inside any linked worktree | Verified necessary: `git worktree add` really does fire `post-checkout` |
| History | Linearize the fork before F1 starts | Every phase base must be one commit; the verifier enforces exactly one parent |

## Design

### F0 — Linearize the history (prerequisite, not a phase)

`b3ec1b2` currently has two children. The plan-branch commits after it touch only `PROGRESS.md`, so
rebasing `codex/ai-tooling-design` onto `ec88ca3` produces the linear line

```text
b3ec1b2 -> ec88ca3 (Phase 1, approved) -> <PROGRESS.md commits> -> F1 -> F2 -> Phase 2
```

with no product-file conflict. This is bookkeeping, carries no manifest, and needs no gate. It must
happen before the F1 worktree is created, because the F1 worktree branches from the approved tip.

### F1 — Repository foundation and pnpm 11

**Editor and line-ending contracts.** `.editorconfig` is created with the reference settings: UTF-8,
two-space indent, final newline, trimmed trailing whitespace, LF, 120-column guide, and the Markdown
carve-out that disables both the column guide and trailing-whitespace trimming — Markdown uses two
trailing spaces as a hard line break. `.gitattributes` is extended, not rewritten: `.husky/* text
eol=lf` so hooks stay executable under a POSIX shell, `*.bat`/`*.cmd` at CRLF, and `*.tgz binary` so
a packed tarball is never line-ending converted.

**Settings migration.** The three behavioural keys move out of `.npmrc` and into
`pnpm-workspace.yaml` in camelCase (`engineStrict`, `nodeLinker`, `sharedWorkspaceLockfile`).
`.npmrc` survives as a documented, behaviourally empty file. The official codemod performs the bulk
of the move; its output is reviewed line by line rather than trusted, because it also rewrites keys
this repository does not use.

**Dependency single-sourcing.** `catalog:` and `catalogs:` collect every shared version in
`pnpm-workspace.yaml`, with `catalogMode: strict` so an inline version that bypasses the catalog is
an error rather than a silent divergence. This is what makes F2 a small, reviewable edit.

The catalog deliberately stops at the workspace boundary of `packages/ai-tooling`. Its runtime
dependencies keep literal pins. This is not conservatism: `check-package-contents.mjs` builds into a
private staging root **outside** the workspace and runs `pnpm pack` there, and a `catalog:`
specifier cannot resolve outside a workspace. The probe result is recorded in Grounding. Revisiting
this requires changing Phase 1 code, which is out of scope.

**Supply chain.** `allowBuilds: {}` denies install-time script execution to every dependency;
`minimumReleaseAge` imposes a delay before a newly published version is eligible. Both are declared
even though devkit's dependency set is small, because the cost of declaring them now is a line each
and the cost of retrofitting them after an incident is not.

**Structural guards.** Four scripts under `scripts/`, each exiting non-zero on violation:

- `check-circular.mjs` — the declared workspace dependency graph is acyclic.
- `check-workspace-boundaries.mjs` — no relative import resolves outside its own workspace
  directory. pnpm's isolated linker already blocks phantom *package* imports; a deep relative path
  such as `../../other-package/src/x` sidesteps package boundaries entirely and nothing else in this
  repository looks for it.
- `check-audit.mjs` — a bounded, offline-tolerant wrapper over `pnpm audit` with an explicit
  advisory ignore list, so an unreachable registry fails loudly rather than silently passing.
- `check-licenses.mjs` — an allowlist of acceptable licenses. This is the script that finally
  produces the `dependency-license-conflict` finding class the Stage 1 artifact scanner already
  declares but nothing currently emits.

**Hooks.** `.husky/post-checkout` and `.husky/post-merge` reinstall dependencies when dependency
metadata changed across the move. Both begin with a hard guard:

```sh
[ "$(git rev-parse --git-dir)" = "$(git rev-parse --git-common-dir)" ] || exit 0
```

A linked worktree is thereby excluded outright. The probe recorded in Grounding shows why this is
required rather than defensive: `git worktree add` genuinely fires `post-checkout`, and it passes
`$3=1`, so the reference project's `[ "$3" = "1" ] || exit 0` test does **not** filter it. The
reference hook survives only because the subsequent `git diff` against an all-zero `$1` fails and
leaves the changed-file list empty — an accident, not a guarantee. A phase worktree installs with
the exact `pnpm install --frozen-lockfile --ignore-scripts` the phase protocol specifies, and no
hook may pre-empt that. `SKIP_HUSKY_AUTO_SYNC=1` is retained as a secondary manual escape.

**Task orchestration.** `turbo.json` declares `build`, `typecheck`, `lint`, and `test` with explicit
inputs and outputs. It is added *alongside* the existing scripts. No Stage 1 command is rerouted
through it, so a turbo cache miss or misconfiguration can never change the result of a phase gate.

**Changelog fragments.** `changelog.d/` with a `README.md` and `_template.md` carrying the
reference's front-matter shape (`type`, optional `scope`, optional `ticket`, `breaking`) plus the
`changelog`/`notes`/`qa` sections, together with `scripts/changelog-new.mjs` and
`scripts/changelog-assemble.mjs`, and an empty `CHANGELOG.md`. Fragments accumulate from Stage 1
Phase 2 onward; F1 itself adds no fragment, because a foundation phase has no user-visible change.

**Agent configuration.** `.claude/settings.json` enables the plugins the owner already uses
(superpowers, context7, typescript-lsp, security-guidance, code-simplifier) and allowlists the
specific devkit build/test commands, so routine phase work stops prompting. The reference `handoff`
skill is ported to `.claude/skills/handoff/SKILL.md`.

This creates no conflict with the product. `@evk-soft/ai-tooling` generates `.claude/rules/**` and
`.claude/skills/**` from the canonical pack; `settings.json` is not a generated path, and the ported
`handoff` skill is authored under a name the pack does not claim. The F1 plan must nonetheless
assert that overlap explicitly, because it is the one place where infrastructure and product write
into the same directory tree.

**Version and CI.** Root `package.json` moves to `packageManager: pnpm@11.20.0`;
`.github/workflows/ci.yml` moves its `corepack prepare` line to match. `pnpm-lock.yaml` is
regenerated by pnpm 11 and its format version changes — expected, and reviewed as a lockfile diff
rather than read line by line.

### F2 — Compiler upgrade

TypeScript `^6.0.3` → `^7.0.2` and Biome `^2.5.6` → `^2.5.7`, in root `package.json` and
`configs/typescript-config/package.json`, via the catalog F1 established. Vitest is already at
4.1.10 and is not touched.

The mechanical work is small; the risk is not. TypeScript 7 is a reimplementation, and Phase 1 code
depends on `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, and `verbatimModuleSyntax`.
Source changes are plausible, and this phase exists precisely so that they are reviewed in isolation
rather than mixed into infrastructure churn.

The blast radius is wider than the two manifests suggest. The toolchain is pinned 39 times across 7
plan documents, and a Tech Stack line that disagrees with the tree is exactly the kind of drift the
Stage 1 protocol treats as a stop condition (master plan §0.1a: if a phase plan and the master
differ, stop and obtain a written amendment). F2 therefore amends all 39 occurrences coherently in
the same commit as the version bump, and re-runs the full Phase 1 gate against the upgraded
toolchain to prove the approved tree still holds.

## Binding constraints on Stage 1

These are the properties an F1/F2 implementation plan must assert, not merely respect.

1. **Literal Stage 1 commands keep working.** At minimum `pnpm check`,
   `pnpm --filter @evk-soft/ai-tooling run typecheck`, `run test:unit`, `run test:integration`,
   `run build`, `run pack:check`, plus `node packages/ai-tooling/scripts/verify-phase-delta.mjs` and
   `check-stage1-artifacts.mjs`. Each is re-run at both phase gates.
2. **`verify-phase-delta.mjs` bytes are untouched.** Phases 2-5 require
   `git diff --exit-code HEAD -- packages/ai-tooling/scripts/verify-phase-delta.mjs` before use.
   Neither F1 nor F2 may modify it — including incidentally, via the formatter.
3. **Formatter scope.** F1 changes `pnpm-workspace.yaml`, `turbo.json`, and JSON under `.claude/`.
   `biome check .` must be run and its effect on Phase 1 paths confirmed to be nil before staging;
   a formatter write that touches a product path is a stop condition.
4. **One commit per phase, closed manifest, owner stop.** F1 and F2 each carry their own manifest
   under `docs/superpowers/plans/manifests/`, follow the master plan §0.3 protocol, and end in
   exactly one commit with exactly one parent.

## Risks

| Risk | Likelihood | Handling |
|---|---|---|
| pnpm 11 changes install layout enough to break Phase 1's isolated-linker assumptions | medium | `nodeLinker: isolated` is carried across explicitly; the full Phase 1 gate is the acceptance test |
| The codemod rewrites keys devkit does not use, or drops one it does | medium | Codemod output is reviewed line by line; the three known keys are asserted present afterwards |
| `pnpm pack` behaviour shifts under pnpm 11 and breaks `pack:check` | medium | `pack:check` is a named F1 gate command; the bounded gzip/tar reader is unaffected, only the pnpm invocation could be |
| TypeScript 7 rejects Phase 1 source | medium | Isolated in F2 behind its own gate; if it rejects, F2 fails without contaminating F1 |
| The 39 pinned Tech Stack lines drift out of sync with the tree | high if unmanaged | F2 amends all of them in the same commit; a post-commit grep asserts zero stale pins |
| `.claude/**` collides with product-generated paths later | low | F1 asserts the disjointness explicitly; only `settings.json` and the `handoff` skill are authored |
| A husky hook fires inside a phase worktree and dirties it | verified possible | Structural linked-worktree guard, verified by probe, not an env-var convention |

## Phased delivery

| Phase | Contents | Gate |
|---|---|---|
| F0 | Rebase the plan branch onto `ec88ca3` | None; bookkeeping, verified by `git log --graph` showing one line |
| F1 | Foundation files, guard scripts, hooks, turbo, changelog, `.claude/**`, pnpm 11 | Full Phase 1 gate re-run, manifest-scoped delta, one commit, owner stop |
| F2 | TypeScript 7, Biome 2.5.7, 39 plan-document amendments | Same, plus a grep asserting no stale version pin remains |

## Open questions

1. **Does `minimumReleaseAge` obstruct the Stage 1 workflow?** It delays adoption of new versions.
   Stage 1 pins exact versions and does not update them, so the expected impact is nil — but this
   should be confirmed during F1 rather than assumed.
2. **Should `.claude/settings.json` be committed or left local?** Committing it shares the plugin
   set and the allowlist with any future contributor; it also commits a preference. The reference
   project commits it and keeps `settings.local.json` untracked. This design follows the reference,
   but it is the owner's call.
3. **Does the Bun smoke job survive pnpm 11?** CI runs `bun ./scripts/runtime-check.mjs` without
   pnpm, so it should be unaffected; to be confirmed in F1's CI review.

## Review gate

The owner reviews this document before any implementation plan is written. Approval of this design
authorizes writing the F1/F2 implementation plan via `superpowers:writing-plans`; it does not
authorize touching a single repository file. F1 execution requires its own explicit approval of that
plan, and F2 requires approval of the F1 commit first.
