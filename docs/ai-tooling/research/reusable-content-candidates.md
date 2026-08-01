# Reusable AI Content Candidate Roadmap

Status: roadmap research; outside the Stage 1 proposal
Date: 2026-08-01

## Purpose

This document preserves public, product-neutral requirements for future EVK rules, skills, and
optional behavior packs. It is an input to later content design, not a source pack, implementation
plan, release promise, or authorization to expand Stage 1.

The current Stage 1 proposal remains limited to the independently reviewed `evk-grounding` rule and
`evk-plan` skill defined by the draft Stage 1 design. Every other item below is only a candidate.
Promotion into
`configs/ai/**` requires its own content design, stable `evk-soft/...` identifier, `evk-` public name,
tests, security review, public-content review, and owner approval.

This roadmap contains no private source identifiers, implementation bytes, private package names,
infrastructure details, credentials, machine paths, or permission to derive from an unlicensed
source.

## Rules, skills, and packs load differently

A rule is durable guidance intended to influence a declared scope such as a repository, directory,
or file family. Evidence requirements and generated-file safety are examples.

A skill is a task-triggered workflow loaded only when its trigger matches the current request.
Auditing a plan, preparing a handoff, or running configured project checks are examples.

A pack is a versioned collection of rules, skills, and metadata with one ownership and trust
boundary. A pack may be public, product-owned, organization-private, or project-local.

The canonical metadata must declare the resource kind, scope or trigger, required capabilities, and
dependencies. An adapter must not silently make a task-triggered skill always active, narrow an
always-on rule, or load unrelated references. An unrepresentable loading contract is a capability
error.

## Ownership classification before authoring

Every candidate receives exactly one primary classification before extraction or clean-room
rewriting:

1. `universal`: reusable across unrelated repositories and free of consumer assumptions;
2. `product`: owned by a separately versioned product or organization pack;
3. `project`: owned by one consumer repository and distributed only with that project;
4. `personal`: owned by a person or machine and excluded from shared project policy by default.

A directory name such as `common`, `rules`, or `skills` is not evidence that content is universal.
Classification uses actual commands, values, paths, providers, domain terms, permissions, and
architecture assumptions. Ambiguous content is not published until ownership is explicit.

The generalized behavior is specified and tested before canonical content is created. Tests must
prove the reusable contract rather than reproduce one source repository's layout.

## Candidate reusable rule families

### Evidence and truth

Reusable behavior:

- distinguish verified facts, inferences, hypotheses, and unknowns;
- ground nontrivial claims in current code, contracts, command output, or current official sources;
- state freshness and scope of evidence;
- fail closed when required evidence is missing;
- prevent a mechanical green check from being presented as semantic approval.

Consumer inputs:

- source-of-truth hierarchy;
- authoritative contract and inventory paths;
- approved external sources;
- evidence freshness and approval policy.

Stage 1 starts this family with `evk-grounding`; later additions must extend or replace that one
owner rather than create competing grounding rules.

### Planning and approval gates

Reusable behavior:

- separate research, design, planning, implementation, verification, and reflection;
- block implementation until required design and owner gates pass;
- keep phase state, acceptance evidence, and commit boundaries explicit;
- preserve unresolved decisions instead of inventing answers;
- distinguish a documentation-only design phase from implementation authorization.

Consumer inputs:

- specification and plan locations;
- approval roles and allowed status transitions;
- phase and commit policy;
- optional issue-tracker integration.

Stage 1 starts this family with `evk-plan`. Future planning behavior must preserve its stable owner or
use an explicit migration.

The `evk-plan` content contract converts an approved goal and design into a phased, testable plan
that names exact files, interfaces, commands, gates, and commit boundaries. Plan locations and
proving commands come from validated consumer configuration. The skill must not assume one issue
tracker, hosting provider, branch model, or package command.

### Reuse and canonical ownership

Reusable behavior:

- search by value and structure before creating an implementation;
- identify one canonical owner for shared data or behavior;
- derive platform and project views from that owner;
- detect duplicate copies and ambiguous ownership;
- require an extraction decision when duplication crosses a configured threshold.

