---
name: audit-plan
description: Audit an implementation plan or design spec for defects before it is executed, using mechanical checks first and independent reviewers second.
---

# audit-plan

Audit a plan or spec for defects. Run this **before** execution, not after.

This is not a formality. In this repository the same audit found **13 defects** in the Stage 1
implementation plan and **6** in the repository-foundation plan — including a test that could never
have passed, a gate command that always threw, and a guard script that failed on the clean tree.
None were visible by reading the document.

## Targets

- specs: `docs/superpowers/specs/*.md`
- plans: `docs/superpowers/plans/*.md`
- manifests: `docs/superpowers/plans/manifests/*.txt`

If the target is not given, ask for it. That is the only question you may ask.

## Stage 1 — mechanical checks, always first

Write a throwaway script and run it. These are deterministic, cheap, and catch the defect classes
that actually occur here. Do not eyeball them.

1. **Manifest grammar and order.** Every line matches `^(A|M) 100644 <path>$` or `^D - <path>$`;
   paths match `[A-Za-z0-9._/-]+` with no empty or dot component; the list is sorted by **raw byte**,
   not by locale; no duplicates; no CR anywhere.
2. **Manifest against the base tree.** Every `M` path must exist at the phase base and every `A` path
   must not. Use `git cat-file -e <base>:<path>`. This catches Create/Modify verb mismatches, which
   have occurred more than once.
3. **Plan `Files:` blocks against the manifest, both directions.** Every path a task declares must be
   in that phase's manifest with a matching verb, and every manifest path must be claimed by some
   task. Shorthand like `base.json, browser.json, ...` hides paths from this check — require full
   paths.
4. **Ordering.** No task modifies a file before another task creates it. No step runs a script before
   the step that writes it. No step invokes a `pnpm run <name>` the plan never defines.
5. **Claimed numbers.** The plan asserts counts — "12 files", "15 occurrences", "40 paths". Verify
   every one against the real tree. A stale count means the plan was written against a different
   state than the one it will run on.
6. **Hygiene.** Fences balanced, step numbering contiguous within each task, no placeholder text, no
   CR, final newline present.

Report what each check covered even when it passes, so a reader knows what was *not* checked.

## Stage 2 — independent reviewers

Only after the mechanical pass is clean. Dispatch several reviewers with **different focuses**, not
several copies of the same prompt:

- semantics and consequences — would executing this break something already approved?
- commands and embedded code — copy every script into a temp directory and **actually run it**;
  walk every shell block for stale `$LASTEXITCODE` reads, array-versus-string handling, and
  assertions that pass when they should fail
- coverage and consistency — does every commitment in the spec have a task, and does every claimed
  cross-reference resolve?

Tell each reviewer which state to read. In this repository the main checkout and a phase worktree
hold **different trees**; a reviewer pointed at the wrong one produces confident, wrong findings.
That has already happened once.

## Verify before relaying

Reviewers are wrong often enough that relaying them unchecked is worse than not running them.
Reproduce every finding yourself before accepting it, and say plainly which ones you rejected and
why. A finding you could not reproduce is a finding you do not report as fact.

## Output

Findings only, most severe first. For each: severity, the claim in one line, the evidence you
personally reproduced (`path:line` or literal command output), and the exact change required.
End with what you verified as correct, and a short list of anything you could not verify.
