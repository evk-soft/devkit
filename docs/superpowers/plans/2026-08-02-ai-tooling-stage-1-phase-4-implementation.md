# AI Tooling Stage 1 Phase 4 Safe Mutation and Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the approved Stage 1 mutation boundary so clean init, semantic sync, canonical-lock
repair, explicit local-pack refresh, compare-and-swap restore, durable rollback, read-only recovery
inspection, and confirmed repair are safe under crashes, races, hostile local state, and native path
semantics.

**Architecture:** Phase 3 remains the read-only resolution and rendering authority. Phase 4 extends
the single repository-filesystem gateway with identity-bracketed mutation methods; only the
transaction manager receives that capability. Every accepted mutation becomes a deterministic,
digest-bound plan, an exclusive run lock, a complete journal header, a durable all-intents barrier,
atomic per-path changes, lock-last verification, a terminal frame, and evidence cleanup. Recovery
strictly classifies existing bytes and may continue only through branded authorities derived from the
accepted plan and revalidated evidence; a third or ambiguous state is preserved and blocks.

**Tech Stack:** Node.js 24+, TypeScript 7.0.2 ESM, pnpm 11.20.0, Vitest 4.1.10, strict standard
JSON, RFC 8785 JCS, SHA-256, Git 2.36.0+ runtime read-only queries, Git 2.45.0+ phase-verifier object
reads, the existing Phase 3 Unicode 17 portable path key, POSIX `open`/`link`/`rename`/`fsync`, and
the existing internal Win32 C++ helper extended with no-replace move and process-identity operations.

## Global Constraints

**Status:** Awaiting owner approval. This plan does not authorize implementation.

- Implement only approved Stage 1 Phase 4. Do not create real root config, lock, generated output,
  report, or `.ai-tooling/**` state in the execution worktree.
- Start only from the exact owner-approved Phase 3 commit in a clean isolated worktree. Phase 4
  approval never authorizes a push, pull request, publication, Phase 5, or decommission work.
- Do not change the Phase 1 version-1 state schema, `StateV1`, registry map, or assignability tests. A
  mismatch stops for an owner-reviewed plan amendment.
- Do not edit `.gitignore`, `biome.json`, `configs/biome-config/**`, `.husky/**`, real root config,
  real root lock, or real generated outputs.
- Keep one writer: `RepositoryFilesystem` owns low-level mutation and only `TransactionManager`
  receives it. Recovery services, restore services, planners, renderers, `check`, `diff`, and ordinary
  `doctor` keep `ReadOnlyRepositoryFilesystem`.
- Every repository and local-state path passes the same Git-root containment gateway. Existing
  components are opened without following links/reparse points, absent tails are lexically validated,
  ancestor identities are rebound after structural creation, and identities are revalidated
  immediately before the final system call.
- `sameObject` compares stable locator identity only. `sameObservation` compares locator plus mutable
  mode/attributes/size/timestamps. Ancestor continuity uses `sameObject`; leaf compare-and-swap uses
  `sameObservation`.
- The one run lock is `.ai-tooling/run.lock`. No second root-level lock, lock directory, marker, or
  generic force path is permitted.
- A transaction step is a canonical one-based integer `1..100000`; its spelling is exactly six
  decimal digits. Structural directories sort shallow-first, then ordinary entries by portable key
  and original UTF-8 bytes, with `ai-tooling.lock.json` last. Rollback uses the same steps in reverse.
- A journal is at most 64 MiB. Metadata strings are at most 4 KiB, one diagnostic is at most 64 KiB,
  managed paths are at most 100,000, and every command uses the shared IC-16 monotonic read budget.
- Ordinary operations use `operationId: null` in reviewed plans and generate one lowercase UUID v4
  plus one 32-byte, 43-character unpadded base64url nonce only after accepted-plan revalidation.
  Repair plans bind the interrupted operation ID.
- All mutators implement `--dry-run`; dry-run creates no directory, lock, journal, backup, report,
  config, output, or temporary leaf. Noninteractive mutation requires exact
  `--accept-plan <64-lowercase-hex>`. There is no `--force`, bare `--yes`, adoption, `import-edits`,
  hook installation, plugin mutation, preview activation, remote acquisition, or cache operation.
- Interactive apply writes and flushes the complete terminal-safe plan and prompt before reading one
  exact `[0-9a-f]{64}\n` confirmation frame capped at 65 bytes. Output, flush, EPIPE, EOF, CRLF,
  uppercase, NUL, extra-line, or framing failure performs zero writes.
- Before any local-state creation, run the shared ignore/unignore prerequisite twice and prove the
  complete cached and worktree `.ai-tooling` Git maps are empty. Global-only ignore provenance,
  tracked/index-only/intent-to-add/conflicted/gitlink/symlink entries, status uncertainty, or a race
  blocks with zero writes.
- The only idempotent non-plan directories are `.ai-tooling`, `.ai-tooling/transactions`,
  `.ai-tooling/backups`, and `.ai-tooling/stale-locks`, created one level at a time in that order after
  plan acceptance. `.ai-tooling/reports` is an ordinary planned directory.
- Exact transient names and authority types are closed. A grammar-valid name without its matching
  journal or recovery authority is blocking evidence.
- A handled failure restores the complete prior tree and explicit prior lock state, appends and
  flushes `rolled-back`, verifies both, then removes only unchanged transient evidence. Failure of
  rollback or verification retains the journal-ready run lock, journal, and backups and returns
  `interrupted`.
- Recovery accepts only journaled prior, candidate, absent, exact canonical prefix, or explicitly
  documented POSIX post-link states. Any non-prefix, hybrid, changed identity, changed digest,
  mismatched action/generation, third target state, third lock state, corrupt frame, or unbound leaf is
  preserved and blocks.
- Run-lock bytes are untrusted. Strict parsing and canonical-byte equality precede liveness. Host,
  PID, start marker, provider, UUID, nonce, operation, phase, action, and generation are typed and
  bounded; metadata never selects or interpolates an executable, flag, command, or syntax.
- Only exact same-host `dead` permits stale recovery. Live, foreign, reused PID, access denied,
  malformed provider result, identity drift, timeout, flood, stall, signal, or termination uncertainty
  performs zero recovery writes.
- Active/interrupted evidence is never pruned. Ordinary successful transaction backups are removed
  only after final verification. Restore keeps the newest verified retained preimage; the prior fixed
  frame survives every pre-commit crash and handled rollback.
- Ordinary `doctor`, `doctor --report`, all checks, diffs, and every dry run remain read-only.
  `doctor --repair` requires exact operation, action, plan digest, and confirmation.
- Tests use temporary repositories and temporary homes only. Native mutation tests run on
  `windows-2025` x64, `ubuntu-24.04` x64, and `macos-15` arm64 and never mutate the real checkout.
- Do not create intermediate commits. The only Phase 4 commit occurs in the final gate after the
  exact manifest, staged verifier, artifact scan, local checks, and owner-scoped validation steps pass.

---

## Phase boundary and authority map

The owner must first approve the exact Phase 3 commit and explicitly authorize Phase 4. In the clean
Phase 4 worktree, freeze the approved base without symbolic ancestry:

```powershell
$approvedBase = (& git rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0 -or $approvedBase -notmatch '^[0-9a-f]{40}$') { throw 'invalid approved Phase 3 commit' }
if ((& git status --porcelain=v1 -z --untracked-files=all --ignore-submodules=all).Length -ne 0) { throw 'Phase 4 worktree is not clean' }
& git diff --exit-code HEAD -- packages/ai-tooling/scripts/verify-phase-delta.mjs
if ($LASTEXITCODE -ne 0) { throw 'approved-base verifier bytes changed' }
pnpm install --frozen-lockfile --ignore-scripts
if ($LASTEXITCODE -ne 0) { throw 'Phase 4 dependency install failed' }
if ((& git status --porcelain=v1 -z --untracked-files=all --ignore-submodules=all).Length -ne 0) { throw 'installation changed a Git-visible path' }
```

`node_modules/` is not committed, so this install is the master section 0.3 prerequisite for every
Phase 4 test command; it must run before Task 4.1.1 and must execute no lifecycle script, including
Husky.

The only allowed Phase 4 paths are the exact entries in
`docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-4.txt`. The file list is repeated here for
task ownership; the committed manifest remains the fail-closed staging authority:

| Responsibility | Exact paths |
|---|---|
| Workflow and durable docs | `.github/workflows/ai-tooling.yml`; `docs/ai-tooling/SECURITY.md`; `docs/ai-tooling/USER-GUIDE.md`; `docs/system-overview/ai-tooling.md` |
| Native helper | `packages/ai-tooling/native/win32-helper/main.cc`; `packages/ai-tooling/native/win32-helper/protocol.h`; `packages/ai-tooling/src/native/win32-helper.ts` |
| CLI and commands | `packages/ai-tooling/src/cli.ts`; `packages/ai-tooling/src/commands/doctor.ts`; `packages/ai-tooling/src/commands/init.ts`; `packages/ai-tooling/src/commands/refresh-local.ts`; `packages/ai-tooling/src/commands/restore-generated.ts`; `packages/ai-tooling/src/commands/sync.ts` |
| Filesystem boundary | `packages/ai-tooling/src/fs/local-state-prerequisite.ts`; `packages/ai-tooling/src/fs/path-identity.ts`; `packages/ai-tooling/src/fs/repository-filesystem.ts` |
| Recovery | `packages/ai-tooling/src/recovery/inspect.ts`; `packages/ai-tooling/src/recovery/linux-procfs.ts`; `packages/ai-tooling/src/recovery/liveness.ts`; `packages/ai-tooling/src/recovery/macos-ps.ts`; `packages/ai-tooling/src/recovery/repair.ts`; `packages/ai-tooling/src/recovery/restore-generated.ts`; `packages/ai-tooling/src/recovery/retention.ts`; `packages/ai-tooling/src/recovery/run-lock.ts`; `packages/ai-tooling/src/recovery/windows-native.ts` |
| Transaction boundary | `packages/ai-tooling/src/transaction/backup-store.ts`; `packages/ai-tooling/src/transaction/journal.ts`; `packages/ai-tooling/src/transaction/mutation-plan.ts`; `packages/ai-tooling/src/transaction/rollback.ts`; `packages/ai-tooling/src/transaction/transaction-manager.ts`; `packages/ai-tooling/src/transaction/types.ts` |
| Fixtures | `packages/ai-tooling/tests/fixtures/init/vectors.json`; `packages/ai-tooling/tests/fixtures/mutation-plan-digest/vectors.json`; `packages/ai-tooling/tests/fixtures/sync/vectors.json` |
| Integration tests | `packages/ai-tooling/tests/integration/biome-exclusions.spec.ts`; `packages/ai-tooling/tests/integration/doctor-repair.spec.ts`; `packages/ai-tooling/tests/integration/doctor-report.spec.ts`; `packages/ai-tooling/tests/integration/init.spec.ts`; `packages/ai-tooling/tests/integration/refresh-local.spec.ts`; `packages/ai-tooling/tests/integration/restore-generated.spec.ts`; `packages/ai-tooling/tests/integration/sync.spec.ts` |
| Native tests | `packages/ai-tooling/tests/native/repository-filesystem.native.spec.ts`; `packages/ai-tooling/tests/native/run-lock-liveness.native.spec.ts`; `packages/ai-tooling/tests/native/transaction-recovery.native.spec.ts` |
| Unit tests | `packages/ai-tooling/tests/unit/journal.spec.ts`; `packages/ai-tooling/tests/unit/liveness.spec.ts`; `packages/ai-tooling/tests/unit/local-state-prerequisite.spec.ts`; `packages/ai-tooling/tests/unit/mutation-plan-digest.spec.ts`; `packages/ai-tooling/tests/unit/recovery-inspect.spec.ts`; `packages/ai-tooling/tests/unit/recovery-repair.spec.ts`; `packages/ai-tooling/tests/unit/repository-filesystem-mutation.spec.ts`; `packages/ai-tooling/tests/unit/restore-generated.spec.ts`; `packages/ai-tooling/tests/unit/run-lock.spec.ts`; `packages/ai-tooling/tests/unit/transaction-manager.spec.ts` |

The authority chain is exact and one-way:

```text
ConfirmedMutationPlan / ConfirmedRestorePlan / ConfirmedRecoveryPlan
  -> canonical JournalHeaderPayloadV1 and complete size preflight
  -> createRunLockExclusive(pre-journal)
  -> createJournalHeaderExclusive(header-only journal, RunLockAdvanceAuthority)
  -> JournalActionConfirmer(ConfirmedJournalAction)
  -> advanceRunLockVerified(journal-ready)
  -> ensureAllForwardIntents or ensureAllRollbackIntents
  -> direction-specific branded staging/backup/preimage authorities
  -> gateway mutation methods
  -> complete candidate/prior tree and explicit lock-state verification
  -> appendTerminalFrameVerified
  -> committed retained-preimage authorities, or empty authority array on rollback
  -> exact evidence cleanup and final run-lock release
```

No cast, test-only brand constructor, alternate issuer, caller-built absolute path, or raw filesystem
handle may bypass this chain.

## Mandatory task execution rule

Every task below is a separate 2-5 minute RED/GREEN microcycle. Add exactly the shown test or
fixture row, run the exact focused command, and require the named assertion to fail for the stated
behavior. Add only the shown production branch, rerun the same command, and require the same named
test to pass. A missing test, skipped test, import/config error, network error, pass-with-no-tests,
native skip on the matching tuple, or failure in a different assertion is not a RED.

When a new module is first introduced, its first import failure is only structural evidence. Add the
shown typed export immediately and rerun; the required RED is the named behavioral assertion. The
temporary working-tree-only body may throw the exact ASCII sentinel whose value is named here by the
two plan segments `EVK_INTERNAL_NOT_` and `IMPLEMENTED`. Insert their joined value as one contiguous
string literal in the transient source stub so the forbidden-stub scanner can detect it, then remove
that branch before the task's GREEN. The joined token is forbidden from every candidate commit,
fixture, package, and durable document.

For every Run command below:

- **Expected RED:** exit `1`; verbose output names the exact `it(...)` test and shows the stated
  assertion mismatch; no write/call-count postcondition fails first.
- **Expected GREEN:** exit `0`; verbose output names the same test, with no skip or retry, and every
  zero-write, byte-identity, or call-count assertion passes.

## 4.1 Mutation gateway

### Task 4.1.1: Separate stable locator identity from full observations

**Files:**

- Create: `packages/ai-tooling/src/fs/path-identity.ts`
- Create: `packages/ai-tooling/tests/unit/repository-filesystem-mutation.spec.ts`

**Interfaces:**

- Consumes: Phase 3 `ObjectIdentity<K>` and `ObjectLocatorIdentity<K>` from
  `packages/ai-tooling/src/model/types.ts`.
- Produces: `objectLocator<K>(identity: ObjectIdentity<K>): ObjectLocatorIdentity<K>`,
  `sameObject(left, right): boolean`, and `sameObservation(left, right): boolean`.

- [ ] **Step 1: Add the literal failing identity test**

```ts
import { describe, expect, it } from 'vitest';
import { objectLocator, sameObject, sameObservation } from '../../src/fs/path-identity.js';

describe('repository filesystem mutation identity', () => {
  it('keeps a directory reference valid after sibling metadata changes', () => {
    const before = {
      os: 'posix' as const,
      nodeKind: 'directory' as const,
      dev: 7n,
      ino: 11n,
      mode: 0o40755,
      size: 0n,
      ctimeNs: 100n,
      mtimeNs: 100n,
    };
    const afterSiblingCreate = { ...before, ctimeNs: 101n, mtimeNs: 101n };
    const replacement = { ...afterSiblingCreate, ino: 12n };

    expect(objectLocator(before)).toStrictEqual({
      os: 'posix',
      nodeKind: 'directory',
      dev: 7n,
      ino: 11n,
    });
    expect(sameObject(before, afterSiblingCreate)).toBe(true);
    expect(sameObservation(before, afterSiblingCreate)).toBe(false);
    expect(sameObject(before, replacement)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/repository-filesystem-mutation.spec.ts --passWithNoTests=false --reporter=verbose -t "keeps a directory reference valid after sibling metadata changes"
```

Expected RED: exit `1`; `keeps a directory reference valid after sibling metadata changes` reports
that locator equality incorrectly changes with directory timestamps, or the typed export is absent
before the structural stub is added.

- [ ] **Step 3: Add the literal minimal identity implementation**

```ts
import type { NodeKind, ObjectIdentity, ObjectLocatorIdentity } from '../model/types.js';

export function objectLocator<K extends NodeKind>(
  identity: ObjectIdentity<K>,
): ObjectLocatorIdentity<K> {
  if (identity.os === 'posix') {
    return {
      os: 'posix',
      nodeKind: identity.nodeKind,
      dev: identity.dev,
      ino: identity.ino,
    } as ObjectLocatorIdentity<K>;
  }
  return {
    os: 'win32',
    nodeKind: identity.nodeKind,
    volumeSerial: identity.volumeSerial,
    fileId128: identity.fileId128,
  } as ObjectLocatorIdentity<K>;
}

export function sameObject(
  left: ObjectLocatorIdentity | ObjectIdentity,
  right: ObjectLocatorIdentity | ObjectIdentity,
): boolean {
  if (left.os !== right.os || left.nodeKind !== right.nodeKind) return false;
  return left.os === 'posix' && right.os === 'posix'
    ? left.dev === right.dev && left.ino === right.ino
    : left.os === 'win32' && right.os === 'win32'
      ? left.volumeSerial === right.volumeSerial && left.fileId128 === right.fileId128
      : false;
}

export function sameObservation(left: ObjectIdentity, right: ObjectIdentity): boolean {
  if (!sameObject(left, right) || left.os !== right.os) return false;
  return left.os === 'posix' && right.os === 'posix'
    ? left.mode === right.mode &&
        left.size === right.size &&
        left.ctimeNs === right.ctimeNs &&
        left.mtimeNs === right.mtimeNs
    : left.os === 'win32' && right.os === 'win32'
      ? left.attributes === right.attributes &&
        left.size === right.size &&
        left.creationTime === right.creationTime &&
        left.lastWriteTime === right.lastWriteTime
      : false;
}
```

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; the locator remains equal across sibling metadata changes, the full
observation changes, and a replacement directory is rejected.

### Task 4.1.2: Fail closed when local-state ignore or Git state drifts

**Files:**

- Create: `packages/ai-tooling/src/fs/local-state-prerequisite.ts`
- Create: `packages/ai-tooling/tests/unit/local-state-prerequisite.spec.ts`

**Interfaces:**

- Consumes: `ReadOnlyRepositoryContext`, the closed `FrozenGitProvider` requests
  `check-stage-1-local-state-ignore`, `list-index(local-state)`, and `status(local-state)`, and the
  Phase 3 gateway's bounded `.gitignore` observation.
- Produces: `LocalStatePrerequisiteVerifier.assertReady(context: ReadOnlyRepositoryContext): Promise<void>`.

- [ ] **Step 1: Add the literal failing drift test**

```ts
import { describe, expect, it, vi } from 'vitest';
import { createLocalStatePrerequisiteVerifier } from '../../src/fs/local-state-prerequisite.js';

describe('local state prerequisite', () => {
  it('rejects ignore drift and a HEAD-tracked staged deletion', async () => {
    const calls: string[] = [];
    const context = {
      git: {
        runRepositoryReadOnly: vi.fn(async (request: { readonly kind: string }) => {
          calls.push(request.kind);
          if (request.kind === 'check-stage-1-local-state-ignore') {
            return { kind: 'ignored-probes', localStateProvenance: '.gitignore', lockIgnored: false };
          }
          if (request.kind === 'list-index') return { kind: 'index-map', entries: [] };
          return { kind: 'status-map', entries: [{ path: '.ai-tooling/run.lock', xy: 'D ' }] };
        }),
      },
      filesystem: {
        observeGitignore: vi
          .fn()
          .mockResolvedValueOnce({ digest: 'a'.repeat(64), locator: 'same' })
          .mockResolvedValueOnce({ digest: 'b'.repeat(64), locator: 'same' }),
      },
    };

    const verifier = createLocalStatePrerequisiteVerifier();
    await expect(verifier.assertReady(context as never)).rejects.toMatchObject({
      diagnostic: { code: 'EVK_CONFIG_CAPABILITY_UNAVAILABLE', reason: 'local-state-prerequisite-failed' },
    });
    expect(calls).toStrictEqual([
      'check-stage-1-local-state-ignore',
      'list-index',
      'status',
    ]);
  });
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/local-state-prerequisite.spec.ts --passWithNoTests=false --reporter=verbose -t "rejects ignore drift and a HEAD-tracked staged deletion"
```

Expected RED: exit `1`; the verifier accepts changed `.gitignore` bytes or the staged-deletion status
map instead of returning `local-state-prerequisite-failed`.

- [ ] **Step 3: Add the literal minimal verifier**

```ts
import { ToolingError } from '../diagnostics/error.js';
import type { ReadOnlyRepositoryContext } from '../repository/context.js';

function prerequisiteFailure(): ToolingError {
  return new ToolingError({
    code: 'EVK_CONFIG_CAPABILITY_UNAVAILABLE',
    message: 'Repository-local state prerequisites are not satisfied.',
    reason: 'local-state-prerequisite-failed',
    fields: { capability: 'local-state.create', activeProfile: 'safe-core' },
    recoveryActions: [
      'Restore the repository-owned /.ai-tooling/ ignore rule and keep ai-tooling.lock.json unignored.',
      'Remove tracked, staged, conflicted, or untracked .ai-tooling entries through reviewed repository changes.',
    ],
  });
}

export function createLocalStatePrerequisiteVerifier() {
  return {
    async assertReady(context: ReadOnlyRepositoryContext): Promise<void> {
      const before = await context.filesystem.observeGitignore(context.readBudget);
      const probes = await context.git.runRepositoryReadOnly({
        kind: 'check-stage-1-local-state-ignore',
        stdoutSink: context.filesystem.createBoundedSink(context.readBudget),
      });
      const index = await context.git.runRepositoryReadOnly({
        kind: 'list-index',
        scope: 'local-state',
        stdoutSink: context.filesystem.createBoundedSink(context.readBudget),
      });
      const status = await context.git.runRepositoryReadOnly({
        kind: 'status',
        scope: 'local-state',
        stdoutSink: context.filesystem.createBoundedSink(context.readBudget),
      });
      const after = await context.filesystem.observeGitignore(context.readBudget);
      const ready =
        probes.kind === 'ignored-probes' &&
        probes.localStateProvenance === '.gitignore' &&
        probes.lockIgnored === false &&
        index.kind === 'index-map' &&
        index.entries.length === 0 &&
        status.kind === 'status-map' &&
        status.entries.length === 0 &&
        before.digest === after.digest &&
        before.locator === after.locator;
      if (!ready) throw prerequisiteFailure();
    },
  };
}
```

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; the verifier executes all three closed Git requests, detects both drift
signals, and performs no filesystem mutation.

The task is not complete until parameterized rows cover all five probe outcomes, global/system
exclude poisoning, missing/global-only provenance, lock ignored, force-tracked/index-only/HEAD-staged-
deletion/intent-to-add/conflict/gitlink/symlink modes, and an entry inserted between the two checks.
Every row asserts zero state-root, run-lock, journal, backup, report, temporary, target, and Git-index
writes.

### Task 4.1.3: Require journal-bound same-parent staging for file publication

**Files:**

- Modify: `packages/ai-tooling/src/fs/repository-filesystem.ts`
- Modify: `packages/ai-tooling/native/win32-helper/protocol.h`
- Modify: `packages/ai-tooling/native/win32-helper/main.cc`
- Modify: `packages/ai-tooling/src/native/win32-helper.ts`
- Modify: `packages/ai-tooling/tests/unit/repository-filesystem-mutation.spec.ts`
- Create: `packages/ai-tooling/tests/native/repository-filesystem.native.spec.ts`

