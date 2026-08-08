import { expect, it } from 'vitest';
import {
  configurationProjectionV1,
  packSelectionProjectionV1,
} from '../../src/config/projection.js';
import type { ConfigV1 } from '../../src/config/types.js';
import { jcsBytes, sha256Jcs } from '../../src/json/jcs.js';

// Combining acute, written from code points so the source itself carries no precomposed form.
const DECOMPOSED = `e${String.fromCharCode(0x0301)}`;
const PRECOMPOSED = String.fromCharCode(0x00e9);

it('emits exact RFC 8785 UTF-8 bytes without Unicode normalization', () => {
  expect(new TextDecoder().decode(jcsBytes({ z: 1, a: PRECOMPOSED, n: 0.000001 }))).toBe(
    `{"a":"${PRECOMPOSED}","n":0.000001,"z":1}`,
  );
  // RFC 8785 numbers use the ES6 shortest round-trip form: exponential spelling starts at 1e-7.
  expect(new TextDecoder().decode(jcsBytes({ n: 0.0000001 }))).toBe('{"n":1e-7}');
  // The decomposed input must survive unchanged: canonicalization orders and spells, it never folds.
  expect(new TextDecoder().decode(jcsBytes({ value: DECOMPOSED }))).toBe(
    `{"value":"${DECOMPOSED}"}`,
  );
  expect(jcsBytes({ value: DECOMPOSED })).not.toStrictEqual(jcsBytes({ value: PRECOMPOSED }));
});

it('sorts object keys by UTF-16 code unit as RFC 8785 requires', () => {
  expect(new TextDecoder().decode(jcsBytes({ b: 1, a: 2, A: 3, '': 4 }))).toBe(
    '{"":4,"A":3,"a":2,"b":1}',
  );
});

it('produces a stable digest independent of authoring order', () => {
  expect(sha256Jcs({ a: 1, b: [1, 2] })).toBe(sha256Jcs({ b: [1, 2], a: 1 }));
  expect(sha256Jcs({ a: 1 })).not.toBe(sha256Jcs({ a: 2 }));
  expect(sha256Jcs({ a: 1 })).toMatch(/^[0-9a-f]{64}$/u);
});

const MINIMAL: ConfigV1 = {
  version: 1,
  sources: [{ kind: 'local', path: 'configs/ai' }],
  platforms: ['claude-code'],
};

it('materializes every literal default in the configuration projection', () => {
  const projection = configurationProjectionV1(MINIMAL);
  expect(projection).toStrictEqual({
    schemaVersion: 1,
    sources: [{ kind: 'local', path: 'configs/ai' }],
    platforms: ['claude-code'],
    outputMode: 'managed',
    overrideDirectories: [],
    gitHooks: { install: false, preCommit: false },
    plugins: { profile: 'none', recommendations: [] },
  });
});

it('gives the same projection whether a default is omitted or written out', () => {
  const explicit: ConfigV1 = {
    ...MINIMAL,
    output: 'managed',
    overrideDirectories: [],
    hooks: { install: false, preCommit: false },
    plugins: { profile: 'none', recommendations: [] },
  };
  expect(sha256Jcs(configurationProjectionV1(explicit))).toBe(
    sha256Jcs(configurationProjectionV1(MINIMAL)),
  );
});

it('normalizes a git source URL inside the projection', () => {
  const config: ConfigV1 = {
    version: 1,
    sources: [
      {
        kind: 'git',
        url: 'HTTPS://EXAMPLE.COM:443/a/./b/../repo.git',
        commit: '0'.repeat(40),
      },
    ],
    platforms: ['codex'],
  };
  const projection = configurationProjectionV1(config) as {
    sources: readonly { readonly url: string }[];
  };
  expect(projection.sources[0]?.url).toBe('https://example.com/a/repo.git');
});

it('changes the configuration digest but not the selection digest when a platform changes', () => {
  const other: ConfigV1 = { ...MINIMAL, platforms: ['codex'] };
  expect(sha256Jcs(configurationProjectionV1(other))).not.toBe(
    sha256Jcs(configurationProjectionV1(MINIMAL)),
  );
  expect(sha256Jcs(packSelectionProjectionV1(other))).toBe(
    sha256Jcs(packSelectionProjectionV1(MINIMAL)),
  );
});

it('rejects duplicate ordered entries', () => {
  const duplicated: ConfigV1 = {
    ...MINIMAL,
    overrideDirectories: ['ai/overrides/a', 'ai/overrides/a'],
  };
  expect(() => configurationProjectionV1(duplicated)).toThrowError(/duplicate/u);
});
