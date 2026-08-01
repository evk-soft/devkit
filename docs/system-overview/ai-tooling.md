# AI Tooling Architecture

Status: target architecture; implementation is delivered through separately approved stages
Date: 2026-08-01
Repository: `evk-soft/devkit`
Packages: `@evk-soft/ai-pack-core`, `@evk-soft/ai-tooling`
License: MIT

## 1. Purpose

This document defines the product architecture for reusable AI-agent rules, skills, project
adapters, safe lifecycle management, and optional capability recommendations in `evk-soft/devkit`.

The design intentionally separates reusable instructions from code analysis:

- `@evk-soft/ai-tooling` teaches tools and agents how to install, compose, validate, and distribute
  reusable workflows.
- `@evk-soft/ai-pack-core` contains the public EVK rule and skill catalog.
- `@evk-soft/code-intelligence` remains a separate product for symbols, references, dependencies,
  impact analysis, duplicate detection, dead-code analysis, and architecture graphs.

## 2. Context

Useful agent instructions currently tend to be copied between repositories and between platform
directories. Copying creates multiple hand-maintained sources, makes fixes difficult to distribute,
and allows platform outputs to drift (`docs/ai-tooling/product-brief.md:6-13`).

The system must distinguish five ownership layers:

1. public EVK behavior;
2. additional public behavior packs;
3. private organization behavior;
4. project-specific behavior;
5. personal or machine-local state.

The first four layers may contribute to a project's effective rule and skill catalog. Personal
credentials, authentication, local paths, and installed-plugin state must never enter a public pack
or a committed project lock file.

The sanitized prototype research establishes only behavioral lessons, not reusable implementation
bytes (`docs/ai-tooling/research/migration-lessons.md:6-38`). Platform capabilities are grounded in
the dated official-source baseline and must be refreshed before each adapter is implemented
(`docs/ai-tooling/research/platform-distribution-baseline.md:6-13,90-100`).

## Grounding

| Claim or design input | Repository evidence |
|---|---|
| `configs/*` and `packages/*` are existing workspace boundaries | `pnpm-workspace.yaml:1-3` |
| The current package-manager and runtime baseline is pnpm 10.28 and Node.js 24 | `package.json:5-18` |
| The public product boundary is two devkit packages, with code intelligence kept separate | `docs/ai-tooling/decisions/0001-package-boundaries.md:16-38` |
| Canonical JSON, Markdown bodies, source ownership, and target users are durable product requirements | `docs/ai-tooling/product-brief.md:15-52` |
| Direct copying, editable generated files, and path-only export allowlists are known failure modes | `docs/ai-tooling/research/migration-lessons.md:13-38` |
| Project configuration and plugin distribution differ by platform | `docs/ai-tooling/research/platform-distribution-baseline.md:15-100` |
| The existing pre-commit hook mutates the tree and stages every path | `.husky/pre-commit:1-2` |

## 3. Confirmed decisions and consequences

| Fork | Decision | Consequence |
|---|---|---|
| Repository placement | Develop AI tooling inside the public MIT `evk-soft/devkit` monorepository | Reuse devkit release and workspace conventions; do not create a standalone AI-tooling repository |
| Product boundary | Keep reusable agent behavior separate from `@evk-soft/code-intelligence` | Code indexing, duplicate and dead-code analysis, and architecture graphs evolve independently |
| Package boundary | Publish `@evk-soft/ai-pack-core` from `configs/ai` and `@evk-soft/ai-tooling` from `packages/ai-tooling` | Content and engine versions can change independently |
| Canonical metadata | Use standard JSON; keep instruction bodies and documentation in Markdown | JSON comments and YAML canonical sources are rejected; platform YAML is generated only when required |
| Public naming | Prefix public resource names with `evk-` and stable identifiers with `evk-soft/...` | Consumers can identify EVK resources without relying on platform display names |
| Publisher ownership | Edit public EVK behavior only under `configs/ai/**`; published packs are immutable | A content change creates a new pack version, while the source checkout remains editable |
| Consumer ownership | Keep project customizations only in committed `ai/overrides/**` | Direct changes to installed or generated EVK files are drift, not customization |
| Override semantics | `extend` adds compatible behavior; contradictions require `replace` or `disable` | The engine does not pretend to understand arbitrary Markdown conflicts |
| Local experimentation | Allow machine-local behavior only in isolated preview output | Local state cannot affect committed outputs or a continuous-integration result |
| Version resolution | Configuration declares sources and ranges; the lock pins exact inputs and output ownership | `sync` is reproducible and cannot silently select a newer pack |
| Safe mutation | Show a plan, verify ownership and digests, then use journaled per-file replacement | A crash is recoverable, but multi-file operating-system atomicity is not falsely promised |
| Executable trust | Make instruction-only resolution the default and require separate source trust and capability consent for activatable assets | Scripts, hooks, MCP servers, executables, and browser capabilities fail closed without recorded consent |
| Hook policy | Install checks only by explicit opt-in; non-interactive mode requires `--install-git-hooks` | Existing hooks are preserved and no hook stages unrelated files |
| External capabilities | Recommend a small vendor-qualified catalog and require confirmation for installation | Broad discovery is explicit and no agent recommendation silently changes global state |
| Platform scope | Target Codex, Claude Code, Cursor, Gemini CLI, and Antigravity through separate adapters | Unsupported required capabilities fail rather than disappearing from output |
| Self-hosting order | Make `devkit` the first real consumer after clean initialization and recovery are safe | The engine proves its own lock, generation, drift, and interruption contracts before wider adoption |

