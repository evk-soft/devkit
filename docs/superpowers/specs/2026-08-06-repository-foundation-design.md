# Repository Foundation Design

**Date:** 2026-08-06
**Status:** Draft — revision 3, awaiting owner approval
**Profile:** infrastructure — repository configuration, guard scripts, and toolchain versions; no
product behaviour change and no edit to `@evk-soft/ai-tooling` source
**Scope:** `.editorconfig`, `.gitattributes`, `.gitignore`, `.npmrc`, `pnpm-workspace.yaml`,
`pnpm-lock.yaml`, root `package.json`, `biome.json`, `configs/biome-config/**`,
`configs/typescript-config/package.json`, `.github/workflows/ci.yml`, `.husky/post-checkout`,
`.husky/post-merge`, `turbo.json`, `changelog.d/**`, `CHANGELOG.md`, `scripts/**`, `.claude/**`, and
the pinned toolchain lines of `docs/superpowers/plans/**`
**Depends on:** Stage 1 Phase 1 commit `ec88ca3`, owner-approved 2026-08-06
**Reference implementation:** `D:\disk.w\Projects\Slotegrator\Projects\non-restrict-proxy`

**Revision 2** incorporated a three-model adversarial audit of revision 1: it removed one false
Grounding claim, corrected four overstated mechanisms, and added four blocking constraints.
Findings from that pass are marked **[audit]**.

**Revision 3** records four owner decisions and the design change the first of them produced: the
Biome version stops being written into 12 files, Node.js becomes the declared default runtime with
Bun frozen rather than removed, `.claude/settings.json` is committed with runtime paths ignored, and
CI gains a Windows job. Owner decisions are marked **[owner]**. There are no open questions left.

## Goal

Bring devkit to the monorepo baseline the owner already operates in the reference project, without
disturbing the Stage 1 safe core. Two separately gated phases:

- **F1 — repository foundation and pnpm 11.** Editor and line-ending contracts, ignore rules,
  dependency-version single sourcing, supply-chain posture, structural guard scripts, changelog
  fragment infrastructure, task orchestration, agent configuration, and the pnpm 10 → 11 upgrade
  **together with every pnpm version pin in the plan documents**.
- **F2 — compiler upgrade.** TypeScript 6.0.3 → 7.0.2 and Biome 2.5.6 → 2.5.7, isolated behind their
  own gate because TypeScript 7 is a reimplemented compiler and Phase 1 code depends on strict
  inference flags.

pnpm belongs in F1 because pnpm 11 changes *where and how* every setting F1 writes is spelled;
deferring it would mean authoring those settings twice.

Success is demonstrated when, after each phase, every literal command the Stage 1 Phase 2-5 plans
invoke still exits 0 against the Phase 1 tree, and the Phase 1 gate evidence reproduces.

## Non-goals

- No change to any file under `packages/ai-tooling/**` or `configs/ai/**`. Foundation work is not
  permitted to alter product bytes. Where a foundation change *would* require touching that tree,
  this document records it as a constraint instead of doing it.
- No amendment of `ec88ca3`. It is the approved Phase 1 commit and is final.
- No replacement of the existing `check`, `check:biome`, `check:runtime`, or `format` scripts.
- No new CI provider, no GitLab CI, no Playwright, no Drizzle, no React tooling. The reference
  project is a source of patterns, not a template to mirror.
- No publication, no push, and no PR. Both phases stop at a local commit plus owner review.
- No dependency upgrade beyond the named tools. `pnpm update --latest` is out of scope.
- No modification of `.husky/pre-commit`. Stage 1 leaves current hooks untouched and the phase
  protocol depends on that file's exact current bytes.
- No changelog fragment authored by any Stage 1 phase. See binding constraint 5.

## Grounding

Every row was verified against the working tree, live command output, or vendor documentation on
2026-08-06, and re-verified after the audit. Rows that revision 1 asserted without evidence have
been removed rather than softened.