**Interfaces:**

- Consumes: `ContainedPathRef`, `ObservedPathState`, `DurableStagingIntent`, candidate bytes, Phase 3
  native object identity, and `sameObject`/`sameObservation` from Task 4.1.1.
- Produces: `RepositoryFilesystem.createExclusive`, `replaceVerified`, `renameVerified`,
  `deleteVerified`, `flushParent`, internal `createRepositoryFilesystem(nativePort)`, plus Win32 helper operation `move-file` with
  `replaceExisting: false | true`.

- [ ] **Step 1: Add the literal failing staging-authority test**

```ts
import { describe, expect, it, vi } from 'vitest';
import { createRepositoryFilesystem } from '../../src/fs/repository-filesystem.js';

describe('repository filesystem mutation staging', () => {
  it('rejects a staging name not bound by the durable intent', async () => {
    const native = {
      createStageExclusive: vi.fn(),
      publishNoReplace: vi.fn(),
    };
    const filesystem = createRepositoryFilesystem(native as never);
    const target = filesystem.ref('AGENTS.md');
    const forged = {
      operationId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      nonce: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      step: 1,
      targetPath: 'AGENTS.md',
      stagingPath: '.wrong-name',
      candidateDigest: 'a'.repeat(64),
      byteLength: 1,
    };

    await expect(
      filesystem.createExclusive(target, { kind: 'absent' }, new Uint8Array([0x61]), forged as never),
    ).rejects.toMatchObject({
      diagnostic: { code: 'EVK_CONFIG_CAPABILITY_UNAVAILABLE', reason: 'staging-authority-invalid' },
    });
    expect(native.createStageExclusive).not.toHaveBeenCalled();
    expect(native.publishNoReplace).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling run build:native && pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/repository-filesystem-mutation.spec.ts tests/native/repository-filesystem.native.spec.ts --passWithNoTests=false --reporter=verbose -t "rejects a staging name not bound by the durable intent"
```

Expected RED: exit `1`; a forged same-directory name reaches `createStage` or no closed authority
validation exists. On `win32-x64`, the freshly built old helper may first expose the missing
`move-file` protocol; after the structural handler exists, the named behavioral assertion must fail.

- [ ] **Step 3: Add the literal staging-name validation and publish branch**

```ts
import { ToolingError } from '../diagnostics/error.js';
import { sha256Bytes } from '../json/jcs.js';
import type { DurableStagingIntent, PortableRelativePath } from '../model/types.js';

function sixDigitStep(step: number): string {
  if (!Number.isSafeInteger(step) || step < 1 || step > 100000) {
    throw new ToolingError({
      code: 'EVK_CONFIG_CAPABILITY_UNAVAILABLE',
      message: 'Mutation step is outside the Stage 1 range.',
      reason: 'staging-authority-invalid',
      fields: { capability: 'transaction.stage', activeProfile: 'safe-core' },
      recoveryActions: ['Preserve the journal and retry only from a reviewed transaction plan.'],
    });
  }
  return String(step).padStart(6, '0');
}

function expectedStage(intent: DurableStagingIntent): PortableRelativePath {
  const slash = intent.targetPath.lastIndexOf('/');
  const parent = slash < 0 ? '' : `${intent.targetPath.slice(0, slash + 1)}`;
  return `${parent}.evk-ai-tooling-tmp-${intent.operationId}-${intent.nonce}-${sixDigitStep(intent.step)}` as PortableRelativePath;
}

function assertStageIntent(
  intent: DurableStagingIntent,
  target: PortableRelativePath,
  bytes: Uint8Array,
): void {
  if (
    intent.targetPath !== target ||
    intent.stagingPath !== expectedStage(intent) ||
    intent.byteLength !== bytes.byteLength ||
    intent.candidateDigest !== sha256Bytes(bytes)
  ) {
    throw new ToolingError({
      code: 'EVK_CONFIG_CAPABILITY_UNAVAILABLE',
      message: 'Durable staging authority does not match the candidate.',
      reason: 'staging-authority-invalid',
      fields: { capability: 'transaction.stage', activeProfile: 'safe-core' },
      recoveryActions: ['Preserve the journal and retry only from its exact planned mutation.'],
    });
  }
}

async function createExclusive(
  ref: ContainedPathRef,
  expected: { readonly kind: 'absent' },
  bytes: Uint8Array,
  staging: DurableStagingIntent,
): Promise<Extract<ObservedPathState, { readonly kind: 'file' }>> {
  assertStageIntent(staging, ref.relativePath, bytes);
  await this.assertAncestors(ref);
  await this.assertLeaf(ref, expected);
  const stageRef = await this.resolve(staging.stagingPath);
  await this.assertLeaf(stageRef, { kind: 'absent' });
  const staged = await this.native.createStageExclusive(stageRef, bytes);
  await this.native.flushFile(staged);
  await this.assertAncestors(ref);
  await this.assertLeaf(ref, expected);
  await this.native.publishNoReplace(stageRef, staged, ref);
  await this.native.flushParent(ref);
  return this.observeExactFile(ref, bytes);
}
```

The Win32 request decoder added in this task accepts exactly one `move-file` operation with two
strict UTF-8 contained paths and one Boolean replacement flag. `false` calls the no-replace native
move; `true` calls `MoveFileExW` with `MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH`. It rejects
truncation, extra bytes, NUL, unknown flags, non-contained paths, helper identity drift, and every
non-`win32-x64` tuple before a filesystem call. POSIX create publishes by `link` followed by unlink of
the exact staged inode; replacement uses atomic same-filesystem rename. Neither platform falls back to
copying into the final leaf.

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; the forged authority is rejected before native calls, and the native suite
proves absent-or-exact candidate bytes at crashes before/after stage create, every byte write, file
flush, publish, stage unlink, and parent flush.

Complete this task with literal table rows for create, replacement, rename, file/link delete,
wrong identity/kind, pre-existing/link/reparse stage, wrong parent/operation/nonce/step/digest/length,
target race, ancestor swap, exact-candidate prefix at every byte, full candidate, non-prefix, and POSIX
post-link/pre-unlink states. For a target already at candidate, only absent or full-candidate hard-link
temporary state is cleanable; every third state is preserved.

### Task 4.1.4: Create structural directories one level at a time and rebind descendants

**Files:**

- Modify: `packages/ai-tooling/src/fs/repository-filesystem.ts`
- Modify: `packages/ai-tooling/tests/unit/repository-filesystem-mutation.spec.ts`
- Modify: `packages/ai-tooling/tests/native/repository-filesystem.native.spec.ts`

**Interfaces:**

- Consumes: `ContainedPathRef`, `ObservedPathState`, `ObjectLocatorIdentity<'directory'>`,
  `sameObject`, and the Phase 3 portable path validator.
- Produces: `RepositoryFilesystem.createDirectoryExclusive(ref, { kind: 'absent' })`,
  `removeEmptyDirectoryVerified(ref, expectedDirectory)`, and
  `rebindDescendantAfterDirectoryCreate(filesystem, parent, created, descendant)`.

- [ ] **Step 1: Add the literal failing parent-replacement test**

```ts
import { expect, it, vi } from 'vitest';
import { rebindDescendantAfterDirectoryCreate } from '../../src/fs/repository-filesystem.js';

it('rejects a replacement parent before descendant creation', async () => {
  const original = {
    os: 'posix' as const,
    nodeKind: 'directory' as const,
    dev: 7n,
    ino: 11n,
    mode: 0o40755,
    size: 0n,
    ctimeNs: 100n,
    mtimeNs: 100n,
  };
  const replacement = { ...original, ino: 12n };
  const parent = {
    relativePath: '.agents',
    ancestors: [{ os: 'posix', nodeKind: 'directory', dev: 7n, ino: 1n }],
  } as const;
  const filesystem = {
    resolve: vi.fn(async () => ({
      relativePath: '.agents/skills',
      ancestors: [
        { os: 'posix', nodeKind: 'directory', dev: 7n, ino: 1n },
        { os: 'posix', nodeKind: 'directory', dev: 7n, ino: 12n },
      ],
    })),
  };

  await expect(
    rebindDescendantAfterDirectoryCreate(
      filesystem as never,
      parent as never,
      { kind: 'directory', identity: original },
      '.agents/skills' as never,
    ),
  ).rejects.toMatchObject({
    diagnostic: { code: 'EVK_CONFIG_CAPABILITY_UNAVAILABLE', reason: 'ancestor-identity-changed' },
  });
  expect(filesystem.resolve).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/repository-filesystem-mutation.spec.ts tests/native/repository-filesystem.native.spec.ts --passWithNoTests=false --reporter=verbose -t "rejects a replacement parent before descendant creation"
```

Expected RED: exit `1`; descendant creation proceeds with a stale absent-tail reference or rollback
removes the replacement directory.

- [ ] **Step 3: Add the literal one-level directory methods**

```ts
export async function rebindDescendantAfterDirectoryCreate(
  filesystem: Pick<RepositoryFilesystem, 'resolve'>,
  parent: ContainedPathRef,
  created: Extract<ObservedPathState, { readonly kind: 'directory' }>,
  descendant: PortableRelativePath,
): Promise<ContainedPathRef> {
  const child = await filesystem.resolve(descendant);
  const parentDepth = parent.relativePath.split('/').length;
  const reboundParent = child.ancestors[parentDepth];
  if (reboundParent === undefined || !sameObject(created.identity, reboundParent)) {
    throw containmentError('ancestor-identity-changed');
  }
  return child;
}

async createDirectoryExclusive(
  ref: ContainedPathRef,
  expected: { readonly kind: 'absent' },
): Promise<Extract<ObservedPathState, { readonly kind: 'directory' }>> {
  await this.assertAncestors(ref);
  await this.assertLeaf(ref, expected);
  const created = await this.native.createDirectoryOneLevelExclusive(ref);
  await this.native.flushParent(ref);
  await this.assertAncestors(ref);
  const observed = await this.native.observeNoFollow(ref);
  if (observed.kind !== 'directory' || !sameObject(created, observed)) {
    throw containmentError('created-directory-identity-changed');
  }
  return observed;
}

async removeEmptyDirectoryVerified(
  ref: ContainedPathRef,
  expected: Extract<ObservedPathState, { readonly kind: 'directory' }>,
): Promise<void> {
  await this.assertAncestors(ref);
  const current = await this.native.observeNoFollow(ref);
  if (current.kind !== 'directory' || !sameObject(expected.identity, current.identity)) {
    throw containmentError('target-identity-changed');
  }
  if (!(await this.native.isDirectoryEmptyNoFollow(ref))) {
    throw containmentError('directory-not-empty');
  }
  await this.native.removeDirectoryOneLevel(ref, current.identity);
  await this.native.flushParent(ref);
}
```

After any successful directory create, the transaction code must discard every old descendant
`ContainedPathRef`, call `resolve` again, and compare the newly returned ancestor locator with the
created directory. It never inserts an identity into an old absent tail.

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; only `.agents` was created, the replacement parent blocks the child, and no
rollback removal targets the substitute.

Add rows for shallow-first creation, reverse-depth removal, sibling create/delete timestamp change,
link/reparse swap, a real-directory replacement, recursive create rejection, wrong kind, nonempty
directory, an external child inserted after confirmation, and crashes before/after create and parent
flush. The exact init directory order is `.agents`, `.agents/skills`,
`.agents/skills/evk-plan`, `.claude`, `.claude/rules`, `.claude/skills`,
`.claude/skills/evk-plan`.

### Task 4.1.5: Direct-create the fixed run lock and journal header

**Files:**

- Modify: `packages/ai-tooling/src/fs/repository-filesystem.ts`
- Modify: `packages/ai-tooling/tests/unit/repository-filesystem-mutation.spec.ts`
- Modify: `packages/ai-tooling/tests/native/repository-filesystem.native.spec.ts`

**Interfaces:**

- Consumes: exact captured state-root and transactions-root locators, canonical run-lock/header bytes,
  `JournalHeaderPayloadV1`, and `ConfirmedJournalAction`.
- Produces: `createRunLockExclusive`, `createJournalHeaderExclusive`,
  `verifyJournalHeaderForRunLockAdvance`, `advanceRunLockVerified`, and the sole
  `RunLockAdvanceAuthority` issuer plus internal `assertRunLockAdvanceBinding`.

- [ ] **Step 1: Add the literal failing header-authority test**

```ts
import { expect, it } from 'vitest';
import { sha256Bytes } from '../../src/json/jcs.js';
import { assertRunLockAdvanceBinding } from '../../src/fs/repository-filesystem.js';

it('mints run-lock advance authority only from the exact flushed header', async () => {
  const headerFrame = new Uint8Array([0x45, 0x56, 0x4b, 0x4a, 0x01]);
  const headerDigest = sha256Bytes(headerFrame);
  const candidateBytes = new TextEncoder().encode('{"phase":"journal-ready"}\n');
  const action = {
    source: 'ordinary',
    action: 'complete',
    operationId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    journalPlanDigest: '1'.repeat(64),
    acceptedPlanDigest: '1'.repeat(64),
    headerDigest: '0'.repeat(64),
  } as const;
  const authority = {
    operationId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    nonce: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    headerDigest,
    stagingPath: '.ai-tooling/.run-lock-advance-f47ac10b-58cc-4372-a567-0e02b2c3d479-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA.stage',
    candidateDigest: sha256Bytes(candidateBytes),
    byteLength: candidateBytes.byteLength,
  };

  expect(() =>
    assertRunLockAdvanceBinding(
      headerFrame,
      candidateBytes,
      action as never,
      authority as never,
    ),
  ).toThrowError(expect.objectContaining({
    diagnostic: { code: 'EVK_CONFIG_CAPABILITY_UNAVAILABLE', reason: 'journal-authority-mismatch' },
  }));
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/repository-filesystem-mutation.spec.ts tests/native/repository-filesystem.native.spec.ts --passWithNoTests=false --reporter=verbose -t "mints run-lock advance authority only from the exact flushed header"
```

Expected RED: exit `1`; a payload-only or forged action digest advances the run lock or creates the
advance stage.

- [ ] **Step 3: Add the literal authority check at the write boundary**

```ts
export function assertRunLockAdvanceBinding(
  headerFrame: Uint8Array,
  bytes: Uint8Array,
  action: ConfirmedJournalAction & { readonly action: 'complete' },
  authority: RunLockAdvanceAuthority,
): void {
  const headerDigest = sha256Bytes(headerFrame);
  if (
    action.source !== 'ordinary' ||
    action.action !== 'complete' ||
    action.operationId !== authority.operationId ||
    action.headerDigest !== headerDigest ||
    authority.headerDigest !== headerDigest ||
    authority.candidateDigest !== sha256Bytes(bytes) ||
    authority.byteLength !== bytes.byteLength
  ) {
    throw containmentError('journal-authority-mismatch');
  }
}

async advanceRunLockVerified(
  runLock: ContainedPathRef,
  expectedRunLock: Extract<ObservedPathState, { readonly kind: 'file' }>,
  journalHeader: ContainedPathRef,
  expectedHeader: Extract<ObservedPathState, { readonly kind: 'file' }>,
  bytes: Uint8Array,
  action: ConfirmedJournalAction & { readonly action: 'complete' },
  authority: RunLockAdvanceAuthority,
): Promise<Extract<ObservedPathState, { readonly kind: 'file' }>> {
  const header = await this.readVerified(journalHeader, expectedHeader, this.internalBudget);
  assertRunLockAdvanceBinding(header.bytes, bytes, action, authority);
  return this.replaceCoordinationFileVerified(
    runLock,
    expectedRunLock,
    bytes,
    authority.stagingPath,
    authority,
  );
}
```

`createRunLockExclusive` permits only direct bounded `O_EXCL`/`CREATE_NEW` write of fixed
`.ai-tooling/run.lock`, followed by file and state-root flush. `createJournalHeaderExclusive` permits
only the operation UUID-derived journal under the exact transactions-root locator, writes the exact
complete sequence-0 frame directly, flushes it, reparses it, computes `JournalHeaderDigest` over the
whole serialized frame including its trailing frame digest, and returns exactly
`{ journal, advanceRunLock }`. Partial or malformed direct writes are preserved; they never mint an
authority and never enter liveness.

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; the forged action is rejected before stage creation, and run-lock bytes stay
pre-journal.

Add literal rows for every short-write and flush boundary, missing action, operation/nonce/action tag/
plan digest/header digest swaps, payload-only digest, post-frame whole-journal digest, forged brand,
replayed observation, partial header, header with later frame, absent/prefix/full advance stage,
pre-journal/candidate run-lock state, fresh-process reissue, and every third state. Only an unchanged
canonical prefix may be removed by a separately confirmed repair plan; it never mints authority.

### Task 4.1.6: Append canonical journal frames and gate terminal authorities

**Files:**

- Modify: `packages/ai-tooling/src/fs/repository-filesystem.ts`
- Modify: `packages/ai-tooling/tests/unit/repository-filesystem-mutation.spec.ts`

**Interfaces:**

- Consumes: exact expected journal observation, canonical frame bytes, next sequence,
  `ConfirmedJournalAction`, `JournalHeaderPayloadV1`, and terminal `JournalFrameV1`.
- Produces: `appendJournalFrameVerified`, `appendTerminalFrameVerified`, and
  `reissueCommittedRetainedPreimageAuthorities` plus internal `selectTerminalOutcome`.

- [ ] **Step 1: Add the literal failing terminal-action test**

```ts
import { expect, it } from 'vitest';
import { selectTerminalOutcome } from '../../src/fs/repository-filesystem.js';

it('never mints retained-preimage authority for rolled-back outcome', async () => {
  const result = selectTerminalOutcome(
    {
      source: 'ordinary',
      action: 'rollback',
      operationId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      journalPlanDigest: '1'.repeat(64),
      acceptedPlanDigest: '1'.repeat(64),
      headerDigest: '2'.repeat(64),
    } as never,
    'rolled-back',
  );
  expect(result).toStrictEqual({
    outcome: 'prior',
    mintRetainedPreimages: false,
  });
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/repository-filesystem-mutation.spec.ts --passWithNoTests=false --reporter=verbose -t "never mints retained-preimage authority for rolled-back outcome"
```

Expected RED: exit `1`; rollback returns a retained-preimage authority, verifies candidate state, or
accepts a committed frame under a rollback action.

- [ ] **Step 3: Add the literal closed terminal branch**

```ts
export function selectTerminalOutcome(
  action: ConfirmedJournalAction,
  frameType: 'committed' | 'rolled-back',
): { readonly outcome: 'candidate' | 'prior'; readonly mintRetainedPreimages: boolean } {
  if (action.action === 'rollback') {
    if (frameType !== 'rolled-back') throw containmentError('terminal-action-mismatch');
    return { outcome: 'prior', mintRetainedPreimages: false };
  }
  if (frameType !== 'committed') throw containmentError('terminal-action-mismatch');
  return { outcome: 'candidate', mintRetainedPreimages: true };
}

if (action.action === 'rollback') {
  if (frame.type !== 'rolled-back') throw containmentError('terminal-action-mismatch');
  if (
    action.journalPlanDigest !== header.planDigest ||
    frame.payload.planDigest !== header.planDigest ||
    frame.payload.finalLockState.kind !== header.priorLockState.kind ||
    frame.payload.finalTreeDigest !== finalTreeDigest(finalTreeDigestProjection(header, 'prior'))
  ) {
    throw containmentError('terminal-verification-mismatch');
  }
  await this.verifyCompleteLogicalTree(header, 'prior', header.priorLockState);
  const journal = await this.appendTerminalBytes(
    journalRef,
    expectedJournal,
    expectedSequence,
    serializeJournalFrame(frame),
  );
  return { outcome: 'prior' as const, journal, retainedPreimages: [] as const };
}
if (frame.type !== 'committed') throw containmentError('terminal-action-mismatch');
await this.verifyCompleteLogicalTree(header, 'candidate', header.candidateLockState);
const journal = await this.appendTerminalBytes(
  journalRef,
  expectedJournal,
  expectedSequence,
  serializeJournalFrame(frame),
);
return {
  outcome: 'candidate' as const,
  journal,
  retainedPreimages: this.issueCommittedRetainedAuthorities(header, action),
};
```

`appendJournalFrameVerified` rejects terminal types, revalidates the complete current observation and
EOF, requires the exact next sequence, appends one bounded canonical frame, flushes, and returns the
new observation. `appendTerminalFrameVerified` is the only terminal append path and independently
re-resolves every header path, verifies complete candidate/prior tree and explicit lock state,
recomputes the one shared final-tree digest, and cross-checks operation and plan digests before writing.

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; rollback verifies prior state, appends only `rolled-back`, and returns the
exact empty authority array.

Add compile-time and forged-runtime rows for committed/rolled-back action swaps, candidate/prior lock
swaps, changed path/digest/length/mode/kind/final-tree digest, missing/extra/duplicate path, terminal
frame after terminal, nonterminal type through the terminal method, terminal type through the normal
append method, header/operation/accepted/journal plan digest confusion, and reissue after restart.
Reissue returns authorities only for an accepted `complete` repair whose exact terminal committed
journal and old-fixed/full-stage pair still match; rollback, terminal prior, already-published, or
third state returns none or blocks before write as specified.

### Task 4.1.7: Preserve backups and retained preimages through commit

**Files:**

- Modify: `packages/ai-tooling/src/fs/repository-filesystem.ts`
- Modify: `packages/ai-tooling/tests/unit/repository-filesystem-mutation.spec.ts`
- Create: `packages/ai-tooling/tests/native/transaction-recovery.native.spec.ts`

**Interfaces:**

- Consumes: `DurableBackupIntent`, `DurableRollbackStagingIntent`,
  `RetainedPreimageAuthority`, `CommittedRetainedPreimageAuthority`, and the shared read budget.
- Produces: `createBackupExclusive`, `restorePriorFileVerified`,
  `stageRetainedPreimageVerified`, `commitRetainedPreimageRotationVerified`, and internal
  `assertCommittedRetainedAuthority`.

- [ ] **Step 1: Add the literal failing preimage-preservation test**

```ts
import { expect, it } from 'vitest';
import { assertCommittedRetainedAuthority } from '../../src/fs/repository-filesystem.js';

it('keeps the old retained frame unchanged until committed authority exists', async () => {
  const oldFrame = new Uint8Array([0x45, 0x56, 0x4b, 0x50, 0x01]);
  const newFrame = new Uint8Array([0x45, 0x56, 0x4b, 0x50, 0x02]);
  const preCommitAuthority = {
    operationId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    nonce: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    step: 1,
    descriptor: {
      managedPath: 'AGENTS.md',
      retainedPath: '.ai-tooling/backups/retained-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.preimage',
      observed: { kind: 'file', digest: '1'.repeat(64), identity: {} },
      stagingPath: '.ai-tooling/backups/.retained-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-f47ac10b-58cc-4372-a567-0e02b2c3d479-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA.stage',
      candidateDigest: '2'.repeat(64),
      candidateByteLength: newFrame.byteLength,
    },
    expectedRetained: { kind: 'file', digest: '1'.repeat(64), identity: {} },
  };

  expect(() =>
    assertCommittedRetainedAuthority(preCommitAuthority as never),
  ).toThrowError(expect.objectContaining({
    diagnostic: { code: 'EVK_CONFIG_CAPABILITY_UNAVAILABLE', reason: 'committed-authority-required' },
  }));
  expect(oldFrame).toStrictEqual(new Uint8Array([0x45, 0x56, 0x4b, 0x50, 0x01]));
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/repository-filesystem-mutation.spec.ts tests/native/transaction-recovery.native.spec.ts --passWithNoTests=false --reporter=verbose -t "keeps the old retained frame unchanged until committed authority exists"
```

