# Changelog fragments

One file per user-visible change. `node scripts/changelog-new.mjs <slug>` copies `_template.md` to
`<slug>.md`; `node scripts/changelog-assemble.mjs --check` validates every fragment.

`type` is one of `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.

**No Stage 1 phase may add a fragment here.** The Stage 1 phase manifests are closed path lists that
do not include `changelog.d/*` or `CHANGELOG.md`, and the phase-delta verifier rejects every path a
manifest does not name. Adding a fragment during Stage 1 Phase 2-5 would fail that phase's gate. This
directory is dormant until Stage 1 Phase 5 is complete.
