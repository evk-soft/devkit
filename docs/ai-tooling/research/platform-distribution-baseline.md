# Platform Distribution Baseline

Status: evidence input for adapter plans
Verified: 2026-08-02

## Purpose

This document records the platform facts that shaped the umbrella design. It is not a substitute for
refreshing official documentation immediately before implementing or publishing an adapter.

The shared rule is: canonical EVK metadata remains JSON, instruction content remains Markdown, and
each adapter renders the platform's documented format. Similar-looking directories do not imply
identical installation, precedence, hooks, permissions, or update behavior.

## OpenAI and Codex

OpenAI plugins are installable bundles that can include skills, connectors, MCP servers, hooks, and
other declared capabilities. ChatGPT and Codex share a universal plugin directory on supported
surfaces. Codex CLI exposes a plugin browser, while plugin availability differs across Codex and
ChatGPT surfaces.

Project guidance and plugin distribution are separate adapter targets. Codex project guidance uses
`AGENTS.md` and skills; `.codex/rules` is not a general repository-guidance destination.

Project-discovery evidence, verified 2026-08-02:

| Stage 1 target | Official source | Short source excerpt |
|---|---|---|
| Root `AGENTS.md` | https://learn.chatgpt.com/docs/agent-configuration/agents-md | “In your repository root, add an `AGENTS.md`” |
| Root shadow check | https://learn.chatgpt.com/docs/agent-configuration/agents-md | “it checks for `AGENTS.override.md`, then `AGENTS.md`” |
| `.agents/skills/<skill-name>/SKILL.md` | https://learn.chatgpt.com/docs/build-skills | “For repositories, Codex scans `.agents/skills`”; “A skill is a directory with a `SKILL.md` file” |

The adapter chooses the documented repository-root variants. Codex discovers both surfaces natively;
no import statement or user-global configuration is required. Because the documented same-directory
precedence checks `AGENTS.override.md` first, Stage 1 clean init treats a pre-existing root override
as a blocking shadow rather than generating an ignored root `AGENTS.md`.

Official sources:

- https://learn.chatgpt.com/docs/plugins
- https://learn.chatgpt.com/docs/agent-configuration/agents-md
- https://learn.chatgpt.com/docs/build-skills
- https://developers.openai.com/plugins/build/plugins
- https://developers.openai.com/plugins/concepts/skills

## Claude Code

Claude Code distinguishes standalone project configuration from plugins. Plugins can package skills,
agents, hooks, MCP servers, Language Server Protocol (LSP) servers, background monitors, executables,
and limited default settings. Plugin skills are namespaced, which differs from project-local skill
naming and precedence.

The adapter must treat project output and plugin output as separate capabilities. Executable
components require explicit trust and testing.

Project-discovery evidence, verified 2026-08-02:

| Stage 1 target | Official source | Short source excerpt |
|---|---|---|
| Root `CLAUDE.md` | https://code.claude.com/docs/en/memory | “A project CLAUDE.md can be stored in either `./CLAUDE.md` or `./.claude/CLAUDE.md`.” |
| `.claude/rules/**/*.md` | https://code.claude.com/docs/en/memory | “Place markdown files in your project’s `.claude/rules/` directory”; “All `.md` files are discovered recursively” |
| `.claude/skills/<skill-name>/SKILL.md` | https://code.claude.com/docs/en/skills | “Project skills load from `.claude/skills/`”; “Each skill is a directory with `SKILL.md` as the entrypoint” |

The adapter deliberately chooses the documented root `CLAUDE.md` variant and the native project
rules and project skills directories. Claude Code discovers these surfaces without a generated
import statement or user-global change. Because `.claude/CLAUDE.md` is a documented alternative to
the chosen root entry, Stage 1 clean init treats its pre-existence as a blocking alternative rather
than silently creating a second project instruction entry.

Official sources:

- https://code.claude.com/docs/en/plugins
- https://code.claude.com/docs/en/plugins-reference
- https://code.claude.com/docs/en/plugin-marketplaces
- https://code.claude.com/docs/en/memory
- https://code.claude.com/docs/en/skills

## Gemini CLI

Gemini CLI extensions use `gemini-extension.json` and may provide MCP servers, custom commands,
context through `GEMINI.md`, Agent Skills, settings, and other documented extension features. Gemini
CLI also exposes separate project-context and skill surfaces.

The adapter must not assume that a Gemini extension and a Gemini project configuration have the same
ownership or installation lifecycle.

Official sources:

- https://geminicli.com/docs/extensions/writing-extensions/
- https://geminicli.com/docs/extensions/reference/
- https://geminicli.com/docs/cli/gemini-md/

## Cursor

Cursor plugins can bundle MCP servers, skills, subagents, rules, and hooks and are distributed through
Cursor marketplace mechanisms. Project rules and plugin bundles remain separate outputs.

The implementation must refresh Cursor's exact manifest, project, team, and installation contracts
before generating a bundle; the umbrella design does not invent fields that are absent from current
official documentation.

Official sources:

- https://cursor.com/blog/marketplace
- https://cursor.com/changelog/customize
- https://docs.cursor.com/context/rules
- https://docs.cursor.com/context/model-context-protocol

## Antigravity

Antigravity plugins are namespaced bundles with a `plugin.json` marker and optional skills, rules,
MCP configuration, and hooks. Its documented plugin layout differs from OpenAI, Claude Code, Gemini,
and Cursor layouts even when the conceptual components overlap.

Official sources:

- https://www.antigravity.google/docs/plugins
- https://www.antigravity.google/docs/rules-workflows
- https://www.antigravity.google/docs/overview

## Design implications

1. One canonical resource is composed before platform rendering.
2. Every adapter declares a capability matrix and fails when a required capability is unsupported.
3. Project configuration and distributable plugin artifacts use separate adapters.
4. Plugin recommendation does not imply that an official unattended installation command exists.
5. Installation adapters declare `detect`, `recommend`, `open-ui`, `emit-command`, `install`, and
   `uninstall` separately.
6. Hooks, executables, connectors, MCP servers, and browser capabilities cross a stronger trust
   boundary than instruction-only skills.
7. Immediately before adapter implementation and again before release, capture a fresh dated
   official-source fixture with exact paths, case, extensions, alternatives, shadowing precedence,
   and import requirements.
