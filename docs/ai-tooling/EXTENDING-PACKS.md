# Extending AI content packs

A pack ships two kinds of resource: **rules**, which always apply, and **skills**, which apply to a
named kind of work. Both are instruction-only — metadata plus one Markdown file.

## Where content lives

| Location | Owner | Editable by hand |
|---|---|---|
| `configs/ai/**` | the publisher | yes, this is the canonical source |
| `ai/overrides/**` | the project | yes, this is where customization belongs |
| generated platform files, `ai-tooling.lock.json` | the tool | **no** — regenerated from an accepted plan |

## Adding a resource

1. Create a directory under `configs/ai/rules/` or `configs/ai/skills/`. Its name is the display
   name and uses lowercase words joined by hyphens.
2. Add `rule.json` or `skill.json`:

   ```json
   {
     "version": 1,
     "id": "evk-soft/rules/example",
     "title": "evk-example",
     "description": "One sentence saying when this applies.",
     "instructions": "instructions.md",
     "requiredCapabilities": ["instructions.markdown"],
     "assets": []
   }
   ```

   The `id` is the stable identity used by overrides and by the lock. Choose it once: changing it
   later is a different resource, not a rename.

3. Write `instructions.md`. Plain Markdown, LF line endings, one final newline.
4. Declare the resource in `configs/ai/pack.json`, under `rules` or `skills`.

Every file you place in the directory must be named by the metadata. Anything else fails validation.

## What a resource may not contain

No scripts, hooks, binaries, executable file modes, MCP servers, connectors, or plugin fields. A pack
that could execute would need a trust model this one deliberately does not have. See
[SECURITY.md](SECURITY.md).

## Customizing without forking

Do not edit a published pack in place. Add an override under `ai/overrides/**`:

| Mode | Effect |
|---|---|
| `extend` | your instructions are appended to the published ones |
| `replace` | your instructions are used instead |
| `disable` | the resource is not rendered at all |

An override records `baseDigest` — the digest of the published content it was written against. When
the upstream content changes, that digest no longer matches, and the tool reports that the override
needs review rather than silently applying stale customization to new text.

## Checking your work

```bash
pnpm --filter @evk-soft/ai-tooling exec vitest run tests/integration/core-pack.spec.ts
```

Validation is deterministic and offline: the same source always produces the same result, and no
step contacts the network.
