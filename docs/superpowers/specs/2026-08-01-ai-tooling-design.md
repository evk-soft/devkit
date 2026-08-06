# AI Tooling Umbrella Design

**Date:** 2026-08-01
**Status:** Approved
**Profile:** feature — four feature signals (two new packages, public schema and CLI contracts,
multi-platform adapters, and a security-sensitive lifecycle) and zero bugfix signals
**Scope:** `configs/ai/**`, `packages/ai-tooling/**`, `docs/ai-tooling/**`, declared generated project
entry points, human-owned consumer-local ignore and formatter exclusions, continuous-integration configuration, and
explicitly managed hook blocks
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
| The repository baseline is pnpm 10.28, Node.js 24, and TypeScript 6.0.3 | `package.json:5-7`, `package.json:28-31` |
| The current pre-commit hook writes to the tree and stages the whole repository | `.husky/pre-commit:1-2` |
| Root Biome extends a public reusable preset; its JSON parser accepts comments | `biome.json:1-4`, `configs/biome-config/package.json:2-8`, `configs/biome-config/biome.preset.json:40-50` |
| The workspace uses pnpm's isolated linker | `.npmrc:2` |
| The existing general CI workflow runs on Ubuntu only | `.github/workflows/ci.yml:8-47` |
| Package placement and the separate code-intelligence boundary are accepted | `docs/ai-tooling/decisions/0001-package-boundaries.md:16-38` |
| Users, formats, ownership, and product success evidence are recorded durably | `docs/ai-tooling/product-brief.md:15-73` |
| Prototype input is sanitized research, not implementation source | `docs/ai-tooling/research/migration-lessons.md:6-54` |
| Platform packaging and capability assumptions come from dated official sources | `docs/ai-tooling/research/platform-distribution-baseline.md:6-133` |
| Detailed target contracts are owned by the durable architecture | `docs/system-overview/ai-tooling.md:117-1700` |
| The frozen target census, history, ignore probes, and audit snapshots are preserved | `docs/ai-tooling/research/devkit-baseline.md:15-220` |

Two independent reviews ran on the frozen split snapshot recorded in
`docs/ai-tooling/research/devkit-baseline.md:106-119`. Their result explains this revision; it does
not approve these changed bytes.

| Audit area | Frozen snapshot | Verdict | Consequence |
|---|---|---|---|
| Public-transfer safety and provenance | Eight-file split snapshot in the baseline research | READY for public MIT content | Keep the clean implementation rule and rerun the scan after every edit |
| Written-spec consistency | Same eight-file split snapshot | NOT READY | Repair recovery, ignore, grounding, and public-contract gaps before owner review |

Evidence for the later split-snapshot audit and corrected Draft snapshots is preserved in
`docs/ai-tooling/research/devkit-baseline.md:106-220`.

## Decisions