| Current or external fact | Evidence |
|---|---|
| All text is already normalized to LF in repository and checkout | `.gitattributes:1` |
| `.npmrc` already carries three behavioural settings in pnpm-10 kebab-case | `.npmrc:1-3` |
| The workspace covers exactly `configs/*` and `packages/*` | `pnpm-workspace.yaml:1-3` |
| Root scripts are exactly `check`, `check:biome`, `check:runtime`, `format`, `prepare` | `package.json:21-27` |
| The declared baseline is pnpm 10.28.0, Node >=24, TypeScript ^6.0.3, Biome ^2.5.6 | `package.json:5-8`, `package.json:28-32` |
| CI pins pnpm 10.28.0, runs `pnpm check` on Ubuntu only, plus a Bun runtime smoke job | `.github/workflows/ci.yml:11`, `:20`, `:36`, `:38-47` |
| **[corrected]** On F1's actual base `ec88ca3`, `pnpm check` already runs every Stage 1 gate command | worktree `package.json:22-23` — `check` includes `check:ai-tooling`, which is `pnpm --filter @evk-soft/ai-tooling run check` = `typecheck && test && pack:check`; `test` is `test:unit && test:integration` and `pack:check` runs `build` first |
| CI uses mutable action tags and declares no `permissions:` block | `.github/workflows/ci.yml:13-14`, `:25`, `:43` |
| The pre-commit hook formats the tree and then stages everything; it is mode `100644` | `.husky/pre-commit:1-2`, `git ls-files -s .husky/pre-commit` |
| devkit has no `.editorconfig`, no `.claude/`, no `turbo.json`, no `changelog.d/`, and exactly one file in `scripts/` | directory listing, 2026-08-06 |
| **[audit]** `.gitignore` contains no entry matching `claude`, `turbo`, or `idea` | `Select-String` over `.gitignore`, 0 matches each |
| **[audit]** Biome 2.5.6 is pinned in the `$schema` URL of 12 tracked JSON files | `biome.json:2`, `configs/biome-config/biome.preset.json:2`, `configs/biome-config/presets/*.json:2` (10 files) |
| Biome ships its configuration schema inside the npm package | `node_modules/@biomejs/biome/configuration_schema.json`, 576117 bytes |
| Biome documents a relative `$schema` path as a supported alternative to the versioned URL | https://biomejs.dev/reference/configuration — `"./node_modules/@biomejs/biome/configuration_schema.json"` |
| That relative path resolves from both the repository root and `configs/biome-config/` | `Test-Path` both locations, `True` |
| `biome migrate` updates `$schema` automatically, so hand-editing is never required | https://biomejs.dev — Biome v1.5 release notes |
| Biome v2 supports nested configs via `"extends": "//"`, and devkit's root config already extends the shared preset | https://biomejs.dev/guides/big-projects, `biome.json:3` |
| `@evk-soft/biome-config` is published and its Biome peer range is `^2.3.11` — a range, not a pin | `configs/biome-config/package.json` |
| `$schema` is an editor affordance only; Biome does not read it to select behaviour | https://biomejs.dev/reference/configuration |
| **[audit]** `biome.json` is owned by the Phase 1 and Phase 3 manifests | `manifests/ai-tooling-stage-1-phase-1.txt`, `-phase-3.txt` |
| Bun is declared in the published contract of two packages, not only in CI | `packages/runtime-detect/package.json` and `configs/biome-config/package.json` both declare `engines.bun >= 1.3.0`; `configs/biome-config/presets/bun.json` is an exported entry point |
| `configs/biome-config` declares `engines.pnpm >= 10.28.0`, which pnpm 11.20.0 satisfies | `configs/biome-config/package.json` |
| **[audit]** `configs/typescript-config` is a public package whose TypeScript constraint is a peer range excluding 7.x | `configs/typescript-config/package.json:15` — `"typescript": "^5.9.3 \|\| ^6.0.0"`, with `private: false` |
| **[audit]** The Biome preset sets `lineWidth: 100` | `configs/biome-config/biome.preset.json` |
| **[audit]** No phase manifest lists any `changelog.d/*` or `CHANGELOG.md` path | `Select-String` over `manifests/*.txt`, 0 matches |
| **[audit]** Phase plans contain literal executable pnpm-version commands, not just prose | `phase-3-implementation.md:4596` `corepack install --global pnpm@10.28.0`; `phase-1-implementation.md:60` throws unless `$pnpmVersion` is exactly `10.28.0` |
| **[audit]** `check-package-contents.mjs` requires root `packageManager` to match `^pnpm@\d+\.\d+\.\d+$` and resolves that exact version from the corepack cache | `packages/ai-tooling/scripts/check-package-contents.mjs:263-274`, with `COREPACK_ENABLE_AUTO_PIN: '0'` at `:341` |
| **[audit]** The manifest grammar admits only mode `100644` | `packages/ai-tooling/scripts/verify-phase-delta.mjs` manifest regex |
| pnpm restricts `.npmrc` to registry and auth settings; all other settings live in `pnpm-workspace.yaml` | https://pnpm.io/settings, https://pnpm.io/cli/config |
| pnpm 11 consolidates configuration into `pnpm-workspace.yaml` and merges the build-dependency settings into one `allowBuilds` map | https://pnpm.io/migration, https://pnpm.io/blog/2025/12/29/pnpm-in-2025 |
| **[audit]** The v10 → v11 codemod is invoked as `pnpx codemod run pnpm-v10-to-v11` | https://pnpm.io/migration |
| `minimumReleaseAge` delays adoption of freshly published versions | https://pnpm.io, reference `pnpm-workspace.yaml:179` (value `10080`) |
| **[audit]** Biome 2.5.7 was published 2026-08-04 and pnpm 11.20.0 on 2026-08-03 — 2 and 3 days before this design | `npm view <pkg> time` |
| **[audit]** The reference project deliberately holds TypeScript at 6.x and names the TS7 Go compiler as the reason | reference `pnpm-workspace.yaml:120-122`, `:148-153` |
| **[audit]** The reference project tracks `.claude/settings.local.json` | `git ls-files --error-unmatch` succeeds in the reference |
| **[audit]** The reference ignores Claude Code runtime paths | reference `.gitignore` — `**/.claude/agent-memory/`, `**/.claude/worktrees/` |
| Current published versions: pnpm 11.20.0, TypeScript 7.0.2, Biome 2.5.7, Vitest 4.1.10, turbo 2.10.8 | npm `dist-tags`, 2026-08-06 |
| Vitest is already at the current release, so neither phase touches it | `packages/ai-tooling/package.json` pins `vitest` at `4.1.10` |
| `pnpm pack` fails on a `catalog:` specifier outside a workspace, with `ERR_PNPM_CATALOG_ENTRY_NOT_FOUND_FOR_SPEC` | local probe, 2026-08-06; independently reproduced by the audit |
| Phase 1 packs from a private staging root that is outside the workspace | `packages/ai-tooling/scripts/check-package-contents.mjs` |
| `git worktree add` fires `post-checkout` with `$3=1` and an all-zero `$1` | local probe, 2026-08-06; independently reproduced by the audit |
| Inside a linked worktree `git rev-parse --git-dir` and `--git-common-dir` differ; in the main worktree they are equal | same probe |
| The reference project has `check-circular.mjs` and `check-workspace-boundaries.mjs`, but **no** `check-audit.mjs` or `check-licenses.mjs` | reference `scripts/` listing |
| The reference `check-circular.mjs` imports helpers from `./shared/index.mjs`, so it is not a drop-in copy | reference `scripts/check-circular.mjs:7-18` |
| The reference `handoff` skill exists and is 3325 bytes | reference `.claude/skills/handoff/SKILL.md` |
| `b3ec1b2` has two children — `ec88ca3` and the plan-branch line — so the history is currently forked | `git log`, 2026-08-06 |