## 4. Goals

1. Store each reusable rule or skill once.
2. Produce deterministic platform-specific outputs.
3. Allow public, private, project, and local layers without losing ownership boundaries.
4. Preserve consumer changes during install, synchronization, update, and removal.
5. Detect missing, stale, modified, conflicting, and orphaned generated outputs.
6. Support new and existing repositories.
7. Give humans and agents one documented way to extend inherited behavior.
8. Provide fast local checks and complete continuous-integration checks.
9. Recommend useful external capabilities without turning installation into an unreviewed supply
   chain.
10. Remain usable on Windows, Linux, and macOS.

## 5. Non-goals

The first product implementation does not:

- index TypeScript, JavaScript, or other source languages;
- build a call graph or dependency graph from source code;
- detect semantic duplicates or dead code;
- replace a language server;
- implement the `@evk-soft/code-intelligence` MCP server;
- centralize consumer architecture, domain rules, branch policy, or credentials;
- authorize external services automatically;
- install arbitrary marketplace results by default;
- execute scripts from an untrusted pack during validation;
- publish automatically to every platform marketplace;
- provide a visual rule editor.

## 6. Repository and package boundaries

```text
evk-soft/devkit/
├── configs/
│   └── ai/                         # @evk-soft/ai-pack-core
│       ├── package.json
│       ├── pack.json
│       ├── rules/
│       └── skills/
├── packages/
│   └── ai-tooling/                 # @evk-soft/ai-tooling
│       ├── package.json
│       ├── catalog/
│       ├── schemas/
│       └── src/
│           ├── adapters/
│           ├── checks/
│           ├── cli/
│           ├── core/
│           ├── hooks/
│           ├── lifecycle/
│           ├── plugins/
│           └── security/
└── docs/
    ├── ai-tooling/
    └── superpowers/
        ├── specs/
        └── plans/
```

`configs/ai` is already covered by the repository's `configs/*` workspace pattern, and
`packages/ai-tooling` is covered by `packages/*` (`pnpm-workspace.yaml:1-3`). A new top-level
`tooling/` directory is not introduced.

The initial package version is `0.1.0`. Version `1.0.0` is reserved for the first compatibility-
committed release after all required project adapters, migration behavior, and public documentation
pass their acceptance gates.

The first implementation targets the repository's existing Node.js 24 and pnpm 10 baseline
(`package.json:5-18`). Runtime behavior is implemented in TypeScript and published as an ECMAScript
module package. Bun compatibility may be tested later but is not a version-0 requirement.

## 7. Source-of-truth model

### 7.1 Publisher source of truth

The official EVK source of truth is:

```text
devkit/configs/ai/**
```

Official rules and skills are edited only there. A published version of
`@evk-soft/ai-pack-core` is immutable; a content change requires a new package version.

The source checkout is intentionally editable while developing the pack. Self-hosting distinguishes
editable publisher sources under `configs/ai/**` from installed immutable package copies. Managed-
output protection never treats canonical publisher sources as generated files.

### 7.2 Consumer source of truth

A consumer repository owns and edits:

```text
ai-tooling.config.json
ai/overrides/**
```

The tool owns and writes:

```text
ai-tooling.lock.json
AGENTS.md
CLAUDE.md
GEMINI.md
.agents/**
.claude/**
.cursor/**
other declared adapter outputs
```

Local machine state is stored under `.ai-tooling/` and ignored by Git:

```text
.ai-tooling/cache/**
.ai-tooling/state.json
.ai-tooling/run.lock
.ai-tooling/transactions/**
.ai-tooling/backups/**
.ai-tooling/reports/**
.ai-tooling/previews/**
.ai-tooling/stale-locks/**
```

The repository root ignores `/.ai-tooling/` before any local state is created.
`ai-tooling.lock.json` remains outside that directory and must remain tracked and unignored.

`ai-tooling.lock.json` is committed. It pins resolved inputs and records output ownership and
digests so another machine and continuous integration can reproduce and verify the same result.

### 7.3 Ownership classes

Every relevant path is classified as one of:

- `source`: human-owned canonical configuration or override content;
- `managed`: generated and tracked by `ai-tooling.lock.json`;
- `unmanaged`: pre-existing or user-owned content outside tool ownership;
- `local-state`: machine-specific data that is never committed.

An unregistered path is never assumed to be managed because its name starts with `evk-`. Ownership
comes only from the committed lock record and an expected content digest.

## 8. Canonical format

### 8.1 JSON rules

All canonical metadata uses standard JSON with:

- UTF-8 encoding;
- line-feed line endings;
- two-space indentation;
- one final newline;
- deterministic key ordering in generated JSON;
- no duplicate keys;
- duplicate-key detection before ordinary JSON parsing can discard evidence of the duplicate;
- no comments;
- a required integer `schemaVersion`;
- a `$schema` reference for editor validation where appropriate.

Canonical schemas follow JSON Schema draft 2020-12 and live once under
`packages/ai-tooling/schemas/**`. Versioned schemas cover config, pack, rule, skill, override, lock,
state, and capability-catalog records. Pack building rewrites development-relative `$schema` values
to a version-tagged URL such as
`https://raw.githubusercontent.com/evk-soft/devkit/refs/tags/ai-tooling-v0.1.0/packages/ai-tooling/schemas/config.schema.json`;
other schema files use their exact exported filename and later releases replace the package version
in the tag. It does not copy a second hand-maintained schema set. The implementation may choose a
compatible validator, but validation behavior and error locations are part of the public contract.

