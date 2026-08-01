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
(`docs/ai-tooling/research/platform-distribution-baseline.md:6-13,121-133`).

## Grounding

| Claim or design input | Repository evidence |
|---|---|
| `configs/*` and `packages/*` are existing workspace boundaries | `pnpm-workspace.yaml:1-3` |
| The current package-manager and runtime baseline is pnpm 10.28 and Node.js 24 | `package.json:5-18` |
| The public product boundary is two devkit packages, with code intelligence kept separate | `docs/ai-tooling/decisions/0001-package-boundaries.md:16-38` |
| Canonical JSON, Markdown bodies, source ownership, and target users are durable product requirements | `docs/ai-tooling/product-brief.md:15-52` |
| Direct copying, editable generated files, and path-only export allowlists are known failure modes | `docs/ai-tooling/research/migration-lessons.md:13-38` |
| Project configuration and plugin distribution differ by platform | `docs/ai-tooling/research/platform-distribution-baseline.md:15-120` |
| The existing pre-commit hook mutates the tree and stages every path | `.husky/pre-commit:1-2` |
| Repository text files are normalized to LF on checkout | `.gitattributes:1` |
| The root Biome configuration currently formats JSON and has no AI-tooling exclusions | `biome.json:1-4`, `configs/biome-config/biome.preset.json:3-50` |
| The shared Biome preset is public and must not receive product-specific path policy | `configs/biome-config/package.json:2-8`, `configs/biome-config/package.json:19-24` |
| pnpm uses isolated linking and the current continuous-integration workflow is Ubuntu-only | `.npmrc:1-3`, `.github/workflows/ci.yml:8-47` |

## 3. Confirmed decisions and consequences

| Fork | Decision | Consequence |
|---|---|---|
| Repository placement | Develop AI tooling inside the public MIT `evk-soft/devkit` monorepository | Reuse devkit release and workspace conventions; do not create a standalone AI-tooling repository |
| Product boundary | Keep reusable agent behavior separate from `@evk-soft/code-intelligence` | Code indexing, duplicate and dead-code analysis, and architecture graphs evolve independently |
| Package boundary | Publish `@evk-soft/ai-pack-core` from `configs/ai` and `@evk-soft/ai-tooling` from `packages/ai-tooling` | Content and engine versions can change independently |
| Canonical metadata | Use standard JSON; keep instruction bodies and documentation in Markdown | JSON comments and YAML canonical sources are rejected; platform YAML is generated only when required |
| Configuration identity | Hash the versioned semantic configuration projection with RFC 8785 JSON Canonicalization Scheme and SHA-256 | Formatting, member order, and equivalent escapes do not create configuration drift |
| Public naming | Prefix public resource names with `evk-` and stable identifiers with `evk-soft/...` | Consumers can identify EVK resources without relying on platform display names |
| Publisher ownership | Edit public EVK behavior only under `configs/ai/**`; published packs are immutable | A content change creates a new pack version, while the source checkout remains editable |
| Consumer ownership | Keep project customizations only in committed `ai/overrides/**` | Direct changes to installed or generated EVK files are drift, not customization |
| Override semantics | `extend` adds compatible behavior; contradictions require `replace` or `disable` | The engine does not pretend to understand arbitrary Markdown conflicts |
| Local experimentation | Allow machine-local behavior only in isolated preview output | Local state cannot affect committed outputs or a continuous-integration result |
| Version resolution | Configuration declares sources and ranges; the lock pins exact inputs and output ownership | `sync` is reproducible and cannot silently select a newer pack |
| Safe mutation | Show a plan, verify ownership and digests, then use journaled per-file replacement | A crash is recoverable, but multi-file operating-system atomicity is not falsely promised |
| Formatter ownership | The consumer owner or an approved implementation plan excludes the repository lock and every lock-registered output from consumer write formatters; AI Tooling verifies but never edits formatter configuration | Repository config stays human-owned while generated bytes retain one writer |
| Executable trust | Make instruction-only resolution the default and require separate source trust and capability consent for activatable assets | Scripts, hooks, MCP servers, executables, and browser capabilities fail closed without recorded consent |
| Hook policy | Install checks only by explicit opt-in; non-interactive mode requires `--install-git-hooks` | Existing hooks are preserved and no hook stages unrelated files |
| External capabilities | Recommend a small vendor-qualified catalog and require confirmation for installation | Broad discovery is explicit and no agent recommendation silently changes global state |
| Platform scope | Target Codex, Claude Code, Cursor, Gemini CLI, and Antigravity through separate adapters | Unsupported required capabilities fail rather than disappearing from output |
| Adapter path ownership | Register all normalized candidate paths across selected adapters before rendering | Exact, prefix, case-fold, and Unicode-normalization collisions fail before any write |
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
.gitignore
biome.json or another repository formatter configuration
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