### Claims removed after audit

Revision 1 asserted that the Stage 1 artifact scanner *already declares* a
`dependency-license-conflict` finding class that nothing produces. **This is false.** The implemented
scanner emits exactly `private-marker`, `credential-pattern`, `schema-byte-mismatch`,
`unexpected-executable`, and `undeclared-entry`; the string appears only in plan prose. The scanner
also walks only `packages/ai-tooling` and `configs/ai`, so a root-level `check-licenses.mjs` could
not feed it in any case. The row is deleted and `check-licenses.mjs` is justified on its own merits.

## Decisions

| Fork | Decision | Consequence |
|---|---|---|
| pnpm upgrade placement | Move pnpm 10 → 11 into F1 | Settings are authored once, in their final v11 shape; F2 carries only compiler risk |
| **[audit]** pnpm version pins | Amend every pnpm pin **inside F1's own commit**, not in F2 | Phase 3 carries a literal `corepack install --global pnpm@10.28.0`; leaving it would silently downgrade the toolchain mid-Stage-1 |
| `.gitattributes` | Extend only where behaviour actually changes | The LF guarantee Phase 1 rests on is already in force |
| `.npmrc` | Keep the file, empty it of behavioural keys, document the v11 rule in a comment | A contributor who adds a behavioural key there is told why it is ignored |
| Catalog reach | Catalogs cover the root and `configs/*` only; `packages/ai-tooling` keeps literal pins | Verified: a `catalog:` specifier would break the Phase 1 `pack:check` gate |
| **[audit]** `catalogMode: strict` | Adopt it, but claim only what it does — an **add-time** guard for `pnpm add` | It does not retroactively forbid inline versions; the reference runs it with 50 inline specs |
| Build scripts | `allowBuilds: {}` as an explicit empty allowlist | Documents intent; see the F1 text for what pnpm 11 actually does when an unlisted build appears |
| **[audit]** Supply-chain delay | Set `minimumReleaseAge` to a value chosen against F2's target publish dates, with an explicit exclude list if needed | A 7-day delay copied from the reference would block F2's own Biome and pnpm targets |
| New guard scripts | `check-audit.mjs` and `check-licenses.mjs` are written from scratch | Honest effort accounting; the reference has no such files |
| Ported guard scripts | `check-circular.mjs` and `check-workspace-boundaries.mjs` are adapted, not copied | They import reference-only helpers and assume a 49-workspace layout devkit does not have |
| **[audit]** Guard wiring | New guards get their own scripts and CI steps; `pnpm check` keeps its current *script definition* — but the widened `biome check .` surface is acknowledged, not denied | New files under `scripts/` do enter the lint surface; they must be lint-clean before the F1 gate |
| **[owner]** Formatter version references | Replace all 12 `$schema` URLs with the relative path into the installed package, in F1 | The Biome version stops being written down anywhere except the catalog; F2's Biome work collapses to one line |
| **[owner]** Default runtime | Node.js is the default and only runtime the toolchain and gates target | Bun receives no new investment; the existing smoke job is kept but never extended |
| Turbo | Added as an additive task graph, pinned via the catalog at 2.10.8 | No Stage 1 command is rerouted through it |
| Hook safety | `post-checkout`/`post-merge` exit 0 inside any linked worktree | Verified necessary: `git worktree add` really does fire `post-checkout` with `$3=1` |
| Agent configuration | Commit `.claude/settings.json` and the ported skill; ignore every Claude Code runtime path | Owner decision, 2026-08-06. Sharing the tool configuration is the goal; sharing agent scratch state would break the phase gate |
| **[audit]** Ignore rules | `.gitignore` gains the `.claude/` runtime paths, `.turbo/`, and `.idea/` in the same F1 commit | Every one of these would otherwise appear as an untracked path and fail the phase manifest check |
| History | Linearize the fork before F1 starts | Every phase base must be one commit; the verifier enforces exactly one parent |

