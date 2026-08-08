# @evk-soft/ai-tooling

Engine for the EVK AI tooling packs. It reads the canonical instruction content under `configs/ai/**`,
validates it against strict offline schemas, resolves it together with project overrides into one
effective catalog, and renders deterministic, integrity-recorded project outputs.

## Status

**Unpublished, source build only.** This package has never been released to a registry and carries no
compatibility promise. It is built from source inside this workspace.

Stage 1 is being delivered in phases. This checkout is at **Phase 1: contracts and instruction-only
pack**, which establishes package, schema, and byte-determinism boundaries and nothing else.

The following do not exist yet and must not be inferred from this document:

- no project outputs for any platform, and no generated `ai-tooling.lock.json`
- no mutation commands — no `init`, `sync`, `restore`, `doctor`, or repair
- no resolution engine, project adapters, or formatter integration
- no remote acquisition, cache, preview activation, adoption, hooks, plugins, or capability install

The command-line entry point is a bootstrap only. Every invocation writes one fixed diagnostic to
stderr and exits with code `2`.

## Requirements

Node.js `>=24.0.0`, as declared by this package's `engines.node`. The shared repository toolchain —
pnpm, TypeScript, and Biome — is single-sourced in the `catalog` block of `pnpm-workspace.yaml` and is
deliberately not restated here, so that this document cannot drift out of step with it. This package's
own dependencies are pinned literally in its `package.json`, including Vitest `4.1.10`.

## Intended exports

These are the export paths the package is being built toward. Only the root export currently resolves
to anything, and it exposes just the bootstrap CLI contract.

| Export | Contents |
|---|---|
| `.` | engine entry points and public types |
| `./schemas/*` | the byte-stable JSON Schema documents used for offline validation |
| `./package.json` | package manifest, for tooling that resolves it explicitly |

## Content ownership

`configs/ai/**` is the only canonical EVK content source. User customization belongs under
`ai/overrides/**`. Generated project files and the repository lock are tool-owned artifacts: they are
produced from an accepted plan and must never be hand-edited.
