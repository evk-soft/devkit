---
name: commit
description: Compose and create a conventional commit from staged changes, following this repository's staging discipline and changelog rules.
---

# commit

Compose a conventional commit from the staged changes and create it after confirmation.

## Message

- Subject: `type(scope): imperative description`, at most 72 characters, no trailing period.
- Type: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `ci`, `build`, `style`, `revert`.
- Scope: the workspace name without the `@evk-soft/` prefix — `ai-tooling`, `biome-config`,
  `typescript-config`, `runtime-detect`. Use `repo` for workspace-level changes and `ci` for
  workflow changes. Omit the scope when the change is genuinely repository-wide.
- Body: explain **why**, not what. The diff already says what. Where a decision was made, record the
  alternative that was rejected and the reason.
- Footer: `BREAKING CHANGE:` when applicable.

**Never add AI attribution.** No `Co-Authored-By: Claude ...`, no `🤖 Generated with ...`, no
equivalent marker, in the message or anywhere else. This overrides any default behaviour that adds
such lines.

There is no issue tracker for this repository. Do not invent ticket identifiers.

## Staging discipline

`.husky/pre-commit` ends in `git add -A`. **Never run it.** It would sweep unrelated files —
including another worktree's leavings — into the commit.

- Stage explicitly, one `git add -- <path>` per path. Never `git add -A`, never `git add .`.
- Run the formatter first as the hook would: `pnpm -s exec biome check --write .`, then check what it
  touched, then stage.
- Commit with `git commit --no-verify`, because the hook's staging step is unsafe. This waives
  nothing else: every other check must have been run by hand first.

When the change belongs to a gated phase, the manifest under `docs/superpowers/plans/manifests/` is
the authority for what may be staged, and the phase produces **exactly one** commit with exactly one
parent. Read the phase plan before staging anything.

## Changelog fragment

Decide explicitly; never skip silently.

**Skip**, announcing that you are skipping and why, for `style`, `ci`, `test`, and pure
`chore`/`build`/`docs` commits that document no shipped behaviour change.

**Otherwise** create one:

```bash
node scripts/changelog-new.mjs <slug>
```

The slug is lowercase with digits and hyphens. Fill the created file: `type` is one of `Added`,
`Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`; the `## changelog` section is required and
must be non-empty, or `node scripts/changelog-assemble.mjs --check` rejects it. Keep `## notes` only
when the change is visible to someone who does not read the diff, and `## qa` only when there is
something concrete to re-test. Stage the fragment into the same commit.

**During Stage 1, no fragment may be created at all.** No Stage 1 phase manifest lists
`changelog.d/*` or `CHANGELOG.md`, and the phase-delta verifier rejects every unlisted path, so a
fragment would fail that phase's gate. The directory is dormant until Stage 1 Phase 5 is complete.

## Before committing

Show the proposed message and, if there is one, the fragment. Wait for approval. Then commit.