## Design

### F0 — Linearize the history (prerequisite, not a phase)

`b3ec1b2` currently has two children: `ec88ca3` (the phase commit) and the plan-branch line, which
holds `PROGRESS.md` updates and this design document. **[audit]** Revision 1 wrongly said the
plan-branch commits touch only `PROGRESS.md`; this document is on that branch too. The conclusion is
unchanged — none of them touch a product file, so rebasing `codex/ai-tooling-design` onto `ec88ca3`
produces

```text
b3ec1b2 -> ec88ca3 (Phase 1, approved) -> <docs commits> -> F1 -> F2 -> Phase 2
```

with no conflict. This is bookkeeping, carries no manifest, and needs no gate. It must happen before
the F1 worktree is created.

### F1 — Repository foundation and pnpm 11

**Ignore rules — do this first.** `.gitignore` gains, in one edit:

- every Claude Code runtime path under `.claude/` — at minimum `agent-memory/`, `worktrees/`,
  `notes/`, `shell-snapshots/`, `todos/`, `history*`, `*.lock`, and `settings.local.json`
- `.turbo/`, which turbo writes at the root and per workspace on first invocation
- `.idea/`, which is untracked in the checkout right now and which the master plan §0.2 already
  names as a contamination hazard

**[audit]** This is not housekeeping, it is a prerequisite. The phase protocol requires every
tracked *and untracked* path reported by `git status --untracked-files=all` to be permitted by the
phase manifest. Phases 2-5 are executed by Claude Code inside a worktree; the first agent write
under `.claude/`, or the first turbo invocation, would otherwise fail the gate. The exact runtime
path list must be re-derived from the installed Claude Code version during F1 rather than copied
from this document.

**Editor and line-ending contracts.** `.editorconfig` is created with UTF-8, two-space indent, final
newline, trimmed trailing whitespace, LF, and the Markdown carve-out that disables trailing-
whitespace trimming — Markdown uses two trailing spaces as a hard line break. **[audit]** Its
`max_line_length` is **100**, matching `configs/biome-config/biome.preset.json`, not the reference's
120; a committed editor guide that advertises a width the repository formatter rejects is worse than
no guide.

`.gitattributes` is extended only where behaviour actually changes. **[audit]** Revision 1 proposed
`.husky/* text eol=lf` justified as keeping hooks executable; both halves were wrong — `* text=auto
eol=lf` at line 1 already covers `.husky/*`, and line endings have nothing to do with the executable
bit (the tracked hook is mode `100644` and husky invokes it through `sh`). What remains worth adding
is `*.bat`/`*.cmd` at CRLF as a forward guard for any future Windows script.

**Settings migration.** The three behavioural keys move from `.npmrc` into `pnpm-workspace.yaml` in
camelCase: `engineStrict`, `nodeLinker`, `sharedWorkspaceLockfile`. `.npmrc` survives as a
documented, behaviourally empty file. `pnpx codemod run pnpm-v10-to-v11` performs the bulk of the
move; its output is reviewed line by line rather than trusted, because it also rewrites keys this
repository does not use. `pnpm-lock.yaml` is regenerated and reviewed as a diff. **[audit]**
Revision 1 asserted the lockfile *format version* changes; that was unverified and is withdrawn —
the current file declares `lockfileVersion: '9.0'` and F1 simply reviews whatever the regeneration
produces.

**Dependency single-sourcing.** `catalog:` and `catalogs:` collect shared versions in
`pnpm-workspace.yaml`, with `catalogMode: strict`. **[audit]** Revision 1 claimed strict mode makes
an inline version an error; it does not — it governs how `pnpm add` writes new dependencies. The
honest benefit is narrower: versions that *are* catalogued live in one place, so F2's Biome bump is
a one-line edit for the catalogued entries. The `$schema` pins are a separate problem, addressed in
F2.

