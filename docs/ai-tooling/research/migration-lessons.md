# Migration Lessons from the Existing Prototype

Status: sanitized behavioral research; not a source-code inventory
Date: 2026-08-01

## Scope

An existing private prototype demonstrated that generated project instructions can reduce platform
drift. The source repository is private and marked `UNLICENSED`, so this public document retains only
neutral behavioral lessons. It contains no source archive, private commit identifiers, internal
package names, credentials, infrastructure paths, or permission to copy implementation bytes.

## Proven useful ideas

- Keep canonical rule and skill sources separate from generated platform outputs.
- Provide a check-only mode that detects missing, modified, stale, and orphaned outputs.
- Validate skill metadata before generation.
- Make output generation deterministic.
- Refuse release packaging when generated outputs drift.
- Test the generator with adversarial fixtures rather than relying only on a successful real-tree
  run.
- Treat local settings, permissions, credentials, and agent memory as non-portable.

## Problems that must not be reproduced

- A large repository-specific manifest is not a reusable public pack.
- Directly copying platform directories creates multiple sources of truth.
- Folder names such as `common` or `skills` do not prove that content is portable.
- A drift check does not prove licensing, confidentiality, secret safety, or semantic correctness.
- Handwritten platform-native agents and commands can diverge even when their names match.
- A path-only export allowlist is insufficient when included documents expose private architecture or
  operational details.
- Directly editable generated files make update intent ambiguous.

## Clean implementation rule

The public implementation starts from the approved contracts and public platform documentation. It
does not copy the prototype's generator, exporter, manifest, rules, skills, hooks, settings, tests, or
documentation bytes without a separate explicit rights decision.

## Candidate behavior families

The first content review may evaluate neutral candidates such as:

- evidence-based grounding;
- search before create;
- implementation planning;
- verification before completion;
- fresh-session handoff;
- plan audit;
- security and maintainability audit.

Every candidate must be rewritten, assigned an `evk-` name and `evk-soft/...` identifier, checked for
hidden project assumptions, and accepted through its own content review before publication.

Detailed future rule families, task-triggered skills, operational workflows, provider packs, and
portability gates are retained in the
[Reusable AI Content Candidate Roadmap](./reusable-content-candidates.md). That roadmap is research
input and does not expand the current Stage 1 proposal.
