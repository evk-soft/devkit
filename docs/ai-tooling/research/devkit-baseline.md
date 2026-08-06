# Devkit Baseline for AI Tooling

Status: frozen pre-implementation research
Captured: 2026-08-01
Repository: `evk-soft/devkit`

## Purpose

This file preserves the current repository facts used by the AI-tooling umbrella and Stage 1 child
designs. It contains command evidence only; it does not authorize implementation or overwrite a path
that changes after this snapshot.

Every mutating plan must repeat the relevant census and Git checks against its own frozen `HEAD`.

## Frozen Git snapshot

Commands were run from the repository root:

```text
git rev-parse HEAD
git status --short --branch
```

Result:

```text
550a56e6a8a82153741f9ab26cfdd2f7eaf100d9
## main...origin/main
```

The worktree was clean and matched the visible `main` tracking state at capture time.

## Workspace and runtime files

The current workspace globs are:

- `configs/*` and `packages/*` in `pnpm-workspace.yaml:1-3`.

The current root package declares:

- pnpm `10.28.0` in `package.json:5`;
- Node.js `>=24.0.0` in `package.json:6-7`;
- TypeScript `^5.9.3` in `package.json:28-31`.

The existing pre-commit hook contains only these two lines:

```text
pnpm -s exec biome check --write .
git add -A
```

Source: `.husky/pre-commit:1-2`.

## AI target census

The following exact paths were tested with `Test-Path`:

```text
absent AGENTS.md
absent AGENTS.override.md
absent CLAUDE.md
absent .agents
absent .claude
absent .claude/CLAUDE.md
absent ai-tooling.config.json
absent ai-tooling.lock.json
absent .ai-tooling
```

This supports a clean-init design for the captured snapshot only. The implementation gate must
repeat the census and abort if any intended target has appeared.

## Target-path history

Command:

```text
git log --all --oneline -- configs/ai packages/ai-tooling docs/ai-tooling docs/system-overview
```

Result:

```text
9c56748 chore: scaffold pnpm monorepo (configs + packages)
```

No earlier AI-tooling implementation commit appeared in that path-scoped history. This is evidence
for clean implementation, not proof that unrelated history contains no sensitive material.

## Current ignore behavior

The current `.gitignore` does not contain an AI-tooling local-state rule. These probes used
`git check-ignore -v --no-index` with the repository `.gitignore` as the explicit global-exclude
input:

```text
not ignored: .ai-tooling/state.json
not ignored: .ai-tooling/backups/probe
not ignored: .ai-tooling/run.lock
not ignored: ai-tooling.lock.json
```

Stage 1 therefore must add a root-anchored ignore rule for `.ai-tooling/**` before creating local
state. It must also prove that the committed `ai-tooling.lock.json` remains unignored.

## Design-audit snapshots

The first public-transfer audit of the split eight-file bundle checked these key files:

```text
durable architecture  ea4604a958f1c67087e208c81d620c43a62c92387c7ce0256414c84dd34e3d61
umbrella specification  9c8419bf8a5146faba2db527850430933a619245fb1b3a3470ff9296c3015ef0
Stage 1 child specification  eaa7179e9b78117062c8314eb43aa6047f0f9c53ae96b72ec634fb15e07509ce
```

The public-transfer verdict was READY for MIT publication safety: no secret, private identifier,
machine path, hidden file, copied implementation block, or durable reverse link was found. The
written-spec verdict on the same snapshot was NOT READY because lifecycle and grounding contracts
still required repairs. Both verdicts apply only to those exact prior bytes.

### Approved owner-review snapshot

Before the authorized documentation corrections began, a separate gate confirmed:

```text
branch    codex/ai-tooling-design
HEAD      a77cba2c1653c9bc0356c47f6500cc72f2ef510d
main      550a56e6a8a82153741f9ab26cfdd2f7eaf100d9
upstream  none
worktree  clean
```

The correction applies option A, NEW-1, and A-1 through A-9 from the owner review. The final review
correction also resolves R1 through R3 and M1 through M2. On 2026-08-02, the repository owner
approved this exact five-file snapshot with `approve written design`.

The corrected owner-review bytes are identified by both SHA-256 and line count:

| Document | SHA-256 | Lines |
| --- | --- | ---: |
| Durable architecture | `16d0af83199a906b3582c29833d1e64a5fafb145d5cd30a2febda29e723ae046` | 1464 |
| Umbrella specification | `c63e0f6a2c901de325a5d54c1d170c562a968b3595aa97f0cd90874711a9597d` | 333 |
| Stage 1 child specification | `69c5ff603d18b1afaf56d9632e20996738b08eb0f183a7ae3753c9fe57534ba4` | 757 |
| Platform distribution baseline | `e66e4e6046a5b40a1da5e4a7bd3141f7135ab543f4ee345349174f8cb06de169` | 133 |

