import { readFileSync } from 'node:fs';

import Ajv2020Import from 'ajv/dist/2020.js';

// `ajv/dist/2020.js` is CommonJS. Under Node's ESM interop the constructor arrives on `.default`
// in some resolutions and as the namespace itself in others, so accept either shape.
const Ajv2020 = ((Ajv2020Import as unknown as { readonly default?: unknown }).default ??
  Ajv2020Import) as new (
  options: Record<string, unknown>,
) => {
  addSchema(schema: unknown, key: string): void;
  compile(schema: object): ((data: unknown) => boolean) & {
    errors?: readonly { instancePath: string; schemaPath: string; keyword: string }[] | null;
  };
};

import type { ConfigV1, LockV1, OverrideV1, StateV1 } from '../config/types.js';
import { toolingError } from '../diagnostics/error.js';
import type { PackV1, RuleV1, SkillV1 } from '../pack/types.js';
import type { StrictJsonDocument } from './strict-json.js';

export interface SchemaTypeMap {
  readonly config: ConfigV1;
  readonly pack: PackV1;
  readonly rule: RuleV1;
  readonly skill: SkillV1;
  readonly override: OverrideV1;
  readonly lock: LockV1;
  readonly state: StateV1;
}

export type SchemaName = keyof SchemaTypeMap;

export interface OfflineSchemaRegistry {
  validate<N extends SchemaName>(name: N, document: StrictJsonDocument): SchemaTypeMap[N];
  schemaBytes<N extends SchemaName>(name: N): Uint8Array;
  /** Compiles a foreign schema, proving an unresolved reference fails locally rather than fetching. */
  compileForeign(schema: unknown): void;
}

const SCHEMA_NAMES = [
  'config',
  'pack',
  'rule',
  'skill',
  'override',
  'lock',
  'state',
] as const satisfies readonly SchemaName[];

function schemaUrl(name: SchemaName): URL {
  return new URL(`../../schemas/${name}.schema.json`, import.meta.url);
}

/**
 * Builds a validator that can never reach the network.
 *
 * All seven schemas are read from disk and registered under their exact `$id` values before any
 * root is compiled, and `loadSchema` is deliberately never defined. Ajv therefore resolves every
 * reference from its own bundled draft 2020-12 metaschema or from this preloaded set; an unresolved
 * `$id` is a local error, not an HTTP request.
 */
export function createOfflineSchemaRegistry(): OfflineSchemaRegistry {
  const ajv = new Ajv2020({
    strict: true,
    allErrors: true,
    validateFormats: false,
    useDefaults: false,
    coerceTypes: false,
    removeAdditional: false,
  });

  const sourceBytes = new Map<SchemaName, Uint8Array>();
  const parsed = new Map<SchemaName, Record<string, unknown>>();

  for (const name of SCHEMA_NAMES) {
    const bytes = readFileSync(schemaUrl(name));
    sourceBytes.set(name, bytes);
    parsed.set(name, JSON.parse(bytes.toString('utf8')) as Record<string, unknown>);
  }

  // Register every schema first, so a root may reference a sibling that has not been compiled yet.
  for (const name of SCHEMA_NAMES) {
    ajv.addSchema(parsed.get(name), `${name}.schema.json`);
  }

  const validators = new Map<SchemaName, ReturnType<typeof ajv.compile>>();
  for (const name of SCHEMA_NAMES) {
    validators.set(name, ajv.compile(parsed.get(name) as object));
  }

  return {
    validate<N extends SchemaName>(name: N, document: StrictJsonDocument): SchemaTypeMap[N] {
      const validator = validators.get(name);
      if (validator === undefined) {
        throw toolingError('EVK_CONFIG_JSON_INVALID', 'unknown schema name', {
          reason: 'unknown-schema',
        });
      }
      // Safe only because the validator just proved the document satisfies this schema; the brand
      // on StrictJsonDocument is what stops an unvalidated value reaching this line.
      if (validator(document.value)) return document.value as unknown as SchemaTypeMap[N];

      // Sorted by instance path, then schema path, then keyword, so one invalid document always
      // produces one ordering. Only locations and keywords are exposed, never the document body.
      const errors = [...(validator.errors ?? [])]
        .map((entry) => ({
          instancePath: entry.instancePath,
          schemaPath: entry.schemaPath,
          keyword: entry.keyword,
        }))
        .sort(
          (left, right) =>
            left.instancePath.localeCompare(right.instancePath) ||
            left.schemaPath.localeCompare(right.schemaPath) ||
            left.keyword.localeCompare(right.keyword),
        );

      throw toolingError('EVK_CONFIG_JSON_INVALID', 'document does not satisfy its schema', {
        reason: 'schema-invalid',
        fields: { schema: name, errors },
      });
    },
    schemaBytes<N extends SchemaName>(name: N): Uint8Array {
      const bytes = sourceBytes.get(name);
      if (bytes === undefined) {
        throw toolingError('EVK_CONFIG_JSON_INVALID', 'unknown schema name', {
          reason: 'unknown-schema',
        });
      }
      return bytes;
    },
    compileForeign(schema: unknown): void {
      ajv.compile(schema as object);
    },
  };
}