Expected RED: exit `1`; pre-commit authority replaces or deletes the fixed old retained frame, or it
is accepted by the commit method.

- [ ] **Step 3: Add the literal committed-authority check and publication branch**

```ts
export function assertCommittedRetainedAuthority(
  authority: CommittedRetainedPreimageAuthority | RetainedPreimageAuthority,
): asserts authority is CommittedRetainedPreimageAuthority {
  if (!isCommittedRetainedPreimageAuthority(authority)) {
    throw containmentError('committed-authority-required');
  }
}

async commitRetainedPreimageRotationVerified(
  backupsRoot: ContainedPathRef,
  expectedRoot: ObjectLocatorIdentity<'directory'>,
  retained: ContainedPathRef,
  expectedRetained:
    | Extract<ObservedPathState, { readonly kind: 'absent' }>
    | Extract<ObservedPathState, { readonly kind: 'file' }>,
  staging: ContainedPathRef,
  expectedStaging: Extract<ObservedPathState, { readonly kind: 'file' }>,
  authority: CommittedRetainedPreimageAuthority,
): Promise<{
  readonly retained: Extract<ObservedPathState, { readonly kind: 'file' }>;
  readonly staging: Extract<ObservedPathState, { readonly kind: 'absent' }>;
}> {
  assertCommittedRetainedAuthority(authority);
  await this.assertRoot(backupsRoot, expectedRoot);
  await this.inspectVerified(retained, expectedRetained, this.internalBudget);
  await this.inspectVerified(staging, expectedStaging, this.internalBudget);
  if (
    authority.descriptor.retainedPath !== retained.relativePath ||
    authority.descriptor.stagingPath !== staging.relativePath ||
    authority.descriptor.candidateDigest !== expectedStaging.digest
  ) {
    throw containmentError('committed-authority-mismatch');
  }
  await this.native.publishRetainedFrame(staging, retained, expectedRetained);
  await this.native.flushParent(retained);
  return {
    retained: await this.requireExactFile(retained, authority.descriptor.candidateDigest),
    staging: await this.requireAbsent(staging),
  };
}
```

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; the new frame remains only in its journal-bound stage, the old fixed frame
is byte-identical, and the pre-commit authority cannot publish.

Complete the task with literal EVKP version-1 frame vectors binding managed path/key, source
operation, byte length, SHA-256, and raw bytes. Cover absent/existing retained state, every stage byte,
file flush, publish, parent flush, old-frame cleanup, exact prefix/full/non-prefix stage, target/backup
drift, rollback of forward replace/delete through verified copied rollback stage, and backup partial/
full/non-prefix states. A `.bak` is never renamed or consumed into a target and remains unchanged until
the complete prior tree and explicit prior lock state verify.

### Task 4.1.8: Make recovery coordination a closed handoff protocol

**Files:**

- Modify: `packages/ai-tooling/src/fs/repository-filesystem.ts`
- Modify: `packages/ai-tooling/tests/unit/repository-filesystem-mutation.spec.ts`
- Modify: `packages/ai-tooling/tests/native/transaction-recovery.native.spec.ts`

**Interfaces:**

- Consumes: `RecoveryHandoffAuthority`, `RecoveryPredecessorRetirement`,
  `RecoveryArchiveRestoreAuthority`, `RecoveryRewriteAuthority`, exact predecessor/successor/archive
  observations, and canonical recovery bytes.
- Produces: `publishRecoveryHandoffVerified`, `retireRecoveryPredecessorVerified`,
  `createRecoveryRunLockExclusive`, `deleteRecoveryHandoffVerified`,
  `restoreOriginalArchiveVerified`, `replaceJournalPrefixVerified`, and
  `terminalizeRecoveryArchiveVerified`.

- [ ] **Step 1: Add the literal failing live-successor ownership test**

```ts
import { expect, it, vi } from 'vitest';
import { assertHandoffOwnerMayAdvance } from '../../src/fs/repository-filesystem.js';

it('allows only the embedded live successor owner to advance a published handoff', async () => {
  const ownerA = {
    providerId: 'linux-procfs-v1' as const,
    host: 'host',
    pid: 11,
    startMarker: '111',
  };
  const ownerB = { ...ownerA, pid: 12, startMarker: '222' };
  const liveness = {
    probe: vi.fn(async () => 'live' as const),
    currentIdentity: vi.fn(async () => ownerB),
  };
  const handoff = {
    successor: ownerA,
  };

  await expect(
    assertHandoffOwnerMayAdvance(handoff as never, liveness),
  ).rejects.toMatchObject({
    diagnostic: { code: 'EVK_CONFIG_CAPABILITY_UNAVAILABLE', reason: 'recovery-owner-active' },
  });
  expect(liveness.probe).toHaveBeenCalledWith(ownerA);
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/repository-filesystem-mutation.spec.ts tests/native/transaction-recovery.native.spec.ts --passWithNoTests=false --reporter=verbose -t "allows only the embedded live successor owner to advance a published handoff"
```

Expected RED: exit `1`; caller B retires the predecessor or creates a successor while the handoff's
embedded owner A is live.

- [ ] **Step 3: Add the literal owner gate before coordination mutation**

```ts
export async function assertHandoffOwnerMayAdvance(
  handoff: RecoveryHandoffV1,
  liveness: ProcessLivenessProvider,
): Promise<'owner' | 'dead-owner-coordination-only'> {
  const current = await liveness.currentIdentity();
  const sameOwner =
    current.providerId === handoff.successor.providerId &&
    current.host === handoff.successor.host &&
    current.pid === handoff.successor.pid &&
    current.startMarker === handoff.successor.startMarker;
  const verdict = await liveness.probe(handoff.successor);
  if (sameOwner && verdict === 'live') return 'owner';
  if (!sameOwner && verdict === 'dead') return 'dead-owner-coordination-only';
  throw new ToolingError({
    code: 'EVK_CONFIG_CAPABILITY_UNAVAILABLE',
    message: 'Recovery coordination is owned by another active or ambiguous process.',
    reason: 'recovery-owner-active',
    fields: { capability: 'recovery.coordinate', activeProfile: 'safe-core' },
    recoveryActions: ['Wait for the exact recovery owner or preserve evidence for inspection.'],
  });
}
```

The `dead-owner-coordination-only` branch may restore an absent/exact-prefix successor and delete its
matching handoff, then must stop and obtain a new confirmation/generation. It may not complete or roll
back managed bytes under the dead identity. Handoff publication is no-overwrite and becomes authority
only at the full fixed handoff path; randomized partial stages are bounded scratch and permit no
predecessor/target mutation.

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; caller B receives `recovery-owner-active`, and no predecessor, successor,
handoff, archive, journal, or target mutation occurs.

Complete the task with literal crash rows for predecessor only; partial scratch; full handoff;
archive plus handoff with no current lock; absent/every exact prefix/full successor; full successor
plus handoff; dead recovery successor; terminal archive plus matching recovery lock; terminal archive
alone; and archive-only normalization. Cover action/plan/generation mismatch, generation overflow,
non-prefix successor, changed predecessor/handoff/archive, archive collision, scratch count `0/64/65`,
scratch bytes at/over 64 KiB and 4 MiB aggregate, link/reparse, owner-A pause/caller-B race, two
repairers, and crashes before/after every stage write/flush, fixed publish/parent flush, predecessor
archive/retirement, successor write/flush, handoff cleanup, terminal archive replace, recovery-lock
delete, and terminal archive cleanup. Authority issuance must reject nullability, purpose, path,
generation, digest, length, brand, and observation replay mismatches before any write.

### Task 4.1.9: Close native containment coverage for every Phase 4 path class

**Files:**

- Modify: `packages/ai-tooling/tests/native/repository-filesystem.native.spec.ts`
- Modify: `packages/ai-tooling/native/win32-helper/protocol.h`
- Modify: `packages/ai-tooling/native/win32-helper/main.cc`
- Modify: `packages/ai-tooling/src/native/win32-helper.ts`

**Interfaces:**

- Consumes: every gateway method from Tasks 4.1.1-4.1.8 and the Phase 3 native helper identity
  protocol.
- Produces: native proof for config, override, pack, lock, output, report, journal, backup, run-lock,
  temporary, `.gitignore`, root manifest, and `biome.json` path classes.

- [ ] **Step 1: Add the literal native ancestor-swap test**

```ts
import { expect, it } from 'vitest';

it.runIf(process.platform === 'win32')(
  'rejects a junction swap immediately before no-replace publish',
  async () => {
    const fixture = await createNativeRepositoryFixture();
    const target = await fixture.filesystem.resolve('.ai-tooling/reports/a.json');
    fixture.injectBefore('publish-no-replace', () => {
      fixture.replaceReportsDirectoryWithJunction(fixture.outsideRoot);
    });

    await expect(
      fixture.filesystem.createExclusive(
        target,
        { kind: 'absent' },
        fixture.bytes,
        fixture.stagingAuthority,
      ),
    ).rejects.toMatchObject({
      diagnostic: { code: 'EVK_CONFIG_CAPABILITY_UNAVAILABLE', reason: 'ancestor-identity-changed' },
    });
    expect(await fixture.outsideInventory()).toStrictEqual([]);
  },
);
```

- [ ] **Step 2: Run the named test and require RED on Windows**

Run:

```text
pnpm --filter @evk-soft/ai-tooling run build:native && pnpm --filter @evk-soft/ai-tooling exec vitest run tests/native/repository-filesystem.native.spec.ts --passWithNoTests=false --reporter=verbose -t "rejects a junction swap immediately before no-replace publish"
```

Expected RED: on `win32-x64`, exit `1` because the final helper call follows the junction or skips the
immediate ancestor identity check. On Linux/macOS the file is skipped only by the declared tuple;
their sibling symlink-swap assertion must run in the full task command.

- [ ] **Step 3: Add the literal helper-side final identity guard**

```cpp
const auto parent = OpenDirectoryNoFollow(request.parent_path);
if (!SameLocator(parent.identity, request.expected_parent_identity)) {
  return ReplyError(ErrorCode::kAncestorIdentityChanged);
}
const auto target = ObserveChildNoFollow(parent.handle, request.target_name);
if (request.replace_existing ? !SameObservation(target, request.expected_target)
                             : target.kind != NodeKind::kAbsent) {
  return ReplyError(ErrorCode::kTargetIdentityChanged);
}
return MoveContainedFile(
    request.stage_path,
    request.target_path,
    request.replace_existing
        ? MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH
        : MOVEFILE_WRITE_THROUGH);
```

The actual C++ uses the existing checked binary decoder and RAII handles from Phase 3; the shown branch
is inserted after strict request decoding and before `MoveFileExW`. It accepts no command-line path,
shell, UNC/device path, raw handle from the TypeScript caller, or unchecked fallback.

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command on Windows and this exact cross-platform command locally:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/native/repository-filesystem.native.spec.ts --passWithNoTests=false --reporter=verbose
```

Expected GREEN: the matching native tuple exits `0`; every other tuple has the contract-asserted skip
count, and no outside path changes.

The native matrix must include symlink on all systems; Windows junction/reparse/UNC; ASCII case and
Unicode NFC collisions; file ancestor; absent lexical tail; sibling timestamp change; real directory
replacement; and an injected swap immediately before every read, create, stage, flush, publish,
rename, replace, delete, archive, handoff, and parent flush. It also proves trusted tooling modules and
the separately validated formatter dependency tree remain outside the repository-content gateway.

## 4.2 Run-lock and process liveness

### Task 4.2.1: Strict-parse canonical ordinary and recovery run locks

**Files:**

- Create: `packages/ai-tooling/src/recovery/run-lock.ts`
- Create: `packages/ai-tooling/tests/unit/run-lock.spec.ts`

**Interfaces:**

- Consumes: `parseStrictJson`, the unchanged Phase 1 state schema, `renderGeneratedJson`,
  `equalBytes`, `PortableRelativePath`, `Sha256Hex`, and `RunLockOwner`.
- Produces: `OrdinaryRunLockRecordV1`, `RecoveryRunLockRecordV1`, `RunLockRecordV1`,
  `RecoveryHandoffV1`, `RecoveryArchiveTerminalV1`, `parseCanonicalRunLock`,
  `parseCanonicalRecoveryHandoff`, and `parseCanonicalRecoveryArchiveTerminal`.

- [ ] **Step 1: Add the literal failing noncanonical-lock test**

```ts
import { describe, expect, it, vi } from 'vitest';
import { parseCanonicalRunLock } from '../../src/recovery/run-lock.js';

