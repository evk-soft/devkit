# AI Tooling Stage 1: Safe Core and Self-Hosting Design

**Date:** 2026-08-01
**Status:** Draft
**Profile:** feature — new packages, schemas, CLI behavior, generated files, and crash-recovery
contracts; zero bugfix signals
**Scope:** `configs/ai/**`, `packages/ai-tooling/**`, `packages/ai-tooling/README.md`, `.gitignore`,
`ai-tooling.config.json`, `ai-tooling.lock.json`, `.ai-tooling/**`, `AGENTS.md`, `CLAUDE.md`,
`.agents/**`, `.claude/**`, `.github/workflows/ai-tooling.yml`, and Stage 1 sections of
`docs/ai-tooling/**` and `docs/system-overview/ai-tooling.md`
**Depends on:** `docs/superpowers/specs/2026-08-01-ai-tooling-design.md`
**SSoT pointers:** `configs/ai/README.md`, `docs/system-overview/ai-tooling.md`,
`docs/ai-tooling/product-brief.md`, `docs/ai-tooling/decisions/0001-package-boundaries.md`, and
`docs/ai-tooling/research/devkit-baseline.md`

## Goal

Deliver the smallest safe and useful engine: a clean repository can initialize from an
instruction-only core pack, render deterministic Codex and Claude Code project outputs, detect
drift, recover an interrupted write without overwriting unknown bytes, and let `devkit` verify its
own generated files.

Success is demonstrated by this sequence on a clean `devkit` snapshot:

```text
no lock
  -> clean init
  -> pinned repository-local core pack
  -> sync
  -> edit one canonical pack resource
  -> explicit local-pack refresh
  -> sync
  -> check with an empty diff
```

The sequence must also pass injected-crash recovery and executable-capability rejection tests.

## Non-goals

- No adoption of existing AI files; any unmanaged target collision stops and points to Stage 2.
- No remote-version update, package removal, `import-edits`, configurable or time-based completed-
  backup retention, or concurrent mutation beyond one repository run lock.
- No Git-hook installation or modification; current hooks remain untouched in Stage 1.
- No Cursor, Gemini CLI, Antigravity, OpenAI plugin, or Claude Code plugin distribution adapter.
- No third-party capability catalog, platform installation, or broad discovery.
- No script, hook, MCP server, connector, executable, browser capability, or other activatable pack
  asset is copied to a platform path.
- No npm or marketplace publication.
- No implementation of source-code intelligence.

## Grounding

Target contracts come from the durable architecture; they are not claims about existing code.

| Current or external fact | Evidence |
|---|---|
| `configs/ai` and `packages/ai-tooling` fit existing workspace globs | `pnpm-workspace.yaml:1-3` |
| The implementation baseline is pnpm 10.28, Node.js 24, and TypeScript 5.9 | `package.json:5-7`, `package.json:28-31` |
| `configs/ai` currently contains only its design-phase README | `configs/ai/README.md:1-28` |
| The current hook is unsafe for generated-file checks because it writes and stages globally | `.husky/pre-commit:1-2` |
| Package, SSoT, lock, resolver, transaction, and security contracts are defined durably | `docs/system-overview/ai-tooling.md:108-940` |
| Required Stage 1 fixture families are defined durably | `docs/system-overview/ai-tooling.md:959-1036` |
| The public implementation cannot copy the private prototype | `docs/ai-tooling/research/migration-lessons.md:6-38` |
| The frozen worktree, target census, path history, and current ignore behavior are recorded | `docs/ai-tooling/research/devkit-baseline.md:15-102` |

The frozen census found no AI target, config, lock, or local-state path
(`docs/ai-tooling/research/devkit-baseline.md:54-69`). The Stage 1 plan must repeat that exact check
immediately before self-hosting; this observation is not permission to overwrite a path that appears
later.

## Decisions

