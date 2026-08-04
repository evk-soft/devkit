import type { PackageName, RelativePath, ResourceId, SemanticVersion } from '../pack/types.js';

/** Handwritten version-1 configuration, lock, and repository-local state types. */

export type Sha256Hex = string;
export type PlatformId = 'claude-code' | 'codex';
export type OutputMode = 'managed' | 'preview';

export interface LocalSourceV1 {
  readonly kind: 'local';
  readonly path: RelativePath;
}

export interface NpmSourceV1 {
  readonly kind: 'npm';
  readonly name: PackageName;
  readonly version: SemanticVersion;
}

export interface GitSourceV1 {
  readonly kind: 'git';
  readonly url: string;
  readonly commit: string;
  readonly subdirectory?: RelativePath;
}

export type SourceV1 = LocalSourceV1 | NpmSourceV1 | GitSourceV1;

export interface HooksV1 {
  readonly install: boolean;
  readonly preCommit: boolean;
}

export interface PluginsV1 {
  readonly profile: 'none' | 'recommended';
  readonly recommendations: readonly string[];
}

export interface ConfigV1 {
  readonly version: 1;
  readonly sources: readonly SourceV1[];
  readonly platforms: readonly PlatformId[];
  readonly output?: OutputMode;
  readonly overrideDirectories?: readonly RelativePath[];
  readonly hooks?: HooksV1;
  readonly plugins?: PluginsV1;
}

export type OverrideMode = 'extend' | 'replace' | 'disable';

export interface OverrideV1 {
  readonly version: 1;
  readonly target: ResourceId;
  readonly mode: OverrideMode;
  readonly baseDigest: Sha256Hex;
  readonly instructions?: RelativePath;
}

export interface FrozenPackV1 {
  readonly name: PackageName;
  readonly packVersion: SemanticVersion;
  readonly digest: Sha256Hex;
}

export interface ManagedLeafV1 {
  readonly path: RelativePath;
  readonly platform: PlatformId;
  readonly digest: Sha256Hex;
  readonly owner: 'managed';
}

export interface LockV1 {
  readonly version: 1;
  readonly configurationDigest: Sha256Hex;
  readonly selectionDigest: Sha256Hex;
  readonly packs: readonly FrozenPackV1[];
  readonly outputs: readonly ManagedLeafV1[];
}

// --- repository-local state, frozen at version 1 -----------------------------------------------

export type MutationOperation = 'init' | 'sync' | 'refresh-local' | 'restore' | 'repair';
export type MutationAction = 'forward' | 'rollback';
export type LivenessProviderId = 'linux-procfs-v1' | 'macos-ps-v1' | 'windows-native-v1';
export type TerminalOutcomeKind = 'committed' | 'rolled-back' | 'interrupted';

export interface ProcessOwnerV1 {
  readonly host: string;
  readonly pid: number;
  readonly startMarker: string;
  readonly provider: LivenessProviderId;
}

export interface RunLockV1 {
  readonly version: 1;
  readonly operationId: string;
  readonly nonce: string;
  readonly operation: MutationOperation;
  readonly action: MutationAction;
  readonly generation: number;
  readonly owner: ProcessOwnerV1;
}

export interface PlannedStepV1 {
  readonly step: string;
  readonly path: RelativePath;
  readonly intent:
    | 'create-directory'
    | 'create-file'
    | 'replace-file'
    | 'delete-file'
    | 'write-lock';
}

export interface JournalHeaderV1 {
  readonly sequence: 0;
  readonly planDigest: Sha256Hex;
  readonly steps: readonly PlannedStepV1[];
  readonly digest: Sha256Hex;
}

export interface JournalFrameV1 {
  readonly sequence: number;
  readonly type: 'intent' | 'applied' | 'backed-up' | 'retained' | 'verified';
  readonly step: string;
  readonly action: MutationAction;
  readonly digest: Sha256Hex;
}

export interface TerminalOutcomeV1 {
  readonly outcome: TerminalOutcomeKind;
  readonly digest: Sha256Hex;
}

export interface JournalV1 {
  readonly version: 1;
  readonly operationId: string;
  readonly nonce: string;
  readonly operation: MutationOperation;
  readonly header: JournalHeaderV1;
  readonly frames: readonly JournalFrameV1[];
  readonly terminal?: TerminalOutcomeV1;
}

export interface BackupRecordV1 {
  readonly managedPath: RelativePath;
  readonly retainedPath: RelativePath;
  readonly stagingPath?: RelativePath;
  readonly digest: Sha256Hex;
  readonly kind: 'prior' | 'retained-preimage';
}

export interface RecoveryHandoffV1 {
  readonly operationId: string;
  readonly predecessor: ProcessOwnerV1;
  readonly successor: ProcessOwnerV1;
}

export interface RecoveryArchiveV1 {
  readonly path: RelativePath;
  readonly digest: Sha256Hex;
}

export interface RecoveryV1 {
  readonly state: 'none' | 'recoverable' | 'blocked' | 'repaired';
  readonly handoff?: RecoveryHandoffV1;
  readonly archive?: RecoveryArchiveV1;
}

export interface ReportV1 {
  readonly path: RelativePath;
  readonly operationId: string;
  readonly outcome: TerminalOutcomeKind | 'inspected';
}

export interface StateV1 {
  readonly version: 1;
  readonly runLock?: RunLockV1;
  readonly journal?: JournalV1;
  readonly backups?: readonly BackupRecordV1[];
  readonly recovery?: RecoveryV1;
  readonly reports?: readonly ReportV1[];
}
