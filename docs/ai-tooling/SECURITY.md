# AI tooling security model

This document states what the AI tooling protects, what it deliberately does not protect, and the
boundaries a reviewer can rely on. It describes delivered behavior only.

## What a pack may contain

A pack is **instruction-only**. It ships metadata and Markdown, and nothing that can execute:

- no scripts, lifecycle hooks, or Git hooks
- no binaries, native helpers, or executable file modes
- no MCP servers, connectors, or browser capabilities
- no plugin fields, and no dependencies of any kind

Every file present in a resource directory must be declared in that resource's metadata. An
undeclared file is a validation failure, not a warning: shipping a file nobody declared means
shipping a file nobody reviewed.

## Trust boundaries

**Source content is untrusted input.** Pack metadata is parsed with a strict I-JSON parser before any
schema validation. That parser rejects a byte-order mark, comments, trailing commas, duplicate keys
after escape decoding, lone surrogates, and numbers that do not round-trip through IEEE-754. A
document that is merely "close enough to JSON" never reaches the validator.

**Schema validation is offline.** All schemas are registered by identifier before any root is
compiled, and no dynamic loader is configured. An unresolved reference fails locally. Validation
never performs a network request, so it cannot be influenced by what a remote host returns today.

**Diagnostics do not echo input.** A finding carries a location and a closed reason code. It never
carries source bytes, tokens, credentials, or absolute filesystem paths. Terminal output is escaped
so that content from a scanned file cannot emit control sequences, repaint the screen, or reorder
text through bidirectional overrides.

**Paths are validated lexically, before any filesystem access.** Override directories must be strict
descendants of `ai/overrides`. Absolute paths, `.` and `..` components, backslashes, drive letters,
and UNC prefixes are rejected by pattern, not by a runtime check that could be bypassed.

**Generated output is tool-owned.** Files the tool generates, and the repository lock, are produced
from an accepted plan and recorded with their digests. They must not be hand-edited. User
customization belongs under `ai/overrides/**`.

## What this does not protect

Stage 1 protects **integrity and containment**. It does not broaden permissions and makes no
confidentiality claim against a principal who can already read the checkout. Anyone able to read the
repository can read its packs, its configuration, and its generated output.

Remote acquisition, caching, adoption of pre-existing files, hook installation, plugin installation,
and preview activation are not implemented. They are outside the delivered scope, not merely
disabled.

## Reporting

Report a suspected vulnerability through the repository's private security contact rather than a
public issue.
