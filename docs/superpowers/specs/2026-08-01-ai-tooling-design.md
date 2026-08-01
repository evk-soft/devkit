# AI Tooling Umbrella Design

**Date:** 2026-08-01
**Status:** Draft
**Profile:** feature — four feature signals (two new packages, public schema and CLI contracts,
multi-platform adapters, and a security-sensitive lifecycle) and zero bugfix signals
**Scope:** `configs/ai/**`, `packages/ai-tooling/**`, `docs/ai-tooling/**`, declared generated project
entry points, continuous-integration configuration, and explicitly managed hook blocks
**SSoT pointers:** `configs/ai/README.md`, `docs/system-overview/ai-tooling.md`,
`docs/ai-tooling/product-brief.md`, `docs/ai-tooling/decisions/0001-package-boundaries.md`, and
`docs/ai-tooling/research/platform-distribution-baseline.md`, and
`docs/ai-tooling/research/devkit-baseline.md`

## Goal

Create a reusable public MIT system that stores EVK agent rules and skills once, composes committed
consumer overrides, and renders protected platform-native outputs without silently overwriting user
content or installing external capabilities.

This is a non-executable umbrella specification. Each delivery stage requires its own independently
reviewed child specification and its own approved implementation plan. Only the Stage 1 child is
written with this umbrella; Stages 2 through 5 remain owner-gated future design work.

## Non-goals

- Source indexing, symbol lookup, duplicate detection, dead-code analysis, dependency graphs, and
  architecture visualization belong to the separate `@evk-soft/code-intelligence` product.
- The product is not a credentials manager and does not centralize consumer domain policy.
- The first stage does not adopt existing AI files, install Git hooks, install plugins, or copy
  executable or activatable pack assets.
- Marketplace publication and global platform mutation are not implied by generating an artifact.
- Bun compatibility is not a version-0 gate; the initial tooling runtime is Node.js 24.

## Grounding

Statements using `must`, `will`, or an imperative define target behavior. They do not claim that the
implementation already exists.

| Current or external fact | Evidence |
|---|---|
| The workspace admits packages under `configs/*` and `packages/*` | `pnpm-workspace.yaml:1-3` |
| The repository baseline is pnpm 10.28, Node.js 24, and TypeScript 5.9 | `package.json:5-7`, `package.json:28-31` |
| The current pre-commit hook writes to the tree and stages the whole repository | `.husky/pre-commit:1-2` |
| Package placement and the separate code-intelligence boundary are accepted | `docs/ai-tooling/decisions/0001-package-boundaries.md:16-38` |
| Users, formats, ownership, and product success evidence are recorded durably | `docs/ai-tooling/product-brief.md:15-73` |
| Prototype input is sanitized research, not implementation source | `docs/ai-tooling/research/migration-lessons.md:6-54` |
| Platform packaging and capability assumptions come from dated official sources | `docs/ai-tooling/research/platform-distribution-baseline.md:6-100` |
| Detailed target contracts are owned by the durable architecture | `docs/system-overview/ai-tooling.md:151-1094` |
| The frozen target census, history, ignore probes, and earlier audit verdicts are preserved | `docs/ai-tooling/research/devkit-baseline.md:15-120` |

Two independent reviews ran on the frozen split snapshot recorded in
`docs/ai-tooling/research/devkit-baseline.md:104-117`. Their result explains this revision; it does
not approve these changed bytes.

| Audit area | Frozen snapshot | Verdict | Consequence |
|---|---|---|---|
| Public-transfer safety and provenance | Eight-file split snapshot in the baseline research | READY for public MIT content | Keep the clean implementation rule and rerun the scan after every edit |
| Written-spec consistency | Same eight-file split snapshot | NOT READY | Repair recovery, ignore, grounding, and public-contract gaps before owner review |

Evidence for the later split-snapshot audit is preserved in
`docs/ai-tooling/research/devkit-baseline.md:104-120`.

## Decisions