The tooling package exports `.` as `dist/index.js` plus `dist/index.d.ts`,
`./schemas/*.json` as `schemas/*.json`, and `./package.json` as `package.json`. Its `ai-tooling`
binary maps to `dist/cli.js`; no other deep import is public.

### 8.2 Core pack layout

```text
configs/ai/
├── package.json
├── pack.json
├── rules/
│   └── evk-grounding/
│       ├── rule.json
│       └── instructions.md
└── skills/
    └── evk-plan/
        ├── skill.json
        ├── instructions.md
        ├── references/
        ├── scripts/
        └── templates/
```

The pack format can describe `scripts/` and other executable capabilities. The default
instruction-only security profile rejects an effective resource that declares scripts, hooks, MCP
servers, executables, connectors, or browser capabilities with
`EVK_SECURITY_EXECUTABLE_CONSENT_REQUIRED` before any such file is copied to a managed platform
path. An executable-capability profile may accept them only after separate source trust and
per-capability consent are recorded.

Example `skill.json`:

```json
{
  "$schema": "../../../../packages/ai-tooling/schemas/skill.schema.json",
  "schemaVersion": 1,
  "id": "evk-soft/skills/plan",
  "name": "evk-plan",
  "title": "EVK Implementation Planning",
  "description": "Create an implementation plan for an approved specification.",
  "instructions": "./instructions.md",
  "requiredCapabilities": []
}
```

Example `rule.json`:

```json
{
  "$schema": "../../../../packages/ai-tooling/schemas/rule.schema.json",
  "schemaVersion": 1,
  "id": "evk-soft/rules/grounding",
  "name": "evk-grounding",
  "title": "Evidence-Based Grounding",
  "description": "Require current evidence for claims about repository state.",
  "instructions": "./instructions.md",
  "scope": "repository"
}
```

The public `evk-` prefix is reserved for resources published by an EVK-authorized pack. A third-
party pack using that prefix fails validation unless its trusted catalog record grants the
namespace.

### 8.3 Consumer overrides

```text
ai/overrides/
├── rules/
│   └── evk-grounding/
│       ├── override.json
│       └── instructions.md
└── skills/
    └── evk-plan/
        ├── override.json
        └── instructions.md
```

Example `override.json`:

```json
{
  "$schema": "../../../../node_modules/@evk-soft/ai-tooling/schemas/override.schema.json",
  "schemaVersion": 1,
  "id": "my-project/skills/plan",
  "target": "evk-soft/skills/plan",
  "mode": "extend",
  "compatibility": {
    "pack": "@evk-soft/ai-pack-core",
    "version": "^0.1.0",
    "baseDigest": "sha256-..."
  },
  "instructions": "./instructions.md"
}
```

Supported modes are:

- `extend`: append instructions that are compatible with the inherited behavior;
- `replace`: replace inherited content for this consumer while retaining provenance;
- `disable`: omit the target resource from effective output;
- `rename`: change a platform-facing display name without changing the stable target identifier.

Complex automatic Markdown patching is not supported. It can produce text that merges cleanly but
contradicts itself semantically. `extend` does not claim to understand or resolve semantic conflict.
An override that weakens, cancels, or contradicts inherited behavior must use `replace` or `disable`.
When the base digest changes, update shows the exact base change and requires an explicit override
migration even when the package version remains inside the declared range.

### 8.4 Generated platform formats

Adapters may generate YAML front matter, platform JSON manifests, Markdown entry points, or another
documented platform format. These files are outputs, not canonical sources. For example, a generated
`SKILL.md` may contain required YAML front matter even though its source metadata is JSON.

Generated text begins with the strongest warning supported by the target format:

```text
GENERATED BY @evk-soft/ai-tooling — DO NOT EDIT.
Customize through ai/overrides/** and run ai-tooling sync.
```

Formats that cannot carry a safe comment, including strict JSON positions, receive no embedded
warning. Ownership is always enforced by `ai-tooling.lock.json`; an in-file banner is defense in
depth, not proof of ownership.

## 9. Resolution and precedence

The effective catalog is resolved in this order:

```text
EVK public core
  < dependent public packs
  < organization or private packs
  < committed project overrides
```

Higher layers win. The resolver applies overrides before an adapter runs, so each platform receives
one effective resource rather than multiple conflicting versions.

Resolution invariants:

1. A stable resource identifier may have one definition at a precedence level.
2. Two definitions at the same level are an error unless configuration explicitly selects one.
3. An override whose target no longer exists is an `orphan override` error.
4. A renamed resource requires a migration record from its previous stable identifier.
5. The target pack version and base resource digest are checked before update output is generated.
6. A required adapter capability that is unavailable is an error, never a silent omission.
7. Content behavior may be replaced or disabled by the consumer.
8. Engine safety invariants cannot be overridden by content packs.

Non-overridable engine invariants include path containment, digest verification, ownership checks,
explicit hook consent, journaled recoverable writes, and safe removal.

An uncommitted local override may be selected only for a local preview that writes into an isolated
preview directory. It cannot modify committed managed outputs or `ai-tooling.lock.json`, and
`check --ci` rejects a configuration that attempts to enable it.

