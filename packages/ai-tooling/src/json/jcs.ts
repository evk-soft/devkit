import { createHash } from 'node:crypto';

import { canonicalizeEx } from 'json-canonicalize';

import type { JsonValue } from '../model/types.js';

/**
 * RFC 8785 JSON Canonicalization Scheme.
 *
 * One logical value always yields one byte sequence: object keys are ordered, numbers get their
 * shortest round-trip spelling, and strings keep their exact code points. Canonicalization never
 * applies Unicode normalization, so a decomposed and a precomposed spelling stay distinct — folding
 * them would silently merge two different documents into one digest.
 *
 * These bytes are never the human-readable rendering of generated JSON; they exist to be hashed.
 */
export function jcsBytes(value: JsonValue): Uint8Array {
  const text = canonicalizeEx(value, {
    allowCircular: false,
    filterUndefined: false,
    undefinedInArrayToNull: false,
  });
  if (typeof text !== 'string') throw new Error('JCS serializer returned no text');
  return new TextEncoder().encode(text);
}

export function sha256Jcs(value: JsonValue): string {
  return createHash('sha256').update(jcsBytes(value)).digest('hex');
}