The approved pre-record baseline was 152 lines with SHA-256
`5a3b8efe287675e5750b2054f2a9e9ed7987c28415a5eed669170f2d6ae0a06e`. This historical digest
identifies its owner-reviewed bytes, not the current file. Unrelated `.idea/**` files appeared after
the clean pre-edit gate; they are outside this snapshot and must stay out of the approval commit.

Apart from the explicitly authorized status, review-gate, and snapshot-record edits, any later
design-content edit requires a new frozen snapshot and renewed owner review.

### Reopened owner-review candidate (R4)

The approved owner-review snapshot above remains immutable historical evidence for its exact bytes.
During Stage 1 implementation-plan preparation, a native Windows probe found R4: the exact `pnpm`
formatter invocation depended on a command shim that Node.js cannot launch with shell execution
disabled. On 2026-08-02, the owner authorized only the following design correction with `go`; that
authorization did not approve the corrected bytes.

The correction preserves the caller-explicit direct-executable form and adds a separate,
caller-explicit root-declared Node package-entry form. Both resolve to one frozen absolute file before
launch, receive exact arguments, run with `shell: false` in a disposable checkout and a fixed
environment, and are bounded by whole-process-tree timeout, output, and redaction rules. A frozen Git
2.36.0-or-later provider records a configuration-isolated pre/post checkout census. That census is an
observed postcondition, not an operating-system sandbox or rollback mechanism for caller-trusted
formatter code.

The current candidate freeze is:

```text
branch    codex/ai-tooling-design
HEAD      b37117a739014237142c6525f19a8330dda5afdc
main      550a56e6a8a82153741f9ab26cfdd2f7eaf100d9
upstream  none
snapshot  uncommitted
worktree  not clean; owner-supplied dependency/config changes and .idea/** are outside this snapshot
```

The R4 candidate document bytes are identified by SHA-256 and line count:

| Document | SHA-256 | Lines |
| --- | --- | ---: |
| Durable architecture | `2503a361949248bf468607df564d02c36aabdeb714f6cdfbbb2460c564960e28` | 1700 |
| Umbrella specification | `acbb9ca363a77db13abef912068cede53eae53d21e4ede27f5e3295b89865148` | 344 |
| Stage 1 child specification | `237a4d5e7335a1f11a87d7fd1892b044c23b67a7a23fccb59a78ec5b8a861c49` | 949 |
| Platform distribution baseline | `e66e4e6046a5b40a1da5e4a7bd3141f7135ab543f4ee345349174f8cb06de169` | 133 |

This append begins after the 152-line R4 pre-record baseline whose SHA-256 is
`5295c58acd34d48f9b72a4ebb7cba1b5efdf72de7993c46de7296883f7d7c942`. The current owner-supplied
`package.json` grounding input has SHA-256
`da862ecf29f0a9c4806bbd126d3470bfd2b81c1f7c6eced18ad805ac460a8e92`, has 33 lines, and declares
TypeScript `^6.0.3` and Biome `^2.5.6`. It is outside the hash-defined design-document snapshot and remains
unstaged. Every other owner-supplied dependency/config change and `.idea/**` path is also outside this
snapshot.

### R4 owner approval

On 2026-08-02, the repository owner approved the exact hash-defined R4 candidate above with
`approve written design`. Before this approval record was appended, this baseline file had 201 lines
and SHA-256 `d850dfbc42d2adae4ab30f7385d31a74d7663fb28367de71589b1b1e823b168f`.
Together with the candidate table, that digest identifies all five approved document byte streams.

The approval authorizes the status, review-gate, and snapshot-record edits, their documentation-only
commit, and creation of a detailed Stage 1 implementation plan. It authorizes no implementation,
generated project output, hook change, dependency installation, publication, push, pull request, or
planning or work for Stages 2 through 5. Both written specifications are now Approved. The Stage 1
implementation plan requires separate owner approval before implementation starts.

The post-approval administrative document bytes are:

| Document | SHA-256 | Lines |
| --- | --- | ---: |
| Durable architecture | `5f23a6f521f5efcba3091857a3bf96cd24c247af3f492eba931b090d24f1db33` | 1700 |
| Umbrella specification | `f6a2a1672b97fceabb4c92eacefd1e2926246f7a5c5b2848775fd8275be141c3` | 345 |
| Stage 1 child specification | `8116415536392de1b998312b49bbcb9a8c536ffacd522c85da92b532b0a89d9e` | 950 |
| Platform distribution baseline | `e66e4e6046a5b40a1da5e4a7bd3141f7135ab543f4ee345349174f8cb06de169` | 133 |

Any later design-content edit requires a new frozen snapshot and renewed owner review.