Catalogs deliberately stop at the workspace boundary of `packages/ai-tooling`, whose runtime
dependencies keep literal pins. `check-package-contents.mjs` builds into a private staging root
**outside** the workspace and runs `pnpm pack` there, and a `catalog:` specifier cannot resolve
outside a workspace.

**[audit] Corepack prerequisite.** `check-package-contents.mjs:263-274` reads root `packageManager`,
requires it to match `^pnpm@\d+\.\d+\.\d+$`, and resolves that exact version from the corepack
cache — with network access disabled. Two consequences F1 must handle explicitly:

1. pnpm 11.20.0 must be present in the corepack cache of every machine that runs `pack:check`,
   provisioned before the F1 gate. This is an execution precondition, not a code change.
2. The integrity-hash form `pnpm@11.20.0+sha512-…`, which is the usual hardening for
   `packageManager`, is **rejected** by that regex. F1 therefore uses the plain form. Adopting the
   hash form would require editing a Phase 1 file, which is out of scope; it is recorded as future
   work.

**Supply chain.** `allowBuilds: {}` declares an explicit empty allowlist. **[audit]** Revision 1
claimed this switches off "the dominant supply-chain vector"; the honest statement is narrower.
Neither checkout currently has a dependency with an install script, and pnpm already denies
unapproved builds by default. What the declaration buys is that the decision is written down. F1
must also confirm the pnpm 11 behaviour when an unlisted build *does* appear — the documented
behaviour is a failing install rather than a silent skip, and if pnpm instead writes a placeholder
back into `pnpm-workspace.yaml`, that write would dirty a worktree the phase protocol requires
clean. CI installs without `--ignore-scripts` (`ci.yml:34`), so CI is where this would surface.

`minimumReleaseAge` is adopted, but **[audit]** its value is chosen against F2's actual targets, not
copied. Biome 2.5.7 is 2 days old and pnpm 11.20.0 is 3 days old as of this document; the
reference's 7-day setting would block the very next phase. F1 either sets a value that admits them
or adds an explicit exclude, and records which.

**Structural guards.** Four scripts under `scripts/`, each exiting non-zero on violation:

- `check-circular.mjs` — the declared workspace dependency graph is acyclic.
- `check-workspace-boundaries.mjs` — no relative import resolves outside its own workspace
  directory. pnpm's isolated linker already blocks phantom *package* imports; a deep relative path
  such as `../../other-package/src/x` sidesteps package boundaries entirely and nothing else in this
  repository looks for it.
- `check-audit.mjs` — a bounded wrapper over `pnpm audit` with an explicit advisory ignore list, so
  an unreachable registry fails loudly rather than silently passing.
- `check-licenses.mjs` — an allowlist of acceptable dependency licenses, reporting to its own exit
  code. **[audit]** It does **not** feed the Stage 1 artifact scanner; that justification was based
  on a false premise and is withdrawn.

**[audit]** All four are committed as mode `100644`, never `100755`: the phase manifest grammar
admits only `100644`, and every reference script is `100755`, so a straight copy would fail the
gate. They are invoked via `node scripts/<name>.mjs`, so the executable bit is not needed.

**Hooks.** `.husky/post-checkout` and `.husky/post-merge` reinstall dependencies when dependency
metadata changed. Both begin with a hard guard:

```sh
[ "$(git rev-parse --git-dir)" = "$(git rev-parse --git-common-dir)" ] || exit 0
```

A linked worktree is thereby excluded outright. The probe recorded in Grounding shows why this is
required rather than defensive: `git worktree add` genuinely fires `post-checkout` and passes
`$3=1`, so the reference project's `[ "$3" = "1" ] || exit 0` test does **not** filter it. The
reference survives only because the subsequent `git diff` against an all-zero `$1` fails and leaves
the changed-file list empty — an accident, not a guarantee. A phase worktree installs with the exact
`pnpm install --frozen-lockfile --ignore-scripts` the protocol specifies, and no hook may pre-empt
that. `SKIP_HUSKY_AUTO_SYNC=1` is retained as a secondary manual escape. Both hooks are mode
`100644`, matching the existing `.husky/pre-commit`.

**Lint surface.** **[audit]** Revision 1 asserted that `pnpm check` acquires no new failure modes.
That was wrong: `check:biome` is `biome check .` over the whole tree, so the six new `.mjs` files
under `scripts/`, `turbo.json`, and the JSON under `.claude/` all enter the lint and format surface.
The script *definition* is unchanged, which is what Stage 1 depends on; the *input set* grows. F1
therefore requires the new files to be clean under the pinned Biome before staging, and re-runs
`biome check .` after writing them. If any new file cannot be made clean, it is excluded through
`biome.json#files.includes` — the mechanism the repository already uses for the Phase 1 fixture
carve-out — rather than by weakening a rule.