| Fork | Decision | Consequence |
|---|---|---|
| Bootstrap | Implement strict clean-project `init` in Stage 1 | A first lock is possible without implementing unsafe adoption |
| Existing collisions | Treat every unmanaged target as blocking | Stage 1 never merges or assumes ownership of existing instructions |
| Self-host input | Use tracked repository-relative `configs/ai` with a digest | Self-hosting does not depend on an unpublished npm package or machine path |
| Local change | Add explicit `pack refresh-local <pack>` | Canonical edits never make `sync` silently mutate a frozen input digest |
| Sync behavior | Require the Stage 1 config digest and frozen pack selection to match the lock; update only output ownership records | Repeated sync cannot bless a source, range, platform, or policy change |
| Initial content | Include one independently reviewed rule, `evk-grounding`, and one instruction-only skill, `evk-plan` | Both rule and skill rendering are real without broad content migration |
| Adapter scope | Implement project outputs for Codex and Claude Code only | Stage 1 proves two different platform shapes without marketplace packaging |
| Executable trust | Reject every activatable asset before platform rendering | Forward-compatible schemas do not weaken the Stage 1 trust boundary |
| Recovery | Make ordinary `doctor` read-only and `doctor --repair` a separately confirmed mutation | Diagnostics never repair implicitly |
| Recovery conflict | Accept only journaled prior, candidate, or missing states | A post-crash user edit cannot be overwritten by repair |
| Lock state | Journal lock state as `absent` or `present(SHA-256)` | First-init rollback can restore the absence of a lock |
| Run-lock recovery | Reclaim a stale run lock only after same-host process identity is proven dead | A live or ambiguous owner always causes zero writes |
| Manual restore | Use compare-and-swap restore for one registered path after backup and confirmation of its observed state | Modified generated content can be discarded safely without a generic force flag |
| Schema identity | Export schemas from `@evk-soft/ai-tooling/schemas/*.json` and use an exact version-tagged GitHub raw URL as published `$id` | Editors and packs have a stable versioned identity without an unowned schema domain |
| CI | Run check-only commands and package tests | Continuous integration never repairs or installs anything |

## Design

### Repository-local state boundary

Before any command creates cache, state, journal, lock, backup, preview, or report content, Stage 1
adds the root-anchored `/.ai-tooling/` rule to `.gitignore`. The committed
`ai-tooling.lock.json` remains outside that directory and must not be ignored.

The load-bearing gate is:

```text
git check-ignore -v --no-index .ai-tooling/state.json
git check-ignore -v --no-index .ai-tooling/backups/probe
git check-ignore -v --no-index .ai-tooling/run.lock
git check-ignore -v --no-index .ai-tooling/reports/probe.json
git check-ignore -v --no-index ai-tooling.lock.json  # must report not ignored
```

The first four probes must resolve to the repository `.gitignore`; the lock probe must return the
documented not-ignored result. The frozen baseline proves that none of these paths is currently
ignored (`docs/ai-tooling/research/devkit-baseline.md:88-102`).

### Package and schema boundary

`configs/ai` becomes the package source for `@evk-soft/ai-pack-core` and contains canonical JSON
metadata plus Markdown instructions. `packages/ai-tooling` contains the engine, versioned JSON
schemas, CLI, Codex and Claude project adapters, fixtures, and tests. The first package versions are
`0.1.0`.

Stage 1 schemas cover config, pack, rule, skill, override, lock, and local state. Parsing rejects
duplicate JSON keys before ordinary parsing can discard them. Generated JSON uses UTF-8, LF, two
spaces, stable key order, and one final newline.

The initial core resources are deliberately small:

```text
configs/ai/
├── package.json
├── pack.json
├── rules/evk-grounding/
│   ├── rule.json
│   └── instructions.md
└── skills/evk-plan/
    ├── skill.json
    └── instructions.md
```

Their instruction bodies are written cleanly from the approved behavior, receive their own content
review, and contain no project-specific architecture, commands, branch policy, credentials, or
private prototype bytes.

The tooling package exposes this public map:

```text
@evk-soft/ai-tooling                         -> dist/index.js plus dist/index.d.ts
@evk-soft/ai-tooling/schemas/*.json          -> schemas/*.json
@evk-soft/ai-tooling/package.json            -> package.json
ai-tooling executable                        -> dist/cli.js
```

`package.json` uses ECMAScript modules, maps `.` to the listed import and type files, maps
`./schemas/*.json` and `./package.json` explicitly, and declares the `ai-tooling` binary. No other
deep import is public.

Published schema `$id` values use this exact versioned form:

```text
https://raw.githubusercontent.com/evk-soft/devkit/refs/tags/ai-tooling-v0.1.0/packages/ai-tooling/schemas/config.schema.json
```

Other schemas replace `config.schema.json` with their exact exported filename. Future versions
replace only `0.1.0` with the exact `@evk-soft/ai-tooling` version. Source-checkout metadata may use
repository-relative `$schema` paths; package building rewrites published metadata to the
version-tagged URL. Stage 5 verifies that every published URL resolves to the same bytes as the
exported package schema before release.