The repository owner or an approved implementation plan adds a root `/.ai-tooling/` ignore before
any local state is created. AI Tooling verifies that prerequisite but never edits `.gitignore`.
`ai-tooling.lock.json` remains outside that directory and must remain tracked and unignored.

The consumer owner or approved plan likewise excludes the repository lock itself and every output
path registered by it from each repository write formatter. AI Tooling never edits that
configuration. The public `@evk-soft/biome-config` preset does not carry AI-tooling product paths.
For `devkit`, the Stage 1 implementation plan adds exact exclusions to the root `biome.json` for
`ai-tooling.lock.json`, `AGENTS.md`, `CLAUDE.md`, `.agents/**`, and `.claude/**` before self-hosting.
`ai-tooling.config.json` remains in formatter scope because it is human-owned and its identity is
semantic.

Stage 1 authors these formatter exclusions only for `devkit`. Every other consumer supplies its own
repository configuration; AI Tooling can verify the resulting byte stability through the generic
audit below but does not configure that formatter.

`doctor --formatter-check -- <executable> [args...]` is the formatter-independent verification path.
The caller explicitly supplies a trusted local executable and argument array; AI Tooling performs no
shell interpolation, command inference, package acquisition, or network resolution. In a disposable
copy of the repository it renders the lock-registered expected outputs, invokes that command in write
mode, and reports the formatter exit status plus every registered path whose bytes changed. The real
checkout is read-only. The same mechanism can exercise Biome, Prettier, dprint, or another
repository-configured formatter without making its configuration tool-owned. Stage 1 requires this
gate for `devkit`; automatic formatter discovery or configuration remains outside Stage 1.

`ai-tooling.lock.json` is committed. It pins resolved inputs and records output ownership and
digests so another machine and continuous integration can reproduce and verify the same result.

### 7.3 Ownership classes

Every relevant path is classified as one of:

- `source`: human-owned canonical configuration or override content;
- `repository-config`: human-owned operational files such as `.gitignore` and formatter
  configuration that AI Tooling may read through the containment gateway and validate but never
  writes;
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

The product parser rejects comments and trailing commas before schema validation, even when a
consumer formatter such as the current `devkit` Biome preset accepts comments. The diagnostic names
the standard-JSON requirement and the exact offending token rather than reporting a generic schema
failure.

JCS input must also satisfy the I-JSON constraints required by RFC 8785. The parser rejects lone
Unicode surrogates and any number that is non-finite or cannot round-trip exactly through an
IEEE-754 double. It does not repair or normalize rejected input.