| Fork | Decision | Consequence |
|---|---|---|
| Repository | Build inside public `evk-soft/devkit`, not a standalone repository | Reuse its workspace and release conventions |
| Packages | Publish `@evk-soft/ai-pack-core` and `@evk-soft/ai-tooling` separately | Content and engine code version independently |
| Public and private behavior | Keep the public core under MIT; add private behavior through separate pinned packs or project overrides | Public artifacts cannot contain organization policy or credentials |
| Canonical formats | Use standard JSON for metadata and Markdown for instruction bodies | Platform YAML and manifests are generated outputs |
| Naming | Reserve `evk-` names and `evk-soft/...` identifiers for authorized EVK resources | Collisions are detected without relying on display names |
| Consumer customization | Accept committed changes only through `ai/overrides/**` | Generated EVK files are protected from direct edits and safely replaceable by the engine |
| Override meaning | Permit compatible `extend`; require `replace` or `disable` for contradictions | The engine does not claim semantic understanding of arbitrary Markdown |
| Local experiments | Allow local profiles only in isolated preview output | Local state cannot alter committed outputs or pass `check --ci` |
| Input resolution | Configuration declares source and range; the lock pins exact input and output ownership | `sync` cannot silently select a newer pack |
| Plugins | Treat platform plugins as adapter outputs and third-party capabilities as external | One resolved catalog remains the EVK source; external instructions stay outside it |
| External installation | Recommend a curated vendor-qualified catalog and always require confirmation | Agent advice does not silently expand the software supply chain |
| Hook policy | Make hook changes opt-in and check-only | Existing content is preserved and unrelated paths are never staged |
| Stage 1 trust | Support instruction-only packs until executable-capability consent exists | Scripts, hooks, MCP servers, executables, connectors, and browser assets fail closed |
| Self-hosting | Use `devkit` as the first consumer after safe bootstrap and recovery exist | The product proves its lifecycle without an unsafe manual lock shortcut |

## Design

The durable target architecture is `docs/system-overview/ai-tooling.md`. It is authored now under the
umbrella-program exception because all child stages depend on the same SSoT, lock, adapter, and
security contracts. Durable code and documentation never link back to this temporary specification.

### Publisher and consumer sources

`configs/ai/**` is the editable publisher source for `@evk-soft/ai-pack-core`. A consumer owns
`ai-tooling.config.json` and committed `ai/overrides/**`; the engine owns the exact lock and declared
generated outputs. Installed pack versions are immutable. Generated files are not manually editable,
but the transaction manager may replace them after ownership and digest checks.

Builds on: `configs/ai/README.md:1-28` and `docs/system-overview/ai-tooling.md:151-220`.

### Pure composition before adapters

The engine validates versioned JSON schemas, resolves public, private, and project layers into one
effective resource per stable identifier, and only then invokes a platform adapter. Required
capabilities that an adapter cannot represent cause a stable error instead of silent loss.

Builds on: `docs/system-overview/ai-tooling.md:221-404` and
`docs/system-overview/ai-tooling.md:469-545`.

### Protected lifecycle

All mutation candidates are rendered and validated in a temporary tree. Managed paths require an
ownership record and expected digest. A journal records prior and candidate lock and path states;
each file replacement is atomic, while the design explicitly does not promise multi-file
operating-system atomicity. Unknown post-crash bytes block repair.

Builds on: `docs/system-overview/ai-tooling.md:546-764`.

### Platform and capability adapters

Project adapters and distributable plugin adapters are separate. External capability adapters
declare `detect`, `recommend`, `open-ui`, `emit-command`, `install`, and `uninstall` independently.
Installation is performed only through a current documented interface and after confirmation.

Builds on: `docs/system-overview/ai-tooling.md:498-545` and
`docs/system-overview/ai-tooling.md:823-870`.

### Child specifications

| Stage | Child specification | Status |
|---|---|---|
| 1. Safe core and self-hosting | `docs/superpowers/specs/2026-08-01-ai-tooling-stage-1-safe-core-design.md` | Written with this umbrella; requires frozen owner review |
| 2. Existing-project lifecycle | Dated child path is chosen when Stage 2 brainstorming starts | Not written; brainstorm after Stage 1 gate |
| 3. Remaining adapters | Dated child path is chosen when Stage 3 brainstorming starts | Not written; brainstorm after Stage 2 gate |
| 4. External capability catalog | Dated child path is chosen when Stage 4 brainstorming starts | Not written; brainstorm after Stage 3 gate |
| 5. Public release | Dated child path is chosen when Stage 5 brainstorming starts | Not written; brainstorm after Stage 4 gate |

A future child does not exist until its design is discussed, written, audited, and owner-approved.

## Security and artifacts

Inputs that may carry sensitive content include private packs, project overrides, generated project
files, diagnostic reports, external catalogs, and plugin authentication state. Public pack and
release artifacts must contain none of those consumer secrets. Credentials remain in the target
platform's authentication store and never enter configuration, lock, state reports, or diagnostics.

