import type { JsonValue } from '../model/types.js';

/**
 * Renders already-validated JSON as the exact bytes a generated file will contain.
 *
 * Keys are emitted in the supplied schema order rather than alphabetically, so a generated document
 * reads the way its schema is written. A key missing from that order is an error, not a fallback:
 * silently appending it would let a field appear in output that no schema ordering accounts for,
 * and the byte result would then depend on object construction order.
 *
 * This is not the canonicalizer. It never calls JCS or a formatter, never folds by line width, emits
 * no byte-order mark, indents with two spaces, uses LF, and ends with exactly one final LF.
 */
export function renderGeneratedJson(value: JsonValue, keyOrder: readonly string[]): Uint8Array {
  const rank = new Map<string, number>();
  keyOrder.forEach((key, index) => {
    rank.set(key, index);
  });

  const renderScalar = (scalar: JsonValue): string => {
    if (scalar === null) return 'null';
    if (typeof scalar === 'boolean') return scalar ? 'true' : 'false';
    if (typeof scalar === 'number') {
      if (!Number.isFinite(scalar)) throw new Error('generated JSON numbers must be finite');
      return JSON.stringify(scalar);
    }
    // JSON.stringify applies exactly the escapes JSON requires and leaves every other code point
    // intact, so Unicode survives unchanged.
    return JSON.stringify(scalar);
  };

  const render = (current: JsonValue, depth: number): string => {
    const pad = '  '.repeat(depth);
    const innerPad = '  '.repeat(depth + 1);

    if (Array.isArray(current)) {
      if (current.length === 0) return '[]';
      const items = current.map((item) => `${innerPad}${render(item, depth + 1)}`);
      return `[\n${items.join(',\n')}\n${pad}]`;
    }

    if (current !== null && typeof current === 'object') {
      const entries = Object.entries(current as { readonly [key: string]: JsonValue });
      if (entries.length === 0) return '{}';
      for (const [key] of entries) {
        if (!rank.has(key)) throw new Error(`key is not in the schema key order: ${key}`);
      }
      entries.sort(([left], [right]) => (rank.get(left) ?? 0) - (rank.get(right) ?? 0));
      const rendered = entries.map(
        ([key, item]) => `${innerPad}${JSON.stringify(key)}: ${render(item, depth + 1)}`,
      );
      return `{\n${rendered.join(',\n')}\n${pad}}`;
    }

    return renderScalar(current);
  };

  return new TextEncoder().encode(`${render(value, 0)}\n`);
}