| Fork | Decision | Consequence |
|---|---|---|
| Repository | Build inside public `evk-soft/devkit`, not a standalone repository | Reuse its workspace and release conventions |
| Packages | Publish `@evk-soft/ai-pack-core` and `@evk-soft/ai-tooling` separately | Content and engine code version independently |
| Public and private behavior | Keep the public core under MIT; add private behavior through separate pinned packs or project overrides | Public artifacts cannot contain organization policy or credentials |
| Canonical formats | Use standard JSON for metadata and Markdown for instruction bodies | Platform YAML and manifests are generated outputs |
| Configuration identity | Hash a field-by-field, I-JSON-valid semantic projection using RFC 8785 JSON Canonicalization Scheme (JCS) | Defaults and domain normalization are versioned; formatting and `$schema` location do not change identity; unknown fields require a schema version |
| Schema identity | Validate schemas, metaschema, and vocabularies through network-disabled built-in or local identifiers and publish schema bytes unchanged | Cold-cache validation cannot depend on the network or rewrite a version-tag schema identity |
| Generated bytes | Use a separate fixture-locked UTF-8/LF renderer | JCS identity and human-readable output formatting cannot accidentally redefine each other |
| Naming | Reserve `evk-` names and `evk-soft/...` identifiers for authorized EVK resources | Collisions are detected without relying on display names |
| Consumer customization | Accept committed changes only through `ai/overrides/**` | Generated EVK files are protected from direct edits and safely replaceable by the engine |
| Override meaning | Permit compatible `extend`; require `replace` or `disable` for contradictions | The engine does not claim semantic understanding of arbitrary Markdown |
| Local experiments | Allow local profiles only in isolated preview output | Local state cannot alter committed outputs or pass `check --ci` |
| Input resolution | Configuration declares source and range; the lock pins exact input and output ownership | `sync` cannot silently select a newer pack |
| Plugins | Treat platform plugins as adapter outputs and third-party capabilities as external | One resolved catalog remains the EVK source; external instructions stay outside it |
| External installation | Recommend a curated vendor-qualified catalog and always require confirmation | Agent advice does not silently expand the software supply chain |
| Hook policy | Make hook changes opt-in and check-only | Existing content is preserved and unrelated paths are never staged |
| Repository-config ownership | The consumer owner or approved implementation plan adds ignore and formatter exclusions; AI Tooling verifies but never edits those files | Product paths remain consumer-local, human configuration stays human-owned, and generated bytes retain one writer |
| Formatter provider | Preserve `doctor --formatter-check -- <executable> [args...]` for a caller-explicit direct executable and add `doctor --formatter-check --node-entry <module-specifier> -- [args...]` for a caller-explicit root-declared installed Node entry; require a frozen Git 2.36.0+ provider for checkout census | AI Tooling freezes absolute providers, passes exact argv with `shell: false`, fixed environment, timeout, bounded output, and disposable `cwd`, and performs no fetch, acquisition, or inference |
| Adapter targets | Expand plans to leaf files and register them through one pinned-Unicode, locale-independent portable key shared with containment on every OS | Equal leaves, managed-file ancestors, and overlapping independent trees fail; structural parents remain valid |
| Stage 1 pack trust | Support instruction-only packs until executable-capability consent exists | Pack scripts, hooks, MCP servers, executables, connectors, and browser assets fail closed; formatter execution uses the separate caller-explicit provider trust contract |
| Stage 1 source profile | Accept only the tracked repository-relative `configs/ai` pack although the durable schema recognizes later acquisition kinds and preview mode | Unsupported kinds, unavailable mode, and invalid local selectors have distinct stage-neutral diagnostics before writes |
| Recovery metadata | Treat journal and run-lock records as untrusted typed input and prohibit shell interpolation | Malformed, injected, foreign, or unverifiable liveness evidence causes zero writes |
| Self-hosting | Use `devkit` as the first consumer after safe bootstrap and recovery exist | The product proves its lifecycle without an unsafe manual lock shortcut |

## Design

The durable target architecture is `docs/system-overview/ai-tooling.md`. It is authored now under the
umbrella-program exception because all child stages depend on the same SSoT, lock, adapter, and
security contracts. Durable code and documentation never link back to this temporary specification.

### Publisher and consumer sources

`configs/ai/**` is the editable publisher source for `@evk-soft/ai-pack-core`. A consumer owns
`ai-tooling.config.json`, committed `ai/overrides/**`, `.gitignore`, and its formatter configuration;
the engine owns the exact lock and declared generated outputs. The owner or an approved plan adds the
required repository-config exclusions, and AI Tooling only verifies them. Installed pack versions
are immutable. Generated files are not manually editable, but the transaction manager may replace
them after ownership and digest checks.

The durable config schema recognizes repository-local, npm, and Git sources so it can evolve without
changing the version-1 document shape. A lifecycle profile decides which recognized source kinds it
can resolve. Stage 1's `safe-core` profile accepts only the tracked repository-relative `configs/ai`
identity. It returns a pack capability error for npm or Git acquisition, a config capability error
for schema-valid preview mode, and a source-validation error for an outside, untracked, reparse/alias,
or identity-mismatched local selector. It performs a read-only Git-index check but no network, remote
Git, package-manager, cache, or preview operation.

Builds on: `configs/ai/README.md:1-28` and `docs/system-overview/ai-tooling.md:160-348`.

### Pure composition before adapters

