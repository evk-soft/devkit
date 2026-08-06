# AI Tooling Product Brief

Status: approved umbrella scope
Date: 2026-08-01

## Problem

AI coding agents repeatedly need the same planning, grounding, verification, audit, and handoff
procedures. Handwritten copies across repositories and agent platforms drift, while direct updates
risk overwriting project-owned changes.

Platform plugins, skills, project guidance, MCP servers, hooks, and connectors also have different
installation and security boundaries. Treating them as interchangeable produces unsafe automation.

## Product

`evk-soft/devkit` will publish:

- `@evk-soft/ai-pack-core`: public MIT rules, skills, instruction content, and metadata;
- `@evk-soft/ai-tooling`: JSON schemas, composition, platform adapters, lifecycle commands,
  validation, generated-file ownership, documentation checks, and capability recommendations.

Canonical metadata uses standard JSON. Instruction content uses Markdown. Platform-specific formats
are generated outputs.

## Users

- an individual adding consistent AI workflows to a new repository;
- a team applying private organization rules over the public EVK base;
- a maintainer migrating existing AI files without losing content;
- an AI agent that needs an explicit source-of-truth and generated-file contract;
- a CI system that verifies deterministic generated outputs without repairing them.

## Key requirements

- One publisher source of truth under `devkit/configs/ai/**`.
- One consumer source of truth composed from committed config, a frozen lock, pinned packs, and
  committed project overrides.
- Reserved `evk-` public names and stable `evk-soft/...` identifiers.
- Consumer overrides may extend compatible content, replace, disable, or rename resources.
- Direct edits to installed or generated EVK files are errors.
- No silent overwrite, ownership transfer, update, removal, hook change, or plugin installation.
- Deterministic Codex, Claude Code, Cursor, Gemini CLI, and Antigravity adapters delivered in stages.
- Curated external capability recommendations by default; broad discovery only by explicit request.
- Windows, Linux, and macOS validation.
- `devkit` self-hosting after safe-write and recovery guarantees exist.

## Product boundary

AI tooling owns reusable ways of working and their safe distribution. Consumer repositories retain
their architecture, commands, domain rules, branch model, credentials, and machine-local policy.

`@evk-soft/code-intelligence` owns semantic source analysis. It may later be recommended as an
external capability but is not implemented by this product.

## Initial delivery order

1. Foundations and safe core, followed by devkit self-hosting.
2. Existing-project lifecycle and opt-in Git hooks.
3. Remaining project adapters and EVK plugin artifacts.
4. External capability catalog and installation planning.
5. Public release verification and distribution.

## Success evidence

- A clean repository can initialize from a pinned pack.
- An existing repository can transfer ownership only after byte-preserving import and human review.
- Committed overrides produce one effective resource with deterministic provenance.
- Drift, missing outputs, collisions, orphan overrides, and unsupported capabilities fail closed.
- Updates and removals preserve unowned and modified content.
- Interrupted writes are detectable and recoverable.
- Plugin planning never mutates global state without explicit confirmation.
- Public artifacts contain no private source, secrets, local paths, or machine configuration.
