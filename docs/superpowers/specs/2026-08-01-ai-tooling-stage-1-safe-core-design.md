# AI Tooling Stage 1: Safe Core and Self-Hosting Design

**Date:** 2026-08-01
**Status:** Approved
**Profile:** feature — new packages, schemas, CLI behavior, generated files, and crash-recovery
contracts; zero bugfix signals
**Scope:** `configs/ai/**`, `packages/ai-tooling/**`, `packages/ai-tooling/README.md`, `.gitignore`,
`biome.json`,
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
- No npm, Git, URL, outside-repository, or package-manager-alias pack acquisition and no preview
  output mode; Stage 1 accepts only a tracked repository-relative local pack and performs no fetch.
- No remote-version update, package removal, `import-edits`, configurable or time-based completed-
  backup retention, or concurrent mutation beyond one repository run lock.
- No Git-hook installation or modification; current hooks remain untouched in Stage 1.
- No Cursor, Gemini CLI, Antigravity, OpenAI plugin, or Claude Code plugin distribution adapter.
- No third-party capability catalog, platform installation, or broad discovery.
- No script, hook, MCP server, connector, executable, browser capability, or other activatable pack
  asset is copied to a platform path.
- No npm or marketplace publication.
- No implementation of source-code intelligence.
- No activation of machine-local preview output; the schema reserves that durable mode, but the
  `safe-core` resolver rejects the unavailable lifecycle capability.

## Grounding

Target contracts come from the durable architecture; they are not claims about existing code.

| Current or external fact | Evidence |
|---|---|
| `configs/ai` and `packages/ai-tooling` fit existing workspace globs | `pnpm-workspace.yaml:1-3` |
| The implementation baseline is pnpm 10.28, Node.js 24, and TypeScript 6.0.3 | `package.json:5-7`, `package.json:28-31` |
| `configs/ai` currently contains only its design-phase README | `configs/ai/README.md:1-28` |
| The current hook is unsafe for generated-file checks because it writes and stages globally | `.husky/pre-commit:1-2` |
| The root formatter has no AI-tooling exclusions, formats JSON at width 100, and accepts comments | `biome.json:1-4`, `configs/biome-config/biome.preset.json:3-50` |
| The shared Biome preset is a public package and cannot own devkit-only product paths | `configs/biome-config/package.json:2-8`, `configs/biome-config/package.json:19-24` |
| The repository normalizes text to LF and pnpm uses isolated links | `.gitattributes:1`, `.npmrc:1-3` |
| Current repository CI is Ubuntu-only | `.github/workflows/ci.yml:8-47` |
| RFC 8785 defines invariant JSON serialization for hashing | `https://www.rfc-editor.org/rfc/rfc8785.html` |
| RFC 3986 defines the ASCII URI, percent, and dot-segment rules used by the Git selector | `https://www.rfc-editor.org/rfc/rfc3986.html` |
| RFC 9110 defines HTTPS port 443 as the default and scopes handling of deprecated userinfo in HTTP(S) references | `https://www.rfc-editor.org/rfc/rfc9110.html` |
| Node.js requires a terminal shell to invoke Windows `.bat` and `.cmd` files, so Stage 1 cannot use a package-manager shim while keeping `shell: false` | `https://nodejs.org/docs/latest-v24.x/api/child_process.html#spawning-bat-and-cmd-files-on-windows` |
| Node.js package resolution searches parent and global locations, so a successful `require.resolve` is not by itself repository-local trust evidence | `https://nodejs.org/docs/latest-v24.x/api/modules.html#all-together` |
| Git versions before 2.35.2 may treat boolean `core.fsmonitor=false` as a hook pathname, so the formatter census requires Git 2.36.0 or later | `https://git-scm.com/docs/git-config#Documentation/git-config.txt-corefsmonitor` |
| Package, SSoT, lock, resolver, transaction, and security contracts are defined durably | `docs/system-overview/ai-tooling.md:117-1408` |
| Required Stage 1 fixture families are defined durably | `docs/system-overview/ai-tooling.md:1441-1609` |
| The public implementation cannot copy the private prototype | `docs/ai-tooling/research/migration-lessons.md:6-38` |
| The frozen worktree, target census, path history, and current ignore behavior are recorded | `docs/ai-tooling/research/devkit-baseline.md:15-104` |

The frozen census found no AI target, config, lock, or local-state path
(`docs/ai-tooling/research/devkit-baseline.md:54-71`). The Stage 1 plan must repeat that exact check
immediately before self-hosting; this observation is not permission to overwrite a path that appears
later.

## Decisions

| Fork | Decision | Consequence |
|---|---|---|
| Bootstrap | Implement strict clean-project `init` in Stage 1 | A first lock is possible without implementing unsafe adoption |
| Existing collisions | Treat every unmanaged target as blocking | Stage 1 never merges or assumes ownership of existing instructions |
| Self-host input | Use tracked repository-relative `configs/ai` with a digest | Self-hosting does not depend on an unpublished npm package or machine path |
| Stage 1 source profile | Accept only the configured tracked relative path, not its workspace `node_modules` junction alias | One pack has one locked identity and no Stage 1 fetch or cache contract is implied |
| Local change | Add explicit `pack refresh-local <pack>` | Canonical edits never make `sync` silently mutate a frozen input digest |
| Configuration identity | Hash the versioned config projection with RFC 8785 JCS and SHA-256 | Formatting-only edits do not create drift; semantic edits remain detectable across machines |
| Sync behavior | Require the Stage 1 semantic config digest and frozen pack selection to match the lock; update only output ownership records | Repeated sync cannot bless a source, range, platform, or policy change |
| Config diagnostics | Reserve `EVK_CONFIG_REQUIRES_UPDATE` for pack selection and use `EVK_CONFIG_CAPABILITY_UNAVAILABLE` for other unavailable semantic changes | Public codes stay stage-neutral and machine output names the unavailable capability |
| Initial content | Include one independently reviewed rule, `evk-grounding`, and one instruction-only skill, `evk-plan` | Both rule and skill rendering are real without broad content migration |
| Adapter scope | Implement project outputs for Codex and Claude Code only | Stage 1 proves two different platform shapes without marketplace packaging |
| Pack executable trust | Reject every activatable pack asset before platform rendering | Forward-compatible schemas do not weaken the Stage 1 pack boundary; formatter execution uses separate caller-explicit provider trust |
| Recovery | Make ordinary `doctor` read-only and `doctor --repair` a separately confirmed mutation | Diagnostics never repair implicitly |
| Recovery conflict | Accept only journaled prior, candidate, or missing states | A post-crash user edit cannot be overwritten by repair |
| Lock state | Journal lock state as `absent` or `present(SHA-256)` | First-init rollback can restore the absence of a lock |
| Run-lock recovery | Reclaim a stale run lock only after same-host process identity is proven dead | A live or ambiguous owner always causes zero writes |
| Recovery metadata | Validate typed lock fields and invoke liveness providers without a shell | Corrupt or injected host, process, or start-marker data cannot become a repair command |
| Manual restore | Use compare-and-swap restore for one registered path after backup and confirmation of its observed state | Modified generated content can be discarded safely without a generic force flag |
| Schema identity | Export byte-stable schemas with exact version-tagged `$id` values and an offline local registry | Editors and packs have stable identity without network validation or build-time schema rewriting |
| Repository-config boundary | The owner or Stage 1 implementation plan edits `.gitignore` and root `biome.json`; AI Tooling only verifies them | Human-owned repository config is never silently claimed or rewritten, while generated bytes remain protected |
| Formatter provider | Preserve the caller-explicit direct executable form and add a caller-explicit root-declared installed Node entry; freeze either to one absolute provider before launch | AI Tooling passes exact argv with `shell: false`, fixed environment, timeout, bounded output, and disposable `cwd`, and performs no fetch, acquisition, or inference |
| Adapter paths | Register all containment-normalized paths before rendering | Exact, prefix, case-fold, and Unicode collisions fail before adapter output exists |
| CI | Create the native Windows, Linux, and macOS check-only workflow in Phase 3 | Adapter portability is proved before mutation and self-hosting phases |

