import { toolingError } from '../diagnostics/error.js';

/**
 * Phase 1 `pack` command surface.
 *
 * Argument parsing exists, but there is deliberately no path from here to the repository: the real
 * source context arrives with Phase 2's `ReadOnlyRepositoryContext`. Until then every invocation
 * reports a stage-neutral capability-unavailable result rather than half-reading a checkout.
 *
 * `validatePack` and `buildPack` remain fully usable through dependency injection, which is how the
 * Phase 1 tests exercise them.
 */

export type PackSubcommand = 'validate' | 'build';

export function parsePackSubcommand(argv: readonly string[]): PackSubcommand {
  const [subcommand, ...rest] = argv;
  if (subcommand !== 'validate' && subcommand !== 'build') {
    throw toolingError('EVK_PACK_CAPABILITY_UNAVAILABLE', 'unknown pack subcommand', {
      reason: 'unknown-subcommand',
    });
  }
  if (rest.length > 0) {
    throw toolingError('EVK_PACK_CAPABILITY_UNAVAILABLE', 'pack takes no further arguments yet', {
      reason: 'unsupported-argument',
    });
  }
  return subcommand;
}

export function runPackCommand(argv: readonly string[]): never {
  const subcommand = parsePackSubcommand(argv);
  throw toolingError(
    'EVK_PACK_CAPABILITY_UNAVAILABLE',
    'pack source access is not available in this stage',
    {
      reason: 'source-capability-unavailable',
      fields: { subcommand },
      recoveryActions: ['await-phase-2-repository-context'],
    },
  );
}
