import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

import { createOfflineSchemaRegistry } from '../../src/json/schema-registry.js';
import { parseStrictJson } from '../../src/json/strict-json.js';

const PACK_ROOT = fileURLToPath(new URL('../../../../configs/ai/', import.meta.url));

interface AssetInventoryEntry {
  readonly path: string;
  readonly securitySignals: readonly string[];
}

/** Reads the real canonical pack and inventories every file it ships. */
async function validateCorePackFixture() {
  const registry = createOfflineSchemaRegistry();
  const source = { kind: 'pack', label: 'core' } as const;

  const manifestBytes = await readFile(join(PACK_ROOT, 'pack.json'));
  const manifest = registry.validate('pack', parseStrictJson(manifestBytes, source));

  const resources: {
    id: string;
    kind: 'rule' | 'skill';
    metadata: { readonly requiredCapabilities?: readonly string[] };
  }[] = [];
  const assetInventory: AssetInventoryEntry[] = [];

  const inspect = async (relativePath: string): Promise<void> => {
    const bytes = await readFile(join(PACK_ROOT, relativePath));
    const text = bytes.toString('utf8');
    const securitySignals: string[] = [];
    // Instruction-only means exactly that: no executable surface may hide in a shipped file.
    for (const [signal, pattern] of [
      ['shebang', /^#!/u],
      ['script-field', /"scripts"\s*:/u],
      ['hook-field', /"hooks"\s*:/u],
      ['mcp-server', /mcpServers/u],
      ['binary-field', /"bin"\s*:/u],
      ['plugin-field', /"plugins"\s*:/u],
    ] as const) {
      if (pattern.test(text)) securitySignals.push(signal);
    }
    assetInventory.push({ path: relativePath, securitySignals });
  };

  for (const declaration of manifest.rules) {
    const metadata = registry.validate(
      'rule',
      parseStrictJson(await readFile(join(PACK_ROOT, declaration.path, 'rule.json')), source),
    );
    resources.push({ id: metadata.id, kind: 'rule', metadata });
    await inspect(join(declaration.path, 'rule.json'));
    await inspect(join(declaration.path, metadata.instructions));
  }
  for (const declaration of manifest.skills) {
    const metadata = registry.validate(
      'skill',
      parseStrictJson(await readFile(join(PACK_ROOT, declaration.path, 'skill.json')), source),
    );
    resources.push({ id: metadata.id, kind: 'skill', metadata });
    await inspect(join(declaration.path, 'skill.json'));
    await inspect(join(declaration.path, metadata.instructions));
  }

  return { pack: { manifest, resources }, assetInventory };
}

it('ships exactly grounding and plan resources', async () => {
  const { pack, assetInventory } = await validateCorePackFixture();
  expect(pack.resources.map(({ id, kind }) => ({ id, kind }))).toStrictEqual([
    { id: 'evk-soft/rules/grounding', kind: 'rule' },
    { id: 'evk-soft/skills/plan', kind: 'skill' },
  ]);
  expect(
    pack.resources.every((resource) =>
      resource.metadata.requiredCapabilities?.every(
        (value: string) => value === 'instructions.markdown',
      ),
    ),
  ).toBe(true);
  expect(assetInventory.filter((entry) => entry.securitySignals.length > 0)).toStrictEqual([]);
});

it('declares every file present in a resource directory', async () => {
  const { pack } = await validateCorePackFixture();
  for (const declaration of [...pack.manifest.rules, ...pack.manifest.skills]) {
    const kind = pack.manifest.rules.includes(declaration) ? 'rule' : 'skill';
    const present = await readdir(join(PACK_ROOT, declaration.path));
    expect(present.sort()).toStrictEqual([`${kind}.json`, 'instructions.md'].sort());
  }
});

it('keeps instruction files as plain Markdown with a final LF', async () => {
  for (const path of ['rules/evk-grounding/instructions.md', 'skills/evk-plan/instructions.md']) {
    const text = (await readFile(join(PACK_ROOT, path))).toString('utf8');
    expect(text.startsWith('# ')).toBe(true);
    expect(text.endsWith('\n')).toBe(true);
    expect(text).not.toContain('\r');
  }
});