The engine strict-parses I-JSON, validates versioned schemas plus the draft metaschema and
vocabularies from built-in or offline local identifiers, resolves public, private, and project layers
into one effective resource per stable identifier, and only then invokes a platform adapter. Schema
files keep exact source bytes and exact version-tag `$id` values. Required capabilities that an
adapter cannot represent cause a stable error instead of silent loss.

Configuration identity is SHA-256 over the durable field-by-field RFC 8785 JCS projection. It fixes
path, npm identifier, runtime-independent ASCII RFC 3986 HTTPS Git URL, default, array-order, and Unicode behavior; excludes only
`$schema`; and rejects invalid I-JSON, noncanonical domain values, and unknown fields. Generated JSON
and Markdown use a separate deterministic renderer. Human-owned root formatter exclusions protect
the repository lock itself and every registered output path; AI Tooling verifies but never edits the
formatter configuration.

Builds on: `docs/system-overview/ai-tooling.md:218-347` and
`docs/system-overview/ai-tooling.md:364-750`.

### Protected lifecycle

All mutation candidates are rendered and validated in a temporary tree. Managed paths require an
ownership record and expected digest. A journal records prior and candidate lock and path states;
each file replacement is atomic, while the design explicitly does not promise multi-file
operating-system atomicity. Unknown post-crash bytes block repair.

One containment gateway protects every repository content input and every repository-local path the
tool reads or writes, including config, overrides, packs, repository lock, read-only repository-config checks, outputs,
reports, and `.ai-tooling/**`. It rejects links and reparse points and revalidates existing-ancestor
identity immediately before each read, create, rename, replace, or delete.
The root package manifest and any direct provider inside the repository pass this gateway. Trusted
runtime modules, caller-explicit direct providers outside the repository, installed Node-entry files
and dependency modules, and fixed Git or fixed-argv OS-provider internals retain separate trust
contracts. Formatter Node entries require an explicit root dependency, a repository-local installed
package root, and an entry contained within that root; any repository content path returned by a
provider still passes the gateway.

A strict-valid, semantically and integrally consistent but noncanonical repository lock is a narrow
recoverable state: read-only checks diagnose it and `sync` may journal-write only canonical lock bytes.
Invalid, inconsistent, or interrupted state remains blocked. Recovery strict-validates run-lock
metadata, bounds process IDs, compares host identity as data, and uses direct operating-system APIs
or a fixed executable argument vector with shell execution disabled. Missing post-boundary evidence
produces preserve-first recovery actions rather than a force or delete instruction.

Builds on: `docs/system-overview/ai-tooling.md:857-1116` and
`docs/system-overview/ai-tooling.md:1230-1408`.

### Platform and capability adapters

Project adapters and distributable plugin adapters are separate. External capability adapters
declare `detect`, `recommend`, `open-ui`, `emit-command`, `install`, and `uninstall` independently.
Installation is performed only through a current documented interface and after confirmation.

Project adapters target platform-native discovery paths. Codex uses root `AGENTS.md` and
`.agents/skills/<name>/SKILL.md`; Claude Code uses root `CLAUDE.md`, `.claude/rules/**/*.md`, and
`.claude/skills/<name>/SKILL.md`. Every lifecycle command inventories a root `AGENTS.override.md`
shadow and the documented `.claude/CLAUDE.md` alternative; checks report interference and mutation
performs zero writes. Adapters expand to leaves; the shared portable-key
registry accepts structural parents but rejects equal leaves, managed-file ancestors, overlapping
independent trees, case-fold, and Unicode collisions identically on every OS. Stage 1 refreshes dated
official discovery evidence immediately before implementation and proves both adapters in a separate
native Windows/Linux/macOS read-only CI workflow created with them.

Builds on: `docs/system-overview/ai-tooling.md:784-856` and
`docs/system-overview/ai-tooling.md:1182-1229`.

### Child specifications