Consumer inputs:

- package or component inventory;
- shared-library ownership map;
- duplication threshold;
- guarded paths, languages, and generated roots;
- optional structured-search or code-intelligence capabilities.

No package scope, shared-kernel name, monorepository layout, or search service is a universal default.

### Generated-output integrity

Reusable behavior:

- declare canonical sources and generated targets;
- prohibit direct edits to generated output;
- detect missing, modified, stale, conflicting, and orphaned files;
- expose source provenance and generator version;
- require deterministic output for identical locked inputs;
- fail when an adapter cannot represent required behavior.

Consumer inputs:

- enabled adapters and target paths;
- committed-versus-local output policy;
- encoding and line-ending policy;
- generated-file ownership and verification commands.

The engine enforces ownership and recovery. Content rules may explain the workflow but cannot weaken
engine safety invariants.

### Git and worktree safety

Reusable behavior:

- inspect repository and index state before editing, staging, committing, rebasing, or deleting;
- preserve unrelated changes and host-owned worktrees;
- require explicit authority for destructive recovery;
- align commits with reviewed phases;
- verify the exact staged bytes before committing.

Consumer inputs:

- branch and worktree model;
- hosting provider;
- commit convention;
- pull-request or merge-request workflow;
- protected branches and release policy.

Provider names, branch names, issue prefixes, and release commands belong in provider or project
layers.

### Security and local configuration

Reusable behavior:

- keep credentials, authentication, machine paths, and local permissions out of public packs;
- treat hooks, scripts, MCP servers, connectors, and commands as executable trust boundaries;
- scan public artifacts for secrets, private identifiers, and accidental local state;
- require explicit trust and capability consent before activation;
- keep public, private-organization, project, personal, and machine-local ownership distinct.

Consumer inputs:

- secret and private-name scanning policy;
- allowed capability and command policy;
- managed local configuration;
- threat-model inputs and public-release restrictions.

## Future task-triggered skill candidates

These candidates do not expand Stage 1. Their final names and identifiers are allocated only during
their approved content-design stage.

### Plan audit

Purpose: compare a plan with requirements, current code, risks, and executable evidence without
mutating the repository.

Required generalization:

- accept a configurable evidence hierarchy;
- distinguish structural completeness from semantic readiness;
- produce a stable `READY`, `NOT READY`, or `PARTIAL` verdict;
- report the smallest repair sequence without silently starting it.

### Verification before completion

Purpose: require fresh proving evidence before a completion, correctness, or readiness claim.

Required generalization:

- map each claim type to configured commands or artifacts;
- reject skipped tests, zero-task execution, empty discovery, and other vacuous success;
- avoid hardcoded lint, build, typecheck, or test scripts;
- keep infrastructure reachability separate from application approval.

### Fresh-session handoff

Purpose: create self-contained continuation context for an agent that has no prior conversation.

Required generalization:

- configure conversation and artifact languages independently;
- discover current repository state without assuming a Git provider;
- preserve decisions, unknowns, exact gates, and verification evidence;
- avoid session-only paths and stale instructions in durable documentation.

### Search before create

Purpose: find existing behavior, values, structures, and owners before creating code or content.

Required generalization:

- support text, structural, inventory, and semantic search when available;
- accept guarded paths and ownership catalogs from the consumer;
- work without `@evk-soft/code-intelligence` and use it only as an optional accelerator;
- report what was searched and why an existing owner does or does not fit.

### Security and maintainability audit

Purpose: review changed artifacts for security boundaries, unsafe execution, secrets, duplicated
security logic, and maintainability risks.

Required generalization:

- separate universal checks from language, framework, and deployment adapters;
- accept consumer threat-model and trusted-boundary inputs;
- distinguish source review, isolated tests, integration evidence, and production proof;
- never infer production security from lint or unit tests alone.

## Configurable operational skill candidates

Future operational candidates include:

- lint;
- typecheck;
- test;
- build;
- affected-package or affected-application detection;
- circular-dependency checks;
- commit preparation;
- user-interface review;
- framework-specific performance review.