**[owner] Formatter version references.** The Biome version is currently written into the `$schema`
URL of 12 tracked files, which is 12 places to keep in sync for every Biome upgrade, forever. F1
removes the problem rather than managing it: every `$schema` becomes the relative path
`./node_modules/@biomejs/biome/configuration_schema.json`, which Biome documents as a supported
alternative and which always resolves to exactly the installed version. Verified to resolve from both
the repository root and `configs/biome-config/`.

Two things make this safe. `$schema` is an editor affordance — Biome does not read it to select
behaviour — so a wrong or unresolvable value cannot change formatting or linting. And the published
peer range of `@evk-soft/biome-config` is `^2.3.11`, a range: a `$schema` URL naming one exact
version was already advertising something narrower than the package actually accepts.

The honest cost: `configs/biome-config/**` is published, so an external consumer who opens a shipped
preset in an editor will find the relative path does not resolve from inside their `node_modules`.
That degrades an editor affordance for a file consumers read but do not edit, in exchange for
deleting 12 permanent sync points. If the owner prefers to keep URLs in the published files, the
fallback is `biome migrate`, which rewrites `$schema` automatically — but then the version is still
written down in 11 places, and the sync burden returns.

After this change the Biome version exists in exactly one place: the catalog entry in
`pnpm-workspace.yaml`.

**[owner] Runtime posture.** Node.js is the default and only runtime the toolchain, the gates, and
the guard scripts target. The existing Bun smoke job is kept — it runs `bun ./scripts/runtime-check.mjs`,
never invokes pnpm, and is therefore unaffected by the pnpm 11 upgrade — but it is not extended: no
Bun matrix, no Bun-specific scripts, no Bun task in `turbo.json`, and no Bun step added to any new
CI job. Removing it is deliberately *not* proposed, because Bun is not merely a CI convenience here:
`@evk-soft/runtime-detect` and `@evk-soft/biome-config` both declare `engines.bun >= 1.3.0` in their
published manifests, and `@evk-soft/biome-config` exports a `./presets/bun` entry point. Dropping Bun
is therefore a product decision about two published packages, out of foundation scope, and this
design deliberately adds no new coupling that would make that decision harder later.

**Task orchestration.** `turbo.json` declares `build`, `typecheck`, `lint`, and `test` with explicit
inputs and outputs, with turbo pinned in the catalog at 2.10.8. It is added *alongside* the existing
scripts; no Stage 1 command is rerouted through it, so a turbo cache miss can never change the
result of a phase gate.

**Changelog fragments.** `changelog.d/` with `README.md` and `_template.md` carrying the reference's
front-matter shape (`type`, optional `scope`, optional `ticket`, `breaking`) plus the
`changelog`/`notes`/`qa` sections, together with `scripts/changelog-new.mjs`,
`scripts/changelog-assemble.mjs`, and an empty `CHANGELOG.md`.

**[audit]** Revision 1 said fragments "accumulate from Stage 1 Phase 2 onward". That is impossible.
No Stage 1 phase manifest lists any `changelog.d/*` or `CHANGELOG.md` path, the manifests are
plan-owned and already approved, and `verify-phase-delta.mjs` rejects every extra path. Writing a
fragment during Phase 2 would fail that phase's gate. The infrastructure is therefore created dormant
in F1 and first used **after Phase 5**, unless the owner chooses to amend the four phase manifests
through the written-amendment protocol — which this design does not assume.

**Agent configuration.** `.claude/settings.json` is committed (owner decision, 2026-08-06) so that
every developer works with the same plugin set and the same allowlist. It enables superpowers,
context7, typescript-lsp, security-guidance, and code-simplifier. The reference `handoff` skill is
ported to `.claude/skills/handoff/SKILL.md`.

Because the file is committed, its `permissions.allow` list is a security surface, not a
convenience: an entry grants a command without a prompt on every checkout by every developer. F1
therefore allowlists only exact, argument-complete, repository-local commands — never a bare tool
name, never a wildcard, never anything that writes outside the repository or reaches the network.
The reviewed list is part of the F1 diff and is read entry by entry at the gate.

**[audit]** Note that the reference project tracks its own `settings.local.json`; devkit does not
follow it there. `settings.local.json` is the per-machine override and is ignored, so a developer can
deviate locally without changing shared state.

This creates no collision with the product. `@evk-soft/ai-tooling` generates `.claude/rules/**` and
`.claude/skills/**` from the canonical pack; `settings.json` is not a generated path, and the ported
`handoff` skill uses a name the pack does not claim. F1 asserts that disjointness explicitly, since
this is the one place where infrastructure and product write into the same tree.

**Version, pins, and CI.** Root `package.json` moves to `packageManager: pnpm@11.20.0` and
`.github/workflows/ci.yml` moves its `corepack prepare` line to match.