## 10. Configuration, lock, and state

`ai-tooling.config.json` is human-owned and committed. It selects packs, platforms, project
overrides, hook policy, and plugin recommendations.

```json
{
  "$schema": "./node_modules/@evk-soft/ai-tooling/schemas/config.schema.json",
  "schemaVersion": 1,
  "packs": [
    {
      "source": "npm",
      "package": "@evk-soft/ai-pack-core",
      "version": "^0.1.0"
    }
  ],
  "platforms": ["codex", "claude-code", "cursor"],
  "overrides": ["ai/overrides"],
  "gitHooks": {
    "preCommit": true,
    "prePush": false
  },
  "plugins": {
    "profile": "recommended",
    "recommend": [
      "superpowers/core",
      "upstash/context7",
      "openai/codex-security"
    ]
  }
}
```

Pack sources may be npm packages, Git repositories pinned to an exact commit, or local paths. A
local pack that contributes to committed managed outputs must use a repository-relative path, remain
inside the repository after real-path and reparse-point checks, and be tracked by Git. Its lock entry
stores the normalized relative path and integrity digest, never an absolute machine path. A local
path outside the repository is allowed only for isolated preview and makes `check --ci` fail.

An HTTPS Markdown URL is not loaded as live instructions. Remote content is fetched into a cache,
validated as a complete pack, pinned, and assigned an integrity digest before use.

`ai-tooling.lock.json` is tool-owned and committed. It records:

- the `ai-tooling` version;
- a digest of the human configuration;
- a digest of the normalized pack-selection projection from that configuration;
- exact pack versions, source revisions, and integrity digests;
- resolved resource identifiers and migrations;
- selected adapter versions and capabilities;
- each managed output path, generator, adapter, all contributing resource identifiers, adoption
  state, and SHA-256 digest.

The lock never contains absolute machine paths, credentials, authentication state, or the actual
installed/enabled state of global plugins.

`.ai-tooling/state.json` is local and uncommitted. It may cache detected platform installations,
plugin availability, authentication-required flags, and last successful local diagnostics. It never
contains credentials.

Installed plugin state is not committed because it differs per user and machine. A project may
declare that a capability is recommended or required, but each environment reports its own
installation state.

## 11. Components

`@evk-soft/ai-tooling` is divided into independently testable components:

- **Schema validator:** validates JSON structure and reports exact file and property locations.
- **Pack loader:** resolves trusted local, npm, and Git pack sources without executing pack code.
- **Integrity verifier:** verifies immutable source digests and cache contents.
- **Catalog resolver:** builds the precedence graph and detects collisions, cycles, and orphans.
- **Override composer:** produces one effective resource per stable identifier.
- **Capability negotiator:** compares effective resource requirements with adapter capabilities.
- **Platform adapters:** render deterministic platform files from the effective catalog.
- **Ownership registry:** compares current managed bytes with committed lock records.
- **Transaction manager:** prepares all writes in a temporary directory, journals file-level atomic
  replacements, and supports rollback and interrupted-operation recovery.
- **Documentation checker:** validates local Markdown paths, images, anchors, and path casing.
- **Lifecycle service:** implements initialize, import, synchronize, update, remove, and rollback.
- **Hook integration:** adds and removes only explicitly marked managed hook blocks.
- **Capability catalog:** describes curated external skills, plugins, connectors, extensions, and MCP
  servers.
- **Plugin planner:** detects local state and creates an installation plan without applying it.
- **Security scanner:** checks publication contents, executable capabilities, paths, and credential
  signatures.
- **Diagnostics reporter:** produces human output and stable machine-readable JSON.

No component writes directly while resolving or rendering. Only the transaction manager may mutate
managed repository paths. Multi-file mutation uses a journal, atomic replacement per individual
file, rollback for handled failures, and startup recovery for an interrupted process; it does not
promise that an operating-system crash cannot occur between two file replacements.

## 12. Platform adapter contract

Each adapter declares:

- a stable adapter identifier and version;
- supported source resource kinds;
- supported capability set;
- target paths it may own;
- deterministic render functions;
- validation for its generated format;
- installation surface and restart requirements, when applicable.

Capability-installation adapters declare each operation independently:

```text
detect | recommend | open-ui | emit-command | install | uninstall
```

`plugins apply` may perform an operation only when the adapter marks it supported and the operation
uses a currently documented official interface. Otherwise it emits a reviewed command, opens an
official installation surface after confirmation, or prints exact manual instructions.

Initial adapter families are:

| Adapter | Project output | Distribution output |
|---|---|---|
| `codex-project` | `AGENTS.md`, `.agents/skills/**` | none |
| `openai-plugin` | none | `.codex-plugin/plugin.json`, skills, declared integrations |
| `claude-code-project` | `CLAUDE.md`, `.claude/rules/**`, `.claude/skills/**` | none |
| `claude-code-plugin` | none | Claude Code plugin bundle |
| `cursor-project` | `.cursor/rules/**` and supported project resources | none |
| `cursor-plugin` | none | Cursor plugin bundle |
| `gemini-cli-project` | `GEMINI.md` and supported project resources | none |
| `gemini-cli-extension` | none | Gemini CLI extension bundle |
| `antigravity-project` | supported `.agents/**` project resources | none |
| `antigravity-plugin` | none | Antigravity plugin bundle |

