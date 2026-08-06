# AI pack source

This directory is the editable publisher source of truth for `@evk-soft/ai-pack-core`. It is the only
canonical EVK content source: every generated platform file is derived from what is written here.

## What ships

| Resource | Kind | Identity |
|---|---|---|
| `evk-grounding` | rule | `evk-soft/rules/grounding` |
| `evk-plan` | skill | `evk-soft/skills/plan` |

Both are instruction-only: metadata plus one Markdown file. The pack contains no script, hook,
binary, MCP server, connector, plugin field, or dependency, and it never will — see
[`../../docs/ai-tooling/SECURITY.md`](../../docs/ai-tooling/SECURITY.md).

## Canonical edit rules

Edit resources **here**, never in a generated file. Files such as `AGENTS.md`, `CLAUDE.md`,
`.agents/skills/**`, `.claude/skills/**`, and `ai-tooling.lock.json` are generated platform outputs.
They are tool-owned: they are produced from an accepted plan, recorded with their digests, and
replaced only by a journaled tooling transaction. A hand edit to a generated file is detected and
reported, not merged.

Project-specific customization does not belong here either. It belongs in `ai/overrides/**`, so that
published content and local changes stay separable across upgrades. To add or customize a resource,
follow [`../../docs/ai-tooling/EXTENDING-PACKS.md`](../../docs/ai-tooling/EXTENDING-PACKS.md).

Every file present in a resource directory must be declared by that resource's metadata. An
undeclared file fails validation, because a file nobody declared is a file nobody reviewed.

## Current delivery status

The engine is delivered in phases. At this phase the contracts, schemas, deterministic byte
rendering, and this pack exist; platform outputs, the repository lock, and all mutation commands do
not yet exist. Do not introduce a manual synchronization workflow as a temporary substitute.

Durable product boundaries:

- [`../../docs/ai-tooling/product-brief.md`](../../docs/ai-tooling/product-brief.md)
- [`../../docs/system-overview/ai-tooling.md`](../../docs/system-overview/ai-tooling.md)
- [`../../docs/ai-tooling/decisions/0001-package-boundaries.md`](../../docs/ai-tooling/decisions/0001-package-boundaries.md)
