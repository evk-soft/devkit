import type { JsonValue } from '../model/types.js';
import { normalizeGitUrlV1 } from './git-url-v1.js';
import type { ConfigV1, SourceV1 } from './types.js';

export type JsonObject = { readonly [key: string]: JsonValue };

/**
 * Field-by-field projections of a schema-validated configuration.
 *
 * A projection is what gets hashed, so it must be total: every optional property is materialized
 * with its literal default. Otherwise "omitted" and "written out explicitly" would produce two
 * digests for one configuration, and a no-op edit would look like a change.
 *
 * `$schema` is the only excluded property.
 */

function assertNoDuplicates(values: readonly string[], label: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`duplicate ${label} entry: ${value}`);
    seen.add(value);
  }
}

function projectSource(source: SourceV1): JsonObject {
  switch (source.kind) {
    case 'local':
      return { kind: 'local', path: source.path };
    case 'npm':
      return { kind: 'npm', name: source.name, version: source.version };
    case 'git':
      return {
        kind: 'git',
        url: normalizeGitUrlV1(source.url),
        commit: source.commit,
        ...(source.subdirectory === undefined ? {} : { subdirectory: source.subdirectory }),
      };
  }
}

export function configurationProjectionV1(config: ConfigV1): JsonObject {
  const platforms = [...config.platforms];
  assertNoDuplicates(platforms, 'platform');

  const overrideDirectories = [...(config.overrideDirectories ?? [])];
  assertNoDuplicates(overrideDirectories, 'override directory');

  const recommendations = [...(config.plugins?.recommendations ?? [])];
  assertNoDuplicates(recommendations, 'plugin recommendation');

  return {
    schemaVersion: config.version,
    sources: config.sources.map(projectSource),
    platforms,
    outputMode: config.output ?? 'managed',
    overrideDirectories,
    gitHooks: {
      install: config.hooks?.install ?? false,
      preCommit: config.hooks?.preCommit ?? false,
    },
    plugins: {
      profile: config.plugins?.profile ?? 'none',
      recommendations,
    },
  };
}

/**
 * The normalized selection identity alone.
 *
 * It deliberately excludes platforms, output mode, hooks, and plugins: those change what is
 * rendered, not which pack content was selected. Keeping them out is what lets a later phase tell
 * "the same packs, rendered differently" from "different packs", which is the distinction behind
 * `EVK_CONFIG_REQUIRES_UPDATE`.
 */
export function packSelectionProjectionV1(config: ConfigV1): JsonObject {
  return {
    schemaVersion: config.version,
    sources: config.sources.map(projectSource),
  };
}