| Stage | Child specification | Status |
|---|---|---|
| 1. Safe core and self-hosting | `docs/superpowers/specs/2026-08-01-ai-tooling-stage-1-safe-core-design.md` | Approved; detailed implementation plan awaiting separate owner approval |
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
implementation in the inspected paths (`docs/ai-tooling/research/devkit-baseline.md:73-88`). Stage 5
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
| 1. Safe core and self-hosting | Cold-cache offline schemas, field-by-field RFC 8785 config identity, instruction-only core pack from tracked `configs/ai`, source diagnostic split, human-authored and CLI-verified ignore/formatter prerequisites, lifecycle shadow detection, local-pack refresh, resolver, exact Codex and Claude project adapters, portable leaf registry, direct or explicit Node-entry formatter audit, all-path containment, native read-only CI, ownership, safe writes, repair, checks, and self-hosting | Bootstrap corruption, source alias, hidden entry, formatter drift, implicit shell fallback, poisoned environment, path or state escape, ancestor swap, stale lock, injected recovery metadata, or copied executable content | Bootstrap sequence passes; I-JSON/JCS, offline schema/metaschema, source-kind/local-selector, fresh discovery and post-init shadow, native portable-registry/adapter/formatter-provider including fixed environment, frozen Git provider/version, timeout, process-tree quiescence, termination-unverified, redaction, exact argv and pre/post checkout census failure, all-path link/ancestor-swap, canonical-lock repair, absent/present lock recovery, typed shell-free run-lock liveness, missing-evidence, restore-race, semantic-drift, ignore, and executable-rejection fixtures pass |
| 2. Existing-project lifecycle | Conservative import, remote update, remove, import-edits, full doctor, backup retention, opt-in hooks, and replacement of the legacy devkit write-and-global-stage hook behavior | Loss of pre-existing or modified user bytes | Byte-preserving import and explicit adoption; incompatible update and modified removal write nothing; hooks are check-only and preserve unrelated bytes |
| 3. Remaining adapters | Cursor, Gemini CLI, Antigravity, and distribution plugin adapters | Silent capability loss or stale manifest assumptions | Fresh official-source fixture, deterministic output, and failing unsupported-capability test per adapter |
| 4. Capability catalog | Curated profiles, detection, planning, explicit executable consent, confirmed platform installation operations | Supply-chain expansion or unintended global mutation | Planning is read-only; every apply path confirms; unsupported installation falls back to documented manual action |
| 5. Public release | Artifact builders, OS matrix, documentation, compatibility, npm and supported marketplace preparation | Private material, path leaks, license error, or cross-platform drift | Clean tarball installs on Windows/Linux/macOS; publication, secret, path, license, docs, and self-hosting gates pass |

Stage 1 deliberately leaves the current `.husky/pre-commit` implementation unchanged. Its
write-format followed by `git add -A` is documented as a temporary devkit deviation, not a consumer
example. Stage 2 must remove or replace it before the product offers any managed-hook mode.

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
- The concrete RFC 8785 implementation is selected in the Stage 1 plan; canonicalization bytes,
  semantic projection, and the prohibition on Unicode normalization are already fixed.
- The concrete pinned Unicode data version and default-case-fold implementation are selected before
  the Stage 1 portable-key phase; the locale-independent key and OS-invariant acceptance are fixed.