Builds on: `docs/system-overview/ai-tooling.md:108-150` and
`docs/system-overview/ai-tooling.md:221-372`.

### Pure resolution pipeline

All read, validation, resolution, and rendering functions are pure with respect to repository
mutation. The pipeline is:

```text
explicit config
  -> exact locked pack plus digest
  -> schema and integrity validation
  -> precedence and override composition
  -> one effective resource per stable ID
  -> adapter capability check
  -> candidate output tree
  -> output and link validation
  -> proposed diff
  -> transaction manager
```

Stage 1 supports committed project overrides so self-hosting proves precedence. `extend` is accepted
only as a compatible addition; `replace` and `disable` express contradictory intent. A missing target,
same-level collision, incompatible base digest, or unsupported required capability fails before
rendering is applied.

Builds on: `docs/system-overview/ai-tooling.md:311-497`.

### Project adapters

The Codex project adapter owns only declared `AGENTS.md` content and `.agents/skills/evk-*/**`
resources. The Claude Code project adapter owns only declared `CLAUDE.md`, `.claude/rules/evk-*`, and
`.claude/skills/evk-*/**` resources. It does not produce plugin bundles.

Each adapter declares its stable ID, version, target paths, supported resource kinds and
capabilities, deterministic renderer, and generated-format validator. Both consume the same
effective catalog; platform output never becomes canonical input.

Stage 1 clean init requires every intended target to be absent. Partial ownership inside a
pre-existing entry file is not supported. The ownership lock records generator, adapter, all
contributing resource IDs, adoption state, and SHA-256 digest for every managed path.

Builds on: `docs/system-overview/ai-tooling.md:405-468` and
`docs/system-overview/ai-tooling.md:498-545`.

### Stage 1 commands

The implemented public surface is limited to:

```text
ai-tooling init
ai-tooling sync
ai-tooling check
ai-tooling diff
ai-tooling doctor
ai-tooling doctor --report
ai-tooling doctor --repair
ai-tooling restore-generated <path>
ai-tooling docs check-links
ai-tooling pack validate
ai-tooling pack build
ai-tooling pack refresh-local <pack>
```

`init` accepts an existing explicit config or explicit pack and platform arguments. It resolves
inputs, builds the complete candidate, shows a diff, and writes the first lock and outputs in one
journaled transaction after confirmation. Any existing unmanaged target blocks it. It does not
install hooks. A selected unsupported platform, enabled hook, plugin mutation, or executable
capability is a blocking diagnostic rather than an ignored field.

Stage 1 `sync` requires both the full configuration digest and normalized pack-selection projection
to equal the lock. It may update managed-output ownership records, but cannot bless any config edit
or change frozen pack versions, revisions, or integrity digests. A config change blocks with
`EVK_CONFIG_REQUIRES_UPDATE`; the update lifecycle begins in Stage 2.

`pack refresh-local` accepts only a pack already selected from a tracked repository-relative source.
It validates the changed pack, shows the digest and resource diff, and updates only that locked local
digest after explicit confirmation. `check` reports outputs stale until the next `sync` succeeds.

`check` and `diff` render without repository writes. `check --ci` rejects local preview sources.
`docs check-links` validates local links, anchors, images, encoded paths, and exact path casing
without network access. `pack validate` and `pack build` never execute pack content.

`doctor` and `doctor --report` do not mutate managed repository state. A report is redacted and goes
to standard output unless the user explicitly selects a path under ignored
`.ai-tooling/reports/**`; no implicit report file is created.

Stage 1 modified-output diagnostics offer manual preservation or `restore-generated`; they never
recommend the unavailable `import-edits` command.

Every mutating command supports `--dry-run`; non-interactive mutation requires explicit acceptance
flags. Machine-readable output uses stable JSON errors and exit codes. No Stage 1 command installs a
plugin or changes a user-global platform configuration.

Builds on: `docs/system-overview/ai-tooling.md:546-665` and
`docs/system-overview/ai-tooling.md:799-916`.

### Transaction and recovery

Only the transaction manager writes managed paths. It exclusively creates `run.lock` in phase
`pre-journal` with operation ID, random nonce, host identity, process ID, and process-start marker.
It writes and flushes the matching journal header, then atomically and durably advances the same
metadata to `journal-ready` without changing its identity. Only after both records are durable may it
verify ownership, render a complete candidate, create recovery backups, journal and atomically
replace each file, write the candidate repository lock last, verify the final tree, and release the
run lock.

