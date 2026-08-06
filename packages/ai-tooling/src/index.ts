/**
 * Root export surface for `@evk-soft/ai-tooling`.
 *
 * Phase 1 establishes contracts only. No resolution engine, project adapter, generated output, or
 * mutation command exists yet, so nothing beyond the bootstrap CLI contract is exported here.
 */

export type { CliIo, CliSink } from './cli.js';
export { main } from './cli.js';

/** Public version constant for this package. */
export const TOOLING_VERSION = '0.1.0' as const;
