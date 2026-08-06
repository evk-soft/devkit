# Repository Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring devkit to the agreed monorepo baseline in two separately gated phases — F1 delivers
the repository foundation together with the pnpm 10 → 11 upgrade, F2 delivers the TypeScript 7 and
Biome 2.5.7 compiler upgrade — without altering one byte of the owner-approved Stage 1 Phase 1 tree.

**Architecture:** Foundation state lives in root configuration files and `scripts/**`. Every setting
that pnpm 11 relocates is written once, in its final v11 spelling, inside `pnpm-workspace.yaml`;
`.npmrc` is reduced to registry and auth only. The Biome version stops being written into 12
`$schema` URLs and survives only as a catalog entry. Guard scripts are additive: they get their own
`package.json` scripts and CI steps and are never inserted in front of an existing Stage 1 command.
Each phase runs in its own worktree, changes exactly the paths in its committed manifest, and ends in
exactly one commit followed by an owner stop.

**Tech Stack:** Node.js 24 or later, pnpm 11.20.0 (from 10.28.0), TypeScript 6.0.3 in F1 and 7.0.2 in
F2, Biome 2.5.6 in F1 and 2.5.7 in F2, Vitest 4.1.10 unchanged, turbo 2.10.8, husky 9.1.7, Git 2.45.0
or later for the phase object-reading gates.

## Global Constraints

- **Status:** Awaiting owner approval. This plan does not authorize implementation.
- The approved design input is `docs/superpowers/specs/2026-08-06-repository-foundation-design.md`,
  revision 3. If this plan and that design differ, stop and obtain a written amendment.
- Do not start F1 until the owner explicitly says `approve the repository foundation plan and start
  F1`. That approval authorizes F1 only. F2 requires its own approval of the F1 commit.
- Produce exactly one implementation commit per phase. No intermediate commits. Stop after reporting
  the exact candidate SHA and evidence.
- Never modify any path under `packages/ai-tooling/**` or `configs/ai/**`. Neither manifest lists one,
  so the verifier fails closed if a formatter, a codemod, or a compiler upgrade touches them.
- Never modify `.husky/pre-commit`, and never run its `git add -A`.
- Never modify `packages/ai-tooling/scripts/verify-phase-delta.mjs`. Phases 2-5 execute exactly the
  approved-base bytes of that file.
- Every new tracked file is mode `100644`. The manifest grammar admits nothing else, and every
  reference script this plan adapts is `100755` upstream.
- No **Stage 1** phase may author a changelog fragment: no Stage 1 phase manifest lists
  `changelog.d/*` or `CHANGELOG.md`, and the phase-delta verifier rejects every unlisted path. F1 and
  F2 are foundation phases, not Stage 1 phases, and their own manifests do list the scaffolding files
  F1 creates — that is not a violation of this rule but the reason the rule can be stated. F1 creates
  the infrastructure dormant; the first actual fragment comes after Stage 1 Phase 5.
- Do not push, open a PR, or publish. Both phases stop at a local commit plus owner review.
- Historical records are not rewritten. `docs/superpowers/plans/PROGRESS.md` and
  `docs/ai-tooling/research/devkit-baseline.md` contain `10.28.0` as statements about what was
  observed at the time; neither is in a manifest and neither is amended.

---

## 0. Protocol

### 0.1 Phase manifests

Two plan-owned manifests are the fail-closed staging authority. They are committed together with this
plan, before F1 begins, and are review data rather than implementation:

- `docs/superpowers/plans/manifests/repository-foundation-f1.txt` — 40 paths
- `docs/superpowers/plans/manifests/repository-foundation-f2.txt` — 9 paths

Each LF line is `A 100644 path`, `M 100644 path`, or `D - path`; paths use the ASCII grammar
`[A-Za-z0-9._/-]+`, contain no empty or dot components, and are sorted by raw byte. Both files were
validated before this plan was written: byte-sorted, grammar-clean, CR-free, duplicate-free, and —
against `ec88ca3` — every `M` path exists and no `A` path does.

### 0.2 F0 — linearize the history (prerequisite, not a phase)

`b3ec1b2` has two children: `ec88ca3` (the approved Phase 1 commit) and the plan-branch line carrying
`PROGRESS.md` updates and the foundation design. None of the plan-branch commits touch a product
file, so the fork is resolved by rebase. Run from the main checkout:

```powershell
git -C D:/disk.w/Projects/evk-soft/devkit switch codex/ai-tooling-design
git -C D:/disk.w/Projects/evk-soft/devkit rebase ec88ca3
git -C D:/disk.w/Projects/evk-soft/devkit log --oneline --graph -8
```

Expected GREEN: the rebase reports no conflict, and the graph is one straight line with `ec88ca3`
below the docs commits. If any conflict appears, stop — a conflict means a plan-branch commit touched
a product file, which contradicts the premise and must be investigated before F1.

### 0.3 Per-phase worktree, gate, and commit protocol

This is the Stage 1 master plan §0.3 protocol, applied unchanged. For each of F1 and F2:

- Create a clean worktree from the owner-approved preceding commit — `ec88ca3` plus the rebased docs
  commits for F1, the F1 commit for F2.
- Record `git branch --show-current`, `git rev-parse HEAD`, `git status --short --branch` before edits.
- Run `pnpm install --frozen-lockfile --ignore-scripts` before tests; require a clean status
  afterwards. Lifecycle scripts, including husky, must not run during setup.
- Run every phase check, `pnpm check`, and `git diff --check` before staging.
- Require `git diff --cached --quiet`, then run the first real hook command exactly as committed:
  `pnpm -s exec biome check --write .`. **Never run the hook's `git add -A`.** Immediately require
  every tracked and untracked change reported by
  `git status --porcelain=v1 -z --untracked-files=all --ignore-submodules=all` to be a path and status
  the phase manifest permits. If Biome changes any path outside the manifest, stop without staging.
- Stage only the manifest paths, one explicit `git add --` per path.
- Run `git diff --cached --check`, then the manifest comparison described in the phase gate task.
- Commit with `git commit --no-verify` only after all gates pass.
- Re-verify the committed delta against the bound approved base, then stop for owner approval.

`verify-phase-delta.mjs` is a Stage 1 tool whose `--phase N` argument resolves Stage 1 manifest names
only. F1 and F2 therefore use the direct frozen comparison this plan specifies in each gate task,
exactly as Stage 1 Phase 1 did before that verifier existed. The verifier file itself is never
modified, never staged, and never renamed.

---

## Phase F1 — Repository foundation and pnpm 11

### F1 Phase Entry Snapshot

- [ ] **Step 1: create the F1 worktree and bind the approved base**

Run every command of this phase in **one** PowerShell session and retain `$approvedBaseSha` through
Task F1.12. If the session is lost, do not guess: re-open a session in the worktree and re-bind with
`$approvedBaseSha = (git rev-parse HEAD).Trim()` **before any edit exists**, or, if edits already
exist, recover it from `git log --oneline -1` on the source branch and verify it against
`git merge-base HEAD <source-branch>`.

```powershell
$base = (git -C D:/disk.w/Projects/evk-soft/devkit rev-parse HEAD).Trim()
if ($base -cnotmatch '^[0-9a-f]{40}$') { throw 'approved base is not one full lowercase SHA-1' }
git -C D:/disk.w/Projects/evk-soft/devkit worktree add `
  D:/disk.w/Projects/evk-soft/devkit-worktrees/repository-foundation-f1 `
  -b repository-foundation/f1 $base
Set-Location D:/disk.w/Projects/evk-soft/devkit-worktrees/repository-foundation-f1
$approvedBaseSha = (git rev-parse HEAD).Trim()
if ($approvedBaseSha -cne $base) { throw 'worktree HEAD does not equal the approved base' }
git status --short --branch
```

Expected GREEN: every command exits `0`, `$approvedBaseSha` equals `$base`, and the status is clean.

- [ ] **Step 2: prove the base is the approved Phase 1 tree, on the pre-upgrade toolchain**

```powershell
pnpm install --frozen-lockfile --ignore-scripts
if ($LASTEXITCODE -ne 0) { throw 'F1 entry install failed' }
$pnpmVersion = (pnpm --version).Trim()
if ($pnpmVersion -cne '10.28.0') { throw "baseline pnpm is '$pnpmVersion', not 10.28.0" }
$biomeVersion = (pnpm -s exec biome --version).Trim()
if ($biomeVersion -cne 'Version: 2.5.6') { throw "baseline Biome is '$biomeVersion', not 2.5.6" }
if (-not (Test-Path packages/ai-tooling/scripts/verify-phase-delta.mjs)) {
  throw 'base is not the approved Phase 1 tree'
}
git status --short --branch
```

Expected GREEN: all assertions pass and the status is unchanged from Step 1. Any mismatch is a stop
with zero edits.

- [ ] **Step 3: record the pre-change Stage 1 gate as the comparison baseline**

```powershell
pnpm check
if ($LASTEXITCODE -ne 0) { throw 'Stage 1 gate does not pass at the F1 base' }
```

Expected GREEN: exit `0`. This is the exact command F1 must still satisfy at its own gate. Note that
on this base `check` chains `check:ai-tooling`, which expands to `typecheck && test && pack:check`, so
this single command already covers every Stage 1 gate command.

---

### Task F1.1: Ignore rules, line endings, and editor contract

**Files:**
- Create: `.editorconfig`
- Modify: `.gitignore` (append at end of file, after the existing `/.ai-tooling/` block)
- Modify: `.gitattributes` (append at end of file)

**Interfaces:**
- Produces: the ignore guarantees every later task and both phase gates depend on. Nothing consumes
  a symbol from this task.

- [ ] **Step 1: write the failing probe**

Create the probe as a throwaway script at `probe-ignore.ps1` in the worktree root (deleted in Step 5,
never staged):