## Design

### Repository-local state boundary

Before any command creates cache, state, journal, lock, backup, preview, or report content, the
repository owner or Stage 1 implementation plan must add the root-anchored `/.ai-tooling/` rule to
the human-owned `.gitignore`. The CLI verifies that prerequisite and never edits `.gitignore`. The
committed `ai-tooling.lock.json` remains outside that directory and must not be ignored.

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
ignored (`docs/ai-tooling/research/devkit-baseline.md:90-104`).

### Configuration and formatter boundary

The Stage 1 `configurationDigest` is SHA-256 over the UTF-8 RFC 8785 JCS serialization of the exact
version-1 semantic projection defined durably in the configuration contract; Stage 1 implements the
whole projection, not a profile-specific subset. It contains `schemaVersion`; ordered `packs` with
every source-specific selector, range or revision, integrity policy, resolution flag, and literal
schema default; defaulted `outputMode`; ordered canonical platform IDs and repository-relative
override paths; fully defaulted `gitHooks`; and defaulted plugin profile plus ordered recommendation
IDs. `$schema` is the sole excluded property. Unknown fields are rejected.

The pre-JCS rules are fixed: local and override paths must already use canonical `/`-separated
relative spelling with no empty, dot, backslash, drive/UNC, or percent-encoded components; npm names
are canonical lowercase while valid version-range spelling remains significant; Git URLs use the
durable runtime-independent ASCII RFC 3986 grammar and normalization: `https`, no userinfo, query,
fragment, non-ASCII input, percent-encoded host, invalid ASCII host label, or bracketed IP literal;
ASCII-only scheme/host case folding, canonical decimal port with 443 omitted, unreserved decoding,
remaining-percent-triplet uppercase, and RFC 3986 dot-segment removal. It performs no trimming,
base resolution, backslash repair, implicit escaping, URL-constructor normalization, IDNA/UTS-46,
or Unicode normalization; numeric-only hosts and leading-zero ports are invalid. Revision spelling
remains significant; arrays retain order and
reject duplicates. Accepted string code points are never Unicode-normalized. I-JSON validation
rejects lone surrogates and numbers that cannot round-trip exactly through IEEE-754. Every optional
version-1 property has a literal schema default that is materialized. Formatting, member order,
equivalent escapes, explicit versus implicit defaults, and specified equivalent URL spellings have
the same digest; the durable equal, non-equal, and invalid Git URL conformance vectors are mandatory
Stage 1 fixtures.

Before self-hosting creates generated files, the Stage 1 implementation plan changes the human-owned
repository root `biome.json` to exclude the repository lock and every tool-owned Stage 1 output:
`ai-tooling.lock.json`, `AGENTS.md`, `CLAUDE.md`, `.agents/**`, and `.claude/**`. AI Tooling verifies
but never edits this file and never puts product-specific paths into the public
`@evk-soft/biome-config` preset. `ai-tooling.config.json` remains in formatter scope because it is
human-owned and semantic digesting makes formatting-only changes safe.

`doctor --formatter-check` supports a direct provider and an explicit Node-entry provider:

```text
doctor --formatter-check -- <executable> [args...]
doctor --formatter-check --node-entry <module-specifier> -- [args...]
```

The direct form preserves the caller-supplied executable token and exact argv. Before changing `cwd`,
AI Tooling resolves a path-like token against the repository root or a bare token once through the
caller's `PATH` by direct lookup, not shell command construction. It realpaths the result, requires an
existing directly launchable regular file, records its identity, and revalidates it immediately before
spawn. On Windows, `.cmd`,
`.bat`, `.ps1`, and `.psm1` wrappers and Windows drive-relative, UNC, device, or URL paths are invalid
rather than reasons to enable a shell or network lookup. A direct provider inside the repository passes the repository-
content gateway; one outside it requires caller-explicit operational trust. Launch uses the frozen
absolute result, not the caller's `PATH`. Bare-token mode intentionally treats the caller's `PATH` as
provider-selection input before freezing; no other environment discovery may select or alter it.

The Node-entry form parses the package name from the exact, non-normalized canonical bare npm package
name or subpath. The package name must be an own entry of root `dependencies`, `devDependencies`, or
`optionalDependencies`, and the matching original-root `node_modules/<package-name>` installation
entry must exist. Built-ins, `#imports`, relative, absolute, drive-relative, UNC, `file:`, `node:`,
URL, percent-encoded, backslash, empty-component, and dot-segment inputs are invalid. The original-root
`node_modules` anchor must itself be an existing non-link, non-reparse directory whose real path is
contained by the real repository root. AI Tooling records the installation entry's real package root,
requires it to remain inside that anchored real `node_modules` tree, resolves through
`createRequire(<absolute-original-root>/package.json).resolve(<module-specifier>)`, realpaths the
result, and accepts only an absolute existing regular file contained within that package root. Parent
or global fallback, cross-package resolution, non-file results, and dependency links outside the
installed tree fail before spawn; a repository-local pnpm junction remains valid. AI Tooling records
the contained root manifest's byte digest and dependency declaration. Immediately before spawn, it
re-reads that manifest through the gateway and revalidates its digest and declaration, plus the
`node_modules` anchor, installation entry, real package root, resolved-entry identity, and every
containment relationship.

Direct mode launches the frozen executable. Node-entry mode launches `process.execPath` followed by
the frozen entry. Both use exact caller argv, `shell: false`, and the disposable repository as `cwd`.
AI Tooling never constructs a command string, inserts or infers an intermediary shell, or falls back
to one. The disposable copy contains no link to the original `node_modules`; the Node entry and its
transitive modules load from the original installed graph under separate caller-explicit trust.

Both modes receive the same environment built from an empty map. Common values are disposable
`HOME`, `XDG_CONFIG_HOME`, `XDG_CACHE_HOME`, `XDG_DATA_HOME`, `TMPDIR`, `TMP`, and `TEMP`, plus
`NO_COLOR=1`. Windows additionally receives disposable `USERPROFILE`, `APPDATA`, and `LOCALAPPDATA`.
A trusted operating-system API supplies one canonical Windows directory; `SystemRoot` and `WINDIR`
receive that same value, `PATH` contains only that directory, `System32`, and `System32\\Wbem`, and
`PATHEXT=.COM;.EXE`. Caller environment cannot supply or override them. POSIX receives exactly
`PATH=/usr/bin:/bin`, `LANG=C`, and
`LC_ALL=C`. No inherited variable is passed, including `NODE_OPTIONS`, `NODE_PATH`, `BIOME_BINARY`,
package-manager variables, proxy settings, credentials, or tokens. Stage 1 has no environment
passthrough.

The selected provider and its transitive behavior are caller-trusted operational code; Stage 1 does
not claim they are shell-free, network-free, or OS-sandboxed. AI Tooling opens no real-checkout path
for write and supplies neither the real repository as `cwd` nor any tool-derived real-repository
target. Caller-supplied argv and provider behavior remain under caller trust. Before and after the
synchronous child run it records path kind and SHA-256 bytes or link target for the sorted set from
`git ls-files -z --full-name --cached --others --exclude-standard --`. AI Tooling parses raw NUL-
delimited path bytes and sorts validated repository-relative paths itself, so unusual filename bytes
or Git quoting cannot change record boundaries.

