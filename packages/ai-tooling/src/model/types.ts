/** Core value types shared across the Stage 1 contracts. */

export type JsonPrimitive = string | number | boolean | null;

export type JsonValue =
  | JsonPrimitive
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

/**
 * Identifies the origin of parsed bytes for diagnostics.
 *
 * `label` is either null or a prevalidated logical package or resource ID of at most 256 UTF-8
 * bytes. It is never a path, URL, token, source fragment, or free-text message, so a diagnostic can
 * name what failed without disclosing where it lives on disk or what it contained.
 */
export interface RedactedSource {
  readonly kind: 'config' | 'override' | 'pack' | 'lock' | 'schema' | 'fixture';
  readonly label: string | null;
}

declare const containedPathBrand: unique symbol;

/**
 * A path proven to lie inside its gateway's root.
 *
 * The brand can only be produced by a gateway, so a caller cannot hand a raw absolute path to code
 * that reads or writes. Containment is therefore a property of the type, not of a runtime check
 * somebody might forget.
 */
export interface ContainedPathRef {
  readonly [containedPathBrand]: true;
  readonly relativePath: string;
}

/** A monotonic read allowance shared by every reader in one command. */
export interface RepositoryReadBudget {
  claim(bytes: number): void;
  claimEntry(): void;
}

export interface ReadOnlyRepositoryFilesystem {
  resolve(relativePath: string): ContainedPathRef;
  readFile(ref: ContainedPathRef, budget: RepositoryReadBudget): Promise<Uint8Array>;
  listDirectory(ref: ContainedPathRef, budget: RepositoryReadBudget): Promise<readonly string[]>;
  isExecutable(ref: ContainedPathRef, budget: RepositoryReadBudget): Promise<boolean>;
}

export interface ReadOnlySourceContext {
  readonly filesystem: ReadOnlyRepositoryFilesystem;
  readonly readBudget: RepositoryReadBudget;
}
