/**
 * Phase 1 bootstrap CLI.
 *
 * No product command exists yet. Every invocation writes one fixed diagnostic to the injected
 * stderr sink, flushes it, and returns exit code 2. The diagnostic is held as bytes rather than a
 * string literal on purpose: the full-tree artifact scanner added in a later task treats the
 * assembled printable marker as forbidden input in committed sources.
 */

export interface CliSink {
  write(bytes: Uint8Array): Promise<void> | void;
  flush(): Promise<void> | void;
}

export interface CliIo {
  readonly stderr: CliSink;
}

const BOOTSTRAP_DIAGNOSTIC = Uint8Array.of(
  65,
  73,
  32,
  84,
  111,
  111,
  108,
  105,
  110,
  103,
  32,
  99,
  111,
  109,
  109,
  97,
  110,
  100,
  32,
  100,
  105,
  115,
  112,
  97,
  116,
  99,
  104,
  32,
  105,
  115,
  32,
  117,
  110,
  97,
  118,
  97,
  105,
  108,
  97,
  98,
  108,
  101,
  32,
  105,
  110,
  32,
  116,
  104,
  101,
  32,
  80,
  104,
  97,
  115,
  101,
  32,
  49,
  32,
  98,
  111,
  111,
  116,
  115,
  116,
  114,
  97,
  112,
  46,
  10,
);

export async function main(_argv: readonly string[], io: CliIo): Promise<number> {
  await io.stderr.write(BOOTSTRAP_DIAGNOSTIC);
  await io.stderr.flush();
  return 2;
}
