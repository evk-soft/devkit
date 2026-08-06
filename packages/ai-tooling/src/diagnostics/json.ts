import type { JsonValue } from '../model/types.js';
import type { Diagnostic } from './error.js';
import { encodeJsonScalar } from './terminal-safe.js';

/**
 * Renders a diagnostic as a machine-readable JSON object.
 *
 * Every string is emitted through the JSON-mode scalar encoder, so the rendered bytes contain no
 * hazardous scalar while `JSON.parse` still returns the exact original logical strings. The shape is
 * closed: there is no field for source bytes, tokens, credentials, or absolute paths.
 */
export function renderMachineDiagnostic(diagnostic: Diagnostic): string {
  return renderValue({
    code: diagnostic.code,
    message: diagnostic.message,
    reason: diagnostic.reason,
    fields: diagnostic.fields,
    recoveryActions: diagnostic.recoveryActions,
  });
}

function renderString(value: string): string {
  let out = '"';
  for (const character of value) {
    out += encodeJsonScalar(character.codePointAt(0) ?? 0);
  }
  return `${out}"`;
}

function renderValue(value: JsonValue): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('diagnostic numbers must be finite');
    return JSON.stringify(value);
  }
  if (typeof value === 'string') return renderString(value);
  if (Array.isArray(value)) return `[${value.map(renderValue).join(',')}]`;
  const entries = Object.entries(value as { readonly [key: string]: JsonValue });
  // Sorted by raw key bytes so the same diagnostic always renders the same bytes.
  entries.sort(([left], [right]) =>
    Buffer.compare(Buffer.from(left, 'utf8'), Buffer.from(right, 'utf8')),
  );
  return `{${entries.map(([key, item]) => `${renderString(key)}:${renderValue(item)}`).join(',')}}`;
}
