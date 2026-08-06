/**
 * The closed Stage 1 diagnostic registry.
 *
 * Membership is fixed and written literally: no code is synthesized at runtime, and no member is
 * formed by concatenation. Source kind, parser and schema detail, containment and resource detail,
 * and recovery state are carried in closed machine-readable fields and reasons rather than by
 * inventing new codes.
 */
export const DIAGNOSTIC_CODES = {
  EVK_CONFIG_CAPABILITY_UNAVAILABLE: true,
  EVK_CONFIG_JSON_INVALID: true,
  EVK_CONFIG_REQUIRES_UPDATE: true,
  EVK_LOCK_NONCANONICAL: true,
  EVK_PACK_CAPABILITY_UNAVAILABLE: true,
  EVK_PACK_SOURCE_INVALID: true,
  EVK_OUTPUT_MODIFIED: true,
  EVK_OUTPUT_SHADOWED: true,
  EVK_OUTPUT_FORMATTER_REJECTED: true,
  EVK_OUTPUT_FORMATTER_CONFLICT: true,
  EVK_RECOVERY_EVIDENCE_MISSING: true,
  EVK_SECURITY_EXECUTABLE_CONSENT_REQUIRED: true,
  EVK_SECURITY_RESOURCE_LIMIT: true,
  EVK_SECURITY_OUTPUT_ENCODING_INVALID: true,
  EVK_SECURITY_FORMATTER_PROVIDER_INVALID: true,
  EVK_SECURITY_FORMATTER_PROVIDER_UNAVAILABLE: true,
  EVK_SECURITY_FORMATTER_EXECUTION_FAILED: true,
  EVK_SECURITY_FORMATTER_CHECKOUT_CHANGED: true,
  EVK_SECURITY_FORMATTER_CHECKOUT_UNVERIFIED: true,
} as const;

export type DiagnosticCode = keyof typeof DIAGNOSTIC_CODES;

/** The only reasons an encoding-invalid diagnostic may carry. */
export const ENCODING_INVALID_REASONS = ['malformed-utf8', 'non-scalar-value'] as const;

export type EncodingInvalidReason = (typeof ENCODING_INVALID_REASONS)[number];