The census uses one frozen Git provider. Before repository discovery, AI Tooling directly resolves
bare `git` once through caller `PATH`, realpaths it, requires a directly launchable regular file, and
records identity. Windows wrappers and drive-relative, UNC, device, or URL results are invalid. Caller
`PATH` selection is operational trust; packs, AI config, and later environment changes cannot select
Git. Only the frozen absolute file runs, with `shell: false`; identity is revalidated before discovery
and each pre/post-census invocation, and an in-repository provider passes the gateway. The frozen
provider's `git --version` leading `major.minor.patch` must be at least 2.36.0; older or unparseable
versions prevent spawn. The fixed read-only Git provider passes validated
explicit `--git-dir` and `--work-tree` anchors and builds its environment from an empty map with only
required OS values, `GIT_CONFIG_NOSYSTEM=1`, empty-file `GIT_CONFIG_GLOBAL`, and
`GIT_OPTIONAL_LOCKS=0`; every other `GIT_*` variable is absent. It passes
`-c core.excludesFile=<tool-empty-file>`, `-c core.fsmonitor=false`, and
`-c core.untrackedCache=false`, so ambient or repository config cannot redirect the worktree/index,
execute an fsmonitor command, add an external excludes file, or reuse cached untracked discovery,
while repository `.gitignore` and `.git/info/exclude`
remain intentional ignore sources. `.git/**`, ignored paths, and the installed dependency tree are explicitly
outside this Git-visible census. Every listed path must enumerate, read, and hash successfully. The
union comparison treats addition, removal, kind, link-target, or byte change as checkout change. A pre-
census failure prevents spawn; a post-census failure forbids success or an unchanged claim and
requires inspection. An observed changed censused path is a security failure. This is a checked
postcondition, not OS-level write confinement.

The Stage 1 timeout covers 300 seconds from spawn until the whole provider process tree is quiescent.
Tree control is established before provider code can execute; failure emits
`process-tree-control-unavailable` and starts no provider code. Each provider runs in a dedicated
Windows Job Object or POSIX process group. After every root-child
outcome, AI Tooling waits until no job or group member remains and drains both pipes to EOF before the
post-run census. At the deadline it terminates the entire job or group and performs the same checks; a
trusted provider must not detach. Unverified complete termination emits
`EVK_SECURITY_FORMATTER_EXECUTION_FAILED` with reason `termination-unverified` and no success or
unchanged claim. Stdout and stderr are continuously drained through separate 64 KiB ring buffers; raw
child bytes never appear in JSON or default human diagnostics. Diagnostics expose only byte counts and
truncation flags, and internal error text redacts the repository root, disposable root, resolved
provider, caller path-like token, every direct-lookup candidate and `PATH` directory, and installed
package root. Raw OS and module-resolution errors become constructed stable messages. Neither mode permits inference, acquisition, package/network
fetch or resolver requests by AI Tooling, or selection by pack content or AI configuration. A caller-
selected filesystem location, including mounted storage, remains under caller trust.

`EVK_SECURITY_FORMATTER_PROVIDER_INVALID` uses reason `unsupported-direct-wrapper`,
`provider-token-missing`,
`invalid-direct-location`, `direct-entry-not-file`, `direct-entry-not-launchable`,
`direct-containment-failed`, `invalid-node-specifier`, `root-manifest-invalid`,
`root-manifest-containment-failed`, `undeclared-node-package`,
`node-modules-anchor-invalid`, `installed-package-outside-root`, `parent-or-global-resolution`,
`cross-package-resolution`, `resolved-entry-not-file`, `provider-identity-changed`,
`provider-trust-changed`, or `installed-tree-identity-changed`.
`EVK_SECURITY_FORMATTER_PROVIDER_UNAVAILABLE` uses
`direct-executable-missing`, `root-manifest-missing`, `repository-local-package-missing`, or
`node-entry-resolution-failed`.
`EVK_SECURITY_FORMATTER_EXECUTION_FAILED` uses `environment-unavailable`,
`process-tree-control-unavailable`, `spawn-error`, `terminated-by-signal`, `timeout`, or
`termination-unverified`;
`EVK_OUTPUT_FORMATTER_REJECTED` uses `exit-nonzero`; `EVK_OUTPUT_FORMATTER_CONFLICT` uses
`registered-bytes-changed`; and `EVK_SECURITY_FORMATTER_CHECKOUT_CHANGED` uses
`checkout-census-changed`. `EVK_SECURITY_FORMATTER_CHECKOUT_UNVERIFIED` uses
`git-provider-unavailable`, `git-provider-invalid`, `git-provider-identity-changed-before-spawn`,
`git-version-unsupported`, or `pre-census-failed` before spawn, and
`git-provider-identity-changed-after-spawn` or `post-census-failed` after spawn.

Every machine outcome contains every field. `providerMode` is exactly `"direct"` or `"node-entry"`.
`requestedProvider` is a string or `null`: it is `null` only when the CLI form omitted the token,
preserves a supplied bare direct token or Node specifier, and represents a path-like direct token as
exactly `<redacted>/<basename>`. `reason` is `null` on success or a stable reason above;
`formatterExitStatus` is an integer or `null`; `formatterSignal` is a string or `null`;
`affectedPaths` is a sorted unique array of `/`-separated repository-relative paths; `stdoutBytes` and
`stderrBytes` are nonnegative safe integers; and `stdoutTruncated` and `stderrTruncated` are booleans.
Before child start, status and signal are
`null`, paths are `[]`, counts are `0`, and flags are `false`. Raw child output and resolved absolute
paths never appear. `affectedPaths` contains only primary-outcome paths: changed real-census paths for
checkout change, changed registered disposable paths for formatter conflict, and `[]` otherwise.
Syntax or trust failure exits `2`; unavailable environment or provider, process-tree-control failure,
pre-spawn Git-provider/version/census failure, spawn, signal, timeout, or unverified termination exits
`4`; nonzero completed
before the deadline or registered-byte conflict exits `1`; post-spawn Git-provider identity/census
failure or checkout change exits `3`. Unverified termination is primary because no stable quiescent
state exists; post-spawn Git-provider identity/census failure is next because comparison is incomplete;
otherwise precedence is checkout change, registered-byte conflict, timeout, nonzero, signal, then
spawn error. Secondary child
status remains in the exact fields. No outcome acquires a package or enables an implicit shell. Other
consumers may use this contract for an explicitly selected Prettier, dprint, or formatter.

A missing formatter token is `provider-token-missing`. A missing root manifest is
`root-manifest-missing`; invalid JSON or dependency-map shape is
`root-manifest-invalid`; and gateway refusal is `root-manifest-containment-failed`. A missing
`node_modules` anchor is `repository-local-package-missing`; an existing link, reparse,
non-directory, or outside-root anchor is `node-modules-anchor-invalid`. A root-manifest byte or
dependency-declaration change is `provider-trust-changed`; changed provider-file identity is
`provider-identity-changed`; and changed installed anchor, package root, or containment is
`installed-tree-identity-changed`.
Failure to construct the fixed environment is `environment-unavailable`; failure to establish tree
control before execution is `process-tree-control-unavailable`.

