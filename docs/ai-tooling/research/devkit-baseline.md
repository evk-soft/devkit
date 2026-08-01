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
absent CLAUDE.md
absent .agents
absent .claude
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

After any edit, publication safety and written-spec consistency require a new frozen snapshot and a
targeted re-audit.