**[audit]** F1 also amends **every pnpm version pin in the plan documents in the same commit**.
Revision 1 deferred all pin amendments to F2, which would have left the tree on pnpm 11 while
`phase-3-implementation.md:4596` still instructs an executor to run `corepack install --global
pnpm@10.28.0`, and `phase-1-implementation.md:60` still throws unless the running pnpm is exactly
`10.28.0`. Those are executable commands, not prose. Leaving them would either downgrade the
toolchain mid-Stage-1 or hard-fail a phase entry snapshot.

CI additionally gains, while `ci.yml` is already open **[audit]**:

- a `permissions: contents: read` block at workflow level, and SHA-pinned action references. For a
  design whose stated posture is supply-chain hardening, a mutable third-party action tag running
  with default write-capable token scope is a larger exposure than an empty build allowlist over a
  dependency set with no install scripts.
- **[owner]** a Windows job. CI is Ubuntu-only today, this repository is developed on Windows, Phase 1
  code has a `platform === 'win32'` corepack branch that CI never exercises, and the Stage 1 protocol
  requires green Windows, Linux, and macOS jobs from Phase 3 onward. macOS is not added yet: it has
  no current failure mode and is due with Phase 3.
**[corrected]** Revision 3 additionally proposed a CI step invoking the `packages/ai-tooling` gate
commands, on the audit's finding that CI never runs them. That finding was read against the plan
branch, where Phase 1 does not exist. On F1's actual base `ec88ca3` the root `check` script already
chains `check:ai-tooling`, which expands to `typecheck && test && pack:check` — every command binding
constraint 1 names. No new step is required; the Windows job inherits the coverage by running
`pnpm check` like the Linux one. What F1 must instead verify is that `pack:check` can run on a CI
runner at all, since it resolves pnpm from the corepack cache with the network disabled.

The Bun job is left exactly as it is: not removed, not extended, not given new steps.

### F2 — Compiler upgrade

TypeScript `^6.0.3` → `^7.0.2` and Biome `^2.5.6` → `^2.5.7`. Vitest is already at 4.1.10 and is not
touched. pnpm is already done in F1.

**Biome's share of F2 is now one line.** The audit found the version pinned in the `$schema` URL of
12 tracked files; F1 replaces all 12 with the relative path into the installed package, so by the
time F2 runs there is nothing left to synchronize. The published peer range of
`@evk-soft/biome-config` is `^2.3.11` and already admits 2.5.7, so it needs no edit either. F2
therefore changes Biome in exactly one place: the catalog entry. This is the direct payoff of
treating the 12 pins as a design defect in F1 rather than as work to repeat at every upgrade.

**[audit] TypeScript's share is larger than revision 1 stated.**

- `configs/typescript-config/package.json` does **not** carry `^6.0.3`. It carries
  `"peerDependencies": { "typescript": "^5.9.3 || ^6.0.0" }` on a package published with
  `private: false`. The catalog mechanism does not apply to peer ranges. Widening this is a
  deliberate public-contract change — the range becomes something like `^6.0.0 || ^7.0.0` — and
  without it `pnpm install` reports an unmet peer once the root moves to TypeScript 7.

**[audit] The risk is higher than revision 1 assessed.** The reference project this design borrows
from explicitly refuses this exact bump: its `pnpm-workspace.yaml:120-122` holds TypeScript at
`^6.0.2`, annotated as "the last TS-authored release before the TS7 Go compiler", and
`updateConfig.ignoreDependencies` lists `typescript` with the note that it does not follow semver and
minor releases can tighten inference. Everything else in that file is current, so this is a
deliberate hold, not lag. F2 must either state why devkit's position differs or accept that the
phase may end in a decision to stay on TypeScript 6 — which is a legitimate outcome of the gate, not
a failure of it.

The blast radius in documentation is real. The four tool versions occur on 39 lines across 7 files
under `docs/superpowers/plans/`; **[audit]** that is a line count, not a count of Tech Stack
declarations, and one of the 7 files is `PROGRESS.md`, a state log rather than a plan. F1 removes the
pnpm subset; F2 amends the TypeScript and Biome remainder in the same commit as the version bump, and
a post-commit search asserts that no stale pin survives.

## Binding constraints on Stage 1

These are properties an F1/F2 implementation plan must **assert**, not merely respect.

1. **Literal Stage 1 commands keep working.** At minimum `pnpm check`,
   `pnpm --filter @evk-soft/ai-tooling run typecheck`, `run test:unit`, `run test:integration`,
   `run build`, `run pack:check`, plus `node packages/ai-tooling/scripts/verify-phase-delta.mjs` and
   `check-stage1-artifacts.mjs`. Each is re-run at both phase gates.
2. **`verify-phase-delta.mjs` bytes are untouched.** Phases 2-5 require
   `git diff --exit-code HEAD -- packages/ai-tooling/scripts/verify-phase-delta.mjs` before use.
   Neither phase may modify it — including incidentally, via the formatter.