Configuration identity uses the JSON Canonicalization Scheme in
[RFC 8785](https://www.rfc-editor.org/rfc/rfc8785.html), encoded as UTF-8 and hashed with SHA-256.
JCS recursively sorts object properties, preserves array order, applies its specified primitive and
number serialization, emits no insignificant whitespace, and preserves parsed Unicode strings
without Unicode normalization. Digest fields record the algorithm identifier `sha256-jcs-rfc8785`.
This canonical digest representation is separate from the human-readable generated JSON format.

Generated JSON uses a versioned deterministic renderer with no line-width-dependent folding.
Arrays and objects use stable fixture-locked layout, so changing a formatter or its configured line
width cannot redefine generated bytes. `check --ci` strict-parses each generated JSON file,
reserializes it with that renderer, and requires byte equality.

Canonical schemas follow JSON Schema draft 2020-12 and live once under
`packages/ai-tooling/schemas/**`. Versioned schemas cover config, pack, rule, skill, override, lock,
state, and capability-catalog records. Every schema source file declares the draft 2020-12 dialect
in `$schema` and an exact version-tagged `$id` such as
`https://raw.githubusercontent.com/evk-soft/devkit/refs/tags/ai-tooling-v0.1.0/packages/ai-tooling/schemas/config.schema.json`.
Other schemas replace the filename, and later releases replace only the package version in the tag.
Schema files are release-ready source bytes and are copied byte-for-byte into the package tarball;
the build never rewrites a schema file or its `$id`.

Validation is offline. The engine preloads the complete local schema set into a registry keyed by
those absolute `$id` values, disables network resolution, and rejects any unresolved identifier.
References between schema files are relative `$ref` values. Because each base `$id` is the same in a
checkout and at the release tag, relative resolution has one identity in both places. Pack building
may rewrite development-relative `$schema` references in non-schema metadata to the appropriate
version-tagged schema URL; it never rewrites schema files or tracked source in place. Before release,
Stage 5 proves that tag-candidate schema bytes and exported tarball schema bytes are identical. The
implementation may choose a compatible validator, but validation behavior, offline resolution, and
error locations are part of the public contract.

The draft 2020-12 metaschema and required vocabularies referenced by schema `$schema` values must be
validator-built-in or bundled and preloaded under their official identifiers. A cold-cache fixture
denies network access while compiling and validating the complete schema graph.

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
  "outputMode": "managed",
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

This is a later full-lifecycle example, not a Stage 1 self-hosting config. The Stage 1 config selects
the local `configs/ai` pack, Codex and Claude Code only, `outputMode: "managed"`, both hooks `false`,
and plugin profile `"none"`.

For config schema version 1, the semantic configuration projection is built field by field:

| Projected field | Version 1 rule before JCS |
|---|---|
| `schemaVersion` | Exact validated integer `1` |
| `packs` | Preserve declared precedence order and reject duplicate stable selections. Preserve every source-specific selector, requested range or revision, integrity policy, and resolution flag. Every optional schema property has a literal JSON default that is materialized; an optional property without such a default is forbidden. |
| local pack `path` | Require repository-relative portable spelling with `/` separators; reject empty, `.` and `..` components, repeated or trailing separators, backslashes, drive/UNC prefixes, and percent escapes. Preserve accepted Unicode code points and case exactly. |
| npm selector | Require a canonical lowercase npm package identifier. Preserve the schema-valid ASCII version-range spelling exactly after rejecting leading or trailing whitespace; semantically equivalent but differently spelled ranges are different selections. |
| Git selector | Require an absolute ASCII RFC 3986 URI with the `https` scheme plus an ASCII revision. Reject userinfo, query, fragment, every non-ASCII code point, and every percent escape in the host. Apply the runtime-independent version 1 rules below and preserve the validated revision spelling exactly. |
| `outputMode` | Materialize the schema default `"managed"`; the only other version 1 value is `"preview"` |
| `platforms` | Preserve declared order; require canonical lowercase stable adapter IDs and reject duplicates rather than case-folding them |
| `overrides` | Preserve declared precedence order; apply the same portable relative-path syntax as local pack paths and reject duplicates |
| `gitHooks` | Materialize every schema-defined boolean from its literal schema default; version 1 defaults both `preCommit` and `prePush` to `false` |
| `plugins` | Materialize `profile: "none"` and `recommend: []` when absent so `safe-core` stays usable without a catalog; require canonical lowercase or namespaced recommendation IDs, preserve declared order, and reject duplicates. A later catalog profile may write explicit `"recommended"` without changing this schema default. |

Version 1 accepts only this whole-input production, where `https` is matched with ASCII-only case
folding and `path-abempty` has the [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986.html) meaning.
The HTTPS default-port rule follows [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html):

```text
git-url-v1 = "https" "://" host [ ":" port ] path-abempty
```

Parsing performs no trimming, repair, base-URL resolution, backslash conversion, implicit escaping,
URL-constructor canonicalization, IDNA/UTS-46 processing, or Unicode normalization. Because no other
production exists, userinfo, query, and fragment components are invalid. The host contains one or
more dot-separated ASCII labels; each label starts and ends with an ASCII letter or digit and
otherwise contains only ASCII letters, digits, or `-`, and at least one label contains an ASCII
letter. Empty labels, a trailing dot, numeric-only hosts, bracketed address literals, percent escapes,
and non-ASCII host input are invalid. The canonical scheme is `https` and the canonical host
lowercases only `A` through `Z`.

An optional port is an ASCII decimal integer from 1 through 65535 with no sign or leading zero; port
443 is omitted. An empty path becomes `/`. For a non-empty ASCII path, the normalizer validates every
percent triplet, decodes only percent-encoded RFC 3986 unreserved ASCII octets, uppercases the hex
digits of every remaining triplet, and then applies the RFC 3986 Section 5.2.4 dot-segment algorithm.
It finally recomposes only `https://`, canonical host, optional canonical port, and canonical path.
No locale, Unicode table, ICU build, operating system, or runtime version may change these bytes.

These exact version 1 vectors are part of the configuration-digest contract:

| Input | Canonical Git URL |
|---|---|
| `HTTPS://GitHub.COM/evk-soft/devkit.git` | `https://github.com/evk-soft/devkit.git` |
| `https://github.com:443/evk-soft/devkit.git` | `https://github.com/evk-soft/devkit.git` |
| `https://github.com/evk-soft/tmp/../devkit.git` | `https://github.com/evk-soft/devkit.git` |
| `https://github.com/%7eevk/devkit.git` | `https://github.com/~evk/devkit.git` |
| `https://github.com/evk%2fsoft/devkit.git` | `https://github.com/evk%2Fsoft/devkit.git` |

Non-equality fixtures prove that an explicit non-default port remains distinct from an absent port,
ASCII path case remains significant, and an encoded slash remains distinct from a literal slash:
`https://github.com:8443/repo.git` is not equal to `https://github.com/repo.git`,
`https://github.com/A` is not equal to `https://github.com/a`, and
`https://github.com/a%2Fb` is not equal to `https://github.com/a/b`.

Invalid vectors include leading or trailing whitespace; a relative reference; userinfo; raw
non-ASCII or percent-encoded host input; an empty, trailing-dot, numeric-only, invalid-label, or
bracketed host; a signed, zero, leading-zero, out-of-range, or empty port; malformed percent triplets;
backslashes; query; and fragment. Fixtures include `https://user@github.com/repo.git`,
`https://münich.example/repo.git`, `https://%67ithub.com/repo.git`,
`https://127.0.0.1/repo.git`, `https://[::1]/repo.git`, `https://github.com:0443/repo.git`,
`https://github.com/repo%ZZ`, `https://github.com\repo.git`,
`https://github.com/repo.git?x=1`, and `https://github.com/repo.git#x`.

The annotation-only `$schema` field is the sole omitted property. Unknown properties are rejected by
the current versioned schema and are never silently omitted from the digest; adding a behavior field
requires a schema-version and projection-contract change. Accepted string code points are preserved
without Unicode normalization. Arrays are never sorted. The engine strict-parses and validates the
file, materializes the table's defaults, serializes this projection with RFC 8785 JCS, and stores its
SHA-256 digest. Formatting-only changes therefore keep the same identity. The normalized
pack-selection projection is the `packs` array from this projection and uses the same JCS digest
algorithm.

Conformance vectors prove equal digests for whitespace, object-member order, escape spelling,
line-ending, explicit-default, URL-scheme/host-case, default-port, URL-dot-segment, percent-triplet-case, and
percent-encoded-unreserved variants. They prove
different digests or validation failure for changed array order, SemVer-range spelling, local or
override path separator and dot-segment variants, percent-encoded local or override paths, identifier case, Git userinfo, non-ASCII
or percent-encoded Git hosts, invalid host labels, query or fragment components, malformed percent
triplets, unknown fields, and lone surrogates. No implementation-defined locale, filesystem, URL, or Unicode normalization may run
before JCS.

Pack source kinds are exactly `local`, `npm`, and `git` in schema version 1. A local pack that
contributes to committed managed outputs must use a repository-relative path, remain inside the
repository after existing-ancestor real-path and reparse-point checks, and be tracked by the Git
index. Its lock entry stores the validated relative spelling and integrity digest, never an absolute
machine path. Version 1 never represents an outside-repository pack path, including in preview mode.
A later schema version may add a dedicated external-preview source only after its non-locking,
non-committing identity and containment contract is separately designed. `outputMode: "preview"`
currently means isolated output from otherwise valid pinned inputs, and `check --ci` rejects that mode.

An HTTPS Markdown URL is not loaded as live instructions. Remote content is fetched into a cache,
validated as a complete pack, pinned, and assigned an integrity digest before use.

The shared config schema accepts all durable source kinds, including `npm`, `git`, and `local`, so a
newer lifecycle profile does not require a different config shape. A lifecycle profile rejects a
recognized but unavailable source kind during resolution with a stable capability diagnostic rather
than misreporting it as a schema error. Source-specific trust and containment rules are applied after
schema validation.

The Stage 1 `safe-core` profile returns `EVK_PACK_CAPABILITY_UNAVAILABLE` for the recognized but
unsupported `npm` and `git` acquisition kinds before any acquisition work. A `local` kind is
supported, so an outside-repository path, reparse or workspace alias, identity mismatch, or untracked
path instead returns stage-neutral `EVK_PACK_SOURCE_INVALID` with a machine-readable `reason`; it is
never misreported as an unavailable kind. Schema-valid `outputMode: "preview"` returns
`EVK_CONFIG_CAPABILITY_UNAVAILABLE` because that lifecycle mode is not implemented in Stage 1.

`ai-tooling.lock.json` is tool-owned and committed. It records:

- the `ai-tooling` version;
- the `sha256-jcs-rfc8785` digest of the versioned semantic configuration projection;
- the `sha256-jcs-rfc8785` digest of the normalized pack-selection projection from that
  configuration;
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
| `codex-project` | `AGENTS.md`; `.agents/skills/<skill-name>/SKILL.md` and declared supporting files inside that skill directory | none |
| `openai-plugin` | none | `.codex-plugin/plugin.json`, skills, declared integrations |
| `claude-code-project` | chosen project entry `CLAUDE.md`; Markdown rules below `.claude/rules/`; `.claude/skills/<skill-name>/SKILL.md` and declared supporting files inside that skill directory | none |
| `claude-code-plugin` | none | Claude Code plugin bundle |
| `cursor-project` | `.cursor/rules/**` and supported project resources | none |
| `cursor-plugin` | none | Cursor plugin bundle |
| `gemini-cli-project` | `GEMINI.md` and supported project resources | none |
| `gemini-cli-extension` | none | Gemini CLI extension bundle |
| `antigravity-project` | supported `.agents/**` project resources | none |
| `antigravity-plugin` | none | Antigravity plugin bundle |

Immediately before an adapter implementation phase, the implementation refreshes that platform's
official documentation and records a dated capability fixture with URL, retrieval date, exact path
case and extension, documented alternative or shadowing entries, and import requirements. This table
is a product boundary, not permission to guess undocumented manifest fields.

Before any adapter renders, it expands its plan to exact managed leaf-file paths. Structural parent
directories are not separate claims. Existing ancestors are real-path checked for containment and
symlinks or reparse points; components below the first absent ancestor are validated lexically.

The engine then builds one candidate-path registry across all selected adapters. Containment and the
registry use the same OS-independent portable key for every component: `/` separators followed by
`NFC(Default_Case_Folding(NFC(component)))`, using one engine-pinned Unicode data version and no
locale-sensitive operation. Host-platform case behavior never changes acceptance. Distinct managed
leaf files with the same portable key fail. A component-boundary ancestor/descendant pair fails only
when the ancestor is a managed file or independently owned managed-tree claims overlap; a structural
parent of its own managed leaf is valid. A shared output is legal only when a separately declared
composer is its single owner and records every contributing adapter. No adapter ordering or
last-writer-wins rule resolves a collision. Stage 3 must either prove that Codex and Antigravity use
disjoint `.agents/**` leaves or introduce such an explicit composer before enabling them together.

Discovery shadows are lifecycle interference even when Stage 1 does not own them. A root
`AGENTS.override.md` shadows the managed Codex root `AGENTS.md`; the chosen Claude root `CLAUDE.md`
strategy conflicts with the documented `.claude/CLAUDE.md` alternative. `init`, `sync`, `check`,
`diff`, and `doctor` inventory these paths. Before initialization either path blocks with zero writes.
If one appears later, `check` fails with `EVK_OUTPUT_SHADOWED`, `diff` explains the native precedence,
`doctor` reports the unmanaged path, and `sync` performs zero writes. The diagnostic identifies
`platform`, `managedPath`, and `shadowPath` and offers preservation/removal guidance; Stage 1 never
deletes or adopts the unmanaged entry.

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
ai-tooling doctor --repair
ai-tooling doctor --formatter-check -- <executable> [args...]
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
before creating any `.ai-tooling/**` state, `init` requires the repository `.gitignore` probes to
prove that local state is ignored and the future repository lock is not ignored. A failed prerequisite
causes zero writes and points to the human-owned repository configuration. `init` may then write the
initial configuration and lock through the transaction manager. If
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

`EVK_CONFIG_REQUIRES_UPDATE` is reserved for pack-selection changes. A lifecycle profile that
recognizes another semantic configuration change but cannot apply it returns the stage-neutral
`EVK_CONFIG_CAPABILITY_UNAVAILABLE` code with machine-readable `capability`, `activeProfile`, and
`recoveryActions` fields. The Stage 1 `safe-core` profile uses that code for every non-selection
semantic config change; formatting-only changes have the same JCS digest and are not changes. Later
profiles may accept specifically documented non-selection fields without changing either error
code's meaning.

`check` reports `EVK_LOCK_NONCANONICAL` when a lock strict-parses, validates, passes all config,
input, ownership, and output-integrity checks, but its bytes differ from deterministic
reserialization. `sync` is the recovery command for that exact state: it shows a lock-only diff and,
after normal mutation confirmation, journal-writes the canonical bytes without treating the lock as
a modified generated output. Invalid JSON, a semantic lock inconsistency, an interrupted journal,
or any failed integrity check remains blocking and is never canonicalized into acceptance.

### 13.4 Check and diff

`check` performs the same resolution and rendering in memory but writes nothing. It fails for
missing, stale, modified, conflicting, orphaned, and natively shadowed outputs. `diff` explains
source-to-output, current-to-expected, and discovery-interference changes.

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

Run-lock metadata is untrusted recovery input. Before a liveness provider uses it, the engine
strict-parses and schema-validates every field, requires the process ID to be a positive safe integer
inside the target operating system's supported range, and validates the process-start marker against
that provider's fixed format and length. Host identity is compared with locally derived identity; it
is never interpolated into a command, path, or query. Providers use direct operating-system APIs or
a fixed executable with an argument array and shell execution disabled. They never construct a
shell command from host, process ID, start marker, operation ID, or nonce. An unparseable,
out-of-range, unsupported, or unverifiable value is ambiguous and causes zero writes.

If a proven-stale `pre-journal` lock has no journal, repair may archive and remove only that lock
after confirmation. A `pre-journal` lock with a matching header may be abandoned only when the
journal contains no mutation step or backup; repair archives both records after rechecking their
exact metadata. A `journal-ready` lock without its matching journal, an unknown phase, changed lock
metadata, or a corrupt or mismatched journal remains blocking and causes zero writes. Absence of a
journal is never used as evidence that a `journal-ready` transaction did not mutate managed paths.

`EVK_RECOVERY_EVIDENCE_MISSING` gives explicit non-destructive actions for that state. The operator
first preserves the complete `.ai-tooling/` directory and a copy of every unknown or human-owned
byte. They may then restore the exact matching journal from a trusted backup and rerun
`doctor --repair`, or reconstruct the repository from a known-good full-tree source and reapply only
verified human-owned configuration and overrides. Automated in-place completion, rollback, metadata
deletion, or force-abandon is unavailable without the journal. The diagnostic states this limit and
never recommends deleting `run.lock` by hand.

Backups needed by an active or interrupted journal are never pruned. After a successful ordinary
transaction and final verification, its transient backups are deleted. A successful manual restore
keeps the newest verified preimage backup for that managed path; an older completed restore backup
may be removed only after the replacement backup and transaction commit are verified. Configurable
time- or count-based retention is an extension of this minimum rule. Local backups are never
committed.

On a handled failure, the prior managed tree and lock are restored. A process or operating-system
crash may interrupt the sequence between two file replacements; the journal makes this detectable.
Ordinary commands then stop. `doctor` reports the interrupted operation without writing.

After a handled rollback, transient backups and the journal are deleted only after the complete
prior managed tree and prior repository lock state have been restored and verified. If rollback,
final verification, or cleanup verification fails, all recovery material is retained and the
operation is classified as interrupted for `doctor` rather than reported as handled.

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

`devkit` currently deviates from this target policy: `.husky/pre-commit` runs a write formatter and
then `git add -A`. Stage 1 does not modify or adopt that legacy hook. Its root formatter exclusions
prevent the hook from rewriting registered AI-tooling outputs, but they do not make global staging
product-compliant. This is an explicit temporary self-hosting exception. The Stage 2 existing-project
and hook child must remove or replace the deviation before `devkit` enables AI-tooling-managed hook
integration; the legacy hook is not presented as an example for consumers.

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
EVK_LOCK_*
EVK_PACK_*
EVK_OVERRIDE_*
EVK_OUTPUT_*
EVK_LINK_*
EVK_PLUGIN_*
EVK_SECURITY_*
EVK_RECOVERY_*
EVK_UPDATE_*
EVK_INTERNAL_*
```

`EVK_LOCK_*` covers repository-lock syntax, canonical-byte, and semantic-consistency diagnostics;
these are distinct from generated-output drift and interrupted-transaction recovery.

Capability errors use stage-neutral codes. `EVK_CONFIG_CAPABILITY_UNAVAILABLE`, for example, carries
the recognized `capability`, the stable `activeProfile` identifier, and structured recovery actions;
it never embeds a delivery-stage number in the code. Schema errors remain distinct from a valid
field whose source kind or operation is unavailable in the active profile.

Pack-source diagnostics also preserve cause. `EVK_PACK_CAPABILITY_UNAVAILABLE` means the source kind
is recognized but its acquisition capability is absent. `EVK_PACK_SOURCE_INVALID` means the kind is
supported but its selector fails a path, reparse, identity, or Git-index rule and carries that
machine-readable `reason`. Neither code contains a delivery-stage number.

`EVK_OUTPUT_SHADOWED` identifies a managed path whose native discovery is superseded or made
ambiguous by an unmanaged alternative. Machine output includes `platform`, `managedPath`, and
`shadowPath`; read-only commands report it and mutating commands perform zero writes.

Exit codes are stable:

- `0`: success;
- `1`: validation failure or drift;
- `2`: invalid command or configuration;
- `3`: ownership, conflict, or required user action;
- `4`: unavailable environment or external dependency;
- `5`: internal defect.

`doctor` without `--repair` is read-only. It checks runtime versions, Git, JSON schemas, pack
integrity, lock state, managed-file digests, discovery shadows, path permissions, platform availability, hook
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
4. Every repository content input and every repository-local path the tool reads, creates, renames,
   replaces, or deletes is path-contained. This includes config, overrides, repository-local packs, current and
   candidate outputs, `ai-tooling.lock.json`, read-only `.gitignore` and formatter-config checks,
   reports, and all `.ai-tooling/**` state, journals, backups, previews, stale locks, and temporary
   paths. Symbolic links, Windows junctions and other reparse points, UNC escapes, portable-key
   collisions, and changed ancestors fail closed. Ordinary Node module loading for the already
   trusted engine is outside this repository-content containment domain; source-specific trust
   validation governs later pack acquisition.
5. Remote instructions are pinned before use; mutable live Markdown is not an input.
6. Publication scans reject credentials, private keys, machine paths, local settings, and declared
   private-name patterns.
7. Authentication tokens are absent from config, lock, state reports, and diagnostic reports.
8. A plugin is not installed because an agent merely recommended it.
9. Generated-file deletion requires both ownership and expected content.
10. Consumer overrides may change content behavior but cannot disable engine safety invariants.
11. Recovery metadata is data, never shell syntax; liveness checks validate typed fields and use
    shell-free operating-system providers.

One repository-filesystem gateway enforces that containment policy for read-only and mutating
commands. It resolves the Git repository root to a stable anchor, checks every existing component without
following a link or reparse point, and validates components below the first absent ancestor
lexically with the portable key. It records the identity of existing ancestors and revalidates them
immediately before every read, create, rename, replace, or delete; an ancestor swap or unverifiable
identity aborts the operation. Atomic replacement does not bypass the check: the gateway validates
the temporary path and destination parent again immediately before rename. Platform implementations
may use handle-relative no-follow APIs or equivalent native handles, but must prove the same behavior.

Trusted runtime module paths, fixed Git-provider internals, and shell-free operating-system provider
internals are outside this repository-content gateway and retain their separate trust contracts. Any
repository path returned by a provider is validated by the gateway before AI Tooling uses it.

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

Before those files are initialized, the Stage 1 implementation plan makes the human-owned root
`.gitignore` ignore `/.ai-tooling/` and makes the human-owned repository-local `biome.json` exclude
every declared Stage 1 tool-owned path from write formatting. The public shared preset remains
unchanged. Before initialization, the CLI verifies only the ignore/unignore prerequisite and edits
neither file. After initialization and before the generated files are committed,
the self-hosting gate runs `doctor --formatter-check` with the repository's explicit Biome executable
and argv. The command copies the effective repository and registered outputs to a disposable
temporary repository, runs the formatter there in write mode, then proves that no repository-lock or
registered-output byte changed, the semantic configuration digest is unchanged, and the real
checkout remained untouched. This contains the existing hook deviation without adopting it as
product policy.

Automated tests use temporary project and home directories. They never modify the developer's real
Codex, Claude Code, Cursor, Gemini, or Antigravity configuration. Real external plugin installation
is an explicit manual acceptance test.

## 22. Testing strategy

### 22.1 Unit tests

Unit tests cover offline schema resolution, RFC 8785 configuration digests, schema errors, stable
serialization, precedence, override modes, collision and cycle detection, capability negotiation,
path containment, digest checks, untrusted run-lock parsing, and error serialization.

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
adapter-target-path-collision
adapter-target-case-fold-collision
adapter-target-unicode-collision
adapter-target-prefix-collision
adapter-structural-parent-with-owned-leaf
adapter-overlapping-managed-tree-claims
codex-root-override-shadow-before-and-after-init
claude-alternate-entry-shadow-before-and-after-init
broken-links
renamed-link-target
unsupported-capability
executable-capability-rejected
remote-pack-source-unavailable-in-safe-core
workspace-pack-alias-rejected-in-safe-core
outside-repository-local-source-invalid
untracked-local-source-rejected
offline-schema-registry
schema-cold-cache-no-network
config-jcs-normalization-vectors
equivalent-config-formatting
semantic-config-drift
noncanonical-lock-repair
formatter-managed-output-exclusion
first-init-prior-lock-absent
live-run-lock
stale-same-host-run-lock
foreign-or-ambiguous-run-lock
malformed-run-lock-metadata
run-lock-command-injection-payload
stale-pre-journal-run-lock-without-journal
journal-ready-run-lock-without-journal
journal-ready-missing-journal-recovery-actions
run-lock-journal-mismatch
handled-rollback-cleanup
handled-rollback-verification-failure
restore-generated-compare-and-swap
pack-selection-config-drift
local-state-gitignore
symbolic-link-escape
override-symbolic-link-escape
repository-lock-symbolic-link
local-state-root-symbolic-link
local-state-root-windows-junction
contained-ancestor-swap-before-read-or-write
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
target paths; add each discovery shadow after a successful init; introduce config, override, local-
pack, repository-lock, `.ai-tooling` state, output, and report symbolic-link or Windows junction
escapes; swap a validated ancestor before read, create, or rename; introduce reparse-point, UNC,
case-folding, Unicode-normalization, and cross-adapter path aliases; interrupt first-init and existing-
lock transactions; leave live, stale, and ambiguous run locks; inject shell metacharacters, invalid hosts,
out-of-range process IDs, and malformed start markers into run-lock metadata; prove that stale
`pre-journal` without a journal is reclaimable while `journal-ready` without a journal writes
nothing and emits tested recovery actions; change a file after restore confirmation; alter semantic
and formatting-only configuration; introduce a third post-crash file state; and break override
compatibility. Each case must fail without partial mutation, command construction from metadata, or
user-content loss.

### 22.5 Self-hosting and continuous integration

`devkit` verifies:

```text
ai-tooling check
ai-tooling docs check-links
ai-tooling pack validate
ai-tooling doctor --formatter-check -- pnpm -s exec biome check --write .
package tests
publication safety scan for release artifacts
```

The dedicated AI-tooling workflow begins with a native Windows, Linux, and macOS check-only matrix
when the first project adapters are implemented. Phase 3 runs the pure portable-key registry,
shadowing, golden-output, and deterministic-render fixtures. The explicit-argv formatter audit runs
only in a disposable temporary repository and proves the checked-out workflow tree remains
unchanged. Phase 4
adds native existing-ancestor symlink, junction, reparse, UNC, and mutating recovery fixtures;
self-hosting checks are added only after safe mutation is complete. Cross-platform adapter acceptance
is never gated on the existing Ubuntu-only root workflow.

Future self-hosted AI-tooling-managed hook integration follows the check-only contract in Section 16
and never formats in write mode or stages files. The legacy `devkit` hook remains a documented Stage
1 exception and is removed or replaced at the Stage 2 hook gate.

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
23. The field-by-field versioned projection plus RFC 8785 JCS produces one configuration digest
    across formatting, explicit-default, and specified URL variants; invalid I-JSON, noncanonical
    paths and identifiers, and every semantic projected-field change are detected.
24. Schema validation resolves schemas, the draft metaschema, and vocabularies only from the local
    `$id` registry or validator-built-in bytes and performs no network request from a cold cache.
25. A strict-valid, integrity-consistent noncanonical lock is recoverable only through a shown,
    journaled `sync` rewrite; invalid or inconsistent lock meaning is never normalized into trust.
26. All selected adapters expand to leaf files and pass one OS-independent, locale-independent,
    pinned-Unicode portable-key registry before rendering; structural parents remain legal while
    equal leaves, file ancestors, and overlapping independent tree claims fail.
27. Recovery metadata never reaches a shell command; invalid process, host, or start-marker input is
    ambiguous and causes zero writes.
28. A missing `journal-ready` journal produces tested preservation and clean-reconstruction actions
    without a force-abandon path.
29. Human-owned consumer formatter configuration excludes the repository lock itself and every output
    path registered by it, while AI Tooling verifies the boundary without editing the configuration
    and shared formatter presets remain product-neutral.
30. A source has one configured identity; profiles report unsupported acquisition kinds separately
    from invalid local selectors and never accept the same pack through both a tracked path and a
    package-manager junction.
31. `init`, `sync`, `check`, `diff`, and `doctor` inventory documented native shadow and alternate
    entries; read-only commands report them and every mutating command performs zero writes.
32. One containment gateway protects every repository input, repository output, lock, read-only
    repository-config check, and `.ai-tooling/**` path and fails closed when any link, reparse point, or validated
    ancestor changes before an operation.
