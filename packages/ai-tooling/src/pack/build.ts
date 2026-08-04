import { createHash } from 'node:crypto';

import { toolingError } from '../diagnostics/error.js';
import { renderGeneratedJson } from '../json/render-json.js';
import { createOfflineSchemaRegistry } from '../json/schema-registry.js';
import { parseStrictJson } from '../json/strict-json.js';
import type { ContainedPathRef, ReadOnlySourceContext, RedactedSource } from '../model/types.js';
import type { PackV1, RuleV1, SkillV1 } from './types.js';

const SCHEMA_TAG_BASE =
  'https://raw.githubusercontent.com/evk-soft/devkit/refs/tags/ai-tooling-v0.1.0/packages/ai-tooling/schemas/';

const PACK_KEY_ORDER = [
  '$schema',
  'version',
  'name',
  'packVersion',
  'description',
  'rules',
  'skills',
  'id',
  'path',
  'title',
  'instructions',
  'capabilities',
  'assets',
] as const;

export interface PackBuildDestination {
  readonly root: string;
  createDirectoryExclusive(path: string): Promise<void>;
  writeFileExclusive(path: string, bytes: Uint8Array): Promise<void>;
}

export interface ValidatedPackEntry {
  readonly id: string;
  readonly path: string;
  readonly metadata: RuleV1 | SkillV1;
  readonly instructions: Uint8Array;
}

export interface ValidatedPack {
  readonly manifest: PackV1;
  readonly rules: readonly ValidatedPackEntry[];
  readonly skills: readonly ValidatedPackEntry[];
}

export interface PackBuildResult {
  readonly pack: ValidatedPack;
  readonly destinationRoot: string;
  readonly files: readonly {
    readonly path: string;
    readonly byteLength: number;
    readonly digest: string;
  }[];
}

function digestOf(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function packSource(label: string): RedactedSource {
  return { kind: 'pack', label };
}

async function readEntry(
  context: ReadOnlySourceContext,
  sourceRoot: ContainedPathRef,
  declaration: { readonly id: string; readonly path: string },
  kind: 'rule' | 'skill',
): Promise<ValidatedPackEntry> {
  const registry = createOfflineSchemaRegistry();
  const base = `${sourceRoot.relativePath}/${declaration.path}`;

  const metadataRef = context.filesystem.resolve(`${base}/${kind}.json`);
  const metadataBytes = await context.filesystem.readFile(metadataRef, context.readBudget);
  const metadata = registry.validate(
    kind,
    parseStrictJson(metadataBytes, packSource(declaration.id)),
  );

  if (metadata.id !== declaration.id) {
    throw toolingError('EVK_PACK_SOURCE_INVALID', 'declared id does not match its metadata', {
      reason: 'declaration-mismatch',
      fields: { declared: declaration.id },
    });
  }

  const instructionsRef = context.filesystem.resolve(`${base}/${metadata.instructions}`);
  if (await context.filesystem.isExecutable(instructionsRef, context.readBudget)) {
    throw toolingError('EVK_PACK_SOURCE_INVALID', 'instruction file is executable', {
      reason: 'executable-asset',
      fields: { resource: declaration.id },
    });
  }
  const instructions = await context.filesystem.readFile(instructionsRef, context.readBudget);

  // Every present file must be declared: an undeclared file would ship without ever being reviewed.
  const declared = new Set<string>([
    `${kind}.json`,
    metadata.instructions,
    ...(metadata.assets ?? []),
  ]);
  const present = await context.filesystem.listDirectory(
    context.filesystem.resolve(base),
    context.readBudget,
  );
  for (const name of present) {
    if (!declared.has(name)) {
      throw toolingError('EVK_PACK_SOURCE_INVALID', 'undeclared asset in resource directory', {
        reason: 'undeclared-asset',
        fields: { resource: declaration.id },
      });
    }
  }

  return { id: declaration.id, path: declaration.path, metadata, instructions };
}

export async function validatePack(
  context: ReadOnlySourceContext,
  sourceRoot: ContainedPathRef,
): Promise<ValidatedPack> {
  const registry = createOfflineSchemaRegistry();
  const manifestRef = context.filesystem.resolve(`${sourceRoot.relativePath}/pack.json`);
  const manifestBytes = await context.filesystem.readFile(manifestRef, context.readBudget);
  const manifest = registry.validate('pack', parseStrictJson(manifestBytes, packSource('pack')));

  const rules: ValidatedPackEntry[] = [];
  for (const declaration of manifest.rules) {
    rules.push(await readEntry(context, sourceRoot, declaration, 'rule'));
  }
  const skills: ValidatedPackEntry[] = [];
  for (const declaration of manifest.skills) {
    skills.push(await readEntry(context, sourceRoot, declaration, 'skill'));
  }

  return { manifest, rules, skills };
}

/**
 * Builds a pack tree into an explicit, caller-supplied destination.
 *
 * The destination is a separate injected port with only exclusive create methods, so this function
 * cannot write into the repository even by mistake: it has no handle that could reach it. Two builds
 * from the same source produce byte-identical trees, because metadata is re-rendered through
 * `renderGeneratedJson` in schema order and instruction bytes are copied unchanged.
 */
export async function buildPack(
  context: ReadOnlySourceContext,
  sourceRoot: ContainedPathRef,
  destination: PackBuildDestination,
): Promise<PackBuildResult> {
  const pack = await validatePack(context, sourceRoot);
  const files: { path: string; byteLength: number; digest: string }[] = [];

  const emit = async (path: string, bytes: Uint8Array): Promise<void> => {
    await destination.writeFileExclusive(path, bytes);
    files.push({ path, byteLength: bytes.byteLength, digest: digestOf(bytes) });
  };

  const manifestBytes = renderGeneratedJson(
    {
      $schema: `${SCHEMA_TAG_BASE}pack.schema.json`,
      ...(pack.manifest as unknown as Record<string, never>),
    },
    [...PACK_KEY_ORDER],
  );
  await emit('pack.json', manifestBytes);

  for (const [kind, entries] of [
    ['rules', pack.rules],
    ['skills', pack.skills],
  ] as const) {
    if (entries.length === 0) continue;
    await destination.createDirectoryExclusive(kind);
    for (const entry of entries) {
      await destination.createDirectoryExclusive(entry.path);
      const metadataBytes = renderGeneratedJson(
        {
          $schema: `${SCHEMA_TAG_BASE}${kind === 'rules' ? 'rule' : 'skill'}.schema.json`,
          ...(entry.metadata as unknown as Record<string, never>),
        },
        [...PACK_KEY_ORDER],
      );
      await emit(`${entry.path}/${kind === 'rules' ? 'rule' : 'skill'}.json`, metadataBytes);
      await emit(`${entry.path}/${entry.metadata.instructions}`, entry.instructions);
    }
  }

  files.sort((left, right) => (left.path < right.path ? -1 : left.path > right.path ? 1 : 0));
  return { pack, destinationRoot: destination.root, files };
}
