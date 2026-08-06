import type { JsonValue } from '../model/types.js';
import type { DiagnosticCode } from './codes.js';

/**
 * The machine-readable payload every failure carries.
 *
 * It deliberately has no field for source bytes, tokens, credentials, or absolute paths: a
 * diagnostic names what failed and where in the input, never what the input contained.
 */
export interface Diagnostic {
  readonly code: DiagnosticCode;
  readonly message: string;
  readonly reason: string | null;
  readonly fields: Readonly<Record<string, JsonValue>>;
  readonly recoveryActions: readonly string[];
}

export class ToolingError extends Error {
  constructor(readonly diagnostic: Diagnostic) {
    super(diagnostic.message);
    this.name = 'ToolingError';
  }
}

export function toolingError(
  code: DiagnosticCode,
  message: string,
  options: {
    readonly reason?: string | null;
    readonly fields?: Readonly<Record<string, JsonValue>>;
    readonly recoveryActions?: readonly string[];
  } = {},
): ToolingError {
  return new ToolingError({
    code,
    message,
    reason: options.reason ?? null,
    fields: Object.freeze({ ...(options.fields ?? {}) }),
    recoveryActions: Object.freeze([...(options.recoveryActions ?? [])]),
  });
}