The pre-spawn Git-provider, version, and census reasons confirm no formatter process started and tell
the operator to repair or upgrade trusted Git or path-read access. The post-spawn Git-identity/census
reasons and `termination-unverified` make no unchanged claim and tell the
operator to stop related processes, inspect the repository, and restore damaged paths from reviewed
VCS bytes or a verified backup before retrying.

### Package and schema boundary

`configs/ai` becomes the package source for `@evk-soft/ai-pack-core` and contains canonical JSON
metadata plus Markdown instructions. `packages/ai-tooling` contains the engine, versioned JSON
schemas, CLI, Codex and Claude project adapters, fixtures, and tests. The first package versions are
`0.1.0`.

Stage 1 schemas cover config, pack, rule, skill, override, lock, and local state. Parsing rejects
duplicate JSON keys before ordinary parsing can discard them, and rejects comments and trailing
commas before schema validation. Because the repository Biome parser accepts JSON comments, the
diagnostic explicitly says that AI Tooling canonical metadata is standard JSON and identifies the
offending token rather than reporting a schema mismatch.

The config schema recognizes exactly the durable `local`, `npm`, and `git` source kinds and
`outputMode: "managed" | "preview"`. The Stage 1 `safe-core` source-kind gate rejects `npm` and `git`
with `EVK_PACK_CAPABILITY_UNAVAILABLE`, and rejects preview mode with
`EVK_CONFIG_CAPABILITY_UNAVAILABLE`, before acquisition work. It supports `local`, then separately
requires the exact tracked repository-relative `configs/ai` identity. An outside path, reparse point,
workspace alias such as `node_modules/@evk-soft/ai-pack-core`, identity mismatch, or untracked path
returns `EVK_PACK_SOURCE_INVALID` with a machine-readable `reason`; an invalid local selector is not
misreported as an unavailable kind.

Generated JSON uses UTF-8, LF, two spaces, stable key order, one final newline, and a
fixture-locked renderer with no line-width-dependent folding. JCS is used only for semantic digest
input; it is not the human-readable generated-file format.

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

Every schema source declares JSON Schema draft 2020-12 in `$schema` and uses this exact versioned
form for `$id`:

```text
https://raw.githubusercontent.com/evk-soft/devkit/refs/tags/ai-tooling-v0.1.0/packages/ai-tooling/schemas/config.schema.json
```

Other schemas replace `config.schema.json` with their exact exported filename. Future versions
replace only `0.1.0` with the exact `@evk-soft/ai-tooling` version. Relative `$ref` values connect
schemas. The validator preloads all schema bytes into a local registry keyed by absolute `$id`,
disables network resolution, and rejects an unresolved identifier, so the not-yet-created release
tag is never fetched during Stage 1.

The draft 2020-12 metaschema and required vocabularies named by each schema `$schema` are
validator-built-in or bundled and preloaded under their official identifiers. A cold-cache fixture
denies network access while the complete schema graph is compiled and exercised.

Schema source files are already release-ready and package building copies them byte-for-byte. It
never rewrites a schema `$id`, `$schema`, or `$ref`. Source-checkout metadata may use
repository-relative `$schema` paths; package building rewrites only those references in built
non-schema metadata to the version-tagged URL. Stage 5 verifies that tag-candidate schema bytes and
exported package schema bytes are identical before publication.

Builds on: `docs/system-overview/ai-tooling.md:117-176` and
`docs/system-overview/ai-tooling.md:364-533`.

### Pure resolution pipeline

All read, validation, resolution, and rendering functions are pure with respect to repository
mutation. The pipeline is:

```text
explicit config
  -> safe-core source-capability check
  -> exact tracked repository-relative pack plus digest
  -> schema and integrity validation
  -> precedence and override composition
  -> one effective resource per stable ID
  -> adapter capability check
  -> cross-adapter portable leaf registry
  -> candidate output tree
  -> output and link validation
  -> proposed diff
  -> transaction manager
```

Stage 1 supports committed project overrides so self-hosting proves precedence. `extend` is accepted
only as a compatible addition; `replace` and `disable` express contradictory intent. A missing target,
same-level collision, incompatible base digest, or unsupported required capability fails before
rendering is applied.

Stage 1 performs no registry query, clone, fetch, remote Git operation, URL request, package-manager
resolution, or pack-cache operation. It does perform read-only Git-index inspection to prove the
configured `configs/ai` path and pack files are tracked. Recognized `npm` and `git` kinds fail the
source-kind capability gate; schema-valid preview mode fails the lifecycle capability gate. A
supported `local` kind then undergoes containment, existing-ancestor reparse checks, exact configured-
identity comparison, and Git-index tracking validation; invalid selectors fail with
`EVK_PACK_SOURCE_INVALID`. A bare live-Markdown URL is not a schema-valid source. The same canonical
source cannot enter the lock under both its tracked path and a pnpm junction identity.

Builds on: `docs/system-overview/ai-tooling.md:551-750`.

### Project adapters

The Codex project adapter owns only declared root `AGENTS.md` content,
`.agents/skills/evk-plan/SKILL.md`, and declared supporting files inside that skill directory. The
Claude Code project adapter owns only declared root `CLAUDE.md` content,
`.claude/rules/evk-grounding.md`, `.claude/skills/evk-plan/SKILL.md`, and declared supporting files
inside that skill directory. These are native project discovery surfaces; no import is generated
merely to activate a rule or skill. The adapters do not produce plugin bundles.

Each adapter declares its stable ID, version, target paths, supported resource kinds and
capabilities, deterministic renderer, and generated-format validator. Both consume the same
effective catalog; platform output never becomes canonical input.

Stage 1 clean init requires every intended target to be absent. Partial ownership inside a
pre-existing entry file is not supported. The ownership lock records generator, adapter, all
contributing resource IDs, adoption state, and SHA-256 digest for every managed path.

The discovery-interference census inventories documented shadows that Stage 1 does not own. A root
`AGENTS.override.md` shadows root `AGENTS.md`; `.claude/CLAUDE.md` conflicts with the chosen root
`CLAUDE.md` strategy as a documented alternative project entry. `init`, `sync`, `check`, `diff`, and
`doctor` rerun this census. Pre-existing interference blocks initialization. If either path appears
later, `check` fails with `EVK_OUTPUT_SHADOWED`, `diff` explains the native precedence, `doctor`
reports it, and `sync` performs zero writes. The diagnostic carries `platform`, `managedPath`, and
`shadowPath`; Stage 1 never emits, deletes, or adopts an entry that native discovery would hide or
combine ambiguously.

Before rendering, each adapter expands its plan to exact managed leaf-file paths; structural parent
directories are not claims. Existing ancestors undergo real-path containment and reparse checks,
while absent leaf components are validated lexically. Both adapters enter their leaves into one
registry that uses the same OS-independent key as path containment on every runner: `/` separators
and `NFC(Default_Case_Folding(NFC(component)))` with an engine-pinned Unicode data version and no
locale-sensitive operation. Equal keys fail. A component-boundary ancestor/descendant pair fails only
when the ancestor is a managed file or independently owned tree claims overlap; an adapter's own
structural directory plus managed descendant is valid. Although the Stage 1 leaves are disjoint,
adversarial fixtures make this an engine invariant before later adapters reuse `.agents/**`.