The implementation stage for an adapter must refresh that platform's official documentation and
record a capability fixture. This table is a product boundary, not permission to guess undocumented
manifest fields.

Codex project guidance must not be written to `.codex/rules`; that surface is command-approval
policy rather than repository guidance.

Platform plugins and extensions begin as generated distribution artifacts under
`dist/platforms/**`. They become independent publishable packages only if a platform requires an
independent dependency graph, version, or release process.

## 13. Command lifecycle

Public commands:

```text
ai-tooling init
ai-tooling import
ai-tooling sync
ai-tooling check
ai-tooling diff
ai-tooling import-edits
ai-tooling update
ai-tooling remove
ai-tooling doctor
ai-tooling doctor --report
ai-tooling restore-generated <path>
ai-tooling docs check-links
ai-tooling pack validate
ai-tooling pack build
ai-tooling pack refresh-local <pack>
ai-tooling pack verify-publication
ai-tooling plugins plan
ai-tooling plugins apply
ai-tooling plugins discover
ai-tooling hook pre-commit
ai-tooling hook pre-push
```

All mutating commands support `--dry-run`. Read-only commands never repair state implicitly.
Machine-readable commands support `--json`.

### 13.1 Initialize

`init` detects repository shape, package manager, existing AI files, supported platforms, and hook
infrastructure. It creates a proposed configuration and file plan. Interactive mode asks for
confirmation. Non-interactive mode requires explicit flags for every external side effect.

Clean initialization applies when no managed lock or conflicting existing AI target files exist;
`init` may then write the initial configuration and lock through the transaction manager. If
existing AI files require adoption, it writes nothing and directs the user to the explicit `import`
flow. Hook installation remains a separate opt-in action.

### 13.2 Import an existing project

`import` inventories existing AI files and classifies them as unmanaged. It may copy their current
bytes into `ai/overrides/imported/**`, build a generated preview, and show the byte and structural
differences to a human. It does not claim to prove semantic equivalence. Ownership transfers only
after explicit human review and acceptance.

If the user declines ownership transfer, the original file remains untouched and the adapter is
reported as incompletely integrated. The tool does not inject an undocumented partial include.

Version 0 supports adoption of an entire existing target file only. Managed blocks inside a
partially user-owned `AGENTS.md`, `CLAUDE.md`, or equivalent file are deferred until a separate
ownership and merge design exists.

### 13.3 Synchronize

`sync` performs:

1. configuration and current-output ownership and digest verification;
2. loading the exact pack versions and digests already frozen in `ai-tooling.lock.json`;
3. schema and integrity validation;
4. override composition;
5. capability negotiation;
6. rendering into a temporary directory;
7. generated-format, link, and ownership validation;
8. a proposed diff;
9. journaled recoverable application with atomic replacement per file;
10. output-ownership and configuration-digest update in the lock, without changing frozen pack
    selection, input versions, revisions, or integrity digests.

`sync` does not select newer pack versions, install external plugins, or change global user
configuration. `init` creates the initial lock, `update` changes remote package versions or source
revisions, and `pack refresh-local` explicitly changes the digest of an already selected tracked
repository-local pack. `sync` performs none of those input-selection operations.

Before accepting a changed configuration, `sync` compares its normalized pack-selection projection
with the projection digest in the lock. The projection includes pack addition or removal, source
kind, package name, repository-local path or Git URL, requested version range, pinned revision or
integrity policy, and resolution flags. Any change blocks with `EVK_CONFIG_REQUIRES_UPDATE`; it is
never covered by a new general configuration digest. A non-selection configuration change may
advance the full configuration digest only when every exact locked input remains identical and the
complete output diff passes ownership and transaction checks.

### 13.4 Check and diff

`check` performs the same resolution and rendering in memory but writes nothing. It fails for
missing, stale, modified, conflicting, and orphaned outputs. `diff` explains source-to-output and
current-to-expected changes.

### 13.5 Update

`update --check` reports available versions, affected resources, output changes, migrations, and
override compatibility. `update` does not change the lock or outputs until the complete new state
passes validation. An incompatible override blocks the update.

### 13.6 Refresh a repository-local pack

`pack refresh-local <pack>` is the narrow repository-local self-hosting operation. It accepts only a pack
already selected from a tracked repository-relative source. It validates schemas, shows the old and
new pack digests and resource diff, and changes only that locked local-pack digest after explicit
confirmation. It cannot select another source, version, or remote revision. Until the following
`sync` succeeds, `check` reports the managed outputs as stale.

### 13.7 Remove

`remove` first re-renders shared outputs from the contributors that remain. It deletes a managed path
only when no contributors remain and the current file still has its expected digest. It never
deletes consumer configuration, override sources, or unregistered paths. Modified managed files
block removal until the user preserves them through an explicit recovery choice.

### 13.8 Import accidental edits

`import-edits` compares a modified generated output with its recorded source result. Because a
platform output may have lost canonical structure, the command never promises lossless reverse
conversion. It may offer only explicit choices supported by the adapter: create a full `replace`
override, preserve a platform-specific passthrough resource, show a manual migration guide, or
cancel. The user reviews the complete result before the generated output is restored.

## 14. Transactions and recovery

Mutations use a recoverable journaled transaction:

1. create `.ai-tooling/run.lock` exclusively with phase `pre-journal`, an operation ID, random nonce,
   host identity, process ID, and process-start marker;
