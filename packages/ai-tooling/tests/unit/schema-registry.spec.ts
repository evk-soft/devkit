import { readFileSync } from 'node:fs';
import { expect, it, vi } from 'vitest';
import type { ConfigV1, LockV1 } from '../../src/config/types.js';
import { createOfflineSchemaRegistry, type SchemaName } from '../../src/json/schema-registry.js';
import { parseStrictJson, type StrictJsonDocument } from '../../src/json/strict-json.js';
import type { RedactedSource } from '../../src/model/types.js';

const source: RedactedSource = { kind: 'fixture', label: 'schema-registry' };

const SAMPLES: Readonly<Record<SchemaName, unknown>> = {
  config: {
    version: 1,
    sources: [{ kind: 'local', path: 'configs/ai' }],
    platforms: ['claude-code'],
  },
  pack: {
    version: 1,
    name: '@evk-soft/ai-pack-core',
    packVersion: '0.1.0',
    rules: [{ id: 'evk-soft/rules/grounding', path: 'rules/evk-grounding' }],
    skills: [{ id: 'evk-soft/skills/plan', path: 'skills/evk-plan' }],
  },
  rule: {
    version: 1,
    id: 'evk-soft/rules/grounding',
    title: 'Grounding',
    instructions: 'instructions.md',
  },
  skill: {
    version: 1,
    id: 'evk-soft/skills/plan',
    title: 'Plan',
    description: 'Plan before implementing.',
    instructions: 'instructions.md',
  },
  override: {
    version: 1,
    target: 'evk-soft/rules/grounding',
    mode: 'extend',
    baseDigest: 'a'.repeat(64),
    instructions: 'instructions.md',
  },
  lock: {
    version: 1,
    configurationDigest: 'b'.repeat(64),
    selectionDigest: 'c'.repeat(64),
    packs: [{ name: '@evk-soft/ai-pack-core', packVersion: '0.1.0', digest: 'd'.repeat(64) }],
    outputs: [
      { path: 'CLAUDE.md', platform: 'claude-code', digest: 'e'.repeat(64), owner: 'managed' },
    ],
  },
  state: { version: 1 },
};

/** The closed seven-name fixture map required by the packet. */
function validDocument(name: SchemaName): StrictJsonDocument {
  return parseStrictJson(new TextEncoder().encode(JSON.stringify(SAMPLES[name])), source);
}

const SCHEMA_NAMES = ['config', 'pack', 'rule', 'skill', 'override', 'lock', 'state'] as const;

it('compiles every root with network disabled', () => {
  const network = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network forbidden'));
  try {
    const registry = createOfflineSchemaRegistry();
    for (const name of SCHEMA_NAMES) {
      expect(() => registry.validate(name, validDocument(name))).not.toThrow();
    }
    expect(network).not.toHaveBeenCalled();
  } finally {
    network.mockRestore();
  }
});

it('exposes the exact source bytes of each schema', () => {
  const registry = createOfflineSchemaRegistry();
  for (const name of SCHEMA_NAMES) {
    const bytes = registry.schemaBytes(name);
    const onDisk = readFileSync(new URL(`../../schemas/${name}.schema.json`, import.meta.url));
    expect(Buffer.from(bytes)).toStrictEqual(onDisk);
  }
});

it('rejects a bare content URL as a configuration source', () => {
  const registry = createOfflineSchemaRegistry();
  const document = parseStrictJson(
    new TextEncoder().encode(
      JSON.stringify({
        version: 1,
        sources: [{ kind: 'git', url: 'https://example.invalid/pack.md', commit: '0'.repeat(40) }],
        platforms: ['codex'],
      }),
    ),
    source,
  );
  expect(() => registry.validate('config', document)).toThrowError(
    expect.objectContaining({
      diagnostic: expect.objectContaining({ code: 'EVK_CONFIG_JSON_INVALID' }),
    }),
  );
});

it('rejects an override directory outside the ai/overrides root', () => {
  const registry = createOfflineSchemaRegistry();
  for (const directory of [
    'ai/overrides',
    '../ai/overrides/x',
    'ai/overrides/../escape',
    'C:/ai/overrides/x',
  ]) {
    const document = parseStrictJson(
      new TextEncoder().encode(
        JSON.stringify({
          version: 1,
          sources: [{ kind: 'local', path: 'configs/ai' }],
          platforms: ['codex'],
          overrideDirectories: [directory],
        }),
      ),
      source,
    );
    expect(() => registry.validate('config', document)).toThrowError();
  }
});

it('rejects an unknown schema name', () => {
  const registry = createOfflineSchemaRegistry();
  expect(() => registry.validate('forged' as SchemaName, validDocument('state'))).toThrowError();
});

it('reports errors sorted and without echoing the document', () => {
  const registry = createOfflineSchemaRegistry();
  const document = parseStrictJson(
    new TextEncoder().encode(JSON.stringify({ version: 2, sources: [], platforms: [] })),
    source,
  );
  try {
    registry.validate('config', document);
    expect.unreachable('validation should have failed');
  } catch (error) {
    const diagnostic = (error as { diagnostic: { fields: Record<string, unknown> } }).diagnostic;
    const rendered = JSON.stringify(diagnostic);
    expect(rendered).not.toContain('"sources":[]');
    const errors = diagnostic.fields.errors as readonly { instancePath: string }[];
    expect(errors.length).toBeGreaterThan(0);
    expect([...errors].map((entry) => entry.instancePath)).toStrictEqual(
      [...errors].map((entry) => entry.instancePath).sort(),
    );
  }
});

it('fails locally when a schema reference cannot be resolved', () => {
  const unresolved = JSON.parse(
    readFileSync(
      new URL('../fixtures/schemas/unresolved-ref.schema.json', import.meta.url),
      'utf8',
    ),
  );
  const registry = createOfflineSchemaRegistry();
  expect(() => registry.compileForeign(unresolved)).toThrowError();
});

// Packet 5B step 5 -- compile-time assertions.
//
// Like the ones in strict-json.spec.ts, these are only real because the test sources are
// typechecked by `scripts/check-test-types.mjs`. `validate` is generic over the schema *name*, and
// the whole point of `SchemaTypeMap` is that the result type follows from that name rather than
// from what the caller would like it to be.
it('types a validated document by schema name, not by caller choice', () => {
  const registry = createOfflineSchemaRegistry();
  const lock = registry.validate('lock', validDocument('lock'));

  // Positive half: the result is a LockV1 and its fields are reachable with no cast.
  const asLock: LockV1 = lock;
  expect(asLock.version).toBe(1);
  expect(asLock.packs).toHaveLength(1);

  // @ts-expect-error a validated lock is not a validated configuration. The return type is keyed to
  // the schema name, so one validated document cannot be reinterpreted as another.
  const asConfig: ConfigV1 = lock;
  expect(asConfig).toBeDefined();

  // @ts-expect-error the type parameter is inferred from the name argument and may not disagree
  // with it, so a caller cannot select the result type independently of the schema being applied.
  registry.validate<'config'>('lock', validDocument('lock'));
});