```powershell
# Every path here must be ignored *by this repository's own .gitignore*. Do not use a `.log` or
# other extension the base .gitignore already covers, or the probe proves nothing. `.claude/
# settings.local.json` is omitted for the same reason in reverse: some developers have it in a
# global excludes file, which would make the pre-change run pass on their machine and not on others.
$expectIgnored = @(
  '.claude/agent-memory/note.md',
  '.claude/worktrees/x/state.json',
  '.claude/todos/t.json',
  '.turbo/cache.bin',
  'packages/ai-tooling/.turbo/x.bin',
  '.idea/workspace.xml'
)
$expectVisible = @(
  '.claude/settings.json',
  '.claude/rules/evk-grounding.md',
  '.claude/skills/evk-plan/SKILL.md',
  'ai-tooling.lock.json'
)
$fail = $false
foreach ($p in $expectIgnored) {
  git check-ignore -q -- $p
  if ($LASTEXITCODE -ne 0) { Write-Host "NOT IGNORED (should be): $p"; $fail = $true }
}
foreach ($p in $expectVisible) {
  git check-ignore -q -- $p
  if ($LASTEXITCODE -eq 0) { Write-Host "IGNORED (should be visible): $p"; $fail = $true }
}
if ($fail) { throw 'ignore probe failed' } else { Write-Host 'ignore probe ok' }
```

- [ ] **Step 2: run the probe to verify it fails**

Run: `pwsh -File probe-ignore.ps1`
Expected: FAIL, listing all six `NOT IGNORED (should be)` paths, because `.gitignore` at the F1 base
contains no `claude`, `turbo`, or `idea` entry. If any of the six is already reported as ignored,
stop and find out why before changing anything — a global or machine-local excludes file is
interfering and the probe would not be measuring this repository.

- [ ] **Step 3: append the ignore rules**

Append to `.gitignore`, preserving its existing final LF and adding no CR:

```gitignore

# Turbo task cache
.turbo/

# JetBrains IDE state
/.idea/