Repository lock state is `absent` or `present(SHA-256)`. The journal records prior and candidate lock
states, every path's prior and candidate digest or absence marker, completed step, and backup digest.
A handled error rolls back, including restoration of a prior absent lock. An interruption blocks
ordinary mutation.

`doctor --repair` may reclaim a leftover `journal-ready` run lock only when its operation and nonce
match the journal, its host is the current host, and the operating system proves no process with the
recorded ID and start marker is alive. It atomically archives that metadata and exclusively creates a
recovery lock. Live, foreign-host, reused-ID, changed, or unverifiable ownership causes zero writes;
no force reclaim exists.

If a proven-stale `pre-journal` lock has no journal, repair may archive and remove only that lock
after confirmation. It may abandon a matching header in this phase only when no mutation step or
backup exists. A `journal-ready` lock without its matching journal, unknown phase, changed metadata,
or corrupt or mismatched journal remains blocking and causes zero writes.

`doctor --repair` shows a completion or rollback plan, supports `--dry-run`, and requires
confirmation. Non-interactive repair names the operation and exact action. Every path and backup
must match a journaled state, and the repository lock must match prior or candidate `LockState`.
Any third state stops the entire operation.

Active or interrupted recovery backups are never pruned. Successful ordinary transactions delete
their transient backups after final verification. Manual restore keeps the newest verified preimage
per managed path; an older completed preimage is removed only after its replacement and transaction
commit are verified. Stage 2 may add configurable retention without weakening these rules.

`restore-generated` is a compare-and-swap operation for one registered path. Its plan records the
observed current digest or absence, expected digest, diff, and backup. Confirmation accepts that
exact observation; the command rechecks it immediately before writing, verifies an exact preimage
backup when bytes exist, and writes only expected bytes rendered from valid locked inputs. Concurrent change,
unregistered path, active interrupted journal, or backup mismatch causes zero writes.

Builds on: `docs/system-overview/ai-tooling.md:666-764`.

### Path and executable containment

Every candidate path is normalized and resolved beneath the repository root. Validation rejects
symbolic links, Windows junctions and other reparse points, UNC escapes, case-fold collisions, and
Unicode-normalization collisions. Tests use native Windows probes for Windows-only behavior.

Stage 1 is instruction-only. If any effective resource declares or contains scripts, hooks, MCP
servers, connectors, executables, browser capabilities, or another activatable asset, validation
returns `EVK_SECURITY_EXECUTABLE_CONSENT_REQUIRED` before copying it to a discovery path. A pack
cannot hide an executable by omitting it from `requiredCapabilities`.

Builds on: `docs/system-overview/ai-tooling.md:252-310` and
`docs/system-overview/ai-tooling.md:917-940`.

### Self-hosting and CI

After all safe-write and recovery fixtures pass, `devkit` uses the workspace CLI and tracked
`configs/ai` pack to perform clean init. It commits its config, exact lock, and generated Codex and
Claude project outputs. CI runs only:

```text
ai-tooling check --ci
ai-tooling docs check-links
ai-tooling pack validate
package typecheck, lint, and tests
```

Tests use temporary repositories and temporary home directories. No test reads or writes the real
Codex or Claude Code user configuration. Stage 1 does not modify `.husky/pre-commit`.

Builds on: `docs/system-overview/ai-tooling.md:941-1036`.

## Security and artifacts

Pack sources, project overrides, generated outputs, local backups, journals, diagnostics, and test
fixtures are the artifact boundary. Canonical public resources and committed outputs must contain no
credentials, private organization rules, absolute machine paths, or private prototype material.

Local cache, state, backup, journal, preview, and report paths are ignored by Git. Diagnostics redact
override bodies, tokens, credentials, and unnecessary personal paths. Tests create isolated project
and home directories and use no real platform installation.

Before the Stage 1 commit, scan the complete staged package, documentation, lock, generated outputs,
and built package tarballs for credentials, private-name patterns, machine paths, undeclared files,
and license conflicts. The clean implementation may reproduce approved behavior, not private bytes.

Executable capability detection is fail-closed and must be adversarially tested before self-hosting.
Publication is out of scope, so a successful package build is not permission to publish.

## NFR scorecard