2. write and flush a journal header with the same operation ID and nonce plus the prior lock state;
3. atomically and durably advance the same run-lock metadata to phase `journal-ready` without
   changing its operation, nonce, host, or process identity;
4. verify current managed bytes;
5. render and validate a complete candidate tree in a temporary directory;
6. record a recoverable local backup of managed paths being replaced;
7. journal and atomically replace each individual file;
8. write the new lock last;
9. verify the final tree;
10. release the run lock and remove its metadata file.

The phase change is flushed before mutation and uses an atomic same-directory replacement plus the
platform's directory-durability equivalent. No managed repository path may change before both the
journal header and the `journal-ready` phase are durable.

Repository lock state is represented as `absent` or `present(SHA-256)`. The journal records an
operation identifier, prior and candidate lock states, and for every affected path its prior state,
candidate state, expected digest or absence marker, completed step, and backup digest. This makes a
first `init` with no prior lock recoverable.

A normal command that finds `run.lock` stops without writing. `doctor --repair` may reclaim a
`journal-ready` lock only when the lock metadata names the same journal operation and nonce, the
host identity matches the current host, and the operating system proves that no process with the
recorded process ID and start marker is alive. It atomically moves the verified stale metadata to
`stale-locks/`, exclusively creates a new recovery lock, and then revalidates the journal and all
bytes. A live process, foreign host, reused process ID, changed metadata, failed exclusive create, or
unavailable liveness proof is ambiguous and causes zero writes. There is no force-reclaim flag.

If a proven-stale `pre-journal` lock has no journal, repair may archive and remove only that lock
after confirmation. A `pre-journal` lock with a matching header may be abandoned only when the
journal contains no mutation step or backup; repair archives both records after rechecking their
exact metadata. A `journal-ready` lock without its matching journal, an unknown phase, changed lock
metadata, or a corrupt or mismatched journal remains blocking and causes zero writes. Absence of a
journal is never used as evidence that a `journal-ready` transaction did not mutate managed paths.

Backups needed by an active or interrupted journal are never pruned. After a successful ordinary
transaction and final verification, its transient backups are deleted. A successful manual restore
keeps the newest verified preimage backup for that managed path; an older completed restore backup
may be removed only after the replacement backup and transaction commit are verified. Configurable
time- or count-based retention is an extension of this minimum rule. Local backups are never
committed.

On a handled failure, the prior managed tree and lock are restored. A process or operating-system
crash may interrupt the sequence between two file replacements; the journal makes this detectable.
Ordinary commands then stop. `doctor` reports the interrupted operation without writing.

`doctor --repair` is a separate mutating recovery mode. It shows whether it proposes completion or
rollback, supports `--dry-run`, and requires confirmation. Non-interactive recovery must explicitly
name the operation identifier and the `--complete` or `--rollback` action.

Repair proceeds only when every affected path matches its journal-recorded prior digest, candidate
digest, or absence marker and every required backup matches its recorded digest. Any third,
user-modified state stops the entire repair without writing. The repository lock must match either
the journaled prior or candidate `LockState`, including `absent` for a first initialization; any
other state also stops repair. Rollback restores the prior state, so a prior `absent` state removes a
partially created candidate lock only after all candidate outputs have been safely rolled back.

## 15. Generated-file protection

Before overwrite or deletion, current bytes must match the lock digest. If not, the operation stops:

```text
EVK_OUTPUT_MODIFIED

Generated file was changed outside @evk-soft/ai-tooling:
  .claude/skills/evk-plan/SKILL.md

The file was not overwritten.
Available actions depend on the installed lifecycle capabilities:
  ai-tooling import-edits .claude/skills/evk-plan/SKILL.md
  ai-tooling restore-generated .claude/skills/evk-plan/SKILL.md
```

The same rule applies to `sync`, `update`, and `remove`. There is no generic force bypass.
Diagnostics never recommend a command unavailable in the installed lifecycle stage; when
`import-edits` is unavailable they offer manual preservation or the explicit discard-and-restore
path.

`restore-generated` is a controlled compare-and-swap exception for one explicitly selected,
registered managed path. Its plan shows the observed current digest or absence marker, expected
generated digest, backup path, and exact diff. Confirmation accepts only that observed state.
Immediately before writing, the transaction manager rechecks that the current state is unchanged,
creates and verifies an exact preimage backup when bytes exist, and replaces the path only with the
expected output rendered from the current locked inputs. A concurrent change, active interrupted
journal, unregistered path, invalid locked input, or backup mismatch causes zero writes. The command
supports `--dry-run` and never bypasses containment or ownership.

Journal repair and explicitly confirmed `restore-generated` are the only controlled exceptions to
comparing a path solely with the currently committed output digest. Neither is a generic force
overwrite.

## 16. Git and platform hooks

Git-hook installation is opt-in. Interactive `init` shows an exact patch and asks permission.
Non-interactive installation requires `--install-git-hooks`.

When Husky and pnpm are present, the generated block is:

```sh
# BEGIN @evk-soft/ai-tooling
pnpm exec ai-tooling hook pre-commit
# END @evk-soft/ai-tooling
```

This is a pnpm example, not a hard-coded command. Hook generation uses the package manager detected
by `init`; an unsupported or ambiguous manager blocks hook installation instead of guessing.

Removal deletes only an unchanged managed block. Existing hook content is preserved. Hooks never run
formatters in write mode and never call `git add -A`.