# Claude Code local state. Deny by default, then re-admit exactly the three tracked things:
# settings.json is shared tooling configuration, and rules/ and skills/ are generated by
# @evk-soft/ai-tooling and are committed artifacts. Any future runtime path Claude Code
# introduces under .claude/ is ignored without needing to be enumerated here.
/.claude/*
!/.claude/settings.json
!/.claude/rules/
!/.claude/skills/
```

- [ ] **Step 4: run the probe to verify it passes**

Run: `pwsh -File probe-ignore.ps1`
Expected: PASS, printing `ignore probe ok` and nothing else.

- [ ] **Step 5: add the line-ending guard and the editor contract, then delete the probe**

Append to `.gitattributes`:

```gitattributes

# Windows shell scripts keep CRLF. Nothing tracked needs this today; it is a forward guard so a
# future .bat/.cmd is not normalized to LF by the `* text=auto eol=lf` rule above.
*.bat text eol=crlf
*.cmd text eol=crlf
```

Create `.editorconfig`:

```editorconfig
# Editor configuration, see https://editorconfig.org
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true
# 100 matches configs/biome-config/biome.preset.json lineWidth. Do not raise this to 120 without
# raising the formatter too, or the editor guide will advertise a width the formatter rejects.
max_line_length = 100

[*.md]
# Markdown uses two trailing spaces as a hard line break.
max_line_length = off
trim_trailing_whitespace = false
```

Then `Remove-Item probe-ignore.ps1`.

- [ ] **Step 6: verify no stray file survives**

Run: `git status --porcelain=v1 --untracked-files=all`
Expected: exactly `.editorconfig` untracked and `.gitattributes`, `.gitignore` modified. No
`probe-ignore.ps1`.

---

### Task F1.2: pnpm 11 migration

**Files:**
- Modify: `.npmrc`
- Modify: `pnpm-workspace.yaml`
- Modify: `package.json` (the `packageManager` field only, in this task)
- Modify: `pnpm-lock.yaml` (regenerated)

**Interfaces:**
- Consumes: nothing.
- Produces: a pnpm 11 workspace. Task F1.3 adds catalog entries to the same
  `pnpm-workspace.yaml`; Task F1.7 adds `turbo` to it.

- [ ] **Step 1: provision the corepack cache before anything else**

`packages/ai-tooling/scripts/check-package-contents.mjs` resolves pnpm from
`<corepack root>/v1/pnpm/<version>/bin/pnpm.cjs` with `COREPACK_ENABLE_NETWORK: '0'`, so `pack:check`
cannot self-heal a missing version.

```powershell
corepack install --global pnpm@11.20.0
$root = if ($env:COREPACK_HOME) { $env:COREPACK_HOME } else { Join-Path $env:LOCALAPPDATA 'node/corepack' }
$entry = Join-Path $root 'v1/pnpm/11.20.0/bin/pnpm.cjs'
if (-not (Test-Path $entry)) { throw "corepack cache lacks pnpm 11.20.0 at $entry" }
```

Expected GREEN: the entry exists. If it does not, stop — every later `pack:check` in this phase would
fail with `no installed pnpm 11.20.0 JavaScript entry was found`.

- [ ] **Step 2: run the official codemod and review its output**

```powershell
pnpx codemod run pnpm-v10-to-v11
git diff -- .npmrc pnpm-workspace.yaml
git status --porcelain=v1 --untracked-files=all
```

Expected: a diff moving settings out of `.npmrc`. Read every line. The codemod also rewrites keys this
repository does not use; discard any hunk that introduces a setting not named in Step 3. The codemod
is a labour-saver, not an authority — Step 3 defines the exact intended result.

**Bound its blast radius before continuing.** The status output must list exactly `.npmrc`,
`pnpm-workspace.yaml`, and Task F1.1's three files. Anything else — a rewritten root `package.json`, a
touched workflow, a `.codemod/` cache directory — must be reverted with `git checkout --` or deleted
now, not discovered at the F1.12 gate when the phase would have to be unwound. Record the codemod
version that actually ran: this is the one step in either phase that fetches and executes an unpinned
third-party package, and `pnpx` bypasses both the lockfile and `minimumReleaseAge`. If the owner
prefers, skip this step entirely and hand-write Step 3 — the codemod saves typing, nothing more.

- [ ] **Step 3: write the exact intended result**

`.npmrc` becomes exactly:

```ini
# pnpm configuration
# See: https://pnpm.io/npmrc
#
# pnpm 11: this file is read for AUTH / REGISTRY settings ONLY.
# All behavioural settings live in pnpm-workspace.yaml, in camelCase.
# Adding engine-strict, node-linker or shared-workspace-lockfile here has no effect.
```

`pnpm-workspace.yaml` becomes exactly:

```yaml
packages:
  - "configs/*"
  - "packages/*"

# --- Migrated from .npmrc; pnpm 11 reads behavioural settings here, in camelCase ---
engineStrict: true
nodeLinker: isolated
sharedWorkspaceLockfile: true

# --- Supply chain ---
# Empty allowlist: no dependency may execute code at install time.
# WARNING: under pnpm 11 an install that meets an unlisted build script fails with
# ERR_PNPM_IGNORED_BUILDS *and writes a placeholder entry back into this file*. CI installs without
# --ignore-scripts, so the first dependency that adds an install script breaks CI and dirties the
# worktree. Such a dependency must be added here, with a decision, in the same commit that adds it.
allowBuilds: {}
# 4320 minutes = 3 days. Chosen against measured publish dates rather than copied: a 7-day delay
# would have blocked turbo 2.10.8, which was 5 days old when this plan was written, and pnpm's own
# default of 1440 admits a next-day malicious publish. Re-check this value at the F2 entry snapshot.
minimumReleaseAge: 4320
```

`package.json` line 5 becomes `"packageManager": "pnpm@11.20.0",`. Use the plain form: the
integrity-hash form `pnpm@11.20.0+sha512-…` is rejected by
`check-package-contents.mjs`'s `^pnpm@\d+\.\d+\.\d+$` regex, and that file may not be edited here.

- [ ] **Step 4: regenerate the lockfile and prove the settings took effect**

```powershell
corepack prepare pnpm@11.20.0 --activate
if ($LASTEXITCODE -ne 0) { throw 'corepack prepare failed' }
$pm = (Get-Content package.json | Select-String '"packageManager"').Line
if ($pm -notmatch '"packageManager":\s*"pnpm@\d+\.\d+\.\d+"') {
  throw "packageManager is $pm; check-package-contents.mjs requires the plain pnpm@X.Y.Z form"
}
pnpm install --ignore-scripts
if ($LASTEXITCODE -ne 0) { throw 'pnpm 11 install failed' }
$v = (pnpm --version).Trim()
if ($v -cne '11.20.0') { throw "pnpm is '$v', not 11.20.0" }
pnpm config get nodeLinker
pnpm config get engineStrict
git status --porcelain=v1 --untracked-files=all
```

**Do not use `corepack use`.** It rewrites `packageManager` to the integrity-hash form
`pnpm@11.20.0+sha512-…`, which `check-package-contents.mjs:264` rejects with
`root packageManager must pin an exact pnpm version`, and it additionally runs a scripts-enabled
`pnpm install` that would fire the root `prepare: husky` lifecycle script — forbidden by §0.3.
`corepack prepare --activate` activates the shim without touching `package.json`. The assertion above
is the guard: it fails loudly if anything reintroduces the hashed form.

Expected GREEN: install exits `0`; version is `11.20.0`; `nodeLinker` prints `isolated` and
`engineStrict` prints `true`; the changed set is exactly `.npmrc`, `package.json`,
`pnpm-lock.yaml`, `pnpm-workspace.yaml` plus Task F1.1's files.

Then confirm the `allowBuilds: {}` failure mode the design requires F1 to establish, in a throwaway
directory so nothing here is disturbed:

```powershell
$probe = Join-Path ([System.IO.Path]::GetTempPath()) "allowbuilds-probe-$(Get-Random)"
New-Item -ItemType Directory -Force $probe | Out-Null
Push-Location $probe
'{ "name": "probe", "version": "0.0.0", "private": true }' | Set-Content package.json
"packages: []`nallowBuilds: {}" | Set-Content pnpm-workspace.yaml
pnpm add esbuild 2>&1 | Select-String 'IGNORED_BUILDS|allowBuilds'
Get-Content pnpm-workspace.yaml
Pop-Location
Remove-Item -Recurse -Force $probe
```

Expected: `ERR_PNPM_IGNORED_BUILDS` is reported **and** `pnpm-workspace.yaml` gains a placeholder
`allowBuilds` entry. Record the observed behaviour. This is why the CI `Install` step must be watched
the first time any dependency with an install script is added — see the warning comment in Step 3.

- [ ] **Step 5: prove the Stage 1 gate still passes on pnpm 11**

```powershell
pnpm check
if ($LASTEXITCODE -ne 0) { throw 'Stage 1 gate broke under pnpm 11' }
```

Expected GREEN: exit `0`. This is the single most important assertion in F1 — it proves the package
manager major upgrade did not disturb the approved Phase 1 tree, including `pack:check`.

---

### Task F1.3: Catalogs

**Files:**
- Modify: `pnpm-workspace.yaml`
- Modify: `package.json` (root `devDependencies`)
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: the pnpm 11 workspace from Task F1.2.
- Produces: catalog entries `@biomejs/biome`, `husky`, `typescript`, consumed by Task F1.7 (`turbo`)
  and by both F2 tasks.

- [ ] **Step 1: append the catalog block to `pnpm-workspace.yaml`**

```yaml

catalogMode: strict

catalog:
  '@biomejs/biome': ^2.5.6
  husky: ^9.1.7
  typescript: ^6.0.3
```

`catalogMode: strict` governs how `pnpm add` writes new dependencies; it does not retroactively
forbid an inline version. The literal pins inside `packages/ai-tooling/package.json` are therefore
unaffected, which is required — see Step 3.

- [ ] **Step 2: point the root devDependencies at the catalog**

Root `package.json` `devDependencies` becomes exactly:

```json
  "devDependencies": {
    "@biomejs/biome": "catalog:",
    "husky": "catalog:",
    "typescript": "catalog:"
  }
```

- [ ] **Step 3: verify the catalog stops at the ai-tooling boundary**

```powershell
$hits = Select-String -Path packages/ai-tooling/package.json -Pattern 'catalog:'
if ($hits) { $hits; throw 'packages/ai-tooling must not use catalog: specifiers' }
```

Branch on `Select-String`'s own result, never on `$LASTEXITCODE`. `Select-String` is a cmdlet and does
not set `$LASTEXITCODE`; the variable still holds the exit code of the last *native* command, so
`if ($LASTEXITCODE -eq 0)` here would throw on a clean tree and stay silent after a failed native
command — wrong in both directions.

Expected GREEN: no match. A `catalog:` specifier there would break `pack:check`, because
`check-package-contents.mjs` runs `pnpm pack` from a private staging root outside the workspace and a
catalog specifier cannot resolve outside a workspace — verified to fail with
`ERR_PNPM_CATALOG_ENTRY_NOT_FOUND_FOR_SPEC`.

- [ ] **Step 4: install and re-run the gate**

```powershell
pnpm install --ignore-scripts
if ($LASTEXITCODE -ne 0) { throw 'catalog install failed' }
$b = (pnpm -s exec biome --version).Trim()
if ($b -cne 'Version: 2.5.6') { throw "Biome resolved to '$b' through the catalog" }
pnpm check
if ($LASTEXITCODE -ne 0) { throw 'Stage 1 gate broke after catalogs' }
```

Expected GREEN: all exit `0`, Biome still resolves to 2.5.6.

---

### Task F1.4: Remove the Biome version from 12 `$schema` URLs

**Files:**
- Modify: `biome.json`
- Modify: `configs/biome-config/biome.preset.json`
- Modify: `configs/biome-config/presets/base.json`
- Modify: `configs/biome-config/presets/browser.json`
- Modify: `configs/biome-config/presets/bun.json`
- Modify: `configs/biome-config/presets/imports.json`
- Modify: `configs/biome-config/presets/node.json`
- Modify: `configs/biome-config/presets/performance.json`
- Modify: `configs/biome-config/presets/react.json`
- Modify: `configs/biome-config/presets/strict.json`
- Modify: `configs/biome-config/presets/test.json`
- Modify: `configs/biome-config/presets/typescript.json`

Twelve files exactly: the root config, the shared preset, and the ten presets. This count is asserted
in Step 2.

**Interfaces:**
- Consumes: nothing.
- Produces: a tree in which the Biome version exists only in the catalog entry from Task F1.3. F2
  relies on this: its Biome change becomes one line.

- [ ] **Step 1: write the failing assertion**

```powershell
$hits = Select-String -Path biome.json, configs/biome-config/biome.preset.json, `
  configs/biome-config/presets/*.json -Pattern 'biomejs\.dev/schemas/[0-9]'
if ($hits) { Write-Host "versioned schema URLs remaining: $($hits.Count)"; throw 'FAIL' }
Write-Host 'no versioned Biome schema URL remains'
```

- [ ] **Step 2: run it to verify it fails**

Expected: FAIL with `versioned schema URLs remaining: 12`.

- [ ] **Step 3: replace every `$schema` value**

The replacement value depends on the file's depth, because the path is resolved relative to the file
that carries it. In `biome.json` and `configs/biome-config/biome.preset.json`:

```json
  "$schema": "./node_modules/@biomejs/biome/configuration_schema.json",
```

In the ten files under `configs/biome-config/presets/` — that directory has no `node_modules` of its
own — one level up:

```json
  "$schema": "../node_modules/@biomejs/biome/configuration_schema.json",
```

Change nothing else in any of the 12 files. Biome ships that schema inside the package
(`configuration_schema.json`, 576117 bytes) and documents the relative path as a supported
alternative; it was verified to resolve from both the repository root and `configs/biome-config/`.
`$schema` is an editor affordance that Biome never reads to select behaviour, so a wrong value cannot
change formatting or linting.

- [ ] **Step 4: run the assertion to verify it passes, and prove Biome is unaffected**

```powershell
# assertion from Step 1 must now print the success line
pnpm -s exec biome check .
if ($LASTEXITCODE -ne 0) { throw 'Biome rejected the tree after the schema change' }
git diff --stat -- biome.json configs/biome-config
```

Expected GREEN: the assertion passes, `biome check .` exits `0`, and the diff shows exactly 12 files
with one changed line each.

---

### Task F1.5: Structural guard scripts

**Files:**
- Create: `scripts/check-circular.mjs`
- Create: `scripts/check-workspace-boundaries.mjs`
- Create: `scripts/check-audit.mjs`
- Create: `scripts/check-licenses.mjs`
- Modify: `package.json` (`scripts` block)

**Interfaces:**
- Consumes: the workspace globs in `pnpm-workspace.yaml`.
- Produces: four `node scripts/<name>.mjs` entry points, each exiting `0` on a clean tree and non-zero
  with a named violation otherwise. Task F1.10 wires them into CI.

All four are created mode `100644` and invoked through `node`, so no executable bit is needed. None of
them is added to the `check` script — `check` keeps its current definition because Stage 1 phase gates
invoke it literally.

- [ ] **Step 1: write `scripts/check-circular.mjs`**

```javascript
#!/usr/bin/env node
// Fails when the declared @evk-soft/* workspace dependency graph contains a cycle.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GLOB_DIRS = ['configs', 'packages'];

function readWorkspaces() {
  const found = new Map();
  for (const dir of GLOB_DIRS) {
    const base = join(ROOT, dir);
    if (!existsSync(base)) continue;
    for (const entry of readdirSync(base, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const manifestPath = join(base, entry.name, 'package.json');
      if (!existsSync(manifestPath)) continue;
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      if (typeof manifest.name !== 'string') continue;
      const deps = new Set();
      for (const field of ['dependencies', 'devDependencies', 'peerDependencies']) {
        for (const name of Object.keys(manifest[field] ?? {})) {
          if (name.startsWith('@evk-soft/')) deps.add(name);
        }
      }
      found.set(manifest.name, { dir: `${dir}/${entry.name}`, deps });
    }
  }
  return found;
}

function findCycle(graph) {
  const state = new Map();
  const stack = [];
  function visit(name) {
    if (state.get(name) === 'done') return null;
    if (state.get(name) === 'open') return [...stack.slice(stack.indexOf(name)), name];
    if (!graph.has(name)) return null;
    state.set(name, 'open');
    stack.push(name);
    for (const next of graph.get(name).deps) {
      const cycle = visit(next);
      if (cycle !== null) return cycle;
    }
    stack.pop();
    state.set(name, 'done');
    return null;
  }
  for (const name of [...graph.keys()].sort()) {
    const cycle = visit(name);
    if (cycle !== null) return cycle;
  }
  return null;
}

const graph = readWorkspaces();
const cycle = findCycle(graph);
if (cycle !== null) {
  console.error(`PACKAGE_CYCLE: ${cycle.join(' -> ')}`);
  process.exit(1);
}
console.log(`check-circular ok (${graph.size} workspaces, no cycle)`);
```

- [ ] **Step 2: write `scripts/check-workspace-boundaries.mjs`**

```javascript
#!/usr/bin/env node
// Fails when a relative import escapes its own workspace directory. pnpm's isolated linker already
// blocks phantom package imports; a deep relative path such as ../../other/src/x sidesteps package
// boundaries entirely and nothing else in this repository looks for it.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GLOB_DIRS = ['configs', 'packages'];
const SOURCE_EXT = new Set(['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs']);
const SKIP_DIRS = new Set(['node_modules', 'dist', '.turbo', '.git']);
const IMPORT_RE = /(?:^|[^\w$])(?:import|export)\s[^'"]*?from\s*['"](\.[^'"]*)['"]|import\s*\(\s*['"](\.[^'"]*)['"]\s*\)/gmu;

function listWorkspaceDirs() {
  const dirs = [];
  for (const dir of GLOB_DIRS) {
    const base = join(ROOT, dir);
    if (!existsSync(base)) continue;
    for (const entry of readdirSync(base, { withFileTypes: true })) {
      if (entry.isDirectory() && existsSync(join(base, entry.name, 'package.json'))) {
        dirs.push(join(base, entry.name));
      }
    }
  }
  return dirs;
}

function walk(dir, out) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (SOURCE_EXT.has(entry.name.slice(entry.name.lastIndexOf('.')))) out.push(full);
  }
  return out;
}

const violations = [];
let scanned = 0;
for (const workspace of listWorkspaceDirs()) {
  for (const file of walk(workspace, [])) {
    scanned += 1;
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(IMPORT_RE)) {
      const spec = match[1] ?? match[2];
      if (spec === undefined) continue;
      const target = resolve(dirname(file), spec);
      const rel = relative(workspace, target);
      if (rel.startsWith(`..${sep}`) || rel === '..') {
        violations.push(`${relative(ROOT, file)} -> ${spec}`);
      }
    }
  }
}

if (violations.length > 0) {
  for (const v of violations) console.error(`BOUNDARY_ESCAPE: ${v}`);
  process.exit(1);
}
console.log(`check-workspace-boundaries ok (${scanned} source files, no escape)`);
```

- [ ] **Step 3: write `scripts/check-audit.mjs`**

```javascript
#!/usr/bin/env node
// Bounded wrapper over `pnpm audit`. An unreachable registry or an unparseable response is a
// failure, never a silent pass.
import { spawnSync } from 'node:child_process';

const IGNORED_ADVISORIES = new Set([
  // 'GHSA-xxxx-yyyy-zzzz',  // reason, reviewed YYYY-MM-DD
]);
const FAIL_LEVELS = ['high', 'critical'];

// Run pnpm's JavaScript entry through this Node binary. Spawning the bare name `pnpm` with
// shell: false fails on Windows with ENOENT, because pnpm resolves only to a pnpm.CMD shim there,
// and shell: true would add an argument-quoting surface for no benefit. pnpm sets npm_execpath when
// it invokes a package script, which is the only supported way to run this guard.
const pnpmEntry = process.env.npm_execpath;
if (pnpmEntry === undefined) {
  console.error('AUDIT_UNAVAILABLE: run this through `pnpm run check:audit`, not directly');
  process.exit(1);
}

const result = spawnSync(process.execPath, [pnpmEntry, 'audit', '--json'], {
  encoding: 'utf8',
  shell: false,
  maxBuffer: 64 * 1024 * 1024,
});

if (result.error !== undefined) {
  console.error(`AUDIT_UNAVAILABLE: ${result.error.message}`);
  process.exit(1);
}

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  console.error('AUDIT_UNPARSEABLE: pnpm audit did not emit JSON');
  console.error(result.stderr.slice(0, 2000));
  process.exit(1);
}

const advisories = Object.values(report.advisories ?? {});
const blocking = advisories.filter(
  (a) => FAIL_LEVELS.includes(a.severity) && !IGNORED_ADVISORIES.has(a.github_advisory_id ?? a.url),
);

if (blocking.length > 0) {
  for (const a of blocking) {
    console.error(`ADVISORY: ${a.severity} ${a.github_advisory_id ?? a.url} ${a.module_name}`);
  }
  process.exit(1);
}
console.log(`check-audit ok (${advisories.length} advisories, 0 blocking)`);
```

- [ ] **Step 4: write `scripts/check-licenses.mjs`**

```javascript
#!/usr/bin/env node
// Allowlist over installed dependency licences. Reads package manifests from the pnpm store layout
// directly rather than parsing CLI JSON, so the check does not depend on a pnpm output shape.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STORE = join(ROOT, 'node_modules', '.pnpm');
const ALLOWED = new Set([
  '0BSD', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'BlueOak-1.0.0',
  'CC0-1.0', 'CC-BY-4.0', 'ISC', 'MIT', 'MIT-0',
  // MPL-2.0 is file-level weak copyleft: it obliges disclosure only for modified MPL files, never
  // for a work that merely depends on them, so it is safe for a permissively licensed toolchain.
  // Present today via lightningcss, an optional transitive dependency of vite under Vitest 4.
  'MPL-2.0',
  'Python-2.0', 'Unlicense',
]);
const EXEMPT = new Set([]); // 'package@version' entries, each with a reviewed reason

function licenceOf(manifest) {
  if (typeof manifest.license === 'string') return manifest.license;
  if (typeof manifest.license === 'object' && manifest.license !== null) return manifest.license.type;
  if (Array.isArray(manifest.licenses) && manifest.licenses.length > 0) return manifest.licenses[0].type;
  return undefined;
}

function isAllowed(expression) {
  if (expression === undefined) return false;
  // Accept simple SPDX OR/AND groupings when every named licence is allowed.
  return expression
    .replace(/[()]/gu, ' ')
    .split(/\s+(?:OR|AND)\s+/u)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .every((part) => ALLOWED.has(part));
}

if (!existsSync(STORE)) {
  console.error('LICENSE_STORE_MISSING: run pnpm install first');
  process.exit(1);
}

const violations = [];
let checked = 0;
for (const entry of readdirSync(STORE, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name === 'node_modules') continue;
  const inner = join(STORE, entry.name, 'node_modules');
  if (!existsSync(inner)) continue;
  const scopes = readdirSync(inner, { withFileTypes: true });
  const manifests = [];
  for (const scope of scopes) {
    if (!scope.isDirectory()) continue;
    if (scope.name.startsWith('@')) {
      for (const pkg of readdirSync(join(inner, scope.name), { withFileTypes: true })) {
        if (pkg.isDirectory()) manifests.push(join(inner, scope.name, pkg.name, 'package.json'));
      }
    } else {
      manifests.push(join(inner, scope.name, 'package.json'));
    }
  }
  for (const path of manifests) {
    if (!existsSync(path)) continue;
    const manifest = JSON.parse(readFileSync(path, 'utf8'));
    if (typeof manifest.name !== 'string') continue;
    const id = `${manifest.name}@${manifest.version}`;
    if (EXEMPT.has(id)) continue;
    checked += 1;
    const licence = licenceOf(manifest);
    if (!isAllowed(licence)) violations.push(`${id}: ${licence ?? '<none declared>'}`);
  }
}

if (violations.length > 0) {
  for (const v of [...new Set(violations)].sort()) console.error(`DEPENDENCY_LICENSE_CONFLICT: ${v}`);
  process.exit(1);
}
console.log(`check-licenses ok (${checked} packages, 0 conflicts)`);
```

- [ ] **Step 5: register the scripts without touching `check`**

Root `package.json` `scripts` becomes the following. Task F1.8 adds two further `changelog:*` entries
to this same block; nothing else touches it in this phase.

```json
  "scripts": {
    "check": "pnpm run check:biome && pnpm run check:runtime && pnpm run check:ai-tooling",
    "check:ai-tooling": "pnpm --filter @evk-soft/ai-tooling run check",
    "check:audit": "node ./scripts/check-audit.mjs",
    "check:biome": "biome check .",
    "check:circular": "node ./scripts/check-circular.mjs",
    "check:licenses": "node ./scripts/check-licenses.mjs",
    "check:boundaries": "node ./scripts/check-workspace-boundaries.mjs",
    "check:runtime": "node ./scripts/runtime-check.mjs",
    "check:structure": "pnpm run check:circular && pnpm run check:boundaries",
    "check:supply-chain": "pnpm run check:audit && pnpm run check:licenses",
    "format": "biome format --write .",
    "prepare": "husky"
  }
```

`check` is byte-identical to its value at the F1 base. That is the contract Stage 1 Phase 2-5 depend
on and it must not change.

- [ ] **Step 6: run all four guards green, then prove each fails on a synthetic violation**

The code above is written for reading; Biome owns the exact whitespace. Format the new files first, or
every later `pnpm check` fails on `check:biome` long before the phase gate and the failure gets
misattributed to whichever task ran it.

```powershell
pnpm -s exec biome check --write scripts
if ($LASTEXITCODE -ne 0) { throw 'Biome could not make the new scripts clean' }
pnpm -s exec biome check .
if ($LASTEXITCODE -ne 0) { throw 'the tree is not Biome-clean after writing the guards' }
git status --porcelain=v1 --untracked-files=all -- scripts
pnpm run check:structure
if ($LASTEXITCODE -ne 0) { throw 'structure guards failed on a clean tree' }
pnpm run check:supply-chain
if ($LASTEXITCODE -ne 0) { throw 'supply-chain guards failed on a clean tree' }
```

Expected GREEN: the formatter rewrites line wrapping in some of the new files and then `biome check .`
exits `0`; the status lists only the four new `scripts/*.mjs` paths; and both guard groups exit `0`,
printing the four `ok` lines. `check:licenses` must report `0 conflicts` — `lightningcss` ships under
MPL-2.0 and is an optional transitive dependency of vite under Vitest 4, which is why `MPL-2.0` is in
`ALLOWED`. If it is ever removed from the allowlist, this step fails on a clean tree.

Then prove the boundary guard actually detects an escape:

The probe file goes in `packages/runtime-detect`, never in `packages/ai-tooling`: a Global Constraint
forbids writing anywhere under the approved Phase 1 tree, and a probe that relies on manual cleanup
inside a protected directory is exactly the kind of write that survives a mistake.

```powershell
'import { x } from "../../packages/ai-tooling/src/index.js";' |
  Set-Content -NoNewline packages/runtime-detect/boundary-probe.mjs
node ./scripts/check-workspace-boundaries.mjs
$detected = $LASTEXITCODE
Remove-Item packages/runtime-detect/boundary-probe.mjs
if ($detected -eq 0) { throw 'guard did not detect the escape' }
node ./scripts/check-workspace-boundaries.mjs
if ($LASTEXITCODE -ne 0) { throw 'guard still fails after the probe was removed' }
git status --porcelain=v1 --untracked-files=all | Select-String 'boundary-probe'
```

Expected: the first run reports a `BOUNDARY_ESCAPE` line naming `boundary-probe.mjs` and exits
non-zero; the second exits `0`; and the final status prints nothing. The removal happens before the
`throw` so a failed probe cannot leave an orphan file behind. The path in the message uses native
separators on Windows (`packages\runtime-detect\...`), because it comes from `node:path`; match on
the substring, not on the whole line.

**Known limits of this guard, accepted deliberately.** The regex does not strip comments, so a
commented-out relative import is reported; and it does not match CommonJS `require('../../x')`, so a
`.cjs` escape is missed. Neither is worth a parser here: this repository is ESM throughout, and a
false positive is loud and cheap to resolve while the missed case cannot occur without first adding
CommonJS sources. Revisit if `.cjs` files ever appear.

---

### Task F1.6: Worktree-safe husky hooks

**Files:**
- Create: `.husky/post-checkout`
- Create: `.husky/post-merge`

**Interfaces:**
- Consumes: nothing.
- Produces: automatic dependency resync on the main worktree only. Nothing consumes a symbol.

- [ ] **Step 1: write both hooks**

`.husky/post-checkout`:

```sh
#!/usr/bin/env sh

# Never run inside a linked worktree. `git worktree add` really does fire this hook, and it passes
# $3=1, so testing $3 alone does not filter it. In a linked worktree --git-dir and --git-common-dir
# differ; in the main worktree they are equal. A phase worktree installs with the exact
# `pnpm install --frozen-lockfile --ignore-scripts` its protocol specifies and no hook may pre-empt
# that.
[ "$(git rev-parse --git-dir)" = "$(git rev-parse --git-common-dir)" ] || exit 0
[ "${SKIP_HUSKY_AUTO_SYNC:-0}" = "1" ] && exit 0

# $1 = previous HEAD, $2 = new HEAD, $3 = 1 for a branch checkout.
[ "$3" = "1" ] || exit 0
case "$1" in 0000000000000000000000000000000000000000) exit 0 ;; esac

CHANGED_FILES="$(git diff --name-only "$1" "$2" 2>/dev/null || true)"
[ -n "$CHANGED_FILES" ] || exit 0

if printf '%s\n' "$CHANGED_FILES" | grep -Eq '(^pnpm-lock\.yaml$|^pnpm-workspace\.yaml$|^\.npmrc$|(^|/)package\.json$)'; then
  echo "Branch switched - dependency metadata changed; running pnpm install..."
  pnpm install --frozen-lockfile || exit 1
fi
```

`.husky/post-merge`:

```sh
#!/usr/bin/env sh

# See .husky/post-checkout for why the worktree guard is structural rather than based on arguments.
[ "$(git rev-parse --git-dir)" = "$(git rev-parse --git-common-dir)" ] || exit 0
[ "${SKIP_HUSKY_AUTO_SYNC:-0}" = "1" ] && exit 0

CHANGED_FILES="$(git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD 2>/dev/null || true)"
[ -n "$CHANGED_FILES" ] || exit 0

if printf '%s\n' "$CHANGED_FILES" | grep -Eq '(^pnpm-lock\.yaml$|^pnpm-workspace\.yaml$|^\.npmrc$|(^|/)package\.json$)'; then
  echo "Merge completed - dependency metadata changed; running pnpm install..."
  pnpm install --frozen-lockfile || exit 1
fi
```

- [ ] **Step 2: verify both are mode 100644 and LF-only**

```powershell
git add --intent-to-add -- .husky/post-checkout .husky/post-merge
git ls-files -s -- .husky/post-checkout .husky/post-merge
```

Expected: both lines begin `100644`. If either shows `100755`, run
`git update-index --chmod=-x -- <path>`. The manifest grammar admits only `100644`.

- [ ] **Step 3: prove the worktree guard in an isolated probe**

```bash
S="$(mktemp -d)"; cd "$S"; git init -q -b main .
git config user.email p@p; git config user.name p
echo x > a.txt; git add a.txt; git commit -qm init
cp <worktree>/.husky/post-checkout .git/hooks/post-checkout
printf 'echo FIRED >> "%s/log"\n' "$S" >> .git/hooks/post-checkout
chmod +x .git/hooks/post-checkout
git worktree add -q -b probe "$S/wt" HEAD
test -f "$S/log" && echo "GUARD FAILED: hook body ran in a linked worktree" || echo "guard ok"
```

Expected: `guard ok`. The appended echo runs only if the guard did not exit first.

---

### Task F1.7: Turbo, additive only

**Files:**
- Create: `turbo.json`
- Modify: `pnpm-workspace.yaml` (catalog entry)
- Modify: `package.json` (devDependency)
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: the catalog from Task F1.3.
- Produces: a `turbo` task graph. No Stage 1 command is rerouted through it.

- [ ] **Step 1: add turbo to the catalog and the root devDependencies**

Add `turbo: ^2.10.8` to the `catalog:` block, and `"turbo": "catalog:"` to root `devDependencies`.
turbo 2.10.8 was published 5 days before this plan; `minimumReleaseAge: 4320` (3 days) admits it.

- [ ] **Step 2: create `turbo.json`**

```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "globalDependencies": ["biome.json"],
  "globalEnv": ["CI", "NODE_ENV"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "tsconfig.json", "package.json"],
      "outputs": ["dist/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "tests/**", "scripts/**", "tsconfig.json", "package.json"]
    },
    "test": {
      "dependsOn": ["build", "^build"],
      "inputs": ["src/**", "tests/**", "vitest.config.*", "tsconfig.json", "package.json"],
      "outputs": []
    }
  }
}
```

There is no root `tsconfig.json` at the F1 base, so it is absent from `globalDependencies`, and no
workspace defines a `lint` script, so no `lint` task is declared. Turbo tolerates both, but dead
configuration in a file nobody runs yet is how a task graph stops describing reality. Add either the
moment something needs it.

- [ ] **Step 3: install and prove the graph resolves without running anything**

```powershell
pnpm install --ignore-scripts
if ($LASTEXITCODE -ne 0) { throw 'turbo install failed' }
pnpm -s exec turbo run typecheck --dry=json | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'turbo could not resolve the task graph' }
Test-Path .turbo
git status --porcelain=v1 --untracked-files=all | Select-String '\.turbo'
```

Expected GREEN: the dry run exits `0`; if `.turbo` was created it does **not** appear in the status
output, because Task F1.1 ignores it.

- [ ] **Step 4: prove Stage 1 is untouched**

```powershell
pnpm check
if ($LASTEXITCODE -ne 0) { throw 'Stage 1 gate broke after turbo' }
```

Expected GREEN: exit `0`.

---

### Task F1.8: Changelog scaffolding, created dormant

**Files:**
- Create: `CHANGELOG.md`
- Create: `changelog.d/README.md`
- Create: `changelog.d/_template.md`
- Create: `scripts/changelog-new.mjs`
- Create: `scripts/changelog-assemble.mjs`
- Modify: `package.json` (`scripts` block)

**Interfaces:**
- Consumes: nothing.
- Produces: `node scripts/changelog-new.mjs <slug>` writing `changelog.d/<slug>.md`, and
  `node scripts/changelog-assemble.mjs --check` validating every fragment.

- [ ] **Step 1: create `CHANGELOG.md`**

```markdown
# Changelog

All notable changes to this repository are recorded here. Entries are assembled from fragments in
`changelog.d/`; see `changelog.d/README.md`.

## Unreleased
```

- [ ] **Step 2: create `changelog.d/_template.md`**

```markdown
---
type: Added
# scope: ai-tooling   # optional, omit if none
# ticket: EVK-000     # optional, omit if none
breaking: false
---
## changelog
<!-- Required. Technical description for CHANGELOG.md (English, developer audience). -->

## notes
<!-- Optional. Human-readable description for release notes. Remove if developer-internal only. -->

## qa
<!-- Optional. What to re-test or watch. Remove this section entirely if no QA action is needed. -->
```

- [ ] **Step 3: create `changelog.d/README.md`**

```markdown
# Changelog fragments

One file per user-visible change. `node scripts/changelog-new.mjs <slug>` copies `_template.md` to
`<slug>.md`; `node scripts/changelog-assemble.mjs --check` validates every fragment.

`type` is one of `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.

**No Stage 1 phase may add a fragment here.** The Stage 1 phase manifests are closed path lists that
do not include `changelog.d/*` or `CHANGELOG.md`, and the phase-delta verifier rejects every path a
manifest does not name. Adding a fragment during Stage 1 Phase 2-5 would fail that phase's gate. This
directory is dormant until Stage 1 Phase 5 is complete.
```

- [ ] **Step 4: create `scripts/changelog-new.mjs`**

```javascript
#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'changelog.d');
const slug = process.argv[2];

if (slug === undefined || !/^[a-z0-9][a-z0-9-]*$/u.test(slug)) {
  console.error('usage: node scripts/changelog-new.mjs <slug>   (lowercase, digits and hyphens)');
  process.exit(1);
}
const target = join(DIR, `${slug}.md`);
if (existsSync(target)) {
  console.error(`fragment already exists: changelog.d/${slug}.md`);
  process.exit(1);
}
writeFileSync(target, readFileSync(join(DIR, '_template.md'), 'utf8'), 'utf8');
console.log(`created changelog.d/${slug}.md`);
```

- [ ] **Step 5: create `scripts/changelog-assemble.mjs`**

```javascript
#!/usr/bin/env node
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'changelog.d');
const TYPES = new Set(['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security']);
const checkOnly = process.argv.includes('--check');

function parse(name) {
  const text = readFileSync(join(DIR, name), 'utf8');
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/u.exec(text);
  if (match === null) throw new Error(`${name}: missing front matter`);
  const meta = {};
  for (const line of match[1].split(/\r?\n/u)) {
    if (line.trim().startsWith('#') || line.trim() === '') continue;
    const kv = /^([a-zA-Z]+):\s*(.*)$/u.exec(line);
    if (kv === null) throw new Error(`${name}: unparseable front-matter line "${line}"`);
    meta[kv[1]] = kv[2].trim();
  }
  if (!TYPES.has(meta.type)) throw new Error(`${name}: type must be one of ${[...TYPES].join(', ')}`);
  const body = /## changelog\r?\n([\s\S]*?)(?=\r?\n## |\s*$)/u.exec(match[2]);
  const entry = (body?.[1] ?? '').split(/\r?\n/u).filter((l) => !l.trim().startsWith('<!--')).join('\n').trim();
  if (entry === '') throw new Error(`${name}: the "## changelog" section is empty`);
  return { name, type: meta.type, scope: meta.scope, entry };
}

const names = readdirSync(DIR).filter((n) => n.endsWith('.md') && n !== 'README.md' && n !== '_template.md');
const errors = [];
const parsed = [];
for (const name of names.sort()) {
  try { parsed.push(parse(name)); } catch (error) { errors.push(error.message); }
}
if (errors.length > 0) {
  for (const message of errors) console.error(`FRAGMENT_INVALID: ${message}`);
  process.exit(1);
}
if (checkOnly) {
  console.log(`changelog-assemble ok (${parsed.length} fragments valid)`);
  process.exit(0);
}
const sections = new Map();
for (const item of parsed) {
  if (!sections.has(item.type)) sections.set(item.type, []);
  sections.get(item.type).push(item.scope === undefined ? item.entry : `**${item.scope}:** ${item.entry}`);
}
const lines = [];
for (const type of [...TYPES].filter((t) => sections.has(t))) {
  lines.push(`### ${type}`, '');
  for (const entry of sections.get(type).sort()) lines.push(`- ${entry}`);
  lines.push('');
}
process.stdout.write(`${lines.join('\n')}\n`);
```

- [ ] **Step 6: register the scripts and prove the round trip, leaving no fragment behind**

Add to root `package.json` `scripts`, keeping the block alphabetically ordered:
`"changelog:new": "node ./scripts/changelog-new.mjs"` and
`"changelog:check": "node ./scripts/changelog-assemble.mjs --check"`.

```powershell
pnpm -s exec biome check --write scripts
if ($LASTEXITCODE -ne 0) { throw 'Biome could not make the changelog scripts clean' }
pnpm -s exec biome check .
if ($LASTEXITCODE -ne 0) { throw 'the tree is not Biome-clean after writing the changelog scripts' }
node ./scripts/changelog-new.mjs probe-entry
if ($LASTEXITCODE -ne 0) { throw 'changelog-new failed' }
node ./scripts/changelog-assemble.mjs --check
if ($LASTEXITCODE -eq 0) { throw 'an unedited template must be rejected as an empty changelog section' }
Remove-Item changelog.d/probe-entry.md
node ./scripts/changelog-assemble.mjs --check
if ($LASTEXITCODE -ne 0) { throw 'check must pass with no fragments present' }
git status --porcelain=v1 --untracked-files=all | Select-String 'probe-entry'
```

Expected: creation succeeds; the unedited template is rejected with `FRAGMENT_INVALID: probe-entry.md:
the "## changelog" section is empty`; after removal the check prints
`changelog-assemble ok (0 fragments valid)`; and the final status shows no `probe-entry` path.

---

### Task F1.9: Agent configuration

**Files:**
- Create: `.claude/settings.json`
- Create: `.claude/skills/handoff/SKILL.md`

**Interfaces:**
- Consumes: the `.claude/` ignore rules from Task F1.1.
- Produces: shared agent configuration. Nothing consumes a symbol.

- [ ] **Step 1: create `.claude/settings.json`**

Every allow entry is an exact, argument-complete, repository-local command. No bare tool name, no
wildcard, nothing that writes outside the repository or reaches the network. This file is committed,
so an entry grants that command without a prompt to every developer on every checkout.

```json
{
  "permissions": {
    "allow": [
      "Bash(pnpm check)",
      "Bash(pnpm run check:biome)",
      "Bash(pnpm run check:runtime)",
      "Bash(pnpm run check:structure)",
      "Bash(pnpm run check:supply-chain)",
      "Bash(pnpm run changelog:check)",
      "Bash(pnpm --filter @evk-soft/ai-tooling run typecheck)",
      "Bash(pnpm --filter @evk-soft/ai-tooling run test:unit)",
      "Bash(pnpm --filter @evk-soft/ai-tooling run test:integration)",
      "Bash(pnpm --filter @evk-soft/ai-tooling run build)",
      "Bash(git status)",
      "Bash(git diff)",
      "Bash(git diff --check)",
      "Bash(git log)"
    ]
  },
  "enabledPlugins": {
    "superpowers@claude-plugins-official": true,
    "context7@claude-plugins-official": true,
    "typescript-lsp@claude-plugins-official": true,
    "security-guidance@claude-plugins-official": true,
    "code-simplifier@claude-plugins-official": true
  }
}
```

`pack:check` is deliberately absent: it spawns a package manager, writes a private staging root, and
runs for up to 300 seconds. It stays behind a prompt.

- [ ] **Step 2: port the handoff skill**

Copy `D:\disk.w\Projects\Slotegrator\Projects\non-restrict-proxy\.claude\skills\handoff\SKILL.md` to
`.claude/skills/handoff/SKILL.md`. Read the copy end to end and replace every reference to the
reference project — its package scope, its issue-tracker prefixes, its branch names, its CI provider —
with the devkit equivalent, or delete the reference where devkit has no equivalent. A skill that tells
a devkit worker to consult a GitLab pipeline is worse than no skill.

- [ ] **Step 3: prove the file is valid and the ignore rules admit exactly the intended paths**

```powershell
node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json','utf8'))"
if ($LASTEXITCODE -ne 0) { throw '.claude/settings.json is not valid JSON' }
if (Select-String -Path .claude/settings.json -Pattern '\*' -Quiet) {
  throw 'the allowlist must contain no wildcard'
}
git status --porcelain=v1 --untracked-files=all -- .claude
```

Expected GREEN: the JSON parses, no wildcard is present, and the status lists exactly
`.claude/settings.json` and `.claude/skills/handoff/SKILL.md`.

- [ ] **Step 4: assert disjointness from product-generated paths**

```powershell
Select-String -Path docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-*.txt -Pattern '\.claude/'
```

Expected: the only Stage 1 `.claude/` paths are `.claude/rules/evk-grounding.md` and
`.claude/skills/evk-plan/SKILL.md`, both from the Phase 5 manifest. Neither collides with
`settings.json` or the `handoff` skill. If a collision appears, stop and amend this plan.

---

### Task F1.10: CI

**Files:**
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: the `packageManager` pin from Task F1.2 and the guard scripts from Task F1.5.
- Produces: Linux and Windows jobs. Nothing consumes a symbol.

- [ ] **Step 1: resolve the exact action SHAs**

```powershell
foreach ($a in @('actions/checkout@v4','actions/setup-node@v4','actions/cache@v4','oven-sh/setup-bun@v2')) {
  $repo,$tag = $a -split '@'
  gh api "repos/$repo/git/ref/tags/$tag" --jq '.object.sha' | ForEach-Object { "$a -> $_" }
}
```

Record the four SHAs. A mutable tag on a third-party action running with a write-capable token is a
larger exposure than anything else this design touches.

- [ ] **Step 2: rewrite the workflow**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

jobs:
  node:
    name: Node 24 (pnpm) — ${{ matrix.os }}
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest]
    steps:
      - uses: actions/checkout@<sha-from-step-1>  # v4
      - uses: actions/setup-node@<sha-from-step-1>  # v4
        with:
          node-version: 24
      - name: Enable Corepack
        run: corepack enable
      - name: Use pnpm
        run: corepack prepare pnpm@11.20.0 --activate
      - name: Get pnpm store path
        shell: bash
        run: echo "PNPM_STORE_PATH=$(pnpm store path --silent)" >> "$GITHUB_ENV"
      - name: Cache pnpm store
        uses: actions/cache@<sha-from-step-1>  # v4
        with:
          path: ${{ env.PNPM_STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-
      - name: Install
        env:
          HUSKY: 0
        run: pnpm install --frozen-lockfile
      - name: Check
        run: pnpm check
      - name: Structure guards
        run: pnpm run check:structure
      - name: Supply-chain guards
        run: pnpm run check:supply-chain

  bun:
    name: Bun 1.3 (runtime smoke)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<sha-from-step-1>  # v4
      - uses: oven-sh/setup-bun@<sha-from-step-1>  # v2
        with:
          bun-version: "1.3.0"
      - name: Runtime check (bun)
        run: bun ./scripts/runtime-check.mjs
```

No step invoking the `packages/ai-tooling` gate commands is added: on this base `pnpm check` already
chains `check:ai-tooling`, which expands to `typecheck && test && pack:check`. The Bun job is left
exactly as it was — not removed, not extended, not given new steps. Node.js is the default runtime;
Bun receives no new investment.

- [ ] **Step 3: verify the workflow parses and pins nothing mutable**

```powershell
node -e "const y=require('fs').readFileSync('.github/workflows/ci.yml','utf8'); if(/uses:\s*\S+@v\d+\s*$/m.test(y)) { console.error('mutable action tag remains'); process.exit(1); } console.log('no mutable tag');"
gh workflow view ci.yml --repo evk-soft/devkit 2>$null
```

Expected: `no mutable tag`. The `gh` call is informational and may fail offline; it does not gate.

**Known limitation:** `pack:check` runs inside `pnpm check` on the CI runners and resolves pnpm from
the corepack cache with the network disabled. The `corepack prepare pnpm@11.20.0 --activate` step
populates exactly the layout `check-package-contents.mjs` expects
(`<corepack root>/v1/pnpm/<version>/bin/pnpm.cjs`, verified locally). If the first CI run after F1
fails there, the fix is a CI change in a follow-up, not an amendment of the Phase 1 script.

---

### Task F1.11: pnpm pin amendments in the plan documents

**Files:**
- Modify: `docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-1-implementation.md`
- Modify: `docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-2-implementation.md`
- Modify: `docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-3-implementation.md`
- Modify: `docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-4-implementation.md`
- Modify: `docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-5-implementation.md`
- Modify: `docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-safe-core-implementation-plan.md`

**Interfaces:**
- Consumes: the pnpm version from Task F1.2.
- Produces: plan documents that agree with the tree. Stage 1 Phase 2-5 executors read these literally.

These are not prose. `phase-3-implementation.md` contains `corepack install --global pnpm@10.28.0`
and `phase-1-implementation.md` throws unless the running pnpm is exactly `10.28.0`. Leaving them
would downgrade the toolchain mid-Stage-1 or hard-fail a phase entry snapshot.

- [ ] **Step 1: record the exact before-counts**

```powershell
$files = Get-ChildItem docs/superpowers/plans/2026-08-02-*.md
foreach ($f in $files) {
  $n = (Select-String -Path $f -Pattern '10\.28\.0' -AllMatches | ForEach-Object { $_.Matches.Count } | Measure-Object -Sum).Sum
  "{0,3}  {1}" -f $n, $f.Name
}
```

Expected: `4` for phase 1, `1` for phase 2, `2` for phase 3, `2` for phase 4, `2` for phase 5, `4` for
the master plan — 15 occurrences across the 6 files. Any other total means the base is not `ec88ca3`
plus the rebased docs commits; stop and re-check.

- [ ] **Step 2: replace every occurrence in exactly those six files**

```powershell
foreach ($f in Get-ChildItem docs/superpowers/plans/2026-08-02-*.md) {
  $text = [System.IO.File]::ReadAllText($f.FullName)
  [System.IO.File]::WriteAllText($f.FullName, $text.Replace('10.28.0', '11.20.0'))
}
```

A literal replacement is correct for all 15 sites: they are Tech Stack declarations, the
`corepack install --global pnpm@10.28.0` command, and the `-cne '10.28.0'` entry assertion. Every one
of them means "the pnpm this plan runs on".

- [ ] **Step 3: verify the after-counts and that nothing else moved**

```powershell
$stale = Select-String -Path docs/superpowers/plans/2026-08-02-*.md -Pattern '10\.28\.0'
if ($stale) { $stale; throw 'stale pnpm pin remains' }
$new = (Select-String -Path docs/superpowers/plans/2026-08-02-*.md -Pattern '11\.20\.0' -AllMatches |
  ForEach-Object { $_.Matches.Count } | Measure-Object -Sum).Sum
if ($new -ne 15) { throw "expected 15 replacements, found $new" }
git status --porcelain=v1 --untracked-files=all -- docs
```

Expected GREEN: no stale pin, exactly 15 new occurrences, and the status lists exactly the six plan
documents. `PROGRESS.md`, `docs/ai-tooling/research/devkit-baseline.md`, and the foundation design
must **not** appear — they are historical records and are not in the manifest.

- [ ] **Step 4: amend the `biome.json` body embedded in the Phase 3 document**

`docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-3-implementation.md` contains a literal
`biome.json` body that Stage 1 Phase 3 will write, and that body still carries
`"$schema": "https://biomejs.dev/schemas/2.5.6/schema.json"`. Left alone, Phase 3 would overwrite
Task F1.4's change and reintroduce a versioned URL — and F2's blanket version replacement would
quietly retarget it to 2.5.7 instead of removing it.

```powershell
$f = 'docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-3-implementation.md'
$text = [System.IO.File]::ReadAllText($f)
$before = ([regex]::Matches($text, 'biomejs\.dev/schemas/[0-9]')).Count
$text = $text.Replace(
  '"$schema": "https://biomejs.dev/schemas/2.5.6/schema.json"',
  '"$schema": "./node_modules/@biomejs/biome/configuration_schema.json"')
[System.IO.File]::WriteAllText($f, $text)
$after = ([regex]::Matches([System.IO.File]::ReadAllText($f), 'biomejs\.dev/schemas/[0-9]')).Count
"versioned schema URLs in the phase 3 document: $before -> $after"
if ($after -ne 0) { throw 'a versioned Biome schema URL survives in the phase 3 document' }
```

Expected GREEN: the count drops to `0`.

**Two out-of-manifest pins are accepted, named exceptions.** `packages/ai-tooling/README.md` records
the toolchain it was written against and lives in the frozen Phase 1 tree, which no foundation phase
may touch. `configs/biome-config/package.json` declares `engines.pnpm >= 10.28.0`, a published floor
that pnpm 11.20.0 satisfies and that must not be narrowed for consumers. Any repository-wide
stale-pin search must exclude both, or it will report them forever.

---

### Task F1.12: F1 gate, exact staging, sole commit, owner stop

**Files:** none created or modified. This task only verifies, stages, and commits.

- [ ] **Step 1: run the complete local gate**

```powershell
pnpm install --frozen-lockfile --ignore-scripts
pnpm check
if ($LASTEXITCODE -ne 0) { throw 'pnpm check failed' }
pnpm run check:structure
if ($LASTEXITCODE -ne 0) { throw 'structure guards failed' }
pnpm run check:supply-chain
if ($LASTEXITCODE -ne 0) { throw 'supply-chain guards failed' }
pnpm run changelog:check
if ($LASTEXITCODE -ne 0) { throw 'changelog check failed' }
node packages/ai-tooling/scripts/check-stage1-artifacts.mjs --phase 1 --tree
if ($LASTEXITCODE -ne 0) { throw 'artifact scan failed' }
git diff --check
if ($LASTEXITCODE -ne 0) { throw 'whitespace errors' }
```

Expected GREEN: every command exits `0`.

- [ ] **Step 2: prove the Phase 1 product tree is byte-identical to the approved commit**

```powershell
git diff --stat $approvedBaseSha -- packages/ai-tooling configs/ai
```

Expected GREEN: **empty output**. A single changed byte under either path is a stop: neither is in the
F1 manifest, and the whole design rests on the approved Phase 1 tree being untouched.

- [ ] **Step 3: run the hook formatter, then check the scope it touched**

```powershell
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) { throw 'index must be empty before the formatter run' }
pnpm -s exec biome check --write .
git status --porcelain=v1 --untracked-files=all --ignore-submodules=all
git diff --stat $approvedBaseSha -- packages/ai-tooling configs/ai
```

Never run the hook's `git add -A`. Expected GREEN: the status lists only paths the F1 manifest names,
and the product-tree diff is still empty. If Biome wrote to any other path, stop without staging and
repair the phase scope.

F1 widens the lint input set: the six new `.mjs` files under `scripts/`, `turbo.json`, and the JSON
under `.claude/` all enter `biome check .`. The script *definition* of `check` is unchanged, which is
what Stage 1 depends on, but the *inputs* grow. If a new file cannot be made clean under the pinned
Biome, exclude it through `biome.json#files.includes` — the mechanism the repository already uses for
the Phase 1 fixture carve-out, and `biome.json` is already in this manifest — rather than weakening a
rule. Do not exclude a path merely to avoid reading a diagnostic.

- [ ] **Step 4: stage exactly the manifest paths**

Issue one explicit `git add --` per path, in manifest order:

```powershell
$manifest = 'docs/superpowers/plans/manifests/repository-foundation-f1.txt'
foreach ($line in Get-Content $manifest) {
  if ($line -notmatch '^(A|M) 100644 ([A-Za-z0-9._/-]+)$') { throw "bad manifest line: $line" }
  git add -- $Matches[2]
  if ($LASTEXITCODE -ne 0) { throw "git add failed for $($Matches[2])" }
}
git diff --cached --name-only
```

Expected GREEN: the staged list is exactly the 40 manifest paths, in the same order, and nothing else.

- [ ] **Step 5: compare the staged delta against the manifest, fail closed**

```powershell
$expected = Get-Content $manifest | ForEach-Object {
  $null = $_ -match '^(A|M) 100644 (.+)$'; "$($Matches[1])`t$($Matches[2])"
}
# git already returns string[]; never pipe it through -split "`n", which would first join the
# array with spaces and then re-split, producing one useless line.
$actual = @(git diff --cached --name-status --no-renames) |
  Where-Object { $_ -ne '' } | ForEach-Object { $_.TrimEnd() }
$missing = $expected | Where-Object { $actual -notcontains $_ }
$extra = $actual | Where-Object { $expected -notcontains $_ }
if ($missing) { "MISSING:"; $missing }
if ($extra) { "EXTRA:"; $extra }
if ($missing -or $extra) { throw 'staged delta does not equal the manifest' }
git diff --cached --check
if ($LASTEXITCODE -ne 0) { throw 'staged whitespace errors' }
git ls-files -s -- $(Get-Content $manifest | ForEach-Object { ($_ -split ' ')[2] }) |
  Where-Object { $_ -notmatch '^100644 ' }
```

Expected GREEN: no `MISSING`, no `EXTRA`, `--check` exits `0`, and the mode filter prints nothing —
every staged path is `100644`.

- [ ] **Step 6: create the single commit**

```powershell
# Assert against the value bound in the Phase Entry Snapshot; do NOT re-bind it here. Re-binding
# immediately before the commit would make the parent check in Step 7 compare the new commit's
# parent against a value derived from that same parent, which can never fail.
if ((git rev-parse HEAD).Trim() -cne $approvedBaseSha) { throw 'HEAD drifted from the bound approved base' }
if ($approvedBaseSha -cnotmatch '^[0-9a-f]{40}$') { throw 'approved base is not one full lowercase SHA-1' }
git commit --no-verify -m "chore(repo): establish the repository foundation on pnpm 11"
$candidateSha = (git rev-parse HEAD).Trim()
if ($candidateSha -cnotmatch '^[0-9a-f]{40}$') { throw 'candidate is not one full lowercase SHA-1' }
```

- [ ] **Step 7: verify the committed delta and the parent rule**

```powershell
# The @( ) must wrap the WHOLE pipeline. `@(git ...) | Where-Object` returns a bare String when
# exactly one line matches — which is the required single-parent case — and then $parents[0] indexes
# the first character 'p', so the comparison below would always throw on a correct commit.
$parents = @(@(git cat-file commit $candidateSha) | Where-Object { $_ -like 'parent *' })
if ($parents.Count -ne 1) { throw "candidate has $($parents.Count) parents, expected exactly 1" }
if ($parents[0] -cne "parent $approvedBaseSha") { throw 'candidate parent is not the approved base' }
$names = @(@(git diff --name-only --no-renames $approvedBaseSha $candidateSha) |
  Where-Object { $_ -ne '' })
if ($names.Count -ne 40) { throw "committed delta has $($names.Count) paths, expected 40" }
git diff --stat $approvedBaseSha $candidateSha -- packages/ai-tooling configs/ai
git status --short --branch
```

Expected GREEN: exactly one parent equal to the approved base; exactly 40 changed paths; an empty
product-tree diff; and a clean worktree.

- [ ] **Step 8: re-run the full gate against the committed tree, then stop**

```powershell
pnpm install --frozen-lockfile --ignore-scripts
pnpm check
pnpm run check:structure
pnpm run check:supply-chain
node packages/ai-tooling/scripts/check-stage1-artifacts.mjs --phase 1 --tree
```

Expected GREEN: every command exits `0` against the committed tree.

**Stop.** Report `$candidateSha`, the 40-path delta, and the evidence above to the owner. Do not start
F2 until the owner approves that exact commit.

---

## Phase F2 — TypeScript 7 and Biome 2.5.7

### F2 Phase Entry Snapshot

- [ ] **Step 1: create the F2 worktree from the approved F1 commit**

As in F1, run every command of this phase in **one** PowerShell session and retain
`$approvedBaseSha` through Task F2.4.

```powershell
$base = '<the owner-approved F1 SHA>'
git -C D:/disk.w/Projects/evk-soft/devkit worktree add `
  D:/disk.w/Projects/evk-soft/devkit-worktrees/repository-foundation-f2 `
  -b repository-foundation/f2 $base
Set-Location D:/disk.w/Projects/evk-soft/devkit-worktrees/repository-foundation-f2
$approvedBaseSha = (git rev-parse HEAD).Trim()
if ($approvedBaseSha -cne $base) { throw 'worktree HEAD does not equal the approved base' }
pnpm install --frozen-lockfile --ignore-scripts
pnpm check
if ($LASTEXITCODE -ne 0) { throw 'Stage 1 gate does not pass at the F2 base' }
```

- [ ] **Step 2: re-check the supply-chain delay against the actual targets**

```powershell
$now = Get-Date
foreach ($p in @('typescript@7.0.2','@biomejs/biome@2.5.7')) {
  $name,$ver = $p -split '@(?=[0-9])'
  $t = npm view $p time --json | ConvertFrom-Json
  $age = [int]($now - [datetime]($t.$ver)).TotalMinutes
  "{0,-24} age {1} minutes (minimumReleaseAge is 4320)" -f $p, $age
  if ($age -lt 4320) { throw "$p is younger than minimumReleaseAge; wait, or add a reviewed minimumReleaseAgeExclude entry in this phase's commit with the reason recorded" }
}
```

Expected GREEN: both targets are older than the configured delay. If not, this is a genuine stop, not
a nuisance — the delay exists to prevent exactly this adoption pattern.

---

### Task F2.1: TypeScript 7

**Files:**
- Modify: `pnpm-workspace.yaml` (catalog entry)
- Modify: `configs/typescript-config/package.json` (peer range)
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: the catalog from F1 Task 3.
- Produces: a TypeScript 7 toolchain, or a documented decision to stay on 6.

- [ ] **Step 1: raise the catalog entry**

In `pnpm-workspace.yaml`, `typescript: ^6.0.3` becomes `typescript: ^7.0.2`.

- [ ] **Step 2: widen the published peer range by hand**

`configs/typescript-config/package.json` line 15 becomes:

```json
    "typescript": "^6.0.0 || ^7.0.0"
```

The catalog cannot do this: `catalog:` substitution applies to `dependencies`, `devDependencies`, and
`optionalDependencies`, not to a peer range. `@evk-soft/typescript-config` is published with
`private: false`, so this is a deliberate public-contract widening. Without it, `pnpm install` reports
an unmet peer once the root moves to TypeScript 7. The existing `^5.9.3` floor is dropped because a
TypeScript 5 consumer cannot use presets compiled against 7.

- [ ] **Step 3: install and run the Stage 1 gate — the real test of this phase**

```powershell
pnpm install --ignore-scripts
if ($LASTEXITCODE -ne 0) { throw 'TypeScript 7 install failed' }
$tsc = (pnpm -s exec tsc --version).Trim()
if ($tsc -cnotmatch '^Version 7\.') { throw "tsc is '$tsc', not 7.x" }
pnpm check
```

Expected GREEN: `pnpm check` exits `0`.

**If it fails**, read the diagnostics before changing anything. Phase 1 code relies on
`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, and `verbatimModuleSyntax`, and the
reference project holds TypeScript at 6.x on the record, naming the TS7 Go compiler as its reason.
Fixing the diagnostics would mean editing `packages/ai-tooling/src/**`, which is not in the F2
manifest and is a Global Constraint violation. **Stop and report to the owner.** Staying on
TypeScript 6 is a legitimate outcome of this gate, not a failure of it: revert Steps 1-2, record the
exact diagnostics, and let the owner decide.

---

### Task F2.2: Biome 2.5.7

**Files:**
- Modify: `pnpm-workspace.yaml` (catalog entry)
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: raise the catalog entry**

In `pnpm-workspace.yaml`, `'@biomejs/biome': ^2.5.6` becomes `'@biomejs/biome': ^2.5.7`.

This is the only Biome edit in F2. F1 replaced all 12 `$schema` URLs with the relative path into the
installed package, and the published peer range of `@evk-soft/biome-config` is `^2.3.11`, which
already admits 2.5.7.

- [ ] **Step 2: install and prove the formatter did not rewrite the product tree**

```powershell
pnpm install --ignore-scripts
$b = (pnpm -s exec biome --version).Trim()
if ($b -cne 'Version: 2.5.7') { throw "Biome is '$b', not 2.5.7" }
# Read-only first. Never let a new formatter version write into the approved Phase 1 tree before
# knowing whether it wants to: --write would perform exactly the change this step must stop on.
pnpm -s exec biome check packages/ai-tooling configs/ai
if ($LASTEXITCODE -ne 0) {
  throw 'Biome 2.5.7 reports diagnostics inside the approved Phase 1 tree; stop and report'
}
pnpm -s exec biome check --write .
git diff --stat -- packages/ai-tooling configs/ai
```

Expected GREEN: Biome reports 2.5.7, the scoped read-only check exits `0`, and the product-tree diff
is **empty**. A single rewritten byte under `packages/ai-tooling` or `configs/ai` is a stop: those
paths are not in the F2 manifest, and a formatter-driven change to the approved Phase 1 tree must be
an owner decision. If it happens anyway, recover with
`git checkout -- packages/ai-tooling configs/ai` before reporting.

- [ ] **Step 3: verify no version reference outside the catalog**

```powershell
$hits = Select-String -Path biome.json, configs/biome-config/biome.preset.json, `
  configs/biome-config/presets/*.json -Pattern 'biomejs\.dev/schemas/[0-9]'
if ($hits) { $hits; throw 'a versioned Biome schema URL reappeared' }
```

Expected GREEN: no match.

---

### Task F2.3: Remaining plan-document amendments

**Files:**
- Modify: `docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-1-implementation.md`
- Modify: `docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-2-implementation.md`
- Modify: `docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-3-implementation.md`
- Modify: `docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-4-implementation.md`
- Modify: `docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-phase-5-implementation.md`
- Modify: `docs/superpowers/plans/2026-08-02-ai-tooling-stage-1-safe-core-implementation-plan.md`

Root `package.json` is deliberately **not** in this list and not in the F2 manifest. After F1 its
`devDependencies` read `"typescript": "catalog:"` and `"@biomejs/biome": "catalog:"`, so the F2
version bump happens entirely in `pnpm-workspace.yaml`; `packageManager` was already settled in F1.
A manifest is a closed list that must match the delta exactly, so listing a file that does not change
would fail the gate with a missing path just as surely as an unlisted change would.

- [ ] **Step 1: record before-counts**

```powershell
foreach ($pat in @('6\.0\.3','2\.5\.6')) {
  $n = (Select-String -Path docs/superpowers/plans/2026-08-02-*.md -Pattern $pat -AllMatches |
    ForEach-Object { $_.Matches.Count } | Measure-Object -Sum).Sum
  "$pat -> $n occurrences"
}
```

- [ ] **Step 2: replace both versions in exactly those six files**

```powershell
foreach ($f in Get-ChildItem docs/superpowers/plans/2026-08-02-*.md) {
  $text = [System.IO.File]::ReadAllText($f.FullName)
  $text = $text.Replace('6.0.3', '7.0.2').Replace('2.5.6', '2.5.7')
  [System.IO.File]::WriteAllText($f.FullName, $text)
}
```

Both are Tech Stack declarations and entry assertions of the form `-cne 'Version 6.0.3'` and
`-cne 'Version: 2.5.6'`. A literal replacement is correct for every site.

- [ ] **Step 3: verify no stale pin remains**

```powershell
$stale = Select-String -Path docs/superpowers/plans/2026-08-02-*.md -Pattern '6\.0\.3|2\.5\.6|10\.28\.0'
if ($stale) { $stale; throw 'stale toolchain pin remains in a plan document' }
git status --porcelain=v1 --untracked-files=all -- docs
```

Expected GREEN: no stale pin, and the status lists exactly the six plan documents. `PROGRESS.md`,
`devkit-baseline.md`, and the foundation design must not appear.

---

### Task F2.4: F2 gate, exact staging, sole commit, owner stop

**Files:** none created or modified.

- [ ] **Step 1: run the complete local gate**

Run every command from F1 Task 12 Step 1, unchanged.

- [ ] **Step 2: prove the Phase 1 product tree is byte-identical to the F2 base**

```powershell
git diff --stat $approvedBaseSha -- packages/ai-tooling configs/ai
```

Expected GREEN: empty output.

- [ ] **Step 3: formatter, staging, and manifest comparison**

Repeat F1 Task 12 Steps 3 through 5, substituting
`docs/superpowers/plans/manifests/repository-foundation-f2.txt` and an expected path count of **9**.

- [ ] **Step 4: create the single commit and verify it**

```powershell
if ((git rev-parse HEAD).Trim() -cne $approvedBaseSha) { throw 'HEAD drifted from the bound approved base' }
git commit --no-verify -m "chore(repo): upgrade to TypeScript 7 and Biome 2.5.7"
$candidateSha = (git rev-parse HEAD).Trim()
# @( ) wraps the whole pipeline — see the note in F1 Task 12 Step 7.
$parents = @(@(git cat-file commit $candidateSha) | Where-Object { $_ -like 'parent *' })
if ($parents.Count -ne 1) { throw "candidate has $($parents.Count) parents, expected exactly 1" }
if ($parents[0] -cne "parent $approvedBaseSha") { throw 'candidate parent is not the approved base' }
$names = @(@(git diff --name-only --no-renames $approvedBaseSha $candidateSha) |
  Where-Object { $_ -ne '' })
if ($names.Count -ne 9) { throw "committed delta has $($names.Count) paths, expected 9" }
```

- [ ] **Step 5: re-run the gate against the committed tree, then stop**

```powershell
pnpm install --frozen-lockfile --ignore-scripts
pnpm check
pnpm run check:structure
pnpm run check:supply-chain
node packages/ai-tooling/scripts/check-stage1-artifacts.mjs --phase 1 --tree
```

**Stop.** Report `$candidateSha` and the evidence to the owner. Stage 1 Phase 2 may begin only after
the owner approves that exact commit, and its worktree must be created from it.