| # | NFR | Priority | Key tactic | Main trade-off |
|---|---|---|---|---|
| 1 | Performance | Medium | Pure single-pass resolution; staged checks; no hook or sync network work | Provenance increases memory use |
| 2 | Scalability | Medium | Graph-based catalog with stress fixtures for many resources and outputs | More complex than direct copying |
| 3 | Availability | Low | Frozen inputs and verified local cache keep sync offline-capable | Init may need an explicitly approved fetch |
| 4 | Security | High | Instruction-only gate, path containment, digests, and recovery state checks | Unsafe packs and paths fail early |
| 5 | Modifiability | High | Versioned schemas, pure components, and two isolated adapters | Contracts limit ad hoc shortcuts |
| 6 | Operability | High | Stable codes, JSON diagnostics, journal inspection, and guarded repair | Recovery state requires cleanup later |
| 7 | Integrability | High | Explicit config, standard JSON, exact lock, and declared capabilities | Existing repositories wait for Stage 2 |
| 8 | Testability | High | Dependency injection, temporary roots, failure injection, and byte snapshots | Native OS fixtures increase CI cost |
| 9 | Portability | High | Node.js 24 and native Windows/Linux/macOS byte and path probes | Lowest-common path semantics are strict |
| 10 | UX | High | Dry runs, exact diffs, stable recovery actions, and no silent mutation | Clean bootstrap rejects convenient inference |

## Phased migration

The future implementation plan may refine step size, but it must preserve these ordered phase
boundaries and one commit per implementation phase.

| Phase | Scope | Risk | Gate |
|---|---|---|---|
| 1. Contracts and instruction-only pack | Package boundaries, `.gitignore`, schemas and exports, strict parsing, minimal reviewed resources, publication allowlist | Local-state leak, schema drift, or private content | Ignore/unignore probes, schema fixtures, duplicate-key tests, content review, and package-content scan pass |
| 2. Pure engine | Pack loading, integrity, precedence, overrides, capability negotiation, deterministic candidate model | Ambiguous resolution | Collision, orphan, base-digest, executable-rejection, stress, and repeatability tests pass with no writes |
| 3. Project adapters and read-only checks | Codex and Claude project renderers, ownership model, diff, check, link validation | Platform loss or nondeterminism | Capability and golden fixtures pass; second render is byte-identical on all target OSes |
| 4. Safe mutation and recovery | Clean init, frozen-config sync, local refresh, compare-and-swap restore, journal, backups, run-lock phases and reclaim, rollback, repair | User content loss after error or crash | Absent/present lock recovery, live/stale/ambiguous run locks, pre-journal/no-journal and journal-ready/no-journal fixtures, restore race, handled rollback, and third-state fixtures pass |
| 5. Self-hosting, docs, and hardening | Devkit generated files and lock, `.github/workflows/ai-tooling.yml`, package docs, security audit | Circular bootstrap or stale durable docs | Full bootstrap sequence and check-only CI are green; publication scan is clean; durable map is covered |

Each phase requires owner approval before the next. The Stage 1 plan ends with a decommission phase
that verifies durable coverage before removing this child spec and its plan.

## Durable docs and skills to update

| Durable fact | Canonical home | When |
|---|---|---|
| Publisher pack purpose and edit rules | `configs/ai/README.md` | Phase 1 and Phase 5 verification |
| Shared engine and recovery architecture | `docs/system-overview/ai-tooling.md` | Every phase docs sync |
| Package install, exports, runtime, and CLI | `packages/ai-tooling/README.md` | Phases 1, 3, and 5 |
| Clean init, sync, check, refresh, restore, and repair | `docs/ai-tooling/USER-GUIDE.md` | Phases 4 and 5 |
| AI source-versus-generated workflow | `docs/ai-tooling/AI-AUTHORING-GUIDE.md` | Phases 3 and 5 |
| Pack schemas, IDs, precedence, and overrides | `docs/ai-tooling/EXTENDING-PACKS.md` | Phases 1-2 and Phase 5 |
| Stage 1 trust, path, diagnostic, and artifact rules | `docs/ai-tooling/SECURITY.md` | Phases 1, 4, and 5 |
| Package discovery and status | root `README.md` | Phase 5 |

No durable file links back to this child spec or its plan.

## Open questions

None changes the approved Stage 1 behavior. The implementation plan must choose and record:

- the concrete JSON Schema validator and duplicate-key parser before Phase 1 coding;
- the package test runner before Phase 1 coding;
- measurable local and stress-fixture timing budgets before Phase 2 performance acceptance;
- the exact CI matrix syntax before Phase 3, while native Windows/Linux/macOS evidence remains
  mandatory.