The pre-commit hook runs fast, staged-aware checks without writes:

```text
ai-tooling pack validate --staged
ai-tooling docs check-links --staged
ai-tooling check --staged
```

The optional pre-push hook may run full local validation. Continuous integration remains the
authoritative complete gate.

Platform lifecycle hooks may provide defense in depth by denying writes to registered generated
paths and pointing the agent to `ai/overrides/**`. They are adapter-specific and optional. Cross-
platform correctness never depends only on those hooks.

## 17. Documentation link checker

`ai-tooling docs check-links` validates:

- relative Markdown links;
- linked images and local assets;
- heading anchors;
- percent-encoded local paths;
- exact path casing, including when running on Windows;
- links in README files, rules, skills, references, and templates.

It ignores examples inside fenced and inline code. A staged mode limits common changes but scans the
complete reverse-reference set when a target is renamed or deleted.

External HTTP checks are separate:

```text
ai-tooling docs check-links --external
```

External availability is not a blocking pre-commit check because remote sites may be temporarily
unavailable. It runs in a dedicated continuous-integration or scheduled job with retry and allowlist
policy.

## 18. Curated capability catalog

The tool models external capabilities independently of their platform packaging:

- skill pack;
- plugin;
- extension;
- connector;
- MCP server;
- browser extension;
- lifecycle hook bundle.

The built-in curated catalog is JSON:

```text
packages/ai-tooling/catalog/
├── capabilities.json
├── profiles.json
└── platforms/
    ├── antigravity.json
    ├── claude-code.json
    ├── codex.json
    ├── cursor.json
    └── gemini-cli.json
```

Initial recommendation candidates include Superpowers for structured engineering workflows,
Context7 for current library documentation, and Codex Security for security review where supported.
Catalog inclusion does not imply installation or endorsement for every project.

Default behavior shows only curated entries. `plugins discover` explicitly queries configured
external catalogs. Every proposed capability shows its source, provider, version, permissions,
hooks, external services, authentication needs, data access, files changed, and restart behavior.

`plugins plan` is read-only. `plugins apply` requires confirmation and delegates to a verified
platform-specific installation adapter only for its declared operations. When a platform exposes no
confirmed install interface, the adapter uses `open-ui`, `emit-command`, or manual guidance instead
of pretending installation succeeded. Credentials are handled by the target platform and never
written to project JSON.

Third-party catalogs may be added from pinned npm, Git, or local pack sources. Catalog trust is
separate from executable-capability trust. A catalog may recommend an entry without granting its
scripts or hooks permission to run.

Third-party plugin instructions remain outside the EVK source of truth. AI tooling may report name
collisions, compatibility, and installation state, but it does not claim ownership of or silently
rewrite another provider's installed instructions.

## 19. Error and diagnostics contract

Human-readable errors contain:

- a stable error code;
- a concise explanation;
- the exact affected path or resource identifier;
- confirmation that no unsafe write occurred;
- one or more explicit recovery actions.

Machine-readable mode returns the same fields as JSON.

Error families:

```text
EVK_CONFIG_*
EVK_PACK_*
EVK_OVERRIDE_*
EVK_OUTPUT_*
EVK_LINK_*
EVK_PLUGIN_*
EVK_SECURITY_*
EVK_UPDATE_*
EVK_INTERNAL_*
```

Exit codes are stable:

- `0`: success;
- `1`: validation failure or drift;
- `2`: invalid command or configuration;
- `3`: ownership, conflict, or required user action;
- `4`: unavailable environment or external dependency;
- `5`: internal defect.

`doctor` without `--repair` is read-only. It checks runtime versions, Git, JSON schemas, pack
integrity, lock state, managed-file digests, path permissions, platform availability, hook
integration, plugin state, restart requirements, override compatibility, and interrupted
transactions. `doctor --repair` is the separately confirmed mutating recovery mode defined in the
transaction contract; read-only diagnostics never repair state implicitly.

`doctor --report` redacts tokens, credentials, private override content, and unnecessary personal
paths. By default it writes the report to standard output. An explicitly selected `--output` path
may create a local report under `.ai-tooling/reports/**`; that is local diagnostic state, not a
managed repository mutation. No implicit report file is created.

## 20. Security model

The security boundary is fail-closed:

1. A third-party pack is untrusted until its source and digest are explicitly accepted.
2. Validation never executes pack scripts.
3. Skill scripts and similar assets are executable capabilities. Copying them into a platform
   discovery path may itself make them available to an agent, so separate permission is required
   before copying, installation, activation, or execution. Until that consent mechanism exists,
   instruction-only resolution rejects these assets before output generation.
4. File access is path-contained and rejects symbolic links, Windows junctions and other reparse
   points, UNC-path escapes, case-folding collisions, and Unicode-normalization collisions.
5. Remote instructions are pinned before use; mutable live Markdown is not an input.
6. Publication scans reject credentials, private keys, machine paths, local settings, and declared
   private-name patterns.
7. Authentication tokens are absent from config, lock, state reports, and diagnostic reports.
8. A plugin is not installed because an agent merely recommended it.
9. Generated-file deletion requires both ownership and expected content.
10. Consumer overrides may change content behavior but cannot disable engine safety invariants.

The public implementation is a clean implementation of the approved behavior. No source bytes from
the private `UNLICENSED` prototype are copied into the MIT repository without a separate rights
decision.

