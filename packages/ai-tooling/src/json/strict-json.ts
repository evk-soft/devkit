import { visit } from 'jsonc-parser';

import { toolingError } from '../diagnostics/error.js';
import type { JsonValue, RedactedSource } from '../model/types.js';

declare const strictJsonBrand: unique symbol;

/**
 * A document that has passed strict I-JSON parsing and nothing more.
 *
 * The brand cannot be produced outside this module, so a parsed document can never be passed off as
 * a schema-validated domain type. Schema validation is a separate, later step.
 */
export interface StrictJsonDocument {
  readonly [strictJsonBrand]: true;
  readonly value: JsonValue;
}

function invalid(source: RedactedSource, reason: string, offset: number | null): never {
  throw toolingError('EVK_CONFIG_JSON_INVALID', 'source is not valid I-JSON', {
    reason,
    fields: {
      sourceKind: source.kind,
      sourceLabel: source.label,
      byteOffset: offset,
    },
  });
}

/**
 * Canonical decimal form of a JSON number token: sign, significant digits, and an exponent.
 *
 * Two tokens that denote the same mathematical value share one identity, so a token can be compared
 * with the shortest round-trip rendering of its parsed double without being fooled by trailing
 * zeros or exponent shifts.
 */
function decimalIdentity(raw: string): string {
  const match = /^(-?)(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/u.exec(raw);
  if (!match) throw new Error('invalid JSON number token');
  const negative = match[1] === '-';
  const integer = match[2];
  const fraction = match[3] ?? '';
  let exponent = Number.parseInt(match[4] ?? '0', 10) - fraction.length;
  let digits = `${integer}${fraction}`.replace(/^0+/u, '');
  if (digits === '') return '0e0';
  while (digits.endsWith('0')) {
    digits = digits.slice(0, -1);
    exponent += 1;
  }
  return `${negative ? '-' : ''}${digits}e${exponent}`;
}

function assertNumberRoundTrip(token: string, parsed: number): void {
  if (!Number.isFinite(parsed)) throw new Error('number is not finite');
  if (decimalIdentity(token) !== decimalIdentity(JSON.stringify(parsed))) {
    throw new Error('number does not round-trip through IEEE-754');
  }
}

/** Rejects unpaired surrogate code units, which cannot be encoded as UTF-8 scalars. */
function assertNoLoneSurrogate(text: string): void {
  for (let index = 0; index < text.length; index += 1) {
    const unit = text.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = text.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) throw new Error('lone high surrogate');
      index += 1;
      continue;
    }
    if (unit >= 0xdc00 && unit <= 0xdfff) throw new Error('lone low surrogate');
  }
}

type Frame =
  | {
      readonly kind: 'object';
      readonly keys: Set<string>;
      value: Record<string, JsonValue>;
      key: string | null;
    }
  | { readonly kind: 'array'; value: JsonValue[] };

export function parseStrictJson(bytes: Uint8Array, source: RedactedSource): StrictJsonDocument {
  if (bytes.byteLength >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    invalid(source, 'byte-order-mark', 0);
  }

  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    invalid(source, 'malformed-utf8', null);
  }
  if (text.trim() === '') invalid(source, 'empty-input', 0);

  const frames: Frame[] = [];
  let root: JsonValue | undefined;
  let completed = false;
  // Held in an object rather than a bare binding: the visitor callbacks below assign to it, and
  // TypeScript does not track assignments made inside closures, so a bare `let` would narrow to
  // `null` and make the post-visit check unreachable.
  const state: { failure: { reason: string; offset: number } | null } = { failure: null };

  const fail = (reason: string, offset: number): void => {
    state.failure ??= { reason, offset };
  };

  const attach = (value: JsonValue): void => {
    const frame = frames[frames.length - 1];
    if (frame === undefined) {
      if (completed) fail('trailing-token', 0);
      root = value;
      completed = true;
      return;
    }
    if (frame.kind === 'array') {
      frame.value.push(value);
      return;
    }
    if (frame.key === null) {
      fail('property-without-key', 0);
      return;
    }
    frame.value[frame.key] = value;
    frame.key = null;
  };

  visit(
    text,
    {
      onError(error, offset) {
        fail(`parse-error-${error}`, offset);
      },
      onObjectBegin() {
        frames.push({ kind: 'object', keys: new Set(), value: {}, key: null });
      },
      onObjectProperty(property, offset) {
        const frame = frames[frames.length - 1];
        if (frame === undefined || frame.kind !== 'object') return;
        try {
          assertNoLoneSurrogate(property);
        } catch {
          fail('lone-surrogate', offset);
          return;
        }
        // Duplicates are detected after escape decoding, so "name" collides with "name".
        if (frame.keys.has(property)) {
          fail('duplicate-key', offset);
          return;
        }
        frame.keys.add(property);
        frame.key = property;
      },
      onObjectEnd() {
        const frame = frames.pop();
        if (frame !== undefined) attach(frame.value as JsonValue);
      },
      onArrayBegin() {
        frames.push({ kind: 'array', value: [] });
      },
      onArrayEnd() {
        const frame = frames.pop();
        if (frame !== undefined) attach(frame.value as JsonValue);
      },
      onLiteralValue(value, offset, length) {
        if (typeof value === 'string') {
          try {
            assertNoLoneSurrogate(value);
          } catch {
            fail('lone-surrogate', offset);
            return;
          }
        }
        if (typeof value === 'number') {
          try {
            assertNumberRoundTrip(text.slice(offset, offset + length), value);
          } catch {
            fail('number-not-representable', offset);
            return;
          }
        }
        attach(value as JsonValue);
      },
    },
    // `visit` takes ParseOptions as its third argument; it has no errors-array parameter, so every
    // scanner and parser fault must be collected through onError above.
    { disallowComments: true, allowTrailingComma: false },
  );

  if (state.failure !== null) invalid(source, state.failure.reason, state.failure.offset);
  if (!completed || root === undefined) invalid(source, 'no-value', 0);
  if (frames.length !== 0) invalid(source, 'unbalanced-container', 0);

  return { value: root } as StrictJsonDocument;
}