- Native shell-free process-liveness providers are selected in the Stage 1 plan; typed input and
  fail-closed behavior are already fixed.
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
| A mutation overwrites consumer content | Ownership digests, temporary candidates, all-path ancestor revalidation, journal recovery, and Stage 1-2 adversarial gates |
| Crash recovery overwrites a post-crash user edit | Accept only journaled old, candidate, or missing states; any third state blocks repair |
| First init cannot restore a missing prior lock | Journal lock state as absent or present and test rollback before and after candidate-lock write |
| Malformed run-lock metadata injects a liveness command or impersonates a stale owner | Strict typed validation plus direct OS APIs or fixed argv with shell disabled; ambiguity writes nothing |
| A stale run lock is still live, foreign, or missing its journal | Reclaim only matching same-host metadata after proven process death and exact journal evidence; otherwise preserve `.ai-tooling/` and write nothing |
| Formatting or implementation-specific normalization changes configuration identity | Use the field-by-field I-JSON projection, literal defaults, RFC 8785 JCS, and equal/non-equal conformance vectors |
| Sync blesses a changed pack source or range | Compare normalized JCS pack-selection projection and require the update lifecycle for any change |
| A semantically valid lock has noncanonical bytes | Read-only checks diagnose it and `sync` permits only a verified journaled lock-only rewrite |
| Schema validation reaches the network or rewrites published identity | Preload schemas plus metaschema/vocabularies, deny cold-cache network access, use relative `$ref`, and copy schema bytes exactly |
| A workspace junction aliases the canonical Stage 1 pack | Separate unsupported-kind and invalid-local diagnostics; accept only Git-index-tracked relative `configs/ai` before pack loading |
| Local journals or backups are accidentally committed | Require the owner or approved plan to add root `/.ai-tooling/` ignore before first state write; CLI verifies it and the unignored committed lock but edits neither repository-config file |
| A compatible version range hides a changed base resource | Record the base digest and block update until explicit override migration |
| A copied script becomes available without informed consent | Reject executable assets in Stage 1; require consent before copy or activation in Stage 4 |
| A platform changes its format or installation surface | Refresh official documentation and capability fixtures in Stages 3 and 5 |
| Native shadows or alternative entries hide generated guidance | Inventory root `AGENTS.override.md` and `.claude/CLAUDE.md` during every lifecycle command; checks fail and mutation writes nothing |
| Adapter targets or Windows paths bypass containment | Expand to leaves, use one pinned portable key on every OS, distinguish structural parents, and separately test native symlink/junction/reparse/UNC paths |
| A formatter rewrites generated lock or Markdown bytes | Keep exclusions human-owned and CLI-verified; AI Tooling launches a caller-explicit frozen direct or Node-entry provider with `shell: false`, fixed environment, timeout, bounded output, disposable `cwd`, registered-byte comparison, and real-checkout census |
| Public artifacts contain private prototype material or credentials | Clean implementation and Stage 5 source, secret, path, and license scans |
| Self-hosting creates circular bootstrap | Make human-owned ignore/formatter prerequisites effective before CLI state, then use workspace tooling, repository-relative pack input, clean init, and explicit local-pack refresh |
| Hook integration changes unrelated work | Opt-in marked blocks, read-only checks, and tests that forbid write formatters and `git add -A` |

## Tech stack and constraints

| Component | Choice | Source |
|---|---|---|
| Runtime | Node.js 24 or later | `package.json:6-18` |
| Package manager | pnpm 10.28 workspace | `package.json:5`, `pnpm-workspace.yaml:1-3` |
| Git | 2.36.0 or later for the formatter checkout census | Stage 1 formatter-provider decision |
| Language | TypeScript 6.0.3, ECMAScript module output | `package.json:28-31`; architecture decision |
| Canonical metadata | Strict I-JSON plus JSON Schema draft 2020-12 schemas, metaschema, and vocabularies from built-in or offline local identifiers | architecture decision |
| Configuration identity | SHA-256 over the field-by-field RFC 8785 JCS semantic projection and fixed conformance vectors | architecture decision |
| Generated output | Separate fixture-locked UTF-8/LF renderer; human-owned consumer config excludes the lock and every registered output, and a caller-explicit, fixed-environment disposable-copy audit verifies it without an implicit shell | architecture decision |
| Instruction bodies | Markdown | `docs/ai-tooling/product-brief.md:23-24` |
| Supported operating systems | Native Windows, Linux, and macOS release gates | portability NFR and Stage 5 gate above |

## Review gate

The repository owner approved the preceding immutable five-file snapshot on 2026-08-02. During
implementation-plan preparation, the native Windows check found R4: the exact `pnpm` formatter
invocation required a command shim that cannot run through Node with shell execution disabled. The
owner authorized only the direct-or-explicit-Node-entry correction with `go` on 2026-08-02.

On 2026-08-02, the repository owner approved the exact hash-defined R4 snapshot in
`docs/ai-tooling/research/devkit-baseline.md` with `approve written design`. That approval authorizes
the status, review-gate, and snapshot-record edits, their documentation-only commit, and creation of a
detailed Stage 1 implementation plan. Both written specifications are now Approved. It authorizes no
implementation, scaffolding, generated project output, hook change, dependency installation,
publication, or planning for Stages 2 through 5. The Stage 1 plan requires separate owner approval
before implementation starts.
