---
name: handoff
description: Generate a complete handoff document so the current work can continue in a fresh conversation with no prior context.
---

# handoff

Generate a complete HANDOFF document so this work can continue in a fresh conversation with no prior
context.

## Communication setup (the one allowed question)

Before generating, ask which chat language to use — the default for this repository's owner is
Russian — and roughly how deep the reader's familiarity with this codebase and domain is. This is the
ONLY question you may ask; everything else is produced autonomously, and a content gap becomes
`UNKNOWN`, never a question. Carry both answers into the handoff's **Communication** section so the
fresh window resumes at the right language and level.

The handoff BODY stays English. Every repository artifact here — code, commits, documentation — is
English; only the chat around producing it follows the chosen language.

## Rules for building it

Source of truth is this conversation's actual content plus the repository. Do NOT invent. If a fact
is unknown or was lost to context compaction, write `UNKNOWN — verify: <how>` rather than guessing.

Before writing, VERIFY volatile facts by actually running:

- `git status --short --branch` in every worktree that matters, not only the main checkout
- `git log <base>..HEAD --oneline`, and `git worktree list` — this repository routinely has more
  than one working tree checked out at once
- `git cat-file commit <sha>` for any commit whose parent matters
- the current version of any package that was bumped
- `gh pr list` / `gh run list` if anything was pushed; note that pushing is separately authorized
  here and is usually NOT permitted
- the plan and progress documents under `docs/superpowers/plans/`, in particular
  `docs/superpowers/plans/PROGRESS.md`, which is the maintained state file

Cite concrete files as `path:line` where it matters. Code beats memory.

Capture the HARD parts, not just a task list: the WHY behind each decision, each problem as
symptom -> proven root cause -> fix, open problems, accepted tradeoffs and why, and dead ends already
ruled out so they are not retried. Name key files with paths and the exact verification commands,
because a fresh window will not know which files were read or what a tool returned.

## Repository-specific context the next window MUST receive

This repository executes work under a phase protocol, and a handoff that omits it is dangerous:

- Which phase is in flight, its execution worktree path and branch, and the exact approved base SHA.
- That each phase changes exactly the paths in its committed manifest under
  `docs/superpowers/plans/manifests/`, produces exactly one commit with exactly one parent, and then
  stops for owner approval.
- That `.husky/pre-commit` ends in `git add -A`, which must never be run; phases commit with
  `--no-verify` after staging manifest paths explicitly.
- Whether anything was pushed. Plan or phase approval never authorizes a push, a PR, or publication.

There is no issue tracker for this work; do not invent ticket identifiers.

Do NOT ask the user questions to FILL the handoff. Produce its content autonomously and mark every
gap as `UNKNOWN` rather than blocking. The only exception is the communication setup above.

## Output

One single ` ```markdown ` fenced block, ready to paste as the first message of a new window, with
exactly these sections:

- How to read this (it is a deliberate handoff; re-read the named files first)
- Communication (chat language and reader's familiarity level for the next window)
- Goal & why
- Repo state (branch, base SHA, every worktree, working tree status, PR link or "none")
- Done so far (each with WHY and commit hash)
- Problems hit & how resolved (symptom -> root cause -> fix)
- Open problems / not yet solved (with current hypothesis and blocker)
- Compromises / tradeoffs accepted (and why)
- Dead ends — do NOT retry these (with the reason)
- Next steps (ordered)
- Key files to re-read first (`path:line` — why)
- How to verify / definition of done (exact commands and expected result)
- Protocol in force (phase, manifest, gate, owner stop)

After the block, list anything you could NOT verify, one line each.
