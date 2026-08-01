# Decision 0001: Place AI Tooling in Devkit and Keep Code Intelligence Separate

Status: accepted
Date: 2026-08-01

## Context

Reusable agent workflows and semantic code analysis are used by the same developers and agents, but
they have different responsibilities and release triggers.

The earlier transfer proposal treated AI tooling as a standalone repository. Inspection of
`evk-soft/devkit` showed that the existing monorepository already owns shared development tools,
configuration packages, and AI-rule templates through its `configs/*` and `packages/*` workspace
boundaries.

## Decision

AI tooling is developed and released from `evk-soft/devkit` as two initial packages:

- `@evk-soft/ai-pack-core` from `configs/ai`;
- `@evk-soft/ai-tooling` from `packages/ai-tooling`.

`@evk-soft/code-intelligence` remains a separate product and repository. It owns code indexing,
symbol and reference queries, dependency and impact analysis, duplicate and dead-code analysis, and
architecture graphs.

AI tooling may recommend or integrate code intelligence through a documented plugin or MCP adapter,
but neither product core depends on the other.

## Consequences

- AI tooling reuses the existing devkit workspace, runtime, formatting, release, and CI conventions.
- The package and content layers retain independent versions without creating another repository.
- A new top-level `tooling/` directory is not introduced.
- Reusable workflow content remains useful without a code-analysis server.
- Code-intelligence releases are not coupled to rule or skill changes.
- The earlier standalone-repository transfer decision and specification plan are superseded and are
  not copied into the public devkit history as active documents.
