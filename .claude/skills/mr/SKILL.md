---
name: mr
description: Create or update the GitHub pull request for the current branch, following this repository's squash-only policy and branch protection.
---

# mr

Create or update the pull request for the current branch.

## Facts about this repository

- Remote is `https://github.com/evk-soft/devkit.git` and it is **public**. Anything pushed is
  world-readable. Verify the identity for fetch and push separately before any push:
  `git remote get-url --all origin` and `git remote get-url --all --push origin` must each return
  exactly that one URL.
- `main` is protected: a pull request is required, force-push and deletion are refused, history must
  stay linear, and three checks must pass — `Node 24 (pnpm) - ubuntu-latest`,
  `Node 24 (pnpm) - windows-latest`, `Bun 1.3 (runtime smoke)`.
- Merging is **squash only**; merge commits and rebase merges are disabled, and the branch is deleted
  on merge.
- Workflow triggers are `push` on `main` and `pull_request`. **Pushing a branch runs no CI.** If you
  want CI, you need a pull request.

## Before opening

- Target `main` unless told otherwise. Never push to `main` directly; protection refuses it anyway.
- Read the actual work: `git log main..HEAD --oneline` and `git diff main...HEAD --stat`.
- Title is the squash commit subject, so write it as a commit subject in conventional format, not as
  a description of a pull request.

## Tag before squashing away a gated commit

Squash means the branch commits never become ancestors of `main`, and the branch is deleted on merge.
Any commit that something refers to by SHA — a gated phase commit, an approval recorded in
`docs/superpowers/plans/PROGRESS.md` — becomes unreachable unless it is tagged first:

```bash
git tag -a <track>/<name> <sha> -m "<what it is, when approved, what it contained>"
git push origin refs/tags/<track>/<name>
```

Existing examples: `stage-1/phase-1`, `foundation/f1`, `foundation/f2`.

## Description

English, like every repository artifact. Structure it as: what lands and why, how it was verified
with the literal commands and their results, and anything deliberately **not** included with the
reason. State when a phase left an approved tree byte-identical, since that is the property the
protocol exists to guarantee.

**Never add AI attribution.** No `🤖 Generated with ...`, no `Co-Authored-By` trailer, no equivalent.

## Size

Prefer one gated phase per pull request. A pull request that accumulates several phases collapses
into a single squash commit on `main` and destroys the per-phase granularity the protocol produces.
If the branch has grown past one coherent unit, say so and propose splitting before opening it.

## Opening and merging

Open as a draft when the goal is only to see CI. Mark ready when it is genuinely proposed for merge.

Merging is a separate decision that belongs to the owner — ask, do not assume, even when the checks
are green. When authorized:

```bash
gh pr merge <n> --squash --subject "<conventional subject>" --body-file <file>
```

Compose the squash body deliberately; it is what `main`'s history will keep. Afterwards, fetch
`main`, confirm its tree matches what was approved, and rebase any remaining branch with
`git rebase --onto origin/main <old-base>` — a plain `git rebase` picks the wrong merge base after a
squash and tries to replay the entire history.