## 21. Devkit self-hosting

`devkit` is the first consumer:

```text
devkit develops @evk-soft/ai-tooling
        -> ai-tooling composes @evk-soft/ai-pack-core
        -> adapters generate devkit project files
        -> devkit continuous integration verifies them
```

The repository commits its generated project outputs and `ai-tooling.lock.json`. Continuous
integration runs check-only commands and never repairs the branch.

Automated tests use temporary project and home directories. They never modify the developer's real
Codex, Claude Code, Cursor, Gemini, or Antigravity configuration. Real external plugin installation
is an explicit manual acceptance test.

## 22. Testing strategy

### 22.1 Unit tests

Unit tests cover schema errors, stable serialization, precedence, override modes, collision and
cycle detection, capability negotiation, path containment, digest checks, and error serialization.

### 22.2 Fixture integration tests

Required fixtures include:

```text
empty-project
existing-ai-files
modified-generated-file
missing-generated-file
orphan-generated-file
project-overrides
multiple-packs
conflicting-packs
broken-links
renamed-link-target
unsupported-capability
executable-capability-rejected
first-init-prior-lock-absent
live-run-lock
stale-same-host-run-lock
foreign-or-ambiguous-run-lock
stale-pre-journal-run-lock-without-journal
journal-ready-run-lock-without-journal
run-lock-journal-mismatch
restore-generated-compare-and-swap
pack-selection-config-drift
local-state-gitignore
symbolic-link-escape
windows-junction-escape
windows-reparse-point-escape
windows-unc-escape
windows-case-fold-collision
windows-unicode-normalization-collision
codex-project
claude-code-project
cursor-project
gemini-cli-project
antigravity-project
```

Tests use temporary homes and mocked platform installers. They prove planning and state detection
without touching real global state.

### 22.3 Determinism tests

The same canonical inputs, lock, platform versions, and configuration must produce identical bytes
on Windows, Linux, and macOS. Repeated synchronization must produce an empty diff.

### 22.4 Adversarial lifecycle tests

Tests deliberately modify, delete, rename, and replace managed outputs; create unregistered files at
target paths; introduce symbolic-link, Windows junction and reparse-point, UNC, case-folding, and
Unicode-normalization attacks; interrupt first-init and existing-lock transactions; leave live,
stale, and ambiguous run locks; prove that stale `pre-journal` without a journal is reclaimable while
`journal-ready` without a journal writes nothing; change a file after restore confirmation; alter
pack-selection configuration; introduce a third post-crash file state; and break override
compatibility. Each case must fail without partial mutation or user-content loss.

### 22.5 Self-hosting and continuous integration

`devkit` verifies:

```text
ai-tooling check
ai-tooling docs check-links
ai-tooling pack validate
package tests
publication safety scan for release artifacts
```

Self-hosted hook integration follows the check-only contract in Section 16 and never formats in
write mode or stages files.

## 23. Documentation surfaces

Repository documentation is English. Required durable documents are:

```text
docs/ai-tooling/USER-GUIDE.md
docs/ai-tooling/AI-AUTHORING-GUIDE.md
docs/ai-tooling/EXTENDING-PACKS.md
docs/ai-tooling/MIGRATING-EXISTING-PROJECT.md
docs/ai-tooling/PLATFORM-SUPPORT.md
docs/ai-tooling/SECURITY.md
```

The AI authoring guide requires this workflow:

```text
edit canonical pack or consumer override
  -> ai-tooling sync
  -> review generated diff
  -> ai-tooling check
```

It explicitly prohibits manual copying between platform directories and direct edits to generated
files.

Durable architecture, package, user, and security documentation may link to each other and to
accepted decision records. It never links to temporary specifications or implementation plans.

## 24. Verification invariants

The product is conformant only when evidence proves all of these invariants:

1. A clean consumer initializes with a pinned core pack.
2. An existing consumer imports instructions without lost bytes or silent ownership transfer.
3. A project override wins over inherited content in one effective generated resource.
4. Repeated generation is byte-identical across supported operating systems.
5. Missing, modified, stale, orphaned, and conflicting outputs fail check-only validation.
6. Update blocks incompatible overrides and applies no partial state.
7. Removal preserves every unowned or modified file.
8. Local links, anchors, images, and path casing are validated.
9. Unsupported required adapter capabilities fail with a stable diagnostic.
10. Git-hook installation preserves existing hook content and never stages files.
11. Plugin planning distinguishes installed, available, authentication-required, restart-required,
    and unsupported states without global mutation.
12. Real plugin installation requires explicit confirmation.
13. Release artifacts contain no credentials, machine-local settings, private source material, or
    project-specific domain rules.
14. `devkit` consumes and verifies its own generated project outputs.
15. Human and AI documentation explains the source-of-truth and override workflow.
16. No executable or activatable asset is copied, installed, enabled, or executed without the
    required source trust and capability consent.
17. Interrupted-operation recovery refuses every path or lock state not recorded in its journal.
18. First initialization can roll back to an absent repository lock.
19. A live, foreign-host, reused, changed, or unverifiable run lock causes zero repair writes.
20. Manual generated-file restore uses the exact observed state as a compare-and-swap precondition
    and preserves a verified preimage.
21. `sync` never advances a changed pack-selection projection.
22. Local `.ai-tooling/**` state is ignored while the committed lock remains unignored.