describe('run-lock parsing', () => {
  it('rejects noncanonical bytes before process liveness', () => {
    const liveness = { probe: vi.fn(), currentIdentity: vi.fn() };
    const bytes = new TextEncoder().encode(
      '{ "schemaVersion": 1, "providerId": "linux-procfs-v1", "host": "host", "pid": 12, "startMarker": "42", "operationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479", "nonce": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "operation": "sync", "phase": "pre-journal" }\n',
    );

    expect(() => parseCanonicalRunLock(bytes, 'linux-procfs-v1')).toThrowError(
      expect.objectContaining({
        diagnostic: expect.objectContaining({
          code: 'EVK_CONFIG_CAPABILITY_UNAVAILABLE',
          reason: 'run-lock-noncanonical',
        }),
      }),
    );
    expect(liveness.probe).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/run-lock.spec.ts --passWithNoTests=false --reporter=verbose -t "rejects noncanonical bytes before process liveness"
```

Expected RED: exit `1`; whitespace-reordered but semantically valid bytes are accepted or normalized.

- [ ] **Step 3: Add the literal canonical-byte gate**

```ts
import { ToolingError } from '../diagnostics/error.js';
import { parseStrictJson } from '../json/strict-json.js';
import { renderGeneratedJson } from '../json/render-json.js';
import { schemaRegistry } from '../json/schema-registry.js';
const RUN_LOCK_KEY_ORDER = [
  'schemaVersion',
  'providerId',
  'host',
  'pid',
  'startMarker',
  'operationId',
  'nonce',
  'operation',
  'phase',
  'generation',
  'acceptedPlanDigest',
  'targetOperation',
  'action',
  'archivedRunLockPath',
  'archivedRunLockDigest',
  'archivedRunLockByteLength',
  'journalPrefixRepair',
  'terminalArchiveRewrite',
] as const;

function runLockInvalid(reason: string): ToolingError {
  return new ToolingError({
    code: 'EVK_CONFIG_CAPABILITY_UNAVAILABLE',
    message: 'Run-lock evidence is invalid or noncanonical.',
    reason,
    fields: { capability: 'recovery.inspect', activeProfile: 'safe-core' },
    recoveryActions: ['Preserve .ai-tooling and current project bytes for inspection.'],
  });
}

export function parseCanonicalRunLock(
  bytes: Uint8Array,
  expectedProvider: RunLockRecordV1['providerId'],
): RunLockRecordV1 {
  const document = parseStrictJson(bytes, { kind: 'state', label: 'run-lock' });
  const value = schemaRegistry.validateStateDefinition('runLockRecordV1', document);
  if (value.providerId !== expectedProvider) throw runLockInvalid('run-lock-provider-mismatch');
  if (!equalBytes(bytes, renderGeneratedJson(value, RUN_LOCK_KEY_ORDER))) {
    throw runLockInvalid('run-lock-noncanonical');
  }
  validateRunLockCrossFields(value);
  return value;
}
```

`validateRunLockCrossFields` is an exhaustive discriminated-union function in this file. It accepts a
lowercase RFC 4122 UUID v4; exactly 43 base64url nonce characters; host of 1-255 UTF-8 bytes without
NUL/control; positive safe PID within the provider OS maximum; provider-specific bounded ASCII start
marker; exact ordinary versus recovery field sets; fixed archive/staging paths; lowercase SHA-256;
generation `1..1000000`; and exact recovery descriptor nullability. It rejects unknown fields before
this branch through the frozen state schema.

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; the parser returns `run-lock-noncanonical`, and no liveness method is called.

Add literal strict-JSON rows for duplicate/unknown fields, wrong types, overlong strings, malformed
UUID/nonce/host/start marker, zero/negative/fractional/unsafe/out-of-range PID, shell punctuation,
provider mismatch, every ordinary/recovery cross-pair, wrong fixed archive path, digest/length mismatch,
handoff predecessor/successor mismatch, recovery-terminal mismatch, and one-pass successor-then-
handoff construction. The successor never contains or hashes the enclosing handoff.

### Task 4.2.2: Probe Linux liveness from `/proc` without following metadata-selected paths

**Files:**

- Create: `packages/ai-tooling/src/recovery/linux-procfs.ts`
- Create: `packages/ai-tooling/tests/unit/liveness.spec.ts`
- Create: `packages/ai-tooling/tests/native/run-lock-liveness.native.spec.ts`

**Interfaces:**

- Consumes: a validated `RunLockOwner` with `providerId: 'linux-procfs-v1'` and injected fixed procfs
  reader/`process.kill` ports.
- Produces: `createLinuxProcfsLivenessProvider(): ProcessLivenessProvider` and exact verdicts
  `'live' | 'dead' | 'reused' | 'ambiguous'`.

- [ ] **Step 1: Add the literal failing final-parenthesis parser test**

```ts
import { expect, it, vi } from 'vitest';
import { createLinuxProcfsLivenessProvider } from '../../src/recovery/linux-procfs.js';

it('parses start time after the final process-name parenthesis', async () => {
  const readStat = vi.fn(async () => '123 (name ) with spaces) S 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 4242 0\n');
  const kill = vi.fn(() => undefined);
  const provider = createLinuxProcfsLivenessProvider({
    hostname: () => 'host',
    pid: () => 999,
    readStat,
    kill,
  });

  await expect(
    provider.probe({
      providerId: 'linux-procfs-v1',
      host: 'host',
      pid: 123,
      startMarker: '4242',
    }),
  ).resolves.toBe('live');
  expect(readStat).toHaveBeenCalledWith(123);
  expect(kill).toHaveBeenCalledWith(123, 0);
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/liveness.spec.ts tests/native/run-lock-liveness.native.spec.ts --passWithNoTests=false --reporter=verbose -t "parses start time after the final process-name parenthesis"
```

Expected RED: exit `1`; parsing splits on the first `)` or returns `ambiguous` instead of `live`.

- [ ] **Step 3: Add the literal Linux parser and verdict branch**

```ts
function parseLinuxStartMarker(stat: string): string | null {
  if (!stat.endsWith('\n') || stat.length > 4096) return null;
  const close = stat.lastIndexOf(')');
  if (close < 3 || stat[close + 1] !== ' ') return null;
  const fields = stat.slice(close + 2, -1).split(' ');
  const marker = fields[19];
  return marker !== undefined && /^(0|[1-9][0-9]*)$/.test(marker) ? marker : null;
}

async function probe(record: RunLockOwner): Promise<'live' | 'dead' | 'reused' | 'ambiguous'> {
  if (record.providerId !== 'linux-procfs-v1' || record.host !== dependencies.hostname()) {
    return 'ambiguous';
  }
  let stat: string;
  try {
    stat = await dependencies.readStat(record.pid);
  } catch (error) {
    return isNoSuchProcess(error) ? 'dead' : 'ambiguous';
  }
  const observed = parseLinuxStartMarker(stat);
  if (observed === null) return 'ambiguous';
  try {
    dependencies.kill(record.pid, 0);
  } catch (error) {
    return isNoSuchProcess(error) ? 'dead' : 'ambiguous';
  }
  return observed === record.startMarker ? 'live' : 'reused';
}
```

The production procfs reader opens only fixed `/proc/<validated-decimal-pid>/stat`, rejects a link or
non-regular result, caps the byte count, and identity-brackets the read. Metadata never supplies the
root, filename suffix, executable, option, or command.

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; the final-parenthesis row returns `live`, and the native Linux test proves a
live child, a terminated child, and a marker from another process.

Add literal rows for absent process, access denial, malformed/truncated/flooded stat, missing final LF,
invalid field 22, foreign host, provider mismatch, process disappearance between stat and kill,
different marker, and procfs identity race. Only absent process is `dead`; different marker is
`reused`; every uncertainty is `ambiguous`.

### Task 4.2.3: Probe macOS with one frozen `/bin/ps` command

**Files:**

- Create: `packages/ai-tooling/src/recovery/macos-ps.ts`
- Modify: `packages/ai-tooling/tests/unit/liveness.spec.ts`
- Modify: `packages/ai-tooling/tests/native/run-lock-liveness.native.spec.ts`

**Interfaces:**

- Consumes: validated macOS `RunLockOwner`, frozen no-link `/bin/ps` identity, monotonic clock, and
  injected argv-array spawn port.
- Produces: `createMacosPsLivenessProvider(): ProcessLivenessProvider`.

- [ ] **Step 1: Add the literal failing fixed-command test**

```ts
import { expect, it, vi } from 'vitest';
import { createMacosPsLivenessProvider } from '../../src/recovery/macos-ps.js';

it('uses fixed ps argv and an empty-base locale', async () => {
  const spawn = vi.fn(async () => ({
    kind: 'completed' as const,
    exitCode: 0,
    stdout: new TextEncoder().encode('Mon Aug  2 10:11:12 2026\n'),
    stderrBytes: 0,
  }));
  const executable = {
    path: '/bin/ps',
    identity: {
      os: 'posix' as const,
      nodeKind: 'file' as const,
      dev: 1n,
      ino: 2n,
      mode: 0o100755,
      size: 123n,
      ctimeNs: 1n,
      mtimeNs: 1n,
    },
    digest: '1'.repeat(64),
    assertIdentity: vi.fn(async () => undefined),
  };
  let now = 0n;
  const provider = createMacosPsLivenessProvider({
    hostname: () => 'host',
    executable: executable as never,
    spawn,
    now: () => {
      const value = now;
      now += 1_000_000n;
      return value;
    },
  });

  await provider.probe({
    providerId: 'macos-ps-v1',
    host: 'host',
    pid: 123,
    startMarker: 'Mon Aug  2 10:11:12 2026',
  });
  expect(spawn).toHaveBeenCalledWith({
    executable: '/bin/ps',
    argv: ['-o', 'lstart=', '-p', '123'],
    env: { LC_ALL: 'C' },
    shell: false,
    stdin: 'ignore',
    timeoutMs: 5000,
    ringBytes: 4096,
  });
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/liveness.spec.ts tests/native/run-lock-liveness.native.spec.ts --passWithNoTests=false --reporter=verbose -t "uses fixed ps argv and an empty-base locale"
```

Expected RED: exit `1`; the provider consults `PATH`, inherits locale/environment, builds a command
string, changes argv, or omits a bound.

- [ ] **Step 3: Add the literal request construction and output decoder**

```ts
const request = {
  executable: dependencies.executable.path,
  argv: ['-o', 'lstart=', '-p', String(record.pid)],
  env: { LC_ALL: 'C' },
  shell: false as const,
  stdin: 'ignore' as const,
  timeoutMs: 5000 as const,
  ringBytes: 4096 as const,
};
await dependencies.executable.assertIdentity();
const result = await dependencies.spawn(request);
await dependencies.executable.assertIdentity();
if (result.kind === 'not-found') return 'dead';
if (result.kind !== 'completed' || result.exitCode !== 0 || result.stderrBytes !== 0) return 'ambiguous';
const text = new TextDecoder('ascii', { fatal: true }).decode(result.stdout);
if (!/^[A-Z][a-z]{2} [A-Z][a-z]{2} [ 0-3][0-9] [0-2][0-9]:[0-5][0-9]:[0-5][0-9] [0-9]{4}\n$/.test(text)) {
  return 'ambiguous';
}
const marker = text.slice(0, -1);
return marker === record.startMarker ? 'live' : 'reused';
```

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; captured request equality is exact and the provider does not read ambient
environment.

Add literal rows for poisoned `PATH`/locale, identity substitution before/after spawn, missing process,
same-second ambiguity, extra/multiple/malformed/non-ASCII lines, 4 KiB exact/one-over stdout/stderr,
stall, signal, timeout, terminate/reap uncertainty, and child flood. All uncertainty is `ambiguous` and
starts no shell.

### Task 4.2.4: Extend the Win32 helper with exact process identity

**Files:**

- Modify: `packages/ai-tooling/native/win32-helper/protocol.h`
- Modify: `packages/ai-tooling/native/win32-helper/main.cc`
- Modify: `packages/ai-tooling/src/native/win32-helper.ts`
- Create: `packages/ai-tooling/src/recovery/windows-native.ts`
- Modify: `packages/ai-tooling/tests/unit/liveness.spec.ts`
- Modify: `packages/ai-tooling/tests/native/run-lock-liveness.native.spec.ts`

**Interfaces:**

- Consumes: existing version-1 length-prefixed helper transport and validated Windows owner.
- Produces: helper operation `process-identity` returning decimal unsigned 64-bit creation time and
  `createWindowsNativeLivenessProvider(): ProcessLivenessProvider`.

- [ ] **Step 1: Add the literal failing reused-PID response test**

```ts
import { expect, it, vi } from 'vitest';
import { createWindowsNativeLivenessProvider } from '../../src/recovery/windows-native.js';

it('classifies a changed Windows creation time as reused', async () => {
  const helper = {
    processIdentity: vi.fn(async () => ({ kind: 'present' as const, creationTime: '133801234567890000' })),
  };
  const provider = createWindowsNativeLivenessProvider({ hostname: () => 'host', helper });

  await expect(
    provider.probe({
      providerId: 'windows-native-v1',
      host: 'host',
      pid: 4321,
      startMarker: '133801234567890001',
    }),
  ).resolves.toBe('reused');
  expect(helper.processIdentity).toHaveBeenCalledWith(4321);
});
```

- [ ] **Step 2: Run the named test and require RED on Windows**

Run:

```text
pnpm --filter @evk-soft/ai-tooling run build:native && pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/liveness.spec.ts tests/native/run-lock-liveness.native.spec.ts --passWithNoTests=false --reporter=verbose -t "classifies a changed Windows creation time as reused"
```

Expected RED: on `win32-x64`, exit `1`; the freshly built helper lacks `process-identity` or a changed
creation time is treated as dead. The test may tuple-skip elsewhere only with the asserted matrix count.

- [ ] **Step 3: Add the literal TypeScript verdict and native API branch**

```ts
async probe(record: RunLockOwner): Promise<'live' | 'dead' | 'reused' | 'ambiguous'> {
  if (record.providerId !== 'windows-native-v1' || record.host !== dependencies.hostname()) {
    return 'ambiguous';
  }
  const result = await dependencies.helper.processIdentity(record.pid);
  if (result.kind === 'absent') return 'dead';
  if (result.kind !== 'present') return 'ambiguous';
  return result.creationTime === record.startMarker ? 'live' : 'reused';
}
```

```cpp
HANDLE process = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, request.pid);
if (process == nullptr) {
  return GetLastError() == ERROR_INVALID_PARAMETER
      ? ReplyProcessAbsent()
      : ReplyProcessAmbiguous();
}
FILETIME creation{}, exit_time{}, kernel{}, user{};
if (!GetProcessTimes(process, &creation, &exit_time, &kernel, &user)) {
  CloseHandle(process);
  return ReplyProcessAmbiguous();
}
const uint64_t marker =
    (static_cast<uint64_t>(creation.dwHighDateTime) << 32U) |
    static_cast<uint64_t>(creation.dwLowDateTime);
CloseHandle(process);
return ReplyProcessPresent(ToCanonicalUnsignedDecimal(marker));
```

The helper validates PID as `1..4294967295`, accepts no executable/path/flag from metadata, and returns
only the closed present/absent/ambiguous response. Protocol truncation, extra bytes, invalid tag/version,
helper substitution, timeout, or termination uncertainty decodes to `ambiguous`.

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: on `win32-x64`, exit `0`; changed creation time is `reused`, and native live/
terminated child assertions pass.

### Task 4.2.5: Centralize stale-owner eligibility

**Files:**

- Create: `packages/ai-tooling/src/recovery/liveness.ts`
- Modify: `packages/ai-tooling/tests/unit/liveness.spec.ts`

**Interfaces:**

- Consumes: canonical `RunLockRecordV1`, the platform-selected `ProcessLivenessProvider`, and exact
  current host/provider identity.
- Produces: `classifyRunLockOwner(record, provider): Promise<'active' | 'stale' | 'blocked'>` and
  `createProcessLivenessProvider(platform): ProcessLivenessProvider`.

- [ ] **Step 1: Add the literal failing verdict table**

```ts
import { expect, it } from 'vitest';
import { classifyRunLockOwner } from '../../src/recovery/liveness.js';

it.each([
  ['live', 'active'],
  ['dead', 'stale'],
  ['reused', 'blocked'],
  ['ambiguous', 'blocked'],
] as const)('maps %s ownership to %s', async (probe, expected) => {
  const provider = {
    currentIdentity: async () => ({
      providerId: 'linux-procfs-v1' as const,
      host: 'host',
      pid: 999,
      startMarker: '999',
    }),
    probe: async () => probe,
  };
  const record = {
    schemaVersion: 1 as const,
    providerId: 'linux-procfs-v1' as const,
    host: 'host',
    pid: 12,
    startMarker: '12',
    operationId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    nonce: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    operation: 'sync' as const,
    phase: 'journal-ready' as const,
  };
  await expect(classifyRunLockOwner(record, provider)).resolves.toBe(expected);
});
```

- [ ] **Step 2: Run the named table and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/liveness.spec.ts --passWithNoTests=false --reporter=verbose -t "maps"
```

Expected RED: exit `1`; reused or ambiguous is classified stale, or live is not active.

- [ ] **Step 3: Add the literal closed mapping**

```ts
export async function classifyRunLockOwner(
  record: RunLockRecordV1,
  provider: ProcessLivenessProvider,
): Promise<'active' | 'stale' | 'blocked'> {
  const current = await provider.currentIdentity();
  if (record.providerId !== current.providerId || record.host !== current.host) return 'blocked';
  const result = await provider.probe(record);
  if (result === 'live') return 'active';
  if (result === 'dead') return 'stale';
  return 'blocked';
}
```

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; only exact same-host `dead` is stale.

Add rows for provider mismatch, foreign host, current-identity failure, out-of-range PID caught before
provider call, and native provider unsupported tuple. Every blocked row records zero gateway mutation
calls.

## 4.3 Transactions and journals

### Task 4.3.1: Freeze mutation-plan projection, bounded review output, and confirmation

**Files:**

- Create: `packages/ai-tooling/src/transaction/types.ts`
- Create: `packages/ai-tooling/src/transaction/mutation-plan.ts`
- Create: `packages/ai-tooling/tests/unit/mutation-plan-digest.spec.ts`
- Create: `packages/ai-tooling/tests/fixtures/mutation-plan-digest/vectors.json`

**Interfaces:**

- Consumes: IC-13 types and limits, `jcsBytes`, `sha256Bytes`, Unicode 17 portable ordering,
  `BoundedMutationReviewSource`, `CliOutputSink`, `ConfirmationInput`, and exact operation-specific
  contributors/refresh/recovery projections.
- Produces: `mutationPlanDigestProjection(plan): MutationPlanDigestProjectionV1`,
  `streamMutationPlanOutput(plan, format, sink, limits)`, `confirmMutationPlan(plan, io)`,
  `ConfirmedMutationPlan`, `ConfirmedRestorePlan`, and `ConfirmedRecoveryPlan`.

- [ ] **Step 1: Add the literal failing digest-binding test**

```ts
import { expect, it } from 'vitest';
import {
  mutationPlanDigestProjection,
  mutationPlanDigest,
} from '../../src/transaction/mutation-plan.js';
import { sha256Bytes } from '../../src/json/jcs.js';

it('changes the accepted digest when candidate bytes change', () => {
  const makePlan = (bytes: Uint8Array) => ({
    operation: 'sync' as const,
    entries: [
      {
        path: { relativePath: 'AGENTS.md', ancestors: [] },
        observed: { kind: 'absent' as const },
        candidate: {
          kind: 'file' as const,
          bytes,
          digest: sha256Bytes(bytes),
          byteLength: bytes.byteLength,
          mode: '100644' as const,
        },
        review: {
          before: null,
          after: {
            digest: sha256Bytes(bytes),
            byteLength: bytes.byteLength,
            async *open() { yield bytes; },
          },
          contributors: [],
        },
      },
    ],
    planDigest: '0'.repeat(64),
    refresh: null,
  });
  const first = makePlan(new Uint8Array([0x61])) as never;
  const second = makePlan(new Uint8Array([0x62])) as never;

  expect(mutationPlanDigestProjection(first)).toStrictEqual({
    schemaVersion: 1,
    operationId: null,
    operation: 'sync',
    entries: [
      {
        path: 'AGENTS.md',
        observed: { kind: 'absent' },
        candidate: {
          kind: 'file',
          digest: first.entries[0]!.candidate.digest,
          byteLength: 1,
          mode: '100644',
        },
        contributors: [],
      },
    ],
    recovery: null,
    refresh: null,
  });
  expect(mutationPlanDigest(first)).not.toBe(mutationPlanDigest(second));
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/mutation-plan-digest.spec.ts --passWithNoTests=false --reporter=verbose -t "changes the accepted digest when candidate bytes change"
```

Expected RED: exit `1`; candidate bytes are omitted, native identity leaks into the projection, or
different candidates receive the same digest.

- [ ] **Step 3: Add the literal projection and digest implementation**

```ts
export function mutationPlanDigestProjection(
  plan: MutationPlan | RecoveryPlan | RestorePlan,
): MutationPlanDigestProjectionV1 {
  assertOperationShape(plan);
  const entries = [...plan.entries]
    .sort(comparePlannedPathMutation)
    .map((entry): MutationPlanDigestEntryV1 => ({
      path: entry.path.relativePath,
      observed: projectObservedPath(entry.observed),
      candidate: projectDesiredPath(entry.candidate),
      contributors: projectContributors(plan.operation, entry.review.contributors),
    }));
  assertUniquePortableEntries(entries);
  return {
    schemaVersion: 1,
    operationId: plan.operation === 'repair' ? plan.operationId : null,
    operation: plan.operation,
    entries,
    recovery: plan.operation === 'repair' ? plan.recovery : null,
    refresh: plan.operation === 'refresh-local' ? plan.refresh : null,
  };
}

export function mutationPlanDigest(
  plan: MutationPlan | RecoveryPlan | RestorePlan,
): Sha256Hex {
  return sha256Bytes(jcsBytes(mutationPlanDigestProjection(plan)));
}
```

`projectObservedPath` converts every nonnegative native `bigint` to canonical unsigned decimal,
requires POSIX mode and Win32 attributes to be unsigned 32-bit JSON integers, and requires Win32
file ID to be 32 lowercase hex digits. Candidate bytes and absolute paths never enter the projection.
Directory candidates have only `kind` and `mode`; file candidates must match actual bytes, digest,
length, and review source. Restore and generated create/replace contributors are exact; delete,
config, lock, directory, report, and recovery contributors are empty. `refresh` is non-null only for
`refresh-local`; `recovery` is non-null only for `repair`.

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; exact projection equality passes and byte change alters the digest.

Before this task closes, add literal tests for absent/file/link/directory observations; POSIX and
Win32 identities; directory/create/replace/delete; restore preimages; archive-only and ordinary
recovery evidence; negative/noncanonical/out-of-range numeric fields; file-ID errors; duplicate/
portable-colliding paths; missing/swapped review sources; digest/length/stream mismatch; contributor
omission/invention/reorder; refresh tag/pack/digest mismatch; and recovery action/evidence mismatch.

Add the exact bounded output tests in the same microcycle: 32 MiB per diff, 48 MiB aggregate diffs,
64 MiB complete output, 65-byte confirmation frame, exact-at/one-over, JSON escape amplification,
split UTF-8/control/bidi, slow sink, backpressure, flush failure, EPIPE, EOF, CRLF, NUL, uppercase,
short/long/extra-line, and two delivered frames. The renderer has no filesystem port, consumes only
branded review streams, counts encoded bytes before every awaited write, emits no additional stdout,
and reads confirmation only after successful output flush. Every failure creates zero local-state or
target bytes.

### Task 4.3.2: Encode and parse append-only journal frames

**Files:**

- Create: `packages/ai-tooling/src/transaction/journal.ts`
- Create: `packages/ai-tooling/tests/unit/journal.spec.ts`

**Interfaces:**

- Consumes: `JournalFrameV1`, strict bounded JCS payload parsing, SHA-256, and the unchanged state
  schema definitions.
- Produces: `serializeJournalFrame(frame): Uint8Array`,
  `parseJournal(bytes): ParsedJournal`, `JournalHeaderDigest`, and exact next-frame-prefix
  classification.

- [ ] **Step 1: Add the literal failing sequence-0 frame vector**

```ts
import { expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { serializeJournalFrame } from '../../src/transaction/journal.js';

it('serializes the complete sequence-zero header with EVKJ framing', () => {
  const frame = {
    sequence: 0 as const,
    type: 'header' as const,
    payload: {
      operationId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      nonce: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      operation: 'sync' as const,
      planDigest: '1'.repeat(64),
      priorLockState: { kind: 'present' as const, sha256: '2'.repeat(64) },
      candidateLockState: { kind: 'present' as const, sha256: '3'.repeat(64) },
      plannedMutations: [],
      runLockAdvanceStagingPath: '.ai-tooling/.run-lock-advance-f47ac10b-58cc-4372-a567-0e02b2c3d479-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA.stage',
      journalReadyRunLockDigest: '4'.repeat(64),
      journalReadyRunLockByteLength: 512,
    },
  } as never;
  const bytes = serializeJournalFrame(frame);
  const payload = jcsBytes(frame.payload);
  const prefix = new Uint8Array(14 + payload.byteLength);
  prefix.set(new TextEncoder().encode('EVKJ'), 0);
  prefix[4] = 1;
  prefix[5] = 0;
  new DataView(prefix.buffer).setUint32(6, 0, true);
  new DataView(prefix.buffer).setUint32(10, payload.byteLength, true);
  prefix.set(payload, 14);
  const digest = createHash('sha256').update(prefix).digest();

  expect(bytes).toStrictEqual(new Uint8Array([...prefix, ...digest]));
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/journal.spec.ts --passWithNoTests=false --reporter=verbose -t "serializes the complete sequence-zero header with EVKJ framing"
```

Expected RED: exit `1`; magic/version/type/sequence/payload length endianness or trailing SHA-256
differs from the exact frame.

- [ ] **Step 3: Add the literal frame encoder**

```ts
const FRAME_MAGIC = new TextEncoder().encode('EVKJ');
const FRAME_VERSION = 1;
const FRAME_DIGEST_BYTES = 32;

export function serializeJournalFrame(frame: JournalFrameV1): Uint8Array {
  const payload = jcsBytes(frame.payload);
  if (payload.byteLength > 0xffff_ffff) throw journalError('journal-payload-too-large');
  const prefix = new Uint8Array(14 + payload.byteLength);
  prefix.set(FRAME_MAGIC, 0);
  prefix[4] = FRAME_VERSION;
  prefix[5] = journalTypeByte(frame.type);
  const view = new DataView(prefix.buffer, prefix.byteOffset, prefix.byteLength);
  view.setUint32(6, frame.sequence, true);
  view.setUint32(10, payload.byteLength, true);
  prefix.set(payload, 14);
  const digest = sha256Raw(prefix);
  const complete = new Uint8Array(prefix.byteLength + FRAME_DIGEST_BYTES);
  complete.set(prefix, 0);
  complete.set(digest, prefix.byteLength);
  return complete;
}
```

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; exact literal frame bytes match.

Then add one literal crash fixture for every byte of every frame. Parsing accepts contiguous sequence
starting at header `0` and at most one EOF tail that is an exact prefix of the unique canonical next
frame implied by the valid header/prefix. It rejects partial sequence 0, a second tail, wrong prefix,
wrong sequence/type/length/digest, corruption before EOF, full invalid frame, type/payload cross-pair,
unknown payload field, noncontiguous/overflowing sequence, and any bytes after a terminal frame.
`JournalHeaderDigest` is SHA-256 of the entire complete sequence-0 frame and must equal the header-only
journal file digest; payload-only and later whole-file digests are rejected.

### Task 4.3.3: Build canonical planned mutations and preflight worst-case journal size

**Files:**

- Create: `packages/ai-tooling/src/transaction/backup-store.ts`
- Create: `packages/ai-tooling/src/transaction/transaction-manager.ts`
- Create: `packages/ai-tooling/tests/unit/transaction-manager.spec.ts`

**Interfaces:**

- Consumes: immediately revalidated accepted plan, IC-12 path/name grammar, `MutationStep`, and all
  possible forward/rollback/terminal frames.
- Produces: `buildJournalHeader(plan, operationId, nonce): JournalHeaderPayloadV1` and
  `preflightJournalSize(header): number` bounded at 67,108,864 bytes.

- [ ] **Step 1: Add the literal failing lock-last ordering test**

```ts
import { expect, it } from 'vitest';
import { buildJournalHeader } from '../../src/transaction/transaction-manager.js';
import { sha256Bytes } from '../../src/json/jcs.js';

it('assigns shallow directories first and the repository lock last', () => {
  const directories = new Set([
    '.agents',
    '.claude',
    '.agents/skills',
    '.claude/rules',
    '.claude/skills',
    '.agents/skills/evk-plan',
    '.claude/skills/evk-plan',
  ]);
  const paths = [
    '.agents',
    '.claude',
    '.agents/skills',
    '.claude/rules',
    '.claude/skills',
    '.agents/skills/evk-plan',
    '.claude/skills/evk-plan',
    '.agents/skills/evk-plan/SKILL.md',
    '.claude/rules/evk-grounding.md',
    '.claude/skills/evk-plan/SKILL.md',
    'AGENTS.md',
    'CLAUDE.md',
    'ai-tooling.config.json',
    'ai-tooling.lock.json',
  ];
  const bytes = new TextEncoder().encode('x\n');
  const plan = {
    operation: 'init' as const,
    entries: [...paths].reverse().map((path) => ({
      path: { relativePath: path, ancestors: [] },
      observed: { kind: 'absent' as const },
      candidate: directories.has(path)
        ? { kind: 'directory' as const, mode: 'directory' as const }
        : {
            kind: 'file' as const,
            bytes,
            digest: sha256Bytes(bytes),
            byteLength: bytes.byteLength,
            mode: '100644' as const,
          },
      review: {
        before: null,
        after: directories.has(path)
          ? null
          : {
              digest: sha256Bytes(bytes),
              byteLength: bytes.byteLength,
              async *open() { yield bytes; },
            },
        contributors: [],
      },
    })),
    planDigest: '1'.repeat(64),
    acceptedDigest: '1'.repeat(64),
    refresh: null,
  };
  const header = buildJournalHeader(
    plan as never,
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  );
  expect(header.plannedMutations.map(({ step, path }) => [step, path])).toStrictEqual([
    [1, '.agents'],
    [2, '.claude'],
    [3, '.agents/skills'],
    [4, '.claude/rules'],
    [5, '.claude/skills'],
    [6, '.agents/skills/evk-plan'],
    [7, '.claude/skills/evk-plan'],
    [8, '.agents/skills/evk-plan/SKILL.md'],
    [9, '.claude/rules/evk-grounding.md'],
    [10, '.claude/skills/evk-plan/SKILL.md'],
    [11, 'AGENTS.md'],
    [12, 'CLAUDE.md'],
    [13, 'ai-tooling.config.json'],
    [14, 'ai-tooling.lock.json'],
  ]);
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/transaction-manager.spec.ts --passWithNoTests=false --reporter=verbose -t "assigns shallow directories first and the repository lock last"
```

Expected RED: exit `1`; input order leaks into steps, a descendant precedes its directory, or lock is
not last.

- [ ] **Step 3: Add the literal canonical ordering function**

```ts
function mutationOrder(left: PlannedPathMutation, right: PlannedPathMutation): number {
  const leftLock = left.path.relativePath === 'ai-tooling.lock.json';
  const rightLock = right.path.relativePath === 'ai-tooling.lock.json';
  if (leftLock !== rightLock) return leftLock ? 1 : -1;
  const leftDirectory = left.candidate.kind === 'directory';
  const rightDirectory = right.candidate.kind === 'directory';
  if (leftDirectory && rightDirectory) {
    const depth = left.path.relativePath.split('/').length - right.path.relativePath.split('/').length;
    if (depth !== 0) return depth;
  } else if (leftDirectory !== rightDirectory) {
    return leftDirectory ? -1 : 1;
  }
  return comparePortablePaths(left.path.relativePath, right.path.relativePath);
}

export function buildJournalHeader(
  plan: ConfirmedMutationPlan | ConfirmedRestorePlan,
  operationId: string,
  nonce: string,
): JournalHeaderPayloadV1 {
  const entries = [...plan.entries].sort(mutationOrder);
  if (entries.length > 100000) throw transactionLimit('managed-path-count', 100000);
  const plannedMutations = entries.map((entry, index) =>
    projectJournalMutation(entry, asMutationStep(index + 1), operationId, nonce),
  );
  const header = createHeaderPayload(plan, operationId, nonce, plannedMutations);
  preflightJournalSize(header);
  return header;
}
```

`preflightJournalSize` serializes or length-computes the header, every forward intent/completion,
both possible terminal frames, every reverse rollback intent/completion, and framing/digest overhead
with checked safe-integer arithmetic. A total over 64 MiB, duplicate/missing step, plan/header mismatch,
or candidate/backup/stage descriptor mismatch fails before `.ai-tooling` creation.

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; exact step/path array matches.

Add vectors for steps `0`, `100001`, fractional/unsafe, duplicate/out-of-order, filename spellings
`000000`, `00001`, `100001`, and independent journal sequence overflow. A file candidate requires its
non-null target stage triple; directory/delete uses null/null/zero. Every prior regular file requires
independent backup and rollback-stage triples; other priors use null/null/zero. Restore with a current
file additionally requires one retained-preimage descriptor; all other entries require null.

### Task 4.3.4: Enforce all-intents barriers and direction-specific capabilities

**Files:**

- Modify: `packages/ai-tooling/src/transaction/journal.ts`
- Modify: `packages/ai-tooling/tests/unit/journal.spec.ts`

**Interfaces:**

- Consumes: canonical parsed journal, header, exact expected observation, and branded
  `ConfirmedJournalAction`.
- Produces: `JournalWriter.ensureAllForwardIntents` and `ensureAllRollbackIntents`, issuing only
  direction-specific `DurableStagingIntent`, `DurableBackupIntent`, `RetainedPreimageAuthority`, or
  `DurableRollbackStagingIntent` after the complete barrier is flushed.

- [ ] **Step 1: Add the literal failing incomplete-forward-barrier test**

```ts
import { expect, it } from 'vitest';

it('mints no forward capability until every intent marker is durable', async () => {
  const fixture = journalWriterFixture({ plannedSteps: 2, durableForwardMarkers: 1 });
  fixture.gateway.failAppendAtSequence(2);

  await expect(
    fixture.writer.ensureAllForwardIntents(
      fixture.journalRef,
      fixture.journalObservation,
      fixture.header,
      fixture.completeAction,
    ),
  ).rejects.toMatchObject({ diagnostic: { reason: 'journal-append-failed' } });
  expect(fixture.issuedForwardAuthorities()).toStrictEqual([]);
  expect(fixture.targetMutationCalls()).toStrictEqual([]);
});
```

`journalWriterFixture` is defined literally in the same test file around a two-entry header, exact
serialized prefix, gateway append spy, and a private issuer log. The issuer log is test observation,
not a brand constructor.

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/journal.spec.ts --passWithNoTests=false --reporter=verbose -t "mints no forward capability until every intent marker is durable"
```

Expected RED: exit `1`; step 1 authority is exposed before step 2 marker flush or a target method is
called.

- [ ] **Step 3: Add the literal two-pass forward barrier**

```ts
async ensureAllForwardIntents(
  journal: ContainedPathRef,
  expectedJournal: Extract<ObservedPathState, { readonly kind: 'file' }>,
  header: JournalHeaderPayloadV1,
  action: ConfirmedJournalAction & { readonly action: 'complete' },
): Promise<ForwardIntentBarrier> {
  assertConfirmedAction(action, header, 'complete');
  let observation = expectedJournal;
  const parsed = await this.readAndValidate(journal, observation, header);
  assertCanonicalForwardPrefix(parsed, header);
  for (let index = parsed.forwardIntentCount; index < header.plannedMutations.length; index += 1) {
    const mutation = header.plannedMutations[index]!;
    const frame = forwardIntentFrame(parsed.nextSequence + index - parsed.forwardIntentCount, mutation);
    observation = await this.gateway.appendJournalFrameVerified(
      journal,
      observation,
      frame.sequence,
      serializeJournalFrame(frame),
    );
  }
  const complete = await this.readAndValidate(journal, observation, header);
  if (complete.forwardIntentCount !== header.plannedMutations.length) {
    throw journalError('forward-intent-barrier-incomplete');
  }
  return issueForwardBarrier(header, action, observation);
}
```

Rollback accepts a forward prefix of `0..N` only while there is zero mutation evidence, appends the
missing forward suffix in seal-only mode without issuing forward capabilities, appends the complete
reverse-order rollback barrier, flushes it, and only then issues rollback-stage capabilities. The only
mixed-direction grammar is full forward barrier followed by reverse barrier. Interleaved, duplicate,
extra, mismatched, partial-final, or post-terminal frames issue nothing.

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; failed second append exposes no authority and calls no target method.

Add restart rows after every marker, forward prefix lengths `0`, `1`, `N-1`, `N`, partial forward
frame, complete existing barrier, and every reverse prefix. A fresh process may reissue capabilities
only after validating the complete corresponding barrier; caller-supplied mixed arrays and cross-
direction replay fail before append or mutation.

### Task 4.3.5: Acquire the sole transaction authority after infrastructure rebinding

**Files:**

- Modify: `packages/ai-tooling/src/transaction/transaction-manager.ts`
- Modify: `packages/ai-tooling/tests/unit/transaction-manager.spec.ts`
- Modify: `packages/ai-tooling/tests/native/transaction-recovery.native.spec.ts`

**Interfaces:**

- Consumes: confirmed plan, shared prerequisite verifier, `RepositoryFilesystem`, canonical header,
  liveness current identity, secure UUID/nonce sources, and the exact four structural prerequisites.
- Produces: `TransactionManager.apply`, `restore`, and internal
  `acquireOrdinaryTransaction(plan): OrdinaryTransactionAuthority` in `journal-ready` phase.

- [ ] **Step 1: Add the literal failing concurrent-first-init test**

```ts
import { expect, it } from 'vitest';

it('gives only the run-lock winner transaction authority', async () => {
  const fixture = concurrentFirstTransactionFixture();
  const [left, right] = await Promise.allSettled([
    fixture.left.acquire(fixture.leftPlan),
    fixture.right.acquire(fixture.rightPlan),
  ]);
  const fulfilled = [left, right].filter(
    (result): result is PromiseFulfilledResult<unknown> => result.status === 'fulfilled',
  );
  const rejected = [left, right].filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  );

  expect(fulfilled).toHaveLength(1);
  expect(rejected).toHaveLength(1);
  expect(fixture.runLockCreateSuccesses()).toBe(1);
  expect(fixture.managedMutationCalls()).toStrictEqual([]);
  expect(fixture.infrastructureRemovals()).toStrictEqual([]);
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/transaction-manager.spec.ts tests/native/transaction-recovery.native.spec.ts --passWithNoTests=false --reporter=verbose -t "gives only the run-lock winner transaction authority"
```

Expected RED: exit `1`; both callers reach managed mutation, a second authority is created, or the
loser removes a shared infrastructure directory.

- [ ] **Step 3: Add the literal acquisition order**

```ts
private async acquireOrdinaryTransaction(
  plan: ConfirmedMutationPlan | ConfirmedRestorePlan,
): Promise<OrdinaryTransactionAuthority> {
  await this.revalidateAcceptedPlan(plan);
  const headerInput = this.prepareHeaderInput(plan);
  preflightJournalSize(headerInput.header);
  await this.prerequisite.assertReady(this.readOnlyContext);
  const roots = await this.ensureInfrastructureRoots([
    '.ai-tooling',
    '.ai-tooling/transactions',
    '.ai-tooling/backups',
    '.ai-tooling/stale-locks',
  ]);
  await this.prerequisite.assertReady(this.readOnlyContext);
  await this.assertBenignLocalStatePrefix(roots);
  const runLock = await this.filesystem.createRunLockExclusive(
    roots.state,
    roots.stateLocator,
    { kind: 'absent' },
    headerInput.preJournalRunLockBytes,
  );
  const header = await this.filesystem.createJournalHeaderExclusive(
    roots.transactions,
    roots.transactionsLocator,
    headerInput.operationId,
    { kind: 'absent' },
    headerInput.headerFrameBytes,
  );
  const action = await this.actionConfirmer.confirmOrdinary(plan, headerInput.header, 'complete');
  const ready = await this.filesystem.advanceRunLockVerified(
    roots.runLock,
    runLock,
    roots.journal,
    header.journal,
    headerInput.journalReadyRunLockBytes,
    action,
    header.advanceRunLock,
  );
  return createOrdinaryTransactionAuthority(roots, headerInput.header, ready, header.journal, action);
}
```

`ensureInfrastructureRoots` creates only an exact absent prefix, one level at a time, flushes each
parent, discards descendant refs after each create, resolves again, captures returned locators, and
re-lists the parent. Before the run lock it repeats the strict local-state census. Unknown sibling,
link/reparse, identity change, unexpected temp, or non-benign known entry blocks. A loser never removes
these shared prerequisites.

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; exactly one run-lock create succeeds, and neither caller mutates managed
paths during acquisition.

Add crash rows before/after each root create/flush, run-lock byte/flush, header byte/flush, and advance
stage/write/publish/flush. Before run lock, an exact empty structural prefix may be completed without
repair. Partial/malformed run lock or header is blocking evidence. Exact pre-journal/no journal and
pre-journal/exact header states classify according to the approved recovery grammar; no other root
coordination object exists.

### Task 4.3.6: Apply the forward transaction with lock last

**Files:**

- Modify: `packages/ai-tooling/src/transaction/transaction-manager.ts`
- Modify: `packages/ai-tooling/tests/unit/transaction-manager.spec.ts`

**Interfaces:**

- Consumes: `OrdinaryTransactionAuthority`, complete forward barrier, immediately rerendered candidate,
  gateway methods, and canonical header entries.
- Produces: candidate `TransactionOutcome`, lock-last forward execution, terminal committed frame, and
  post-commit retained-preimage publication.

- [ ] **Step 1: Add the literal failing lock-last call-order test**

```ts
import { expect, it } from 'vitest';

it('writes the repository lock after every managed leaf', async () => {
  const fixture = forwardTransactionFixture();
  await fixture.manager.apply(fixture.confirmedPlan);

  expect(fixture.callOrder()).toStrictEqual([
    'rerender-and-revalidate',
    'append-all-forward-intents',
    'create:.agents',
    'create-file:AGENTS.md',
    'complete:AGENTS.md',
    'replace:ai-tooling.lock.json',
    'complete:ai-tooling.lock.json',
    'verify-candidate-tree-and-lock',
    'append:committed',
    'publish-retained-preimages',
    'cleanup-transient-backups',
    'delete:run.lock',
    'cleanup-terminal-journal',
  ]);
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/transaction-manager.spec.ts --passWithNoTests=false --reporter=verbose -t "writes the repository lock after every managed leaf"
```

Expected RED: exit `1`; lock is written early, a mutation precedes the complete intent barrier, or
cleanup precedes committed verification.

- [ ] **Step 3: Add the literal forward execution skeleton**

```ts
private async executeForward(authority: OrdinaryTransactionAuthority): Promise<TransactionOutcome> {
  const rerendered = await this.rerenderAndRevalidate(authority.plan);
  assertPlanEqualsHeader(rerendered, authority.header);
  const barrier = await this.journal.ensureAllForwardIntents(
    authority.roots.journal,
    authority.journal,
    authority.header,
    authority.completeAction,
  );
  let journal = barrier.journal;
  for (const step of barrier.steps) {
    const mutation = authority.header.plannedMutations[step.step - 1]!;
    await this.applyOneForwardMutation(authority, mutation, step);
    journal = await this.appendCompletion(authority, journal, mutation);
  }
  await this.verifyCompleteTreeAndLock(authority.header, 'candidate');
  const terminal = await this.filesystem.appendTerminalFrameVerified(
    authority.roots.journal,
    journal,
    this.nextSequence(journal),
    this.committedFrame(authority.header),
    authority.completeAction,
    authority.header,
  );
  for (const retained of terminal.retainedPreimages) {
    await this.publishCommittedRetainedPreimage(authority, retained);
  }
  await this.cleanupVerifiedTransientEvidence(authority, 'candidate');
  await this.releaseExactRunLock(authority);
  await this.cleanupExactTerminalJournalBestEffort(authority, terminal.journal);
  return { kind: 'committed', operationId: authority.header.operationId };
}
```

`applyOneForwardMutation` uses the returned branded capability for exactly that step. Directories are
created before descendants and force descendant ref rebinding. Prior files are backed up before
replace/delete. File candidate stages, retained-preimage stages, directory creates, managed paths, and
repository lock cannot begin until the full forward barrier is durable. Completion is appended and
flushed after each step. Candidate verification includes full tree plus explicit candidate lock state.

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; exact order matches and no early lock/cleanup call exists.

Add failure injection immediately before/after candidate revalidation, every marker, stage byte/flush,
publish, unlink, parent flush, target race, backup, directory create/rebind, output replacement,
lock-last replacement, final verification, terminal append/flush, retained publication, every backup
cleanup, run-lock release, and journal cleanup. Every state must be full prior, full candidate, or one
documented recoverable journal state.

### Task 4.3.7: Roll back the complete prior tree before releasing evidence

**Files:**

- Create: `packages/ai-tooling/src/transaction/rollback.ts`
- Modify: `packages/ai-tooling/src/transaction/transaction-manager.ts`
- Modify: `packages/ai-tooling/tests/unit/transaction-manager.spec.ts`

**Interfaces:**

- Consumes: journal-ready authority, canonical header, complete rollback barrier, verified backups,
  rollback stages, and prior lock state.
- Produces: `rollbackTransaction(authority): Promise<TransactionOutcome>` and terminal
  `rolled-back` behavior.

- [ ] **Step 1: Add the literal failing prior-absent-lock test**

```ts
import { expect, it } from 'vitest';

it('restores a first init to an absent repository lock before cleanup', async () => {
  const fixture = rollbackFixture({ priorLockState: { kind: 'absent' } });
  const outcome = await fixture.rollback();

  expect(outcome).toStrictEqual({ kind: 'rolled-back', operationId: fixture.operationId });
  expect(fixture.callOrder()).toContain('verify-prior-lock:absent');
  expect(fixture.callOrder().indexOf('append:rolled-back')).toBeGreaterThan(
    fixture.callOrder().indexOf('verify-prior-lock:absent'),
  );
  expect(fixture.callOrder().indexOf('delete:backup')).toBeGreaterThan(
    fixture.callOrder().indexOf('append:rolled-back'),
  );
  expect(fixture.repositoryLockState()).toStrictEqual({ kind: 'absent' });
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/transaction-manager.spec.ts --passWithNoTests=false --reporter=verbose -t "restores a first init to an absent repository lock before cleanup"
```

Expected RED: exit `1`; rollback leaves a lock, deletes backup early, or appends terminal before prior
verification.

- [ ] **Step 3: Add the literal rollback ordering**

```ts
export async function rollbackTransaction(
  authority: JournalReadyTransactionAuthority,
): Promise<TransactionOutcome> {
  const action = await authority.actionConfirmer.confirmOrdinary(
    authority.plan,
    authority.header,
    'rollback',
  );
  const barrier = await authority.journal.ensureAllRollbackIntents(
    authority.journalRef,
    authority.journalObservation,
    authority.header,
    action,
  );
  let journal = barrier.journal;
  for (const step of [...barrier.steps].sort((a, b) => b.step - a.step)) {
    const mutation = authority.header.plannedMutations[step.step - 1]!;
    await authority.restoreOnePriorMutation(mutation, step);
    journal = await authority.appendRollbackCompletion(journal, mutation);
  }
  await authority.verifyCompleteTreeAndLock('prior');
  const terminal = await authority.filesystem.appendTerminalFrameVerified(
    authority.journalRef,
    journal,
    authority.nextSequence(journal),
    authority.rolledBackFrame(),
    action,
    authority.header,
  );
  await authority.cleanupVerifiedTransientEvidence('prior');
  await authority.releaseExactRunLock();
  await authority.cleanupExactTerminalJournalBestEffort(terminal.journal);
  return { kind: 'rolled-back', operationId: authority.header.operationId };
}
```

Rollback creates no source-derived candidate, uses header entries and journal-bound backups, stages
verified prior-file copies, restores a prior absent/present lock explicitly, removes only unchanged
transaction-created empty directories in reverse depth, and preserves the `.ai-tooling` root. It
front-loads and flushes every reverse marker before the first rollback mutation.

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; first init returns to absent lock and cleanup follows `rolled-back`.

Add rows for prior present unchanged/changed lock, rollback of create/replace/delete/directory, external
child in created directory, backup drift, every rollback-stage prefix/full/non-prefix, source pack
changed/removed after crash, failure before/after terminal append, every evidence delete, run-lock
release, and terminal cleanup. On any rollback or verification failure, retain run lock, journal,
backups, and stages and return `interrupted`; there is no unjournaled on-disk interrupted marker.

### Task 4.3.8: Treat verified terminal journals as inert cleanup remnants

**Files:**

- Modify: `packages/ai-tooling/src/transaction/transaction-manager.ts`
- Modify: `packages/ai-tooling/tests/unit/transaction-manager.spec.ts`

**Interfaces:**

- Consumes: no-run-lock local-state census, canonical terminal journal, final-tree digest, and final
  lock state.
- Produces: read-only `verifyTerminalRemnant` and under a newly acquired unrelated run lock,
  `cleanupVerifiedTerminalRemnants`.

- [ ] **Step 1: Add the literal failing read-only-remnant test**

```ts
import { expect, it } from 'vitest';

it('ordinary doctor leaves a valid no-run-lock terminal journal unchanged', async () => {
  const fixture = terminalRemnantFixture('committed');
  const before = fixture.localStateBytes();
  const status = await fixture.inspectReadOnly();

  expect(status).toStrictEqual({ kind: 'clean' });
  expect(fixture.localStateBytes()).toStrictEqual(before);
  expect(fixture.deleteCalls()).toStrictEqual([]);
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/transaction-manager.spec.ts --passWithNoTests=false --reporter=verbose -t "ordinary doctor leaves a valid no-run-lock terminal journal unchanged"
```

Expected RED: exit `1`; read-only inspection deletes the journal or classifies it interrupted.

- [ ] **Step 3: Add the literal inert-verification branch**

```ts
export async function verifyTerminalRemnant(
  journal: ParsedJournal,
  verifier: TerminalStateVerifier,
): Promise<'committed' | 'rolled-back'> {
  const terminal = journal.frames.at(-1);
  if (terminal?.type !== 'committed' && terminal?.type !== 'rolled-back') {
    throw recoveryError('nonterminal-journal-without-run-lock');
  }
  const outcome = terminal.type === 'committed' ? 'candidate' : 'prior';
  const header = journal.header.payload;
  if (
    terminal.payload.planDigest !== header.planDigest ||
    terminal.payload.finalTreeDigest !== finalTreeDigest(finalTreeDigestProjection(header, outcome))
  ) {
    throw recoveryError('terminal-journal-mismatch');
  }
  await verifier.verify(header, outcome, terminal.payload.finalLockState);
  return terminal.type;
}
```

Only a later accepted mutation may delete an exact unchanged verified terminal remnant, after it has
created its own run lock/header and advanced to journal-ready, and before its first target mutation.
Each remnant is revalidated immediately before one-file deletion. A changed remnant blocks and is
preserved. Read-only commands never clean it.

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; status is clean and byte inventory is unchanged.

Add literal boundaries for `0/1/1000/1001` remnants, 64 MiB each, 512 MiB aggregate, repeated crash
after run-lock release, coexistence with pre-journal/journal-ready/recovery state, and changes between
plan/new-lock/cleanup. A no-run-lock nonterminal, invalid final state, link/reparse, unknown name, or
bound breach blocks preserve-first.

### Task 4.3.9: Execute the native crash matrix

**Files:**

- Modify: `packages/ai-tooling/tests/native/transaction-recovery.native.spec.ts`

**Interfaces:**

- Consumes: all gateway, journal, transaction, rollback, and liveness interfaces from Tasks
  4.1.1-4.3.8.
- Produces: native durability evidence on the three IC-8 tuples.

- [ ] **Step 1: Add the literal failing flush-boundary vector**

```ts
import { expect, it } from 'vitest';

it('keeps first init recoverable after the journal header flush', async () => {
  const fixture = await createNativeTransactionFixture({
    operation: 'init',
    failAfter: 'journal-header-flush',
  });
  await expect(fixture.apply()).rejects.toMatchObject({ injectedFailure: 'journal-header-flush' });
  const state = await fixture.inspectFreshProcess();

  expect(state).toStrictEqual({
    kind: 'recoverable',
    operationId: fixture.operationId,
    actions: ['complete', 'rollback'],
  });
  expect(await fixture.classifyEveryManagedPath()).toSatisfy(
    (entries: readonly { readonly state: string }[]) =>
      entries.every(({ state }) => state === 'prior' || state === 'candidate' || state === 'missing'),
  );
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/native/transaction-recovery.native.spec.ts --passWithNoTests=false --reporter=verbose -t "keeps first init recoverable after the journal header flush"
```

Expected RED: exit `1`; fresh-process inspection cannot classify header-flushed state or observes an
unjournaled target mutation.

- [ ] **Step 3: Add the literal failure injector at the durable boundary**

```ts
await filesystem.flushParent(journalRef);
failureInjector.hit('journal-header-flush');
const action = await actionConfirmer.confirmOrdinary(plan, header, 'complete');
const readyRunLock = await filesystem.advanceRunLockVerified(
  runLockRef,
  preJournalObservation,
  journalRef,
  headerObservation,
  journalReadyBytes,
  action,
  advanceAuthority,
);
```

The production `FailureInjector` is a no-op private port. The native spec injects only at named
boundaries; no production command exposes a failure-injection option.

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: the matching native tuple exits `0`; the fresh process reports recoverable and every
path is prior/candidate/missing only.

Expand the literal table to every byte and flush boundary required by Tasks 4.1.3-4.3.8, including
infrastructure prefix, run lock, journal header, advance, every forward/reverse marker, backup,
candidate/rollback/retained stage, create/replace/delete, lock last, terminal frame, retained
publication, cleanup, run-lock release, and terminal-remnant cleanup. For each row assert no partial
unattributed target, no unknown authority, no real checkout/user-global access, and deterministic
fresh-process completion or rollback classification.

## 4.4 Recovery inspection, repair, report, and retention

### Task 4.4.1: Inspect recovery evidence without mutation

**Files:**

- Create: `packages/ai-tooling/src/recovery/inspect.ts`
- Create: `packages/ai-tooling/tests/unit/recovery-inspect.spec.ts`

**Interfaces:**

- Consumes: `ReadOnlyRepositoryFilesystem`, one shared `RepositoryReadBudget`, canonical local-state
  parsers, `ProcessLivenessProvider`, parsed journals, and terminal-remnant verification.
- Produces: `inspectRecovery(context): Promise<RecoveryStatus>` and the strict benign local-state
  census.

- [ ] **Step 1: Add the literal failing missing-journal diagnostic test**

```ts
import { expect, it } from 'vitest';
import { inspectRecovery } from '../../src/recovery/inspect.js';

it('preserves evidence when a journal-ready lock has no journal', async () => {
  const context = readOnlyRecoveryContext({
    runLock: canonicalJournalReadyRunLock(),
    journal: { kind: 'absent' },
  });
  const before = context.byteInventory();
  const result = await inspectRecovery(context as never);

  expect(result).toStrictEqual({
    kind: 'blocked',
    diagnostic: {
      code: 'EVK_RECOVERY_EVIDENCE_MISSING',
      reason: 'journal-ready-journal-missing',
      fields: { operationId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
      recoveryActions: [
        'Preserve the complete .ai-tooling tree and current project bytes before investigation.',
        'Restore only an exact matching journal from a verified backup.',
        'Reconstruct a known-good checkout and reapply only verified human source files before comparing state.',
      ],
    },
  });
  expect(context.byteInventory()).toStrictEqual(before);
  expect(context.mutationCalls()).toStrictEqual([]);
});
```

`readOnlyRecoveryContext` and `canonicalJournalReadyRunLock` are literal same-file fixtures backed by
an immutable path-to-byte map and spies that throw on any mutation attempt.

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/recovery-inspect.spec.ts --passWithNoTests=false --reporter=verbose -t "preserves evidence when a journal-ready lock has no journal"
```

Expected RED: exit `1`; the state is called clean/recoverable, evidence is changed, or unsafe deletion/
force guidance appears.

- [ ] **Step 3: Add the literal evidence-missing branch**

```ts
if (runLock.phase === 'journal-ready' && journal.kind === 'absent') {
  return {
    kind: 'blocked',
    diagnostic: {
      code: 'EVK_RECOVERY_EVIDENCE_MISSING',
      reason: 'journal-ready-journal-missing',
      fields: { operationId: runLock.operationId },
      recoveryActions: [
        'Preserve the complete .ai-tooling tree and current project bytes before investigation.',
        'Restore only an exact matching journal from a verified backup.',
        'Reconstruct a known-good checkout and reapply only verified human source files before comparing state.',
      ],
    },
  };
}
```

The inspector never recommends deleting `run.lock`, deleting `.ai-tooling`, or forcing in-place
repair. It reads every entry through the gateway under the shared local-state envelope, validates
names before bodies, and revalidates root/entry identities. Read-only inspection never deletes a
terminal remnant, scratch leaf, report, backup, or journal.

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; exact structured diagnostic and byte identity pass.

Add literal classification rows for no state, absent/exact empty structural prefix, active live run,
stale pre-journal without journal, stale pre-journal header/no markers, stale journal-ready exact
journal, terminal committed/rolled-back with partial cleanup, no-run-lock terminal journal,
journal-ready missing journal, corrupt/mismatched journal, unknown phase, changed metadata, path
prior/candidate/missing/third, lock prior/candidate/absent/third, original archive, full handoff,
bounded handoff scratch, successor prefixes, terminal archive, reports, retained frames, link/reparse,
unknown names, and all IC-12/IC-16 bounds. Exact benign state may contain the four infrastructure
roots, validated reports, retained preimages, and verified terminal remnants only.

### Task 4.4.2: Bind every recovery observation into the accepted plan

**Files:**

- Create: `packages/ai-tooling/src/recovery/repair.ts`
- Create: `packages/ai-tooling/tests/unit/recovery-repair.spec.ts`
- Modify: `packages/ai-tooling/src/transaction/mutation-plan.ts`

**Interfaces:**

- Consumes: inspected recoverable state, canonical journal/header, selected action, liveness stale
  proof, exact evidence observations, and IC-13 projection/digest.
- Produces: `planRecovery(operationId, action): Promise<RecoveryPlan>` with
  `RecoveryEvidencePlanV1`, `RecoveryArchiveRestoreV1`, `JournalPrefixRepairV1`, and
  `TerminalArchiveRewriteV1`.

- [ ] **Step 1: Add the literal failing evidence-digest test**

```ts
import { expect, it } from 'vitest';

it('changes the repair plan digest when a handoff scratch observation changes', async () => {
  const service = recoveryServiceFixture({
    scratch: {
      path: '.ai-tooling/stale-locks/.handoff-f47ac10b-58cc-4372-a567-0e02b2c3d479-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA.stage',
      bytes: new Uint8Array([0x61]),
    },
  });
  const first = await service.plan(
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'rollback',
  );
  service.replaceScratch(new Uint8Array([0x62]));
  const second = await service.plan(
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'rollback',
  );

  expect(first.recovery.observations.some(({ role }) => role === 'staging')).toBe(true);
  expect(first.planDigest).not.toBe(second.planDigest);
  expect(first.entries.every(({ review }) => review.contributors.length === 0)).toBe(true);
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/recovery-repair.spec.ts --passWithNoTests=false --reporter=verbose -t "changes the repair plan digest when a handoff scratch observation changes"
```

Expected RED: exit `1`; scratch identity/digest/length is omitted from recovery projection or repair
uses canonical source contributors.

- [ ] **Step 3: Add the literal recovery observation projection**

```ts
function buildRecoveryEvidencePlan(
  action: 'complete' | 'rollback',
  generation: number,
  evidence: readonly InspectedRecoveryEvidence[],
  archiveRestore: RecoveryArchiveRestoreV1 | null,
  journalPrefixRepair: JournalPrefixRepairV1 | null,
  terminalArchiveRewrite: TerminalArchiveRewriteV1,
): RecoveryEvidencePlanV1 {
  const observations = evidence
    .map((entry): RecoveryEvidenceObservationV1 => ({
      path: entry.path.relativePath,
      role: entry.role,
      observed: projectObservedPath(entry.observed),
      byteLength: entry.observed.kind === 'file' ? entry.byteLength : 0,
      disposition: entry.disposition,
    }))
    .sort((left, right) => comparePortablePaths(left.path, right.path));
  assertUniquePortableObservations(observations);
  return {
    action,
    generation,
    observations,
    archiveRestore,
    journalPrefixRepair,
    terminalArchiveRewrite,
  };
}
```

The plan includes current run lock, original archive, fixed handoff, journal, every backup/stage, and
every independently cleaned terminal remnant. It binds full observed identity/digest/absence/length,
role/disposition, action, generation, deterministic rewrite stages, and archive-only restore descriptor.
Repair entries always have empty contributors and remain independent of changed or removed canonical
source. Operation ID is the interrupted UUID.

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; scratch change changes plan digest, and contributor arrays are empty.

Add rows for every action/evidence/descriptor mismatch; wrong generation/plan/action; missing/extra/
duplicate observation; deterministic stage path mismatch; current run-lock/archive/handoff/journal/
backup identity race; archive-only non-null/null descriptor swaps; and generation `1`, predecessor+1,
`1000000`, and overflow. Any mismatch fails before handoff publication or write.

### Task 4.4.3: Repair an exact incomplete final journal frame before resuming

**Files:**

- Modify: `packages/ai-tooling/src/recovery/repair.ts`
- Modify: `packages/ai-tooling/src/transaction/journal.ts`
- Modify: `packages/ai-tooling/src/transaction/transaction-manager.ts`
- Modify: `packages/ai-tooling/tests/unit/recovery-repair.spec.ts`

**Interfaces:**

- Consumes: confirmed recovery plan, exact observed partial journal, canonical next complete frame,
  recovery run lock, and gateway-issued `RecoveryRewriteAuthority`.
- Produces: atomic `replaceJournalPrefixVerified` flow and resumed `TransactionManager.recover`.

- [ ] **Step 1: Add the literal failing changed-prefix test**

```ts
import { expect, it } from 'vitest';

it('does not repair a journal prefix changed after confirmation', async () => {
  const fixture = recoveryPrefixFixture();
  const plan = await fixture.service.plan(fixture.operationId, 'complete');
  const confirmed = fixture.confirm(plan);
  fixture.replaceJournalPrefix(new Uint8Array([0x45, 0x56, 0x4b, 0x58]));

  await expect(fixture.service.apply(confirmed)).rejects.toMatchObject({
    diagnostic: { code: 'EVK_CONFIG_CAPABILITY_UNAVAILABLE', reason: 'recovery-evidence-changed' },
  });
  expect(fixture.targetMutationCalls()).toStrictEqual([]);
  expect(fixture.journalBytes()).toStrictEqual(new Uint8Array([0x45, 0x56, 0x4b, 0x58]));
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/recovery-repair.spec.ts --passWithNoTests=false --reporter=verbose -t "does not repair a journal prefix changed after confirmation"
```

Expected RED: exit `1`; changed bytes are truncated/replaced, or target mutation begins.

- [ ] **Step 3: Add the literal evidence revalidation before prefix replacement**

```ts
if (plan.recovery.journalPrefixRepair !== null) {
  const descriptor = plan.recovery.journalPrefixRepair;
  const observed = await this.filesystem.inspectVerified(
    this.refs.journal,
    this.observedJournal,
    this.context.readBudget,
  );
  if (
    observed.kind !== 'file' ||
    observed.digest !== descriptor.prefixDigest ||
    observed.identity.size !== BigInt(descriptor.prefixByteLength)
  ) {
    throw recoveryError('recovery-evidence-changed');
  }
  this.observedJournal = await this.filesystem.replaceJournalPrefixVerified(
    this.refs.journal,
    observed,
    this.refs.runLock,
    this.recoveryRunLock,
    this.canonicalCompletePrefixBytes,
    this.recoveryAuthorities.journalPrefix!,
  );
}
```

Only one incomplete final frame that is an exact canonical prefix is repairable. The confirmed plan
binds observed journal identity/digest/length, prefix digest/length, exact completed candidate, and
deterministic rewrite stage. Replacement failure, race, or wrong post-state leaves evidence and starts
no target mutation; physical partial bytes are never appended in place.

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; changed prefix is preserved and no target method is called.

Add one row at every canonical-next-frame byte boundary, plus non-prefix, wrong frame type/sequence/
digest, journal change after confirmation, staging prefix/full/non-prefix, replacement/flush/post-
verification failure, and restart. Only exact unchanged prefix may be atomically replaced and then
consumed as the returned observation.

### Task 4.4.4: Handoff stale ownership before completion or rollback

**Files:**

- Modify: `packages/ai-tooling/src/recovery/repair.ts`
- Modify: `packages/ai-tooling/tests/unit/recovery-repair.spec.ts`
- Create: `packages/ai-tooling/tests/integration/doctor-repair.spec.ts`

**Interfaces:**

- Consumes: exact stale-owner proof, confirmed recovery plan, canonical successor/handoff, gateway
  handoff methods, and `TransactionManager.recover`.
- Produces: generation-bound recovery ownership transfer, completion/rollback apply, and terminal
  recovery archive cleanup.

- [ ] **Step 1: Add the literal failing two-repairer race test**

```ts
import { expect, it } from 'vitest';

it('lets one repairer publish the recovery handoff and gives the loser zero writes', async () => {
  const fixture = concurrentRepairFixture();
  const [left, right] = await Promise.allSettled([
    fixture.left.apply(fixture.leftConfirmedPlan),
    fixture.right.apply(fixture.rightConfirmedPlan),
  ]);
  const winners = [left, right].filter(({ status }) => status === 'fulfilled');
  const losers = [left, right].filter(({ status }) => status === 'rejected');

  expect(winners).toHaveLength(1);
  expect(losers).toHaveLength(1);
  expect(fixture.handoffPublishSuccesses()).toBe(1);
  expect(fixture.loserManagedWrites()).toStrictEqual([]);
  expect(fixture.originalArchiveCount()).toBe(1);
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/recovery-repair.spec.ts tests/integration/doctor-repair.spec.ts --passWithNoTests=false --reporter=verbose -t "lets one repairer publish the recovery handoff and gives the loser zero writes"
```

Expected RED: exit `1`; both handoffs publish, both touch managed bytes, or original archive is lost/
duplicated.

- [ ] **Step 3: Add the literal no-overwrite winner branch**

```ts
const handoff = await this.filesystem.publishRecoveryHandoffVerified(
  refs.staleLocksRoot,
  roots.staleLocksLocator,
  refs.currentRunLock,
  predecessorObservation,
  { kind: 'absent' },
  canonical.handoffBytes,
  authorities.handoff,
);
const retired = await this.filesystem.retireRecoveryPredecessorVerified(
  refs.currentRunLock,
  predecessorObservation,
  refs.handoff,
  handoff,
  canonical.retirement,
  authorities.handoff,
);
const successor = await this.filesystem.createRecoveryRunLockExclusive(
  refs.stateRoot,
  roots.stateLocator,
  { kind: 'absent' },
  refs.handoff,
  handoff,
  refs.originalArchive,
  retired.originalArchive,
  canonical.successorBytes,
  authorities.handoff,
);
await this.filesystem.deleteRecoveryHandoffVerified(
  refs.handoff,
  handoff,
  refs.currentRunLock,
  successor.runLock,
  refs.originalArchive,
  retired.originalArchive,
  authorities.handoff,
);
```

Before handoff publication, delete only the exact bounded observed scratch set while the dead
predecessor is unchanged and fixed handoff absent. Partial randomized stages are non-authoritative.
An ordinary predecessor moves to its absent fixed original archive; a recovery predecessor retires
only under the full handoff. The successor accepts absent or unchanged exact prefix only. The full
handoff always wins over a new attempt. A live embedded owner alone may continue; a different caller
after exact dead proof may finish coordination only, then must stop for a new plan/generation.

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; one no-overwrite publish wins, loser performs zero managed writes, and one
archive remains.

Add completion/rollback rows for every valid interrupted step, all third states, live/foreign/reused/
ambiguous owners, action/generation/plan drift, state change after confirmation, failed verification,
archive-only normalization, dead recovery successor, and terminal archive. After fully verified action,
clean bounded scratch, terminalize archive, delete exact recovery lock, then best-effort delete unchanged
terminal archive. No sole evidence is deleted before a durable successor exists.

### Task 4.4.5: Preserve terminal outcomes and apply retention rules

**Files:**

- Create: `packages/ai-tooling/src/recovery/retention.ts`
- Modify: `packages/ai-tooling/src/recovery/repair.ts`
- Modify: `packages/ai-tooling/tests/unit/recovery-repair.spec.ts`

**Interfaces:**

- Consumes: terminal committed/rolled-back journal, exact final state, staged/fixed retained frames,
  transient evidence, and gateway cleanup methods.
- Produces: `assertTerminalAction(parsedJournal, requestedAction)`, `finishTerminalRecovery`,
  `classifyRetainedPreimages`, and minimum Stage 1 retention.

- [ ] **Step 1: Add the literal failing terminal-commit rollback rejection**

```ts
import { expect, it, vi } from 'vitest';
import { assertTerminalAction } from '../../src/recovery/retention.js';

it('never rolls back a journal that already committed candidate state', async () => {
  const targetMutation = vi.fn();
  const parsedJournal = {
    header: { payload: { operationId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' } },
    frames: [
      {
        sequence: 9,
        type: 'committed',
        payload: {
          planDigest: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          finalTreeDigest: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          finalLockState: { kind: 'present', sha256: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc' },
        },
      },
    ],
  } as never;
  const before = structuredClone(parsedJournal);

  expect(() => assertTerminalAction(parsedJournal, 'rollback')).toThrowError(
    expect.objectContaining({
      diagnostic: expect.objectContaining({
        code: 'EVK_CONFIG_CAPABILITY_UNAVAILABLE',
        reason: 'terminal-outcome-fixed',
      }),
    }),
  );
  expect(targetMutation).not.toHaveBeenCalled();
  expect(parsedJournal).toStrictEqual(before);
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/recovery-repair.spec.ts --passWithNoTests=false --reporter=verbose -t "never rolls back a journal that already committed candidate state"
```

Expected RED: exit `1`; rollback is planned/applied or evidence changes.

- [ ] **Step 3: Add the literal fixed-terminal-outcome guard**

```ts
export function assertTerminalAction(
  parsedJournal: ParsedJournal,
  requestedAction: 'complete' | 'rollback',
): void {
  const terminal = parsedJournal.frames.at(-1);
  if (terminal?.type === 'committed' && requestedAction !== 'complete') {
    throw recoveryError('terminal-outcome-fixed');
  }
  if (terminal?.type === 'rolled-back' && requestedAction !== 'rollback') {
    throw recoveryError('terminal-outcome-fixed');
  }
}
```

A committed terminal may only finish/verify candidate retained-preimage publication and matching
transient cleanup. A rolled-back terminal may only verify prior state and clean matching transient
evidence. Neither changes outcome. Active/interrupted backups are never pruned. Ordinary successful
transaction backups are deleted after final verification. Manual restore retains newest complete
verified preimage; old fixed frame stays until target, final tree, committed frame, new fixed publish,
and parent flush verify.

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; rollback of committed journal is rejected before writes.

Add old-fixed/absent-prefix-full-new-stage rows for pre-commit completion and rollback, already-new-
fixed/absent-stage terminal completion, non-prefix/hybrid/changed frame, backup cleanup failure,
terminal archive cleanup failure, and crash at every retention boundary. Uncertainty retains all
evidence and returns interrupted.

### Task 4.4.6: Plan and atomically write an explicit redacted doctor report

**Files:**

- Create: `packages/ai-tooling/tests/integration/doctor-report.spec.ts`
- Modify: `packages/ai-tooling/src/commands/doctor.ts`
- Modify: `packages/ai-tooling/src/transaction/mutation-plan.ts`

**Interfaces:**

- Consumes: `ReportRequest`, deterministic `DoctorReportJsonV1`, shared plan/confirmation,
  `TransactionManager.apply`, and contained `.ai-tooling/reports/<portable-name>.json` path.
- Produces: `planReport(request): Promise<MutationPlan<'report'>>` and
  `applyReport(plan: ConfirmedMutationPlan<'report'>): Promise<TransactionOutcome>`.

- [ ] **Step 1: Add the literal failing clean-report plan test**

```ts
import { expect, it } from 'vitest';
import { planReport } from '../../src/commands/doctor.js';

it('plans one reports directory and one deterministic report file', async () => {
  const request = cleanReportRequest('.ai-tooling/reports/doctor.json');
  const plan = await planReport(request);

  expect(plan.operation).toBe('report');
  expect(plan.entries.map(({ path, candidate }) => [path.relativePath, candidate.kind])).toStrictEqual([
    ['.ai-tooling/reports', 'directory'],
    ['.ai-tooling/reports/doctor.json', 'file'],
  ]);
  expect(plan.entries.every(({ review }) => review.contributors.length === 0)).toBe(true);
  expect(request.mutationCalls()).toStrictEqual([]);
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/doctor-report.spec.ts --passWithNoTests=false --reporter=verbose -t "plans one reports directory and one deterministic report file"
```

Expected RED: exit `1`; report planning is unavailable, includes `.ai-tooling` infrastructure as plan
entries, mutates, or omits reports directory/file.

- [ ] **Step 3: Add the literal plan constructor**

```ts
export async function planReport(request: ReportRequest): Promise<MutationPlan<'report'>> {
  assertReportPath(request.path);
  const report = await buildDoctorReport(request.context);
  const bytes = renderDoctorReportJson(report);
  if (bytes.byteLength > 16 * 1024 * 1024) {
    throw resourceLimit('report-bytes', 16 * 1024 * 1024, 'report');
  }
  const entries: PlannedPathMutation[] = [];
  const parent = await request.context.filesystem.resolve('.ai-tooling/reports');
  const parentState = await request.context.filesystem.inspectPath(parent, request.context.readBudget);
  if (parentState.kind === 'absent') entries.push(directoryMutation(parent));
  if (parentState.kind !== 'absent' && parentState.kind !== 'directory') {
    throw containmentError('report-parent-invalid');
  }
  const leaf = await request.context.filesystem.resolve(request.path);
  const leafState = await request.context.filesystem.inspectPath(leaf, request.context.readBudget);
  if (leafState.kind !== 'absent') throw containmentError('report-target-exists');
  entries.push(fileCreateMutation(leaf, bytes, []));
  return finalizeMutationPlan({ operation: 'report', entries, refresh: null });
}
```

The report schema/type/registry/assignability hashes remain unchanged from Phase 1. Exact top-level/
nested key order, strict unknown fields, UTF-8/LF/final-LF, sorted diagnostics/paths, and stdout/file
byte identity are fixture-locked. Projection may retain provider ID and recovery operation ID but
omits host, PID, marker, nonce, absolute paths, source/instruction body, matched secret, and raw
formatter output; direct provider is null or `<redacted>/<basename>`.

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; exact two-entry read-only plan passes.

Add existing-parent, target-exists, one-over report, concurrent init/report and report/report, state-
root/reports/temp/publish/journal/cleanup crash rows, ignore prerequisite drift before state root/
reports/file, and wrong-operation compile/runtime tests. Apply uses shared transaction operation
`report`, atomic `createExclusive`, no ownership record, and leaves no active transient evidence after
success; crash yields absent/exact report or matching recovery evidence, never partial report bytes.

### Task 4.4.7: Wire explicit doctor repair and report CLI forms

**Files:**

- Modify: `packages/ai-tooling/src/commands/doctor.ts`
- Modify: `packages/ai-tooling/src/cli.ts`
- Modify: `packages/ai-tooling/tests/integration/doctor-repair.spec.ts`
- Modify: `packages/ai-tooling/tests/integration/doctor-report.spec.ts`

**Interfaces:**

- Consumes: `RecoveryService`, `planReport`, `applyReport`, shared IC-13 output/confirmation, and Phase
  3 doctor/formatter forms.
- Produces: exact CLI forms `doctor`, `doctor --report`, `doctor --repair --operation <uuid>
  --action complete|rollback`, and `doctor --report-path .ai-tooling/reports/<portable-name>.json`.

- [ ] **Step 1: Add the literal failing noninteractive-repair parser test**

```ts
import { expect, it } from 'vitest';
import { main } from '../../src/cli.js';

it('requires operation action and accepted digest for noninteractive repair', async () => {
  const io = literalCliIo();
  const exit = await main(
    [
      'doctor',
      '--repair',
      '--operation',
      'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      '--action',
      'rollback',
    ],
    io,
  );

  expect(exit).toBe(2);
  expect(io.recoveryApplyCalls()).toStrictEqual([]);
  expect(io.stderrText()).toContain('accept-plan');
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/doctor-repair.spec.ts tests/integration/doctor-report.spec.ts --passWithNoTests=false --reporter=verbose -t "requires operation action and accepted digest for noninteractive repair"
```

Expected RED: exit `1`; CLI applies, silently chooses action/operation, or accepts missing plan digest.

- [ ] **Step 3: Add the literal closed argument check**

```ts
if (command.kind === 'doctor-repair') {
  if (
    command.operation === null ||
    command.action === null ||
    command.acceptPlan === null ||
    !/^[0-9a-f]{64}$/.test(command.acceptPlan)
  ) {
    await io.stderr.write(
      terminalSafeAscii('doctor --repair requires --operation, --action, and --accept-plan.\n'),
    );
    await io.stderr.flush();
    return 2;
  }
  const plan = await recoveryService.plan(command.operation, command.action);
  const confirmed = confirmNoninteractiveRecoveryPlan(plan, command.acceptPlan);
  return exitCodeForRecovery(await recoveryService.apply(confirmed));
}
```

Ordinary `doctor`, `doctor --report`, and every dry run remain read-only. A report path is accepted only
under `.ai-tooling/reports/<portable-name>.json`; all other report paths fail before planning. Repair
dry-run renders the full exact plan/evidence but writes nothing. There is no force or implicit action.

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; CLI returns `2`, calls no apply method, and emits terminal-safe guidance.

Add literal parser rows for missing/duplicate/malformed operation, action, digest, mixed report/repair/
formatter flags, `--force`, `--yes`, wrong report root, and dry-run. Successful noninteractive repair
must immediately revalidate the plan digest and every observation before any handoff or write.

## 4.5 Clean init

### Task 4.5.1: Plan exactly the clean config, lock, five leaves, and seven directories

**Files:**

- Create: `packages/ai-tooling/src/commands/init.ts`
- Create: `packages/ai-tooling/tests/integration/init.spec.ts`
- Create: `packages/ai-tooling/tests/fixtures/init/vectors.json`
- Modify: `packages/ai-tooling/src/transaction/mutation-plan.ts`

**Interfaces:**

- Consumes: `InitRequest`, pure Phase 3 pipeline, aggregate target registry, discovery census, strict
  benign local-state census, shared prerequisite verifier, and mutation-plan builder.
- Produces: `planInit(request): Promise<MutationPlan<'init'>>`.

- [ ] **Step 1: Add the literal failing clean-plan test**

```ts
import { expect, it } from 'vitest';
import { planInit } from '../../src/commands/init.js';

it('plans seven file creates and seven structural directories for clean init', async () => {
  const request = cleanInitRequest({
    pack: 'configs/ai',
    platforms: ['codex', 'claude-code'],
  });
  const plan = await planInit(request);

  expect(plan.operation).toBe('init');
  expect(plan.entries.map(({ path }) => path.relativePath)).toStrictEqual([
    '.agents',
    '.claude',
    '.agents/skills',
    '.claude/rules',
    '.claude/skills',
    '.agents/skills/evk-plan',
    '.claude/skills/evk-plan',
    '.agents/skills/evk-plan/SKILL.md',
    '.claude/rules/evk-grounding.md',
    '.claude/skills/evk-plan/SKILL.md',
    'AGENTS.md',
    'CLAUDE.md',
    'ai-tooling.config.json',
    'ai-tooling.lock.json',
  ]);
  expect(summarizeMutationPlan(plan)).toStrictEqual({
    creates: 7,
    replaces: 0,
    deletes: 0,
    directoryCreates: 7,
  });
  expect(request.mutationCalls()).toStrictEqual([]);
});
```

`cleanInitRequest` is a same-file temporary-repository fixture with the real ignore rule, tracked
`configs/ai`, no config/lock/output/shadow/local state, and injected read-only ports. Seven file
creates are human-owned config, repository lock, and five managed leaves; only lock/leaves receive
ownership records.

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/init.spec.ts --passWithNoTests=false --reporter=verbose -t "plans seven file creates and seven structural directories for clean init"
```

Expected RED: exit `1`; init remains unavailable or plan path/order/summary is not exact.

- [ ] **Step 3: Add the literal plan composition**

```ts
const INIT_DIRECTORIES = [
  '.agents',
  '.claude',
  '.agents/skills',
  '.claude/rules',
  '.claude/skills',
  '.agents/skills/evk-plan',
  '.claude/skills/evk-plan',
] as const;

export async function planInit(request: InitRequest): Promise<MutationPlan<'init'>> {
  await localStatePrerequisite.assertReady(request.context);
  await assertBenignPreInitLocalState(request.context);
  const resolved = await resolveInitSelection(request);
  const pipeline = await resolvePurePipeline(resolved.pipelineRequest);
  await assertNoDiscoveryShadows(request.context, pipeline.registry);
  const entries: PlannedPathMutation[] = [];
  for (const path of INIT_DIRECTORIES) {
    entries.push(await planAbsentDirectory(request.context, path));
  }
  entries.push(planFileCreate(resolved.configRef, resolved.configBytes, []));
  for (const leaf of pipeline.candidate.leaves) {
    entries.push(planManagedLeafCreate(leaf));
  }
  entries.push(planRepositoryLockCreate(pipeline.candidate));
  return finalizeMutationPlan({ operation: 'init', entries, refresh: null });
}
```

`planAbsentDirectory` and file planners inspect through the shared budget, reject any unmanaged
intended leaf or wrong-kind ancestor, and produce complete review streams. Candidate leaf contributors
come from Phase 3; config, directory, and lock contributors are empty. Any target or shadow blocks
before plan output.

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; exact fourteen paths, summary, and zero-write assertion pass.

Add literal zero-write rows for failed ignore/unignore, unmanaged leaf, either discovery shadow,
partial/recovery local-state evidence, invalid report-only state, preview, hook/plugin/executable
capability, unsupported platform, untracked/aliased/outside pack, file-ancestor/case/NFC collision, and
target introduced during planning. Two unchanged dry runs have `operationId: null` and identical bytes/
digest.

### Task 4.5.2: Revalidate clean init after journal-ready and apply through the manager

**Files:**

- Modify: `packages/ai-tooling/src/commands/init.ts`
- Modify: `packages/ai-tooling/tests/integration/init.spec.ts`
- Modify: `packages/ai-tooling/src/cli.ts`

**Interfaces:**

- Consumes: confirmed init plan, `TransactionManager.apply`, immutable accepted init projection, and
  transaction post-journal-ready rerender hook.
- Produces: `applyInit(plan: ConfirmedMutationPlan<'init'>): Promise<TransactionOutcome>`,
  `replanAcceptedInit(projection, context): Promise<{ plan; registry }>`, and exact `init` CLI
  dispatch; the hook reconstructs inputs only from the accepted projection plus a new read-only
  observation context.

- [ ] **Step 1: Add the literal failing post-confirmation race test**

```ts
import { expect, it } from 'vitest';

it('rolls back when a target appears after journal-ready', async () => {
  const fixture = initApplyFixture();
  const plan = await fixture.plan();
  fixture.injectAfter('journal-ready', () => fixture.createUnmanaged('AGENTS.md', 'user bytes\n'));
  const outcome = await fixture.apply(fixture.confirm(plan));

  expect(outcome.kind).toBe('rolled-back');
  expect(fixture.read('AGENTS.md')).toBe('user bytes\n');
  expect(fixture.exists('ai-tooling.config.json')).toBe(false);
  expect(fixture.exists('ai-tooling.lock.json')).toBe(false);
  expect(fixture.transientEvidence()).toStrictEqual([]);
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/init.spec.ts --passWithNoTests=false --reporter=verbose -t "rolls back when a target appears after journal-ready"
```

Expected RED: exit `1`; user bytes are overwritten/adopted, config/lock remains, or transient evidence
is not cleaned after verified handled rollback.

- [ ] **Step 3: Add the literal apply wrapper and transaction revalidation hook**

```ts
export async function applyInit(
  plan: ConfirmedMutationPlan<'init'>,
): Promise<TransactionOutcome> {
  if (plan.operation !== 'init') throw commandShapeError('init-plan-required');
  return transactionManager.apply(plan);
}

transactionManager.registerPostJournalReadyValidator('init', async (plan) => {
  await localStatePrerequisite.assertReady(readOnlyContext);
  const rerendered = await replanAcceptedInit(plan.acceptedProjection, readOnlyContext);
  assertSameAcceptedPlan(plan, rerendered.plan);
  await assertEveryInitTargetStillAbsent(readOnlyContext, rerendered.plan);
  await assertNoDiscoveryShadows(readOnlyContext, rerendered.registry);
});
```

The revalidation repeats config/source/capability/target/shadow/ownership resolution and complete
candidate rendering after journal-ready, before the all-intents barrier and before managed mutation.
It never adopts or merges. A collision enters handled rollback; external bytes are preserved.

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; user target remains exact, config/lock absent, and handled rollback cleans
only unchanged transaction evidence.

Add races before each shallow directory create and reverse rollback, external file in created
directory, config/source/shadow/ownership drift, failure at every transaction boundary, dry-run,
interactive confirmation, exact noninteractive digest, and CLI variant validation. Assert no hook,
plugin, remote, cache, package-manager, user-global, adoption, or merge call.

## 4.6 Sync, canonical-lock repair, and local refresh

### Task 4.6.1: Reject semantic drift while allowing byte-identical sync

**Files:**

- Create: `packages/ai-tooling/src/commands/sync.ts`
- Create: `packages/ai-tooling/tests/integration/sync.spec.ts`
- Create: `packages/ai-tooling/tests/fixtures/sync/vectors.json`

**Interfaces:**

- Consumes: `SyncRequest`, locked-input resolver, configuration and pack-selection projections,
  ownership check, candidate diff, and local-state prerequisite.
- Produces: `planSync(request): Promise<MutationPlan<'sync'>>`.

- [ ] **Step 1: Add the literal failing diagnostic-distinction table**

```ts
import { expect, it } from 'vitest';
import { planSync } from '../../src/commands/sync.js';

it.each([
  ['pack-selection', 'EVK_CONFIG_REQUIRES_UPDATE'],
  ['git-hooks', 'EVK_CONFIG_CAPABILITY_UNAVAILABLE'],
] as const)('reports %s drift with %s', async (field, code) => {
  const request = syncRequestWithSemanticDrift(field);
  await expect(planSync(request)).rejects.toMatchObject({
    diagnostic: { code },
  });
  expect(request.mutationCalls()).toStrictEqual([]);
});
```

- [ ] **Step 2: Run the named table and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/sync.spec.ts --passWithNoTests=false --reporter=verbose -t "reports"
```

Expected RED: exit `1`; sync blesses drift or uses the same diagnostic for selection and other
semantic fields.

- [ ] **Step 3: Add the literal digest distinction**

```ts
if (current.packSelectionDigest !== lock.packSelectionDigest) {
  throw new ToolingError({
    code: 'EVK_CONFIG_REQUIRES_UPDATE',
    message: 'Pack selection differs from the locked Stage 1 selection.',
    reason: 'pack-selection-changed',
    fields: { capability: 'pack-selection.update', activeProfile: 'safe-core' },
    recoveryActions: ['Restore the locked pack selection.'],
  });
}
if (current.configurationDigest !== lock.configurationDigest) {
  throw new ToolingError({
    code: 'EVK_CONFIG_CAPABILITY_UNAVAILABLE',
    message: 'Semantic configuration changes are unavailable in the safe-core profile.',
    reason: 'semantic-config-change-unavailable',
    fields: { capability: 'configuration.update', activeProfile: 'safe-core' },
    recoveryActions: ['Restore the locked semantic configuration.'],
  });
}
```

Formatting-only config changes keep the same digest. Sync may update generated leaves and ownership
records only after frozen source/integrity and current ownership checks. Missing, modified, stale,
orphaned, conflicting, shadowed, unsupported, unmanaged, or source-drift state blocks as defined;
delete entries after an explicit resource removal use empty contributors.

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; selection uses `EVK_CONFIG_REQUIRES_UPDATE`, hooks use capability-unavailable,
and both are zero-write.

Add rows for unchanged byte identity, formatting-only edits, every semantic projected field, pack add/
remove/source/range/revision/integrity/resolution, changed local pack digest, every output/ownership
state, new unmanaged target, and discovery shadow. A zero-entry sync is read-only and needs no
acceptance; a second unchanged sync is byte-identical.

### Task 4.6.2: Restrict noncanonical-lock repair to the exact safe state

**Files:**

- Modify: `packages/ai-tooling/src/commands/sync.ts`
- Modify: `packages/ai-tooling/tests/integration/sync.spec.ts`

**Interfaces:**

- Consumes: strict-valid lock value, deterministic lock renderer, exact semantic/source/ownership/
  output checks, and shared transaction manager.
- Produces: a lock-only `MutationPlan<'sync'>` for strict-valid noncanonical bytes.

- [ ] **Step 1: Add the literal failing lock-only plan test**

```ts
import { expect, it } from 'vitest';

it('plans only canonical lock bytes when every semantic and integrity check agrees', async () => {
  const request = noncanonicalLockSyncRequest();
  const plan = await planSync(request);

  expect(plan.entries).toHaveLength(1);
  expect(plan.entries[0]!.path.relativePath).toBe('ai-tooling.lock.json');
  expect(plan.entries[0]!.review.contributors).toStrictEqual([]);
  expect(plan.entries[0]!.candidate.kind).toBe('file');
  expect(plan.entries[0]!.candidate.bytes).toStrictEqual(request.canonicalLockBytes);
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/sync.spec.ts --passWithNoTests=false --reporter=verbose -t "plans only canonical lock bytes when every semantic and integrity check agrees"
```

Expected RED: exit `1`; sync blocks every noncanonical lock or includes another path.

- [ ] **Step 3: Add the literal narrow repair branch**

```ts
if (!equalBytes(lockBytes, canonicalLockBytes)) {
  await assertConfigurationMatchesLock(current, lock);
  await assertFrozenInputsMatchLock(request.context, lock);
  await assertOwnershipAndOutputsMatchLock(request.context, lock);
  await assertRecoveryStateBenign(request.context);
  return finalizeMutationPlan({
    operation: 'sync',
    entries: [
      fileReplaceMutation(
        lockRef,
        observedLock,
        canonicalLockBytes,
        [],
      ),
    ],
    refresh: null,
  });
}
```

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; exactly one lock entry has canonical bytes and empty contributors.

Add blocking rows for invalid JSON, schema failure, semantic mismatch, changed source/input/output,
ownership mismatch, discovery shadow, interrupted/recovery state, and third lock observation. Apply is
journaled and lock-only; no direct rewrite exists.

### Task 4.6.3: Refresh only the selected tracked local digest

**Files:**

- Create: `packages/ai-tooling/src/commands/refresh-local.ts`
- Create: `packages/ai-tooling/tests/integration/refresh-local.spec.ts`
- Modify: `packages/ai-tooling/src/cli.ts`

**Interfaces:**

- Consumes: `RefreshLocalRequest`, validated current lock, selected tracked local pack, complete resource
  diff, and transaction manager.
- Produces: `planRefreshLocal(request): Promise<MutationPlan<'refresh-local'>>` and
  `applyRefreshLocal(plan): Promise<TransactionOutcome>`.

- [ ] **Step 1: Add the literal failing refresh metadata test**

```ts
import { expect, it } from 'vitest';
import { planRefreshLocal } from '../../src/commands/refresh-local.js';

it('binds the selected pack old and new digests into one lock-only plan', async () => {
  const request = changedTrackedLocalPackRequest();
  const plan = await planRefreshLocal(request);

  expect(plan.refresh).toStrictEqual({
    pack: '@evk-soft/ai-pack-core',
    oldPackDigest: request.oldDigest,
    newPackDigest: request.newDigest,
  });
  expect(plan.entries.map(({ path }) => path.relativePath)).toStrictEqual(['ai-tooling.lock.json']);
  expect(plan.entries[0]!.review.contributors).toStrictEqual([]);
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/refresh-local.spec.ts --passWithNoTests=false --reporter=verbose -t "binds the selected pack old and new digests into one lock-only plan"
```

Expected RED: exit `1`; command is absent, metadata is null/mismatched, or output is included.

- [ ] **Step 3: Add the literal refresh plan**

```ts
export async function planRefreshLocal(
  request: RefreshLocalRequest,
): Promise<MutationPlan<'refresh-local'>> {
  const locked = await loadValidatedCurrentLock(request.context);
  const selected = requireSelectedTrackedLocalPack(locked, request.packId);
  const current = await resolveExactTrackedLocalPack(request.context, selected.path);
  const refresh: LocalRefreshMetadataV1 = {
    pack: request.packId,
    oldPackDigest: selected.integrityDigest,
    newPackDigest: current.integrityDigest,
  };
  const bytes = renderLockWithRefreshedLocalDigest(locked, refresh);
  return finalizeMutationPlan({
    operation: 'refresh-local',
    entries: [fileReplaceMutation(locked.ref, locked.observed, bytes, [])],
    refresh,
  });
}
```

Apply verifies exact typed refresh metadata and uses `TransactionManager.apply`. It never writes
generated output in the same operation; check remains stale until later sync. CLI requires selected
pack, exact `--new-digest` equal to reviewed metadata when provided, and exact plan acceptance.

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; exact metadata and one lock entry pass.

Add rows for npm/git, outside/alias/untracked/reparse source, wrong pack, changed old/new digest,
cross-operation refresh object, changed plan, invalid capability, dry-run, failure injection, and a
refresh that removes a resource. The following sync deletes the old managed leaf with empty
contributors and does not load unavailable prior source provenance.

## 4.7 Compare-and-swap restore

### Task 4.7.1: Plan restore only for one registered generated leaf

**Files:**

- Create: `packages/ai-tooling/src/recovery/restore-generated.ts`
- Create: `packages/ai-tooling/tests/unit/restore-generated.spec.ts`

**Interfaces:**

- Consumes: read-only project context, validated lock/input, exact registered ownership, rerendered
  expected leaf, observed current digest-or-absence, and retained-preimage path derivation.
- Produces: `assertRegisteredRestorePath(lock, path): ManagedPathRecordV1` and
  `RestoreGeneratedService.plan(context, path): Promise<RestorePlan>`.

- [ ] **Step 1: Add the literal failing unregistered-path test**

```ts
import { expect, it, vi } from 'vitest';
import { assertRegisteredRestorePath } from '../../src/recovery/restore-generated.js';

it('rejects an unregistered config path before preimage or transaction work', async () => {
  const preimage = vi.fn();
  const transaction = vi.fn();
  const lock = {
    managedPaths: [
      { path: 'AGENTS.md', outputDigest: 'a'.repeat(64), ownershipDigest: 'b'.repeat(64) },
    ],
  } as never;

  expect(() => assertRegisteredRestorePath(lock, 'ai-tooling.config.json' as never)).toThrowError(
    expect.objectContaining({
      diagnostic: expect.objectContaining({
        code: 'EVK_CONFIG_CAPABILITY_UNAVAILABLE',
        reason: 'restore-path-unregistered',
      }),
    }),
  );
  expect(preimage).not.toHaveBeenCalled();
  expect(transaction).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/unit/restore-generated.spec.ts --passWithNoTests=false --reporter=verbose -t "rejects an unregistered config path before preimage or transaction work"
```

Expected RED: exit `1`; config is accepted or preimage/transaction code runs.

- [ ] **Step 3: Add the literal ownership gate**

```ts
async plan(
  context: ReadOnlyProjectContext,
  path: PortableRelativePath,
): Promise<RestorePlan> {
  const lock = await loadValidatedCurrentLock(context);
  const record = assertRegisteredRestorePath(lock, path);
  await assertRecoveryStateBenign(context);
  const expected = await rerenderRegisteredLeaf(context, record);
  const ref = await context.filesystem.resolve(path);
  const inspected = await context.filesystem.inspectPath(ref, context.readBudget);
  const observed = await observeRestoreLeaf(context, ref, inspected);
  const preimage = observed.kind === 'file'
    ? { kind: 'file' as const, bytes: observed.bytes, digest: observed.digest, byteLength: observed.bytes.byteLength, mode: '100644' as const }
    : { kind: 'absent' as const };
  const entry = restoreMutation(ref, observed.state, expected, preimage, expected.contributors);
  return finalizeRestorePlan(entry, preimage);
}

export function assertRegisteredRestorePath(
  lock: RepositoryLockV1,
  path: PortableRelativePath,
): ManagedPathRecordV1 {
  const record = lock.managedPaths.find((entry) => entry.path === path);
  if (record === undefined) throw restoreError('restore-path-unregistered');
  return record;
}
```

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; unregistered config fails before preimage or transaction work.

Add rows for registered modified/missing leaf, unregistered config/lock/directory, active/interrupted
journal, invalid locked input, wrong expected rerender, one-over/sparse preimage, directory/link
compile-time and forged-runtime preimage, and retained path collision. The plan binds observed full
state, expected bytes/digest, diff, preimage digest, contributors, and operation `restore-generated`.

### Task 4.7.2: Recheck observation, stage EVKP preimage, and publish only after commit

**Files:**

- Modify: `packages/ai-tooling/src/recovery/restore-generated.ts`
- Create: `packages/ai-tooling/src/commands/restore-generated.ts`
- Create: `packages/ai-tooling/tests/integration/restore-generated.spec.ts`
- Modify: `packages/ai-tooling/src/cli.ts`

**Interfaces:**

- Consumes: `ConfirmedRestorePlan`, transaction restore route, retained-preimage authorities, and exact
  observation compare-and-swap.
- Produces: `RestoreGeneratedService.apply`, `applyRestoreGenerated`, and exact CLI
  `restore-generated <path>`.

- [ ] **Step 1: Add the literal failing post-confirmation race test**

```ts
import { expect, it } from 'vitest';

it('rejects a generated leaf changed after confirmation', async () => {
  const fixture = restoreApplyFixture('AGENTS.md');
  const plan = await fixture.service.plan(fixture.context, fixture.path);
  const confirmed = fixture.confirm(plan);
  fixture.writeGenerated('concurrent user bytes\n');

  await expect(fixture.service.apply(confirmed)).rejects.toMatchObject({
    diagnostic: { code: 'EVK_CONFIG_CAPABILITY_UNAVAILABLE', reason: 'restore-observation-changed' },
  });
  expect(fixture.readGenerated()).toBe('concurrent user bytes\n');
  expect(fixture.retainedPreimageFiles()).toStrictEqual([]);
  expect(fixture.transactionTargetWrites()).toStrictEqual([]);
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/restore-generated.spec.ts --passWithNoTests=false --reporter=verbose -t "rejects a generated leaf changed after confirmation"
```

Expected RED: exit `1`; concurrent bytes are overwritten/backed up or target write begins.

- [ ] **Step 3: Add the literal apply observation gate**

```ts
async apply(plan: ConfirmedRestorePlan): Promise<TransactionOutcome> {
  const current = await this.context.filesystem.inspectVerified(
    plan.entries[0]!.path,
    plan.entries[0]!.observed,
    this.context.readBudget,
  );
  if (!sameObservedPathState(current, plan.entries[0]!.observed)) {
    throw restoreError('restore-observation-changed');
  }
  return this.transactionManager.restore(plan);
}
```

The transaction header contains exact `RetainedPreimageRotationV1`. After the complete forward
intent barrier, `stageRetainedPreimageVerified` writes and flushes one EVKP frame while leaving old
fixed retained state unchanged. Only then may expected generated bytes replace the target. Final
candidate tree and committed frame must verify before
`commitRetainedPreimageRotationVerified` publishes the new fixed frame. Pre-commit rollback removes
only unchanged staged prefix/full bytes and preserves old fixed frame; terminal committed recovery can
only finish/verify publication.

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command.

Expected GREEN: exit `0`; concurrent bytes remain exact, and no preimage/target write occurs.

Add EVKP header/raw-byte/digest vectors; current absent/file; backup mismatch; newest-preimage
retention; and crashes at every stage byte/flush, target replace, final verification, terminal append,
fixed publish, parent flush, old-frame cleanup, and transaction cleanup. Every non-prefix/hybrid/
changed frame or old-fixed loss is preserve-first blocking. CLI supports dry-run and exact plan
acceptance only.

## Exact shared Phase 4 contracts

These contracts are repeated here so a task implementer does not have to infer a neighbor's names.
They are internal and do not create a public deep export.

```ts
export type LockState =
  | { readonly kind: 'absent' }
  | { readonly kind: 'present'; readonly sha256: Sha256Hex };

export interface ProcessLivenessProvider {
  currentIdentity(): Promise<RunLockOwner>;
  probe(record: RunLockOwner): Promise<'live' | 'dead' | 'reused' | 'ambiguous'>;
}

export interface TransactionManager {
  apply(
    plan: ConfirmedMutationPlan<Exclude<MutationOperation, 'restore-generated'>>,
  ): Promise<TransactionOutcome>;
  recover(plan: ConfirmedRecoveryPlan): Promise<RecoveryOutcome>;
  restore(plan: ConfirmedRestorePlan): Promise<TransactionOutcome>;
}

export interface RecoveryService {
  inspect(): Promise<RecoveryStatus>;
  plan(operationId: string, action: 'complete' | 'rollback'): Promise<RecoveryPlan>;
  apply(plan: ConfirmedRecoveryPlan): Promise<RecoveryOutcome>;
}

export interface RestoreGeneratedService {
  plan(context: ReadOnlyProjectContext, path: PortableRelativePath): Promise<RestorePlan>;
  apply(plan: ConfirmedRestorePlan): Promise<TransactionOutcome>;
}

export function planInit(request: InitRequest): Promise<MutationPlan<'init'>>;
export function applyInit(plan: ConfirmedMutationPlan<'init'>): Promise<TransactionOutcome>;
export function planSync(request: SyncRequest): Promise<MutationPlan<'sync'>>;
export function applySync(plan: ConfirmedMutationPlan<'sync'>): Promise<TransactionOutcome>;
export function planRefreshLocal(
  request: RefreshLocalRequest,
): Promise<MutationPlan<'refresh-local'>>;
export function applyRefreshLocal(
  plan: ConfirmedMutationPlan<'refresh-local'>,
): Promise<TransactionOutcome>;
export function planReport(request: ReportRequest): Promise<MutationPlan<'report'>>;
export function applyReport(
  plan: ConfirmedMutationPlan<'report'>,
): Promise<TransactionOutcome>;
```

The local-state layout and basename grammar are closed:

```text
.ai-tooling/run.lock
.ai-tooling/.run-lock-advance-<operation-uuid>-<43-char-nonce>.stage
.ai-tooling/transactions/<operation-uuid>.journal
.ai-tooling/transactions/.journal-prefix-<operation-uuid>-g<generation>-<expected-sha256>-<prefix-sha256>.stage
.ai-tooling/backups/<operation-uuid>-<six-digit-step>.bak
.ai-tooling/backups/retained-<portable-path-key-sha256>.preimage
.ai-tooling/backups/.retained-<portable-path-key-sha256>-<operation-uuid>-<43-char-nonce>.stage
.ai-tooling/stale-locks/<operation-uuid>.run-lock
.ai-tooling/stale-locks/<operation-uuid>.recovery-handoff
.ai-tooling/stale-locks/.handoff-<operation-uuid>-<43-char-nonce>.stage
.ai-tooling/stale-locks/.terminal-archive-<operation-uuid>-g<generation>-<expected-sha256>-<candidate-sha256>.stage
.ai-tooling/reports/<portable-name>.json
.ai-tooling/reports/.evk-ai-tooling-tmp-<operation-uuid>-<43-char-nonce>-<six-digit-step>
<target-parent>/.evk-ai-tooling-tmp-<operation-uuid>-<43-char-nonce>-<six-digit-step>
<target-parent>/.evk-ai-tooling-rollback-<operation-uuid>-<43-char-nonce>-<six-digit-step>
```

Angle-bracket terms in this grammar are typed substitutions, not filenames accepted from a caller.
Operation UUID is lowercase RFC 4122 v4. Nonce is exactly 43 unpadded base64url characters. Step is
`000001..100000`. Generation is canonical decimal `1..1000000` without a leading zero. Digests are
64 lowercase hex. Unknown names and matching-looking names without exact authority are blocking.

The mutation-plan output limits are exact:

```ts
export interface MutationPlanOutputLimits {
  readonly maxEntries: 100000;
  readonly maxEntryUnifiedDiffBytes: 33554432;
  readonly maxAggregateUnifiedDiffBytes: 50331648;
  readonly maxRenderedBytes: 67108864;
  readonly maxConfirmationFrameBytes: 65;
}
```

The journal types and final logical digest remain exactly:

```ts
export type JournalSequence = number & { readonly __journalSequence: unique symbol };
export type JournalFrameV1 =
  | { readonly sequence: 0; readonly type: 'header'; readonly payload: JournalHeaderPayloadV1 }
  | { readonly sequence: JournalSequence; readonly type: 'intent'; readonly payload: JournalIntentMarkerV1 }
  | { readonly sequence: JournalSequence; readonly type: 'completed'; readonly payload: JournalCompletionPayloadV1 }
  | { readonly sequence: JournalSequence; readonly type: 'rollback-intent'; readonly payload: JournalIntentMarkerV1 }
  | { readonly sequence: JournalSequence; readonly type: 'rollback-completed'; readonly payload: JournalCompletionPayloadV1 }
  | { readonly sequence: JournalSequence; readonly type: 'committed'; readonly payload: JournalTerminalPayloadV1 }
  | { readonly sequence: JournalSequence; readonly type: 'rolled-back'; readonly payload: JournalTerminalPayloadV1 };

export interface FinalTreeDigestProjectionV1 extends JsonObject {
  readonly schemaVersion: 1;
  readonly scope: 'planned-mutations';
  readonly outcome: 'candidate' | 'prior';
  readonly entries: readonly (JsonObject & {
    readonly path: PortableRelativePath;
    readonly state:
      | (JsonObject & { readonly kind: 'absent' })
      | (JsonObject & { readonly kind: 'directory'; readonly mode: '040000' })
      | (JsonObject & {
          readonly kind: 'file';
          readonly mode: '100644';
          readonly digest: Sha256Hex;
          readonly byteLength: number;
        });
  })[];
}
```

The final-tree projection contains every planned path except `ai-tooling.lock.json`, sorted by portable
key plus original UTF-8 bytes. Candidate uses desired logical states; prior uses observed logical
states. Link/other is never terminal-valid. Identity, timestamps, backup/stage paths, source bytes, and
repository lock are excluded. The adjacent explicit final lock state binds the repository lock. Every
terminal journal, terminal archive, inert remnant verification, and retained-authority reissue calls
this single projection and SHA-256-over-JCS function.

## 4.8 Recovery documentation and native workflow

### Task 4.8.1: Add exact Phase 4 temporary-root suites to the native matrix

**Files:**

- Modify: `.github/workflows/ai-tooling.yml`
- Modify: `packages/ai-tooling/tests/integration/biome-exclusions.spec.ts`
- Create: `docs/ai-tooling/USER-GUIDE.md`
- Modify: `docs/ai-tooling/SECURITY.md`
- Modify: `docs/system-overview/ai-tooling.md`

**Interfaces:**

- Consumes: the Phase 3 `ubuntu-24.04`/`windows-2025`/`macos-15` workflow matrix, package scripts,
  and offline `docs check-links`.
- Produces: exact Phase 4 workflow steps and durable user/security/architecture sections with no
  reverse link to this plan or the child specification.

- [ ] **Step 1: Add the literal failing workflow-contract assertion**

```ts
import { expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';

it('runs every Phase 4 native suite only against temporary repositories', async () => {
  const workflow = await readFile('.github/workflows/ai-tooling.yml', 'utf8');
  expect(workflow).toContain(
    'pnpm --filter @evk-soft/ai-tooling exec vitest run tests/native/repository-filesystem.native.spec.ts tests/native/run-lock-liveness.native.spec.ts tests/native/transaction-recovery.native.spec.ts --passWithNoTests=false --reporter=verbose',
  );
  expect(workflow).toContain('AI_TOOLING_TEST_REPOSITORY_MODE: temporary-only');
  expect(workflow).not.toMatch(
    /node packages\/ai-tooling\/dist\/cli\.js (init|sync|restore-generated|pack refresh-local|doctor --repair)/,
  );
});
```

- [ ] **Step 2: Run the named test and require RED**

Run:

```text
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/biome-exclusions.spec.ts --passWithNoTests=false --reporter=verbose -t "runs every Phase 4 native suite only against temporary repositories"
```

Expected RED: exit `1`; the existing workflow lacks the exact Phase 4 suite command and
`temporary-only` environment marker.

- [ ] **Step 3: Add the literal workflow step**

```yaml
      - name: Phase 4 native mutation and recovery fixtures
        env:
          AI_TOOLING_TEST_REPOSITORY_MODE: temporary-only
        run: pnpm --filter @evk-soft/ai-tooling exec vitest run tests/native/repository-filesystem.native.spec.ts tests/native/run-lock-liveness.native.spec.ts tests/native/transaction-recovery.native.spec.ts --passWithNoTests=false --reporter=verbose
```

Add this exact step once inside the existing three-row matrix job after native build and before the
final real-checkout census comparison. Keep action SHA pins, read-only permissions, `fail-fast: false`,
Node 24, pnpm 11.20.0, `HUSKY: '0'`, frozen `--ignore-scripts` install, and the Phase 3 checkout
baseline. The job invokes no real-checkout mutator; fixtures create their own roots/homes.

The new `USER-GUIDE.md` headings are exactly:

```markdown
# AI Tooling Stage 1 User Guide

## Clean initialization
## Reviewing and accepting a mutation plan
## Synchronization and semantic drift
## Refreshing a tracked local pack
## Preserving and restoring modified generated output
## Read-only diagnosis and reports
## Confirmed interrupted-operation repair
## Missing or ambiguous recovery evidence
## Backup and retained-preimage rules
## Stage 1 command boundaries
```

Under those headings, document exact command forms, dry-run and digest acceptance, clean-init collision
rules, sync diagnostic distinction, refresh-lock-only behavior, compare-and-swap restore, read-only
doctor, explicit report path, repair operation/action/digest, preserve-first missing-evidence actions,
no force/adoption/hook/plugin/remote/cache behavior, and expected exit classes. The security guide adds
native liveness providers, path/authority containment, recovery handoff, active-evidence retention,
and the repository-ACL confidentiality boundary: Stage 1 protects integrity and containment but does
not broaden permissions or claim confidentiality from another principal already able to read the
checkout. The system overview receives the same durable behavior at architecture depth. None names
this temporary plan/spec.

- [ ] **Step 4: Rerun and require GREEN**

Run the exact Step 2 command, then run:

```text
pnpm --filter @evk-soft/ai-tooling run build
node packages/ai-tooling/dist/cli.js docs check-links
```

`dist/` is a build output and is never committed, so this is the first Phase 4 command that needs it;
the build must precede the link check in this worktree.

Expected GREEN: both commands exit `0`; exact workflow step is present, no real-checkout mutator is
matched, all local links/anchors/case pass, and a repository-wide exact filename census for the plan
and child spec returns no durable-doc match.

The separately authorized post-candidate exact-SHA run is the native execution proof. Local YAML
shape and current-OS tests are mechanical evidence only; they do not substitute for all three native
jobs.

## 4.9 Phase 4 gate, single commit, native proof, and owner stop

### Task 4.9.1: Prove the complete Phase 4 delta and create the only commit

**Files:**

- Stage: exactly the 54 paths in
  `docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-4.txt`
- Modify: no path outside that manifest
- Commit: one commit only, after every local and cached gate passes

**Interfaces:**

- Consumes: unchanged approved-base `verify-phase-delta.mjs`, Phase 4 manifest bytes from approved
  `HEAD`, artifact scanner, package checks, current-OS native tests, and optional separately authorized
  exact-SHA validation branch transport.
- Produces: one candidate commit with message `feat(ai): add safe mutation and recovery`, exact
  parent equal to the approved Phase 3 commit, all three native jobs green, and an owner stop before
  Phase 5.

- [ ] **Step 1: Run the full unstaged local gate; do not commit on any failure**

Run exactly from the clean isolated Phase 4 worktree:

```powershell
$approvedBase = (& git rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0 -or $approvedBase -notmatch '^[0-9a-f]{40}$') { throw 'invalid approved Phase 3 base' }
& git diff --exit-code HEAD -- packages/ai-tooling/scripts/verify-phase-delta.mjs
if ($LASTEXITCODE -ne 0) { throw 'approved-base verifier bytes changed' }
& git diff --exit-code HEAD -- docs/superpowers/plans/manifests/ai-tooling-stage-1-phase-4.txt
if ($LASTEXITCODE -ne 0) { throw 'Phase 4 manifest bytes changed' }
pnpm --filter @evk-soft/ai-tooling run typecheck
if ($LASTEXITCODE -ne 0) { throw 'typecheck failed' }
pnpm --filter @evk-soft/ai-tooling run test:unit
if ($LASTEXITCODE -ne 0) { throw 'unit tests failed' }
pnpm --filter @evk-soft/ai-tooling run test:integration
if ($LASTEXITCODE -ne 0) { throw 'integration tests failed' }
pnpm --filter @evk-soft/ai-tooling run test:native
if ($LASTEXITCODE -ne 0) { throw 'native tests failed' }
pnpm --filter @evk-soft/ai-tooling run build
if ($LASTEXITCODE -ne 0) { throw 'build failed' }
pnpm --filter @evk-soft/ai-tooling run pack:check
if ($LASTEXITCODE -ne 0) { throw 'package-content check failed' }
node packages/ai-tooling/scripts/check-stage1-artifacts.mjs --phase 4 --tree
if ($LASTEXITCODE -ne 0) { throw 'tree artifact scan failed' }
pnpm check
if ($LASTEXITCODE -ne 0) { throw 'repository check failed' }
git diff --check
if ($LASTEXITCODE -ne 0) { throw 'worktree whitespace check failed' }
```

Expected GREEN: every command exits `0`; the current-OS native suite executes all applicable Phase 4
assertions, and no test uses the real repository or real user platform configuration.

- [ ] **Step 2: Run the command-surface, security, and real-worktree absence gates**

Run exactly:

```powershell
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/init.spec.ts tests/integration/sync.spec.ts tests/integration/refresh-local.spec.ts tests/integration/restore-generated.spec.ts tests/integration/doctor-repair.spec.ts tests/integration/doctor-report.spec.ts --passWithNoTests=false --reporter=verbose
if ($LASTEXITCODE -ne 0) { throw 'command-surface integration gate failed' }
$forbidden = @('ai-tooling.config.json','ai-tooling.lock.json','AGENTS.md','CLAUDE.md','.agents','.claude','.ai-tooling')
foreach ($path in $forbidden) {
  if (Test-Path -LiteralPath $path) { throw "real worktree mutation exists: $path" }
}
git diff --exit-code -- .gitignore biome.json configs/biome-config .husky
if ($LASTEXITCODE -ne 0) { throw 'human-owned repository configuration changed' }
```

The integration assertions must prove every mutator supports dry-run, noninteractive writes require
exact acceptance, and `--force`, adoption, import, hook, plugin, update, remove, preview, remote, and
cache surfaces remain unavailable. The real worktree must contain no config, lock, output, report, or
local state.

- [ ] **Step 3: Run the exact hook formatter and verify the manifest-scoped worktree**

Run exactly:

```powershell
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) { throw 'index is not empty before formatter gate' }
pnpm -s exec biome check --write .
if ($LASTEXITCODE -ne 0) { throw 'hook-equivalent Biome command failed' }
node packages/ai-tooling/scripts/verify-phase-delta.mjs --phase 4 --worktree
if ($LASTEXITCODE -ne 0) { throw 'worktree delta differs from Phase 4 manifest' }
node packages/ai-tooling/scripts/check-stage1-artifacts.mjs --phase 4 --tree
if ($LASTEXITCODE -ne 0) { throw 'post-formatter tree artifact scan failed' }
pnpm --filter @evk-soft/ai-tooling run typecheck
if ($LASTEXITCODE -ne 0) { throw 'post-formatter typecheck failed' }
pnpm --filter @evk-soft/ai-tooling run test:unit
if ($LASTEXITCODE -ne 0) { throw 'post-formatter unit tests failed' }
pnpm --filter @evk-soft/ai-tooling run test:integration
if ($LASTEXITCODE -ne 0) { throw 'post-formatter integration tests failed' }
pnpm --filter @evk-soft/ai-tooling run test:native
if ($LASTEXITCODE -ne 0) { throw 'post-formatter native tests failed' }
git diff --check
if ($LASTEXITCODE -ne 0) { throw 'post-formatter whitespace check failed' }
```

Do not run the legacy hook's `git add -A`. If Biome changes a path outside the manifest, stop without
staging or committing.

- [ ] **Step 4: Stage every manifest path explicitly and no other path**

Run exactly:

```powershell
git add -- .github/workflows/ai-tooling.yml
git add -- docs/ai-tooling/SECURITY.md
git add -- docs/ai-tooling/USER-GUIDE.md
git add -- docs/system-overview/ai-tooling.md
git add -- packages/ai-tooling/native/win32-helper/main.cc
git add -- packages/ai-tooling/native/win32-helper/protocol.h
git add -- packages/ai-tooling/src/cli.ts
git add -- packages/ai-tooling/src/commands/doctor.ts
git add -- packages/ai-tooling/src/commands/init.ts
git add -- packages/ai-tooling/src/commands/refresh-local.ts
git add -- packages/ai-tooling/src/commands/restore-generated.ts
git add -- packages/ai-tooling/src/commands/sync.ts
git add -- packages/ai-tooling/src/fs/local-state-prerequisite.ts
git add -- packages/ai-tooling/src/fs/path-identity.ts
git add -- packages/ai-tooling/src/fs/repository-filesystem.ts
git add -- packages/ai-tooling/src/native/win32-helper.ts
git add -- packages/ai-tooling/src/recovery/inspect.ts
git add -- packages/ai-tooling/src/recovery/linux-procfs.ts
git add -- packages/ai-tooling/src/recovery/liveness.ts
git add -- packages/ai-tooling/src/recovery/macos-ps.ts
git add -- packages/ai-tooling/src/recovery/repair.ts
git add -- packages/ai-tooling/src/recovery/restore-generated.ts
git add -- packages/ai-tooling/src/recovery/retention.ts
git add -- packages/ai-tooling/src/recovery/run-lock.ts
git add -- packages/ai-tooling/src/recovery/windows-native.ts
git add -- packages/ai-tooling/src/transaction/backup-store.ts
git add -- packages/ai-tooling/src/transaction/journal.ts
git add -- packages/ai-tooling/src/transaction/mutation-plan.ts
git add -- packages/ai-tooling/src/transaction/rollback.ts
git add -- packages/ai-tooling/src/transaction/transaction-manager.ts
git add -- packages/ai-tooling/src/transaction/types.ts
git add -- packages/ai-tooling/tests/fixtures/init/vectors.json
git add -- packages/ai-tooling/tests/fixtures/mutation-plan-digest/vectors.json
git add -- packages/ai-tooling/tests/fixtures/sync/vectors.json
git add -- packages/ai-tooling/tests/integration/biome-exclusions.spec.ts
git add -- packages/ai-tooling/tests/integration/doctor-repair.spec.ts
git add -- packages/ai-tooling/tests/integration/doctor-report.spec.ts
git add -- packages/ai-tooling/tests/integration/init.spec.ts
git add -- packages/ai-tooling/tests/integration/refresh-local.spec.ts
git add -- packages/ai-tooling/tests/integration/restore-generated.spec.ts
git add -- packages/ai-tooling/tests/integration/sync.spec.ts
git add -- packages/ai-tooling/tests/native/repository-filesystem.native.spec.ts
git add -- packages/ai-tooling/tests/native/run-lock-liveness.native.spec.ts
git add -- packages/ai-tooling/tests/native/transaction-recovery.native.spec.ts
git add -- packages/ai-tooling/tests/unit/journal.spec.ts
git add -- packages/ai-tooling/tests/unit/liveness.spec.ts
git add -- packages/ai-tooling/tests/unit/local-state-prerequisite.spec.ts
git add -- packages/ai-tooling/tests/unit/mutation-plan-digest.spec.ts
git add -- packages/ai-tooling/tests/unit/recovery-inspect.spec.ts
git add -- packages/ai-tooling/tests/unit/recovery-repair.spec.ts
git add -- packages/ai-tooling/tests/unit/repository-filesystem-mutation.spec.ts
git add -- packages/ai-tooling/tests/unit/restore-generated.spec.ts
git add -- packages/ai-tooling/tests/unit/run-lock.spec.ts
git add -- packages/ai-tooling/tests/unit/transaction-manager.spec.ts
```

Expected GREEN: every command exits `0`. No glob, directory staging, or broad add is permitted.

- [ ] **Step 5: Verify cached bytes against the approved-base manifest and artifact policy**

Run exactly:

```powershell
git diff --cached --check
if ($LASTEXITCODE -ne 0) { throw 'cached whitespace check failed' }
node packages/ai-tooling/scripts/verify-phase-delta.mjs --phase 4 --cached
if ($LASTEXITCODE -ne 0) { throw 'cached delta differs from Phase 4 manifest' }
node packages/ai-tooling/scripts/check-stage1-artifacts.mjs --phase 4 --cached
if ($LASTEXITCODE -ne 0) { throw 'cached artifact scan failed' }
```

Expected GREEN: all commands exit `0`; the verifier loads the manifest from committed approved
`HEAD`, rejects working/index manifest drift, and proves exact status/path/mode equality with no
symlink, submodule, conflict, extra, missing, unexpected deletion, rename, or type change.

- [ ] **Step 6: Create the sole Phase 4 candidate commit and verify exact parent/tree delta**

Run exactly:

```powershell
git commit --no-verify -m "feat(ai): add safe mutation and recovery"
if ($LASTEXITCODE -ne 0) { throw 'Phase 4 commit failed' }
$candidate = (& git rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0 -or $candidate -notmatch '^[0-9a-f]{40}$') { throw 'invalid Phase 4 candidate commit' }
node packages/ai-tooling/scripts/verify-phase-delta.mjs --phase 4 --base $approvedBase --commit $candidate
if ($LASTEXITCODE -ne 0) { throw 'candidate commit delta or parent is invalid' }
```

Expected GREEN: commit succeeds once; verifier proves the candidate raw commit has exactly one literal
parent equal to `$approvedBase`, reads exact commit/tree objects with no replacement/lazy fetch, and
matches the Phase 4 manifest. Do not amend unless a later local/native gate fails; any authorized amend
remains the sole Phase 4 commit and must repeat every gate.

- [ ] **Step 7: Rerun the complete local gate against committed `HEAD` and require a clean worktree**

Run exactly:

```powershell
pnpm --filter @evk-soft/ai-tooling run typecheck
if ($LASTEXITCODE -ne 0) { throw 'committed typecheck failed' }
pnpm --filter @evk-soft/ai-tooling run test:unit
if ($LASTEXITCODE -ne 0) { throw 'committed unit tests failed' }
pnpm --filter @evk-soft/ai-tooling run test:integration
if ($LASTEXITCODE -ne 0) { throw 'committed integration tests failed' }
pnpm --filter @evk-soft/ai-tooling run test:native
if ($LASTEXITCODE -ne 0) { throw 'committed native tests failed' }
pnpm --filter @evk-soft/ai-tooling run build
if ($LASTEXITCODE -ne 0) { throw 'committed build failed' }
pnpm --filter @evk-soft/ai-tooling run pack:check
if ($LASTEXITCODE -ne 0) { throw 'committed package-content check failed' }
node packages/ai-tooling/scripts/check-stage1-artifacts.mjs --phase 4 --tree
if ($LASTEXITCODE -ne 0) { throw 'committed tree artifact scan failed' }
pnpm check
if ($LASTEXITCODE -ne 0) { throw 'committed repository check failed' }
$status = & git status --porcelain=v1 -z --untracked-files=all --ignore-submodules=all
if ($LASTEXITCODE -ne 0 -or $status.Length -ne 0) { throw 'committed Phase 4 worktree is not clean' }
```

Expected GREEN: every command exits `0`; status is empty.

- [ ] **Step 8: Stop for separate validation-push authorization**

Do not push under Phase 4 implementation approval. If and only if the owner separately authorizes the
temporary validation push, run exactly:

```powershell
$fetchUrls = @(& git remote get-url --all origin)
$pushUrls = @(& git remote get-url --all --push origin)
if ($fetchUrls.Count -ne 1 -or $fetchUrls[0] -ne 'https://github.com/evk-soft/devkit.git') { throw 'unexpected origin fetch identity' }
if ($pushUrls.Count -ne 1 -or $pushUrls[0] -ne 'https://github.com/evk-soft/devkit.git') { throw 'unexpected origin push identity' }
git push origin HEAD:refs/heads/codex/ai-tooling-stage1-validation
if ($LASTEXITCODE -ne 0) { throw 'validation push failed' }
node packages/ai-tooling/scripts/await-native-validation.mjs --host github.com --repo github.com/evk-soft/devkit --workflow ai-tooling.yml --branch codex/ai-tooling-stage1-validation --timeout-seconds 2700
if ($LASTEXITCODE -ne 0) { throw 'exact-SHA native validation failed' }
```

The accepted run must be the one upstream `push` run for the exact `$candidate` SHA and must contain
exactly green Windows, Linux, and macOS jobs. Those jobs execute all Phase 4 containment, ancestor-swap,
absent/present/noncanonical lock, liveness, malformed/injection run-lock, pre-journal/no-journal,
journal-ready/no-journal, rollback, retained failed-rollback, repair, retention, third-state, report,
and restore-race fixtures.

If the exact-SHA workflow fails, repair in the same isolated worktree, repeat every RED/GREEN and gate,
amend the sole commit with `git commit --amend --no-edit --no-verify`, rerun commit-mode verification,
and only under the same separate validation authorization update the temporary branch with the exact
fetch and force-with-lease sequence from the master Stage 1 plan. Do not create a second commit.

- [ ] **Step 9: Publish evidence to the owner and stop**

Report the final exact commit SHA, approved base SHA, local command results, manifest/cached/artifact
verifier results, current-OS native results, and exact-SHA three-job run links. Then stop. Do not start
Phase 5 until the owner explicitly approves that exact Phase 4 commit.

## Phase 4 source-contract traceability

| Approved master subsection | Executable tasks |
|---|---|
| 4.1 mutation gateway, path identities, direct coordination writes, backups, retained frames, handoff, native containment | 4.1.1-4.1.9 |
| 4.2 strict run locks and shell-free native liveness | 4.2.1-4.2.5 |
| 4.3 plan digest, journal framing, intent barriers, single authority, forward commit, rollback, remnants, crash matrix | 4.3.1-4.3.9 |
| 4.4 inspection, evidence-bound planning, prefix repair, recovery handoff, terminal retention, report, doctor CLI | 4.4.1-4.4.7 |
| 4.5 clean init and post-journal-ready collision revalidation | 4.5.1-4.5.2 |
| 4.6 semantic sync, canonical lock-only repair, explicit local refresh | 4.6.1-4.6.3 |
| 4.7 compare-and-swap restore and EVKP retention | 4.7.1-4.7.2 |
| 4.8 durable documentation and temporary-root native workflow | 4.8.1 |
| 4.9 one manifest-scoped commit, exact-parent verification, native proof, owner stop | 4.9.1 |

This plan remains documentation-only and awaiting owner approval. Its existence is not implementation
authorization.
