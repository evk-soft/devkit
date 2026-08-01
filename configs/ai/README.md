# AI pack source

This directory is the editable publisher source of truth for `@evk-soft/ai-pack-core`.

The package and generator are currently in the design phase. Their durable product boundaries are
defined in:

- [`../../docs/ai-tooling/product-brief.md`](../../docs/ai-tooling/product-brief.md)
- [`../../docs/system-overview/ai-tooling.md`](../../docs/system-overview/ai-tooling.md)
- [`../../docs/ai-tooling/decisions/0001-package-boundaries.md`](../../docs/ai-tooling/decisions/0001-package-boundaries.md)

Do not manually copy these sources into platform-specific files. Files such as `AGENTS.md`,
`CLAUDE.md`, `.agents/skills/**`, `.claude/skills/**`, Cursor rules, Gemini context, and
Antigravity artifacts are generated platform outputs. Their ownership and integrity will be
tracked by `@evk-soft/ai-tooling`.

When the tooling is implemented:

- EVK maintainers will edit canonical resources here;
- consuming projects will declare package sources and allowed version ranges in
  `ai-tooling.config.json`, while the lock file will pin exact versions and integrity digests;
- projects will keep their committed customizations in `ai/overrides/**`;
- installed EVK resources will remain immutable, while generated `evk-*` files will be protected
  from direct edits and replaced only by a journaled tooling transaction;
- platform adapters will render tool-native outputs from the resolved resource graph.

Until the safe core exists, treat this directory as publisher-only design space. Do not introduce a
manual synchronization workflow as a temporary substitute.