Generated outputs are reviewable repository artifacts, not a secret boundary. A consumer is
responsible for deciding whether its committed overrides and resulting files are suitable for its
repository visibility. Diagnostic reports redact private override bodies, credentials, and
unnecessary personal paths. Local caches, journals, backups, and reports are ignored by Git.

The frozen target-path history contains only the public scaffold commit and no earlier AI-tooling
implementation in the inspected paths (`docs/ai-tooling/research/devkit-baseline.md:71-86`). Stage 5
repeats history, secret, path, license, and publication-content scans. Any discovered secret triggers
rotation and history cleanup before release.

The public implementation is built from the approved contracts and public platform documentation.
The private `UNLICENSED` prototype grants no permission to copy code, tests, manifests, hooks,
skills, rules, or documentation bytes.

## NFR scorecard

| # | NFR | Priority | Key tactic | Main trade-off |
|---|---|---|---|---|
| 1 | Performance | Medium | Pure in-memory resolution, staged-aware checks, and no network work in hooks; measure in Stage 1 | Incremental tracking adds complexity |
| 2 | Scalability | Medium | One provenance graph and render pass per adapter; stress-gate in Stages 1 and 3 | More metadata than file copying |
| 3 | Availability | Low | Frozen-lock sync uses verified local inputs; discovery is outside normal sync | New versions need registry access |
| 4 | Security | High | Path containment, digests, instruction-only Stage 1, and Stage 4 consent | More explicit review steps |
| 5 | Modifiability | High | Versioned schemas, stable IDs, isolated components, and adapter contracts | Public contracts constrain refactoring |
| 6 | Operability | High | Stable errors, JSON diagnostics, journals, backups, and guarded repair | Recovery state needs retention rules |
| 7 | Integrability | High | Capability negotiation and separate project/distribution adapters | Unsupported behavior fails loudly |
| 8 | Testability | High | Pure resolver/renderers, temporary homes, deterministic and adversarial fixtures | Cross-platform fixtures need maintenance |
| 9 | Portability | High | Node.js 24 plus native Windows, Linux, and macOS path and byte tests | OS-specific path probes are required |
| 10 | UX | High | Dry runs, exact diffs, explicit ownership, and actionable recovery plans | Safe mutation takes more steps |

## Phased migration

Every child plan ends with documentation synchronization and decommission coverage. Each
implementation phase has one commit and an owner gate; completing one stage does not authorize the
next.

| Stage | Scope | Main risk | Gate |
|---|---|---|---|
| 1. Safe core and self-hosting | Schemas, instruction-only core pack, ignored local state, clean init, local-pack refresh, resolver, Codex and Claude project adapters, ownership, safe writes, repair, checks, self-hosting | Bootstrap corruption, stale lock, or copied executable content | Bootstrap sequence passes; absent/present lock recovery, run-lock liveness, restore race, config drift, ignore, path, and executable-rejection fixtures pass |
| 2. Existing-project lifecycle | Conservative import, remote update, remove, import-edits, full doctor, backup retention, opt-in hooks | Loss of pre-existing or modified user bytes | Byte-preserving import and explicit adoption; incompatible update and modified removal write nothing; hooks preserve unrelated bytes |
| 3. Remaining adapters | Cursor, Gemini CLI, Antigravity, and distribution plugin adapters | Silent capability loss or stale manifest assumptions | Fresh official-source fixture, deterministic output, and failing unsupported-capability test per adapter |
| 4. Capability catalog | Curated profiles, detection, planning, explicit executable consent, confirmed platform installation operations | Supply-chain expansion or unintended global mutation | Planning is read-only; every apply path confirms; unsupported installation falls back to documented manual action |
| 5. Public release | Artifact builders, OS matrix, documentation, compatibility, npm and supported marketplace preparation | Private material, path leaks, license error, or cross-platform drift | Clean tarball installs on Windows/Linux/macOS; publication, secret, path, license, docs, and self-hosting gates pass |

## Durable docs and skills to update

