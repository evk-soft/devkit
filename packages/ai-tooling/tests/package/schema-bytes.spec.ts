import { readdir, readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';

const SCHEMA_FILES = [
  'config.schema.json',
  'pack.schema.json',
  'rule.schema.json',
  'skill.schema.json',
  'override.schema.json',
  'lock.schema.json',
  'state.schema.json',
] as const;

const ID_PREFIX =
  'https://raw.githubusercontent.com/evk-soft/devkit/refs/tags/ai-tooling-v0.1.0/packages/ai-tooling/schemas/';

it.each(SCHEMA_FILES)('gives %s the exact public identity', async (file) => {
  const schema = JSON.parse(
    await readFile(new URL(`../../schemas/${file}`, import.meta.url), 'utf8'),
  );
  expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
  expect(schema.$id).toBe(`${ID_PREFIX}${file}`);
});

it('ships exactly the seven declared schema documents', async () => {
  const present = await readdir(new URL('../../schemas/', import.meta.url));
  expect(present.sort()).toStrictEqual([...SCHEMA_FILES].sort());
});

it.each(SCHEMA_FILES)('keeps %s closed and free of remote references', async (file) => {
  const text = await readFile(new URL(`../../schemas/${file}`, import.meta.url), 'utf8');
  const schema = JSON.parse(text);
  expect(text.endsWith('\n')).toBe(true);
  expect(text).not.toContain('\r');

  // Every $ref must be local or a sibling schema file, never an arbitrary remote URL: validation
  // has to resolve entirely offline.
  for (const reference of text.matchAll(/"\$ref"\s*:\s*"([^"]+)"/gu)) {
    const target = reference[1];
    const isLocal = target.startsWith('#');
    const isSibling = SCHEMA_FILES.some((name) => target.startsWith(`${name}#`) || target === name);
    expect(isLocal || isSibling).toBe(true);
  }

  expect(schema.type).toBe('object');
  expect(schema.additionalProperties).toBe(false);
});