They become reusable only after a command and workspace-selection contract exists. Required inputs
include the package manager, runtime, configured command, working directory, workspace selector,
environment profile, timeout policy, expected discovery count, and proof of meaningful execution.

An unsupported command is an actionable configuration error. A zero exit code with zero scheduled
tasks, zero discovered tests, a hidden skip, or an ignored failure is not success unless that empty
result is explicitly part of the configured contract.

## Provider-specific candidate packs

Keep these behaviors in optional provider or product packs rather than the universal core:

- GitHub pull-request workflows;
- GitLab merge-request workflows;
- issue-tracker workflows;
- deployment-provider workflows;
- database migration frameworks;
- runtime-specific package audits;
- release and hotfix branch models.

A consumer may install multiple provider packs. Precedence, capability overlap, and conflicts must
be explicit. Installing a content pack does not grant executable trust to its hooks or scripts.

## Project-owned and personal content

Project-owned content remains in the consumer repository or its private project pack:

- domain-specific endpoint, identifier, and schema audits;
- application-specific debugging or capture procedures;
- private environment and infrastructure access;
- exact component ownership and architecture boundaries;
- database schema and migration policy;
- local dashboards, telemetry catalogs, and deployment commands;
- project-specific branches, issue identifiers, and release commands.

Personal and machine-local content remains outside the public EVK pack:

- preferred conversation language and personal response defaults;
- model and reasoning preferences;
- credentials and authentication;
- absolute paths and command approvals;
- local hooks and experimental external connections;
- user-specific memory.

Private profile packs may model selected preferences later, but they must never become public or
project-wide policy by accident.

## Candidate consumer configuration inputs

Future content designs may require:

- enabled rule and skill packs;
- platform adapters and output targets;
- command names and meaningful-execution proofs for lint, typecheck, test, build, affected, and
  circular checks;
- workspace package and application patterns;
- documentation, specification, plan, and inventory paths;
- Git provider, branch model, commit, review, and release policy;
- issue tracker and identifier format;
- artifact and conversation language defaults;
- generated-file commit or local-install policy;
- hook, external-tool, and public-release security policy;
- optional code-intelligence capability discovery.

Required inputs fail with actionable diagnostics when absent. Defaults must be safe and must not
encode one repository's conventions.

## Portability acceptance gate

A candidate becomes canonical reusable content only when all applicable checks pass:

1. ownership classification is explicit;
2. no private repository names, package scopes, environments, absolute paths, branch names, issue
   identifiers, credentials, or local permissions are embedded;
3. platform-neutral meaning has one canonical owner;
4. every platform-specific difference belongs to an adapter or optional pack;
5. the trigger and loading scope are precise and do not pull unrelated context;
6. required consumer inputs have a validated schema and actionable missing-input errors;
7. detailed variants live in referenced resources rather than an always-loaded entry file;
8. generation is deterministic and a second run produces no change;
9. stale, missing, manually modified, conflicting, and orphaned outputs fail validation;
10. unsupported required capabilities fail explicitly;
11. publication scans find no secrets, machine settings, private identifiers, or undeclared assets;
12. installation and invocation succeed in a clean temporary consumer on each supported platform;
13. pinned upgrades and removal leave no unowned or unexplained files;
14. negative tests prove that skipped, empty, unsupported, and falsely green execution is rejected;
15. independent evaluation shows the behavior works without hidden conversation history; and
16. generalized-contract tests exist before the candidate enters the canonical pack.

Passing this gate makes a candidate eligible for content review. It does not itself approve a name,
stable identifier, release stage, executable capability, or publication.

## Relationship to delivery stages

- The current Stage 1 proposal contains only `evk-grounding`, `evk-plan`, the safe engine, Codex and
  Claude project adapters, and devkit self-hosting defined by its draft child design. It authorizes
  no implementation until owner approval and a separately approved implementation plan exist.
- Later delivery stages may select candidates from this roadmap only through their own brainstorming,
  child specification, security review, tests, and owner gate.
- Stage 2 through Stage 5 scope remains governed by the umbrella design; this roadmap cannot alter
  their gates or authorize implementation.