Builds on: `docs/system-overview/ai-tooling.md:534-550` and
`docs/system-overview/ai-tooling.md:784-856`.

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
ai-tooling doctor --formatter-check -- <executable> [args...]
ai-tooling doctor --formatter-check --node-entry <module-specifier> -- [args...]
ai-tooling restore-generated <path>
ai-tooling docs check-links
ai-tooling pack validate
ai-tooling pack build
ai-tooling pack refresh-local <pack>
```

`init` accepts an existing explicit config or explicit pack and platform arguments, but the selected
pack must resolve to the tracked repository-relative `configs/ai` tree. It performs no registry,
Git clone/fetch or other remote operation, URL request, package-manager resolution, cache, or preview
operation. A fixed read-only Git-index query is required to prove the local source is tracked. A
recognized but unavailable `npm` or `git` kind fails during capability resolution with
`EVK_PACK_CAPABILITY_UNAVAILABLE` and machine-readable `sourceKind`,
`activeProfile: "safe-core"`, and `recoveryActions` fields before acquisition. A supported but
invalid `local` selector instead returns `EVK_PACK_SOURCE_INVALID` with `reason`. It resolves valid
inputs, builds the complete candidate, shows a diff, and writes the first lock and outputs in one
journaled transaction after confirmation. Any existing unmanaged or shadowing target blocks it. It
does not install hooks. A selected unsupported platform, enabled hook, plugin mutation, preview mode,
or executable capability is a blocking diagnostic rather than an ignored field.

Before creating any `.ai-tooling/**` state, `init` must also pass the repository ignore/unignore
probes above. A failed repository-config prerequisite produces zero writes and points to the
human-owned `.gitignore`; formatter behavior is audited only after a lock and registered outputs
exist.

Stage 1 `sync` requires both the RFC 8785 JCS full-configuration digest and normalized JCS
pack-selection projection to equal the lock. It may update managed-output ownership records, but
cannot bless a semantic config edit or change frozen pack versions, revisions, or integrity digests.
A pack-selection change blocks with `EVK_CONFIG_REQUIRES_UPDATE`. Any other semantic config change
blocks with `EVK_CONFIG_CAPABILITY_UNAVAILABLE` and machine-readable `capability`,
`activeProfile: "safe-core"`, and `recoveryActions` fields. Formatting-only edits keep the same
semantic digest and do not block.

`check` and `check --ci` report `EVK_LOCK_NONCANONICAL` when a lock strict-parses, validates, agrees
with the semantic config and every frozen input and output integrity check, but differs from the
deterministic lock renderer. `sync` may repair only that exact state: after showing a lock-only diff
and receiving the normal mutation confirmation, it journal-writes canonical lock bytes. Invalid
JSON, schema failure, semantic inconsistency, interrupted state, or any failed integrity check
remains blocking and causes no canonical rewrite.

`pack refresh-local` accepts only a pack already selected from a tracked repository-relative source.
It validates the changed pack, shows the digest and resource diff, and updates only that locked local
digest after explicit confirmation. `check` reports outputs stale until the next `sync` succeeds.

`check` and `diff` render without repository writes. `check` fails for discovery shadows as well as
missing, stale, modified, conflicting, orphaned, or unsupported outputs; `diff` explains the
interference. Stage 1 does not activate preview mode: schema-valid `outputMode: "preview"` fails with
a stage-neutral config capability diagnostic in every command, and `check --ci` retains a separate
fail-closed preview guard. `docs check-links` validates local links, anchors, images, encoded paths,
and exact path casing without network access. `pack validate` and `pack build` use the same offline
schema registry and never fetch, resolve, or execute pack content.

`doctor` and `doctor --report` do not mutate managed repository state. A report is redacted and goes
to standard output unless the user explicitly selects a path under ignored
`.ai-tooling/reports/**`; no implicit report file is created.

`doctor --formatter-check` also opens no real-repository path for write. It runs only after
the caller explicitly supplies either the direct executable token and argv or the Node-entry
specifier and argv. Apart from the caller's `PATH` lookup explicitly selected by a bare direct token,
pack content, AI configuration, environment discovery, and automatic formatter discovery cannot
select or alter that invocation. The defined post-run census must match; this is not
a claim that the trusted child is OS-sandboxed.

Stage 1 modified-output diagnostics offer manual preservation or `restore-generated`; they never
recommend the unavailable `import-edits` command.

Every mutating command supports `--dry-run`; non-interactive mutation requires explicit acceptance
flags. Machine-readable output uses stable JSON errors and exit codes. No Stage 1 command installs a
plugin or changes a user-global platform configuration.

Builds on: `docs/system-overview/ai-tooling.md:857-997` and
`docs/system-overview/ai-tooling.md:1230-1357`.

### Transaction and recovery

Only the transaction manager writes managed paths. It exclusively creates `run.lock` in phase
`pre-journal` with operation ID, random nonce, host identity, process ID, and process-start marker.
It writes and flushes the matching journal header, then atomically and durably advances the same
metadata to `journal-ready` without changing its identity. Only after both records are durable may it
verify ownership, render a complete candidate, create recovery backups, journal and atomically
replace each file, write the candidate repository lock last, verify the final tree, and release the
run lock.

Every recovered run-lock field is untrusted input. Repair strict-parses and schema-validates the
whole record before a liveness probe: the process ID is a positive safe integer within the provider's
documented operating-system range; the host, nonce, operation ID, phase, and process-start marker
have fixed types, encodings, lengths, and formats; and unknown fields are rejected. The host is
compared as typed data and is never interpolated into a command. A liveness provider uses either a
direct operating-system API or a fixed executable and separately supplied fixed-shape argument
vector with shell execution disabled; metadata cannot select the executable, flags, or syntax. Any
unparseable, malformed, out-of-range, foreign-host, or unverifiable value is ambiguous and causes
zero writes.

Repository lock state is `absent` or `present(SHA-256)`. The journal records prior and candidate lock
states, every path's prior and candidate digest or absence marker, completed step, and backup digest.
A handled error rolls back, including restoration of a prior absent lock. Only after the complete
prior tree and prior lock state are reverified may the transaction delete its transient backups and
journal. If rollback or that verification fails, it retains all recovery evidence, marks the
operation interrupted, and blocks ordinary mutation.

`doctor --repair` may reclaim a leftover `journal-ready` run lock only when its operation and nonce
match the journal, its host is the current host, and the operating system proves no process with the
recorded ID and start marker is alive. It atomically archives that metadata and exclusively creates a
recovery lock. Live, foreign-host, reused-ID, changed, or unverifiable ownership causes zero writes;
no force reclaim exists.

If a proven-stale `pre-journal` lock has no journal, repair may archive and remove only that lock
after confirmation. It may abandon a matching header in this phase only when no mutation step or
backup exists. A `journal-ready` lock without its matching journal, unknown phase, changed metadata,
or corrupt or mismatched journal remains blocking and causes zero writes. Its
`EVK_RECOVERY_EVIDENCE_MISSING` diagnostic gives safe recovery actions as data: preserve the entire
`.ai-tooling/` tree and current project bytes before investigation; restore only an exact matching
journal from a verified backup; or reconstruct a known-good checkout and reapply only verified human
source files before comparing state. It never recommends deleting `run.lock`, deleting
`.ai-tooling/`, or forcing in-place recovery.

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

Builds on: `docs/system-overview/ai-tooling.md:998-1082`.

### Path and executable containment

One repository-filesystem gateway contains every repository content input and every repository-local
path Stage 1 reads, creates, renames, replaces, or deletes. This includes config, overrides, tracked pack files, managed current
and candidate outputs, `ai-tooling.lock.json`, read-only `.gitignore` and formatter-config checks,
the root package manifest used for formatter-provider validation, reports, and all `.ai-tooling/**`
state, journal, backup, stale-lock, and temporary paths. It resolves
the Git root as its anchor, checks every existing component without following symbolic links, Windows
junctions or other reparse points, rejects UNC escapes, and validates components below the first
absent ancestor lexically. It records existing-ancestor identities and revalidates them immediately
before every read, create, rename, replace, or delete, including the final atomic rename; a swap or
unverifiable identity fails closed.

Containment uses the same portable component key as the adapter registry on every OS and rejects
equal, managed-file-ancestor, overlapping-tree, case-fold, and Unicode collisions. Trusted Node.js
module loading for the tool itself remains outside this repository-content boundary, but a workspace
`node_modules/@evk-soft/ai-pack-core` junction is never accepted as the Stage 1 pack source. Tests use
native Windows probes for Windows-only filesystem behavior and injected ancestor swaps on every OS.

Trusted runtime modules, caller-explicit direct providers outside the repository, installed Node-entry
files and dependency modules, fixed read-only Git-provider internals, and fixed-argv OS-liveness
provider internals are outside this repository-content gateway. A direct provider inside the
repository passes the gateway. Formatter Node entries still require the root-manifest, installed-tree,
package-root, and entry-resolution proof above; any repository content path returned by a provider is
contained before AI Tooling uses it.

Stage 1 is instruction-only. If any effective resource declares or contains scripts, hooks, MCP
servers, connectors, executables, browser capabilities, or another activatable asset, validation
returns `EVK_SECURITY_EXECUTABLE_CONSENT_REQUIRED` before copying it to a discovery path. A pack
cannot hide an executable by omitting it from `requiredCapabilities`.

Builds on: `docs/system-overview/ai-tooling.md:429-533` and
`docs/system-overview/ai-tooling.md:1358-1408`.

### Self-hosting and CI

After all safe-write and recovery fixtures pass, Phase 5 self-hosting confirms that the human-owned
root `.gitignore` change from Phase 1 and `biome.json` change from Phase 3 remain present. Before init,
the CLI rechecks only the ignore/unignore probes and never edits either file. `devkit` then uses the
workspace CLI and tracked `configs/ai` pack to perform clean init and commits its config, exact lock,
and generated Codex and Claude project outputs. The public `@evk-soft/biome-config` preset remains
unchanged. After init and before commit, the exact `doctor --formatter-check --node-entry
@biomejs/biome/bin/biome -- check --write .` invocation resolves the installed direct dependency,
runs it through `process.execPath` with `shell: false`, exact argv, the fixed environment, bounded
output, 300-second timeout, and disposable temporary repository as `cwd`, and proves that it changes
none of the registered bytes and leaves the defined real-checkout census identical. AI Tooling opens
no real-checkout path for write; the caller-trusted formatter is not claimed to be OS-sandboxed.
CI runs only:

```text
ai-tooling check --ci
ai-tooling docs check-links
ai-tooling pack validate
ai-tooling doctor --formatter-check --node-entry @biomejs/biome/bin/biome -- check --write .
package typecheck, lint, and tests
```

Phase 3 creates `.github/workflows/ai-tooling.yml` with native Windows, Linux, and macOS runners for
the adapter golden fixtures and read-only commands; this is separate from the current Ubuntu-only
repository workflow. Tests use temporary repositories and temporary home directories. No test reads
or writes the real Codex or Claude Code user configuration.

Stage 1 intentionally does not modify `.husky/pre-commit`. Its current `biome check --write .`
followed by `git add -A` remains a known noncompliant legacy deviation: root formatter exclusions
protect generated bytes, but global staging is not an acceptable managed-hook model or consumer
example. Stage 2 must remove or replace that behavior before AI Tooling offers managed hooks.

Builds on: `docs/system-overview/ai-tooling.md:1409-1609`.

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
| 3 | Availability | Low | Tracked repository-local input and no network or cache work keep every Stage 1 command offline | Remote sources wait for a later lifecycle profile |
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
| 1. Contracts and instruction-only pack | Package boundaries, `.gitignore`, versioned schemas and exports, strict I-JSON parsing, offline schema and metaschema registry, field-by-field RFC 8785 JCS digest contract, minimal reviewed resources, publication allowlist | Local-state leak, schema drift, network-dependent validation, or private content | Ignore/unignore probes, byte-exact schema fixtures, cold-cache offline `$ref` and metaschema fixtures, duplicate-key and invalid-I-JSON tests, equal/non-equal JCS vectors, invalid Git URL rejection vectors, content review, and package-content scan pass |
| 2. Pure engine | Tracked-local pack loading, source-kind versus invalid-selector diagnostics, read-only Git-index proof, integrity, precedence, overrides, capability negotiation, deterministic candidate model, portable path-key primitives | Ambiguous resolution or hidden source alias | Collision, orphan, base-digest, unavailable-source, outside/untracked/workspace-alias, executable-rejection, stress, and repeatability tests pass with no writes |
| 3. Project adapters, formatter boundary, and native read-only CI | Exact Codex and Claude project renderers, leaf-file target registry, lifecycle discovery-shadow census, ownership model, diff, check, link validation, human-authored root `biome.json` generated-path exclusions, direct and explicit Node-entry formatter resolver/runner, and new `.github/workflows/ai-tooling.yml` Windows/Linux/macOS matrix | Platform loss, shadowed output, formatter mutation, implicit shell fallback, environment poisoning, dependency acquisition, collision, or nondeterminism | Fresh dated official-path fixture captured immediately before Phase 3 implementation; shadow/alternative-entry before and after init, mutation-free shadowed sync, equal-leaf/file-ancestor/overlapping-tree/structural-parent, portable case/NFC, missing-token, direct and Node-entry syntax/trust, root-manifest failure, provider-identity/trust-swap, pnpm-junction, `process.execPath`, exact-argv, fixed-environment, no-acquisition, timeout, process-tree-quiescence, termination-unverified, redaction, disposable-write, frozen/substituted/swapped-Git, hostile-Git-config/NUL-path census, pre/post-census-failure, outcome-precedence and real-checkout-census fixtures, capability and golden fixtures; exact Biome entry and a byte-identical second render pass on all three native OSes |
| 4. Safe mutation and recovery | Clean init, semantic-digest sync, noncanonical-lock repair, local refresh, compare-and-swap restore, journal, backups, containment for every repository and local-state path, typed shell-free run-lock liveness, rollback, and repair | User content loss, command injection, path escape, ancestor swap, or false stale-owner decision | Native config/override/pack/lock/`.ai-tooling`/output symlink and junction fixtures, ancestor-swap-before-read/write, absent/present and noncanonical lock recovery, live/stale/ambiguous/malformed/injection run locks, pre-journal/no-journal and journal-ready/no-journal actions, restore race, handled rollback cleanup, retained failed-rollback evidence, and third-state fixtures pass |
| 5. Self-hosting, docs, and hardening | Devkit generated files and lock, package docs, security audit, and explicit legacy-hook deviation documentation | Circular bootstrap, stale durable docs, or unsafe staging guidance | Full bootstrap sequence and check-only CI are green; publication scan is clean; durable map is covered; Stage 2 hook deadline is explicit |

Each phase requires owner approval before the next. The Stage 1 plan ends with a decommission phase
that verifies durable coverage before removing this child spec and its plan.

The future plan must isolate each phase in a clean worktree because the current legacy hook stages the
whole repository. Before each phase commit it runs the equivalent required checks, then either lets
the hook run in that isolated tree or deliberately bypasses only that hook invocation, and verifies
the complete staged path set against the phase allowlist. Formatter exclusions do not replace this
staged-set check.

## Durable docs and skills to update

| Durable fact | Canonical home | When |
|---|---|---|
| Publisher pack purpose and edit rules | `configs/ai/README.md` | Phase 1 and Phase 5 verification |
| Shared engine and recovery architecture | `docs/system-overview/ai-tooling.md` | Every phase docs sync |
| Package install, exports, runtime, and CLI | `packages/ai-tooling/README.md` | Phases 1, 3, and 5 |
| Clean init, sync, check, refresh, restore, and repair | `docs/ai-tooling/USER-GUIDE.md` | Phases 4 and 5 |
| AI source-versus-generated workflow | `docs/ai-tooling/AI-AUTHORING-GUIDE.md` | Phases 3 and 5 |
| Pack schemas, IDs, precedence, and overrides | `docs/ai-tooling/EXTENDING-PACKS.md` | Phases 1-2 and Phase 5 |
| Stage 1 pack trust, formatter-provider trust, path, diagnostic, and artifact rules | `docs/ai-tooling/SECURITY.md` | Phases 1, 3, 4, and 5 |
| Package discovery and status | root `README.md` | Phase 5 |

No durable file links back to this child spec or its plan.

## Open questions

None changes the proposed Stage 1 behavior. The implementation plan must choose and record:

- the concrete JSON Schema validator and duplicate-key parser before Phase 1 coding;
- the concrete RFC 8785 implementation before Phase 1 coding, without changing the fixed JCS byte
  contract or normalizing Unicode;
- the package test runner before Phase 1 coding;
- the concrete Unicode data version and default-case-fold implementation, plus the fixed read-only
  Git-index query, before Phase 2 coding without changing the portable-key or source-validation
  behavior;
- measurable local and stress-fixture timing budgets before Phase 2 performance acceptance;
- the exact human-authored root `biome.json` exclusion syntax and CI matrix syntax before Phase 3, while all
  repository-lock and registered-output exclusions and native Windows/Linux/macOS evidence remain
  mandatory;
- the implementation APIs for direct executable lookup, file-identity revalidation, trusted Windows-
  directory lookup, Windows Job Object and POSIX process-group lifecycle, and bounded stream draining
  before Phase 3, without changing the fixed provider, environment, timeout, output, or outcome
  contracts;
- the direct operating-system APIs or fixed shell-free liveness provider per target OS before Phase
  4 coding.

Any choice that changes output bytes, public schema behavior, ownership, recovery, path containment,
or executable trust returns to the owner as a new design decision.

## Risks

| Risk | Mitigation |
|---|---|
| Clean init sees a newly created user file | Repeat target census immediately before mutation; any unmanaged collision aborts |
| A native shadow makes generated instructions invisible or ambiguous | Inventory root `AGENTS.override.md` and `.claude/CLAUDE.md`; either blocks the Stage 1 chosen target |
| Local pack digest changes silently | Only explicit `pack refresh-local` may change it, after a shown diff |
| An invalid local selector is mistaken for an unavailable source kind | Separate `EVK_PACK_CAPABILITY_UNAVAILABLE` from `EVK_PACK_SOURCE_INVALID` and test every reason |
| Formatting or runtime URL semantics change configuration identity | Hash the explicit semantic projection with RFC 8785 JCS, exclude only `$schema`, reject unknown fields, and use the runtime-independent ASCII Git URL grammar without URL-constructor or IDNA behavior |
| Sync blesses a changed config or selected input | Require exact Stage 1 semantic config and selection digests; test add, remove, source, range, and policy drift |
| A valid lock has noncanonical bytes | `check --ci` detects it; `sync` permits only a journaled lock-only rewrite after every semantic and integrity check passes |
| Schema validation reaches the network or mutates published schema identity | Use a network-disabled local `$id` registry, relative `$ref`, and byte-copy schema publication |
| A package-manager junction aliases the canonical pack | Stage 1 accepts only tracked repository-relative `configs/ai` and rejects `node_modules` aliases before load |
| Two adapters claim equivalent or ancestor/descendant targets | Expand to leaves; use one pinned-Unicode portable key on every OS; allow structural parents but reject file ancestors and overlapping independent trees |
| A repository formatter rewrites generated Markdown or lock bytes | Human-owned formatter config excludes every tool-owned path; caller-explicit direct or Node-entry `doctor --formatter-check` uses `shell: false`, fixed environment, timeout, disposable `cwd`, byte comparison, and checkout census |
| A Windows package-manager shim requires a shell or a Node entry resolves outside the installed package root | Reject command wrappers without enabling a shell; freeze direct lookup, require root declaration plus repository-local installed package and contained entry, launch Node entries through `process.execPath`, and perform no acquisition or fallback |
| Ambient environment or child output changes provider behavior or leaks paths | Build the child environment from an exact allowlist, drop `NODE_OPTIONS`, `NODE_PATH`, and `BIOME_BINARY`, bound and suppress raw output, and redact every known absolute root |
| A config, override, lock, or local-state ancestor becomes a link after validation | Route every repository path through one gateway and revalidate ancestor identity immediately before each read/create/rename/write |
| Recovery overwrites an unknown post-crash state | Validate every path, backup, and lock against journaled states before any repair write |
| Malformed run-lock metadata injects a liveness command or impersonates a stale owner | Strict typed validation plus direct OS APIs or fixed argv with shell disabled; ambiguity writes nothing |
| A stale run lock is actually live, foreign, or missing a post-boundary journal | Require durable phases, matching same-host identity, proven process death, a matching journal for `journal-ready`, and safe preserve-first recovery actions; ambiguity writes nothing |
| A handled rollback deletes the last useful evidence | Delete backups and journal only after the complete prior tree and lock verify; retain and mark interrupted otherwise |
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
| Language | TypeScript 6.0.3 with ECMAScript module output | `package.json:28-31`; umbrella decision |
| Metadata | Strict standard JSON, JSON Schema draft 2020-12, offline local `$id` registry | `docs/system-overview/ai-tooling.md:364-428` |
| Instructions | Markdown only in Stage 1 sources | `docs/ai-tooling/product-brief.md:23-24` |
| Configuration identity | SHA-256 over the explicit RFC 8785 JCS semantic projection | RFC 8785; `docs/system-overview/ai-tooling.md:366-394`, `docs/system-overview/ai-tooling.md:621-701` |
| Generated output integrity | SHA-256 plus a separate fixture-locked UTF-8/LF renderer | `docs/system-overview/ai-tooling.md:364-374`, `docs/system-overview/ai-tooling.md:397-400`, `docs/system-overview/ai-tooling.md:728-738` |
| Repository-config ownership | Human-owned ignore and formatter exclusions, verified but never edited by AI Tooling | root `.gitignore` and `biome.json`; public preset remains reusable |
| Formatter audit | Caller-explicit frozen direct executable or root-declared installed Node entry; Git 2.36.0+, exact argv, `shell: false`, fixed environment, 300-second timeout, bounded output, disposable `cwd`, and checkout census | durable formatter-provider contract and native Phase 3 fixtures |
| Filesystem testing | Native Windows, Linux, and macOS runners with temporary roots | portability NFR and Phase 3 gate |

## Acceptance criteria

1. The owner or approved implementation plan makes `/.ai-tooling/` ignored before local state is
   created and keeps `ai-tooling.lock.json` unignored; the CLI verifies both and edits neither
   `.gitignore` nor formatter configuration.
2. A clean project creates its first exact lock and Codex/Claude outputs only after a reviewed plan.
3. Any unmanaged target, root `AGENTS.override.md` shadow, or `.claude/CLAUDE.md` alternative causes
   zero writes.
4. The initial lock contains no absolute path, credential, auth state, or global plugin state.
5. The full config and pack-selection identities are SHA-256 digests of the field-by-field version 1
   projection and RFC 8785 JCS. `$schema`, formatting, explicit defaults, and specified URL variants
   do not change identity; invalid I-JSON, noncanonical paths/IDs, Git userinfo or non-ASCII host,
   unknown fields, and every semantic
   projected-field change fail or change identity according to the conformance vectors.
6. During `sync` against an existing lock, a pack-selection change returns
   `EVK_CONFIG_REQUIRES_UPDATE`; another semantic config change returns stage-neutral
   `EVK_CONFIG_CAPABILITY_UNAVAILABLE` with capability, active-profile, and recovery-action fields.
7. The durable config schema accepts source kinds `npm`, `git`, and `local`, plus managed or preview
   output mode. During initial/source resolution, unsupported npm and Git acquisition return
   `EVK_PACK_CAPABILITY_UNAVAILABLE`, preview returns `EVK_CONFIG_CAPABILITY_UNAVAILABLE`, and a
   supported but outside, untracked, reparse/alias, or identity-mismatched local selector returns
   `EVK_PACK_SOURCE_INVALID` with a reason. Only exact tracked relative `configs/ai` succeeds; a bare
   Markdown URL fails schema validation. No network, remote Git, package-manager, or cache work occurs,
   while a read-only Git-index query proves tracked input.
8. A second unchanged sync is byte-identical. Formatting-only config edits remain unchanged.
9. `check --ci` detects a strict-valid but noncanonical lock, and `sync` performs a journaled
   lock-only canonical repair only after config, frozen-input, ownership, and output integrity all
   agree. Invalid or semantically inconsistent locks remain blocked.
10. Override precedence produces one effective resource with complete contributor provenance.
11. Missing, modified, stale, orphaned, conflicting, unsupported, and natively shadowed outputs fail
    `check`; a shadow introduced after init also makes `sync` perform zero writes.
12. A canonical local-pack edit requires explicit refresh before sync accepts it.
13. Handled failures restore the prior tree and `absent` or `present` lock state; transient backups
    and the journal are deleted only after the complete prior state verifies.
14. Interrupted valid states recover; a third file or lock state blocks and retains recovery
    evidence.
15. Run-lock recovery strict-validates every untrusted field, bounds the integer process ID, compares
    rather than interpolates the host, and calls only a direct OS API or fixed executable argv with
    shell execution disabled. Malformed and injection-shaped metadata causes zero writes.
16. Live, foreign, reused-ID, or ambiguous run locks block. Only a proven stale same-host
    `pre-journal` lock may be removed without a journal; `journal-ready` without its exact journal
    causes zero writes.
17. The missing-journal diagnostic separately tells the operator to preserve `.ai-tooling/` and
    current bytes before checkout recovery, offers only exact-evidence or known-good-checkout paths,
    and never recommends deleting the run lock or forcing in-place repair.
18. `restore-generated` rejects unregistered paths and any change after the user confirms observed
    bytes; it preserves a verified exact preimage before replacement.
19. Active-journal backups are never pruned; completed backups follow the minimum bounded rule.
20. Activatable pack resources fail before copying any asset; formatter execution requires separate
    caller-explicit provider selection.
21. Symlink, junction, reparse, UNC, case-fold, Unicode, and ancestor-swap attacks fail containment
    tests for config, overrides, pack trees, lock, read-only repository-config checks, managed paths, reports,
    and every `.ai-tooling/**` path without blocking trusted tool modules or the separately validated
    caller-explicit installed formatter dependency tree.
22. Codex uses root `AGENTS.md` and `.agents/skills/<name>/SKILL.md`; Claude Code uses root
    `CLAUDE.md`, `.claude/rules/**/*.md`, and `.claude/skills/<name>/SKILL.md`; source fixtures pin
    fresh dated official discovery references, alternatives and shadowing precedence, and no import
    step is required.
23. Adapters expand to exact leaves. One OS-independent, locale-independent, pinned-Unicode portable
    key is shared with containment; structural parents are allowed, while equal leaves, managed-file
    ancestors, and overlapping independent tree claims fail.
24. Schema, metaschema, and vocabulary validation is offline from a cold cache through built-in or
    preloaded local identifiers and relative `$ref`; package schema files preserve source bytes and
    exact version-tag `$id` values.
25. Strict product parsing rejects JSON comments and trailing commas with a standard-JSON diagnostic
    even though the repository Biome parser accepts comments.
26. The generated renderer is fixture-locked and independent of line width. The Stage 1 plan makes
    human-owned root `biome.json` exclude the repository lock and every registered output path.
    `doctor --formatter-check` accepts either a caller-explicit direct executable or caller-explicit
    root-declared Node entry, freezes one absolute provider, and revalidates its identity immediately
    before launch. Both use exact argv,
    `shell: false`, the exact empty-base environment allowlist, 300-second timeout, bounded raw-output
    suppression, and disposable `cwd`; AI Tooling never inserts or infers a shell. Direct mode
    preserves bare native lookup but rejects Windows command wrappers. Node-entry mode proves the
    root-manifest declaration, repository-local installed package root, contained regular-file entry,
    and `process.execPath` launch, rejecting built-in/path-like/undeclared/parent/global/cross-package/
    unavailable/non-file resolution without acquisition or fallback. The exact devkit Biome entry
    passes on Windows, Linux, and macOS, including a Windows pnpm junction; poisoning, nonzero, signal,
    missing-token, Git-provider substitution/identity-swap, Git-version rejection, timeout, lingering-descendant, termination-unverified, hostile Git redirect/fsmonitor/cache,
    NUL-sensitive path, pre/post-census failure, partial-write, redaction, and outcome-precedence
    fixtures pass. No registered disposable
    bytes change, AI Tooling opens no real-checkout path for write, and the defined Git-visible census
    remains identical after the caller-trusted non-sandboxed child. Formatter config stays human-owned.
27. Immediately before adapter implementation, Phase 3 refreshes the dated discovery fixture and
    creates the separate native Windows, Linux, and macOS read-only AI Tooling workflow; pure target-
    registry, Codex/Claude golden, formatter-provider, checkout-census, and second-render fixtures pass
    on all three systems, while Phase 4 adds native filesystem-containment and mutation fixtures.
28. Tests never touch real user platform configuration.
29. `devkit` commits and verifies its exact config, lock, outputs, and check-only CI workflow.
30. The current write-and-`git add -A` pre-commit behavior is documented as a Stage 1 deviation and
    has a mandatory Stage 2 replacement deadline before managed hooks.
31. Each future phase commit uses an isolated clean worktree, runs equivalent checks, and verifies
    the complete staged set against its phase allowlist despite the legacy hook.
32. Durable docs cover sources, outputs, customization, recovery, and security without reverse links.

## Review gate

The repository owner approved the preceding immutable five-file snapshot on 2026-08-02. During
implementation-plan preparation, the native Windows check found R4: the exact `pnpm` formatter
invocation required a command shim that cannot run through Node with shell execution disabled. The
owner authorized only the direct-or-explicit-Node-entry correction with `go` on 2026-08-02.

On 2026-08-02, the repository owner approved the exact hash-defined R4 snapshot in
`docs/ai-tooling/research/devkit-baseline.md` with `approve written design`. That approval authorizes
the status, review-gate, and snapshot-record edits, their documentation-only commit, and creation of a
detailed Stage 1 implementation plan. This specification is now Approved. It authorizes no code,
scaffold, generated project output, hook change, dependency installation, publication, or work on
Stages 2 through 5. The Stage 1 implementation plan requires separate owner approval before
implementation starts.