Any choice that changes output bytes, public schema behavior, ownership, recovery, path containment,
or executable trust returns to the owner as a new design decision.

## Risks

| Risk | Mitigation |
|---|---|
| Clean init sees a newly created user file | Repeat target census immediately before mutation; any unmanaged collision aborts |
| Local pack digest changes silently | Only explicit `pack refresh-local` may change it, after a shown diff |
| Sync blesses a changed config or selected input | Require exact Stage 1 config and selection digests; test add, remove, source, and range drift |
| Recovery overwrites an unknown post-crash state | Validate every path, backup, and lock against journaled states before any repair write |
| A stale run lock is actually live, foreign, or missing a post-boundary journal | Require durable phases, matching same-host identity, proven process death, and a matching journal for `journal-ready`; ambiguity writes nothing |
| Schema reserves scripts that Stage 1 then copies | Detect actual assets independently of declarations and fail before rendering |
| Adapter output loses a required instruction | Capability fixtures and effective-resource provenance assertions fail closed |
| Windows containment differs from POSIX tests | Run native junction, reparse, UNC, case, and Unicode probes on Windows |
| Self-hosting uses unpublished or machine-local state | Use workspace CLI, tracked relative pack source, exact digest, and committed lock |
| Clean implementation accidentally copies private text | Independent content review and staged/tarball provenance scans before commit |
| Durable architecture drifts from implemented behavior | Docs sync in every phase and decommission coverage gate |

## Tech stack and constraints

| Component | Choice | Source |
|---|---|---|
| Runtime | Node.js 24 or later | `package.json:6-18` |
| Package manager | pnpm 10.28 workspace | `package.json:5`, `pnpm-workspace.yaml:1-3` |
| Language | TypeScript 5.9 with ECMAScript module output | `package.json:28-31`; umbrella decision |
| Metadata | Standard JSON and JSON Schema draft 2020-12 | `docs/system-overview/ai-tooling.md:221-251` |
| Instructions | Markdown only in Stage 1 sources | `docs/ai-tooling/product-brief.md:23-24` |
| Output integrity | SHA-256 plus deterministic UTF-8/LF serialization | `docs/system-overview/ai-tooling.md:221-251`, `docs/system-overview/ai-tooling.md:405-468` |
| Filesystem testing | Native Windows, Linux, and macOS runners with temporary roots | portability NFR and Phase 3 gate |

## Acceptance criteria

1. `/.ai-tooling/` is ignored before local state is created; `ai-tooling.lock.json` is not ignored.
2. A clean project creates its first exact lock and Codex/Claude outputs only after a reviewed plan.
3. Any unmanaged target file causes zero writes.
4. The initial lock contains no absolute path, credential, auth state, or global plugin state.
5. A second unchanged sync is byte-identical; any config or pack-selection change blocks.
6. Override precedence produces one effective resource with complete contributor provenance.
7. Missing, modified, stale, orphaned, conflicting, and unsupported outputs fail `check`.
8. A canonical local-pack edit requires explicit refresh before sync accepts it.
9. Handled failures restore the prior tree and `absent` or `present` lock state.
10. Interrupted valid states recover; a third file or lock state blocks.
11. Live or ambiguous run locks block; only a proven stale same-host `pre-journal` lock may be
    removed without a journal, while `journal-ready` without a matching journal writes nothing.
12. `restore-generated` rejects unregistered paths and any change after the user confirms observed
    bytes; it preserves a verified exact preimage before replacement.
13. Active-journal backups are never pruned; completed backups follow the minimum bounded rule.
14. Activatable resources fail before copying any asset.
15. Symlink, junction, reparse, UNC, case-fold, and Unicode attacks fail containment tests.
16. Codex and Claude deterministic fixtures pass on Windows, Linux, and macOS.
17. Tests never touch real user platform configuration.
18. `devkit` commits and verifies its exact config, lock, outputs, and check-only CI workflow.
19. Durable docs cover sources, outputs, customization, recovery, and security without reverse links.

## Review gate

Owner review uses a Git commit or the complete SHA-256 and line count of this child and its umbrella.
Any edit creates a new snapshot and invalidates the prior review.

Only explicit owner approval of both written files allows `superpowers:writing-plans` to create the
Stage 1 implementation plan. No code, scaffold, generated project output, hook change, dependency
installation, or publication is authorized by this design alone.
