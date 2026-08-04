import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it, vi } from 'vitest';

import { DIAGNOSTIC_CODES } from '../../src/diagnostics/codes.js';
import { parseStrictJson } from '../../src/json/strict-json.js';

const FIXTURES = join(fileURLToPath(new URL('../fixtures/json/', import.meta.url)));
const source = { kind: 'fixture', label: 'strict-json' } as const;
const schemaValidateSpy = vi.fn();

function fixtureBytes(name: string): Uint8Array {
  return readFileSync(join(FIXTURES, name));
}

function expectJsonInvalid(bytes: Uint8Array): void {
  expect(() => parseStrictJson(bytes, source)).toThrowError(
    expect.objectContaining({
      diagnostic: expect.objectContaining({ code: 'EVK_CONFIG_JSON_INVALID' }),
    }),
  );
  expect(schemaValidateSpy).not.toHaveBeenCalled();
}

it('exposes only the Stage 1 diagnostic registry', () => {
  expect(DIAGNOSTIC_CODES).toStrictEqual({
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
  });
});

it('rejects duplicate decoded keys before schema validation', () => {
  const bytes = new TextEncoder().encode('{"name":1,"\\u006eame":2}');
  expect(() => parseStrictJson(bytes, { kind: 'fixture', label: 'duplicate-key' })).toThrowError(
    expect.objectContaining({
      diagnostic: expect.objectContaining({ code: 'EVK_CONFIG_JSON_INVALID' }),
    }),
  );
  expect(schemaValidateSpy).not.toHaveBeenCalled();
});

it.each([
  ['duplicate-key.json'],
  ['comment.json'],
  ['trailing-comma.json'],
  ['lone-surrogate.json'],
  ['non-roundtrip-integer.json'],
  ['non-roundtrip-number.json'],
])('rejects fixture %s', (name) => {
  expectJsonInvalid(fixtureBytes(name));
});

it.each([
  ['a UTF-8 BOM', Uint8Array.from([0xef, 0xbb, 0xbf, 0x7b, 0x7d])],
  ['empty input', Uint8Array.from([])],
  ['a trailing token', new TextEncoder().encode('{} {}')],
  ['malformed UTF-8', Uint8Array.from([0x7b, 0x22, 0x61, 0x22, 0x3a, 0x22, 0xff, 0x22, 0x7d])],
])('rejects %s', (_name, bytes) => {
  expectJsonInvalid(bytes);
});

it('accepts exactly representable numbers and returns a branded document', () => {
  const document = parseStrictJson(fixtureBytes('valid.json'), source);
  expect(document.value).toStrictEqual({
    name: 'evk',
    count: 1,
    ratio: 0.1,
    exact: 9007199254740992,
    flag: true,
    nothing: null,
    list: [1, 2],
  });
});

it('accepts a fractional zero that round-trips', () => {
  const document = parseStrictJson(new TextEncoder().encode('{"a":1.0}'), source);
  expect(document.value).toStrictEqual({ a: 1 });
});

it('rejects a number that underflows to zero', () => {
  expectJsonInvalid(new TextEncoder().encode('{"a":1e-400}'));
});

it('rejects a number that overflows to infinity', () => {
  expectJsonInvalid(new TextEncoder().encode('{"a":1e400}'));
});
