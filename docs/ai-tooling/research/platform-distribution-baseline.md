# Platform Distribution Baseline

Status: evidence input for adapter plans
Verified: 2026-08-01

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

Official sources:

- https://learn.chatgpt.com/docs/plugins
- https://developers.openai.com/plugins/build/plugins
- https://developers.openai.com/plugins/concepts/skills

## Claude Code

Claude Code distinguishes standalone project configuration from plugins. Plugins can package skills,
agents, hooks, MCP servers, Language Server Protocol (LSP) servers, background monitors, executables,
and limited default settings. Plugin skills are namespaced, which differs from project-local skill
naming and precedence.

The adapter must treat project output and plugin output as separate capabilities. Executable
components require explicit trust and testing.

Official sources:

- https://code.claude.com/docs/en/plugins
- https://code.claude.com/docs/en/plugins-reference
- https://code.claude.com/docs/en/plugin-marketplaces

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
7. Adapter implementation and release require fresh official-source fixtures.