3. **Formatter scope is verified, not assumed.** `biome check .` is run before staging and its
   effect on every Phase 1 path confirmed to be nil. A formatter write touching a product path is a
   stop condition.
4. **[audit] Every new tracked file is mode `100644`.** The manifest grammar admits nothing else.
5. **[audit] No Stage 1 phase authors a changelog fragment.** The phase manifests do not list those
   paths and cannot be extended without a written amendment.
6. **[audit] No agent or tool runtime state is left untracked-and-unignored.** `.claude/` runtime
   paths, `.turbo/`, and `.idea/` are ignored in F1, before any phase worktree is created.
7. **One commit per phase, closed manifest, owner stop.** F1 and F2 each carry their own manifest
   under `docs/superpowers/plans/manifests/`, follow master plan §0.3, and end in exactly one commit
   with exactly one parent.

## Risks

| Risk | Likelihood | Handling |
|---|---|---|
| **[audit]** pnpm 11.20.0 absent from the corepack cache breaks `pack:check` with the network disabled | high if unmanaged | Named as an explicit F1 precondition; provisioned and verified before the gate |
| **[audit]** TypeScript 7 rejects Phase 1 source | raised to high | The reference project refuses this bump on the record; F2 is isolated and may legitimately end in "stay on 6" |
| **[audit]** `minimumReleaseAge` blocks F2's own targets | high if copied from the reference | Value chosen against actual publish dates, with an exclude list if needed |
| pnpm 11 changes install layout enough to break Phase 1's isolated-linker assumptions | medium | `nodeLinker: isolated` carried across explicitly; the full Phase 1 gate is the acceptance test |
| The codemod rewrites keys devkit does not use, or drops one it does | medium | Output reviewed line by line; the three known keys asserted present afterwards |
| `pnpm pack` behaviour shifts under pnpm 11 and breaks `pack:check` | medium | `pack:check` is a named F1 gate command; the bounded gzip/tar reader is unaffected |
| **[audit]** An unlisted build script under pnpm 11 writes a placeholder into `pnpm-workspace.yaml` | medium | Behaviour confirmed during F1; CI is where it would first appear |
| Biome 2.5.7 reformats a Phase 1 product file | medium | F2 gate compares the product tree byte-for-byte; a product-path write is a stop condition |
| `.claude/**` collides with product-generated paths later | low | F1 asserts disjointness; only `settings.json` and the `handoff` skill are authored |
| A husky hook fires inside a phase worktree and dirties it | verified possible | Structural linked-worktree guard, verified by probe |

## Phased delivery

| Phase | Contents | Gate |
|---|---|---|
| F0 | Rebase the plan branch onto `ec88ca3` | None; verified by `git log --graph` showing one line |
| F1 | Ignore rules, foundation files, guard scripts, hooks, turbo, changelog scaffolding, `.claude/**`, pnpm 11, **all pnpm pin amendments**, **12 `$schema` sites made version-free**, CI hardening plus a Windows job | Full Phase 1 gate re-run on Windows and Linux, manifest-scoped delta, one commit, owner stop |
| F2 | TypeScript 7 and the public peer range; Biome via one catalog line; remaining plan amendments | Same, plus a search asserting no stale pin remains |

## Resolved by the owner, 2026-08-06

The three questions revision 2 left open are closed. They are recorded here rather than deleted, so
a later reader sees that they were decided rather than overlooked.

1. **Windows CI job — include it in F1.** The gap is real and already instantiated: CI is Ubuntu-only
   (`ci.yml:11`), the repository is developed on Windows, Phase 1 carries a `platform === 'win32'`
   corepack branch that CI never exercises, and Stage 1 requires green Windows, Linux, and macOS jobs
   from Phase 3 onward. `ci.yml` is already open in F1, so the marginal cost is one job block.
   macOS is deliberately *not* added yet — it is a Phase 3 requirement with no current failure mode,
   and adding it now would be scope for its own sake.
2. **Plugin review policy — keep the enabled set minimal and re-read it at every foundation gate.**
   `enabledPlugins` names plugins without versions, so an upstream plugin update changes shared
   behaviour with no repository diff. There is no pinning mechanism to reach for; the mitigation is
   to enable few plugins, list them in this design, and re-read the block at each gate. That is a
   process control, stated plainly rather than dressed up as a technical one.
3. **Bun — Node.js is the default; Bun is frozen, not removed.** See the runtime posture paragraph in
   F1. The smoke job never invokes pnpm and is unaffected by the upgrade, so keeping it costs
   nothing; extending it is prohibited, and removing it is a product decision about two published
   packages rather than a foundation change.

## Open questions

None. All questions raised by this design have been decided.

## Review gate

The owner reviews this document before any implementation plan is written. Approval authorizes
writing the F1/F2 implementation plan via `superpowers:writing-plans`; it does not authorize touching
a single repository file. F1 execution requires its own explicit approval of that plan, and F2
requires approval of the F1 commit first.