| Durable fact | Canonical home | When |
|---|---|---|
| Product scope and users | `docs/ai-tooling/product-brief.md` | Spec time; already created |
| Repository and package boundary | `docs/ai-tooling/decisions/0001-package-boundaries.md` | Spec time; already created |
| Shared architecture and lifecycle contracts | `docs/system-overview/ai-tooling.md` | Spec time; keep synchronized at every child docs gate |
| Publisher source purpose | `configs/ai/README.md` | Spec time; replace design-phase wording in Stage 1 docs sync |
| Package installation and CLI exports | `packages/ai-tooling/README.md` | Stage 1, completed in Stage 5 |
| Initialization, sync, update, removal, and recovery | `docs/ai-tooling/USER-GUIDE.md` | Stages 1 and 2, completed in Stage 5 |
| AI source and generated-file workflow | `docs/ai-tooling/AI-AUTHORING-GUIDE.md` | Stage 1, completed in Stage 5 |
| Pack schemas, identifiers, precedence, and overrides | `docs/ai-tooling/EXTENDING-PACKS.md` | Stage 1, completed in Stage 5 |
| Existing-project adoption | `docs/ai-tooling/MIGRATING-EXISTING-PROJECT.md` | Stage 2 |
| Platform capability matrix | `docs/ai-tooling/PLATFORM-SUPPORT.md` | Stages 3 and 4 |
| Trust, paths, executables, plugins, and diagnostics | `docs/ai-tooling/SECURITY.md` | Stages 1 and 4; release-verified in Stage 5 |
| Public package discovery | root `README.md` | Stage 5 |

Durable files may link to other durable documents and accepted decision records. They must never
link to this specification or an implementation plan. Decommission verifies the map and removes
temporary specs and plans only after their durable facts are covered.

## Open questions

None blocks review of the umbrella or Stage 1 child.

- The concrete JSON validator and duplicate-key parser are selected in the Stage 1 plan; observable
  validation behavior is already fixed.
- Configurable completed-backup retention is fixed in the Stage 2 child; Stage 1 already protects
  active and interrupted recovery backups and defines its minimal completed-backup bound.
- Exact marketplace manifests and supported installation operations are refreshed in each Stage 3
  child adapter decision.
- Vendor-qualified curated capability records are verified in the Stage 4 child.
- Registry channels and compatibility policy are fixed in the Stage 5 release child.

Any answer that changes a public contract or weakens an engine security invariant returns to the
owner as a new decision.

## Risks

| Risk | Mitigation |
|---|---|
| A mutation overwrites consumer content | Ownership digests, temporary candidates, journal recovery, and Stage 1-2 adversarial gates |
| Crash recovery overwrites a post-crash user edit | Accept only journaled old, candidate, or missing states; any third state blocks repair |
| First init cannot restore a missing prior lock | Journal lock state as absent or present and test rollback before and after candidate-lock write |
| A stale run lock is still live or belongs to another host | Reclaim only matching same-host metadata after proven process death; ambiguity writes nothing |
| Sync blesses a changed pack source or range | Compare normalized pack-selection projection and require the update lifecycle for any change |
| Local journals or backups are accidentally committed | Add root `/.ai-tooling/` ignore before first state write and prove the committed lock remains unignored |
| A compatible version range hides a changed base resource | Record the base digest and block update until explicit override migration |
| A copied script becomes available without informed consent | Reject executable assets in Stage 1; require consent before copy or activation in Stage 4 |
| A platform changes its format or installation surface | Refresh official documentation and capability fixtures in Stages 3 and 5 |
| Windows paths bypass containment | Test symlink, junction, reparse point, UNC, case-fold, and Unicode collisions in Stage 1 |
| Public artifacts contain private prototype material or credentials | Clean implementation and Stage 5 source, secret, path, and license scans |
| Self-hosting creates circular bootstrap | Use workspace tooling, repository-relative pack input, clean init, and explicit local-pack refresh |
| Hook integration changes unrelated work | Opt-in marked blocks, read-only checks, and tests that forbid write formatters and `git add -A` |

## Tech stack and constraints

| Component | Choice | Source |
|---|---|---|
| Runtime | Node.js 24 or later | `package.json:6-18` |
| Package manager | pnpm 10.28 workspace | `package.json:5`, `pnpm-workspace.yaml:1-3` |
| Language | TypeScript 5.9, ECMAScript module output | `package.json:28-31`; architecture decision |
| Canonical metadata | Standard JSON plus JSON Schema draft 2020-12 | `docs/system-overview/ai-tooling.md:221-251` |
| Instruction bodies | Markdown | `docs/ai-tooling/product-brief.md:23-24` |
| Supported operating systems | Native Windows, Linux, and macOS release gates | portability NFR and Stage 5 gate above |

## Review gate

Owner review uses an immutable snapshot identified either by a Git commit or by the complete
SHA-256 and line count of both this umbrella and the Stage 1 child. Requested changes create a new
snapshot and rerun targeted consistency and public-transfer checks.

Only explicit owner approval of both written files allows creation of the Stage 1 implementation
plan. It does not authorize implementation, planning, or publication for Stages 2 through 5.
